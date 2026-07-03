import { Symbol as PPLSymbol } from './ast.js';
import { Closure } from './closure.js';
import { PRIMITIVES, is_primitive } from './primitives.js';

const SPECIAL_FORMS = new Set(['let', 'if', 'fn']);

// Mete en la pila de control (C) las instrucciones para evaluar secuencialmente
// un bloque de codigo. Usar unshift seria mas directo, pero haria que cada push
// de cuerpo pague costo O(n).
export function _push_body(C, body, env, addr) {
    const seq = [];

    for (let n = 0; n < body.length - 1; n++) {
        seq.push(['ev', body[n], env, [...addr, 'body', n]]);
        seq.push(['discard']);
    }

    if (body.length > 0) {
        seq.push(['ev', body[body.length - 1], env, [...addr, 'body', body.length - 1]]);
    }

    for (let i = seq.length - 1; i >= 0; i--) {
        C.push(seq[i]);
    }
}
// Traduce una referencia de función nativa a su nombre en string para poder serializarla en el trace JSON.
function _primitive_name(fn) {
    for (const [name, primitive] of Object.entries(PRIMITIVES)) {
        if (primitive === fn) {
            return name;
        }
    }

    return fn.name || '<funcion>';
}

// Genera un snapshot JSON plano e inmutable de cualquier valor de la máquina, rompiendo referencias circulares mediante un WeakMap.
function _clone_for_trace(value, seen = new WeakMap()) {
    // Esta copia esta pensada para inspeccion, no para re-ejecutar el programa.
    // Convierte piezas no serializables (funciones, closures, simbolos) en datos.
    if (value instanceof PPLSymbol) {
        return { type: 'symbol', name: value.name };
    }

    if (value instanceof Closure) {
        if (seen.has(value)) {
            return seen.get(value);
        }

        // Las closures pueden capturar entornos que a su vez apuntan a closures.
        // WeakMap corta ciclos y mantiene cada snapshot estable para la UI.
        const clone = { type: 'closure', params: [], body: [], env: {} };
        seen.set(value, clone);
        clone.params = _clone_for_trace(value.params, seen);
        clone.body = _clone_for_trace(value.body, seen);
        clone.env = _clone_for_trace(value.env, seen);
        return clone;
    }

    if (typeof value === 'function') {
        return { type: 'primitive', name: _primitive_name(value) };
    }

    if (Array.isArray(value)) {
        if (seen.has(value)) {
            return seen.get(value);
        }

        const clone = [];
        seen.set(value, clone);
        for (const item of value) {
            clone.push(_clone_for_trace(item, seen));
        }
        return clone;
    }

    if (value && typeof value === 'object') {
        if (seen.has(value)) {
            return seen.get(value);
        }

        const clone = {};
        seen.set(value, clone);
        for (const [key, item] of Object.entries(value)) {
            clone[key] = _clone_for_trace(item, seen);
        }
        return clone;
    }

    return value;
}

// Extrae el entorno de variables (env) activo inspeccionando los metadatos de la próxima instrucción en C.
function _env_from_instruction(instr, fallbackEnv) {
    // El entorno "actual" vive dentro de la continuacion que esta por ejecutarse.
    // Para mostrarlo, miramos el frame superior de C y tomamos su env asociado.
    if (!instr) {
        return fallbackEnv;
    }

    if (instr[0] === 'ev') {
        return instr[2] ?? fallbackEnv;
    }

    if (instr[0] === 'letk') {
        return instr[4] ?? fallbackEnv;
    }

    if (instr[0] === 'ifk') {
        return instr[4] ?? fallbackEnv;
    }

    return fallbackEnv;
}

// Captura un snapshot congelado y clonado del estado actual de la máquina (pilas, entorno e instrucción) y lo añade al historial.
function _record_trace(machine, done = false) {
    const nextInstruction = machine.C[machine.C.length - 1] ?? null;
    const env = _env_from_instruction(nextInstruction, machine.env);

    // El visualizador necesita "fotos" estables de cada instante. No guardamos
    // referencias vivas a C, V o env porque la maquina las sigue mutando en cada
    // paso; congelar la historia asi hace que avanzar y retroceder en la UI sea
    // predecible y honesto con lo que ocurrio.
    machine.traceLog ??= [];
    machine.traceLog.push({
        step: machine.traceLog.length,
        done,
        nextInstruction: _clone_for_trace(nextInstruction),
        C: _clone_for_trace(machine.C),
        V: _clone_for_trace(machine.V),
        env: _clone_for_trace(env)
    });
}

export function resume(machine) {
    const { C, V } = machine;

    while (C.length > 0) {
        if (machine.trace) {
            _record_trace(machine);
        }

        const instr = C.pop();
        const t = instr[0];

        if (t === 'ev') {
            const [_, e, env, addr] = instr;

            // Variables: Symbol('x') y el string "x" se resuelven en env. En
            // cambio "+", "let", "if" y "fn" tienen tratamiento especial.
            if (e instanceof PPLSymbol || (typeof e === 'string' && !is_primitive(e) && !SPECIAL_FORMS.has(e))) {
                const name = e instanceof PPLSymbol ? e.name : e;
                if (name in env) {
                    V.push(env[name]);
                } else {
                    throw new ReferenceError(`Variable no definida: ${name}`);
                }
            }
            else if (typeof e === 'string' && is_primitive(e)) {
                V.push(PRIMITIVES[e]);
            }
            else if (!Array.isArray(e)) {
                V.push(e);
            }
            else {
                const head = e[0];

                if (head === 'let') {
                    // let evalua cada binding de izquierda a derecha. letk queda
                    // esperando en C hasta que el valor aparezca arriba de V.
                    const binds = e[1];
                    const body = e.slice(2);
                    if (binds && binds.length > 0) {
                        C.push(['letk', binds, 0, body, env, addr]);
                        C.push(['ev', binds[1], env, [...addr, 'let', 0]]);
                    } else {
                        _push_body(C, body, env, addr);
                    }
                }
                else if (head === 'if') {
                    // ifk pospone la decision de rama hasta que el test ya este
                    // reducido a un booleano en la pila de valores.
                    const [_, test, thenBranch, elseBranch] = e;
                    C.push(['ifk', thenBranch, elseBranch, env, addr]);
                    C.push(['ev', test, env, [...addr, 'if']]);
                }
                else if (head === 'fn') {
                    // Crear una funcion no ejecuta su cuerpo: captura params,
                    // body y env en una Closure lista para una futura llamada.
                    const [_, params, ...body] = e;
                    V.push(new Closure(params, body, env));
                }
                else {
                    // Aplicacion: primero se evalua el operador, luego sus args.
                    // callk sabe cuantos argumentos debe recoger desde V.
                    const args = e.slice(1);
                    C.push(['callk', args.length, addr]);

                    for (let i = args.length - 1; i >= 0; i--) {
                        C.push(['ev', args[i], env, [...addr, 'app', i]]);
                    }
                    C.push(['ev', head, env, [...addr, 'app_head']]);
                }
            }
        }
        else if (t === 'letk') {
            const [_, binds, i, body, env, addr] = instr;
            const nextEnv = { ...env };

            // El valor del binding recien evaluado esta arriba de V. Lo movemos
            // al entorno extendido antes de continuar con el siguiente binding.
            const varName = binds[2 * i] instanceof PPLSymbol ? binds[2 * i].name : binds[2 * i];
            nextEnv[varName] = V.pop();

            if (2 * (i + 1) < binds.length) {
                C.push(['letk', binds, i + 1, body, nextEnv, addr]);
                C.push(['ev', binds[2 * (i + 1) + 1], nextEnv, [...addr, 'let', 2 * (i + 1)]]);
            } else {
                _push_body(C, body, nextEnv, addr);
            }
        }
        else if (t === 'callk') {
            const [_, n, addr] = instr;
            const args = [];

            // Como V es LIFO, los argumentos salen al reves de como se escriben.
            // Los invertimos para que la funcion reciba el orden fuente original.
            for (let i = 0; i < n; i++) {
                args.push(V.pop());
            }
            args.reverse();

            const f = V.pop();

            if (f instanceof Closure) {
                // Llamada a funcion del PPL: extendemos el env capturado por la
                // closure con los parametros y empujamos su cuerpo a C.
                const newEnv = { ...f.env };
                for (let i = 0; i < f.params.length; i++) {
                    const paramName = f.params[i] instanceof PPLSymbol ? f.params[i].name : f.params[i];
                    newEnv[paramName] = args[i];
                }
                _push_body(C, f.body, newEnv, addr);
            } else if (typeof f === 'function') {
                // Llamada a primitiva JS: produce un valor inmediatamente.
                V.push(f(...args));
            } else {
                throw new TypeError('El elemento no es una funcion ejecutable.');
            }
        }
        else if (t === 'ifk') {
            const [_, thenBranch, elseBranch, env, addr] = instr;
            const conditionResult = V.pop();

            // Solo empujamos la rama elegida. La otra nunca entra a la pila C.
            if (conditionResult) {
                C.push(['ev', thenBranch, env, [...addr, 'then']]);
            } else {
                C.push(['ev', elseBranch, env, [...addr, 'else']]);
            }
        }
        else if (t === 'discard') {
            // Los bloques pueden tener expresiones intermedias. discard conserva
            // solo el valor final del cuerpo, como hacen muchos lenguajes.
            V.pop();
        }
    }

    if (machine.trace) {
        _record_trace(machine, true);
    }

    return V[V.length - 1];
}

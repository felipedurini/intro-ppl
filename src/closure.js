export class Closure {
    params;
    body;
    env;

    constructor(params, body, env) {
        // Una closure guarda el codigo de la funcion junto con el entorno donde
        // nacio. Asi, cuando se llama mas tarde, todavia "recuerda" sus bindings.
        this.params = params;
        this.body = body;
        this.env = env;

        // Sellamos la forma del objeto: el evaluador puede leer y actualizar
        // referencias externas, pero la closure no deberia ganar campos sorpresa.
        Object.seal(this);
    }
}

export default Closure;

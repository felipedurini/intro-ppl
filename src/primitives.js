export const PRIMITIVES = {
    // Las primitivas se empujan a V como funciones JS reales. callk no necesita
    // saber si "+" vino del lenguaje anfitrion o de una closure del PPL.
    '+': (a, b) => a + b,
    '-': (a, b) => a - b,
    '*': (a, b) => a * b,
    '/': (a, b) => a / b,
    '==': (a, b) => a === b,
    '<': (a, b) => a < b,
    '>': (a, b) => a > b,
    'print': (x) => {
        console.log(x);
        return x;
    }
};

export function is_primitive(e) {
    // hasOwnProperty evita falsos positivos con nombres heredados del prototipo.
    return Object.prototype.hasOwnProperty.call(PRIMITIVES, e);
}

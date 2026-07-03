export class Symbol {
    constructor(name) {
        // Un simbolo marca "esto es una variable del PPL", no un string literal.
        // Esa distincion evita confundir nombres de variables con primitivas como "+".
        this.name = String(name);
        Object.freeze(this);
    }

    toString() {
        return this.name;
    }
}

// Atajo pequeno para que los ejemplos se lean como AST y no como ceremonia.
export const sym = (name) => new Symbol(name);

export default Symbol;

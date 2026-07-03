import { sym } from './ast.js';

// Reutilizar objetos Symbol hace que los AST se lean como un programa pequeno:
// x representa una variable del PPL, mientras que "x" podria ser un string.
const x = sym('x');
const y = sym('y');
const z = sym('z');
const temp = sym('temp');
const score = sym('score');
const limit = sym('limit');
const geometric = sym('geometric');
const self = sym('self');
const n = sym('n');

export const nestedLets = {
    id: 'nestedLets',
    name: 'Let anidado',
    description: 'Declara valores intermedios, descarta una expresion de cuerpo y devuelve el resultado final.',
    ast: [
        // Resultado esperado: 17. La primera expresion del cuerpo calcula 8 y se
        // descarta; la segunda usa un let interno y queda como valor final.
        'let',
        [
            x, 4,
            y, ['+', x, 3]
        ],
        ['+', y, 1],
        [
            'let',
            [
                z, ['*', y, 2],
                temp, ['-', z, x]
            ],
            ['+', temp, y]
        ]
    ]
};

export const conditional = {
    id: 'conditional',
    name: 'Condicional if',
    description: 'Evalua una condicion booleana y toma solo la rama correspondiente.',
    ast: [
        // Resultado esperado: 108, porque score > limit toma la rama then.
        'let',
        [
            score, 8,
            limit, 5
        ],
        [
            'if',
            ['>', score, limit],
            ['+', score, 100],
            ['-', score, 100]
        ]
    ]
};

export const recursiveGeometric = {
    id: 'recursiveGeometric',
    name: 'Funcion recursiva',
    description: 'Usa una funcion fn que se recibe a si misma para simular una cuenta geometrica determinista.',
    ast: [
        // Resultado esperado: 4. La funcion se pasa a si misma como argumento
        // para habilitar recursion sin agregar un letrec al lenguaje.
        'let',
        [
            geometric,
            [
                'fn',
                [self, n],
                [
                    'if',
                    ['==', n, 0],
                    0,
                    ['+', 1, [self, self, ['-', n, 1]]]
                ]
            ]
        ],
        [geometric, geometric, 4]
    ]
};

export const examples = {
    [nestedLets.id]: nestedLets,
    [conditional.id]: conditional,
    [recursiveGeometric.id]: recursiveGeometric
};

export default examples;

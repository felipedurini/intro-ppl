# Visualizador PPL con pilas C y V

Trabajo final de la materia Introducción a lenguajes probabilísticos, dictadas por el profesor Javier Burroni en la Facultad de Ciencias Exactas, Universidad de Buenos Aires.

## De qué trata

Intérprete basado en una máquina de estados abstracta para un Lenguaje de Programación Probabilístico (PPL) minimalista, implementado en JavaScript nativo (Node.js/ES Modules). El motor funciona mediante una arquitectura de doble pila explícita, donde la pila de Control ($C$) maneja el flujo de ejecución operando como continuaciones, y la pila de Valores ($V$) almacena los resultados temporales. Al desarmar las estructuras del AST (como `let`, `if` y `fn`) en instrucciones de control internas (`letk`, `ifk`, `callk`), el intérprete no depende del *call stack* de JavaScript, garantizando un control total del flujo. Además, el sistema incluye un mecanismo de *tracing* no destructivo que clona y congela el estado de las pilas y los entornos variables en cada iteración del bucle principal, generando el historial de datos exacto que consume la interfaz web interactiva para visualizar la ejecución paso a paso.

## Instrucciones de Instalación

```bash
git clone <url>
cd ppl
```

Reemplaza `<url>` por la URL que aparece en el boton verde **Code** del repositorio en GitHub.

Necesitas tener instalado Node.js. Este proyecto no usa dependencias externas ni herramientas de compilacion, asi que no hace falta ejecutar `npm install`.

Para comprobar que Node.js esta disponible:

```bash
node --version
```

## Cómo Ejecutar el Visualizador

Desde la carpeta del proyecto, ejecuta:

```bash
node server.js
```

Luego abre esta direccion en el navegador:

```text
http://localhost:4173
```

Tambien puedes usar npm:

```bash
npm start
```

En Windows, si PowerShell bloquea `npm start` por politicas de ejecucion, usa:

```bash
npm.cmd start
```

Si ya usas Visual Studio Code, otra opcion es abrir `index.html` con la extension Live Server.

## Estructura del Proyecto y Contexto

El interprete vive en `src/` y ejecuta programas escritos como ASTs simples, representados con arreglos anidados de JavaScript.

La maquina abstracta usa dos pilas principales:

- `C`: pila de control. Guarda instrucciones internas como `ev`, `letk`, `callk`, `ifk` y `discard`.
- `V`: pila de valores. Guarda resultados intermedios, closures y primitivas listas para aplicar.

El flujo general es: la pila `C` decide que debe evaluarse, la pila `V` conserva los resultados, y las continuaciones internas (`letk`, `callk`, `ifk`) reconstruyen el siguiente paso de ejecucion. Esto hace visible una semantica operacional que normalmente queda escondida dentro del stack del lenguaje anfitrion.

Archivos principales:

- `src/ast.js`: define simbolos de variables para el AST.
- `src/machine.js`: define la clase `M`, con las pilas `C` y `V`.
- `src/evaluator.js`: contiene `_push_body` y `resume(machine)`, el nucleo paso a paso del interprete.
- `src/closure.js`: representa funciones `fn` junto con su entorno.
- `src/primitives.js`: define primitivas como `+`, `-`, `*`, `/`, `==`, `<`, `>` y `print`.
- `src/examples.js`: incluye programas de ejemplo para probar y visualizar.
- `index.html`: visualizador web estatico para recorrer el historial de ejecucion.

Elegimos JavaScript con ES Modules porque permite expresar el lenguaje minimalista con estructuras de datos directas, como arreglos anidados y closures, sin agregar una capa pesada de tipos o compilacion. Eso mantiene el interprete chico, inspeccionable y facil de usar como herramienta educativa.

## Nota para el profe:

Traduje personalmente el código del notebook a JavaScript. Después, para poder visualizarlo y entenderlo de mejor manera, se me ocurrió que lo mejor era crear una web simple. Para esto me ayudé con agentes de IA, que armaron el archivo index.html, el servidor y agregaron las funciones de rastreo (tracing) en evaluator.js, las cuales me encargué meticulosamente de revisar.

Estas funciones no le agregan ninguna complejidad al lenguaje ni alteran la lógica formal del intérprete; simplemente resuelven la serialización de los datos para que la interfaz web pueda capturar los estados de las pilas paso a paso y renderizarlos.


# Visualizador PPL con pilas C y V

Trabajo final de la materia Introducción a lenguajes probabilísticos, dictada por el profesor Javier Burroni en la Facultad de Ciencias Exactas, Universidad de Buenos Aires.

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
Abrir el navegador: Una vez corriendo, ingresá a la URL que te indica la consola (por defecto es http://localhost:4173).

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

## Guía de Uso del Visualizador Interactivo

Para facilitar el análisis de la semántica operacional de la máquina de estados sin meter herramientas pesadas de empaquetado, incluimos un servidor estático ligero nativo y una interfaz web que lee directamente los módulos de JavaScript.

### Cómo levantar la interfaz web

1. **Iniciar el servidor local:** En la raíz del proyecto, ejecutá el script con Node.js para levantar el servidor de desarrollo:
   ```bash
   node server.js

Cómo usar la interfaz
Selección de programas: En el menú desplegable "Ejemplo", podés elegir cualquiera de los árboles sintácticos (AST) cargados en examples.js (como bloques let anidados, bifurcaciones if o funciones recursivas). El visualizador ejecutará el programa por completo de fondo con la opción { trace: true } y congelará la historia para inspección.

Controles de reproducción:

Iniciar: Reinicia la simulación del ejemplo seleccionado al Paso 0.

Siguiente paso: Avanza un ciclo en el bucle while del evaluador, procesando la instrucción actual.

Paso anterior: Retrocede un ciclo en la historia para analizar qué provocó el cambio de estado en las pilas.

Bloque de Resultado: En la esquina superior derecha, verás el valor final que retorna el programa cuando la ejecución llega a su último paso.

Cómo entender lo que estás viendo en pantalla
La interfaz divide el estado de la máquina en componentes claros que mapean de forma idéntica el estado de la memoria en el motor interno:

1. Panel de Métricas (Estado Actual)
Paso: Indica el ciclo actual del while sobre el total de pasos cronometrados que tomó resolver el programa.

Próxima instrucción: El comando de control de bajo nivel que está en el tope de la pila y se resolverá al presionar "Siguiente paso" (ev, letk, ifk, callk o discard).

Tamaño C y V: La cantidad exacta de elementos apilados en cada estructura en el ciclo actual.

2. Pila de Control C (La columna izquierda)
Representa las continuaciones de ejecución pendientes (análogo al registro EIP / RIP o al puntero de instrucciones).

El componente marcado con el tag top es el elemento que se va a extraer mediante .pop() en el siguiente paso.

Cada bloque te muestra un resumen de una línea del código o comando interno, y abajo un desglose en formato JSON expandible con los metadatos de esa instrucción (como el entorno léxico capturado y la dirección de rastreo addr).

3. Pila de Valores V (La columna derecha)
Almacena los resultados intermedios de los cálculos, los literales evaluados y los contextos funcionales listos para ser consumidos.

Cuando una operación en C requiere parámetros (como una suma o una condición de un if), extraerá mediante .pop() los valores necesarios del tope de esta pila V.

Las funciones nativas de JavaScript se visualizan con la etiqueta <primitive nombre> para facilitar su lectura, y las funciones del lenguaje probabilístico se renderizan como objetos estructurados de tipo closure.

4. Entorno Visible (El panel inferior)
Muestra un snapshot en JSON plano de los bindings actuales en memoria (el diccionario de variables locales env). Muestra exactamente qué nombres de variables están activos en el paso actual y qué valor mutado o clausura tienen asignado dentro de ese ámbito léxico específico.

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


export class M {
    C;
    V;
    env;
    rng;
    logW;
    trace;
    traceLog;

    constructor(C, V = [], env = {}, rng = null, logW = 0.0, options = {}) {
        // Copiamos las estructuras de entrada para que crear una maquina no mute
        // arreglos u objetos que el llamador quiera reutilizar en otra corrida.
        this.C = [...C];
        this.V = [...V];
        this.env = { ...env };
        this.rng = rng;
        this.logW = logW;

        // traceLog es el cuaderno de bitacora del visualizador: un snapshot por
        // iteracion de resume cuando options.trace esta activo.
        this.trace = Boolean(options.trace);
        this.traceLog = Array.isArray(options.traceLog) ? options.traceLog : [];
    }

    fork(rng = null) {
        // Fork clona el estado operativo para algoritmos de inferencia futuros,
        // por ejemplo SMC, sin compartir pilas entre particulas.
        return new M(
            [...this.C],
            [...this.V],
            { ...this.env },
            rng === null ? this.rng : rng,
            this.logW,
            { trace: this.trace }
        );
    }
}

export default M;

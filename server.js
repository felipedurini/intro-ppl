import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import process from 'node:process';

const root = process.cwd();
const port = Number(process.env.PORT ?? 4173);

// Mapa minimo de MIME types. Es suficiente para HTML y ES Modules sin sumar
// dependencias externas ni un bundler.
const contentTypes = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8'
};

function resolvePublicPath(pathname) {
    // Normalizamos la ruta pedida y la obligamos a quedarse dentro del proyecto.
    // Asi el servidor no puede leer archivos fuera de esta carpeta por accidente.
    const requested = pathname === '/' ? '/index.html' : pathname;
    const filePath = resolve(root, `.${decodeURIComponent(requested)}`);
    const rootPrefix = root.endsWith(sep) ? root : `${root}${sep}`;

    if (filePath !== root && !filePath.startsWith(rootPrefix)) {
        return null;
    }

    return filePath;
}

const server = createServer(async (req, res) => {
    const url = new URL(req.url ?? '/', `http://${req.headers.host}`);
    const filePath = resolvePublicPath(url.pathname);

    if (!filePath) {
        res.writeHead(403, { 'content-type': 'text/plain; charset=utf-8' });
        res.end('Acceso denegado');
        return;
    }

    try {
        const body = await readFile(filePath);
        res.writeHead(200, {
            'content-type': contentTypes[extname(filePath)] ?? 'application/octet-stream'
        });
        res.end(body);
    } catch {
        res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
        res.end('Archivo no encontrado');
    }
});

server.listen(port, () => {
    console.log(`Visualizador disponible en http://localhost:${port}`);
});

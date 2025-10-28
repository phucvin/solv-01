import http from 'http';
import fs from 'fs';

import { assert } from './shared01.js';
import { diffList, ssr } from './server01.js';

import { render, initState } from './counter01/app.js';

let server_state = initState('SERVER');
let server_vdom = render(server_state);

async function serveIndex(req, res) {
    try {
        let html = await fs.promises.readFile('./index01.html', 'utf8');
        html = html.split('$$$SSR$$$');
        assert(html.length == 2, html);
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html[0] + ssr(render(server_state)) + html[1]);
    } catch (err) {
        console.error('Error reading index html and injecting SSR:', err);
        res.writeHead(500, { 'Content-Type': 'text/html' });
        res.end('<h1>Internal Error</h1>');
    }
    res.end(``);
}

function serveAction(req, res) {
    let data = '';
    req.on('data', (chunk) => {
        data += chunk;
    });
    req.on('end', () => {
        data = JSON.parse(data);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        const new_vdom = render(server_state, data);
        res.end(JSON.stringify(diffList(server_vdom, new_vdom)));
        server_vdom = new_vdom;
    });
}

const server = http.createServer((req, res) => {
    if (req.url === '/') {
        serveIndex(req, res);
    } else if (req.url === '/action') {
        serveAction(req, res);
    } else {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>Page Not Found</h1>');
    }
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
});

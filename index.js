import http from 'http';
import fs from 'fs';

import { diffList, createRenderContext, ssr } from './server01.js';

import { render, initState } from './counter01/app.js';
import { assert } from 'console';

let solvDb = {};
let solvDbNextCid = 1;

async function serveIndex(req, res) {
    const cid = '_' + solvDbNextCid++;
    solvDb[cid] = { state: initState(cid) };
    solvDb[cid].vdom = render(solvDb[cid].state, null, createRenderContext());
    
    try {
        let html = await fs.promises.readFile('./index01.html', 'utf8');
        html = html.replace('$$$SOLV_SSR$$$', ssr(solvDb[cid].vdom));
        html = html.replace('$$$SOLV_CID$$$', cid);
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
    } catch (err) {
        console.error('Error reading index html and injecting SSR:', err);
        res.writeHead(500, { 'Content-Type': 'text/html' });
        res.end('<h1>Internal Error</h1>');
    }
    res.end(``);
}

function serveAction(req, res) {
    let action = '';
    req.on('data', (chunk) => {
        action += chunk;
    });
    req.on('end', () => {
        action = JSON.parse(action);
        assert(action.cid !== undefined, 'missing CID');
        console.log('action', action);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        const vdom = render(solvDb[action.cid].state, action, createRenderContext());
        res.end(JSON.stringify(diffList(solvDb[action.cid].vdom, vdom)));
        solvDb[action.cid].vdom = vdom;
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

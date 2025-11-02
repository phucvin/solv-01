import http from 'http';
import url from 'url';
import fs from 'fs';

import { diffList, createRenderContext, ssr } from './server01.js';
import * as cache from './cache01.js';

import { render, initState } from './instant01/app.js';
import { assert } from 'console';

async function serveIndex(req, res) {
    const parsedUrl = url.parse(req.url, true);
    const cid = parsedUrl.query.cid;

    if (cid === undefined) {
        const solvState = { nextIid: 1 };
        const context = createRenderContext(solvState);
        solvState.appState = await initState(context);
        const vdom = await render(solvState.appState, null, context);

        let cid;
        try {
            cid = await cache.insert(solvState);
        } catch (err) {
            console.error('Error insert into clients:', err);
            res.writeHead(500, { 'Content-Type': 'text/html' });
            res.end('<h1>Internal Error</h1>');
        }

        try {
            let html = await fs.promises.readFile('./index01.html', 'utf8');
            html = html.replace('$$$SOLV_SSR$$$', ssr(vdom));
            html = html.replace('$$$SOLV_CID$$$', cid);
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(html);
        } catch (err) {
            console.error('Error reading index html and injecting SSR:', err);
            res.writeHead(500, { 'Content-Type': 'text/html' });
            res.end('<h1>Internal Error</h1>');
        }

    } else {  // Has cid

        let solvState;
        try {
            ({ solvState } = await cache.get(cid));
        } catch (err) {
            console.error('Error getting from clients with cid:', cid, err, row);
            res.writeHead(500, { 'Content-Type': 'text/html' });
            res.end('<h1>Internal Error</h1>');
        }

        const context = createRenderContext(solvState);
        vdom = await render(solvState.appState, null, context);

        try {
            let html = await fs.promises.readFile('./index01.html', 'utf8');
            html = html.replace('$$$SOLV_SSR$$$', ssr(vdom));
            html = html.replace('$$$SOLV_CID$$$', cid);
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(html);
        } catch (err) {
            console.error('Error reading index html and injecting SSR:', err);
            res.writeHead(500, { 'Content-Type': 'text/html' });
            res.end('<h1>Internal Error</h1>');
        }
    } 
}

async function serveAction(req, res) {
    let action = await new Promise((resolve) => {
        let data = '';
        req.on('data', (chunk) => {
            data += chunk;
        });
        req.on('end', () => {
            resolve(data);
        });
    });
    action = JSON.parse(action);

    const cid = action.cid;
    assert(cid !== undefined, 'missing CID');
    console.log('action', action);

    let solvState, vdom;
    try {
        ({ solvState } = await cache.get(cid));
        const context = createRenderContext(solvState);
        vdom = await render(solvState.appState, null, context);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        
        let new_vdom = await render(solvState.appState, action, context);
        let repeats = 0;
        while (repeats < 5) {
            let diff = JSON.stringify(diffList(vdom, new_vdom));
            vdom = new_vdom;
            res.write(`|CHUNK_BEGIN>${diff}<CHUNK_END|`);
            repeats += 1;
            if (context.streaming()) {
                context.reset();
                new_vdom = await render(solvState.appState, { t: 'SOLV_STREAMING' }, context);
            } else {
                break;
            }
        }
        assert(repeats < 5, 'too many repeats while streaming', context);
    } catch (err) {
        console.error('Error getting from clients with cid:', cid, err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end('[]');
        return;
    }

    try {
        await cache.update(cid, solvState);
        res.end();
    } catch (err) {
        console.error('Error updating clients with cid:', cid, err);
    }
}

const server = http.createServer((req, res) => {
    if (req.url.startsWith('/action')) {
        serveAction(req, res);
    } else {
        serveIndex(req, res);
    }
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
});

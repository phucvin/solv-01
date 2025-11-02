import http from 'http';
import url from 'url';
import { httpServerHandler } from 'cloudflare:node';

import { diffList, createRenderContext, ssr } from './server01.js';
import * as cache from './cache03.js';
import indexTemplate from './index01.html';

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
            cid = await cache.insert(solvState, vdom);
        } catch (err) {
            console.error('Error insert into clients:', err);
            res.writeHead(500, { 'Content-Type': 'text/html' });
            res.end('<h1>Internal Error</h1>');
        }

        let html = indexTemplate;
        html = html.replace('$$$SOLV_SSR$$$', ssr(vdom));
        html = html.replace('$$$SOLV_CID$$$', cid);
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);

    } else {  // Has cid

        let vdom;
        try {
            ({ vdom } = await cache.get(cid));
        } catch (err) {
            console.error('Error getting from clients with cid:', cid, err, row);
            res.writeHead(500, { 'Content-Type': 'text/html' });
            res.end('<h1>Internal Error</h1>');
        }

        let html = indexTemplate;
        html = html.replace('$$$SOLV_SSR$$$', ssr(vdom));
        html = html.replace('$$$SOLV_CID$$$', cid);
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
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
        ({ solvState, vdom } = await cache.get(cid));

        res.writeHead(200, { 'Content-Type': 'application/json' });
        
        const context = createRenderContext(solvState);
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
        await cache.update(cid, solvState, vdom);
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

export default httpServerHandler({ port: PORT });
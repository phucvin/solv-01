import http from 'http';
import url from 'url';
import fs from 'fs';
import sqlite3 from 'sqlite3';

import { diffList, createRenderContext, ssr } from './server01.js';

import { render, initState } from './counter03/app.js';
import { assert } from 'console';

const db = new sqlite3.Database('./counter03.db', sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
    if (err) {
        console.error(err.message);
    } else {
        const migrations = [
            `CREATE TABLE IF NOT EXISTS clients(
                cid INTEGER PRIMARY KEY AUTOINCREMENT,
                state TEXT,vdom TEXT);`,
            // `ALTER TABLE clients ADD COLUM test TEXT;`,
        ];
        for (const m of migrations) {
            db.run(m, (err) => {
                if (err) {
                    console.log('DB migration error', m, err);
                }
            });
        }
    }
});

async function serveIndex(req, res) {
    const parsedUrl = url.parse(req.url, true);
    const cid = parsedUrl.query.cid;

    if (cid === undefined) {
        const solvState = { nextIid: 1 };
        const context = createRenderContext(solvState);
        solvState.appState = initState(context);
        const vdom = await render(solvState.appState, null, context);
        db.run('INSERT INTO clients (state, vdom) VALUES (?, ?)',
            [JSON.stringify(solvState), JSON.stringify(vdom)],
            async function (err) {
                if (err) {
                    console.error('Error insert into clients:', err);
                    res.writeHead(500, { 'Content-Type': 'text/html' });
                    res.end('<h1>Internal Error</h1>');
                } else {
                    const cid = this.lastID;
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
                    res.end(``);
                }
            });
    } else {
        db.get('SELECT vdom FROM clients WHERE cid = ?', [cid], async (err, row) => {
            if (err || !row || !row.vdom) {
                console.error('Error getting from clients with cid:', cid, err, row);
                res.writeHead(500, { 'Content-Type': 'text/html' });
                res.end('<h1>Internal Error</h1>');
            } else {
                const vdom = JSON.parse(row.vdom);
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
        });
    } 
}

function serveAction(req, res) {
    let action = '';
    req.on('data', (chunk) => {
        action += chunk;
    });
    req.on('end', () => {
        action = JSON.parse(action);
        const cid = action.cid;
        assert(cid !== undefined, 'missing CID');
        console.log('action', action);
        db.get('SELECT state, vdom FROM clients WHERE cid = ?', [cid], async (err, row) => {
            if (err || !row) {
                console.error('Error getting from clients with cid:', cid, err);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end('[]');
            } else {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                
                let solvState = JSON.parse(row.state);
                let vdom = JSON.parse(row.vdom);
                const context = createRenderContext(solvState);
                let new_vdom = await render(solvState.appState, action, context);
                let repeats = 0;
                while (repeats < 5) {
                    let diff = JSON.stringify(diffList(vdom, new_vdom));
                    vdom = new_vdom;
                    res.write(`CHUNK_BEGIN\n${diff}\nCHUNK_END\n`);
                    repeats += 1;
                    if (context.streaming()) {
                        context.reset();
                        new_vdom = await render(solvState.appState, { t: 'SOLV_STREAMING' }, context);
                    } else {
                        break;
                    }
                }
                assert(repeats < 5, 'too many repeats while streaming', context);

                solvState = JSON.stringify(solvState);
                vdom = JSON.stringify(vdom);
                db.run('UPDATE clients SET state = ?, vdom = ? WHERE cid = ?', [solvState, vdom, cid], (err) => {
                    if (err) {
                        console.error('Error updating clients with cid:', cid, err);
                    }
                    res.end();
                });

            }
        });
    });
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

import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('./instant01.db', sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
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

export function insert(solvState, vdom) {
    return new Promise((resolve, reject) =>
        db.run('INSERT INTO clients (state, vdom) VALUES (?, ?)',
            [JSON.stringify(solvState), JSON.stringify(vdom)],
            function (err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.lastID);
                }
            }));
}

export function get(cid) {
    return new Promise((resolve, reject) =>
        db.get('SELECT state, vdom FROM clients WHERE cid = ?', [cid], async (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve({ solvState: JSON.parse(row.state), vdom: JSON.parse(row.vdom) });
            }
        }));
}

export function update(cid, solvState, vdom) {
    solvState = JSON.stringify(solvState);
    vdom = JSON.stringify(vdom);
    return new Promise((resolve, reject) =>
        db.run('UPDATE clients SET state = ?, vdom = ? WHERE cid = ?', [solvState, vdom, cid], (err) => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        }));
}
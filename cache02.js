const mem = {};
let nextCid = 1;

export function insert(solvState, vdom) {
    const cid = nextCid++;
    mem[cid] = { solvState, vdom };
    return cid;
}


export function get(cid) {
    if (!(cid in mem)) {
        throw new Error(`CID not in cache to get: ${cid}`);
    }
    return mem[cid];
}

export function update(cid, solvState, vdom) {
    if (!(cid in mem)) {
        throw new Error(`CID not in cache to update: ${cid}`);
    }
    mem[cid] = { solvState, vdom };
}
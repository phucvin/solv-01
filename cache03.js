import { randomUUID } from 'crypto';

const cache = caches.default;

const toRequest = (cid) => new Request(`http://${cid}`);

export function insert(solvState, vdom) {
    const cid = randomUUID();
    return cache.put(toRequest(cid), new Response(JSON.stringify({ solvState, vdom })));
}


export async function get(cid) {
    const data = await cache.match(toRequest(cid));
    if (data === undefined) {
        throw new Error(`CID not in cache to get: ${cid}`);
    }
    return JSON.parse(data);
}

export function update(cid, solvState, vdom) {
    return cache.put(toRequest(cid), new Response(JSON.stringify({ solvState, vdom })));
}
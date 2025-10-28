export function assert(predicate, ...args) {
    if (!predicate) {
        console.error(...args);
        throw new Error('Assertion error, check console.');
    }
}

export function h(tag, properties, children) {
    assert(typeof tag === 'string', 'Invalid tag value:', tag);
    assert(
        typeof properties === 'object',
        'Expected properties object. Found:',
        properties
    );
    assert(Array.isArray(children), 'Expected children array. Found:', children);
    return { tag, properties, children };
}

export function text(content) {
    return { text: content };
}
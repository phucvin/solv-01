import http from 'http';

const server = http.createServer((req, res) => {
  // Basic routing based on the request URL
  if (req.url === '/') {
    res.setHeader('Content-Type', 'text/html');
    res.end('<h1>Solv Prototype 01</h1><p>Hello</p>');
  } else if (req.url === '/action') {
    res.setHeader('Content-Type', 'application/json');
    res.end('{"a":"b","c":2}');
  } else {
    res.setHeader('Content-Type', 'text/html');
    res.statusCode = 404;
    res.end('<h1>Page not found</h1>');
  }
});

/*
import * as vd from 'virtual-dom';

function render(count) {
  return vd.h('div', {}, [
    vd.h('div', {}, [String(count)]),
    vd.h('div', {}, [String(count * 2)]),
  ]);
}

var tree1 = render(1);
var tree2 = render(2);
var patches = vd.diff(tree1, tree2);
console.log(JSON.stringify(patches, null, 2));
*/

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});

# Stateless Offline-capable LiveView (Solv) Prototype 01

[Edit in StackBlitz next generation editor ⚡️](https://stackblitz.com/~/github.com/phucvin/solv-01)

To run:
```
node index.js
```

TODOs:
- Use express for routing to multiple apps
- Start offline-capable using service worker intercepting fetch
- Multi-page App (MPA)
- Use generator for render (like https://crank.js.org/)
- Signals for render
- Optimize vdom serde, potentialy zero-copy parsing

Notes:
- Cluster -> pm2 and npm cluster don't work on stackblitz

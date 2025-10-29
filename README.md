# Stateless Offline-capable LiveView (Solv) Prototype 01

[Edit in StackBlitz next generation editor ⚡️](https://stackblitz.com/~/github.com/phucvin/solv-01)

To run:
```
node index.js
```

TODOs:
- List of counter components, with add & remove buttons
- Queue client dispatch to avoid dispatching while processing previous response stream
- Start offline-capable
- Maybe get CID from index's query param
- Use generator for render (like https://crank.js.org/)
- Signals for render

Notes:
- Cluster -> pm2 and npm cluster don't work on stackblitz
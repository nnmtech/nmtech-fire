// n8n custom extension entry
// Exports nodes in a way n8n can discover without build tooling.

module.exports = {
  nodes: [
    require('./nodes/EnhancedMaker.node.js'),
  ],
  credentials: [],
};

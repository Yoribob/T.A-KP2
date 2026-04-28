class BSTNode {
  constructor(key) {
    this.key   = key;
    this.left  = null;
    this.right = null;
    this.parent= null;
  }
}

class BST {
  constructor() { this.root = null; }

  insert(key) {
    const node = new BSTNode(key);
    if (!this.root) { this.root = node; return; }
    let cur = this.root;
    while (true) {
      if (key < cur.key) {
        if (!cur.left)  { cur.left = node; node.parent = cur; return; }
        cur = cur.left;
      } else {
        if (!cur.right) { cur.right = node; node.parent = cur; return; }
        cur = cur.right;
      }
    }
  }

  searchMinGe(key) {
    let cur = this.root, best = null;
    const path = [];
    while (cur) {
      path.push(cur.key);
      if (cur.key >= key) { best = cur.key; cur = cur.left; }
      else cur = cur.right;
    }
    return { found: best !== null, key: best,
      path: best !== null ? path.slice(0, path.lastIndexOf(best)+1) : path };
  }

  findMin(node = this.root) {
    if (!node) return null;
    while (node.left) node = node.left;
    return node;
  }

  _deleteNode(node, key) {
    if (!node) return null;
    if (key < node.key) node.left  = this._deleteNode(node.left,  key);
    else if (key > node.key) node.right = this._deleteNode(node.right, key);
    else {
      if (!node.left)  return node.right;
      if (!node.right) return node.left;
      const m = this.findMin(node.right);
      node.key   = m.key;
      node.right = this._deleteNode(node.right, m.key);
    }
    return node;
  }

  delete(key) { this.root = this._deleteNode(this.root, key); }

  inorder(node = this.root, arr = []) {
    if (!node) return arr;
    this.inorder(node.left, arr); arr.push(node.key); this.inorder(node.right, arr);
    return arr;
  }

  maxDepth(node = this.root) {
    if (!node) return 0;
    return 1 + Math.max(this.maxDepth(node.left), this.maxDepth(node.right));
  }

  toLayout(node = this.root, depth = 0, lo = 0, hi = 1, pos = {}) {
    if (!node) return pos;
    pos[node.key] = { x: (lo+hi)/2, depth };
    this.toLayout(node.left,  depth+1, lo, (lo+hi)/2, pos);
    this.toLayout(node.right, depth+1, (lo+hi)/2, hi, pos);
    return pos;
  }
}

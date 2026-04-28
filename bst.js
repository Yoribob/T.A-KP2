class BSTNode {
  constructor(key) {
    this.key    = key;
    this.left   = null;
    this.right  = null;
    this.parent = null;
  }
}

class BST {
  constructor() {
    this.root = null;
  }

  insert(key) {
    const node = new BSTNode(key);
    if (!this.root) {
      this.root = node;
      return;
    }
    let cur = this.root;
    while (true) {
      if (key < cur.key) {
        if (!cur.left)  { cur.left  = node; node.parent = cur; return; }
        cur = cur.left;
      } else {
        if (!cur.right) { cur.right = node; node.parent = cur; return; }
        cur = cur.right;
      }
    }
  }

  search(key) {
    let cur = this.root;
    const path = [];
    while (cur) {
      path.push(cur.key);
      if (cur.key === key) return { found: true, path };
      cur = key < cur.key ? cur.left : cur.right;
    }
    return { found: false, path };
  }

  searchMinGe(key) {
    let cur      = this.root;
    let best     = null;
    let bestPath = [];
    const path   = [];

    while (cur) {
      path.push(cur.key);
      if (cur.key >= key) {
        best     = cur.key;
        bestPath = [...path];
        cur      = cur.left;
      } else {
        cur = cur.right;
      }
    }

    return { found: best !== null, key: best, path: bestPath };
  }

  findMin(node = this.root) {
    if (!node) return null;
    while (node.left) node = node.left;
    return node;
  }

  findMax(node = this.root) {
    if (!node) return null;
    while (node.right) node = node.right;
    return node;
  }

  inorder(node = this.root, arr = []) {
    if (!node) return arr;
    this.inorder(node.left,  arr);
    arr.push(node.key);
    this.inorder(node.right, arr);
    return arr;
  }

  maxDepth(node = this.root) {
    if (!node) return 0;
    return 1 + Math.max(this.maxDepth(node.left), this.maxDepth(node.right));
  }

  toLayout(node = this.root, depth = 0, lo = 0, hi = 1, positions = {}) {
    if (!node) return positions;
    const x = (lo + hi) / 2;
    positions[node.key] = { x, depth };
    this.toLayout(node.left,  depth + 1, lo, x, positions);
    this.toLayout(node.right, depth + 1, x, hi, positions);
    return positions;
  }

  _deleteNode(node, key) {
    if (!node) return null;
    if (key < node.key) {
      node.left  = this._deleteNode(node.left,  key);
    } else if (key > node.key) {
      node.right = this._deleteNode(node.right, key);
    } else {
      if (!node.left)  return node.right;
      if (!node.right) return node.left;
      const minRight = this.findMin(node.right);
      node.key   = minRight.key;
      node.right = this._deleteNode(node.right, minRight.key);
    }
    return node;
  }

  delete(key) {
    this.root = this._deleteNode(this.root, key);
  }
}
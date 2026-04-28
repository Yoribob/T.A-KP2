/* ===== Balanced BST ===== */
class BalancedBSTNode {
  constructor(key) {
    this.key   = key;
    this.left  = null;
    this.right = null;
  }
}

class BalancedBST {
  constructor() { this.root = null; }

  buildFromSorted(arr) {
    this.root = this._build(arr, 0, arr.length - 1);
  }

  _build(arr, lo, hi) {
    if (lo > hi) return null;
    const mid  = Math.floor((lo + hi) / 2);
    const node = new BalancedBSTNode(arr[mid]);
    node.left  = this._build(arr, lo, mid - 1);
    node.right = this._build(arr, mid + 1, hi);
    return node;
  }

  insert(key) {
    const arr = this.inorder();
    arr.push(key);
    arr.sort((a, b) => a - b);
    this.root = this._build(arr, 0, arr.length - 1);
  }

  delete(key) {
    const arr = this.inorder().filter(k => k !== key);
    this.root = arr.length ? this._build(arr, 0, arr.length - 1) : null;
  }

  searchMinGe(key) {
    let cur  = this.root, best = null;
    const path = [];
    while (cur) {
      path.push(cur.key);
      if (cur.key >= key) { best = cur.key; cur = cur.left; }
      else cur = cur.right;
    }
    return { found: best !== null, key: best, path: best !== null ? path.slice(0, path.lastIndexOf(best) + 1) : path };
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

  toLayout(node = this.root, depth = 0, lo = 0, hi = 1, pos = {}) {
    if (!node) return pos;
    pos[node.key] = { x: (lo + hi) / 2, depth };
    this.toLayout(node.left,  depth + 1, lo, (lo+hi)/2, pos);
    this.toLayout(node.right, depth + 1, (lo+hi)/2, hi, pos);
    return pos;
  }
}

/* ===== Red-Black Tree ===== */
const RED   = 'RED';
const BLACK = 'BLACK';

class RBNode {
  constructor(key) {
    this.key    = key;
    this.color  = RED;
    this.left   = null;
    this.right  = null;
    this.parent = null;
  }
}

class RedBlackTree {
  constructor() {
    this.NIL = new RBNode(null);
    this.NIL.color = BLACK;
    this.root = this.NIL;
  }

  _rotateLeft(x) {
    const y = x.right;
    x.right = y.left;
    if (y.left !== this.NIL) y.left.parent = x;
    y.parent = x.parent;
    if (!x.parent) this.root = y;
    else if (x === x.parent.left) x.parent.left = y;
    else x.parent.right = y;
    y.left = x;
    x.parent = y;
  }

  _rotateRight(x) {
    const y = x.left;
    x.left = y.right;
    if (y.right !== this.NIL) y.right.parent = x;
    y.parent = x.parent;
    if (!x.parent) this.root = y;
    else if (x === x.parent.right) x.parent.right = y;
    else x.parent.left = y;
    y.right = x;
    x.parent = y;
  }

  insert(key) {
    const z = new RBNode(key);
    z.left = z.right = this.NIL;

    let y = null, x = this.root;
    while (x !== this.NIL) {
      y = x;
      x = key < x.key ? x.left : x.right;
    }
    z.parent = y;
    if (!y) this.root = z;
    else if (key < y.key) y.left = z;
    else y.right = z;

    this._fixInsert(z);
  }

  _fixInsert(z) {
    while (z.parent && z.parent.color === RED) {
      if (z.parent === z.parent.parent.left) {
        const y = z.parent.parent.right;
        if (y.color === RED) {
          z.parent.color = BLACK;
          y.color = BLACK;
          z.parent.parent.color = RED;
          z = z.parent.parent;
        } else {
          if (z === z.parent.right) {
            z = z.parent;
            this._rotateLeft(z);
          }
          z.parent.color = BLACK;
          z.parent.parent.color = RED;
          this._rotateRight(z.parent.parent);
        }
      } else {
        const y = z.parent.parent.left;
        if (y.color === RED) {
          z.parent.color = BLACK;
          y.color = BLACK;
          z.parent.parent.color = RED;
          z = z.parent.parent;
        } else {
          if (z === z.parent.left) {
            z = z.parent;
            this._rotateRight(z);
          }
          z.parent.color = BLACK;
          z.parent.parent.color = RED;
          this._rotateLeft(z.parent.parent);
        }
      }
    }
    this.root.color = BLACK;
  }

  _transplant(u, v) {
    if (!u.parent) this.root = v;
    else if (u === u.parent.left) u.parent.left = v;
    else u.parent.right = v;
    v.parent = u.parent;
  }

  _minimum(node) {
    while (node.left !== this.NIL) node = node.left;
    return node;
  }

  delete(key) {
    let z = this.root;
    while (z !== this.NIL) {
      if (key === z.key) break;
      z = key < z.key ? z.left : z.right;
    }
    if (z === this.NIL) return;

    let y = z, yOrigColor = y.color, x;
    if (z.left === this.NIL) {
      x = z.right;
      this._transplant(z, z.right);
    } else if (z.right === this.NIL) {
      x = z.left;
      this._transplant(z, z.left);
    } else {
      y = this._minimum(z.right);
      yOrigColor = y.color;
      x = y.right;
      if (y.parent === z) x.parent = y;
      else {
        this._transplant(y, y.right);
        y.right = z.right;
        y.right.parent = y;
      }
      this._transplant(z, y);
      y.left = z.left;
      y.left.parent = y;
      y.color = z.color;
    }
    if (yOrigColor === BLACK) this._fixDelete(x);
  }

  _fixDelete(x) {
    while (x !== this.root && x.color === BLACK) {
      if (x === x.parent.left) {
        let w = x.parent.right;
        if (w.color === RED) {
          w.color = BLACK; x.parent.color = RED;
          this._rotateLeft(x.parent); w = x.parent.right;
        }
        if (w.left.color === BLACK && w.right.color === BLACK) {
          w.color = RED; x = x.parent;
        } else {
          if (w.right.color === BLACK) {
            w.left.color = BLACK; w.color = RED;
            this._rotateRight(w); w = x.parent.right;
          }
          w.color = x.parent.color;
          x.parent.color = BLACK; w.right.color = BLACK;
          this._rotateLeft(x.parent); x = this.root;
        }
      } else {
        let w = x.parent.left;
        if (w.color === RED) {
          w.color = BLACK; x.parent.color = RED;
          this._rotateRight(x.parent); w = x.parent.left;
        }
        if (w.right.color === BLACK && w.left.color === BLACK) {
          w.color = RED; x = x.parent;
        } else {
          if (w.left.color === BLACK) {
            w.right.color = BLACK; w.color = RED;
            this._rotateLeft(w); w = x.parent.left;
          }
          w.color = x.parent.color;
          x.parent.color = BLACK; w.left.color = BLACK;
          this._rotateRight(x.parent); x = this.root;
        }
      }
    }
    x.color = BLACK;
  }

  searchMinGe(key) {
    let cur = this.root, best = null;
    const path = [];
    while (cur !== this.NIL) {
      path.push(cur.key);
      if (cur.key >= key) { best = cur.key; cur = cur.left; }
      else cur = cur.right;
    }
    const bestPath = best !== null ? path.slice(0, path.lastIndexOf(best) + 1) : path;
    return { found: best !== null, key: best, path: bestPath };
  }

  inorder(node = this.root, arr = []) {
    if (node === this.NIL || !node) return arr;
    this.inorder(node.left,  arr);
    arr.push(node.key);
    this.inorder(node.right, arr);
    return arr;
  }

  maxDepth(node = this.root) {
    if (node === this.NIL || !node) return 0;
    return 1 + Math.max(this.maxDepth(node.left), this.maxDepth(node.right));
  }

  getColor(key) {
    let cur = this.root;
    while (cur !== this.NIL) {
      if (cur.key === key) return cur.color;
      cur = key < cur.key ? cur.left : cur.right;
    }
    return null;
  }

  toLayout(node = this.root, depth = 0, lo = 0, hi = 1, pos = {}) {
    if (node === this.NIL || !node) return pos;
    pos[node.key] = { x: (lo + hi) / 2, depth, color: node.color };
    this.toLayout(node.left,  depth + 1, lo, (lo+hi)/2, pos);
    this.toLayout(node.right, depth + 1, (lo+hi)/2, hi, pos);
    return pos;
  }
}

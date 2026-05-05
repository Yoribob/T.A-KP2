function quickSortLast(arr) {
  const a = [...arr];
  const steps = [];

  function partition(lo, hi) {
    const pivot = a[hi];
    let i = lo - 1;
    for (let j = lo; j < hi; j++) {
      if (a[j] <= pivot) {
        i++;
        [a[i], a[j]] = [a[j], a[i]];
        steps.push({ swap: [i, j], arr: [...a] });
      }
    }
    [a[i + 1], a[hi]] = [a[hi], a[i + 1]];
    steps.push({ swap: [i + 1, hi], arr: [...a] });
    return i + 1;
  }

  function qs(lo, hi) {
    if (lo >= hi) return;
    const p = partition(lo, hi);
    qs(lo, p - 1);
    qs(p + 1, hi);
  }

  qs(0, a.length - 1);
  return { sorted: a, steps };
}

function quickSortMedian3(arr) {
  const a = [...arr];
  const steps = [];

  function medianOf3(lo, hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (a[lo] > a[mid]) { [a[lo], a[mid]] = [a[mid], a[lo]]; steps.push({ swap: [lo, mid], arr: [...a] }); }
    if (a[lo] > a[hi])  { [a[lo], a[hi]]  = [a[hi],  a[lo]]; steps.push({ swap: [lo, hi],  arr: [...a] }); }
    if (a[mid] > a[hi]) { [a[mid], a[hi]] = [a[hi], a[mid]]; steps.push({ swap: [mid, hi], arr: [...a] }); }
    [a[mid], a[hi - 1]] = [a[hi - 1], a[mid]];
    steps.push({ swap: [mid, hi - 1], arr: [...a] });
    return a[hi - 1];
  }

  function partition(lo, hi) {
    if (hi - lo < 2) return lo;
    const pivot = medianOf3(lo, hi);
    let i = lo;
    let j = hi - 1;
    while (true) {
      while (a[++i] < pivot);
      while (a[--j] > pivot);
      if (i >= j) break;
      [a[i], a[j]] = [a[j], a[i]];
      steps.push({ swap: [i, j], arr: [...a] });
    }
    [a[i], a[hi - 1]] = [a[hi - 1], a[i]];
    steps.push({ swap: [i, hi - 1], arr: [...a] });
    return i;
  }

  function qs(lo, hi) {
    if (hi - lo < 2) {
      if (hi > lo && a[lo] > a[hi]) {
        [a[lo], a[hi]] = [a[hi], a[lo]];
        steps.push({ swap: [lo, hi], arr: [...a] });
      }
      return;
    }
    const p = partition(lo, hi);
    qs(lo, p - 1);
    qs(p + 1, hi);
  }

  qs(0, a.length - 1);
  return { sorted: a, steps };
}

function quickSortThreeWay(arr) {
  const a = [...arr];
  const steps = [];

  function qs(lo, hi) {
    if (lo >= hi) return;
    const pivot = a[lo];
    let lt = lo, gt = hi, i = lo + 1;
    while (i <= gt) {
      if (a[i] < pivot) {
        [a[lt], a[i]] = [a[i], a[lt]];
        steps.push({ swap: [lt, i], arr: [...a] });
        lt++; i++;
      } else if (a[i] > pivot) {
        [a[i], a[gt]] = [a[gt], a[i]];
        steps.push({ swap: [i, gt], arr: [...a] });
        gt--;
      } else {
        i++;
      }
    }
    qs(lo, lt - 1);
    qs(gt + 1, hi);
  }

  qs(0, a.length - 1);
  return { sorted: a, steps };
}
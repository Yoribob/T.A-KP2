function bubbleSort(arr) {
  const a = [...arr];
  const steps = [];
  for (let i = 0; i < a.length - 1; i++) {
    for (let j = 0; j < a.length - i - 1; j++) {
      if (a[j] > a[j + 1]) {
        [a[j], a[j + 1]] = [a[j + 1], a[j]];
        steps.push({ swap: [j, j + 1], arr: [...a] });
      }
    }
  }
  return { sorted: a, steps };
}

function shellSort(arr) {
  const a = [...arr];
  const steps = [];
  let gap = Math.floor(a.length / 2);
  while (gap > 0) {
    for (let i = gap; i < a.length; i++) {
      const temp = a[i];
      let j = i;
      while (j >= gap && a[j - gap] > temp) {
        a[j] = a[j - gap];
        j -= gap;
        steps.push({ moved: j, arr: [...a] });
      }
      a[j] = temp;
    }
    gap = Math.floor(gap / 2);
  }
  return { sorted: a, steps };
}

function quickSort(arr) {
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
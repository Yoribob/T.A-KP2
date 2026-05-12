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

function insertionSort(arr) {
  const a = [...arr];
  const steps = [];
  for (let i = 1; i < a.length; i++) {
    const key = a[i];
    let j = i - 1;
    while (j >= 0 && a[j] > key) {
      a[j + 1] = a[j];
      steps.push({ moved: j + 1, arr: [...a] });
      j--;
    }
    if (j + 1 !== i) {
      a[j + 1] = key;
      steps.push({ moved: j + 1, arr: [...a] });
    }
  }
  return { sorted: a, steps };
}
import time
import random
import matplotlib.pyplot as plt
import gc

def generate_array(n):
    result = []
    for _ in range(n):
        result.append(random.randint(0, 1))
    return result

def algorithm(arr):
    count = 0
    for x in arr:
        if x == 0:
            count += 1
    return count

def benchmark():
    sizes = [50000, 100000, 150000, 200000, 250000, 300000, 350000, 400000, 450000, 500000,
             550000, 600000, 650000, 700000, 750000, 800000, 850000, 900000, 950000, 1000000]
    times = []

    gc.disable()
    for n in sizes:
        matrix = generate_array(n)

        start = time.perf_counter()
        algorithm(matrix)
        end = time.perf_counter()

        times.append(end - start)
        print(f"n={n} -> {times[-1]:.6f}s")
    gc.enable()

    return sizes, times

def plot(ns, ts):
    plt.plot(ns, ts, marker='o', label='Час виконання')
    k = ts[0] / ns[0]
    o_n = [k * n for n in ns]
    plt.plot(ns, o_n, linestyle='--', color='red', label='O(n) лінія')

    plt.xlabel("Кількість елементів(n)")
    plt.ylabel("Час виконанная(секунди)")
    plt.title("Аналіз складності алгоритму")
    plt.grid(True)
    plt.legend()
    plt.show()

ns, ts = benchmark()
plot(ns, ts)
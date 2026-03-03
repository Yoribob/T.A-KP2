import time
import matplotlib.pyplot as plt

locationNames = [
    "Червоний університет", "Андріївська церква", "Михайлівський собор",
    "Золоті ворота", "Лядські ворота", "Фунікулер",
    "Київська політехніка", "Фонтан на Хрещатику", "Софія київська",
    "Національна філармонія", "Музей однієї вулиці"
]

rawEdges = [
    (0,3,0.9),(3,2,1.0),(4,7,1.0),(3,8,0.5),(8,4,0.6),(2,8,0.85),
    (1,2,0.8),(10,5,0.55),(5,1,0.35),(9,10,0.55),(9,5,0.3),(4,9,0.75),
    (3,7,1.05),(0,6,4.2),(6,3,3.7),(4,2,0.9)
]

def build_graph():
    n = len(locationNames)
    adj = [[] for _ in range(n)]
    flat = []
    for (u, v, w) in rawEdges:
        adj[u].append((v, w))
        adj[v].append((u, w))
        flat.append((u, v, w))
        flat.append((v, u, w))
    return adj, flat

def dijkstra(adj, n, start, end):
    dist = [float('inf')] * n
    visited = [False] * n
    parent = [-1] * n
    dist[start] = 0
    for _ in range(n):
        u = -1
        for v in range(n):
            if not visited[v] and (u == -1 or dist[v] < dist[u]):
                u = v
        if dist[u] == float('inf'):
            break
        visited[u] = True
        for (to, w) in adj[u]:
            if dist[u] + w < dist[to]:
                dist[to] = dist[u] + w
                parent[to] = u
    path = []
    cur = end
    while cur != -1:
        path.append(cur)
        cur = parent[cur] if cur != start else -1
    path.reverse()
    return path, dist[end]

def bellman_ford(flat, n, start, end):
    dist = [float('inf')] * n
    parent = [-1] * n
    dist[start] = 0
    for _ in range(n - 1):
        changed = False
        for (u, v, w) in flat:
            if dist[u] + w < dist[v]:
                dist[v] = dist[u] + w
                parent[v] = u
                changed = True
        if not changed:
            break
    path = []
    cur = end
    while cur != -1:
        path.append(cur)
        cur = parent[cur] if cur != start else -1
    path.reverse()
    return path, dist[end]

def measure_time(func, *args, runs=1000):
    start = time.perf_counter()
    for _ in range(runs):
        func(*args)
    return (time.perf_counter() - start) / runs * 1000

adj, flat = build_graph()
n = len(locationNames)
start_node = 6
targets = [0, 1, 2, 3, 4, 5, 7, 8, 9, 10]

labels = []
d_times = []
b_times = []

print(f"{'Маршрут':<30} {'Dijkstra (мс)':>14} {'Bellman-Ford (мс)':>18}")
print("-" * 65)

for t in targets:
    dt = measure_time(dijkstra, adj, n, start_node, t)
    bt = measure_time(bellman_ford, flat, n, start_node, t)
    label = locationNames[t]
    labels.append(label)
    d_times.append(dt)
    b_times.append(bt)
    print(f"{label:<30} {dt:>14.5f} {bt:>18.5f}")

BLUE = "#4a6cf7"
RED  = "#e53935"

fig, ax1 = plt.subplots(figsize=(13, 5))
ax2 = ax1.twinx()

x = range(len(labels))

l1, = ax1.plot(x, d_times, color=BLUE, marker='o', linewidth=2.5, markersize=7, label="Дейкстра")
l2, = ax2.plot(x, b_times, color=RED,  marker='s', linewidth=2.5, markersize=7, label="Беллман-Форд")

ax1.set_xticks(list(x))
ax1.set_xticklabels(labels, rotation=25, ha='right', fontsize=9)
ax1.set_ylabel("Дейкстра, мс", color=BLUE, fontsize=10)
ax2.set_ylabel("Беллман-Форд, мс", color=RED, fontsize=10)
ax1.tick_params(axis='y', labelcolor=BLUE)
ax2.tick_params(axis='y', labelcolor=RED)
ax1.set_ylim(bottom=0)
ax2.set_ylim(bottom=0)
ax1.grid(True, linestyle='--', alpha=0.4)

ax1.set_title(
    "Час виконання алгоритмів - маршрути від Київської політехніки\n(1000 запусків)",
    fontsize=11, fontweight='bold'
)
ax1.legend([l1, l2], ["Дейкстра", "Беллман-Форд"], fontsize=10, loc="upper left")

plt.tight_layout()
plt.savefig("complexity_chart.png", dpi=150, bbox_inches='tight')
plt.show()
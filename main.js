const locationNames = [
  "Червоний університет",
  "Андріївська церква",
  "Михайлівський собор",
  "Золоті ворота",
  "Лядські ворота",
  "Фунікулер",
  "Київська політехніка",
  "Фонтан на Хрещатику",
  "Софія київська",
  "Національна філармонія",
  "Музей однієї вулиці"
];

const coordinates = [
  { x: 160, y: 560 },
  { x: 680, y: 120 },
  { x: 680, y: 240 },
  { x: 440, y: 370 },
  { x: 640, y: 360 },
  { x: 800, y: 260 },
  { x: 200, y: 340 },
  { x: 640, y: 520 },
  { x: 520, y: 220 },
  { x: 880, y: 380 },
  { x: 940, y: 130 }
];

const connectionData = [
  { from: 0, to: 3, distance: 0.9 },
  { from: 3, to: 2, distance: 1.0 },
  { from: 4, to: 7, distance: 1.0 },
  { from: 3, to: 8, distance: 0.5 },
  { from: 8, to: 4, distance: 0.6 },
  { from: 2, to: 8, distance: 0.85 },
  { from: 1, to: 2, distance: 0.8 },
  { from: 10, to: 5, distance: 0.55 },
  { from: 5, to: 1, distance: 0.35 },
  { from: 9, to: 10, distance: 0.55 },
  { from: 9, to: 5, distance: 0.3 },
  { from: 4, to: 9, distance: 0.75 },
  { from: 3, to: 7, distance: 1.05 },
  { from: 0, to: 6, distance: 4.2 },
  { from: 6, to: 3, distance: 3.7 },
  { from: 4, to: 2, distance: 0.9 }
];

let neighborMap = [];
let flatEdgeList = [];

function setupGraphData() {
  neighborMap = locationNames.map(() => []);
  flatEdgeList = [];

  for (const connection of connectionData) {
    neighborMap[connection.from].push({ to: connection.to, weight: connection.distance });
    neighborMap[connection.to].push({ to: connection.from, weight: connection.distance });

    flatEdgeList.push({ from: connection.from, to: connection.to, weight: connection.distance });
    flatEdgeList.push({ from: connection.to, to: connection.from, weight: connection.distance });
  }
}

const xmlNamespace = "http://www.w3.org/2000/svg";
const svg = document.getElementById("graphSvg");
function createArrow(id, color) {
  let defs = svg.querySelector("defs");
  if (!defs) {
    defs = document.createElementNS(xmlNamespace, "defs");
    svg.appendChild(defs);
  }

  const marker = document.createElementNS(xmlNamespace, "marker");
  marker.setAttribute("id", id);
  marker.setAttribute("viewBox", "0 0 10 10");
  marker.setAttribute("refX", "9");
  marker.setAttribute("refY", "5");
  marker.setAttribute("markerWidth", "5");
  marker.setAttribute("markerHeight", "5");
  marker.setAttribute("orient", "auto-start-reverse");
  marker.setAttribute("markerUnits", "strokeWidth"); 

  const arrowPath = document.createElementNS(xmlNamespace, "path");
  arrowPath.setAttribute("d", "M 0 0 L 10 5 L 0 10 z");
  arrowPath.setAttribute("fill", color);
  marker.appendChild(arrowPath);
  defs.appendChild(marker);
}

function drawGraph() {
  createArrow("arrowTwoWay", "#6672ff")
  for (const connection of connectionData) {
    const startPoint = coordinates[connection.from];
    const endPoint = coordinates[connection.to];

    const dx = endPoint.x - startPoint.x;
    const dy = endPoint.y - startPoint.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const unitX = dx / distance;
    const unitY = dy / distance;
    const padding = 24;

    const line = document.createElementNS(xmlNamespace, "line");
    line.setAttribute("x1", startPoint.x + unitX * padding);
    line.setAttribute("y1", startPoint.y + unitY * padding);
    line.setAttribute("x2", endPoint.x - unitX * padding);
    line.setAttribute("y2", endPoint.y - unitY * padding);
    
    line.setAttribute("marker-start", "url(#arrowTwoWay)");
    line.setAttribute("marker-end", "url(#arrowTwoWay)");
    line.setAttribute("class", "edge-line-two-way");
 
    svg.appendChild(line);

    const label = document.createElementNS(xmlNamespace, "text");
    label.setAttribute("x", (startPoint.x + endPoint.x) / 2);
    label.setAttribute("y", (startPoint.y + endPoint.y) / 2 - 6);
    label.setAttribute("class", "edge-label");
    label.textContent = connection.distance;
    svg.appendChild(label);
  }

  locationNames.forEach((name, index) => {
    const point = coordinates[index];
    const group = document.createElementNS(xmlNamespace, "g");
    group.setAttribute("class", "node");
    group.setAttribute("data-index", index);

    const circle = document.createElementNS(xmlNamespace, "circle");
    circle.setAttribute("cx", point.x);
    circle.setAttribute("cy", point.y);
    circle.setAttribute("r", "22");
    circle.setAttribute("class", "node-circle");
    circle.setAttribute("fill", "#6672ff");

    const number = document.createElementNS(xmlNamespace, "text");
    number.setAttribute("x", point.x);
    number.setAttribute("y", point.y);
    number.setAttribute("class", "node-label");
    number.textContent = index + 1;

    const title = document.createElementNS(xmlNamespace, "text");
    title.setAttribute("x", point.x);
    title.setAttribute("y", point.y + 30);
    title.setAttribute("class", "node-title");
    title.setAttribute("text-anchor", "middle");
    title.setAttribute("dominant-baseline", "hanging");
    title.textContent = name;

    group.appendChild(circle);
    group.appendChild(number);
    group.appendChild(title);
    group.addEventListener("click", focusOnListElement);
    svg.appendChild(group);
  });
}

function focusOnListElement(event) {
  const index = parseInt(event.currentTarget.getAttribute("data-index"));
  const listItems = document.querySelectorAll("#placesList li");

  listItems.forEach(item => item.style.backgroundColor = "transparent");
  
  if (listItems[index]) {
    listItems[index].scrollIntoView({ behavior: "smooth", block: "center" });
    listItems[index].style.backgroundColor = "rgba(255, 214, 165, 0.6)";
  }
}

function populateUI() {
  const list = document.getElementById("placesList");
  const dropdown = document.getElementById("targetSelect");
  
  list.innerHTML = "";
  dropdown.innerHTML = "";

  locationNames.forEach((name, index) => {
    const li = document.createElement("li");
    const label = document.createElement("span");
    label.textContent = name;
    li.appendChild(document.createElement("span")).className = "index";
    li.appendChild(label);
    list.appendChild(li);

    if (index !== 6) {
      const option = document.createElement("option");
      option.value = index;
      option.textContent = `${index + 1} ${name}`;
      dropdown.appendChild(option);
    }
  });
}

function findShortestPathDijkstra(start, end) {
  const count = neighborMap.length;
  const distances = Array(count).fill(Infinity);
  const visited = Array(count).fill(false);
  const parentNodes = Array(count).fill(-1);

  distances[start] = 0;

  for (let i = 0; i < count; i++) {
    let current = -1;
    for (let j = 0; j < count; j++) {
      if (!visited[j] && (current === -1 || distances[j] < distances[current])) {
        current = j;
      }
    }

    if (distances[current] === Infinity) break;

    visited[current] = true;

    for (const edge of neighborMap[current]) {
      if (distances[current] + edge.weight < distances[edge.to]) {
        distances[edge.to] = distances[current] + edge.weight;
        parentNodes[edge.to] = current;
      }
    }
  }

  return { path: reconstructPath(parentNodes, start, end), cost: distances[end] };
}

function findShortestPathBellmanFord(start, end) {
  const count = neighborMap.length;
  const distances = Array(count).fill(Infinity);
  const parentNodes = Array(count).fill(-1);

  distances[start] = 0;

  for (let i = 0; i < count - 1; i++) {
    let hasChanged = false;
    for (const edge of flatEdgeList) {
      if (distances[edge.from] + edge.weight < distances[edge.to]) {
        distances[edge.to] = distances[edge.from] + edge.weight;
        parentNodes[edge.to] = edge.from;
        hasChanged = true;
      }
    }
    if (!hasChanged) break;
  }

  return { path: reconstructPath(parentNodes, start, end), cost: distances[end] };
}

function reconstructPath(parents, start, end) {
  const path = [];
  let step = end;

  if (parents[step] !== -1 || step === start) {
    while (step !== -1) {
      path.push(step);
      step = (step === start) ? -1 : parents[step];
    }
    path.reverse();
  }
  return path;
}

function highlightPathOnGraph(path) {
  const nodes = document.querySelectorAll(".node");
  nodes.forEach(node => {
    const circle = node.querySelector(".node-circle");
    const idx = parseInt(node.getAttribute("data-index"));
    circle.setAttribute("fill", path.includes(idx) ? "#ff7ab8" : "#6672ff");
  });
}

function displayResults(path, totalCost, executionTime) {
  document.getElementById("timeOutput").textContent = executionTime.toFixed(4);
  document.getElementById("costOutput").textContent = totalCost.toFixed(2);

  const container = document.getElementById("routeOutput");
  const pathNames = path.map(idx => `${idx + 1} ${locationNames[idx]}`).join(" → ");
  
  container.innerHTML = `
    <div class="scc-row">
      <span class="scc-label">Шлях:</span>
      <span class="scc-nodes">${pathNames}</span>
    </div>
  `;

  highlightPathOnGraph(path);
}

function executeRouteSearch() {
  const algorithm = document.getElementById("algorithmSelect").value;
  const targetIndex = parseInt(document.getElementById("targetSelect").value);
  const startIndex = 6;

  const startTime = performance.now();
  const result = (algorithm === "dijkstra") 
    ? findShortestPathDijkstra(startIndex, targetIndex)
    : findShortestPathBellmanFord(startIndex, targetIndex);
  const endTime = performance.now();

  displayResults(result.path, result.cost, endTime - startTime);
}

function startApp() {
  setupGraphData();
  drawGraph();
  populateUI();
  document.getElementById("runButton").addEventListener("click", executeRouteSearch);
}

document.addEventListener("DOMContentLoaded", startApp);
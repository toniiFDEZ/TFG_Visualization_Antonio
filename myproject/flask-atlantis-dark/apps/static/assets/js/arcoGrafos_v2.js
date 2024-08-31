function _order(d3, html) {
  const options = [
    // Opción para ordenar por nombre
    { name: "Order by name", value: (a, b) => d3.ascending(a.label, b.label) },
    // Opción para ordenar por support
    { 
      name: "Order by support", 
      value: (a, b) => {
        // Suma el valor de support de los enlaces fuente y destino para cada nodo
        const aSupport = d3.sum(a.sourceLinks, l => l.support) + d3.sum(a.targetLinks, l => l.support);
        const bSupport = d3.sum(b.sourceLinks, l => l.support) + d3.sum(b.targetLinks, l => l.support);
        return bSupport - aSupport || d3.ascending(a.label, b.label);
      }
    },
    // Opción para ordenar por confidence
    { 
      name: "Order by confidence", 
      value: (a, b) => {
        // Suma el valor de confidence de los enlaces fuente y destino para cada nodo
        const aConfidence = d3.sum(a.sourceLinks, l => l.confidence) + d3.sum(a.targetLinks, l => l.confidence);
        const bConfidence = d3.sum(b.sourceLinks, l => l.confidence) + d3.sum(b.targetLinks, l => l.confidence);
        return bConfidence - aConfidence || d3.ascending(a.label, b.label);
      }
    },
    // Opción para ordenar por lift
    {
      name: "Order by lift", 
      value: (a, b) => {
        // Suma el valor de lift de los enlaces fuente y destino para cada nodo
        const aLift = d3.sum(a.sourceLinks, l => l.lift) + d3.sum(a.targetLinks, l => l.lift);
        const bLift = d3.sum(b.sourceLinks, l => l.lift) + d3.sum(b.targetLinks, l => l.lift);
        return bLift - aLift || d3.ascending(a.label, b.label);
      }
    },
  ];
  
  // Crear el formulario HTML para seleccionar las opciones de ordenamiento
  const form = html`<form style="display: flex; align-items: center; min-height: 33px;">
    <select name=i>${options.map(o => Object.assign(html`<option>`, { textContent: o.name }))}`;
  
  // Selecciona la primera opción por defecto después de 2 segundos
  const timeout = setTimeout(() => {
    form.i.selectedIndex = 0;
    form.dispatchEvent(new CustomEvent("input"));
  }, 2000);
  
  form.onchange = () => {
    form.dispatchEvent(new CustomEvent("input")); // Safari
  };
  
  form.oninput = (event) => {
    if (event.isTrusted) form.onchange = null, clearTimeout(timeout);
    form.value = options[form.i.selectedIndex].value;
  };
  
  form.value = options[form.i.selectedIndex].value;
  return form;
}

function _chart(d3, DOM, width, height, graph, margin, y, color, arc, step, $0, invalidation) {
  // Limpiar si había un gráfico
  d3.select(DOM).remove();
  
  const svg = d3.select(DOM.svg(width, height));

  // Estilos CSS para el gráfico
  svg.append("style").text(`
    .hover path {
      stroke: #ccc;
    }
    .hover text {
      fill: #ccc;
    }
    .hover g.primary text {
      fill: black;
      font-weight: bold;
    }
    .hover g.secondary text {
      fill: #333;
    }
    .hover path.primary {
      stroke: #333;
      stroke-opacity: 1;
    }
    .highlight-antecedent {
      fill: red;
    }
    .highlight-consequent {
      fill: blue;
    }
    .highlight-both {
      fill: #71FDA2;
    }
  `);

  // Añadir etiquetas de nodos al gráfico
  const label = svg.append("g")
    .attr("font-family", "sans-serif")
    .attr("font-size", 10)
    .attr("text-anchor", "end")
    .selectAll("g")
    .data(graph.nodes)
    .join("g")
    .attr("transform", d => `translate(${margin.left},${d.y = y(d.label)})`)
    .call(g => g.append("text")
      .attr("x", -6)
      .attr("dy", "0.35em")
      .attr("fill", d => d3.lab(color(d.group)).darker(2))
      .text(d => d.label))
    .call(g => g.append("circle")
      .attr("r", 4.5)
      .attr("fill", d => color(d.group)));

  // Añadir arcos entre los nodos
  const path = svg.insert("g", "*")
    .attr("fill", "none")
    .attr("stroke-opacity", 0.6)
    .attr("stroke-width", 1.5)
    .selectAll("path")
    .data(graph.links)
    .join("path")
    .attr("stroke", d => d.source.group === d.target.group ? color(d.source.group) : "#aaa")
    .attr("d", arc);

  // Añadir área de superposición para los eventos de ratón
  const overlay = svg.append("g")
    .attr("fill", "none")
    .attr("pointer-events", "all")
    .selectAll("rect")
    .data(graph.nodes)
    .join("rect")
    .attr("width", margin.left + 40)
    .attr("height", step)
    .attr("y", d => y(d.label) - step / 2)
    .on("mouseover", d => {
      svg.classed("hover", true);
      label.classed("primary", n => n === d);
      label.classed("secondary", n => n.sourceLinks.some(l => l.target === d) || n.targetLinks.some(l => l.source === d));
      path.classed("primary", l => l.source === d || l.target === d).filter(".primary").raise();
      
      label.selectAll("circle").classed("highlight-antecedent", n => n.sourceLinks.some(l => l.target === d) && !n.targetLinks.some(l => l.source === d));
      label.selectAll("circle").classed("highlight-consequent", n => n.targetLinks.some(l => l.source === d) && !n.sourceLinks.some(l => l.target === d));
      label.selectAll("circle").classed("highlight-both", n => n.sourceLinks.some(l => l.target === d) && n.targetLinks.some(l => l.source === d));
    })
    .on("mouseout", d => {
      svg.classed("hover", false);
      label.classed("primary", false);
      label.classed("secondary", false);
      path.classed("primary", false).order();
      label.selectAll("circle").classed("highlight-antecedent", false);
      label.selectAll("circle").classed("highlight-consequent", false);
      label.selectAll("circle").classed("highlight-both", false);
    });

  // Actualizar el gráfico cuando se selecciona una nueva opción de ordenamiento
  function update() {
    y.domain(graph.nodes.sort($0.value).map(d => d.label));

    const t = svg.transition()
      .duration(750);

    label.transition(t)
      .delay((d, i) => i * 20)
      .attrTween("transform", d => {
        const i = d3.interpolateNumber(d.y, y(d.label));
        return t => `translate(${margin.left},${d.y = i(t)})`;
      });

    path.transition(t)
      .duration(750 + graph.nodes.length * 20)
      .attrTween("d", d => () => arc(d));

    overlay.transition(t)
      .delay((d, i) => i * 20)
      .attr("y", d => y(d.label) - step / 2);
  }

  $0.addEventListener("input", update);
  invalidation.then(() => $0.removeEventListener("input", update));

  return svg.node();
}

// Construcción del gráfico y los enlaces
function _graph(data) {
  // Filtrar nodos que no son de tipo "Rule"
  const filteredNodes = data.nodes.filter(d => d.kind !== "Rule");

  // Crear nodos sin enlaces inicialmente
  const nodes = filteredNodes.map(({ label, id, kind }) => ({
    label,
    id,
    kind,
    sourceLinks: [],
    targetLinks: []
  }));

  const nodeById = new Map(nodes.map(d => [d.id, d]));

  // Filtrar nodos "Rule" y crear nuevos enlaces entre nodos no "Rule"
  const ruleNodes = data.nodes.filter(d => d.kind === "Rule");
  const newLinks = [];

  ruleNodes.forEach(rule => {
    const ruleSourceLinks = data.links.filter(l => l.source === rule.id);
    const ruleTargetLinks = data.links.filter(l => l.target === rule.id);

    ruleSourceLinks.forEach(link1 => {
      ruleTargetLinks.forEach(link2 => {
        const sourceNode = nodeById.get(link1.target);
        const targetNode = nodeById.get(link2.source);
        if (sourceNode && targetNode) {
          newLinks.push({
            source: sourceNode,
            target: targetNode,
            confidence: rule.confidence,
            support: rule.support,
            lift: rule.lift
          });
        }
      });
    });

    ruleTargetLinks.forEach(link1 => {
      ruleSourceLinks.forEach(link2 => {
        const sourceNode = nodeById.get(link2.target);
        const targetNode = nodeById.get(link1.source);
        if (sourceNode && targetNode) {
          newLinks.push({
            source: sourceNode,
            target: targetNode,
            confidence: rule.confidence,
            support: rule.support,
            lift: rule.lift
          });
        }
      });
    });
  });

  // Asignar los enlaces a los nodos correspondientes
  for (const link of newLinks) {
    const { source, target } = link;
    source.sourceLinks.push(link);
    target.targetLinks.push(link);
  }

  return { nodes, links: newLinks };
}

// Escala para posicionar los nodos en el eje Y
function _y(d3, graph, margin, height) {
  return d3.scalePoint(graph.nodes.map(d => d.label).sort(d3.ascending), [margin.top, height - margin.bottom]);
}

// Definir márgenes del gráfico
function _margin() {
  return { top: 20, right: 20, bottom: 20, left: 380 };
}

// Calcular la altura del gráfico en función del número de nodos
function _height(data, step, margin) {
  return (data.nodes.filter(d => d.kind !== "Rule").length - 1) * step + margin.top + margin.bottom;
}

// Ajustar la distancia entre los nodos dinámicamente
function _step(data) {
  const minStep = 20; // Valor mínimo del paso
  const maxStep = 50; // Valor máximo del paso
  const nodeCount = data.nodes.filter(d => d.kind !== "Rule").length;
  
  // Calcular el paso basado en la cantidad de nodos, asegurando que esté entre minStep y maxStep
  return Math.max(minStep, Math.min(maxStep, 500 / nodeCount));
}

// Escala de colores para los nodos
function _color(d3, graph) {
  return d3.scaleOrdinal(graph.nodes.map(d => d.group).sort(d3.ascending), d3.schemeCategory10);
}

// Definir el arco entre nodos
function _arc(margin) {
  return function arc(d) {
    const y1 = d.source.y;
    const y2 = d.target.y;
    const r = Math.abs(y2 - y1) / 2;
    return `M${margin.left},${y1}A${r},${r} 0,0,${y1 < y2 ? 1 : 0} ${margin.left},${y2}`;
  };
}

// Cargar datos desde un archivo JSON
function _data(File) {
  return File(localStorage.getItem('global_experiment')).json();
}

// Cargar biblioteca D3.js
function _d3(require) {
  return require("d3@5");
}

async function redefineGraph(support, confidence) {
  var urlToServerData = "selection/get_rule/" + localStorage.getItem('global_experiment');

  const response = await fetch(urlToServerData);
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  const data = await response.json();

  // Filtrar nodos que no son de tipo "Rule"
  const filteredNodes = data.nodes.filter(d => d.kind !== "Rule");

  // Crear nodos sin enlaces inicialmente
  const nodes = filteredNodes.map(({ label, id, kind }) => ({
    label,
    id,
    kind,
    sourceLinks: [],
    targetLinks: []
  }));

  const nodeById = new Map(nodes.map(d => [d.id, d]));

  // Filtrar nodos "Rule" y crear nuevos enlaces entre nodos no "Rule"
  const ruleNodes = data.nodes.filter(d => d.kind === "Rule" && d.support >= support && d.confidence >= confidence);
  const newLinks = [];

  ruleNodes.forEach(rule => {
    const ruleSourceLinks = data.links.filter(l => l.source === rule.id);
    const ruleTargetLinks = data.links.filter(l => l.target === rule.id);

    ruleSourceLinks.forEach(link1 => {
      ruleTargetLinks.forEach(link2 => {
        const sourceNode = nodeById.get(link1.target);
        const targetNode = nodeById.get(link2.source);
        if (sourceNode && targetNode) {
          newLinks.push({
            source: sourceNode,
            target: targetNode,
            confidence: rule.confidence,
            support: rule.support,
            lift: rule.lift
          });
        }
      });
    });

    ruleTargetLinks.forEach(link1 => {
      ruleSourceLinks.forEach(link2 => {
        const sourceNode = nodeById.get(link2.target);
        const targetNode = nodeById.get(link1.source);
        if (sourceNode && targetNode) {
          newLinks.push({
            source: sourceNode,
            target: targetNode,
            confidence: rule.confidence,
            support: rule.support,
            lift: rule.lift
          });
        }
      });
    });
  });

  // Asignar los enlaces a los nodos correspondientes
  for (const link of newLinks) {
    const { source, target } = link;
    source.sourceLinks.push(link);
    target.targetLinks.push(link);
  }

  // Filtrar nodos que tienen al menos un enlace
  const nodesWithLinks = nodes.filter(node => node.sourceLinks.length > 0 || node.targetLinks.length > 0);

  return { nodes: nodesWithLinks, links: newLinks };
}

var urlToData = "../data/rules/" + localStorage.getItem('global_experiment');

export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    [localStorage.getItem('global_experiment'), { url: new URL(urlToData, import.meta.url), mimeType: "application/json", toString }]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer("viewof order")).define("viewof order", ["d3", "html"], _order);
  main.variable("order").define("order", ["Generators", "viewof order"], x => x);
  main.variable(observer("chart")).define("chart", ["d3", "DOM", "width", "height", "graph", "margin", "y", "color", "arc", "step", "viewof order", "invalidation"], _chart);
  main.variable("arc").define("arc", ["margin"], _arc);
  main.variable("y").define("y", ["d3", "graph", "margin", "height"], _y);
  main.variable("margin").define("margin", _margin);
  main.variable("height").define("height", ["data", "step", "margin"], _height);
  main.variable("step").define("step", ["data"], _step);
  main.variable("color").define("color", ["d3", "graph"], _color);
  main.variable("graph").define("graph", ["data"], _graph);
  main.variable("data").define("data", ["FileAttachment"], _data);
  main.variable("d3").define("d3", ["require"], _d3);
  main.variable("redefineGraph").define("redefineGraph", ["support", "confidence"], redefineGraph);

  document.addEventListener('DOMContentLoaded', function() {
    const supportSlider = document.getElementById('supportSlider');
    const confidenceSlider = document.getElementById('confidenceSlider');
    
    function updateGraph() {
      const supportValue = parseFloat(supportSlider.value);
      const confidenceValue = parseFloat(confidenceSlider.value);
    
      document.getElementById('supportValue').innerText = supportValue.toFixed(2);
      document.getElementById('confidenceValue').innerText = confidenceValue.toFixed(2);
    
      // Lógica para actualizar el gráfico con los nuevos valores de soporte y confianza
      main.redefine("graph", async () => {
        return await redefineGraph(supportValue, confidenceValue);
      });
    }
    
    supportSlider.addEventListener('input', updateGraph);
    confidenceSlider.addEventListener('input', updateGraph);
    });

  return main;
}
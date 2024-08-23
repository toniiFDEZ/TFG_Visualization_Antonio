// Arrows
// var urlToData = "selection/get_rule/" + localStorage.getItem('global_experiment');
// d3.json(urlToData).then(data => {
//     console.log(data);

//     // Specify the initial dimensions of the chart.
//     let width = 1200;
//     let height = 800;

//     // Specify the color scale.
//     const ruleColor = "#ff7f0e"; // Color for rule nodes
//     const defaultNodeColor = "#1f77b4"; // Color for other nodes
//     const supportScale = d3.scaleLinear().domain(d3.extent(data.nodes, d => d.support || 1)).range([6, 14]);
//     const confidenceScale = d3.scaleLinear().domain(d3.extent(data.nodes, d => d.confidence || 1)).range([6, 14]);
//     const liftScale = d3.scaleLinear().domain(d3.extent(data.nodes, d => d.lift || 1)).range(["blue", "red"]);

//     // Create the selector
//     const selector = d3.select("#networkDiagram")
//         .append("select")
//         .attr("id", "linkVisualizationSelector")
//         .on("change", updateVisualization);

//     selector.selectAll("option")
//         .data(["support", "confidence", "lift"])
//         .enter()
//         .append("option")
//         .text(d => d)
//         .attr("value", d => d);

//     // Create the information box for related nodes
//     const infoBox = d3.select("#networkDiagram")
//         .append("div")
//         .attr("id", "infoBox")
//         .style("position", "absolute")
//         .style("top", "10px")
//         .style("right", "10px")
//         .style("background-color", "white")
//         .style("padding", "10px")
//         .style("border", "1px solid #ccc")
//         .style("display", "none");

//     // The force simulation mutates links and nodes, so create a copy
//     // so that re-evaluating this cell produces the same result.
//     const links = data.links.map(d => ({ ...d }));
//     const nodes = data.nodes.map(d => ({ ...d }));

//     // Create a simulation with several forces.
//     const simulation = d3.forceSimulation(nodes)
//         .force("link", d3.forceLink(links).id(d => d.id).distance(80)) // Aumentar la distancia fija de los enlaces
//         .force("charge", d3.forceManyBody().strength(-50)) // Reducir la fuerza de repulsión
//         .force("center", d3.forceCenter(width / 2, height / 2))
//         .force("collision", d3.forceCollide().radius(d => d.label.startsWith("Rule") ? getNodeSize(d, "support") + 6 : 10)) // Evita la superposición
//         .on("tick", ticked);

//     // Create the SVG container.
//     const svg_network = d3.select("#networkDiagram")
//         .append("svg")
//             .attr("width", width)
//             .attr("height", height)
//             .attr("viewBox", [0, 0, width, height])
//             .attr("style", "max-width: 100%; height: auto;")
//             .call(d3.zoom().on("zoom", (event) => {
//                 networkGroup.attr("transform", event.transform);
//             }));

//     // Define the arrowhead marker
//     svg_network.append("defs").append("marker")
//         .attr("id", "arrowhead")
//         .attr("viewBox", "0 -5 10 10")
//         .attr("refX", 13)
//         .attr("refY", 0)
//         .attr("markerWidth", 6)
//         .attr("markerHeight", 6)
//         .attr("orient", "auto")
//         .append("path")
//         .attr("d", "M0,-5L10,0L0,5")
//         .attr("fill", "#999");

//     const networkGroup = svg_network.append("g");

//     // Add a line for each link, and a circle for each node.
//     const link = networkGroup.append("g")
//             .attr("stroke", "#999")
//             .attr("stroke-opacity", 0.6)
//         .selectAll("line")
//         .data(links)
//         .join("line")
//             .attr("stroke-width", 1.5)
//             .attr("marker-end", "url(#arrowhead)"); // Attach the arrowhead marker

//     const node = networkGroup.append("g")
//             .attr("stroke", "#fff")
//             .attr("stroke-width", 1.5)
//         .selectAll("circle")
//         .data(nodes)
//         .join("circle")
//             .attr("r", d => d.label.startsWith("Rule") ? getNodeSize(d, "support") : 6)  // Tamaño basado en el soporte inicialmente
//             .attr("fill", d => d.label.startsWith("Rule") ? ruleColor : defaultNodeColor)  // Color basado en el tipo de nodo
//             .on("mouseover", handleMouseOver)  // Add event listeners
//             .on("mouseout", handleMouseOut)
//             .on("click", handleClick); // Add click event listener

//     node.append("title")
//         .text(d => d.label);

//     // Add node labels (initially hidden)
//     const labels = networkGroup.append("g")
//         .selectAll("text")
//         .data(nodes)
//         .join("text")
//         .attr("dy", -10)
//         .attr("dx", 10)
//         .attr("class", "node-label")
//         .attr("visibility", "hidden") // Hide labels initially
//         .text(d => d.label);

//     // Add a drag behavior.
//     node.call(d3.drag()
//         .on("start", dragstarted)
//         .on("drag", dragged)
//         .on("end", dragended));

//     // Set the position attributes of links and nodes each time the simulation ticks.
//     function ticked() {
//         link
//             .attr("x1", d => d.source.x)
//             .attr("y1", d => d.source.y)
//             .attr("x2", d => d.target.x)
//             .attr("y2", d => d.target.y);

//         node
//             .attr("cx", d => d.x)
//             .attr("cy", d => d.y);

//         labels
//             .attr("x", d => d.x)
//             .attr("y", d => d.y);
//     }

//     // Show label on mouse over
//     function handleMouseOver(event, d) {
//         // d3.select(this).attr("r", 10); // Optional: increase node size on hover
//         labels
//             .filter(node => node.id === d.id)
//             .attr("visibility", "visible");
//     }

//     // Hide label on mouse out
//     function handleMouseOut(event, d) {
//         //d3.select(this).attr("r", d => nodeScale(d.support || 1)); // Optional: reset node size on mouse out
//         labels
//             .filter(node => node.id === d.id)
//             .attr("visibility", "hidden");

//         infoBox.style("display", "none");
//     }

//     // Show node properties on click
//     function handleClick(event, d) {
//         if (d.label.startsWith("Rule")) {
//             showRuleInfoBox(d);
//         } else {
//             showInfoBox(d);
//         }
//     }

//     function highlightNodeAndRelated(d, highlight) {
//         const relatedNodes = new Set();
//         links.forEach(link => {
//             if (link.source.id === d.id) {
//                 relatedNodes.add(link.target.id);
//             } else if (link.target.id === d.id) {
//                 relatedNodes.add(link.source.id);
//             }
//         });
//         relatedNodes.add(d.id); // Include the dragged node itself
    
//         // Change color of the related nodes and show their labels
//         node.attr("fill", node => relatedNodes.has(node.id) ? (highlight ? 'red' : node.label.startsWith("Rule") ? ruleColor : defaultNodeColor) : node.label.startsWith("Rule") ? ruleColor : defaultNodeColor);

//         // Show labels of related nodes
//         labels.attr("visibility", label => relatedNodes.has(label.id) && !label.label.startsWith("Rule") ? "visible" : "hidden");
//     }

//     // Reheat the simulation when drag starts, and fix the subject position.
//     function dragstarted(event, d) {
//         if (!event.active) simulation.alphaTarget(0.3).restart();
//         event.subject.fx = event.subject.x;
//         event.subject.fy = event.subject.y;

//         // Highlight the dragged node and its related nodes
//         highlightNodeAndRelated(d, true);
//     }

//     // Update the subject (dragged node) position during drag.
//     function dragged(event, d) {
//         event.subject.fx = event.x;
//         event.subject.fy = event.y;
//     }

//     // Restore the target alpha so the simulation cools after dragging ends.
//     // Unfix the subject position now that it’s no longer being dragged.
//     function dragended(event, d) {
//         if (!event.active) simulation.alphaTarget(0);
//         event.subject.fx = null;
//         event.subject.fy = null;

//         // Reset the color of the dragged node and its related nodes
//         highlightNodeAndRelated(d, false);

//         // Reset related node colors to default after dragging ends
//         node.attr("fill", d => d.label.startsWith("Rule") ? ruleColor : defaultNodeColor);

//         // Hide labels of related nodes
//         labels.attr("visibility", "hidden");
//     }

//     function showNonRuleNodeInfo(d) {
//         // Encuentra los nodos relacionados con el nodo no-Rule
//         const relatedNodes = links.filter(link => link.source.id === d.id || link.target.id === d.id)
//             .map(link => {
//                 let relatedNode = link.source.id === d.id ? link.target : link.source;
//                 let relation = link.kind === 1 ? "Antecedent" : link.kind === 2 ? "Consequent" : "Unknown";
//                 return {
//                     node: relatedNode,
//                     relation: relation
//                 };
//             })
//             .filter(related => !related.node.label.startsWith("Rule"));

//         // Construye el contenido HTML del infoBox
//         let html = `<strong>${d.label}</strong><br>`;
//         html += `<strong>Related Nodes:</strong><ul>`;
//         relatedNodes.forEach(r => {
//             html += `<li>${r.node.label} (${r.relation})</li>`;
//             node.filter(nd => nd.id === r.node.id).attr("fill", r.relation === "Antecedent" ? "green" : "yellow");
//         });
//         html += `</ul>`;

//         // Actualiza el contenido del infoBox y lo muestra
//         infoBox.html(html)
//             .style("display", "block");
//     }

//     // Function to update visualization based on the selected option
//     function updateVisualization() {
//         const selectedOption = d3.select("#linkVisualizationSelector").property("value");

//         node.attr("r", d => d.label.startsWith("Rule") ? getNodeSize(d, selectedOption) : 6); // Update node size based on selected option

//         node.attr("fill", d => {
//             if (selectedOption === "lift") {
//                 return liftScale(d.lift || 1);
//             } else {
//                 return d.label.startsWith("Rule") ? ruleColor : defaultNodeColor; // Default color
//             }
//         });

//         link.attr("stroke", d => {
//             if (selectedOption === "lift") {
//                 return liftScale(d.lift || 1);
//             } else {
//                 return "#999"; // Default color if not using lift
//             }
//         });
//     }

//     function getNodeSize(d, metric) {
//         if (metric === "support") {
//             return supportScale(d.support || 1);
//         } else if (metric === "confidence") {
//             return confidenceScale(d.confidence || 1);
//         } else {
//             return 6; // Default size
//         }
//     }

//     function showRuleInfoBox(d) {
//         // Encuentra los nodos que tienen este nodo como target o source
//         const relatedNodes = links.filter(link => link.source.id === d.id || link.target.id === d.id)
//             .map(link => {
//                 return {
//                     relatedNode: link.source.id === d.id ? link.target : link.source,
//                     relation: link.kind === 1 ? "Antecedent" : link.kind === 2 ? "Consequent" : "Unknown"
//                 };
//             });
    
//         // Construye el contenido HTML del infoBox
//         let html = `<strong>Rule Properties:</strong><br>`;
//         html += `Support: ${d.support}<br>`;
//         html += `Confidence: ${d.confidence}<br>`;
//         html += `Lift: ${d.lift}<br>`;
//         html += `Antecedent support: ${d["antecedent supp"]}<br>`;
//         html += `Consequent support: ${d["consequent supp"]}<br>`;
//         html += `<strong>Related Nodes:</strong><ul>`;
//         relatedNodes.forEach(r => {
//             html += `<li>${r.relation}: ${r.relatedNode.label}</li>`;
//         });
//         html += `</ul>`;
    
//         // Actualiza el contenido del infoBox y lo muestra
//         infoBox.html(html)
//             .style("display", "block");
//     }

//     function showInfoBox(d) {
//         const relatedRules = links.filter(link => link.source.id === d.id || link.target.id === d.id)
//             .map(link => link.source.id === d.id ? link.target : link.source)
//             .filter(node => node.label.startsWith("Rule"));
    
//         if (relatedRules.length === 0) {
//             infoBox.style("display", "none");
//             return;
//         }
    
//         let html = `<strong>Related Rules for ${d.label}:</strong><ul>`;
//         relatedRules.forEach(ruleNode => {
//             const relatedNonRules = links.filter(link => link.source.id === ruleNode.id || link.target.id === ruleNode.id)
//                 .map(link => {
//                     let relatedNode = link.source.id === ruleNode.id ? link.target : link.source;
//                     let relation = link.kind === 1 ? "Antecedent" : link.kind === 2 ? "Consequent" : "Unknown";
//                     return {
//                         node: relatedNode,
//                         relation: relation
//                     };
//                 })
//                 .filter(related => !related.node.label.startsWith("Rule") && related.node.id !== d.id)
//                 .map(related => `${related.node.label} (${related.relation})`)
//                 .join(", ");
//             html += `<li>${ruleNode.label}: ${relatedNonRules}</li>`;
//         });
//         html += `</ul>`;
    
//         infoBox.html(html)
//             .style("display", "block");
//     }

//     // Initial update to set the visualization
//     updateVisualization();

//     // When this cell is re-run, stop the previous simulation. (This doesn’t
//     // really matter since the target alpha is zero and the simulation will
//     // stop naturally, but it’s a good practice.)
//     invalidation.then(() => simulation.stop());
// });
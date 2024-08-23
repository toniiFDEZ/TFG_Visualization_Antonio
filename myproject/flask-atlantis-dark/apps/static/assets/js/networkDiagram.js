var urlToData = "selection/get_rule/" + localStorage.getItem('global_experiment');

let simulation, links, nodes, width = 1200, height = 800;
const ruleColor = "#ff7f0e";
const defaultNodeColor = "#1f77b4";
const supportScale = d3.scaleLinear().range([5, 10]);
const confidenceScale = d3.scaleLinear().range([5, 10]);

// Función para actualizar las fuerzas en la simulación
function updateForces(forceType) {
    if (!simulation) return;

    // Resetear las fuerzas actuales
    simulation
        .force("link", null)
        .force("charge", null)
        .force("x", null)
        .force("y", null)
        .force("center", null)
        .force("collision", null); // Valor base para resetear las fuerzas

    const nodeCount = nodes.length;

    // Actualizar las fuerzas según el tipo seleccionado
    if (forceType === 'default') {
        simulation
            .force("link", d3.forceLink(links).id(d => d.id).distance(d => 40 + nodeCount * 0.3))
            .force("charge", d3.forceManyBody().strength(-30 - nodeCount * 0.2))
            .force("x", null)
            .force("y", null)
            .force("center", d3.forceCenter(width / 2, height / 2))
            .force("collision", d3.forceCollide().radius(d => d.label.startsWith("Rule") ? getNodeSize(d, "support") + 10 : 5))
            .force("radial", null);
    } else if (forceType === 'centered') {
        simulation
            .force("link", d3.forceLink(links).id(d => d.id).distance(d => 50 + nodeCount * 0.5))
            .force("charge", d3.forceManyBody().strength(-30 - nodeCount * 0.2))
            .force("x", d3.forceX())
            .force("y", d3.forceY())
            .force("center", d3.forceCenter(width / 2, height / 2))
            .force("collision", d3.forceCollide().radius(d => d.label.startsWith("Rule") ? getNodeSize(d, "support") + 2 : 16))
            .force("radial", null);
    } else if (forceType === 'high-repulsion') {
        simulation
            .force("link", d3.forceLink(links).id(d => d.id).distance(d => 60 + nodeCount * 0.6))
            .force("charge", d3.forceManyBody().strength(-30 - nodeCount * 0.5))
            .force("x", null)
            .force("y", null)
            .force("center", d3.forceCenter(width / 2, height / 2))
            .force("collision", d3.forceCollide().radius(d => d.label.startsWith("Rule") ? getNodeSize(d, "support") + 12 : 12))
            .force("radial", null);
    } else if (forceType === 'rules-center') {
        simulation
            .force("link", d3.forceLink(links).id(d => d.id).distance(d => 50 + nodeCount * 0.2))
            .force("charge", d3.forceManyBody().strength(-60 - nodeCount * 0.5))
            .force("center", d3.forceCenter(width / 2, height / 2))
            .force("collision", d3.forceCollide().radius(16))
            .force("radial", d3.forceRadial(d => d.label.startsWith("Rule") ? 0 : Math.min(width, height) / 2, width / 2, height / 2).strength(0.3));
    }

    simulation.alpha(1).restart();
}

function getNodeSize(d, metric) {
    if (metric === "support") {
        return supportScale(d.support || 1);
    } else if (metric === "confidence") {
        return confidenceScale(d.confidence || 1);
    } else {
        return 6; // Default size
    }
}

let labelsVisible = false;  // Estado inicial de la visibilidad de las etiquetas

function toggleLabels() {
    labelsVisible = !labelsVisible;  // Cambiar el estado
    d3.selectAll('.node-label')  // Seleccionar todas las etiquetas de nodos
        .filter(d => !d.label.startsWith("Rule"))  // Filtrar para incluir solo las etiquetas de nodos no regla
        .attr('visibility', labelsVisible ? 'visible' : 'hidden');  // Alternar la visibilidad
}

// function updateKindFilter() {
//     const selectedKinds = new Set();
//     d3.selectAll(".kind-checkbox:checked").each(function() {
//         selectedKinds.add(this.value);
//     });

//     d3.selectAll("circle")
//         .style("opacity", d => selectedKinds.has(d.kind) ? 1 : 0.2);

//     d3.selectAll("path")
//         .style("visibility", d => selectedKinds.has(d.source.kind) && selectedKinds.has(d.target.kind) ? 'visible' : 'hidden');

//     // d3.selectAll("line")
//     //      .style("visibility", d => selectedKinds.has(d.source.kind) && selectedKinds.has(d.target.kind) ? 'visible' : 'hidden');
// }

function updateKindFilter() {
    const selectedKinds = new Set();
    d3.selectAll(".kind-checkbox:checked").each(function() {
      selectedKinds.add(this.value);
    });
  
    d3.selectAll("circle")
      .style("opacity", d => selectedKinds.has(d.kind) ? 1 : 0.2);
  
    d3.selectAll("path")
      .style("visibility", d => {
        // Asegúrate de que d.source y d.target existen antes de acceder a sus propiedades
        const sourceVisible = d.source && selectedKinds.has(d.source.kind);
        const targetVisible = d.target && selectedKinds.has(d.target.kind);
        return (sourceVisible && targetVisible) ? 'visible' : 'hidden';
      });
  }

// Función para actualizar el diagrama de red
function updateNetworkDiagram(supportThreshold, confidenceThreshold) {
    d3.json(urlToData).then(data => {
        const liftScale = d3.scaleLinear().domain(d3.extent(data.nodes, d => d.lift || 1)).range(["yellow", "Green"]);

        // Limpiar el gráfico anterior
        d3.select("#networkDiagram svg").remove();
        d3.select("#linkVisualizationSelector").remove();

        // Create the selector
        const selector = d3.select("#networkDiagram")
            .append("select")
            .attr("id", "linkVisualizationSelector")
            .on("change", updateVisualization);

        selector.selectAll("option")
            .data(["support", "confidence", "lift"])
            .enter()
            .append("option")
            .text(d => d)
            .attr("value", d => d);

        // Create the information box for related nodes
        const infoBox = d3.select("#networkDiagram")
            .append("div")
            .attr("id", "infoBox")
            .style("position", "absolute")
            .style("top", "200px")
            .style("right", "50px")
            .style("background-color", "white")
            .style("padding", "10px")
            .style("border", "1px solid #ccc")
            .style("display", "none");

        // Filtrar nodos según los umbrales
        initialNodes = data.nodes.filter(d =>
            (d.kind !== "Rule") || (d.support >= supportThreshold && d.confidence >= confidenceThreshold)
        );

        nodesIds = new Set(initialNodes.map(d => d.id));

        // Filtrar enlaces que conectan nodos filtrados
        links = data.links.filter(d =>
            nodesIds.has(d.source) && nodesIds.has(d.target)
        );

        // Crear un conjunto de nodos conectados
        const connectedNodeIds = new Set();
        links.forEach(link => {
            connectedNodeIds.add(link.source);
            connectedNodeIds.add(link.target);
        });

        // Filtrar nodos para incluir solo los conectados
        nodes = initialNodes.filter(d => connectedNodeIds.has(d.id));

        const nodeCount = nodes.length;

        // Create a simulation with several forces.
        simulation = d3.forceSimulation(nodes)
            .force("link", d3.forceLink(links).id(d => d.id).distance(d => 40 + nodeCount * 0.3))
            .force("charge", d3.forceManyBody().strength(-30 - nodeCount * 0.4))
            .force("center", d3.forceCenter(width / 2, height / 2))
            .force("collision", d3.forceCollide().radius(d => getNodeSize(d, "support") + 5))
            .on("tick", ticked);

        updateForces('default'); // Establecer fuerzas por defecto inicialmente

        // Create the SVG container.
        const svg_network = d3.select("#networkDiagram")
            .append("svg")
            .attr("width", width)
            .attr("height", height)
            .attr("viewBox", [0, 0, width, height])
            .attr("style", "max-width: 100%; height: auto;")
            .call(d3.zoom().on("zoom", (event) => {
                networkGroup.attr("transform", event.transform);
            }));

        const networkGroup = svg_network.append("g");

        // Add a line for each link, and a circle for each node.
        const link = networkGroup.append("g")
            .attr("stroke-opacity", 0.75)
            .selectAll("line")
            .data(links)
            .join("line")
            .attr("stroke-width", 0.85)
            .attr("stroke", d => d.kind === 2 ? "red" : d.kind === 1 ? "blue" : "#999"); // Color based on link kind

        const node = networkGroup.append("g")
            .attr("stroke", "#fff")
            .attr("stroke-width", 1.5)
            .selectAll("circle")
            .data(nodes)
            .join("circle")
            .attr("r", d => d.label.startsWith("Rule") ? getNodeSize(d, "support") : 6)  // Tamaño basado en el soporte inicialmente
            .attr("fill", d => d.label.startsWith("Rule") ? ruleColor : defaultNodeColor)  // Color basado en el tipo de nodo
            .on("mouseover", handleMouseOver)  // Add event listeners
            .on("mouseout", handleMouseOut)
            .on("click", handleClick); // Add click event listener

        node.append("title")
            .text(d => d.label);

        // Add node labels (initially hidden)
        const labels = networkGroup.append("g")
            .selectAll("text")
            .data(nodes)
            .enter()
            .append("text")
            .attr("dy", -10)
            .attr("dx", 10)
            .attr("class", "node-label")  // Asegúrate de que esta clase esté aquí
            .attr("visibility", "hidden") // Inicia con las etiquetas ocultas
            .text(d => d.label);

        // Add a drag behavior.
        node.call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));

        // Set the position attributes of links and nodes each time the simulation ticks.
        function ticked() {
            link
                .attr("x1", d => d.source.x)
                .attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y);

            node
                .attr("cx", d => d.x)
                .attr("cy", d => d.y);

            labels
                .attr("x", d => d.x)
                .attr("y", d => d.y);
        }

        // Show label on mouse over
        function handleMouseOver(event, d) {
            labels
                .filter(node => node.id === d.id)
                .attr("visibility", "visible");
        }

        // Hide label on mouse out
        function handleMouseOut(event, d) {
            labels
                .filter(node => node.id === d.id)
                .attr("visibility", labelsVisible ? !d.label.startsWith("Rule") ? "visible" : "hidden" : "hidden");
        }

        // Show node properties on click
        function handleClick(event, d) {
            if (d.label.startsWith("Rule")) {
                showRuleInfoBox(d);
            } else {
                showInfoBox(d);
            }
            event.stopPropagation(); // Prevent the click event from propagating to the SVG container
        }

        function highlightNodeAndRelated(d, highlight) {
            const relatedNodes = new Set();
            const ruleNodes = new Set(); // Almacena los nodos Regla conectados al nodo seleccionado

            // Verificar si el nodo seleccionado es una Regla o no
            if (!d.label.startsWith("Rule")) {
                // Si no es Regla, encuentra todos los nodos Regla directamente conectados
                links.forEach(link => {
                    if (link.source.id === d.id && link.target.label.startsWith("Rule")) {
                        ruleNodes.add(link.target.id);
                    } else if (link.target.id === d.id && link.source.label.startsWith("Rule")) {
                        ruleNodes.add(link.source.id);
                    }
                });

                // Agregar a los nodos relacionados y buscar nodos NoRegla conectados a estos nodos Regla
                ruleNodes.forEach(ruleId => {
                    relatedNodes.add(ruleId); // Añade el nodo Regla a los relacionados
                    links.forEach(link => {
                        if (link.source.id === ruleId && !link.target.label.startsWith("Rule")) {
                            relatedNodes.add(link.target.id);
                        } else if (link.target.id === ruleId && !link.source.label.startsWith("Rule")) {
                            relatedNodes.add(link.source.id);
                        }
                    });
                });
            } else {
                // Si es Regla, encuentra todos los nodos NoRegla directamente conectados
                links.forEach(link => {
                    if (link.source.id === d.id && !link.target.label.startsWith("Rule")) {
                        relatedNodes.add(link.target.id);
                    } else if (link.target.id === d.id && !link.source.label.startsWith("Rule")) {
                        relatedNodes.add(link.source.id);
                    }
                });
            }

            relatedNodes.add(d.id); // Añadir el nodo seleccionado a los relacionados

            // Cambiar el color de los nodos relacionados y mostrar sus etiquetas
            node.attr("fill", node => {
                const selectedOption = d3.select("#linkVisualizationSelector").property("value");
                if (relatedNodes.has(node.id)) {
                    if (highlight) {
                        return 'red';  // Todos los nodos relacionados se colorean de rojo si están destacados
                    } else {
                        // Color dinámico en función de la opción seleccionada
                        if (node.label.startsWith("Rule")) {
                            if (selectedOption === "lift") {
                                return liftScale(node.lift || 1); // Usa el valor de lift para determinar el color
                            } else {
                                return ruleColor; // Color estándar de reglas si no se elige "lift"
                            }
                        } else {
                            return defaultNodeColor; // Color por defecto para nodos que no son Regla
                        }
                    }
                } else {
                    // Aplicar color por defecto o en base al "lift" si el nodo es una Regla
                    if (node.label.startsWith("Rule")) {
                        if (selectedOption === "lift") {
                            return liftScale(node.lift || 1); // Usa el valor de lift para determinar el color
                        } else {
                            return ruleColor; // Color estándar de reglas si no se elige "lift"
                        }
                    } else {
                        return defaultNodeColor; // Color por defecto para nodos que no son Regla
                    }
                }
            });

            // Mostrar etiquetas de nodos relacionados
            labels.attr("visibility", label => {
                // Verifica si el nodo está en relatedNodes y no es una Regla
                if (relatedNodes.has(label.id) && !label.label.startsWith("Rule")) {
                    return "visible";
                } else {
                    return "hidden";
                }
            });
        }

        // Reheat the simulation when drag starts, and fix the subject position.
        function dragstarted(event, d) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            event.subject.fx = event.subject.x;
            event.subject.fy = event.subject.y;

            // Highlight the dragged node and its related nodes
            highlightNodeAndRelated(d, true);
        }

        // Update the subject (dragged node) position during drag.
        function dragged(event, d) {
            event.subject.fx = event.x;
            event.subject.fy = event.y;
        }

        // Restore the target alpha so the simulation cools after dragging ends.
        // Unfix the subject position now that it’s no longer being dragged.
        function dragended(event, d) {
            if (!event.active) simulation.alphaTarget(0);
            event.subject.fx = null;
            event.subject.fy = null;

            const selectedOption = d3.select("#linkVisualizationSelector").property("value");

            // Reset the color of the dragged node and its related nodes
            highlightNodeAndRelated(d, false);

            // Reset related node colors to default after dragging ends
            node.attr("fill", d => {
                if (selectedOption === "lift") {
                    return d.label.startsWith("Rule") ? liftScale(d.lift || 1) : defaultNodeColor;
                } else {
                    return d.label.startsWith("Rule") ? ruleColor : defaultNodeColor; // Default color
                }
            });

            // Hide labels of related nodes
            labels.attr("visibility", d => {
                if (!d.label.startsWith("Rule")) {  // Verificar si el nodo no es una regla
                    return labelsVisible ? "visible" : "hidden";  // Mostrar si labelsVisible es true, de lo contrario ocultar
                } else {
                    return "hidden";  // Las etiquetas de reglas siempre estarán ocultas
                }
            });
        }

        function showRuleInfoBox(d) {
            // Encuentra los nodos que tienen este nodo como target o source
            const relatedNodes = links.filter(link => link.source.id === d.id || link.target.id === d.id)
                .map(link => {
                    return {
                        relatedNode: link.source.id === d.id ? link.target : link.source,
                        relation: link.kind === 1 ? "Antecedent" : link.kind === 2 ? "Consequent" : "Unknown"
                    };
                });

            // Construye el contenido HTML del infoBox
            let html = `<strong>Rule Properties:</strong><br>`;
            html += `Support: ${d.support}<br>`;
            html += `Confidence: ${d.confidence}<br>`;
            html += `Lift: ${d.lift}<br>`;
            html += `Antecedent support: ${d["antecedent supp"]}<br>`;
            html += `Consequent support: ${d["consequent supp"]}<br>`;
            html += `<strong>Related Nodes:</strong><ul>`;
            relatedNodes.forEach(r => {
                html += `<li>${r.relation}: ${r.relatedNode.label}</li>`;
            });
            html += `</ul>`;

            // Actualiza el contenido del infoBox y lo muestra
            infoBox.html(html)
                .style("display", "block");
        }

        function showInfoBox(d) {
            const relatedRules = links.filter(link => link.source.id === d.id || link.target.id === d.id)
                .map(link => {
                    let relatedNode = link.source.id === d.id ? link.target : link.source;
                    let relationSelfNode = link.kind === 1 ? "Antecedent" : link.kind === 2 ? "Consequent" : "Unknown";
                    return {
                        relatedNode: relatedNode,
                        relationSelfNode: relationSelfNode
                    };
                })
                .filter(item => item.relatedNode.label.startsWith("Rule"));

            if (relatedRules.length === 0) {
                infoBox.style("display", "none");
                return;
            }

            let html = `<strong>Related Rules for ${d.label}:</strong><ul>`;
            relatedRules.forEach(ruleItem => {
                let ruleNode = ruleItem.relatedNode;
                let relationSelfNode = ruleItem.relationSelfNode;
                const relatedNonRules = links.filter(link => link.source.id === ruleNode.id || link.target.id === ruleNode.id)
                    .map(link => {
                        let relatedNode = link.source.id === ruleNode.id ? link.target : link.source;
                        let relation = link.kind === 1 ? "Antecedent" : link.kind === 2 ? "Consequent" : "Unknown";
                        return {
                            node: relatedNode,
                            relation: relation
                        };
                    })
                    .filter(related => !related.node.label.startsWith("Rule") && related.node.id !== d.id)
                    .map(related => `${related.node.label} (${related.relation})`)
                    .join(", ");
                html += `<li>${ruleNode.label} (${relationSelfNode}) for: ${relatedNonRules}</li>`;
            });
            html += `</ul>`;

            infoBox.html(html)
                .style("display", "block");
        }

        // Hide info box on click outside nodes
        svg_network.on("click", () => {
            infoBox.style("display", "none");
        });

        // Function to update visualization based on the selected option
        function updateVisualization() {
            const selectedOption = d3.select("#linkVisualizationSelector").property("value");

            node.attr("r", d => d.label.startsWith("Rule") ? getNodeSize(d, selectedOption) : 6); // Update node size based on selected option

            node.attr("fill", d => {
                if (selectedOption === "lift") {
                    return d.label.startsWith("Rule") ? liftScale(d.lift || 1) : defaultNodeColor;
                } else {
                    return d.label.startsWith("Rule") ? ruleColor : defaultNodeColor; // Default color
                }
            });

            link.attr("stroke", d => {
                return d.kind === 2 ? "red" : d.kind === 1 ? "blue" : "#999"; // Default color based on link kind
            });

            updateKindFilter(); // Actualizar el filtro de tipo de nodo
        }

        // Initial update to set the visualization
        updateVisualization();

        // Add event listener for kind filter checkboxes
        d3.selectAll(".kind-checkbox").on("change", updateKindFilter);

    });
}

// Inicializar el diagrama con valores por defecto
updateNetworkDiagram(0.1, 0.1);

document.getElementById("supportSlider").addEventListener("input", (event) => {
    const supportThreshold = event.target.value;
    document.getElementById("supportValue").textContent = supportThreshold;
    const confidenceThreshold = document.getElementById("confidenceSlider").value;
    updateNetworkDiagram(supportThreshold, confidenceThreshold);
});

document.getElementById("confidenceSlider").addEventListener("input", (event) => {
    const confidenceThreshold = event.target.value;
    document.getElementById("confidenceValue").textContent = confidenceThreshold;
    const supportThreshold = document.getElementById("supportSlider").value;
    updateNetworkDiagram(supportThreshold, confidenceThreshold);
});

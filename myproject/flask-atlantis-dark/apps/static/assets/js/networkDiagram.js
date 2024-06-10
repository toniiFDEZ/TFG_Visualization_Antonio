var urlToData = "selection/get_rule/" + localStorage.getItem('global_experiment');
d3.json(urlToData).then(data => {
    console.log(data);

    // Specify the dimensions of the chart.
    const width = 1200;
    const height = 800;

    // Specify the color scale.
    const color = d3.scaleOrdinal(d3.schemeCategory10);
    const supportScale = d3.scaleLinear().domain(d3.extent(data.links, d => d.support)).range([20, 100]);
    const confidenceScale = d3.scaleLinear().domain(d3.extent(data.links, d => d.confidence)).range([0.5, 5]);
    const liftScale = d3.scaleLinear().domain(d3.extent(data.links, d => d.lift)).range(["blue", "red"]);

    // The force simulation mutates links and nodes, so create a copy
    // so that re-evaluating this cell produces the same result.
    const links = data.links.map(d => ({ ...d }));
    const nodes = data.nodes.map(d => ({ ...d }));

    // Create a simulation with several forces.
    const simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).id(d => d.id).distance(d => supportScale(d.support))) // Distancia basada en el soporte
        .force("charge", d3.forceManyBody())
        .force("center", d3.forceCenter(width / 2, height / 2))
        .on("tick", ticked);

    // Create the SVG container.
    const svg_network = d3.select("#networkDiagram")
        .append("svg")
            .attr("width", width)
            .attr("height", height)
            .attr("viewBox", [0, 0, width, height])
            .attr("style", "max-width: 100%; height: auto;");

    // Add a line for each link, and a circle for each node.
    const link = svg_network.append("g")
            .attr("stroke", "#999")
            .attr("stroke-opacity", 0.6)
        .selectAll()
        .data(links)
        .join("line")
            .attr("stroke-width", d => confidenceScale(d.confidence))
            .attr("stroke", d => liftScale(d.lift));

    const node = svg_network.append("g")
            .attr("stroke", "#fff")
            .attr("stroke-width", 1.5)
        .selectAll()
        .data(nodes)
        .join("circle")
            .attr("r", 5)
            .attr("fill", d => color(d.group))
            .on("mouseover", handleMouseOver)  // Add event listeners
            .on("mouseout", handleMouseOut);

    node.append("title")
        .text(d => d.id);

    // Add node labels (initially hidden)
    const labels = svg_network.append("g")
        .selectAll("text")
        .data(nodes)
        .join("text")
        .attr("dy", -10)
        .attr("dx", 10)
        .attr("class", "node-label")
        .attr("visibility", "hidden") // Hide labels initially
        .text(d => d.id);

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
        d3.select(this).attr("r", 10); // Optional: increase node size on hover
        labels
            .filter(node => node.id === d.id)
            .attr("visibility", "visible");
    }

    // Hide label on mouse out
    function handleMouseOut(event, d) {
        d3.select(this).attr("r", 5); // Optional: reset node size on mouse out
        labels
            .filter(node => node.id === d.id)
            .attr("visibility", "hidden");
    }

    function highlightNodeAndRelated(d, highlight) {
        const relatedNodes = new Set();
        links.forEach(link => {
            if (link.source.id === d.id) {
                relatedNodes.add(link.target.id);
            } else if (link.target.id === d.id) {
                relatedNodes.add(link.source.id);
            }
        });
        relatedNodes.add(d.id); // Include the dragged node itself
    
        // Change color of the related nodes and show their labels
        node.attr("fill", node => relatedNodes.has(node.id) ? (highlight ? 'red' : color(node.group)) : color(node.group));
        //labels.attr("visibility", label => relatedNodes.has(label.id) ? (highlight ? "visible" : "hidden") : "hidden");
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
    function dragged(event) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
    }

    // Restore the target alpha so the simulation cools after dragging ends.
    // Unfix the subject position now that it’s no longer being dragged.
    function dragended(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;

        // Reset the color of the dragged node and its related nodes
        highlightNodeAndRelated(d, false);
    }

    // When this cell is re-run, stop the previous simulation. (This doesn’t
    // really matter since the target alpha is zero and the simulation will
    // stop naturally, but it’s a good practice.)
    invalidation.then(() => simulation.stop());
});
function loadChordDiagram() {
  const urlToDataTsv = "selection/get_rule_tsv/" + getNameFromRules(localStorage.getItem('global_experiment')) + "_rules.tsv";

  // Verifica si el contenedor SVG ya existe, si es así, elimínalo
  d3.select("#chordDiagram svg").remove();

  // Crea el área svg
  const svg_chord = d3.select("#chordDiagram")
    .append("svg")
      .attr("width", 1085)
      .attr("height", 500);

  // Agrega un grupo para el contenido zoomable
  const zoomableGroup = svg_chord.append("g")
      .attr("transform", "translate(250,250)");

  // Define el comportamiento del zoom
  const zoom = d3.zoom()
    .scaleExtent([1, 10])
    .on("zoom", (event) => {
      zoomableGroup.attr("transform", event.transform);
    });

  // Aplica el comportamiento del zoom al grupo `zoomableGroup`
  svg_chord.call(zoom);

  // Carga los datos TSV
  d3.tsv(urlToDataTsv).then(data => {

    // Parsea los datos para crear una matriz
    const matrix = [];
    const names = [];
    const nameSet = new Set();

    data.forEach(row => {
      const antecedent = row.antecedents.replace(/frozenset\(\{|\}|\)/g, '');
      const consequent = row.consequents.replace(/frozenset\(\{|\}|\)/g, '');
      
      if (!nameSet.has(antecedent)) {
        nameSet.add(antecedent);
        names.push(antecedent);
      }
      if (!nameSet.has(consequent)) {
        nameSet.add(consequent);
        names.push(consequent);
      }
    });

    names.forEach((_, i) => {
      matrix[i] = Array(names.length).fill(0);
    });

    data.forEach(row => {
      const antecedent = row.antecedents.replace(/frozenset\(\{|\}|\)/g, '');
      const consequent = row.consequents.replace(/frozenset\(\{|\}|\)/g, '');
      const value = +row.support;
      const antecedentIndex = names.indexOf(antecedent);
      const consequentIndex = names.indexOf(consequent);
      matrix[antecedentIndex][consequentIndex] = value;
    });

    // Pasa esta matriz a d3.chord(): calculará toda la información necesaria para dibujar arcos y cintas
    const res = d3.chord()
        .padAngle(0.05)
        .sortSubgroups(d3.descending)
        (matrix);

    // Agrega los grupos en la parte interna del círculo
    const group = zoomableGroup
      .datum(res)
      .append("g")
      .selectAll("g")
      .data(d => d.groups)
      .join("g");

    group.append("path")
        .style("fill", "grey")
        .style("stroke", "black")
        .attr("d", d3.arc()
          .innerRadius(230)
          .outerRadius(240)
        )
        .on("click", (event, d) => showDetails(names[d.index])); // Mostrar detalles al hacer clic

    // Añade el texto a cada sector
    group.append("text")
      .each(d => d.angle = (d.startAngle + d.endAngle) / 2)
      .attr("dy", ".35em")
      .attr("transform", d => `
        rotate(${(d.angle * 180 / Math.PI - 90)})
        translate(${(240 + 10)})
        ${d.angle > Math.PI ? "rotate(180)" : ""}
      `)
      .attr("text-anchor", d => d.angle > Math.PI ? "end" : null)
      .text(d => names[d.index]);

    // Agrega un div de tooltip
    const tooltip = d3.select("#chordDiagram")
      .append("div")
      .style("opacity", 0)
      .attr("class", "tooltip")
      .style("background-color", "white")
      .style("border", "solid")
      .style("border-width", "1px")
      .style("border-radius", "5px")
      .style("padding", "10px");

    // Funciones para manejar el tooltip
    const showTooltip = function(event, d) {
      tooltip
        .style("opacity", 1)
        .html("Source: " + names[d.source.index] + "<br>Target: " + names[d.target.index])
        .style("left", (event.x)/2 + "px")
        .style("top", (event.y)/2 + "px");
    };

    const hideTooltip = function(event, d) {
      tooltip
        .transition()
        .style("opacity", 0);
    };

    // Agrega los enlaces entre los grupos
    zoomableGroup
      .datum(res)
      .append("g")
      .selectAll("path")
      .data(d => d)
      .join("path")
        .attr("d", d3.ribbon()
          .radius(220)
        )
        .style("fill", "#69b3a2")
        .style("stroke", "black")
      .on("mouseover", showTooltip)
      .on("mouseleave", hideTooltip);
  });

  // Función para mostrar los detalles de un sector al hacer clic
  function showDetails(name) {
    // Aquí puedes modificar para mostrar más información específica
    d3.select("#chordDetails").html(`<strong>Detalles:</strong><br>Item: ${name}`);
  }
}

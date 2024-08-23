var urlToDataTsv = "selection/get_rule_tsv/" + getNameFromRules(localStorage.getItem('global_experiment')) + "_rules.tsv";

// Función para limpiar los frozenset de los datos
function cleanData(data) {
    return data.map(d => ({
        ...d,
        antecedents: d.antecedents.replace(/frozenset\(\{|\}\)/g, '').replace(/'/g, ''),
        consequents: d.consequents.replace(/frozenset\(\{|\}\)/g, '').replace(/'/g, '')
    }));
}

// Cargar los datos desde el archivo TSV
d3.tsv(urlToDataTsv, d3.autoType).then(data => {
    data = cleanData(data);

    // Especificar las dimensiones del gráfico
    const width = 928;
    const height = 600;
    const marginTop = 25;
    const marginRight = 20;
    const marginBottom = 35;
    const marginLeft = 40;

    // Preparar las escalas para el codificado posicional
    const x = d3.scaleLinear()
      .domain(d3.extent(data, d => d.support)).nice()
      .range([marginLeft, width - marginRight]);

    const y = d3.scaleLinear()
      .domain(d3.extent(data, d => d.confidence)).nice()
      .range([height - marginBottom, marginTop]);

    // Crear el contenedor SVG
    const svg = d3.select("#scatterPlot")
        .append("svg")
            .attr("viewBox", [0, 0, width, height])
            .attr("style", "max-width: 100%; height: auto; font: 10px sans-serif;");

    // Crear los ejes
    svg.append("g")
      .attr("transform", `translate(0,${height - marginBottom})`)
      .call(d3.axisBottom(x).ticks(width / 80))
      .call(g => g.select(".domain").remove())
      .call(g => g.append("text")
          .attr("x", width)
          .attr("y", marginBottom - 4)
          .attr("fill", "currentColor")
          .attr("text-anchor", "end")
          .text("Support →"));

    svg.append("g")
      .attr("transform", `translate(${marginLeft},0)`)
      .call(d3.axisLeft(y))
      .call(g => g.select(".domain").remove())
      .call(g => g.append("text")
          .attr("x", -marginLeft)
          .attr("y", 10)
          .attr("fill", "currentColor")
          .attr("text-anchor", "start")
          .text("↑ Confidence"));

    // Crear la cuadrícula
    svg.append("g")
      .attr("stroke", "currentColor")
      .attr("stroke-opacity", 0.1)
      .call(g => g.append("g")
        .selectAll("line")
        .data(x.ticks())
        .join("line")
          .attr("x1", d => 0.5 + x(d))
          .attr("x2", d => 0.5 + x(d))
          .attr("y1", marginTop)
          .attr("y2", height - marginBottom))
      .call(g => g.append("g")
        .selectAll("line")
        .data(y.ticks())
        .join("line")
          .attr("y1", d => 0.5 + y(d))
          .attr("y2", d => 0.5 + y(d))
          .attr("x1", marginLeft)
          .attr("x2", width - marginRight));

    // Añadir una capa de puntos
    const points = svg.append("g")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 1.5)
        .attr("fill", "blue")
      .selectAll("circle")
      .data(data)
      .join("circle")
        .attr("cx", d => x(d.support))
        .attr("cy", d => y(d.confidence))
        .attr("r", 4)
        .on("mouseover", (event, d) => {
            d3.select("#infoBoxScatter")
                .style("visibility", "visible")
                .html(`${d.antecedents} -> ${d.consequents}`);
        })
        .on("mousemove", (event) => {
            const [mouseX, mouseY] = d3.pointer(event);
            d3.select("#infoBoxScatter")
                .style("top", (mouseY) + "px")
                .style("left", (mouseX + 100) + "px");
        })
        .on("mouseout", () => {
            d3.select("#infoBoxScatter").style("visibility", "hidden");
        });

    // Añadir una capa de etiquetas
    const labels = svg.append("g")
        .attr("font-family", "sans-serif")
        .attr("font-size", 10)
        .selectAll("text")
        .data(data)
        .join("text")
        .attr("dy", "0.35em")
        .attr("x", d => x(d.support) + 7)
        .attr("y", d => y(d.confidence))
        .text(d => `${d.antecedents} -> ${d.consequents}`)
        .attr("class", "data-label");

    // Inicialmente ocultar las etiquetas
    labels.style("display", "none");

    // Funcionalidad del botón para alternar las etiquetas
    d3.select("#toggleLabels").on("click", () => {
        const display = labels.style("display") === "none" ? "block" : "none";
        labels.style("display", display);
    });

    // Crear el infoBoxScatter dentro del SVG
    const infoBoxScatter = d3.select("#scatterPlot")
        .append("div")
        .attr("id", "infoBoxScatter")
        .style("position", "absolute")
        .style("visibility", "hidden")
        .style("background-color", "white")
        .style("border", "1px solid black")
        .style("padding", "5px");

    // Añadir el SVG al documento
    return svg.node();
});

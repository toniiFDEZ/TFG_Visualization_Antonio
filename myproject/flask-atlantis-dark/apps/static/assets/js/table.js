d3.json("/data_nodes/transform_into_nodes/diabetes.csv").then(data => {
    function buildTable() {
        let htmlString = ""

        htmlString += "<table>"
        htmlString += "<tr>"
        htmlString += "<th> antecedents </th>"
        htmlString += "<th> consequents </th>"
        htmlString += "<th> antecedent support </th>"
        htmlString += "<th> consequent support </th>"
        htmlString += "<th> consequent support </th>"
        htmlString += "<th> support </th>"
        htmlString += "<th> confidence </th>"
        htmlString += "<th> lift </th>"
        htmlString += "</tr>"
    }
})
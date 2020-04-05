
// let common = {
//
// };

function setupChartSpace(chart, id, height, width) {

    chart.height = height - chart.margins.top - chart.margins.bottom;
    chart.width = width - chart.margins.left - chart.margins.right;

    lineChart.visualisation = d3.select(id)
        .append("svg")
        .attr("width", chart.width + chart.margins.left + chart.margins.right)
        .attr("height", chart.height + chart.margins.top + chart.margins.bottom)
        .append("g")
        .attr("transform",
            "translate(" + chart.margins.left + "," + chart.margins.top + ")");
}
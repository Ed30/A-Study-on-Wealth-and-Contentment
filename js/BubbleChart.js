
let bubbleChart = {

    boroughs : [],
    years : [],
    selectedYear : "",

    margins : { top: 10, right: 10, bottom: 30, left: 38 },
    height : 0,
    width : 0,
    xAxis : null,
    yAxis : null,

    visualisation : null,
    updatingVisualisation : false

};


Promise.all([
    d3.csv("js/data/mean-income.csv"),
    d3.csv("js/data/mean-happiness.csv"),
    d3.csv("js/data/number-of-individuals.csv"),
]).then(function(data) {

    setupChartSpace(bubbleChart, "#income-happiness-visualisation", 400, 720);

    let meanIncomeData = data[0];
    let meanHappinessData = data[1]; // Years 2012 through 2017 only
    let numberOfIndividualsData = data[2];

    for (let i = 0; i<meanHappinessData.length; i++) {

        let meanIncomes = [];
        let meanHappiness = [];

        for (let year in meanHappinessData[i]) {

            if (i === 0 && !isNaN(year)) {
                bubbleChart.years.push(year);
            }
        }

    }

    addYearsToBubbleChartToolbar();

});

function addYearsToBubbleChartToolbar() {

    bubbleChart.selectedYear = bubbleChart.years[0];

    for (let i = 0; i < bubbleChart.years.length; i++) {
        d3.select("#years-toolbar")
            .append("button")
            .attr("type", "button")
            .attr("name", bubbleChart.years[i])
            .attr("class", "btn btn-outline-primary" + (i === 0 ? " active" : ""))
            .attr("onclick", 'yearSelected(this)')
            .text(function () {
                return "’" + bubbleChart.years[i].slice(-2);
            })
    }
    updateBubbleChartVisualisation();
}

// Selected a new year
function yearSelected(item) {

    d3.select("#years-toolbar")
        .selectAll("*")
        .classed("active", false);

    d3.select(item)
        .classed("active", true);

    let previousYear = selectedYear;
    bubbleChart.selectedYear = $(item).attr("name");

    if (bubbleChart.selectedYear !== previousYear) {
        updateBubbleChartVisualisation();
    }


}

function updateBubbleChartVisualisation() {
    console.log(bubbleChart.selectedYear);
}
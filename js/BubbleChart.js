
let bubbleChart = {

    boroughs : [],
    years : [],
    selectedYear : "",

    maxNumberOfPeople : 0,
    minHappiness : Number.MAX_SAFE_INTEGER,
    maxHappiness :0,

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
    let meanHappinessData = data[1]; // Contains years 2012 through 2017 only
    let numberOfIndividualsData = data[2];

    bubbleChart.years = Object.keys(meanHappinessData[0]);
    bubbleChart.years.splice(-2); //Remove "area" and "code"

    for (let i = 0; i<meanHappinessData.length; i++) {

        let numberOfPeopleValues = [];
        let meanHappinessValues = [];

        for (const year of bubbleChart.years) {

            let numberOfPeople = parseInt(numberOfIndividualsData[i][year].replace(",",""));
            let meanHappiness = parseFloat(meanHappinessData[i][year]);

            numberOfPeopleValues.push(numberOfPeople);
            bubbleChart.maxNumberOfPeople = Math.max(bubbleChart.maxNumberOfPeople, numberOfPeople);

            meanHappinessValues.push(meanHappiness);

            if (!isNaN(meanHappiness)) {
                bubbleChart.maxHappiness = Math.max(bubbleChart.maxHappiness, meanHappiness);
                bubbleChart.minHappiness = Math.min(bubbleChart.minHappiness, meanHappiness);
            }




        }

        common.boroughs[i].numberOfPeople = numberOfPeopleValues;
        common.boroughs[i].meanHappiness = meanHappinessValues;

    }

    console.log(bubbleChart.minHappiness);
    console.log(bubbleChart.maxHappiness);
    console.log(bubbleChart.maxNumberOfPeople);
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

    let previousYear = bubbleChart.selectedYear;
    bubbleChart.selectedYear = $(item).attr("name");

    if (bubbleChart.selectedYear !== previousYear) {
        updateBubbleChartVisualisation();
    }


}

function createBubbleChartVisualisation() {



}

function updateBubbleChartVisualisation() {
    console.log(bubbleChart.selectedYear);
}
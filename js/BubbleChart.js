
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
    maxBubbleRadius : 60,
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

    setupChartSpace(bubbleChart, "#income-happiness-visualisation", 720, 720);

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

            let numberOfPeopleObj = {};
            numberOfPeopleObj[year] = numberOfPeople;
            numberOfPeopleValues.push(numberOfPeopleObj);
            bubbleChart.maxNumberOfPeople = Math.max(bubbleChart.maxNumberOfPeople, numberOfPeople);

            let meanHappinessObj = {};
            meanHappinessObj[year] = meanHappiness;
            meanHappinessValues.push(meanHappinessObj);
            if (!isNaN(meanHappiness)) {
                bubbleChart.maxHappiness = Math.max(bubbleChart.maxHappiness, meanHappiness);
                bubbleChart.minHappiness = Math.min(bubbleChart.minHappiness, meanHappiness);
            }

        }

        common.boroughs[i].numberOfPeople = numberOfPeopleValues;
        common.boroughs[i].meanHappiness = meanHappinessValues;

    }

    addYearsToBubbleChartToolbar();

    createBubbleChartVisualisation();

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
    //updateBubbleChartVisualisation();
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

    //Create (x, y) axes
    bubbleChart.xAxis = d3.scaleLinear()
        .domain([0, common.maxIncome.mean + 20000])
        .range([0, bubbleChart.width]);

    bubbleChart.yAxis = d3.scaleLinear()
        .domain([bubbleChart.minHappiness - 0.1, bubbleChart.maxHappiness + 0.1])
        .range([bubbleChart.height, 0]);

    //Append axes
    bubbleChart.visualisation.append("g")
        .attr("id", "x-axis-bubble")
        .attr("class", "axis")
        .attr("transform", "translate(0," + bubbleChart.height + ")")
        .call(d3.axisBottom(bubbleChart.xAxis)
            .ticks(12)
            .tickFormat(function (d) {
                return d === 0 ? "" : "£" + d3.format(".2s")(d);
            }));

    bubbleChart.visualisation.append("g")
        .attr("id", "y-axis-bubble")
        .attr("class", "axis")
        .call(d3.axisLeft(bubbleChart.yAxis));

    let initialData = getDataForSelectedYear();
    initialData.splice(0, 1);
    initialData.sort((obj1, obj2) => (obj1.numberOfPeople < obj2.numberOfPeople) ? 1 : -1)

    console.log(initialData);

    //Append dots in correspondence of data points
    bubbleChart.visualisation
        .append("g")
        .selectAll(".bubble")
        .data(initialData)
        .enter()
        .append("circle")
        .attr("class", "bubble")
        .attr("cx", function(d) { return bubbleChart.xAxis(d.income) } )
        .attr("cy", function(d) { return bubbleChart.yAxis(d.happiness) } )
        .attr("r", radiusForPopulation);
        // .attr("data-toggle", "tooltip")
        // .attr("data-placement", "top")
        // .attr("data-original-title", function (d) { return d.income })
        // .on("mouseover", function (d) {
        //     mouseOverDataPoint(d, d3.select(this))
        // })
        // .on("mouseout", function () {
        //     mouseOutDataPoint(d3.select(this))
        // });

}

function updateBubbleChartVisualisation() {


    let data = getDataForSelectedYear();
    data.splice(0, 1);
    data.sort((obj1, obj2) => (obj1.numberOfPeople < obj2.numberOfPeople) ? 1 : -1)


    //Update bubble positions
    d3.selectAll(".bubble")
        .data(data)
        .transition()
        .ease(d3.easeElasticInOut.amplitude(1.20).period(1.05))
        .duration(1000)
        .attr("cx", function(d) { return bubbleChart.xAxis(d.income) } )
        .attr("cy", function(d) { return bubbleChart.yAxis(d.happiness) } )
        .attr("r", radiusForPopulation);

}

function radiusForPopulation(d) {
    // let maxArea = Math.pow(bubbleChart.maxBubbleRadius, 2) * Math.PI;
    // let area = (maxArea * d.numberOfPeople)/bubbleChart.maxNumberOfPeople;
    // let radius = Math.sqrt(area/Math.PI);
    // return radius;

    return (bubbleChart.maxBubbleRadius * d.numberOfPeople) / bubbleChart.maxNumberOfPeople;

}


function getDataForSelectedYear() {

    let data = [];

    for (const borough of common.boroughs) {

        let filteredBorough = {
            name: borough.name,
            income: valueForSelectedYear(borough.mean),
            happiness: valueForSelectedYear(borough.meanHappiness),
            numberOfPeople: valueForSelectedYear(borough.numberOfPeople),
        };
        data.push(filteredBorough);
    }

    return data;

}

function valueForSelectedYear(objects) {
    let obj = objects.filter(keyIsSelectedYear).pop();
    return obj[bubbleChart.selectedYear];
}

function keyIsSelectedYear(obj) {
    return Object.keys(obj)[0] === bubbleChart.selectedYear;
}






















































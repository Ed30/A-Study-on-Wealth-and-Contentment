
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

    xScale: null,
    xScaleReference: null,
    xAxis : null,

    yScale: null,
    yAxis : null,

    bubbles : null,
    regressionLine : null,
    regressionLineVisible : true,

    visualisation : null,
    updatingVisualisation : false,

    zoom : null

};


Promise.all([
    d3.csv("js/data/mean-income.csv"),
    d3.csv("js/data/mean-happiness.csv"),
    d3.csv("js/data/number-of-individuals.csv"),
    d3.csv("js/data/zones.csv"),
]).then(function(data) {

    setupChartSpace(bubbleChart, "#income-happiness-visualisation", 600, 720);

    let meanIncomeData = data[0];
    let meanHappinessData = data[1]; // Contains years 2012 through 2017 only
    let numberOfIndividualsData = data[2];
    let zonesData = data[3];

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
        common.boroughs[i].zone = zonesData[i].Zone
    }

    console.log(common.boroughs);
    addYearsToBubbleChartToolbar();
    createBubbleChartVisualisation();
    setupRegressionButton();

});

function addYearsToBubbleChartToolbar() {

    bubbleChart.selectedYear = bubbleChart.years[0];

    for (let i = 0; i < bubbleChart.years.length; i++) {
        d3.select("#years-toolbar")
            .append("button")
            .attr("type", "button")
            .attr("name", bubbleChart.years[i])
            .attr("class", "btn btn-outline-light" + (i === 0 ? " active" : ""))
            .attr("onclick", 'yearSelected(this)')
            .attr("data-toggle", "tooltip")
            .attr("data-placement", "top")
            .attr("data-original-title", function () { return bubbleChart.years[i]; })
            .text(function () { return "’" + bubbleChart.years[i].slice(-2); });
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

function setupRegressionButton() {
    d3.select("#regression-button")
        .attr("onclick", "regressionButtonClicked()")
}

function regressionButtonClicked() {
    bubbleChart.regressionLineVisible = !bubbleChart.regressionLineVisible;

    d3.select("#regression-line")
        .transition(500)
        .style("opacity", function () {
            return bubbleChart.regressionLineVisible ? 1 : 0;
        });

}

function createBubbleChartVisualisation() {


    bubbleChart.xScale = d3.scaleLinear()
        .domain([0, common.maxIncome.mean + 10000])
        .range([0, bubbleChart.width]);

    bubbleChart.xScaleReference = bubbleChart.xScale.copy();

    bubbleChart.yScale = d3.scaleLinear()
        .domain([bubbleChart.minHappiness - 0.08, bubbleChart.maxHappiness + 0.12])
        .range([bubbleChart.height, 0]);


    bubbleChart.xAxis = d3.axisBottom(bubbleChart.xScale)
        .ticks(12)
        .tickFormat(function (d) {
            return d === 0 ? "" : "£" + d3.format(".2s")(d);
        })
        .tickSize(-bubbleChart.height);

    bubbleChart.yAxis = d3.axisLeft(bubbleChart.yScale)
        .tickSize(-bubbleChart.width);


    bubbleChart.zoom = d3.zoom()
        .scaleExtent([1, 20])
        .on("zoom", bubbleChartZoomed);


    bubbleChart.visualisation
        .call(bubbleChart.zoom)
        .selectAll(".tick")
        .classed("grid", true);

    let mask = bubbleChart.visualisation.append("defs")
        .append("clipPath")
        .attr("id", "mask")
        .append("rect")
        .attr("width", bubbleChart.width - 1)
        .attr("transform", "translate(1, 0)")
        .attr("height", bubbleChart.height);

    d3.select("#zoom-button")
        .on("click", resetZoom);


    let legend = d3.select("#bubble-chart-legend").append("svg").attr("height", 50).attr("width", bubbleChart.width);

    legend.append("circle").attr("cx",225).attr("cy",35).attr("r", 6).attr("class", "inner");
    legend.append("circle").attr("cx",425).attr("cy",35).attr("r", 6).attr("class", "outer");
    legend.append("text").attr("x", 245).attr("y", 36).text("Inner Boroughs").style("font-size", "15px").style("fill", "#F8F9FA").attr("alignment-baseline","middle");
    legend.append("text").attr("x", 445).attr("y", 36).text("Outer Boroughs").style("font-size", "15px").style("fill", "#F8F9FA").attr("alignment-baseline","middle");


    bubbleChart.visualisation.append("g")
        .attr("id", "x-axis-bubble")
        .attr("class", "axis")
        .attr("transform", "translate(0," + bubbleChart.height + ")")
        .call(bubbleChart.xAxis);

    bubbleChart.visualisation.append("g")
        .attr("id", "y-axis-bubble")
        .attr("class", "axis")
        .call(bubbleChart.yAxis);


    let background = bubbleChart.visualisation.append("rect")
        .attr("class", "bubble-chart-background")
        .attr("width", bubbleChart.width - 1)
        .attr("height", bubbleChart.height - 1)
        .attr("transform", "translate(1, 1)");

    let initialData = getDataForSelectedYear();
    initialData.splice(0, 1); //Discard City of London data
    initialData.sort((obj1, obj2) => (obj1.numberOfPeople < obj2.numberOfPeople) ? 1 : -1);

    console.log(initialData);

    //Append bubbles in correspondence of data points
    bubbleChart.bubbles = bubbleChart.visualisation
        .append("g")
        .selectAll(".bubble")
        .data(initialData)
        .enter()
        .append("circle")
        .attr("clip-path", "url(#mask)")
        .attr("class", function (d) { return "bubble " + d.zone.toLowerCase() })
        .attr("cx", function(d) { return bubbleChart.xScale(d.income) } )
        .attr("cy", function(d) { return bubbleChart.yScale(d.happiness) } )
        .attr("r", radiusForPopulation)
        .attr("data-toggle", "tooltip")
        .attr("data-placement", "right")
        .attr("data-html", true)
        .attr("data-original-title", toolTipContents)
        .on("mouseover", function (d) {
            mouseOverBubble(d3.select(this))
        })
        .on("mouseout", function () {
            mouseOutBubble(d3.select(this))
        });

    console.log(initialData);

    let linearRegression = ss.linearRegression(initialData.map(d => [
        d.income,
        d.happiness
    ]));

    linearRegressionLine = ss.linearRegressionLine(linearRegression);

    var linearRegressionData = bubbleChart.xScale.domain().map(function(x) {
        return {
            income: x,
            happiness: linearRegressionLine(+x)
        };
    });


    bubbleChart.regressionLine = bubbleChart.visualisation
        .append('g')
        .append("path")
        .datum(linearRegressionData)
        .attr("d", d3.line()
            .x(function(d) { return bubbleChart.xScale(d.income) })
            .y(function(d) { return bubbleChart.yScale(d.happiness) })
        )
        .attr("id", "regression-line")
        .attr("clip-path", "url(#mask)");

    $('[data-toggle="tooltip"]').tooltip();

}

function bubbleChartZoomed() {
    bubbleChart.xScale = d3.event.transform.rescaleX(bubbleChart.xScaleReference);
    bubbleChart.xAxis.scale(bubbleChart.xScale);
    bubbleChart.visualisation.select("#x-axis-bubble").call(bubbleChart.xAxis);
    bubbleChart.bubbles
        .attr("cx", function(d) { return bubbleChart.xScale(d.income); });

    bubbleChart.regressionLine
        .attr("d", d3.line()
            .x(function(d) { return bubbleChart.xScale(d.income) })
            .y(function(d) { return bubbleChart.yScale(d.happiness) })
        );


}

function resetZoom() {
    bubbleChart.visualisation
        .transition()
        .duration(1000)
        .ease(d3.easeExpOut)
        .call( bubbleChart.zoom.transform, d3.zoomIdentity);
}

function toolTipContents(d) {

    let nameRow = "<b>" + d.name + "</b><br>";
    let peopleRow = "Tax Payers: " + d3.format(",.0f")(d.numberOfPeople) + "<br>";
    let happinessRow = "Mean Happiness: " + d.happiness + "<br>";
    let salaryRow = "Mean PCI: £" + d3.format(",.0f")(d.income) + "";

    return nameRow + peopleRow + happinessRow + salaryRow;

}

function updateBubbleChartVisualisation() {


    let data = getDataForSelectedYear();
    data.splice(0, 1);
    data.sort((obj1, obj2) => (obj1.numberOfPeople < obj2.numberOfPeople) ? 1 : -1)

    bubbleChart.bubbles
        .data(data)
        .attr("data-original-title", toolTipContents);


    //Update bubble positions
    bubbleChart.bubbles
        .data(data)
        .transition()
        .ease(d3.easeExpOut)
        .duration(1000)
        .attr("cx", function(d) { return bubbleChart.xScale(d.income) } )
        .attr("cy", function(d) { return bubbleChart.yScale(d.happiness) } )
        .attr("r", radiusForPopulation);

    let linearRegression = ss.linearRegression(data.map(d => [
        d.income,
        d.happiness
    ]));

    linearRegressionLine = ss.linearRegressionLine(linearRegression);

    var linearRegressionData = bubbleChart.xScale.domain().map(function(x) {
        return {
            income: x,
            happiness: linearRegressionLine(+x)
        };
    });

    bubbleChart.regressionLine
        .datum(linearRegressionData)
        .transition()
        .ease(d3.easeExpOut)
        .duration(1000)
        .attr("d", d3.line()
            .x(function(d) { return bubbleChart.xScale(d.income) })
            .y(function(d) { return bubbleChart.yScale(d.happiness) })
        );

}

function radiusForPopulation(d) {
    return (bubbleChart.maxBubbleRadius * d.numberOfPeople) / bubbleChart.maxNumberOfPeople;
}


function getDataForSelectedYear() {

    let data = [];

    for (const borough of common.boroughs) {

        let filteredBorough = {
            name: borough.name,
            zone: borough.zone,
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

function mouseOverBubble(dataPoint) {

    dataPoint
        .transition()
        .ease(d3.easeElastic)
        .duration(800)
        .attr("r", function (d) { return radiusForPopulation(d) + 5; });

}

// Mouse pointer left the data point area
function mouseOutBubble(dataPoint) {

    dataPoint
        .transition()
        .ease(d3.easeElastic)
        .duration(800)
        .attr("r", radiusForPopulation);

}

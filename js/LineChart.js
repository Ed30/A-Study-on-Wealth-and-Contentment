
let lineChart = {

    boroughs : [],
    years : [],
    selectedBorough : "",
    selectedMode : "Mean",
    maxIncome : {mean: 0, median: 0},

    margins : { top: 10, right: 10, bottom: 30, left: 38 },
    height : 0,
    width : 0,
    xAxis : null,
    yAxis : null,

    visualisation : null,
    updatingVisualisation : false

};


// Read income tables
Promise.all([
    d3.csv("js/data/mean-income.csv"),
    d3.csv("js/data/median-income.csv"),
]).then(function(data) {

    setupChartSpace(lineChart, "#income-visualisation", 400, 720);

    let meanIncomeData = data[0];
    let medianIncomeData = data[1];

    // Loop through the tables
    for (let i = 0; i<meanIncomeData.length; i++) {

        let meanIncomes = [];
        let medianIncomes = [];

        for (let year in meanIncomeData[i]) {

            if (i === 0 && !isNaN(year)) {
                lineChart.years.push(year);
            }

            let meanIncome = parseInt(meanIncomeData[i][year].replace(",",""));
            let medianIncome = parseInt(medianIncomeData[i][year].replace(",",""));
            //Discard non-numeric values
            if (!Number.isNaN(meanIncome)) {
                meanIncomes.push(meanIncome);
                lineChart.maxIncome.mean = Math.max(lineChart.maxIncome.mean, meanIncome);
            }
            if (!Number.isNaN(medianIncome)) {
                medianIncomes.push(medianIncome);
                lineChart.maxIncome.median = Math.max(lineChart.maxIncome.median, medianIncome);
            }
        }
        let borough = {name: meanIncomeData[i].Area, mean: meanIncomes, median: medianIncomes};
        lineChart.boroughs.push(borough);
    }

    addBoroughsToLineChartDropdown();
    setupLineChartMeanMedianButtons();

    createLineChartVisualisation();
    updateLineChartVisualisation();

});

// Add the list of boroughs to the dropdown menu
function addBoroughsToLineChartDropdown() {

    d3.select("#borough-dropdown-button")
        .text(lineChart.boroughs[0].name);

    lineChart.selectedBorough = lineChart.boroughs[0];

    for (let i = 0; i<lineChart.boroughs.length; i++) {
        d3.select("#borough-dropdown-menu")
            .append("a")
            .attr("class", "dropdown-item")
            .attr("onclick", 'boroughSelected(this)')
            .text(lineChart.boroughs[i].name)
    }
}

// A new borough was selected
function boroughSelected(boroughItem) {
    let boroughName = $(boroughItem).text();
    d3.select("#boroughDropdownButton")
        .text(boroughName);

    lineChart.selectedBorough = lineChart.boroughs.filter(borough => {
        return borough.name === boroughName;
    })[0];
    updateLineChartVisualisation();
}

// Add onchange events for the mean and median buttons
function setupLineChartMeanMedianButtons() {
    d3.select("#mean")
        .attr("onchange", "meanMedianSelected(this)");

    d3.select("#median")
        .attr("onchange", "meanMedianSelected(this)");
}

// Selected a new mean/median option
function meanMedianSelected(item) {
    lineChart.selectedMode = $(item).attr("name");
    updateLineChartVisualisation();
}


// Creates and initialise visualisation to initial dummy data
function createLineChartVisualisation() {

    let mode = lineChart.selectedMode.toLocaleLowerCase();
    let incomes = lineChart.selectedBorough[mode];

    //Create (x, y) axes
    lineChart.xAxis = d3.scaleLinear()
        .domain(d3.extent(lineChart.years))
        .range([0, lineChart.width]);

    lineChart.yAxis = d3.scaleLinear()
        .domain([0, lineChart.maxIncome[mode]])
        .range([lineChart.height, 0]);

    //Append axes
    lineChart.visualisation.append("g")
        .attr("id", "x-axis")
        .attr("class", "axis")
        .attr("transform", "translate(0," + lineChart.height + ")")
        .call(d3.axisBottom(lineChart.xAxis)
            .ticks()
            .tickFormat(d3.format("d")));

    lineChart.visualisation.append("g")
        .attr("id", "y-axis")
        .attr("class", "axis")
        .call(d3.axisLeft(lineChart.yAxis)
            .ticks(12)
            .tickFormat(function (d) {
                return d === 0 ? "" : "£" + d3.format(".2s")(d);
            }));

    //Initialise visualisation to dummy data, for initial animation
    let initialData = incomes.map(function (income, i) {
        return {year: lineChart.years[i], income: lineChart.maxIncome[mode]/2}
    });

    //Append vertical grid lines
    lineChart.visualisation
    .append("g")
        .attr("class", "grid")
        .attr("transform", "translate(0," + lineChart.height + ")")
        .call(verticalGridlines()
            .tickSize(-lineChart.height)
            .tickFormat("")
        );

    // Define gradient object to be used later
    let gradient = lineChart.visualisation.append("defs")
        .append("linearGradient")
        .attr("id","gradient")
        .attr("x1", "0%").attr("y1", "0%")
        .attr("x2", "0%").attr("y2", "100%");

    gradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", "var(--highlight-blue)")
        .attr("stop-opacity", 0.5);

    gradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", "white)")
        .attr("stop-opacity", 0);

    // Compute and append area. Use gradient created above as fill
    lineChart.visualisation.append("path")
        .attr("id", "gradient-area")
        .datum(initialData)
        .style("fill", "url(#gradient)")
        .attr("d", d3.area()
            .x(function(d) { return lineChart.xAxis(d.year) })
            .y0(lineChart.yAxis(0))
            .y1(function(d) { return lineChart.yAxis(d.income) })
        );

    //Append line showing the trend
    lineChart.visualisation
        .append('g')
        .append("path")
        .datum(initialData)
        .attr("d", d3.line()
            .x(function(d) { return lineChart.xAxis(d.year) })
            .y(function(d) { return lineChart.yAxis(d.income) })
            .curve(d3.curveMonotoneX)
        )
        .attr("id", "income-line");

    //Append dots in correspondence of data points
    lineChart.visualisation
        .append("g")
        .selectAll("dot")
        .data(initialData)
        .enter()
        .append("circle")
        .attr("class", "dot")
        .attr("cx", function(d) { return lineChart.xAxis(d.year) } )
        .attr("cy", function(d) { return lineChart.yAxis(d.income) } )
        .attr("r", 7)
        .attr("data-toggle", "tooltip")
        .attr("data-placement", "top")
        .attr("data-original-title", function (d) { return d.income })
        .on("mouseover", function (d) {
            mouseOverDataPoint(d, d3.select(this))
        })
        .on("mouseout", function () {
            mouseOutDataPoint(d3.select(this))
        });

    $('[data-toggle="tooltip"]').tooltip();

}

// Update visualisation to show new data
function updateLineChartVisualisation() {

    let mode = lineChart.selectedMode.toLocaleLowerCase();
    let incomes = lineChart.selectedBorough[mode];
    lineChart.updatingVisualisation = true;

    // Update y axis values if a new mode was selected
    lineChart.yAxis = d3.scaleLinear()
        .domain([0, lineChart.maxIncome[mode]])
        .range([lineChart.height, 0]);

    lineChart.visualisation.select("#y-axis")
        .transition()
        .ease(d3.easeExpOut)
        .duration(1000)
        .call(d3.axisLeft(lineChart.yAxis)
            .ticks(12)
            .tickFormat(function (d) {
                // Include £ prefix and avoid showing £0 value
                return d === 0 ? "" : "£" + d3.format(".2s")(d);
            }));

    // Map new incomes array to the years
    var data = incomes.map(function (income, i) {
        return {year: lineChart.years[i], income: income}
    });

    // Update income line
    d3.select("#income-line")
        .datum(data)
        .transition()
        .ease(d3.easeExpOut)
        .duration(1000)
        .attr("d", d3.line()
            .x(function(d) { return lineChart.xAxis(d.year) })
            .y(function(d) { return lineChart.yAxis(d.income) })
            .curve(d3.curveMonotoneX)
        );

    //Update data point positions
    d3.selectAll(".dot")
        .data(data)
        .transition()
        .ease(d3.easeExpOut)
        .duration(1000)
        .attr("cx", function(d) { return lineChart.xAxis(d.year) } )
        .attr("cy", function(d) { return lineChart.yAxis(d.income) } );

    // Update tooltip title outside of transition!
    d3.selectAll(".dot")
        .attr("data-original-title", function (d) { return "£" + d3.format(",.0f")(d.income) + " in " + d.year});

    // Update gradient area
    d3.select("#gradient-area")
        .datum(data)
        .transition()
        .ease(d3.easeExpOut)
        .duration(1000)
        .attr("d", d3.area()
            .x(function(d) { return lineChart.xAxis(d.year) })
            .y0(lineChart.yAxis(0))
            .y1(function(d) { return lineChart.yAxis(d.income) })
            .curve(d3.curveMonotoneX)
        )
        .on("end", function () {
            lineChart.updatingVisualisation = false;
        });

}

// Create vertical grid lines
function verticalGridlines() {
    return d3.axisBottom(lineChart.xAxis)
        .ticks(lineChart.years.length)
}

// Mouse entered the data point area
function mouseOverDataPoint(data, dataPoint) {

    // Apply transition if previous transition has finished
    if (!lineChart.updatingVisualisation) {
        dataPoint
            .transition()
            .ease(d3.easeElastic)
            .duration(800)
            .attr("r", 8)
            .style('stroke-width', '0px')
            .style("fill", "var(--highlight-orange)");
    }
}

// Mouse pointer left the data point area
function mouseOutDataPoint(dataPoint) {

    if (!lineChart.updatingVisualisation) {
        dataPoint
            .transition()
            .ease(d3.easeElastic)
            .duration(800)
            .attr("r", 7)
            .style('stroke-width', '3px')
            .style("fill", "var(--highlight-blue)");
    }
}
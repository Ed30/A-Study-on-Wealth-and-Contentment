var boroughs = [],
    years = [],
    selectedBorough = "",
    selectedMode = "Mean",
    maxSalary = {mean: 0, median: 0};

var margins = { top: 10, right: 10, bottom: 30, left: 38 },
    height = 400 - margins.top - margins.bottom,
    width = 720 - margins.left - margins.right,
    xAxis = null,
    yAxis = null;

var visualisation = null;

// Read income tables
Promise.all([
    d3.csv("js/data/mean-income.csv"),
    d3.csv("js/data/median-income.csv"),
]).then(function(data) {

    setupVisualisationSpace();

    let meanIncomeData = data[0];
    let medianIncomeData = data[1];

    // Loop through the tables
    for (let i = 0; i<meanIncomeData.length; i++) {

        let meanSalaries = [];
        let medianSalaries = [];

        for (let year in meanIncomeData[i]) {

            if (i === 0 && !isNaN(year)) {
                years.push(year);
            }

            let meanSalary = parseInt(meanIncomeData[i][year].replace(",",""));
            let medianSalary = parseInt(medianIncomeData[i][year].replace(",",""));
            //Discard non-numeric values
            if (!Number.isNaN(meanSalary)) {
                meanSalaries.push(meanSalary);
                maxSalary.mean = Math.max(maxSalary.mean, meanSalary);
            }
            if (!Number.isNaN(medianSalary)) {
                medianSalaries.push(medianSalary);
                maxSalary.median = Math.max(maxSalary.median, medianSalary);
            }
        }
        let borough = {name: meanIncomeData[i].Area, mean: meanSalaries, median: medianSalaries};
        boroughs.push(borough);
    }

    addBoroughsToDropdown();
    setupMeanMedianButtons();

    createVisualisation();
    updateVisualisation();

});

// Add the list of boroughs to the dropdown menu
function addBoroughsToDropdown() {

    d3.select("#boroughDropdownButton")
        .text(boroughs[0].name);

    selectedBorough = boroughs[0];

    for (let i = 0; i<boroughs.length; i++) {
        d3.select("#boroughDropdownMenu")
            .append("a")
            .attr("class", "dropdown-item")
            .attr("onclick", 'boroughSelected(this)')
            .text(boroughs[i].name)
    }
}

// A new borough was selected
function boroughSelected(boroughItem) {
    let boroughName = $(boroughItem).text();
    d3.select("#boroughDropdownButton")
        .text(boroughName);

    selectedBorough = boroughs.filter(borough => {
        return borough.name === boroughName;
    })[0];
    updateVisualisation();
}

// Add onchange events for the mean and median buttons
function setupMeanMedianButtons() {
    d3.select("#mean")
        .attr("onchange", "meanMedianSelected(this)");

    d3.select("#median")
        .attr("onchange", "meanMedianSelected(this)");
}

// Selected a new mean/median option
function meanMedianSelected(item) {
    selectedMode = $(item).attr("name");
    updateVisualisation();
}

// Create the visualisation space by setting up sizes
function setupVisualisationSpace() {
    visualisation = d3.select("#income-visualisation")
        .append("svg")
        .attr("width", width + margins.left + margins.right)
        .attr("height", height + margins.top + margins.bottom)
        .append("g")
        .attr("transform",
            "translate(" + margins.left + "," + margins.top + ")");
}

// Creates and initialise visualisation to initial dummy data
function createVisualisation() {

    let mode = selectedMode.toLocaleLowerCase();
    let salaries = selectedBorough[mode];

    //Create (x, y) axes
    xAxis = d3.scaleLinear()
        .domain(d3.extent(years)) // TODO try without extent
        .range([0, width]);

    yAxis = d3.scaleLinear()
        .domain([0, maxSalary[mode]])
        .range([height, 0]);

    //Append axes
    visualisation.append("g")
        .attr("id", "x-axis")
        .attr("class", "axis")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(xAxis)
            .ticks()
            .tickFormat(d3.format("d")));

    visualisation.append("g")
        .attr("id", "y-axis")
        .attr("class", "axis")
        .call(d3.axisLeft(yAxis)
            .ticks(12)
            .tickFormat(function (d) {
                return d === 0 ? "" : "£" + d3.format(".2s")(d);
            }));

    //Initialise visualisation to dummy data, for initial animation
    let initialData = salaries.map(function (salary, i) {
        return {year: years[i], salary: maxSalary[mode]/2}
    });

    //Append vertical grid lines
    visualisation
    .append("g")
        .attr("class", "grid")
        .attr("transform", "translate(0," + height + ")")
        .call(verticalGridlines()
            .tickSize(-height)
            .tickFormat("")
        );

    // Define gradient object to be used later
    let gradient = visualisation.append("defs")
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
    visualisation.append("path")
        .attr("id", "gradient-area")
        .datum(initialData)
        .style("fill", "url(#gradient)")
        .attr("d", d3.area()
            .x(function(d) { return xAxis(d.year) })
            .y0(yAxis(0))
            .y1(function(d) { return yAxis(d.salary) })
        );

    //Append line showing the trend
    visualisation
        .append('g')
        .append("path")
        .datum(initialData)
        .attr("d", d3.line()
            .x(function(d) { return xAxis(d.year) })
            .y(function(d) { return yAxis(d.salary) })
            .curve(d3.curveMonotoneX)
        )
        .attr("id", "salary-line");

    //Append dots in correspondence of data points
    visualisation
        .append("g")
        .selectAll("dot")
        .data(initialData)
        .enter()
        .append("circle")
        .attr("class", "dot")
        .attr("cx", function(d) { return xAxis(d.year) } )
        .attr("cy", function(d) { return yAxis(d.salary) } )
        .attr("r", 7)
        .attr("data-toggle", "tooltip")
        .attr("data-placement", "top")
        .attr("title", function (d) { return d.salary })
        .on("mouseover", function (d) {
            mouseOverDataPoint(d, d3.select(this))
        })
        .on("mouseout", function () {
            mouseOutDataPoint(d3.select(this))
        });

    // Refresh tooltips
    $('[data-toggle="tooltip"]').tooltip();


}

// Update visualisation to show new data
function updateVisualisation() {

    let mode = selectedMode.toLocaleLowerCase();
    let salaries = selectedBorough[mode];

    // Update y axis values if a new mode was selected
    yAxis = d3.scaleLinear()
        .domain([0, maxSalary[mode]])
        .range([height, 0]);

    visualisation.select("#y-axis")
        .transition()
        .ease(d3.easeExpOut)
        .duration(1000)
        .call(d3.axisLeft(yAxis)
            .ticks(12)
            .tickFormat(function (d) {
                // Include £ prefix and avoid showing £0 value
                return d === 0 ? "" : "£" + d3.format(".2s")(d);
            }));

    // Map new salaries array to the years
    var data = salaries.map(function (salary, i) {
        return {year: years[i], salary: salary}
    });


    d3.select("#salary-line")
        .datum(data)
        .transition()
        .ease(d3.easeExpOut)
        .duration(1000)
        .attr("d", d3.line()
            .x(function(d) { return xAxis(d.year) })
            .y(function(d) { return yAxis(d.salary) })
            .curve(d3.curveMonotoneX)
        );


    d3.selectAll(".dot")
        .data(data)
        .transition()
        .ease(d3.easeExpOut)
        .duration(1000)
        .attr("cx", function(d) { return xAxis(d.year) } )
        .attr("cy", function(d) { return yAxis(d.salary) } )
        .attr("title", function (d) { return d.salary });

    d3.select("#gradient-area")
        .datum(data)
        .transition()
        .ease(d3.easeExpOut)
        .duration(1000)
        .attr("d", d3.area()
            .x(function(d) { return xAxis(d.year) })
            .y0(yAxis(0))
            .y1(function(d) { return yAxis(d.salary) })
            .curve(d3.curveMonotoneX)
        );

}


// Create vertical grid lines
function verticalGridlines() {
    return d3.axisBottom(xAxis)
        .ticks(years.length)
}

function mouseOverDataPoint(data, dataPoint) {

    dataPoint
        .transition()
        .ease(d3.easeCubicOut)
        .duration(200)
        .attr("r", 8)
        .style('stroke-width', '0px')
        .style("fill", "var(--highlight-orange)");

    console.log(data);
}

function mouseOutDataPoint(dataPoint) {

    dataPoint
        .transition()
        .ease(d3.easeCubicOut)
        .duration(200)
        .attr("r", 7)
        .style('stroke-width', '3px')
        .style("fill", "var(--highlight-blue)");
}
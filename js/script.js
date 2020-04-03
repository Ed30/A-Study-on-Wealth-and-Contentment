var boroughs = [],
    years = [],
    selectedBorough = "",
    selectedMode = "Mean",
    maxSalary = {mean: 0, median: 0};

var margins = { top: 10, right: 10, bottom: 30, left: 32 },
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

    buildVisualisation();

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

    createAxes();
    updateVisualisation();

});

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

function boroughSelected(boroughItem) {
    let boroughName = $(boroughItem).text();
    d3.select("#boroughDropdownButton")
        .text(boroughName);

    selectedBorough = boroughs.filter(borough => {
        return borough.name === boroughName;
    })[0];

    updateVisualisation();
}

function setupMeanMedianButtons() {
    d3.select("#mean")
        .attr("onchange", "meanMedianSelected(this)");

    d3.select("#median")
        .attr("onchange", "meanMedianSelected(this)");
}

function meanMedianSelected(item) {
    selectedMode = $(item).attr("name");
    updateVisualisation();
}

function buildVisualisation() {
    visualisation = d3.select("#income-visualisation")
        .append("svg")
        .attr("width", width + margins.left + margins.right)
        .attr("height", height + margins.top + margins.bottom)
        .append("g")
        .attr("transform",
            "translate(" + margins.left + "," + margins.top + ")");
}


function createAxes() {

    let mode = selectedMode.toLocaleLowerCase();
    let salaries = selectedBorough[mode];

    xAxis = d3.scaleLinear()
        .domain(d3.extent(years)) // TODO try without extent
        .range([0, width]);

    visualisation.append("g")
        .attr("id", "x-axis")
        .attr("class", "axis")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(xAxis)
            .ticks()
            .tickFormat(d3.format("d")));

    yAxis = d3.scaleLinear()
        .domain([0, maxSalary[mode]])
        .range([height, 0]);

    visualisation.append("g")
        .attr("id", "y-axis")
        .attr("class", "axis")
        .call(d3.axisLeft(yAxis)
            .ticks()
            .tickFormat(d3.format(".0s")));

    var initialData = salaries.map(function (salary, i) {
        return {year: years[i], salary: maxSalary[mode]/2}
    });


    visualisation
    .append("g")
        .attr("class", "grid")
        .attr("transform", "translate(0," + height + ")")
        .call(verticalGridlines()
            .tickSize(-height)
            .tickFormat("")
        );


    //Append
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

    visualisation
        .append("g")
        .selectAll("dot")
        .data(initialData)
        .enter()
        .append("circle")
        .attr("class", "dot")
        .attr("cx", function(d) { return xAxis(d.year) } )
        .attr("cy", function(d) { return yAxis(d.salary) } )
        .attr("r", 5)


}

function verticalGridlines() {
    return d3.axisBottom(xAxis)
        .ticks(years.length)
}

function updateVisualisation() {

    console.log(selectedBorough);
    console.log(selectedMode);

    let mode = selectedMode.toLocaleLowerCase();
    let salaries = selectedBorough[mode];

    yAxis = d3.scaleLinear()
        .domain([0, maxSalary[mode]])
        .range([height, 0]);

    visualisation.select("#y-axis")
        .transition()
        .ease(d3.easeCubic)
        .duration(1000)
        .call(d3.axisLeft(yAxis)
            .ticks()
            .tickFormat(d3.format(".0s")));

    var data = salaries.map(function (salary, i) {
        return {year: years[i], salary: salary}
    });

    // colors = d3.scaleLinear()
    //     .domain([0, maxSalary[mode]])
    //     .range(['#FFFFFF', '#2D8BCF']);


    d3.select("#salary-line")
        .datum(data)
        .transition()
        .duration(1000)
        .attr("d", d3.line()
            .x(function(d) { return xAxis(d.year) })
            .y(function(d) { return yAxis(d.salary) })
            .curve(d3.curveMonotoneX)
        );


    d3.selectAll(".dot")
        .data(data)
        .transition()
        .duration(1000)
        .attr("cx", function(d) { return xAxis(d.year) } )
        .attr("cy", function(d) { return yAxis(d.salary) } )



    // visualisation.append("path")
    //     .datum(data)
    //     .attr("fill", "#cce5df")
    //     .attr("stroke", "#69b3a2")
    //     .attr("stroke-width", 1.5)
    //     .attr("d", d3.area()
    //         .x(function(d) { return xAxis(d.year) })
    //         .y0(yAxis(0))
    //         .y1(function(d) { return yAxis(d.salary) })
    //     );


}

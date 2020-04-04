var boroughsBubble = [],
    yearsBubble = [],
    selectedYear = null;


Promise.all([
    d3.csv("js/data/mean-income.csv"),
    d3.csv("js/data/mean-happiness.csv"),
    d3.csv("js/data/number-of-individuals.csv"),
]).then(function(data) {

    let meanIncomeData = data[0];
    let meanHappinessData = data[1]; // Years 2012 through 2017 only
    let numberOfIndividualsData = data[2];

    for (let i = 0; i<meanHappinessData.length; i++) {

        let meanIncomes = [];
        let meanHappiness = [];

        for (let year in meanHappinessData[i]) {

            if (i === 0 && !isNaN(year)) {
                yearsBubble.push(year);
            }
        }

    }

    addYearsToToolbar();

});

function addYearsToToolbar() {

    //TODO - implement radio buttons instead.
    //TODO - Check why sometimes page does not load.

    for (let i = 0; i < yearsBubble.length; i++) {
        d3.select("#years-toolbar")
            .append("button")
            .attr("type", "button")
            .attr("name", yearsBubble[i])
            .attr("class", "btn btn-outline-primary")
            .attr("onclick", 'YearSelected(this)')
            .text(function () {
                return "’" + yearsBubble[i].slice(-2);
            })
    }
}

// Selected a new mean/median option
function YearSelected(item) {
    selectedYear = $(item).attr("name");
    // $(item)
    //     .attr("class", "active");
    console.log(selectedYear)

}
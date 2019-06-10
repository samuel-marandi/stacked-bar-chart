const d3 = require("d3");
const dc = require("dc");
const crossfilter = require("crossfilter");
const moment = require("moment");

/**
 * Example of stacked chart
 */
const fruitChart =  dc.barChart("#fruit-chart");

const fruits = [
    { "name": "Apple", "type": "fruit", "count": 20, "cost": 200, season: "summer" },
    { "name": "Orange", "type": "fruit", "count": 10, "cost": 80, season: "winter" },
    { "name": "Grapes", "type": "fruit", "count": 50, "cost": 150, season: "summer" },
    { "name": "Mango", "type": "fruit", "count": 40, "cost": 180, season: "winter" }
  ];

const ndx = crossfilter(fruits);

const dimension =  ndx.dimension(data => data.name);

const countGroup = dimension.group().reduceSum(data => data.count);

const costGroup = dimension.group().reduceSum(data => data.cost);

fruitChart
    .width(800)
    .height(300)
    .x(d3.scaleBand())
    .xUnits(dc.units.ordinal)
    .brushOn(false)
    .xAxisLabel('Fruit')
    .yAxisLabel('Cost and Count')
    .renderHorizontalGridLines(true)
    .renderVerticalGridLines(true)
    .dimension(dimension)
    .barPadding(0.1)
    .outerPadding(0.05)
    .group(countGroup)
    .stack(countGroup, (data) => data.cost)
    .stack(countGroup)
    .on('renderlet', function(chart) {
        chart.selectAll('rect').on('click', function(d) {
            console.log('click!', d);
        });
    });

fruitChart.render();

/**
 * End of Example
 */

 /**
  * Implementation on given dataset
  */

/**
 * Initial Given Dataset
 */
const input = {
    "request": {
        "type": "INVENTORY",
        "fromDate": 20190112,
        "toDate": 20190115,
        "views": [
            "category",
            "colorgroup",
            "season",
            "bestseller",
            "warehouselocation"
        ]
    },
    "data": {
        "records": [
            {
                "colorgroup": "Prussian Blue",
                "bestseller": "ss19",
                "season": "aw18",
                "totalunits": 25,
                "category": "Shirt",
                "warehouselocation": "Amazon-SF"
            },
            {
                "colorgroup": "Prussian Blue",
                "bestseller": "ss19m",
                "season": "aw18d2",
                "totalunits": 25,
                "category": "Shirt",
                "warehouselocation": "Amazon-SF"
            },
            {
                "colorgroup": "Prussian Blue",
                "bestseller": "aw18d2",
                "season": "ss17",
                "totalunits": 25,
                "category": "Shirt",
                "warehouselocation": "Amazon-SF"
            },
            {
                "colorgroup": "Prussian Blue",
                "bestseller": "aw18",
                "season": "ss18",
                "totalunits": 25,
                "category": "T-Shirt",
                "warehouselocation": "Amazon-SF"
            },
            {
                "colorgroup": "Prussian Blue",
                "bestseller": "osmn",
                "season": "ss19ml",
                "totalunits": 25,
                "category": "T-Shirt",
                "warehouselocation": "Amazon-SF"
            },
            {
                "colorgroup": "Prussian Blue",
                "bestseller": "osmold",
                "season": "ss19pl",
                "totalunits": 25,
                "category": "T-Shirt",
                "warehouselocation": "Amazon-SF"
            }
        ],
        "columns": [
            "sum(totalUnits) as totalUnits",
            "category",
            "colorgroup",
            "season",
            "bestseller",
            "warehouselocation"
        ]
    },
    "error": false
};

/**
 * Chart hook for dom
 */
const chart = dc.barChart("#chart");

/**
 * Data format specification for moment
 */
const dateFormat = "YYYYMMDD";

/**
 * Deconstruct records for manipulation
 */
const { records } = input.data;

/**
 * Convert the start date to moment object
 */
const startDate = moment(input.request.fromDate, dateFormat);

/**
 * Convert end date to moment object
 */
const endDate = moment(input.request.toDate, dateFormat);

/**
 * Place holder for months based on the input range of dates <fromDate, toDate>
 */
const result = [];

/**
 * Extract the months from given date range
 */
while (startDate.isBefore(endDate)) {
    result.push(startDate.format("MMM"));
    startDate.add(1, 'month');
}

/**
 * Format the array of months to be used in X-Axis
 */
const months = result.length > 1 ? `${result[0]} - ${result[result.length - 1]}` :result[0];

// Call back handlers for reduce funtion
const addCallback = (p, v) => {
    p[v.category] = (p[v.category] || 0) + v.totalunits;
    return p;
}

const removeCallback = (p, v) => {
    p[v.category] = (p[v.category] || 0) - v.totalunits;
    return p;
}

const initialCallback = () => {
    return {};
};

/**
 * Add the months key to data to create a dimension
 */
records.forEach(record => {
    record.months = months;
});

/**
 * Create a crossfilter of the mutated records
 */
const cf = crossfilter(records);

/**
 * Create a dimension based on recently added month key
 */
const monthDimension = cf.dimension(data => data.months);

/**
 * Group the elements based on total unit count per category
 */
const totalUnitSumGroup = monthDimension
    .group()
    .reduce(
        addCallback,
        removeCallback,
        initialCallback
    );

// Custom accessor function for stacking charts    
const selectStack = (i) => (d) => d.value[i];

/**
 * Plot the chart specifications
 */
chart
    .width(800)
    .height(500)
    .x(d3.scaleBand())
    .xUnits(dc.units.ordinal)
    .brushOn(false)
    .elasticY(true)
    .yAxisLabel('Total Units')
    .renderHorizontalGridLines(true)
    .renderVerticalGridLines(true)
    .dimension(monthDimension)
    .clipPadding(10)
    .margins({left: 80, top: 20, right: 10, bottom: 20})
    .group(totalUnitSumGroup)
    .on('renderlet', function(chart) {
        chart.selectAll('rect').on('click', function(d) {
            console.log('click!', d);
        });
    })

/*Extract the reduced structure of date from the group*/    
const reducedData = totalUnitSumGroup.all()[0].value;

// Stack each item against the value in the reduced dataset
for(item in reducedData) {
    chart.stack(totalUnitSumGroup, item, selectStack(item));
}

// render the chart
chart.render();
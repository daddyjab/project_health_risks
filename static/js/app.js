/****************************************************

Homework Assignment:
16-Data Journalism and D3 - Project Health Risks

@Author Jeffery Brown (daddyjab)
@Date 3/22/19
@File app.js

 ****************************************************/

// Set the dimension of the SVG div for the chart
var svgWidth = 1000;
var svgHeight = 600;

var margin = {
  top: 30,
  right: 30,
  bottom: 100,
  left: 100
};

var width = svgWidth - margin.left - margin.right;
var height = svgHeight - margin.top - margin.bottom;

// Create an SVG wrapper, append an SVG group that will hold our chart,
// and shift the latter by left and top margins.
var svg = d3.select("#scatter")
              .append("svg")
              .attr("width", svgWidth)
              .attr("height", svgHeight);
            
// Append an SVG group
var chartGroup = svg.append("g")
  .attr("transform", `translate(${margin.left}, ${margin.top})`);

// Initial Params
var chosenXAxis = "smokes";

// function used for updating x-scale var upon click on axis label
function xScale(data, chosenXAxis) {

  // create scales, with the x-values determined using the
  // 'chosenXAxis' property within the data object
  var xLinearScale = d3.scaleLinear()
    .domain([d3.min(data, d => d[chosenXAxis]) * 0.8,
      d3.max(data, d => d[chosenXAxis]) * 1.2
    ])
    .range([0, width]);

  return xLinearScale;
}

// Initial Params
var chosenYAxis = "obesity";

// function used for updating x-scale var upon click on axis label
function yScale(data, chosenYAxis) {

  // create scales, with the x-values determined using the
  // 'chosenXAxis' property within the data object
  var yLinearScale = d3.scaleLinear()
    .domain([d3.min(data, d => d[chosenYAxis]) * 0.8,
      d3.max(data, d => d[chosenYAxis]) * 1.2
    ])
    .range([height, 0]);

  return yLinearScale;
}

// function used for updating xAxis var upon click on axis label
function renderXAxes(newXScale, xAxis) {
  var bottomAxis = d3.axisBottom(newXScale);

  xAxis.transition()
    .duration(1000)
    .call(bottomAxis);

  return xAxis;
}

// function used for updating xAxis var upon click on axis label
function renderYAxes(newYScale, yAxis) {
  var leftAxis = d3.axisLeft(newYScale);

  yAxis.transition()
    .duration(1000)
    .call(leftAxis);

  return yAxis;
}

// function used for updating circles group with a transition to
// new circles
function renderCircles(circlesGroup,
                    newXScale, chosenXAxis,
                    newYScale, chosenYAxis) {

  circlesGroup.transition()
    .duration(1000)
    .attr("cx", d => newXScale(d[chosenXAxis]))
    .attr("cy", d => newYScale(d[chosenYAxis]));

  return circlesGroup;
}

// function used for updating state labels group with a transition to
// new labels
function renderLabels(labelsGroup,
                  newXScale, chosenXAxis,
                  newYScale, chosenYAxis) {

  labelsGroup.transition()
    .duration(1000)
    .attr("x", d => newXScale(d[chosenXAxis]))
    .attr("y", d => newYScale(d[chosenYAxis]));

return labelsGroup;
}

// Function to calculate the linear regression of the data
// indicated by chosenXAxis and chosenYAxis
function getLinearRegr( chosenXAxis, chosenYAxis, data ) {

  // Build the input array to the linear regression function as
  // an array of coordinate point arrays
  var inputArray = data.map( d => [ d[chosenXAxis], d[chosenYAxis] ] );

  console.log("Input Array: ", inputArray);

  // Calculate the linear regression
  // Return Values:
    // equation: an array containing the coefficients of the equation [slope, y-intercept]
    // string: A string representation of the equation
    // points: an array containing the predicted data in the domain of the input
    // r2: the coefficient of determination (R2)
    // predict(x): This function will return the predicted value as a coordinate point [x_input, y_predicted]

  var result = regression.linear( inputArray );

  console.log("Linear Regression:", result );

  xMin = d3.min(data, d => d[chosenXAxis]);
  xMax = d3.max(data, d => d[chosenXAxis]);

  coordArray = [
    {'x': xMin, 'y': result.predict(xMin)[1] },
    {'x': xMax, 'y': result.predict(xMax)[1] }
  ];

  console.log("Coordinate Array:", coordArray);
  
  return coordArray;
}

// Object to specify the tooltip text based upon chosen axis
const toolTipTextList = {
  poverty: '% Population in Poverty',
  age: 'Median Age',
  income:  'Median Income',
  healthcare:  '% Population with Healthcare Coverage',
  obesity:  '% Population Classified as Obese',
  smokes: '% Population Who  Smoke'
};

// Use a flag to manage tooltip persistence
var toolTipPersist = false;

// function used for updating circles group with new tooltip
function updateToolTip(chosenXAxis, chosenYAxis, circlesGroup) {

  var toolTipSpot = d3.tip()
    .attr("class", "tooltipinfo")
    .direction('se')
    .html( function(d) {
      tipInfo = `<h6>State: ${d['state']} (${d['abbr']})</h6><hr>`
      tipInfo += `<p>${toolTipTextList[chosenXAxis]}: ${d[chosenXAxis]}<br>`
      tipInfo += `${toolTipTextList[chosenYAxis]}: ${d[chosenYAxis]}</p>`
      return tipInfo;
    });

  // Set mouse events for the circles
  circlesGroup.call(toolTipSpot);

  circlesGroup
    // On mouseover, show tooltip
    .on("mouseover", function(data) {
      // Turnoff tooltip persistence, then show the tooltip
      toolTipPersist = false;
      toolTipSpot.show(data);
    })

    // On mouseout, hide tooltip
    .on("mouseout", function(data) {
      // Turn off the tooltip only if persistence is off
      if (!toolTipPersist) {
        toolTipSpot.hide(data);
      }
    })

    .on("click", function() {
      // Toggle the tooltip persistence flag
      if (toolTipPersist) {
        toolTipPersist = false;
      } else {
        toolTipPersist = true;
      }
      // console.log(`Mouse click event - toolTipPersist: ${toolTipPersist}`);  
    });


  // Return the circles group now that the events have been setup
  return circlesGroup;
}

// Retrieve data from the CSV file and execute everything below
d3.csv("data/data.csv", function(err, healthData) {

  if (err) {
    console.log("Error occurred while reading datafile: data.csv", err);
    throw err;
  };

  // Data Example from "data.csv"
  // id,state,abbr,poverty,povertyMoe,age,ageMoe,income,incomeMoe,healthcare,healthcareLow,healthcareHigh,obesity,obesityLow,obesityHigh,smokes,smokesLow,smokesHigh
  // 1,Alabama,AL,19.3,0.5,38.6,0.2,42830,598,13.9,12.7,15.1,33.5,32.1,35,21.1,19.8,22.5


  // List all data fields that should be numeric
  numericFields = [ "id","poverty","povertyMoe","age","ageMoe",
                    "income","incomeMoe","healthcare","healthcareLow","healthcareHigh",
                    "obesity","obesityLow","obesityHigh","smokes","smokesLow","smokesHigh" ]

  // For each row of Health Data...
  healthData.forEach( function(d) {

    // console.log(`healthData[${d['id']}] abbr = `, d['abbr']);

    // ... convert all the fields that should be numeric to numeric
    numericFields.forEach( function( element ) {
      d[ element ] = +d[ element ];
    });

  });

  console.log("Health Data after fields converted to numeric:", healthData);

  // Use the xScale function to define the x-axis scale function
  // based upon a chosen property of the input data
  var xLinearScale = xScale(healthData, chosenXAxis);

  // Use the yScale function to define the y-axis scale function
  // based upon a chosen property of the input data
  var yLinearScale = yScale(healthData, chosenYAxis);

  // Create initial axis functions
  var bottomAxis = d3.axisBottom(xLinearScale);
  var leftAxis = d3.axisLeft(yLinearScale);

  // Append x axis
  // Set the class of this axis to be the active x-axis
  var xAxis = chartGroup.append("g")
    .classed("x-axis", true)
    .attr("transform", `translate(0, ${height})`)
    .call(bottomAxis);

  // Append y axis
  // Set the class of this axis to be the active y-axis
  var yAxis = chartGroup.append("g")
      .classed("y-axis", true)
      .call(leftAxis);

  // Add a linear regression line to the plot
  // Calculate using the health data and the selected axes
  trendCoordArray = getLinearRegr( chosenXAxis, chosenYAxis, healthData );

  console.log("Trend Line Coords:", trendCoordArray);

  // Create a line generator function and store as a variable
  // Use the scale functions for x and y data
  var createLine = d3.line()
    .x(data => xLinearScale( data.x ) )
    .y(data => yLinearScale( data.y ) );

  // Append linear regression trend line to the chart group
  // Add the trend line first so it will be underneath all other elements
  var trendLineGroup = chartGroup.selectAll("path.trendLine")
    .data(healthData)
    .enter()
    .append("path")
    .classed("trendLine", true)
    .attr("d", createLine( trendCoordArray ) );
  
  // Append initial text labels for the circles
  // Add the text labels before the circles so they
  // don't mess up the mouseover and mouseout events for the circles
  var stateTextGroup = chartGroup.selectAll("text.stateText")
    .data(healthData)
    .enter()
    .append("text")
    .attr("x", d => xLinearScale(d[chosenXAxis]))
    .attr("y", d => yLinearScale(d[chosenYAxis]))
    .attr("dy", ".35em")
    .text( d => d["abbr"] )
    .classed("stateText", true);

  // Append initial circles
  // Add the circles last so they are on top,
  // where their mouseover and mouseout events won't be impaired
  var stateCirclesGroup = chartGroup.selectAll("circle")
    .data(healthData)
    .enter()
    .append("circle")
    .attr("cx", d => xLinearScale(d[chosenXAxis]))
    .attr("cy", d => yLinearScale(d[chosenYAxis]))
    .attr("r", 15)
    .classed("stateCircle", true);
  
  // Create group for two x-axis labels
  var xLabelsGroup = chartGroup.append("g")
    .attr("transform", `translate(${width / 2}, ${height + 20})`);

  var xAxisLabel_Age = xLabelsGroup.append("text")
    .attr("x", 0)
    .attr("y", 20)
    .attr("value", "age") // value to grab for event listener
    .classed("inactive", true)
    .text("Age");

  var xAxisLabel_Smokes = xLabelsGroup.append("text")
    .attr("x", 0)
    .attr("y", 40)
    .attr("value", "smokes") // value to grab for event listener
    .classed("active", true)
    .text("Smokes (%)");

  // Create group for two y-axis labels
  var yLabelsGroup = chartGroup.append("g")
    .attr("transform", `translate(${0}, ${height / 2 })`);

  // append y axis
  var yAxisLabel_Poverty = yLabelsGroup.append("text")
    .attr("y", -50)
    .attr("x", 0)
    .attr("transform", "rotate(-90)")
    // .attr("dy", "1em")
    .attr("value", "poverty") // value to grab for event listener
    .classed("inactive", true)
    .text("Poverty");

  // append y axis
  var yAxisLabel_Obesity = yLabelsGroup.append("text")
    .attr("y", -70)
    .attr("x", 0)
    .attr("transform", "rotate(-90)")
    // .attr("dy", "1em")
    .attr("value", "obesity") // value to grab for event listener
    .classed("active", true)
    .text("Obesity");

  // updateToolTip function above csv import
  var stateCirclesGroup = updateToolTip(chosenXAxis, chosenYAxis, stateCirclesGroup);

  // x axis labels event listener
  xLabelsGroup.selectAll("text")
    .on("click", function() {
      // get value of selection
      var value = d3.select(this).attr("value");
      if (value !== chosenXAxis) {

        // replaces chosenXaxis with value
        chosenXAxis = value;

        // console.log(chosenXAxis)

        // functions here found above csv import
        // updates x scale for new data
        xLinearScale = xScale(healthData, chosenXAxis);

        // updates x axis with transition
        xAxis = renderXAxes(xLinearScale, xAxis);

        // console.log( chosenXAxis, chosenYAxis);

        // updates circles with new x values
        stateCirclesGroup = renderCircles(stateCirclesGroup,
                          xLinearScale, chosenXAxis,
                          yLinearScale, chosenYAxis);

        // updates labels with new x values
        stateTextGroup = renderLabels(stateTextGroup,
                          xLinearScale, chosenXAxis,
                          yLinearScale, chosenYAxis);

        // updates tooltips with new info
        stateCirclesGroup = updateToolTip(chosenXAxis, chosenYAxis, stateCirclesGroup);

        // Update the trend line
        // Doing this inline vs. in a function because having difficulty
        // with scope of some of the scaling functions

        // Get the coordinates defining the new trend line
        newtrendCoordArray = getLinearRegr( chosenXAxis, chosenYAxis, healthData );
        console.log("New Trend Line Coords:", newtrendCoordArray);

        // Create a new line generator function
        var newcreateLine = d3.line()
          .x(data => xLinearScale( data.x ) )
          .y(data => yLinearScale( data.y ) );

        trendLineGroup.transition()
          .duration(1000)
          .attr("d", newcreateLine( newtrendCoordArray ) );

        // changes classes to change bold text
        if (chosenXAxis === "age") {
          xAxisLabel_Age
            .classed("active", true)
            .classed("inactive", false);

          xAxisLabel_Smokes
            .classed("active", false)
            .classed("inactive", true);
        }
        else {
          xAxisLabel_Age
            .classed("active", false)
            .classed("inactive", true);

          xAxisLabel_Smokes
            .classed("active", true)
            .classed("inactive", false);
        }
      }
    });

  // x axis labels event listener
  yLabelsGroup.selectAll("text")
    .on("click", function() {
      // get value of selection
      var value = d3.select(this).attr("value");
      if (value !== chosenYAxis) {

        // replaces chosenYAxis with value
        chosenYAxis = value;

        // functions here found above csv import
        // updates x scale for new data
        yLinearScale = yScale(healthData, chosenYAxis);

        // updates x axis with transition
        yAxis = renderYAxes(yLinearScale, yAxis);

        // updates circles with new x values
        stateCirclesGroup = renderCircles(stateCirclesGroup,
                          xLinearScale, chosenXAxis,
                          yLinearScale, chosenYAxis);

        // updates circles with new x values
        stateTextGroup = renderLabels(stateTextGroup,
                          xLinearScale, chosenXAxis,
                          yLinearScale, chosenYAxis);

        // updates tooltips with new info
        stateCirclesGroup = updateToolTip(chosenXAxis, chosenYAxis, stateCirclesGroup);


        // Update the trend line
        // Doing this inline vs. in a function because having difficulty
        // with scope of some of the scaling functions

        // Get the coordinates defining the new trend line
        newtrendCoordArray = getLinearRegr( chosenXAxis, chosenYAxis, healthData );
        console.log("New Trend Line Coords:", newtrendCoordArray);

        // Create a new line generator function
        var newcreateLine = d3.line()
          .x(data => xLinearScale( data.x ) )
          .y(data => yLinearScale( data.y ) );

        trendLineGroup.transition()
          .duration(1000)
          .attr("d", newcreateLine( newtrendCoordArray ) );


        // changes classes to change bold text
        if (chosenYAxis === "poverty") {
          yAxisLabel_Poverty
            .classed("active", true)
            .classed("inactive", false);

          yAxisLabel_Obesity
            .classed("active", false)
            .classed("inactive", true);
        }
        else {
          yAxisLabel_Poverty
            .classed("active", false)
            .classed("inactive", true);

          yAxisLabel_Obesity
            .classed("active", true)
            .classed("inactive", false);
        }
      }
    });

});

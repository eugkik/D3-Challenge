var svgWidth = 900;
var svgHeight = 600;

var margin = {
  top: 50,
  right: 50,
  bottom: 100,
  left: 100
};

var width = svgWidth - margin.left - margin.right;
var height = svgHeight - margin.top - margin.bottom;

var svg = d3
  .select("#scatter")
  .append("svg")
  .attr("width", svgWidth)
  .attr("height", svgHeight);

var chartGroup = svg.append("g")
  .attr("transform", `translate(${margin.left}, ${margin.top})`);

// set initial parameters
var chosenXaxis = "poverty";
var chosenYaxis = "healthcare";

// function for creating and updating xScale
function xScale(censusData, chosenXaxis) {
  var xLinearScale = d3.scaleLinear()
    .domain([d3.min(censusData, d => d[chosenXaxis]) * 0.9,
      d3.max(censusData, d => d[chosenXaxis]) * 1.1])
    .range([0, width]);

  return xLinearScale;
}

// function for creating and updating yScale
function yScale(censusData, chosenYaxis) {
  var yLinearScale = d3.scaleLinear()
    .domain([d3.min(censusData, d => d[chosenYaxis]) * 0.9,
      d3.max(censusData, d => d[chosenYaxis]) * 1.1])
    .range([height, 0]);
  return yLinearScale;
}

// function for updating xAxis
function renderXaxes(newXScale, xAxis) {
  var bottomAxis = d3.axisBottom(newXScale);

  xAxis.transition()
    .duration(1000)
    .call(bottomAxis);

  return xAxis;
}

// function for updating yAxis
function renderYaxes(newYScale, yAxis) {
  var leftAxis = d3.axisLeft(newYScale);

  yAxis.transition()
    .duration(1000)
    .call(leftAxis);

  return yAxis;
}

// function for updating circles group for X axis changes
function renderCircles(circlesGroup, newXScale, newYScale, chosenXaxis, chosenYaxis) {

  circlesGroup.transition()
    .duration(1000)
    .attr("cx", d => newXScale(d[chosenXaxis]))
    .attr("cy", d => newYScale(d[chosenYaxis]))

  return circlesGroup;
}

// function for updating circles group for Y axis changes
function yRenderCircles(circlesGroup, newYScale, chosenYaxis) {

  circlesGroup.transition()
    .duration(1000)
    .attr("cy", d => newYScale(d[chosenYaxis]))

  return circlesGroup;
}

// function for updating state text
function renderText (textGroup, newXScale, newYScale, chosenXaxis) {
  textGroup.transition()

    .duration(1000)
    .attr("x", d => newXScale(d[chosenXaxis]))
    .attr("y", d => newYScale(d[chosenYaxis]));

  return textGroup;
}

// function for updating circles group with new tooltip
function updateToolTip(circlesGroup, chosenXaxis, chosenYaxis) {

  xSuffix = "";

  // change tooltip based on X axis
  if (chosenXaxis === "poverty") {
    xTip = "Poverty: ";
    xSuffix = "%";
    }
  else if (chosenXaxis === "age") {
    xTip = "Age: ";
  }
  else {
    xTip = "Income: $"
  }

  // change tooltip based on Y axis
  if (chosenYaxis === "healthcare") {
    yTip = "Lacks Healthcare: ";
    }
  else if (chosenYaxis === "obesity") {
    yTip = "Obesity: ";
  }
  else {
    yTip = "Smokes: "
  }

  var toolTip = d3.tip()
    .attr("class", "d3-tip")
    .offset([40, -70])
    .html(function(d) {
      return (`${d.state}<br>${xTip}${d[chosenXaxis]}${xSuffix}<br>${yTip}${d[chosenYaxis]}%`);
    });

  circlesGroup.call(toolTip);

  circlesGroup.on("mouseover", function(d) {
    toolTip.show(d, this);
  })
    .on("mouseout", function(d) {
      toolTip.hide(d);
    });

  return circlesGroup;
}

// create inital chart
d3.csv("data/data.csv").then(function(censusData) {
  
  // parse data
  censusData.forEach(function(data) {
    data.poverty = +data.poverty;
    data.healthcare = +data.healthcare;
    data.smokes = +data.smokes;
    data.obesity = +data.obesity;
    data.age = +data.age;
    data.income = +data.income;
  });

  // call scale functions for initial scales
  var xLinearScale = xScale(censusData, chosenXaxis);
  var yLinearScale = yScale(censusData, chosenYaxis);
  
  // initial axis functions
  var bottomAxis = d3.axisBottom(xLinearScale);
  var leftAxis = d3.axisLeft(yLinearScale);

  // append initial x axis
  var xAxis = chartGroup.append("g")
    .attr("transform", `translate(0, ${height})`)
    .call(bottomAxis);

  // append initial y axis
  var yAxis = chartGroup.append("g")
    .call(leftAxis);

  // append initial circles
  circlesGroup = chartGroup.selectAll("circle")
    .data(censusData)
    .enter()
    .append("circle")
    .attr("cx", d => xLinearScale(d.poverty))
    .attr("cy", d => yLinearScale(d.healthcare))
    .attr("r", "10")
    .attr("class", "stateCircle")

  // add state abbreviation text
  text = chartGroup.append("g");
  
  textGroup = text.selectAll("text")
    .data(censusData)
    .enter()
    .append("text")
    .text(d => d.abbr)
    .style("font-size", "10px")
    .attr("x", d => xLinearScale(d.poverty))
    .attr("y", d => yLinearScale(d.healthcare))
    .attr("transform", `translate(0, 3)`)
    .attr("class", "stateText")

  // create group for 3 x-axis labels
  var xLabelsGroup = chartGroup.append("g")
    .attr("transform", `translate(${width / 2}, ${height + 20})`);

  var povertyLabel = xLabelsGroup.append("text")
    .attr("y", margin.bottom * (1/4))
    .attr("value", "poverty")
    .classed("active", true)
    .text("In Poverty (%)");

  var ageLabel = xLabelsGroup.append("text")
    .attr("y", margin.bottom * (2/4))
    .attr("value", "age")
    .classed("inactive", true)
    .text("Age (Median)");
  
  var incomeLabel = xLabelsGroup.append("text")
    .attr("y", margin.bottom * (3/4))
    .attr("value", "income")
    .classed("inactive", true)
    .text("Household Income (Median)");

  // create group for 3 y-axis labels
  var yLabelsGroup = chartGroup.append("g")
    .attr("transform", `translate(${-margin.left}, ${height/2})`);

  var healthcareLabel = yLabelsGroup.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", margin.left * 1/2)
    .attr("dy", "1em")
    .attr("value", "healthcare")
    .classed("active", true)
    .text("Lacks Healthcare (%)");

  var obesityLabel = yLabelsGroup.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", margin.left * 1/4)
    .attr("dy", "1em")
    .attr("value", "obesity")
    .classed("inactive", true)
    .text("Obesity (%)");

  var smokesLabel = yLabelsGroup.append("text")
    .attr("transform", "rotate(-90)")
    .attr("dy", "1em")
    .attr("value", "smokes")
    .classed("inactive", true)
    .text("Smokes (%)");
  
  // call function to create initial tooltip
  var circlesGroup = updateToolTip(circlesGroup, chosenXaxis, chosenYaxis);

  // x axis label listener
  xLabelsGroup.selectAll("text")
      .on("click", function() {
        // get value of selection
        var value = d3.select(this).attr("value");

        if (value !== chosenXaxis) {

          chosenXaxis = value;
          xLinearScale = xScale(censusData, chosenXaxis);
          xAxis = renderXaxes(xLinearScale, xAxis);
          circlesGroup = renderCircles(circlesGroup, xLinearScale, yLinearScale, chosenXaxis, chosenYaxis);
          circlesGroup = updateToolTip(circlesGroup, chosenXaxis, chosenYaxis);
          textGroup = renderText(textGroup, xLinearScale, yLinearScale, chosenXaxis);
          }

        
          if (chosenXaxis === "poverty") {
            povertyLabel
              .classed("active", true)
              .classed("inactive", false);
            ageLabel
              .classed("active", false)
              .classed("inactive", true);
            incomeLabel
              .classed("active", false)
              .classed("inactive", true);
          }
          else if (chosenXaxis === "age") {
            povertyLabel
              .classed("active", false)
              .classed("inactive", true);
            ageLabel
              .classed("active", true)
              .classed("inactive", false);
            incomeLabel
              .classed("active", false)
              .classed("inactive", true);
          }
          else {
            povertyLabel
              .classed("active", false)
              .classed("inactive", true);
            ageLabel
              .classed("active", false)
              .classed("inactive", true);
            incomeLabel
              .classed("active", true)
              .classed("inactive", false);
          }
        });

  // y axis label listener
  yLabelsGroup.selectAll("text")
      .on("click", function()  {
        // get value of selection
        var value = d3.select(this).attr("value");

        if (value !== chosenYaxis) {

          chosenYaxis = value;
          yLinearScale = yScale(censusData, chosenYaxis);
          yAxis = renderYaxes(yLinearScale, yAxis);
          circlesGroup = renderCircles(circlesGroup, xLinearScale, yLinearScale, chosenXaxis, chosenYaxis);
          circlesGroup = updateToolTip(circlesGroup, chosenXaxis, chosenYaxis);
          textGroup = renderText(textGroup, xLinearScale, yLinearScale, chosenXaxis);

          }

          if (chosenYaxis === "healthcare") {
            healthcareLabel
              .classed("active", true)
              .classed("inactive", false);
            obesityLabel
              .classed("active", false)
              .classed("inactive", true);
            smokesLabel
              .classed("active", false)
              .classed("inactive", true);
          }
          else if (chosenYaxis === "obesity") {
            healthcareLabel
              .classed("active", false)
              .classed("inactive", true);
            obesityLabel
              .classed("active", true)
              .classed("inactive", false);
            smokesLabel
              .classed("active", false)
              .classed("inactive", true);
          }
          else {
            healthcareLabel
              .classed("active", false)
              .classed("inactive", true);
            obesityLabel
              .classed("active", false)
              .classed("inactive", true);
            smokesLabel
              .classed("active", true)
              .classed("inactive", false);
          }

      });
  }).catch(function(error) {
    console.log(error);
});

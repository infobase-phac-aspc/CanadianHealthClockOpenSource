/* This script will allow you to create a visual representation of things that happen a few 
tens of thousands of time per year using a clock like structure. The working exemple will
create various clocks to represent mortality per year of some chronic diseases. 
The variables will be clearly labeled so it will be easy to modify them to fit your
data and adapt it to your needs.

Dependencies:
Momentjs
D3js

The script will require a CSV file in the following format with the exact same name headers!!!
2 columns
1st column: name
2nd column: occurence

in our case, our csv looks like this:
name,occurence
Cancer,70000
Digestive Diseases, 10000
...
and so on

Because of the way D3 loads promises of data instead of the actual data
we will need to include the following code inside the script tag of the
associated html to ensure this script as the data to begin computations:
        d3.csv('chronicDiseasesData.csv').then(function(data) {
            deathClock(data);
        })
the .then(function(data) {...}) ensures the data is fully loaded without errors

Author: Alexandre Boyer
Date: 2018-07-11
Edits made by Johic Mes
Date: 2018-12-01
*/

// Custom variable, change these to tailor the program to your needs
var pathToCSV = "allCauseMortalityData.csv";
var IDOuterContainer = "#deathClockContainer";
var IDInnerDivs = ["rowClockHeader", "rowClockBody", "rowBarChart", "rowTable"];

// global variables, I would have liked to keep them private but other functions
// need them as well --- Gotta love JS!
var x,
	y,
	barChartHeight,
	GlobalData,
	xmlHttp;
var colorArray = [];

function deathClock(data) {
	GlobalData = data;

	for (var i = 0; i < data.length; i++) {
		var tmpRateCount = calculateCurrentAngle(+data[i].occurrence)
		data[i].occurrence = +data[i].occurrence;
		data[i].endAngle = tmpRateCount[0];
		data[i].currentTotal = tmpRateCount[1];
		data[i].dailyTotal = tmpRateCount[1] % (data[i].occurrence / 365);
		data[i].angleRate = tmpRateCount[2];
	}
	// Initialize Title
	$("#title").append("<h1>" + readStringFromFileAtPath("txt/title.txt") + "</h1>");

	// initialise the different rows
	// Make header section
	initRowClockHeader(data);
	var hrelem = document.createElement('hr'); // Appends a HR element to make it all purdy
	$("#deathClockContainer")
		.append(hrelem)
		.append("<h2>" + readStringFromFileAtPath("txt/subheading1.txt") + "</h2>") // Reads subheading1 text file

	// Make many clocks section
	initRowClockBody(data);
	var hrelem = document.createElement('hr');


	var div = document.createElement('div');
	div.setAttribute("id", "circle");
	div.setAttribute("class", "col-md-1");

	$("#deathClockContainer")
		.append(hrelem)
		.append(div)

	var div = document.createElement('div');
	div.setAttribute("class", "col-md-11");
	div.innerHTML = ("<h2>" + readStringFromFileAtPath("txt/subheading5.txt") + "</h2>");
	$("#deathClockContainer")
		.append(div);

	// Make table section
	initTable(data);

	var hrelem = document.createElement('hr'); // Appends a HR element to make it all purdy
	$("#deathClockContainer")
		.append("<A NAME=subheading4></A>")
		.append("<h2>How the numbers are generated</h2>")
		.append("<p>The clock is based on the most recent available mortality data. For example, the 2019 clock is based on 2016 mortality data.</p>")
		.append(hrelem)
		.append("<h2>" + readStringFromFileAtPath("txt/subheading6.txt") + "</h2>")

	initTableStatic(data);

	//Build sources section (he element as a divider and the text afterwards)
	var hrelem = document.createElement('hr');
	$("#deathClockContainer")
		.append(hrelem)
		.append("<h2>" + readStringFromFileAtPath("txt/subheading4.txt") + "</h2>")
		.append("<p>" + readStringFromFileAtPath("txt/sources.txt") + "</p>")

	var hrelem = document.createElement('hr'); // Appends a HR element to make it all purdy
	$("#deathClockContainer")
		.append(hrelem)
		.append("<h2>" + readStringFromFileAtPath("txt/subheading2.txt") + "</h2>");

	// Make Bar Chart Section
	initBarChart(data);

	// There are two interval used one for each size of clock. 
	// Depending on what size arcTween takes a different value.
	d3.interval(function() {
		d3.selectAll("#rowClockHeader path").transition().ease(d3.easeElastic)
			.duration(500)
			.attrTween("d", arcTween(0))
	}, 1000);

	d3.interval(function() {
		d3.selectAll("#rowClockBody path").transition().ease(d3.easeElastic)
			.duration(500)
			.attrTween("d", arcTween(1))
	}, 1000);
}


function initRowClockHeader(data) {
	buildColorArray(data); // Builds the color array that is used by the bpdy of clocks and the bar chart

	// creates a deep copy of data so we don't modify it in the process
	var dataHeader = JSON.parse(JSON.stringify(data[0]));
	// prepare the special case for the total clock

	var dataHeader = dataHeader;
	dataHeader.name = "Total";
	dataHeader.occurrence = 0;
	// find the total of all the chronic diseases
	for (var i = 0; i < data.length; i++) {
		dataHeader.occurrence += data[i].occurrence;
	}
	var tmpRateCount = calculateCurrentAngle(dataHeader.occurrence)
	dataHeader.endAngle = tmpRateCount[0];
	dataHeader.currentTotal = tmpRateCount[1];
	dataHeader.dailyTotal = tmpRateCount[1] % (dataHeader.occurrence / 365);
	dataHeader.angleRate = tmpRateCount[2];
	// create the row inside the new div
	var rowClockHeader = d3.select(IDOuterContainer)
		.append("div")
		.attr("id", IDInnerDivs[0])
		.attr("class", "row");

	// div which will contain the SVG of the total mortality
	var totalClockHeight = 500,
		totalClockWidth = $("#deathClockContainer").width();

	var totalClockG = rowClockHeader.append("div")
		.attr("id", "totalClock")
		.attr("class", "visual col-lg-6 col-md-6 col-sm-12 svg-container")
		.append("svg")
		.attr("viewBox", "0 0 " + totalClockWidth + " " + totalClockHeight)
		.style("width", totalClockWidth + "px")
		.style("height", totalClockHeight + "px")
		.classed("svg-content-responsive", true)
		.append("g")
		.attr("id", "clockPos")
		.attr("transform", "translate(" + 250 + "," + ((totalClockHeight / 2) + 20) + ")"); // make x value

	// Makes the text beside the clock
	// Creates the div to add the text beside the clock
	rowClockHeader.append("div")
		.attr("id", "totalClockText")
		.attr("class", "visual col-lg-6 col-md-6 col-sm-12 svg-container")
	// Appends paragraph to the div avbove

	$("#totalClockText")
		.append("<h3>" + readStringFromFileAtPath("txt/subheading0.txt") + "</h3>")
		.append("<ul id = notesList></ul>");

	$("#notesList")
		.append(readStringFromFileAtPath("txt/about.txt"));

	// let's create the path element.
	var arc = d3.arc()
		// .innerRadius($("#deathClockContainer").width() / 2 - 125)
		// .outerRadius($("#deathClockContainer").width() / 2 - 100)
		.innerRadius(160)
		.outerRadius(200)
		.startAngle(0);

	totalClockG.append("path")
		.datum(dataHeader)
		.attr("id", "totalClockPath")
		.attr("fill", "black")
		.attr("stroke", "gray")
		.attr("stroke-width", "1.5")
		.attr("d", arc);
	// now some text
	totalClockG.append("text")
		.attr("text-anchor", "middle")
		.attr("x", 0)
		.attr("y", -220)
		.style("font-weight", "bold")
		.style("Font-size", "X-LARGE")
		.text("Total Deaths so far...")
	// this text contains the total annual deaths per yer
	totalClockG.append("text")
		.datum(dataHeader)
		.attr("text-anchor", "middle")
		.attr("id", "totalClockTotalYear")
		.attr("class", "clockTotalYear")
		.attr("x", 0)
		.attr("y", 10)
		.text(function(d) {
			return ("This year " + d3.format(",.0f")(+d.currentTotal));
		})
		.style("font-weight", "bold")
		.style("Font-size", "XX-LARGE")
		.classed("big", true);

	totalClockG.append("text")
		.datum(dataHeader)
		.attr("text-anchor", "middle")
		.attr("id", "totalClockTotalDaily")
		.attr("class", "clockTotalDaily")
		.attr("x", 0)
		.attr("y", -20)
		.text(function(d) {
			return ("Today " + d3.format(",.0f")(+d.dailyTotal));
		})
		.style("font-weight", "bold")
		.style("Font-size", "XX-LARGE")
		.classed("big", true);
	// this text contains the rate of total annual deaths
	totalClockG.append("text")
		.attr("text-anchor", "middle")
		.attr("id", "totalClockRate")
		.attr("x", 0)
		.attr("y", 30)
		.text(function() {
			return ("One death every " + (1 / (dataHeader.occurrence / 365 / 1440)).toFixed(2) + " minutes.");
		})
		.classed("small", true);

	var notchesDiv = document.createElement('div');

	notchesDiv.setAttribute("id", "notch-container50")
	notchesDiv.setAttribute("style", "width:" + totalClockWidth + ";" + "height:" + totalClockHeight + ";")

	$("#totalClock")
		.append(notchesDiv)

	ticMarks(50, 260, ((totalClockHeight / 2) + 20), 200); // TODO : Make this mor consistent (Adds ticmarks to main clock)
}

function initRowClockBody(data) {
	// create new row for the smaller clocks
	var rowClockBody = d3.select(IDOuterContainer)
		.append("div")
		.attr("id", IDInnerDivs[1])
		.attr("class", "row");


	// creation of the svg elements to contain the smaller clocks
	const individualClockHeight = 350,
		individualClockWidth = 250;
	for (var i = 0; i < data.length; i++) {
		var individualClockG = rowClockBody.append("div")
			.attr("id", "individualClock" + i)
			.attr("class", "visual col-md-4 col-sm-6 col-xs-12 col-lg-3 svg-container")
			.append("svg")
			.attr("viewBox", "0 0 " + individualClockWidth + " " + individualClockHeight)
			.style("width", individualClockWidth + "px")
			.style("height", individualClockHeight + "px")
			.classed("svg-content-responsive", true)
			.append("g")
			.attr("transform", "translate(" + (individualClockWidth / 2) + "," + ((individualClockHeight / 2) + 20) + ")")


		// let's create the path element.
		var arc = d3.arc()
			.innerRadius(100)
			.outerRadius(125)
			.startAngle(0);


		individualClockG.append("path")
			.datum(data[i])
			.attr("id", ("individualClockPath" + i))
			.attr("fill", colorArray[i])
			.attr("stroke", "gray")
			.attr("stroke-width", "1.5")
			.attr("d", arc);
		// now some text
		individualClockG.append("text")
			.attr("id", ("individualClockTitle" + i))
			.attr("class", "")
			.attr("text-anchor", "middle")
			.attr("x", 0)
			.attr("y", -140)
			.style("font-weight", "bold")
			.text(data[i].name)
			.classed("small", true);
		wrap(d3.select("#individualClockTitle" + i, 75))
		// this text contains the rate of total annual deaths
		individualClockG.append("text")
			.attr("text-anchor", "middle")
			.attr("id", ("individualClockRate" + i))
			.attr("x", 0)
			.attr("y", +30)
			.text(function() {
				return ("One death every " + (1 / (data[i].occurrence / 365 / 1440)).toFixed(2) + " minutes.");
			})
			.classed("small", true)
			.style("font-size", "small");
		// this text contains the total annual deaths per yer
		individualClockG.append("text")
			.datum(data[i])
			.attr("text-anchor", "middle")
			.attr("id", ("individualClockTotalYear" + i))
			.attr("class", "clockTotalYear")
			.attr("x", 0)
			.attr("y", +10)
			.text(function(d) {
				return "This year " + d3.format(",.0f")(+d.currentTotal);
			})
			.style("font-weight", "bold")
			.style("Font-size", "X-LARGE")
			.classed("big", true);

		individualClockG.append("text")
			.datum(data[i])
			.attr("text-anchor", "middle")
			.attr("id", ("individualClockTotalDaily" + i))
			.attr("class", "clockTotalDaily")
			.attr("x", 0)
			.attr("y", -20)
			.text(function(d) {
				return "Today " + d3.format(",.0f")(+d.dailyTotal);
			})
			.style("font-weight", "bold")
			.style("Font-size", "X-LARGE")
			.classed("big", true);

		var notchesDiv = document.createElement('div');

		notchesDiv.setAttribute("id", "notch-container" + i)
		notchesDiv.setAttribute("style", "width:" + individualClockWidth + ";" + "height:" + individualClockHeight + ";")

		$("#" + "individualClock" + i)
			.append(notchesDiv)

		ticMarks(i, individualClockWidth / 2 + 10, individualClockHeight / 2 + 20, 125);

	}
}

function initBarChart(data) {
	var margin = { top: 20, right: 70, bottom: 40, left: 70 };
	var rowBarChart = d3.select(IDOuterContainer)
		.append("div")
		.attr("id", IDInnerDivs[2])
		.attr("class", "row");

	var barChartWidth = $("#deathClockContainer").width();
	barChartHeight = 650;

	var rowBarChartG = rowBarChart.append("div")
		.attr("id", "barChartSVGdiv")
		.attr("class", "visual col-md-12 col-sm-12 svg-container")
		.append("svg")
		.attr("id", "barChartSVG")
		.attr("viewBox", "0 0 " + barChartWidth +
			" " + barChartHeight)
		.style("width", barChartWidth + "px")
		.style("height", barChartHeight + "px")
		.classed("svg-content-responsive", true)
		.append("g")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	barChartWidth = $("#deathClockContainer").width() - margin.left - margin.right;
	barChartHeight = 500 - margin.top - margin.bottom;

	x = d3.scaleBand().rangeRound([0, barChartWidth]).padding(0.1);
	y = d3.scaleLinear().rangeRound([barChartHeight, 0]);

	x.domain(data.map(function(d) {
		return d.name;
	}));
	y.domain([0, d3.max(data, function(d) {
		return d.currentTotal;
	})]);

	rowBarChartG.append("g")
		.attr("class", "axis axis--x")
		.attr("transform", "translate(0," + barChartHeight + ")")
		.call(d3.axisBottom(x));

	rowBarChartG.append("g")
		.attr("class", "axis axis--y")
		.call(d3.axisLeft(y).ticks(10))
		.append("text")
		.attr("transform", "rotate(-90)")
		.attr("y", 6)
		.attr("dy", "0.71em")
		.attr("text-anchor", "end")
		.text("Mortality");

	rowBarChartG.selectAll(".bar")
		.data(data)
		.enter().append("rect")
		.attr("id", function(d, i) { return "bar" + i; })
		.attr("class", "bar")
		.attr("fill", function(d, i) { return colorArray[i]; })
		.attr("stroke", "gray")
		.attr("stroke-width", "1.5")
		.attr("x", function(d) { return x(d.name); })
		.attr("y", function(d) { return y(d.currentTotal); })
		.attr("width", x.bandwidth())
		.attr("height", function(d) { return barChartHeight - y(d.currentTotal); });

	// Y axis text
	rowBarChartG.append("text")
		.attr("transform", "rotate(-90)")
		.attr("y", 0 - margin.left)
		.attr("x", 0 - (barChartHeight / 2))
		.attr("dy", "1em")
		.style("text-anchor", "middle")
		.text("Number of deaths per year");

	// X Axis text
	rowBarChartG.append("text")
		.attr("transform",
			"translate(" + (barChartWidth / 2) + " ," +
			(barChartHeight + margin.top + 150) + ")")
		.style("text-anchor", "middle")
		.text("Causes of death");

	d3.selectAll(".axis--x text").attr("transform", "rotate(-45)")
		.attr("text-anchor", "end")
		.style("font-weight", "bold")
		.style("Font-size", "small")
		.attr("dx", -10);
}

function initTable(data) {
	var rowTable = d3.select(IDOuterContainer)
		.append("div")
		.attr("id", IDInnerDivs[3])
		.attr("class", "row");

	//Note: Reenable this later...
	//rowTable.append('h3').html("Chronic Disease Mortality");
	// rowTable.append('p').html("The 2019 Canadian Health Clock is based on the most recently available mortality data in Canada in 2016. Total number of deaths in a year for Canada (2016) are as follows:");
	var table = rowTable.append('table').attr("class", "table table-hover table-striped table-bordered"); // base table
	var tableHead = table.append("thead").append("tr"); // row of the header
	tableHead.append("th").text("Cause of Death");
	tableHead.append("th").text("So far today...");
	tableHead.append("th").text("So far this year...");
	var tableBody = table.append("tbody");
	tableBody.selectAll("tr")
		.data(data)
		.enter()
		.append("tr")
		.attr("class", "dataRow")
		.html(function(d) {
			return '<td>' + d.name + '</td>' + '<td>' +
				d3.format(",.0f")(+d.dailyTotal) + '</td>' + '<td>' +
				d3.format(",.0f")(+d.currentTotal) + '</td>';
		});
	var lastTableRow = tableBody.append("tr")
		.data(d3.select("#totalClockPath").data())
		.attr("class", "dataRow")
		.html(function(d) {
			return '<td>' + d.name + '</td>' + '<td>' +
				d3.format(",.0f")(+d.dailyTotal) + '</td>' + '<td>' +
				d3.format(",.0f")(+d.currentTotal) + '</td>';
		});
}

function initTableStatic(data) {
	var rowTable2 = d3.select(IDOuterContainer)
		.append("div")
		.attr("id", IDInnerDivs[3])
		.attr("class", "row");

	//Note: Reenable this later...
	//rowTable.append('h3').html("Chronic Disease Mortality");
	// rowTable.append('p').html("The 2019 Canadian Health Clock is based on the most recently available mortality data in Canada in 2016. Total number of deaths in a year for Canada (2016) are as follows:");
	var table2 = rowTable2.append('table').attr("class", "table table-hover table-striped table-bordered"); // base table
	var tableHead2 = table2.append("thead").append("tr"); // row of the header
	tableHead2.append("th").text("Cause of Death");
	tableHead2.append("th").text("Annual number of deaths");
	var tableBody2 = table2.append("tbody");
	tableBody2.selectAll("tr")
		.data(data)
		.enter()
		.append("tr")
		.attr("class", "dataRowStatic")
		.html(function(d) {
			return '<td>' + d.name + '</td>' + '<td>' +
				d3.format(",.0f")(+d.occurrence) + '</td>';
		});
	var lastTableRow2 = tableBody2.append("tr")
		.data(d3.select("#totalClockPath").data())
		.attr("class", "dataRowStatic")
		.html(function(d) {
			return '<td>' + d.name + '</td>' + '<td>' +
				d3.format(",.0f")(+d.occurrence) + '</td>';
		});
}

function update(clockID) {
	d3.selectAll("text.clockTotalYear").text(function(d) {
		return "This year " + d3.format(",.0f")(+d.currentTotal);
	});
	d3.selectAll("text.clockTotalDaily").text(function(d) {
		return "Today " + d3.format(",.0f")(+d.dailyTotal);
	});

	d3.selectAll("tr.dataRow").html(function(d) {
		return '<td>' + d.name + '</td>' + '<td>' +
			d3.format(",.0f")(+d.dailyTotal) + '</td>' + '<td>' +
			d3.format(",.0f")(+d.currentTotal) + '</td>';
	});
	y.domain([0, d3.max(d3.selectAll(".bar").data(), function(d) {
		return d.currentTotal;
	})]);

	d3.select(".axis--y").call(d3.axisLeft(y).ticks(10));

	d3.selectAll(".bar").transition().duration(500)
		.attr("height", function(d) { return barChartHeight - y(d.currentTotal); })
		.attr("y", function(d) { return y(d.currentTotal); });

	var clockNumber = clockID.charAt(clockID.length - 1);
	if (clockNumber != "h") {
		d3.select("#bar" + clockNumber).transition().duration(250)
			.attr("fill", "white").transition().duration(250)
			.attr("fill", colorArray[clockNumber]);
	}
}

function calculateCurrentAngle(total) {
	// Defines constramts and strating variables (Self explanatory name)
	const secInDay = 86400;
	var deathPerDay = total / 365;
	var deathPerSec = deathPerDay / secInDay;
	var anglePerSec = deathPerSec * Math.PI * 2;

	var st = srvTime(); // Gets time from server and creates a moment with it. Its the now time to be used
	var now = new moment(st);

	var jan1 = moment(moment().format("YYYY") + "-01-01 00:00:00"); // returns a momentjs date for january 1st of this year
	var durationDaysNow_Jan1 = moment.duration(now.diff(jan1, "days"), "days").asDays();
	var smtMidnight = now.clone().startOf('day');
	var diffSecondsMidnight = now.diff(smtMidnight, 'seconds'); // get the difference in seconds since the begining of the day of the simulated day
	var currentDeathCount = deathPerDay * durationDaysNow_Jan1;
	var deathToday = deathPerSec * diffSecondsMidnight;
	currentDeathCount += deathToday; // since the deaths before today are calculated differently than the deaths of today, we need to add them together
	var decimalDeathCount = +(currentDeathCount % 1).toFixed(3); // the decimal portion will be used to calculate the angle as a percentage of 1 death
	var actualAngle = (2 * Math.PI) * decimalDeathCount; // get the current potion of the angle with respect to its ration and 3*pi/2

	return [actualAngle, Math.floor(currentDeathCount), anglePerSec]; // return angle and deathCount for a specific disease
}

// euh I dunno ¯\_(ツ)_/¯ (Will check and comment later)... Pretty sure it formats and places clock names in the right positions 
function wrap(text, width) {
	var words = text.text().split(/\s+/).reverse(),
		word,
		line = [],
		lineNumber = 0,
		lineHeight = 1.1, // ems
		y = text.attr("y"),
		dy = 0,
		//parseFloat(text.attr("dy")),
		flag = true,
		tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y - 15).attr("dy", dy + "em");
	while (word = words.pop()) {
		line.push(word);
		tspan.text(line.join(" "));
		if (tspan.node().getComputedTextLength() > 175) {
			flag = false;
			line.pop();
			tspan.text(line.join(" "));
			line = [word];
			tspan = text.append("tspan").attr("x", 0).attr("y", y - 15).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
		}
	}
	if (flag) tspan.attr("y", y);
}
// Two arc value depending on the size of the circle used
var arc1 = d3.arc()
	.innerRadius(160)
	.outerRadius(200)
	.startAngle(0);

var arc2 = d3.arc()
	.innerRadius(100)
	.outerRadius(125)
	.startAngle(0);

function arcTween(value) {
	return function(d) {
		var newAngle = d.endAngle + d.angleRate;
		if (newAngle >= 2 * Math.PI) {
			newAngle -= 2 * Math.PI;
			d.currentTotal += 1;
			d.dailyTotal += 1
			update(this.id);
		}
		var interpolate = d3.interpolate(d.endAngle, newAngle);
		return function(t) {
			d.endAngle = interpolate(t);
			if (value == 0) // TWO ARCS ARE POSSILE FOR THE TWO SIZES OF RADIUS POSSIBLE IN THE PAGE
				return arc1(d);
			else
				return arc2(d);

		};
	};
}

// Method used to add tic marks to all the clocks
function ticMarks(i, posX, posY, radius) {

	// Converts vector to angle
	function vec2ang(x, y) {
		var angleInRadians = Math.atan2(y, x);
		var angleInDegrees = (angleInRadians / Math.PI) * 180.0;
		return angleInDegrees;
	}

	// This portion makes the notches
	let nc = $("#notch-container" + i); // Gets attribute to append them to
	let angle = 0; // Start angle (Default is 0)
	let rotate_x = radius; // Radius of circle
	let rotate_y = 0;
	/* -- Calculate the 60 notches for seconds and minutes -- */
	for (let i = 0; i < 60; i++) { // Make 60 slices
		let x = rotate_x * Math.cos(angle) - rotate_y * Math.cos(angle); // Find x and y coordinates
		let y = rotate_y * Math.cos(angle) + rotate_x * Math.sin(angle);
		let r = vec2ang(x, y);

		if (i % 5 == 0) { // Every 5 notched make a bigger notch
			let notch = document.createElement("div");
			notch.className = "notch";
			notch.style.left = posX + x + "px"; // Positioning inside the div
			notch.style.top = posY + y + "px";
			notch.style.transform = "rotate(" + r + "deg)"; //Angles the slices eavenly
			nc.append(notch);
		} else {
			let thin = document.createElement("div");
			thin.className = "thin";
			thin.style.left = posX + x + "px"; // Positioning inside the div
			thin.style.top = posY + y + "px";
			thin.style.transform = "rotate(" + r + "deg)"; // Angles the slices eavenly
			nc.append(thin); // Append to the page
		}
		angle += (Math.PI / 300) * 10; // Increase to next angle
	}
}

function resize() { // TODO: ADD A CALL TO CLOCK UPDATE AND CHANGE THE METHOD A BIT TO ALLOW RESIZE OF THE ARC RADIUS FOR CHANGES ON THE FLY

	// **************************
	// ** Update the Bar graph **
	// **************************
	var margin = { top: 20, right: 20, bottom: 30, left: 40 }; // Defines margins (Same as before)
	var width = $("#deathClockContainer").width() - margin.left - margin.right; // Defines width (Sames as before)

	// Update the range of the scale with new width/height
	x = d3.scaleBand().rangeRound([0, width]).padding(0.1); // Redefine the variable because the scale and range are new

	// Updates domain (Technically unchanged but needs to be redefined)
	x.domain(GlobalData.map(function(d) {
		return d.name;
	}));

	// Update the axis and text with the new scale
	d3.select(".axis--x").call((d3.axisBottom(x)))
		.select(".label")
		.attr("transform", "translate(" + width / 2 + "," + margin.bottom / 1.5 + ")");

	// Force D3 to recalculate and update the line
	d3.select("#barChartSVG").selectAll(".bar")
		.attr("width", function(d) {
			return x.bandwidth();
		})
		.attr("x", function(d) { return x(d.name); })

	// ***********************************
	// ** Update main clock positioning **
	// ***********************************

	// let totalClockWidth = $("#deathClockContainer").width(); // Updates the clock width (Width of the window basically)

	// d3.select("#clockPos")
	// 	.attr("transform", "translate(" + (totalClockWidth / 2) + "," + ((500) / 2 + 20) + ")"); // 570 never changes cause div never has a different height


	// // Update tic Marks -- Work in progress!
	// var angle = 0
	// let rotate_x = 200; // Radius of circle TODO: Update to make dynamic
	// let rotate_y = 0;

	// d3.select("#notch-container50").selectAll("div").nodes().forEach(function(d) {
	// 	let x = rotate_x * Math.cos(angle) - rotate_y * Math.cos(angle);
	// 	d.style.left = (totalClockWidth / 2) + x + "px"; // Positioning inside the div
	// 	angle += (Math.PI / 300) * 10; // Increase to next angle
	// });
	// //.attr("transform", "translate(" + (totalClockWidth / 2) + "," + ((500) / 2 + 20) + ")"); // 570 never changes cause div never has a different height

	// TODO: Update the size of the radius (Modify the update() method to accomplish this?)
}

function buildColorArray(data) {
	//Builds the colour array (global cause used in bar chart as well as the clocks... needs to be consistent)
	for (var i = 1; i < data.length; i++) {
		colorArray.push('#' + Math.floor(Math.random() * 16777215).toString(16)); //16777215 = FFFFFF in string so it randomizes a hex color
	}
}


// This function is great for extracting any text in a text file.
function readStringFromFileAtPath(pathOfFileToReadFrom) {
	var request = new XMLHttpRequest();
	request.open("GET", pathOfFileToReadFrom, false);
	request.send(null);
	var returnValue = request.responseText;
	return returnValue; // Returns text in the file
}

// Gets server time to synchronize all clocks in use on different computers
function srvTime() {
	try {
		//FF, Opera, Safari, Chrome
		xmlHttp = new XMLHttpRequest();
	} catch (err1) {
		//IE
		try {
			xmlHttp = new ActiveXObject('Msxml2.XMLHTTP');
		} catch (err2) {
			try {
				xmlHttp = new ActiveXObject('Microsoft.XMLHTTP');
			} catch (eerr3) {
				//AJAX not supported, use CPU time.
				alert("AJAX not supported");
			}
		}
	}
	xmlHttp.open('HEAD', window.location.href.toString(), false);
	xmlHttp.setRequestHeader("Content-Type", "text/html");
	xmlHttp.send('');
	return xmlHttp.getResponseHeader("Date");
}


// Adds a listener to update main clock and bar graph on chnage of window size
window.addEventListener("resize", function() {
	resize(); // Calls fuonction to resize attributes
});

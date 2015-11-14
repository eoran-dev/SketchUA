// ----------------------------
// UA code editor / viewer
//   by CMDR Eoran, for 'The Canonn' R&D.
// Version: 1.2
// ----------------------------
// Credits:
//   code: CMDR Eoran
//   presets: CMDR rizal72
//   inspired by UA_Draw by: CMDR Anjin, and CMDR Red Wizard
// ----------------------------

// Paste in your UA code here, or leave blank to edit manually (default).
var startupDisplayCode = "";

var config = {
	cellSize: 16,
	pointRadius: 2,
	gridLineOpacity: 0.05,
	gridPointOpacity: 0.05,
	allowToggleVertex: true,
	maxCodesPerRow: 12,
	colorTriangleOver: new Color(0.6, 1.0, 0.6, 0.75),
	colorTriangleNormal: new Color(0.8, 0.95, 0.8, 0.5),
	colorLineHighlight: 'red',
	colorLineOver: 'green',
	colorLineNormal: 'black',
	colorTextOver: 'red',
	colorTextNormal: 'black'
};

// ---------------------------
// Internals.. quick and hacky javascript: ignore :)
var grid = {};

var axisX = {};
var axisY = {};
var origin = new Point(config.cellSize * 2, 2 * config.cellSize);

function coordToGridCode(coord) {
	return String.fromCharCode(97 + coord);
}

function createGrid() {
	for (var y = 0; y < 26; ++y) {
		for (var x = 0; x < 26; ++x) {
			var key = coordToGridCode(x) + coordToGridCode(y);
			var p = origin + new Point(x * config.cellSize, y * config.cellSize);
			var c = new Shape.Circle(p, config.pointRadius);
			c.fillColor = 'black';
			c.opacity = config.gridPointOpacity;
			c.gridCode = key;
			grid[key] = c;
		}
	}

	// add labels
	for (var i = 0; i < 26; ++i) {
		var gridCode = coordToGridCode(i);

		var dotL = origin + new Point(0, i * config.cellSize);
		var textL = origin + new Point(0, config.cellSize * i);
		var left = new PointText(textL);
		left.content = gridCode;
		left.justification = 'center';
		left.position += new Point(-config.cellSize * 0.75, left.bounds.height * 0.25);

		var dotR = origin + new Point(25 * config.cellSize, i * config.cellSize);
		var textR = origin + new Point(26 * config.cellSize, config.cellSize * 0.125 + config.cellSize * i);
		var right = new PointText(textR);
		right.content = gridCode;
		right.justification = 'center';
		right.position += new Point(0, right.bounds.height * 0.25);

		var horizontal = new Path.Line(dotL, dotR);
		horizontal.strokeColor = 'black';
		horizontal.strokeWidth = 1;
		horizontal.opacity = config.gridLineOpacity;
		axisY[gridCode] = [left, right, horizontal];


		var dotT = origin + new Point(i * config.cellSize, 0);
		var textT = origin + new Point(config.cellSize * i, 0);
		var top = new PointText(textT);
		top.content = gridCode;
		top.justification = 'center';
		top.position -= new Point(0, top.bounds.height * 0.5);

		var dotB = origin + new Point(i * config.cellSize, 25 * config.cellSize);
		var textB = origin + new Point(config.cellSize * i, 26 * config.cellSize);
		var bottom = new PointText(textB)
		bottom.content = gridCode;
		bottom.justification = 'center';

		var vertical = new Path.Line(dotT, dotB);
		vertical.strokeColor = 'black';
		vertical.strokeWidth = 1;
		vertical.opacity = config.gridLineOpacity;

		axisX[gridCode] = [top, bottom, vertical];
	}

}

var gridPoint = null;
function onMouseMove(event) {
	var closest = null;
	var x = event.point.x - origin.x;
	var y = event.point.y - origin.y;
	var cellX = Math.round(x / config.cellSize);
	var cellY = Math.round(y / config.cellSize);
	var cell = coordToGridCode(cellX)
		+ coordToGridCode(cellY);

	closest = grid[cell];

	if (closest != null) {
		closest.radius = 2 * config.pointRadius;
		closest.opacity = 1;
		if (gridPoint != closest && gridPoint != null) {
			gridPoint.radius = config.pointRadius;
			gridPoint.opacity = config.gridPointOpacity;
		}
		gridPoint = closest;
	}
	else if (gridPoint != null) {
		gridPoint.radius = config.pointRadius;
		gridPoint.opacity = config.gridPointOpacity;
		gridPoint = null;
	}
}

var triangle = null;

var markers = [];
var shapes = [];
var codes = [];
var sequence = [];

var caret = null;
var highlightedCaret = null;

var highlighted = null;

function getTextPosition(x) {
	return new Point(32 + 50 * (x % config.maxCodesPerRow),
		config.cellSize * 30 + 24 * Math.floor(x / config.maxCodesPerRow));
}

function getMarkerPosition(x) {
	return getTextPosition(x) + new Point(-24, 0);
}

function displayStyleHighlighted(item) {
	var i = item.shapeIndex;
	codes[i].strokeColor = config.colorTextOver;
	shapes[i].strokeColor = config.colorLineHighlight;
	shapes[i].strokeWidth = 3;
	shapes[i].bringToFront();
}

function displayStyleNormal(item) {
	var i = item.shapeIndex;
	//console.log("i: " + i);
	//console.log("codes.length" + codes.length);
	//for (var c in codes)
	//	console.log(c);
	codes[i].strokeColor = config.colorTextNormal;
	shapes[i].strokeColor = config.colorLineNormal;
	shapes[i].strokeWidth = 1;
}

function refreshCodeLocations() {
	for (var i = 0; i < codes.length; ++i) {
		codes[i].position = getTextPosition(i);
		markers[i].position = getMarkerPosition(i);
	}
}

function removeEntry(removeIndex) {
	// remove entry
	var c = [];
	var s = [];
	var t = [];
	var m = [];

	if (highlighted != null) {
		displayStyleNormal(highlighted);
		highlighted = null;
	}

	var index = 0;
	for (var i = 0; i < codes.length; ++i) {
		if (i != removeIndex) {
			// copy and update position
			codes[i].shapeIndex = index;
			codes[i].position = getTextPosition(c.length);
			c.push(codes[i]);

			sequence[i].shapeIndex = index;
			s.push(sequence[i]);

			shapes[i].shapeIndex = index;
			t.push(shapes[i]);

			markers[i].shapeIndex = index;
			markers[i].position = getMarkerPosition(m.length);
			m.push(markers[i]);
			++index;
		}
		else {
			// clear
			codes[i].visible = false;
			codes[i].onMouseEnter = null;
			codes[i].onMouseLeave = null;
			shapes[i].visible = false;
			markers[i].visible = false;
			delete codes[i];
			delete shapes[i];
			delete markers[i];
		}
	}

	codes = c;
	sequence = s;
	shapes = t;
	markers = m;
}

function insertItem(itemIndex, marker, shape, text, gridCode) {
	var c = [];
	var s = [];
	var t = [];
	var m = [];

	//if (highlighted != null) {
	//	displayStyleNormal(highlighted);
	//	highlighted = null;
	//}

	var index = 0;
	for (var i = 0; i < codes.length; ++i) {

		if (i == itemIndex) {
			text.shapeIndex = index;
			text.position = getTextPosition(index);
			c.push(text);

			marker.shapeIndex = index;
			marker.position = getMarkerPosition(index);
			m.push(marker);

			gridCode.shapeIndex = index;
			s.push(gridCode);

			shape.shapeIndex = index;
			t.push(shape);

			++index;
		}

		if (i >= itemIndex) {
			// copy and update position
			codes[i].shapeIndex = index;
			codes[i].position = getTextPosition(index);
			c.push(codes[i]);

			sequence[i].shapeIndex = index;
			s.push(sequence[i]);

			shapes[i].shapeIndex = index;
			t.push(shapes[i]);

			markers[i].shapeIndex = index;
			markers[i].position = getMarkerPosition(index);
			m.push(markers[i]);
		}
		else {
			c.push(codes[i]);
			s.push(sequence[i]);
			t.push(shapes[i]);
			m.push(markers[i]);
		}
		++index;
	}

	codes = c;
	sequence = s;
	shapes = t;
	markers = m;
}

function updateSimilarity() {
	for (var i in sequence) {
		var s = sequence[i];
		console.log(s);
	}
}

function processTriangle(t) {
	var shape = new Path();
	var gridCode = (t[0].gridCode + t[1].gridCode + t[2].gridCode).toUpperCase();
	shape.add(t[0].position);
	shape.add(t[1].position);
	shape.add(t[2].position);
	shape.strokeColor = config.colorLineNormal;
	shape.fillColor = config.colorTriangleNormal;
	shape.closed = true;
	shape.shapeIndex = shapes.length;
	shape.onMouseEnter = function (event) {
		this.strokeColor = config.colorLineOver;
		this.strokeWidth = 3;
		this.fillColor = config.colorTriangleOver;
		codes[this.shapeIndex].strokeColor = 'red';
	}
	shape.onMouseLeave = function (event) {
		this.strokeColor = config.colorLineNormal;
		this.strokeWidth = 1;
		this.fillColor = config.colorTriangleNormal;
		codes[this.shapeIndex].strokeColor = 'black';
	}

	var itemIndex = codes.length;
	if (caret != null)
		itemIndex = caret.shapeIndex;

	var text = new PointText(getTextPosition(itemIndex));
	text.content = gridCode;
	text.fontFamily = 'courier';
	text.strokeColor = config.colorTextNormal;
	text.shapeIndex = codes.length;
	text.position = getTextPosition(codes.length);
	text.justification = 'left';
	text.onMouseEnter = function (event) {
		if (highlighted != null)
			displayStyleNormal(highlighted);
		highlighted = this;
		displayStyleHighlighted(this);
	}
	text.onMouseLeave = function (event) {
		displayStyleNormal(this);
	}
	text.onMouseDown = function (event) {
		if (highlighted == null)
			return;

		removeEntry(this.shapeIndex);
	}

	var from = getMarkerPosition(itemIndex);
	var to = from + new Point(0, 20);
	var marker = new Path.Line(from, to);
	marker.strokeWidth = 2;
	marker.strokeColor = 'silver';
	marker.shapeIndex = codes.length;
	marker.position = from;
	marker.onMouseEnter = function (event) {
		if (caret == this)
			return
		if (highlightedCaret != null
			&& highlightedCaret != this
			&& highlightedCaret != caret) {
			highlightedCaret.strokeColor = 'silver';
			highlightedCaret.strokeWidth = 1;
		}
		highlightedCaret = this;
		this.strokeColor = 'red';
		this.strokeWidth = 2;
		//console.log("marker highlight");
	}
	marker.onMouseLeave = function (event) {
		if (highlightedCaret == this)
			highlightedCaret = null;

		if (caret == this)
			return;

		this.strokeColor = 'silver';
		this.strokeWidth = 2;
		//console.log("marker clear");
	}

	if (caret == null) {
		markers.push(marker)
		shapes.push(shape);
		codes.push(text);
		sequence.push(gridCode);
	}
	else {
		// insert caret and reposition other
		// shapes
		insertItem(itemIndex, marker, shape, text, gridCode);
	}

	if (!config.suspendEcho)
	{
		console.log(sequence.join(" "));
		console.log(" ");
	}

	//updateSimilarity();
}

function onMouseDown(event) {
	var p = event.point;

	//console.log("onMouseDown");

	if (gridPoint == null) {
		if (highlightedCaret == null) {
			if (caret != null) {
				caret.strokeColor = 'silver';
				caret.strokeWidth = 2;
				caret = null;
				//console.log("clear caret")
			}
		}
		else if (caret != highlightedCaret) {
			if (caret != null)
				caret.strokeColor = 'silver';
			caret = highlightedCaret;
			caret.strokeColor = 'red';
			//console.log("activate caret");
		}
	}

	if (gridPoint == null)
		return;

	gridPoint.selected = !gridPoint.selected;
	if (gridPoint.selected)
		gridPoint.selectedColor = 'red';
	else if (config.allowToggleVertex && (triangle != null)) {
		// remove
		remaining = []
		for (var i = 0; i < triangle.length; ++i) {
			if (triangle[i] != gridPoint)
				remaining.push(triangle[i]);
		}

		if (remaining.length > 0)
			triangle = remaining;
		else
			triangle = null;
		return;
	}

	if (triangle == null) {
		triangle = [gridPoint];
	}
	else if (triangle.length < 2) {
		triangle.push(gridPoint);
	}
	else {
		triangle.push(gridPoint);
		for (var i = 0; i < triangle.length; ++i)
			triangle[i].selected = false;
		processTriangle(triangle);
		triangle = null;
	}
}

var textSize = new PointText(new Point(0, 0));
textSize.content = "X";

config.labelHeight = textSize.bounds.height;
config.labelWidth = textSize.bounds.width;
function addPresetButton(origin, index, key, shape) {
	var verticalSpacing = config.labelHeight + 2;
	var preset = new PointText(origin + new Point(0, index * verticalSpacing));
	preset.content = key;
	preset.strokeColor = config.colorTextNormal;
	preset.onMouseDown = function (event) {
		if (presets[key] != "_clear_")
			console.log(key + ":");
		displayShape(shape);
	}
	preset.onMouseEnter = function (event) {
		this.strokeColor = config.colorTextOver;
	}
	preset.onMouseLeave = function (event) {
		this.strokeColor = config.colorTextNormal;
	}
}

var queryTable = {};
function addQueryTableFor(key) {
	var s = presets[key].replace(/ /, "");
	var table = { lines: {}, triangles: {}, vectors: {} };
	for (var i = 0; i < s.length; i += 6) {

		// add points
		var points = []
		for (var p = 0; p < 3; ++p) {
			var point = s.substr(i, 2);
			table[point] = true;
			points.push(point);
		}

		var lines = [];
		for (var p = 0; p < 3; ++p) {
			line = [points[p], points[(p + 1) % 3]];
			lines.push(line);
			table.lines[line.join("")] = true;
		}

		/*
		if (points[0] < points[1]) {
			var temp = points[0];
			point[0] = points[1];
			point[1] = temp;
		}
		*/

	}
	queryTable[key] = table;
}

function createPresets() {
	var origin = new Point(30 * config.cellSize, config.cellSize * 2);
	var index = 0;

	// add sentinal for clear
	var clearKey = "<< CLEAR >>";
	presets[clearKey] = "_clear_";
	addPresetButton(origin, index, clearKey, "_clear_");
	++index;

	for (var key in presets) {
		if (presets.hasOwnProperty(key)) {
			if (key == clearKey)
				continue; // already added
			addPresetButton(origin, index, key, presets[key]);
			++index;

			addQueryTableFor(key);
		}
	}
}

function clearGrid() {
	for (var i = 0; i < codes.length; ++i) {
		codes[i].visible = false;
		markers[i].visible = false;
		shapes[i].visible = false;
	}

	codes = [];
	markers = [];
	shapes = [];
	sequence = [];
	caret = null;
	highlighted = null;
	highlightedCaret = null;
}

config.suspendEcho = false;

function displayShape(shape) {
	if ((shape == null) || shape.length < 6)
		return;

	clearGrid();
	if (shape === "_clear_")
		return;
	shape = shape.replace(/ /g, "");

	config.suspendEcho = true;
	for (var i = 0; i < shape.length; i += 6) {
		var poly = shape.substr(i, 6).toLowerCase();
		if (poly.length < 3)
			continue; // only triplets
		t = [];
		for (var segment = 0; segment < 3; ++segment)
			t.push(grid[poly.substr(segment * 2, 2)]);
		if (i == shape.length - 6)
			config.suspendEcho = false;
		processTriangle(t);
	}
	config.suspendEcho = false;
}

function displayDefaultShape()
{
	if (startupDisplayCode != null && startupDisplayCode.length > 0)
		displayShape(startupDisplayCode);
	else if (presets["COBRA"] != null)
	{
		console.log("COBRA:");
		displayShape(presets["COBRA"]);
	}
}

var CODE_size = { shape: new PointText(new Point(0, 0)) };
CODE_size.shape.fontFamily = 'courier'
CODE_size.shape.content = "CCCCCCC";
config.code = {};
config.code.width = CODE_size.shape.bounds.width;
config.code.height = CODE_size.shape.bounds.height;
CODE_size = null;
paper.view.onResize = function (event) {
	config.maxCodesPerRow = Math.floor((paper.view.bounds.width - 12) / config.code.width);
	refreshCodeLocations();
}

createPresets();
createGrid();
displayDefaultShape();

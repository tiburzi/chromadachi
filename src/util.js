function Util () {};

Util.random = function(a=1) {
	return Math.random()*a;
}

Util.irandom = function(a) {
	return Math.round(Math.random()*a);
}

Util.randomRange = function(a,b) {
	return a+Math.random()*(b-a);
}

Util.irandomRange = function(a,b) {
	return Math.round(Util.randomRange(a,b));
}

Util.create2DArray = function(w, h) {
	var a = new Array(w);
	for (let i = 0; i < a.length; i++) {
	  a[i] = new Array(h);
	}
	return a;
}

function Grid () {};

Grid.create = function(w, h) {
    var width = (w|0) || 1;
    var height = (h|0) || 1;
    var array = Util.create2DArray(w, h);

    var grid = {
		array: array,
		width: width,
		height: height,

		isValid: Grid._isValid,
		get: Grid._getCell,
		set: Grid._setCell,
		/*remove: _clearCell,
		resize: _resizeGrid,

		reset: _resetGrid,*/
    };
    return grid;
}

Grid._isValid = function(x, y) {
	let inside = !(x < 0 || y < 0 || x >= this.width || y >= this.height);
	if (!inside) {console.log("("+x+","+y+") outside grid");}
	return inside;
}

Grid._getCell = function(x, y) {
	if (this.isValid(x, y))
		return this.array[x][y];
}

Grid._setCell = function(x, y, value) {
	if (this.isValid(x, y))
		this.array[x][y] = value;
}
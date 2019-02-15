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
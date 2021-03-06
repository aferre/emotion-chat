
function bubblesViz(config){

}

var DEBUG = (function(){
    var timestamp = function(){};
    timestamp.toString = function(){
        return "[DEBUG " + (new Date).toLocaleTimeString() + "]";    
    };

    return {
        log: console.log.bind(console, '%s', timestamp)
    }
})();

var parentHeight = 500;

var margin = {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0
},
width = 960 - margin.left - margin.right,
height = parentHeight/3 - margin.top - margin.bottom;


var n = 6,
    m = 1,
    padding = getPadding(width),
    radius = getRadius(width),
    color = d3.scale.ordinal()
    .domain(['rg-1','rg-2','rg-3','rg-4','rg-5','rg-6','rg-7','rg-8','rg-9','rg-10','rg-11'])
    .range(['#3300CC','#3366CC','#00BCCC','#49B05B','#33CC66','#99CC33','#FBE54B','#FFCC33','#FF9933','#FF5A24','white']),
    x = d3.scale.linear().domain([0,width]).range([0,width]).clamp(true),
    y = d3.scale.linear().domain([0,height]).range([0,height]).clamp(true),
    nodes = [],
    colors = [],
    lastExtRadius = 1;

for (var i in color.domain()){
	colors[color.domain()[i]] = 0;
}

// x,y is the point to test
// cx, cy is circle center, and radius is circle radius
function pointInCircle(x, y, cx, cy, radius) {
	var distancesquared = (x - cx) * (x - cx) + (y - cy) * (y - cy);
	return distancesquared <= radius * radius;
}

function getRadiusFromCenter2(extColor,rad){
	var totalSurface = 0;
	var totalInnerSurface = 0;
	for (var i in color.domain()){
		var surface = colors[color.domain()[i]] * 4 * rad * rad * Math.PI;
		if (color.domain()[i] !== extColor){
			totalInnerSurface += surface;
		} 
		totalSurface += surface;
	}
	var outerRadius = Math.sqrt(totalSurface/ (4*Math.PI))
	var innerRadius = Math.sqrt(totalInnerSurface / (4*Math.PI));
	DEBUG.log('total innersurface is ' + totalInnerSurface + ', innerRadius is ' + innerRadius);
	DEBUG.log('total surface is ' + totalSurface + ', outerRadius is ' + outerRadius);
	return {inner : innerRadius,
			outer : outerRadius};
}

function getRadiusFromCenter(cx, cy, extColor){
	for (var i in nodes){
		if (nodes[i].colorClass !== extColor) {
			var x = nodes[i].x;
			var y = nodes[i].y;
			while (!pointInCircle(x,y,cx,cy,lastExtRadius)){
				lastExtRadius++;
			}
		}
	}
	DEBUG.log('radius ' + lastExtRadius + " for color " + extColor);
	return lastExtRadius;
}

d3.select(window).on('resize', bubblesViz_resize); 

var force = d3.layout.force()
    .nodes(nodes)
    .size([width, height])
    .gravity(0)
    .charge(0)
    .on("tick", tick);

var svg = d3.select("#bubbles").append("svg")
    .attr("width", width - margin.left - margin.right)
    .attr("height", height - margin.top - margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

start();

function getPadding(screenWidth){
  if (screenWidth < 500) return 1;
  if (screenWidth < 750) return 1.5;
  if (screenWidth < 1000) return 2;
  return 3;
}

function getRadius(screenWidth){
  if (screenWidth < 500) return 1.5;
  if (screenWidth < 750) return 2;
  if (screenWidth < 1000) return 2.5;
  return 3;
}

function tick(e) {
  var colorMax = getColorMax();
    svg.selectAll("circle").each(gravity(.1 * e.alpha))
        .each(collide(.5))
        .attr("cx", function (d) {
        return d.x;
    })
        .attr("cy", function (d) {
        return d.y;
    });
}

// Move nodes toward cluster focus.
function gravity(alpha) {

    return function (d) {
        d.y += (d.cy - d.y) * alpha;
        d.x += (d.cx - d.x) * alpha;
    };
}

// Resolve collisions between nodes.
function collide(alpha) {
    var quadtree = d3.geom.quadtree(nodes);
    var padding = getPadding($("#bubbles").width());
    var maxColor = getColorMax();
    return function (d) {
        var r = d.radius + 1 + padding,
            nx1 = d.x - r,
            nx2 = d.x + r,
            ny1 = d.y - r,
            ny2 = d.y + r;
        quadtree.visit(function (quad, x1, y1, x2, y2) {
            if (quad.point && (quad.point !== d)) {
                var x = d.x - quad.point.x,
                    y = d.y - quad.point.y,
                    l = Math.sqrt(x * x + y * y),
                    r = d.radius + quad.point.radius + (d.colorClass !== quad.point.colorClass) * padding;
                if (l < r) {
                    l = (l - r) / l * alpha;
                    d.x -= x *= l;
                    d.y -= y *= l;
                    quad.point.x += x;
                    quad.point.y += y;
                }
            }
            return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
        });
    };
}

function start() {

	var circleNode = svg.selectAll("circle")
	.data(force.nodes());

	circleNode
	.enter().append("circle")
	.attr("r", function (d) { return d.radius;})
	.attr("cx", function (d) { return d.cx;})
	.attr("cy", function (d) { return d.cy;})
	.style("fill", function (d) { return d.color; });

	circleNode.transition().duration(200)
	.attr("r", function(d) { return d.radius; });

	circleNode.exit().remove();

	force.start();
}
bubblesViz.prototype.resize = bubblesViz_resize;

function bubblesViz_resize (){
	DEBUG.log("resize");
	width = $("#bg").width();
	height = $("#bg").height();

	var containerWidth = $("#container").width();
	$("#chat-text").height(height*2/3).width(containerWidth);
	$("#bubbles").height(height).width(width);
	$("#chat-text").css('top', height/3 +'px');
	height = height - margin.top - margin.bottom;
	width = width - margin.left - margin.right;

	$("svg").width(width).height(height);
	x = d3.scale.linear().domain([0,width]).range([0,width]).clamp(true),
	y = d3.scale.linear().domain([0,height]).range([0,height/3]).clamp(true);

	var rad = getRadius(width);
	// DEBUG.log("radius will be " + rad);
	var nodes = force.nodes();
	for (var i in nodes){
		nodes[i].cx = x(width/2);
		nodes[i].cy = y((height/3)/2);
		nodes[i].radius = rad;
	}
	force.nodes(nodes);

	// resize the chart
	// d3.select(svg.node().parentNode)
	//     .style('height', (y.rangeExtent()[1] + margin.top + margin.bottom) + 'px')
	//     .style('width', (width + margin.left + margin.right) + 'px');
	start();
}

function getLastMessage(){
  var last = $( "#chat-text" );
  last = last.children().last();
  last = last.children().last();
  return last;
}
function addNodes(msg, bubblesNb, pos, neg, emotionRangeClassString){
	DEBUG.log("***********\nAdding nodes");
	var last = getLastMessage();
	var offset = last.position();
	var offset2 = last.offset();

	var rect = {
		offsetLeft: last.position().left, 
		offsetTop:(last.position().top + $("#bg").height()/3),  
		width: last.width(), 
		height: last.height()
	};
	// DEBUG.log(offset);
	var width = $("#bubbles").width();
	var rad = getRadius(width);
	// DEBUG.log("radius: " + rad);
	colors[emotionRangeClassString] += parseInt(bubblesNb);
	var colorMax = getColorMax();
	updateBubbleCounters();
	// DEBUG.log("color max is " + colorMax);
	DEBUG.log("Adding nodes - computing new radius from center");
	// var r = getRadiusFromCenter2(x(width/2),y(height/2), colorMax);
	var r = getRadiusFromCenter2(colorMax,rad);
	DEBUG.log("Adding nodes - computing positions for older bubbles");
  
	for (var i in nodes){
		var node = nodes[i];
		if (node.colorClass === colorMax){
			var angle;
			if (node.angle !== null){
				angle = node.angle;
			}else{
				var rand = Math.random();
		   		angle = rand*Math.PI*2;
			}
		   node.cx = x(width/2) + Math.cos(angle)*r.outer ;
		   node.cy = y(height/2) + Math.sin(angle)*r.outer ;
		} else{
		   node.cx = x(width/2);
		   node.cy = y(height/2);
		}
	}
  // force.nodes(nodes);

  	var startCoord = upperMiddle(rect);
	DEBUG.log("Adding nodes - computing positions for new bubbles with start coor " + startCoord.x + " " + startCoord.y);
	for (var i = 0 ; i < bubblesNb ; i++){
		var rand = Math.random();
		var angle = rand*Math.PI*2;
		var xC ,yC;
		if (colorMax === emotionRangeClassString){
		   xC = x(width/2) + Math.cos(angle)*r.outer ;
		   yC = y(height/2) + Math.sin(angle)*r.outer ;
		} else {
		   xC = x(width/2);
		   yC = y(height/2);
		}
    
		nodes.push({
	  		id : Math.floor(rand*1000000000),
	  		radius: rad,
	      	colorClass: emotionRangeClassString,
	  		color: color(emotionRangeClassString),
	      	weight : Math.floor(Math.random()*100),
	  		cx: xC,
	  		cy: yC,
	    //  	x:startCoord.x,
	    //  	y:startCoord.y,
	      	angle: angle,
	  	});
	}
	DEBUG.log("Adding nodes - done");
	
  	//printColors();
}

function updateBubbleCounters(){
	DEBUG.log("Updating counters");
	var goodCount = 0, badCount = 0;

	badCount+=colors['rg-1'];
	badCount+=colors['rg-2'];
	badCount+=colors['rg-3'];
	badCount+=colors['rg-4'];
	badCount+=colors['rg-5'];

	goodCount+=colors['rg-7'];
	goodCount+=colors['rg-8'];
	goodCount+=colors['rg-9'];
	goodCount+=colors['rg-10'];
	goodCount+=colors['rg-11'];

	$("#goodNumber").html(goodCount);
	$("#badNumber").html(badCount);


	var iBaseIndicatorWidth = 25;
	var iBaseIndicatorHeight = 25;
	var iMaxIndicatorWidth = 25;
	var iMaxIndicatorHeight = 25;
	var iLeftMult = ( 1 + ( badCount - goodCount ) /
		( badCount + goodCount ) );
	var iRightMult = ( 1 + ( goodCount - badCount ) /
		( badCount + goodCount ) );
	var imgGood = document.getElementById("imgGood").children[1];
	// var imgBad = document.getElementById("imgBad");
	var imgBad = document.getElementById("imgBad").firstChild;
	var counterGood = document.getElementById("goodNumber");
	var counterBad = document.getElementById("badNumber");
	imgGood.style.width = ( iBaseIndicatorWidth + iMaxIndicatorWidth / 2 * iRightMult ) + "px";
	imgGood.style.height = ( iBaseIndicatorHeight + iMaxIndicatorHeight / 2 * iRightMult ) + "px";
	counterGood.style.fontSize = ( 50 + 50 * iRightMult ) + "%";
	imgBad.style.width = ( iBaseIndicatorWidth + iMaxIndicatorWidth / 2 * iLeftMult ) + "px";
	imgBad.style.height = ( iBaseIndicatorHeight + iMaxIndicatorHeight / 2 * iLeftMult ) + "px";
	counterBad.style.fontSize = ( 50 + 50 * iLeftMult ) + "%";

	DEBUG.log("Updating counters - done");

}

function upperMiddle(rect){
	var y = rect.offsetTop,
		x = rect.offsetLeft+ 0.5*rect.width;
	return {x:x,y:y};
}

function randomPointInRect(rect){
	var x,y, rand = Math.random(),
		perc = Math.floor(rand*100),
		onLeftSide = Math.floor(rand*2) === 1 ? true: false;
	if (onLeftSide){
		y = rect.offsetTop + perc*rect.height/100;
		x = rect.offsetLeft;
	} else {
		y = rect.offsetTop;
		x = rect.offsetLeft+ perc*rect.width/100;
	}
	return {x:x,y:y};
}

function printColors(){
	for (var i in color.domain()){
		DEBUG.log(color.domain()[i] + " - " + colors[color.domain()[i]]);
	}
}

function getColorMax(){
	var max ='';
	for (var i in color.domain()){
		if (max ===''){
			max = color.domain()[i];
		}else{
			if (colors[color.domain()[i]] > colors[max]){
				max = color.domain()[i];
			}
		}
	}
	return max;
}
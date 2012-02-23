window.onload = function()
{
    init();
};

function init(){
    var canvas = document.getElementById('canvas'), toDraw=true;  
    var pjs = new Processing(canvas, function(p) {});
    
    var pointNum;                  // number of radial anchor points
    var radius = 200;            // the base radius for the anchor points
    var anchors;             // array of radial anchor points
    var stageCenter;           // center of the stage
    var webCenter;    // center of the web
    var rays;                // array of ray lines (which come from the anchor points)
    var avgRadius;               // average length of a ray 
    var spacingNoise;            // noise for spacing the bars
    var barPointAmt;               // number of points along a ray
    var strands;
    var strandNoise;
    var physics;
    var interval;
    
    pjs.setup = function() {
	pjs.size(600,600);
	// we want to turn off animation, because this is a demo page and it
        // would use cpu while not being looked at. Only draw on mousemoves
	
	pjs.background(0);
        pjs.smooth();
           
        stageCenter = new pjs.PVector(pjs.width/2, pjs.height/2);
        this.initPhysics();
        this.drawWeb();
        //if(!toDraw) pjs.noLoop();
	if(toDraw){
	    this.draw = draw;
	    interval = setInterval(draw, 30);
	}
    }
    
    
    pjs.initPhysics = function() {
        physics = new toxi.physics2d.VerletPhysics2D();
        // set screen bounds as bounds for physics sim
        physics.setWorldBounds(new toxi.Rect(0,0,pjs.width,pjs.height));
        // add gravity along positive Y axis
        physics.addBehavior(new toxi.physics2d.GravityBehavior(new toxi.Vec2D(0,0.09)));
    }
    
    
    
    pjs.drawWeb = function()
    {
	strands = new pjs.ArrayList();
        // reset vars and clear the stage
        rays = new pjs.ArrayList();
        //pointNum = Math.round(Math.random()*6 + 4);
	pointNum = 4;
        
        spacingNoise = Math.random()*10;
        barPointAmt = Math.round(Math.random()*10 + 10);
	//barPointAmt = 4;
        strandNoise = Math.random()*100;
        
        // draw everything
        this.placeAnchorPoints();
        this.drawPerimeterLines();
	
	
	for (var i=0; i< physics.springs.length; i++) {
            var s = physics.springs[i];
            var strand = new Strand(s.a, s.b);
            strands.add(strand);					// ------------ PROBLEM HERE! STRANDS NOT BEING ADDED TO strands ArrayList -------- //
        }
    }
    
    
    
    pjs.placeAnchorPoints = function() 
    {
	var anchorPoints = new pjs.ArrayList();
	var angleDif = (Math.PI * 2)/pointNum;
	var maxX = 0;
	var minX = pjs.width;
	var maxY = 0;
	var minY = pjs.height;
	var radiusSum = 0;
	var i;
	
	
	for (i=0; i<pointNum; i++) {
	    var angle = (i * angleDif);
	    var r = radius * (Math.random() + 0.5);
	    radiusSum += r;
	    var pX = stageCenter.x + Math.cos(angle) * r;
	    var pY = stageCenter.y + Math.sin(angle) * r;
	    var p = this.addParticle(pX, pY);
	      
	    maxX = (pX > maxX) ? pX : maxX;
	    minX = (pX < minX) ? pX : minX;
	    maxY = (pY > maxY) ? pY : maxY;
	    minY = (pY < minY) ? pY : minY;
	    anchorPoints.add(p);
	  
	    
	    pjs.noFill();
	    pjs.stroke(255, 50);
	    pjs.ellipse(p.x, p.y, 10, 10);
	
	    pjs.fill(255);
	    pjs.noStroke();
	    pjs.ellipse(p.x, p.y, 2, 2);
	}
    
      avgRadius = radiusSum / pointNum;
      webCenter = this.addParticle(minX + (maxX - minX)/2, minY + (maxY - minY)/2);
    
      // create the anchor strands from the points
      anchors = new pjs.ArrayList();
      for (i=0; i<anchorPoints.size(); i++) {
        var startPt = anchorPoints.get(i);
        var endPt = (i<anchorPoints.size()-1) ? anchorPoints.get(i+1) : anchorPoints.get(0);
        var anchor = new Anchor(i, startPt, endPt);
	anchor.drawEdgeLines();
        anchors.add(anchor);
      }
    }
    
    
    // draw the lines between the anchor points
    pjs.drawPerimeterLines = function() {
	var i;
	for (i=0; i<anchors.size(); i++) {
	    var anchor = anchors.get(i);
	    anchor.makePoints();
	}
      
	for (i=0; i<anchors.size(); i++) {
	    var anchor = anchors.get(i);
	    anchor.defineSourceLines();
	}
	this.makeRays();
    }
    
    
    pjs.makeRays = function() {
        var i, ray;
        for (i=0; i<rays.size(); i++)
        {
          r = rays.get(i);
          r.make();
        }
      
        for (i=0; i<rays.size(); i++)
        {
          r = rays.get(i);
          r.defineRayPoints();
          //r.update();
        }
    }
    
    
    
    
    
    pjs.makeSpring = function(p1, p2, len)
    {
	console.log("		MAKE SPRING");
	console.log(p1.x, p1.y);
	var res = 200.0;
	var ptNum = 0;
	var ptAngle;
	var ptDist;
	
	// if no length is provided, use the one between the 2 given points
	if(!len){
	    var dx = (p1.x - p2.x);
	    var dy = (p1.y - p2.y);
	    len = Math.sqrt((dx*dx) + (dy*dy));
	}
      
	if (len>res) {
	    ptNum = Math.floor(len/res);
	}
	
	if (ptNum>0)
	{
	    //ptDist = len/res;
	    ptAngle = pjs.getAngle(p1, p2);
	    // make a bunch of midway points
	    var pts = new Array();
	    
	    for (var i=0; i<ptNum; i++) {
	      var xPos = p1.x + Math.cos(ptAngle) * ((i+1)*res);
	      var yPos = p1.y + Math.sin(ptAngle) * ((i+1)*res);
	      var p = pjs.addParticle(xPos, yPos);
	      pts.push(p);
	    }
	    
	    // add spring between all the midway points
	    var sprStr = (1 / (res))*1.50;
	    var sprLen = res/len;
	    pjs.addSpring(p1, pts[0], sprLen, sprStr);
	    for (var i=1; i<pts.length; i++) {
	      var pStart = pts[i];
	      var pEnd = pts[i-1];
		pjs.addSpring(pStart, pEnd, sprLen, sprStr);
	    }
	    pjs.addSpring(pts[pts.length-1], p2, sprLen, sprStr);
	  }
	else
	{
	    pjs.addSpring(p1, p2, len);
	}
    
      //physics.makeSpring(pt1, pt2, 0.2, 0.1, len/2);
      //physics.makeAttraction(pt1, pt2, -1000, len );
      //addSpring(p1, p2, len);
    }
    
    
    pjs.addSpring = function (p1, p2, len, strength)
    {
	if(!strength) strength = 0.5;
	var s = new toxi.physics2d.VerletSpring2D(p1, p2, len, strength);
	//var s = new toxi.physics2d.VerletSpring2D(p1, p2, len, 0.2);
	//console.log(p1.x, p2.x);
	//console.log(s.a.x, s.b.x);
	physics.addSpring(s);
    }
    
    
    
    pjs.addParticle = function(xPos,yPos)
    {
	// first check to see if a particle of the same position is already there. Return it if so.
	for(var i=0; i<physics.particles.length; i++){
	    if(physics.particles[i].x == xPos && physics.particles[i].y == yPos){
		return physics.particles[i];
	    }
	}
	
	var p = new toxi.physics2d.VerletParticle2D(xPos, yPos);
	
        p.setWeight(.1);
        physics.addParticle(p);
        return p;
    }
    
    
    pjs.getPartDist = function(pt1, pt2)
    {
	var dx = (pt1.x - pt2.x);
	var dy = (pt1.y - pt2.y);
	var len = Math.sqrt((dx*dx) + (dy*dy));
	return len;
    }
    
    
    pjs.getAngle = function(pt1, pt2)
    {
      var dx = (pt1.x - pt2.x);
      var dy = (pt1.y - pt2.y);
      var angle = Math.atan2(dy, dx);
      return angle;
    }
    
    
    
    
    
    
    
    
     //////////////////////////
    draw = function() {
	// then drawing
	pjs.background(0);
	
	// draw all springs
	pjs.stroke(255, 0, 255, 100);
    
    	for(var i=0; i<strands.size(); i++){
	//for (var s in strands) {
	    var s = strands.get(i);
	    s.update();
	    //pjs.line();
	}
	
	
	/*
	// show all particles
	pjs.noStroke();
	
	pjs.fill(255, 150);
	//for(VerletParticle2D p : physics.particles) {
	for (var i=0; i < physics.particles.length; i++) {
	  var p  = physics.particles[i];
	  //ellipse(p.x,p.y,5,5);
	  
	  pjs.ellipse(p.x,p.y,3,3);
	  //if(i>8)text(i-9, p.x,p.y);
	}*/
    
	/*
	for (var i=0; i<rays.size(); i++){
	    var r = rays.get(i);
	    r.update();
	}
	*/
	
	physics.update();
    }





/************
 
 ANCHOR
 
************* */

    function Anchor(_order, _startPoint, _endPoint) {

	this.startPt = new pjs.PVector(_startPoint.x, _startPoint.y);           		// start point of the connecting line
	this.endPt = new pjs.PVector(_endPoint.x, _endPoint.y);			// end point of the connecting line
	this.pointSpacing = 50;			// amount of space between strands (35 is good). This may have to depend on other things later such as the average line length or something.
	this.myOrder = _order;                 // order of the point within all radial points
	this.myAngle;                         // angle of this strand (towards the web center)
	this.nextAngle;                       // angle of the next strand
	this.webCenterPoint = new pjs.PVector(webCenter.x, webCenter.y);;           	// vector of the web center particle
	this.randomLinePoints = new Array();    	// additional random line points along the same anchor to edge line
	this.rayPoints = new Array();           	// points to connect the ray
      
	this.startPoint = _startPoint;
	this.nextPoint = _endPoint;
	this.edgePoint;
	
	// find the angle of the anchor point (in relation to the web center)
	var dx = (this.startPt.x - this.webCenterPoint.x);
	var dy = (this.startPt.y - this.webCenterPoint.y);
	var heightDif = (stageCenter.y - pjs.height);
	var widthDif = (stageCenter.x - pjs.width);
	var dif = pjs.width  - Math.sqrt(dx*dx + dy*dy);
	this.myAngle = Math.atan2(dy, dx);
	
	dx = (this.endPt.x - this.webCenterPoint.x);
	dy = (this.endPt.y - this.webCenterPoint.y);
	dif = pjs.width  - Math.sqrt(dx*dx + dy*dy);
	this.nextAngle = Math.atan2(dy, dx);
      
      /*this.drawEdgeLines = drawEdgeLines;
      this.makePoints = makePoints;
      this.defineSourceLines = defineSourceLines;*/
  }





    // draw the lines from the anchor points to the border
    Anchor.prototype.drawEdgeLines = function()
    //function drawEdgeLines()
    {
	// randomly find a random amount of points to place between the start and end point
	var pointAmt = Math.round(Math.random()) == 0 ? Math.round(Math.random()*7 + 1) : 1;
	//var pointAmt = 3;
    
	//randomLinePoints = [2 + pointAmt];
	randomLinePoints = new Array();
	randomLinePoints[0] = this.startPoint;
    
	var opAngle = pjs.HALF_PI - ((this.myAngle < 0) ? this.myAngle + pjs.TWO_PI : this.myAngle);
	var sideDistX = (this.startPt.x < pjs.width/2) ? -this.startPt.x: pjs.width - this.startPt.x;
	var sideDistY = (this.startPt.y < pjs.height/2) ? -this.startPt.y : pjs.height - this.startPt.y;
    
	var opRx = sideDistX/Math.sin(opAngle);
	var opRy = sideDistY/Math.cos(opAngle);
	var opR =  (Math.abs(opRx)<Math.abs(opRy)) ? opRx : opRy;
    
	edgePoint = pjs.addParticle(this.startPt.x +  Math.cos(this.myAngle) * (opR), this.startPt.y + Math.sin(this.myAngle) * (opR));
	pjs.ellipse(edgePoint.x, edgePoint.y, 10, 10);
	edgePoint.lock();
    
	var lenFactor = opR/pointAmt;
	for (var i=0; i<pointAmt; i++) {
	    var randLen = lenFactor * i + Math.random()*lenFactor; 
	    var midPoint = pjs.addParticle(this.startPt.x +  Math.cos(this.myAngle) * (randLen), this.startPt.y + Math.sin(this.myAngle) * (randLen));
	    /*if(i == pointAmt-1)
		{pjs.fill(0, 255, 0, 150); //green
	    }else{
		pjs.fill(255, 0, 0, 150); //red
	    }
	    pjs.ellipse(midPoint.x, midPoint.y, 5, 5);*/
	    randomLinePoints.push(midPoint);
	}
    
	randomLinePoints[randomLinePoints.length] = edgePoint;
	for (var i=1; i<randomLinePoints.length; i++)
	{
	    var curP = randomLinePoints[i];
	    var prevP = randomLinePoints[i-1];
	    var pDist = pjs.getPartDist(prevP, curP);
	    /*pjs.fill(255, 0, 0, 150);
	    pjs.ellipse(curP.x, curP.y, 5, 5);*/
	    //pjs.fill(255, 255, 0, 150); // yellow
	    //pjs.ellipse(curP.x, curP.y, 5, 5);
	    //pjs.ellipse(prevP.x, prevP.y, 5, 5);
	    pjs.makeSpring(curP, prevP, pDist);
	    
	}
	//console.log(this.myOrder + " " + pointAmt + " " + randomLinePoints.length);
    }

 

    Anchor.prototype.makePoints = function(){
    //function makePoints() {
    
	pjs.stroke(255, Math.random()*100 + 50);
    
	var dx = (this.endPt.x - this.startPt.x);
	var dy = (this.endPt.y - this.startPt.y);
	var lineDist = Math.sqrt((dx*dx) + (dy*dy));
	var lineAngle = Math.atan2(dy, dx);
    
	var linePointAmt;
	// ensure that there are at least 2 points to go between
	// If only 1, it will fail
	var pointDistFactor = 0;
	do {
	  linePointAmt = Math.floor(lineDist/(this.pointSpacing - pointDistFactor));
	  pointDistFactor++;
	}
	while (linePointAmt<2);
	
	var halfAngle = lineAngle + (pjs.TWO_PI);
	var rAngleFactor = Math.random()*.3+.1;
    
	// make the curve more random so that it's not perfect
	var angleDif = pjs.PI*rAngleFactor;        // the random angle that will be sloped between points
	var ctrlLen = lineDist*rAngleFactor;   // the random distance of the control points
	pjs.noFill();
    
	// make the bezier curve points based on the calculated control factors
	var curvePts = new Array();
	curvePts[0] = new pjs.PVector(this.startPt.x, this.startPt.y);
	curvePts[1] = new pjs.PVector(this.startPt.x + Math.cos(lineAngle+(angleDif)) * ctrlLen, this.startPt.y + Math.sin(lineAngle+(angleDif))*ctrlLen);
	curvePts[2] = new pjs.PVector(this.endPt.x - Math.cos(lineAngle-(angleDif)) * ctrlLen, this.endPt.y - Math.sin(lineAngle-(angleDif))*ctrlLen);
	curvePts[3] = new pjs.PVector(this.endPt.x, this.endPt.y);
    
	// Now draw the lines between bezier points
	var bezPts = new Array();
	
	this.rayPoints = new Array();
	
	for (var i=1; i<linePointAmt; i++) {
    
	  var t = i / linePointAmt;
	  var pointX = pjs.bezierPoint(curvePts[0].x, curvePts[1].x, curvePts[2].x, curvePts[3].x, t);
	  var pointY = pjs.bezierPoint(curvePts[0].y, curvePts[1].y, curvePts[2].y, curvePts[3].y, t);
    
	  var nextT = (t<linePointAmt-1) ? (i+1) / linePointAmt : 0;
	  var nextX = pjs.bezierPoint(curvePts[0].x, curvePts[1].x, curvePts[2].x, curvePts[3].x, nextT);
	  var nextY = pjs.bezierPoint(curvePts[0].y, curvePts[1].y, curvePts[2].y, curvePts[3].y, nextT);
	  pjs.stroke(255, Math.random()*100 + 50);
    
	  // create a new point
	  var bezP = pjs.addParticle(pointX, pointY);
	  bezPts[i] = bezP;
    
	  var rayPoint = bezPts[i];
	  var r = new Ray(rays.size(), rayPoint, webCenter, spacingNoise);
	  rays.add(r);
    
	  if (i>0) {
	    pjs.ellipse(pointX, pointY, 4, 4);
	    this.rayPoints.push(bezP);
	  }
	  else {
	    //println("DON'T ADD " + i);
	  }
      
	}
    
	// go through the points and make strokes
	for (var i=0; i<linePointAmt-1; i++)
	{
	  // Finds the 1st point. Either the startPt or the first of the curve
	  var p = (i == 0) ? this.startPoint : bezPts[i];
    
	  // Finds the next point. Either the last point or the next in curve;
	  var nextP = (i < linePointAmt-1) ? bezPts[i+1] : nextPoint;
    
	  dx = p.x - nextP.x;
	  dy = p.y - nextP.y;
	  lineDist = Math.sqrt(dx*dx + dy*dy);
    
	  // lines between bezier points
	  pjs.makeSpring(p, nextP);
	}
	pjs.makeSpring(bezPts[linePointAmt-1], this.nextPoint);
    }
    


    Anchor.prototype.defineSourceLines = function(){
    //function defineSourceLines() {
    //println("DEFINE SOURCE LINES");
    // for the random line points, draw a line from that to a random ray point
	for (var i=1; i<this.randomLinePoints.length-1; i++)
	{
	    var p = this.randomLinePoints[i];
	    
	    var randomNum = (Math.round(Math.random()-1));
	    randomNum += this.myOrder;
      
	    if (randomNum < 0) randomNum += anchors.size();
	    if (randomNum >= anchors.size()) randomNum = 0;
  
	    var rAnchor = anchors.get(randomNum);
	    if (rAnchor.rayPoints.length < 2) return;
	    //var rRay = rAnchor.rayPoints[round(random(1, rAnchor.rayPoints.length-1))];
	    var rRay = rAnchor.rayPoints[Math.round(Math.random()*(rAnchor.rayPoints.length-2) + 1)];
	    var pDist = pjs.getPartDist(p, rRay);
	  
	    pjs.makeSpring(p, rRay, pDist);
	}
    }







    /**************************************************
     
			    RAY
     
    /************************************************** */

    function Ray(_order, _startPoint, _endPoint, _sNoise) {

	this.startPt = new pjs.PVector(_startPoint.x, _startPoint.y);		// start point of the connecting line
	this.endPt = new pjs.PVector(_endPoint.x, _endPoint.y);
	this.strandLength;	// the length of strand from the web center
	this.points = new Array();	// array of points along the ray line
	this.myOrder = _order;             // the order of the ray around the web            
	this.myAngle;           // the angle of the current ray
	this.spacingNoise;      // noise for the placement of the points along the ray.
	this.rayPointAmt;         // amount of points along the array
	this.startPoint = _startPoint;
	this.nextPoint = _endPoint;
	this.strands;
	this.rayPoints = new Array();      // list of points that will make up the ray
	
	this.testPoints = new Array();
	
    
	spacingNoise = _sNoise;
	//rayPointAmt = barPointAmt + (Math.random()*11-3);
	rayPointAmt = barPointAmt;
    
    
	// Find the length and angle of current and next line
	var dx = this.startPt.x - this.endPt.x;
	var dy = this.startPt.y - this.endPt.y;
	this.myAngle = Math.atan2(dy, dx);
	
	var len = Math.sqrt((dx*dx) + (dy*dy));
       
    
	// Get the length of the strand. If the strand is longer than the average strand length, then use 
	// that as the factor for getting the number and placement of points along the ray.
	// Multiplying by a fraction will keep the points away form the edges of the strands.
	var avgRad = avgRadius;// * .9;
	this.strandLength = (len < avgRad) ? len : avgRad;
    
	var pointSpacing = (((this.strandLength-5)*.99) / barPointAmt);
	//line(pos1.x, pos1.y, pos2.x, pos2.y);

	// find the positions of all the points that will go on the given ray
	for (var i=0; i<rayPointAmt; i++) {
	  var someNoise = pjs.map(pjs.noise(spacingNoise), 0, 1, .75, 1.15);
	  var p = new pjs.PVector(webCenter.x + Math.cos(this.myAngle)*(i*pointSpacing * someNoise), webCenter.y + Math.sin(this.myAngle)*(i*pointSpacing * someNoise));
	  this.points.push(p);
	  //ellipse(p.x, p.y, 2, 2);
	  spacingNoise += .2;
	}
    }



    Ray.prototype.make = function() {
	// A thinner and less opaque line gives the sense of depth of a strand
	//strokeWeight(random(.5, 1));
	var radialNoise = Math.random()*100;
	var nextPoint;
	strands = new pjs.ArrayList();
	
	// add the initail points to the points array so that they at least connect if nothing else
	this.addRayPoint(this.startPoint);
	this.addRayPoint(this.nextPoint);
	
	for (var i=1; i<rayPointAmt; i++) {
	    //stroke(255, (int)random(30, 140));
	    
	    // randomly DON'T draw a line
	    var randomChance = Math.round(Math.random()*20);
	    //randomChance = 1;
	    if (randomChance == 0 || randomChance == 19 || randomChance == 18) continue;
	    var p = this.points[i];
	    var n = pjs.noise(radialNoise)*10;
	    
	    // if not the last strand
	    var nextStrand;
	    if (this.myOrder < rays.size()-1) {
		nextStrand = rays.get(this.myOrder+1);
	    }
	    else {
		nextStrand = rays.get(0);
	    }

	    var nextAngle = nextStrand.myAngle;
	    
	    var dx = p.x - webCenter.x;
	    var dy = p.y - webCenter.y;
	    
	    // Get a random distance to place the starting point at. it will be within a range above and 
	    // below the original point. The further away from the center, the more variation it can have
	    var pointDist = this.getRandomPoint(dx, dy, i*.2, this.strandLength);
	    var thisPoint = pjs.addParticle(webCenter.x + Math.cos(this.myAngle) * pointDist, webCenter.y + Math.sin(this.myAngle) * pointDist);
	    
	    this.addRayPoint(thisPoint);
    
	    pointDist = this.getRandomPoint(dx, dy, i*.2, nextStrand.strandLength);
	    //var nextPoint;// = addParticle(webCenter.x + cos(nextAngle) * pointDist, webCenter.y + sin(nextAngle) * pointDist);
	    
	    // draw y shape between rays instead of straight line
	    if (randomChance == 1)// || randomChance == 15 || randomChance == 16)
	    {
		// find extra points for "y" shape
		var pointDev = Math.random()*3 + 2;
		var startAngle = (Math.round(Math.random()) == 0) ? nextAngle : this.myAngle;
		//startAngle = this.myAngle;
		
		//PVector nextPointA = new PVector(webCenter.x + cos(startAngle) * (pointDist-pointDev), webCenter.y + sin(startAngle) * (pointDist-pointDev));
		var nextPointA = pjs.addParticle(webCenter.x + Math.cos(startAngle) * (pointDist-pointDev), webCenter.y + Math.sin(startAngle) * (pointDist-pointDev));
	
		pointDev = Math.random()*3 + 2;
		//PVector nextPointB = new PVector(webCenter.x + cos(startAngle) * (pointDist+pointDev), webCenter.y + sin(startAngle) * (pointDist+pointDev));
		var nextPointB = pjs.addParticle(webCenter.x + Math.cos(startAngle) * (pointDist+pointDev), webCenter.y + Math.sin(startAngle) * (pointDist+pointDev));
	
		// find partial way point
		var difAngle = (startAngle == nextAngle) ? this.myAngle - nextAngle : nextAngle - this.myAngle;
		if (difAngle<-1)difAngle+=pjs.TWO_PI;
		if (difAngle>1)difAngle-=pjs.TWO_PI;
		//var randDif = difAngle * Math.random()*0.9 + .05;
		var randDif = Math.random() * difAngle;
		var partialPoint = pjs.addParticle(webCenter.x + Math.cos(startAngle + randDif) * pointDist, webCenter.y + Math.sin(startAngle + randDif) * pointDist);
		//pjs.fill(255, 255, 0, 120);
		//pjs.ellipse(partialPoint.x, partialPoint.y, 5, 5);
		
		var startPoint;
		if (startAngle == nextAngle)
		{
		    //partialPoint = pjs.addParticle(webCenter.x + Math.cos(startAngle + randDif) * pointDist, webCenter.y + Math.sin(startAngle + randDif) * pointDist);
		    startPoint = thisPoint;
		    this.testPoints.push(startPoint);
		    this.addRayPoint(startPoint);
		    
		    nextStrand.addRayPoint(nextPointA);
		    nextStrand.addRayPoint(nextPointB);
		    //pjs.stroke(255, 0, 255, 200);
		    //pjs.ellipse(nextPointB.x, nextPointB.y, 5, 5);
		    
		}
		else {
		    //partialPoint = pjs.addParticle(webCenter.x + Math.cos(startAngle - randDif) * pointDist, webCenter.y + Math.sin(startAngle - randDif) * pointDist);    
		    startPoint = pjs.addParticle(webCenter.x + Math.cos(nextAngle) * pointDist, webCenter.y + Math.sin(nextAngle) * pointDist);
		    nextStrand.addRayPoint(startPoint);
		    this.addRayPoint(nextPointA);
		    this.addRayPoint(nextPointB);
		}
		
		pjs.makeSpring(startPoint, partialPoint);
		pjs.makeSpring(partialPoint, nextPointA);
		pjs.makeSpring(partialPoint, nextPointB);
	
		pjs.line(startPoint.x, startPoint.y, partialPoint.x, partialPoint.y);
		pjs.line(partialPoint.x, partialPoint.y, nextPointA.x, nextPointA.y);
		pjs.line(partialPoint.x, partialPoint.y, nextPointB.x, nextPointB.y);
	      }
	      else
	      {
		nextPoint = pjs.addParticle(webCenter.x + Math.cos(nextAngle) * pointDist, webCenter.y + Math.sin(nextAngle) * pointDist);
		// draws a normal single connector line
		var lineLen = pjs.getPartDist(thisPoint, nextPoint);
		if (lineLen > 0) {
		    nextStrand.addRayPoint(nextPoint);
		    pjs.makeSpring(thisPoint, nextPoint);
		}
	      }
	    
	    
	    // draw another line from the point
	    if (randomChance == 2000) 
	    {
		pointDist = this.getRandomPoint(dx, dy, i*.8, nextStrand.strandLength);
	        nextPoint = pjs.addParticle(webCenter.x + Math.cos(nextAngle) * pointDist, webCenter.y + Math.sin(nextAngle) * pointDist);
		nextStrand.addRayPoint(nextPoint);
		pjs.makeSpring(thisPoint, nextPoint);
	    }
      
      
	    // draws a much longer line from the start point (which can be from either side.)
	    else if (randomChance == 3000)
	    {
		
		var startAngle = (Math.round(Math.random()) == 0) ? nextAngle : this.myAngle;
		//PVector startPoint =  (startAngle == nextAngle) ? thisPoint : nextPoint;
		//float strandLen = (startAngle != nextAngle) ? this.strandLength : nextStrand.strandLength;
		//pointDist = getRandomPoint(dx, dy, i*random(6, 10), strandLen);
		//nextPoint = new PVector(webCenter.x + cos(startAngle) * pointDist, webCenter.y + sin(startAngle) * pointDist);
		//line(startPoint.x, startPoint.y, nextPoint.x, nextPoint.y);
	  
		var strandLen;
		if (startAngle == nextAngle)
		{
		    startPoint = thisPoint;
		    strandLen = nextStrand.strandLength;
		    pointDist = this.getRandomPoint(dx, dy, i*Math.random()*4 + 6, strandLen);
		    nextPoint = pjs.addParticle(webCenter.x + Math.cos(startAngle) * pointDist, webCenter.y + Math.sin(startAngle) * pointDist);
		    this.addRayPoint(startPoint);
		    nextStrand.addRayPoint(nextPoint);
		    pjs.makeSpring(startPoint, nextPoint);
		}
		else {
		    startPoint = pjs.addParticle(webCenter.x + Math.cos(nextAngle) * pointDist, webCenter.y + Math.sin(nextAngle) * pointDist);
		    strandLen = this.strandLength;
		    pointDist = this.getRandomPoint(dx, dy, i*Math.random()*4 + 6, strandLen);
		    nextPoint = pjs.addParticle(webCenter.x + Math.cos(startAngle) * pointDist, webCenter.y + Math.sin(startAngle) * pointDist);
		    //addRayPoint(startPoint);
		    nextStrand.addRayPoint(startPoint);
		    this.addRayPoint(nextPoint);
		    pjs.makeSpring(startPoint, nextPoint);
		}
	    }
	    radialNoise += .1;
	}
	
	//if(!nextPoint) nextPoint = pjs.addParticle(webCenter.x + Math.cos(nextAngle) * pointDist, webCenter.y + Math.sin(nextAngle) * pointDist);
	// nextPoint is somehow NaN
	//this.addRayPoint(nextPoint);
    }




    Ray.prototype.defineRayPoints = function()
    {
	// sort the points from closest to furthest from the web center
	function sortDistance(a,b){
	    var dist1 = pjs.getPartDist(webCenter, a);
	    var dist2 = pjs.getPartDist(webCenter, b);

	    return Math.round(dist1 - dist2);
	}
	this.rayPoints.sort(sortDistance);
	
	// go through the points and create a strand and define the spring
        //println("-");
	for (var i=1; i<this.rayPoints.length; i++)
	{
	    var p1 = this.rayPoints[i];
	    //if(myOrder == 0) text(i, p1.x, p1.y);
	    var p2 = this.rayPoints[i-1];
	    var len = pjs.getPartDist(p1, p2);
	    
	    pjs.makeSpring(p1, p2);
	    pjs.ellipse(p1.x, p1.y, 3, 3);
	    pjs.stroke(255, 255);
	    //	pjs.line(p1.x, p1.y, p2.x, p2.y);
	    
	    var s = physics.springs[physics.springs.length-1]
	    pjs.line(s.a.x, s.a.y, s.b.x, s.b.y);
	}
	
    }
    
    
    Ray.prototype.boolToInt = function(value) {
	var intVal = (value) ? 1 : 0;
        return intVal;
    }
    
    
    Ray.prototype.getRandomPoint = function(dx, dy, range, maxLength)
    {
	var pointDist = Math.sqrt((dx*dx) + (dy*dy)) + Math.random()*(range*2) - range;//-range, range);
	// make sure they are not connecting to points that don't exist
	pointDist = (pointDist > maxLength) ? maxLength : pointDist;
	return pointDist;
    }

    /*
    Ray.prototype.update = function() {
	//line(startPoint.x, startPoint.y, edgePoint.x, edgePoint.y);
	//edgeStrand.update();
	if (strands == null) return;
	//println("strands " + strands.size());
	for (var i=0; i<strands.size(); i++)
	{
	    var s = strands.get(i);
	    s.update();
	}
	
	for (var i=0; i<this.rayPoints.length; i++)
	{
	    var p1 = this.rayPoints[i];
	    pjs.fill(0);
	    //if(myOrder == 0) text(i, p1.x, p1.y);
	    //text(myOrder + ":" + i, p1.x, p1.y);
	    pjs.fill(255, 0, 255);
	    pjs.noStroke();
	    //if(myOrder == 0) ellipse(p1.x, p1.y, 3, 3);
	    var alph = (this.myOrder == 0) ? 255: 100;
	    pjs.stroke(255, 0, 255, alph);
	}
    }*/
    
    

    // once all the rays are defined, the ray points will be defined. Then the line and spring can be added
    Ray.prototype.addRayPoint = function(p) {
	// check to make sure we don't add any dupe points
	for(var i=0; i < this.rayPoints.length; i++){
	    if(this.rayPoints[i].x == p.x && this.rayPoints[i].y == p.y){
		return;
	    }
	}
	this.rayPoints.push(p);
	pjs.stroke(0, 0, 255);
	pjs.noFill();
    }


    
    


/**************************************************
 
		       STRAND

/************************************************** */


    function Strand(_startPt, _endPt) {
	this.lineLength;
	this.segW = 10;
	this.pointNum;
      
	this.startPoint = _startPt;
	this.endPoint = _endPt;
	this.particles = new Array();
      
	this.strandColor = pjs.color(Math.random()*100 + 155);
	//this.strandColor = 255;
	this.strokeW;
    
	var n = pjs.noise(strandNoise);
	this.strandAlpha = pjs.map(n, 0, 1, 100, 160);
	//this.strandAlpha = 255;
	
	strokeW = .1 + pjs.noise(strandNoise)*1.2;
	
	var dx = this.endPoint.x - this.startPoint.x;
	var dy = this.endPoint.y - this.startPoint.y;
	var angle = Math.atan2(dy, dx);
	lineLength = Math.sqrt(dx*dx + dy*dy);
    
	particles = new Array();
	particles[0] = this.startPoint;
	particles[1] = this.startPoint;
	
	strandNoise += .2;
	pjs.line(this.startPoint.x, this.startPoint.y, this.endPoint.x, this.endPoint.y);
    }
    
    
    Strand.prototype.update = function(){
	pjs.stroke(this.strandColor, this.strandAlpha);
	pjs.strokeWeight(this.strokeW);
	pjs.noFill();
	pjs.line(this.startPoint.x, this.startPoint.y, this.endPoint.x, this.endPoint.y);
    }

    
    
    pjs.setup();


};
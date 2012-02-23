var canvas, pjs, pointNum, radiusBase, anchors, stageCenter, webCenter, rays, avgRadius, spacingNoise, barPointAmt, strands, strandNoise, physics, webGravity, gravBehavior, particleWeight, defSprStrength, strandResolution, raySpacing, debug;


function webInit(){
    // pointNum			number of radial anchor points
    // radiusBase		the base radius for the anchor points
    // anchors			array of radial anchor points
    // stageCenter		center of the stage
    // webCenter		center of the web
    // rays			array of ray lines (which come from the anchor points)
    // avgRadius		average length of a ray
    // spacingNoise		noise for spacing the bars
    // barPointAmt		number of points along a ray
    // strands			array of all the strands created
    // strandNoise		noise factor for positioning strands
    // physics			the toxi physics engine that the particles are added to
    // stats			the stats overlay with the framerate
    // statsInterval		the interval for running the stats
    
    canvas = document.getElementById('canvas');
    pointNum = 5;
    barPointAmt = 10;
    webGravity = 1.0;
    particleWeight = 0.1;
    defSprStrength = 0.5;
    strandResolution = 250;
    raySpacing = 40;
    gravBehavior = new toxi.physics2d.GravityBehavior(new toxi.Vec2D(0, webGravity));

    debug = false;
    radiusBase = 200;
    animateWeb = true;
    
    
    
    function sketchProc(pjs){
	pjs.draw = function() {
	    var i, s;
	    pjs.background(0xffbdbdbf);
	    
	    // draw all springs
	    pjs.stroke(255, 0, 255, 100);
	    for(i=0; i<strands.size(); i+=1){
		s = strands.get(i);
		s.update();
	    }
	    
	    //physics.webGravity
	    /*
	    // show all particles
	    pjs.noStroke();
	    
	    pjs.fill(255, 150);
	    for (var i=0; i < physics.particles.length; i++) {
	      var p  = physics.particles[i];
	      pjs.ellipse(p.x,p.y,3,3);
	    }*/
	    if(gravBehavior.getForce.y != webGravity){ gravBehavior.setForce(new toxi.Vec2D(0, webGravity)); }
	    // updates all the particles and springs in the physics engine
	    physics.update();
	};
    }

    
    
    pjs = new Processing(canvas, sketchProc);
   
    pjs.setup = function() {
	
	// set up the processing environment
	//pjs.size(600, 600, pjs.P3D);
	pjs.size(600, 600);
	pjs.background(0xffbdbdbf);
        pjs.smooth();
	pjs.frameRate(30);
	
        
        stageCenter = new pjs.PVector(pjs.width/2, pjs.height/2);
        this.initPhysics();
        this.drawWeb();
        
	if(debug){
	    pjs.noLoop();
	}
	
    };
    
    
    pjs.initPhysics = function() {
        physics = new toxi.physics2d.VerletPhysics2D();
        // set screen bounds as bounds for physics sim
        physics.setWorldBounds(new toxi.Rect(0,0,pjs.width,pjs.height));
        // add gravity along positive Y axis
        physics.addBehavior(gravBehavior);
    };
    
    
    
    // set up and generate all the points of hte spider web
    pjs.drawWeb = function()
    {
	console.log("draw web");
	var i, s, strand;
	strands = new pjs.ArrayList();
        rays = new pjs.ArrayList();
	
	//pointNum = (!pointNum) ? 
        // pointNum = Math.round(Math.random()*6 + 4);
	
	//pointNum = anchorPtAmt;
	//pointNum = 4;
        
        spacingNoise = Math.random()*10;
        //barPointAmt = Math.round(Math.random()*15 + 5);
	//barPointAmt = 4;
        strandNoise = Math.random()*100;
        
        // draw everything
        this.placeAnchorPoints();
        this.drawPerimeterLines();
	
	// for all of the springs generated, create a spring for it
	for (i=0; i< physics.springs.length; i+=1) {
	    s = physics.springs[i];
	    strand = new Strand(s.a, s.b);
            strands.add(strand);
        }
	
	if(animateWeb && !debug){
	    pjs.loop();
	}else{
	    pjs.draw();
	    pjs.noLoop();
	}
    };
    
    
    
    // find and place the main anchor points
    pjs.placeAnchorPoints = function() 
    {
	var anchorPoints, angleDif, maxX, minX, maxY, minY, radiusSum, i, angle, r, pX, pY, p, startPt, endPt, anchor;
	anchorPoints = new pjs.ArrayList();
	angleDif = (Math.PI * 2)/pointNum;
	maxX = 0;
	minX = pjs.width;
	maxY = 0;
	minY = pjs.height;
	radiusSum = 0;	
	
	for (i=0; i<pointNum; i+=1) {
	    angle = (i * angleDif);
	    r = radiusBase * (Math.random() + 0.5);
	    radiusSum += r;
	    pX = stageCenter.x + Math.cos(angle) * r;
	    pY = stageCenter.y + Math.sin(angle) * r;
	    p = this.addParticle(pX, pY);
	      
	    maxX = (pX > maxX) ? pX : maxX;
	    minX = (pX < minX) ? pX : minX;
	    maxY = (pY > maxY) ? pY : maxY;
	    minY = (pY < minY) ? pY : minY;
	    anchorPoints.add(p);
	    
	    if(debug){
		pjs.noFill();
		pjs.stroke(0, 50);
		pjs.ellipse(p.x, p.y, 10, 10);
	    
		pjs.fill(0);
		pjs.noStroke();
		pjs.ellipse(p.x, p.y, 2, 2);
	    }
	}
    
      avgRadius = radiusSum / pointNum;
      webCenter = this.addParticle(minX + (maxX - minX)/2, minY + (maxY - minY)/2);
    
      // create the anchor strands from the points
      anchors = new pjs.ArrayList();
      for (i=0; i<anchorPoints.size(); i+=1) {
        startPt = anchorPoints.get(i);
        endPt = (i<anchorPoints.size()-1) ? anchorPoints.get(i+1) : anchorPoints.get(0);
        anchor = new Anchor(i, startPt, endPt);
	anchor.drawEdgeLines();
        anchors.add(anchor);
      }
    };
    
    
    // draw the lines between the anchor points
    pjs.drawPerimeterLines = function() {
	var i, anchor;
	for (i=0; i<anchors.size(); i+=1) {
	    anchor = anchors.get(i);
	    anchor.makePoints();
	}
      
	for (i=0; i<anchors.size(); i+=1) {
	    anchor = anchors.get(i);
	    anchor.defineSourceLines();
	}
	this.makeRays();
    };
    
    
    pjs.makeRays = function() {
        var i, r;
        for (i=0; i<rays.size(); i+=1)
        {
          r = rays.get(i);
          r.make();
        }
      
        for (i=0; i<rays.size(); i+=1)
        {
          r = rays.get(i);
          r.defineRayPoints();
        }
    };
    
    
    
    
    pjs.makeSpring = function(p1, p2, len)
    {
	var res, ptNum, ptAngle, dx, dy, pts, xPos, yPos, p, i, sprStr, sprLen, pStart, pEnd;
	res = strandResolution;
	ptNum = 0;
	
	// if no length is provided, use the one between the 2 given points
	if(!len){
	    dx = (p1.x - p2.x);
	    dy = (p1.y - p2.y);
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
	    pts = [];
	    
	    for (i=0; i<ptNum; i+=1) {
	      xPos = p1.x + Math.cos(ptAngle) * ((i+1)*res);
	      yPos = p1.y + Math.sin(ptAngle) * ((i+1)*res);
	      p = pjs.addParticle(xPos, yPos);
	      pts.push(p);
	    }
	    
	    // add spring between all the midway points
	    sprStr = (1 / (res))*1.50;
	    sprLen = res/len;
	    pjs.addSpring(p1, pts[0], sprLen, sprStr);
	    for (i=1; i<pts.length; i+=1) {
		pStart = pts[i];
		pEnd = pts[i-1];
		pjs.addSpring(pStart, pEnd, sprLen, sprStr);
	    }
	    pjs.addSpring(pts[pts.length-1], p2, sprLen, sprStr);
	  }
	else
	{
	    pjs.addSpring(p1, p2, len);
	}
    };
    
    
    pjs.addSpring = function (p1, p2, len, strength)
    {
	if(!strength){ strength = defSprStrength; }
	var s = new toxi.physics2d.VerletSpring2D(p1, p2, len, strength);
	physics.addSpring(s);
    };
    
    
    
    pjs.addParticle = function(xPos,yPos)
    {
	var p, i;
	// first check to see if a particle of the same position is already there. Return it if so.
	for(i=0; i<physics.particles.length; i+=1){
	    if(physics.particles[i].x === xPos && physics.particles[i].y === yPos){
		return physics.particles[i];
	    }
	}
	
	p = new toxi.physics2d.VerletParticle2D(xPos, yPos);
	
        p.setWeight(particleWeight);
        physics.addParticle(p);
        return p;
    };
    
    
    // find the distance between 2 particles
    pjs.getPartDist = function(pt1, pt2)
    {
	var dx, dy, len;
	dx = (pt1.x - pt2.x);
	dy = (pt1.y - pt2.y);
	len = Math.sqrt((dx*dx) + (dy*dy));
	return len;
    };
    
    
    // find the angle between 2 particles
    pjs.getAngle = function(pt1, pt2)
    {
	var dx, dy, angle;
	dx = (pt1.x - pt2.x);
	dy = (pt1.y - pt2.y);
	angle = Math.atan2(dy, dx);
	return angle;
    };
    
    
    pjs.redrawWeb = function()
    {
	pjs.initPhysics();
	pjs.drawWeb();
    }
    
    
    pjs.drawRandomWeb = function()
    {
	
    }



    /*******************************
     
		ANCHOR
     
    ******************************* */

    function Anchor(theOrder, theStartPoint, theEndPoint) {
	var dx, dy, heightDif, widthDif, dif;
	
	this.startPt = new pjs.PVector(theStartPoint.x, theStartPoint.y);	// start point of the connecting line
	this.endPt = new pjs.PVector(theEndPoint.x, theEndPoint.y);		// end point of the connecting line
	this.pointSpacing = raySpacing;							// amount of space between strands (35 is good). This may have to depend on other things later such as the average line length or something.
	this.myOrder = theOrder;						// order of the point within all radial points
	this.myAngle = undefined;						// angle of this strand (towards the web center)
	this.nextAngle = undefined;						// angle of the next strand
	this.webCenterPoint = new pjs.PVector(webCenter.x, webCenter.y);	// vector of the web center particle
	this.randomLinePoints = [];						// additional random line points along the same anchor to edge line
	this.rayPoints = [];							// points to connect the ray
      
	this.startPoint = theStartPoint;
	this.nextPoint = theEndPoint;
	this.edgePoint = undefined;
	
	// find the angle of the anchor point (in relation to the web center)
	dx = (this.startPt.x - this.webCenterPoint.x);
	dy = (this.startPt.y - this.webCenterPoint.y);
	heightDif = (stageCenter.y - pjs.height);
	widthDif = (stageCenter.x - pjs.width);
	dif = pjs.width  - Math.sqrt(dx*dx + dy*dy);
	this.myAngle = Math.atan2(dy, dx);
	
	dx = (this.endPt.x - this.webCenterPoint.x);
	dy = (this.endPt.y - this.webCenterPoint.y);
	dif = pjs.width  - Math.sqrt(dx*dx + dy*dy);
	this.nextAngle = Math.atan2(dy, dx);
    }





    // draw the lines from the anchor points to the border
    Anchor.prototype.drawEdgeLines = function()
    {
	var pointAmt, opAngle, sideDistX, sideDistY, opRx, opRy, opR, lenFactor, i,randLen, midPoint, curP, prevP, pDist;
	// randomly find a random amount of points to place between the start and end point
	pointAmt = Math.round(Math.random()) === 0 ? Math.round(Math.random()*7 + 1) : 1;
	
	this.randomLinePoints = [];
	this.randomLinePoints[0] = this.startPoint;
    
	opAngle = pjs.HALF_PI - ((this.myAngle < 0) ? this.myAngle + pjs.TWO_PI : this.myAngle);
	sideDistX = (this.startPt.x < pjs.width/2) ? -this.startPt.x: pjs.width - this.startPt.x;
	sideDistY = (this.startPt.y < pjs.height/2) ? -this.startPt.y : pjs.height - this.startPt.y;
    
	opRx = sideDistX/Math.sin(opAngle);
	opRy = sideDistY/Math.cos(opAngle);
	opR =  (Math.abs(opRx)<Math.abs(opRy)) ? opRx : opRy;
    
	this.edgePoint = pjs.addParticle(this.startPt.x +  Math.cos(this.myAngle) * (opR), this.startPt.y + Math.sin(this.myAngle) * (opR));
	if(debug){pjs.ellipse(this.edgePoint.x, this.edgePoint.y, 10, 10);}
	this.edgePoint.lock();
    
	lenFactor = opR/pointAmt;
	for (i=0; i<pointAmt; i+=1) {
	    randLen = lenFactor * i + Math.random()*lenFactor; 
	    midPoint = pjs.addParticle(this.startPt.x +  Math.cos(this.myAngle) * (randLen), this.startPt.y + Math.sin(this.myAngle) * (randLen));
	    this.randomLinePoints.push(midPoint);
	}
    
	this.randomLinePoints[this.randomLinePoints.length] = this.edgePoint;
	for (i=1; i<this.randomLinePoints.length; i+=1)
	{
	    curP = this.randomLinePoints[i];
	    prevP = this.randomLinePoints[i-1];
	    pDist = pjs.getPartDist(prevP, curP);
	    pjs.makeSpring(curP, prevP, pDist);   
	}
    };

 

    Anchor.prototype.makePoints = function()
    {
	var dx, dy, lineDist, lineAngle, linePointAmt, pointDistFactor, halfAngle, rAngleFactor, angleDif, ctrlLen, curvePts, bezPts, i, pointX, pointY, nextT, nextX, nextY, bezP, rayPoint, r, p, nextP, t;
	pjs.stroke(255, Math.random()*100 + 50);
    
	dx = (this.endPt.x - this.startPt.x);
	dy = (this.endPt.y - this.startPt.y);
	lineDist = Math.sqrt((dx*dx) + (dy*dy));
	lineAngle = Math.atan2(dy, dx);
    
	// ensure that there are at least 2 points to go between
	// If only 1, it will fail
	pointDistFactor = 0;
	do {
	  linePointAmt = Math.floor(lineDist/(this.pointSpacing - pointDistFactor));
	  pointDistFactor += 1;
	}
	while (linePointAmt<2);
	
	halfAngle = lineAngle + (pjs.TWO_PI);
	rAngleFactor = Math.random() * 0.3 + 0.1;
    
	// make the curve more random so that it's not perfect
	angleDif = pjs.PI*rAngleFactor;        // the random angle that will be sloped between points
	ctrlLen = lineDist*rAngleFactor;   // the random distance of the control points
	pjs.noFill();
    
	// make the bezier curve points based on the calculated control factors
	curvePts = [];
	curvePts[0] = new pjs.PVector(this.startPt.x, this.startPt.y);
	curvePts[1] = new pjs.PVector(this.startPt.x + Math.cos(lineAngle+(angleDif)) * ctrlLen, this.startPt.y + Math.sin(lineAngle+(angleDif))*ctrlLen);
	curvePts[2] = new pjs.PVector(this.endPt.x - Math.cos(lineAngle-(angleDif)) * ctrlLen, this.endPt.y - Math.sin(lineAngle-(angleDif))*ctrlLen);
	curvePts[3] = new pjs.PVector(this.endPt.x, this.endPt.y);
    
	// Now draw the lines between bezier points
	bezPts = [];
	
	this.rayPoints = [];
	
	for (i=1; i<linePointAmt; i+=1)
	{
	    t = i / linePointAmt;
	    pointX = pjs.bezierPoint(curvePts[0].x, curvePts[1].x, curvePts[2].x, curvePts[3].x, t);
	    pointY = pjs.bezierPoint(curvePts[0].y, curvePts[1].y, curvePts[2].y, curvePts[3].y, t);
      
	    nextT = (t<linePointAmt-1) ? (i+1) / linePointAmt : 0;
	    nextX = pjs.bezierPoint(curvePts[0].x, curvePts[1].x, curvePts[2].x, curvePts[3].x, nextT);
	    nextY = pjs.bezierPoint(curvePts[0].y, curvePts[1].y, curvePts[2].y, curvePts[3].y, nextT);
	    if(debug){pjs.stroke(255, Math.random()*100 + 50)};
      
	    // create a new point
	    bezP = pjs.addParticle(pointX, pointY);
	    bezPts[i] = bezP;
      
	    rayPoint = bezPts[i];
	    r = new Ray(rays.size(), rayPoint, webCenter, spacingNoise);
	    rays.add(r);
      
	    if (i>0)
	    {
	      if(debug){pjs.ellipse(pointX, pointY, 4, 4);}
	      this.rayPoints.push(bezP);
	    }
	}
	
	// go through the points and make strokes
	for (i=0; i<linePointAmt-1; i+=1)
	{
	  // Finds the 1st point. Either the startPt or the first of the curve
	  p = (i === 0) ? this.startPoint : bezPts[i];
    
	  // Finds the next point. Either the last point or the next in curve;
	  nextP = (i < linePointAmt-1) ? bezPts[i+1] : this.nextPoint;
    
	  dx = p.x - nextP.x;
	  dy = p.y - nextP.y;
	  lineDist = Math.sqrt(dx*dx + dy*dy);
    
	  // lines between bezier points
	  pjs.makeSpring(p, nextP);
	}
	pjs.makeSpring(bezPts[linePointAmt-1], this.nextPoint);
    };
    


    Anchor.prototype.defineSourceLines = function()
    {
	var p, randomNum, rAnchor, rRay, pDist, i;
    
        // for the random line points, draw a line from that to a random ray point
	for (i=1; i<this.randomLinePoints.length-1; i+=1)
	{
	    p = this.randomLinePoints[i];
	    
	    randomNum = (Math.round(Math.random()-1));
	    randomNum += this.myOrder;
      
	    if (randomNum < 0) { randomNum += anchors.size(); }
	    if (randomNum >= anchors.size()) { randomNum = 0; }
  
	    rAnchor = anchors.get(randomNum);
	    if (rAnchor.rayPoints.length < 2) { return; }
	    rRay = rAnchor.rayPoints[Math.round(Math.random()*(rAnchor.rayPoints.length-2) + 1)];
	    pDist = pjs.getPartDist(p, rRay);
	  
	    pjs.makeSpring(p, rRay, pDist);
	}
    };







    /**************************************************
     
			    RAY
     
     **************************************************/

    function Ray(theOrder, theStartPoint, theEndPoint, theSNoise)
    {
	var dx, dy, len, avgRad, pointSpacing, i, p, someNoise;
	
	this.startPt = new pjs.PVector(theStartPoint.x, theStartPoint.y);	// start point of the connecting line
	this.endPt = new pjs.PVector(theEndPoint.x, theEndPoint.y);
	this.strandLength = undefined;						// the length of strand from the web center
	this.points = [];							// array of points along the ray line
	this.myOrder = theOrder;						// the order of the ray around the web            
	this.myAngle = undefined;						// the angle of the current ray
	this.spacingNoise = theSNoise;						// noise for the placement of the points along the ray.
	this.rayPointAmt = barPointAmt;						// amount of points along the array
	this.startPoint = theStartPoint;
	this.nextPoint = theEndPoint;
	this.strands = undefined;
	this.rayPoints = [];							// list of points that will make up the ray
    
    
	// Find the length and angle of current and next line
	dx = this.startPt.x - this.endPt.x;
	dy = this.startPt.y - this.endPt.y;
	this.myAngle = Math.atan2(dy, dx);
	
	len = Math.sqrt((dx*dx) + (dy*dy));
       
    
	// Get the length of the strand. If the strand is longer than the average strand length, then use 
	// that as the factor for getting the number and placement of points along the ray.
	// Multiplying by a fraction will keep the points away form the edges of the strands.
	avgRad = avgRadius;// * .9;
	this.strandLength = (len < avgRad) ? len : avgRad;
    
	pointSpacing = (((this.strandLength-5) * 0.99) / barPointAmt);

	// find the positions of all the points that will go on the given ray
	for (i=0; i<this.rayPointAmt; i+=1) {
	    someNoise = pjs.map(pjs.noise(spacingNoise), 0, 1, 0.75, 1.15);
	    p = new pjs.PVector(webCenter.x + Math.cos(this.myAngle)*(i*pointSpacing * someNoise), webCenter.y + Math.sin(this.myAngle)*(i*pointSpacing * someNoise));
	    this.points.push(p);
	    spacingNoise += 0.2;
	}
    }



    Ray.prototype.make = function()
    {
	var radialNoise, i, randomChance, p, n, nextStrand, nextAngle, dx, dy, pointDist, thisPoint, startAngle, startPoint, strandLen;
	// A thinner and less opaque line gives the sense of depth of a strand
	radialNoise = Math.random()*100;
	strands = new pjs.ArrayList();
	
	// add the initail points to the points array so that they at least connect if nothing else
	this.addRayPoint(this.startPoint);
	this.addRayPoint(this.nextPoint);
	
	for (i=1; i<this.rayPointAmt; i+=1) {
	    
	    // randomly DON'T draw a line
	    randomChance = Math.round(Math.random()*20);
	    //randomChance = 1;
	    if (randomChance === 0 || randomChance === 19 || randomChance === 18) { continue; }
	    p = this.points[i];
	    n = pjs.noise(radialNoise)*10;
	    
	    // if not the last strand
	    if (this.myOrder < rays.size()-1) {
		nextStrand = rays.get(this.myOrder+1);
	    }
	    else {
		nextStrand = rays.get(0);
	    }

	    nextAngle = nextStrand.myAngle;
	    
	    dx = p.x - webCenter.x;
	    dy = p.y - webCenter.y;
	    
	    // Get a random distance to place the starting point at. it will be within a range above and 
	    // below the original point. The further away from the center, the more variation it can have
	    pointDist = this.getRandomPoint(dx, dy, i * 0.2, this.strandLength);
	    thisPoint = pjs.addParticle(webCenter.x + Math.cos(this.myAngle) * pointDist, webCenter.y + Math.sin(this.myAngle) * pointDist);
	    
	    pointDist = this.getRandomPoint(dx, dy, i * 0.2, nextStrand.strandLength);
	    
	    // draw y shape between rays instead of straight line
	    if (randomChance === 1)// || randomChance == 15 || randomChance == 16)
	    {
		this.drawYShape(p, thisPoint, nextAngle, nextStrand, pointDist);
	    }
	    else
	    {
		this.drawStrand(thisPoint, nextAngle, nextStrand, pointDist);
	    }
	    
	    
	    // draw another line from the point
	    if (randomChance === 2) 
	    {
		pointDist = this.getRandomPoint(dx, dy, i * 0.8, nextStrand.strandLength);
		this.drawStrand(thisPoint, nextAngle, nextStrand, pointDist);
	    }
      
      
	    // draws a much longer line from the start point (which can be from either side.)
	    else if (randomChance === 3)
	    {
		startAngle = (Math.round(Math.random()) === 0) ? nextAngle : this.myAngle;
		
		if (startAngle === nextAngle)
		{
		    startPoint = thisPoint;
		    strandLen = nextStrand.strandLength;
		    pointDist = this.getRandomPoint(dx, dy, i*Math.random()*4 + 6, strandLen);
		    this.drawStrand(startPoint, startAngle, nextStrand, pointDist, true);
		}
		else
		{    
		    startPoint = thisPoint;
		    strandLen = nextStrand.strandLength;
		    pointDist = this.getRandomPoint(dx, dy, i*Math.random()* -4 - 6, strandLen);
		    this.drawStrand(startPoint, nextAngle, nextStrand, pointDist, true);
		}
	    }
	    radialNoise += 0.1;
	}
    };

    
    Ray.prototype.drawYShape = function(p, thisPoint, nextAngle, nextStrand, pointDist)
    {
	var pointDev, startAngle, nextPointA, nextPointB, difAngle, randDif, partialPoint, startPoint;
	// find extra points for "y" shape
	pointDev = Math.random()*3 + 2;
	startAngle = (Math.round(Math.random()) === 0) ? nextAngle : this.myAngle;
		
	nextPointA = pjs.addParticle(webCenter.x + Math.cos(startAngle) * (pointDist-pointDev), webCenter.y + Math.sin(startAngle) * (pointDist-pointDev));
	
	pointDev = Math.random()*3 + 2;
	nextPointB = pjs.addParticle(webCenter.x + Math.cos(startAngle) * (pointDist+pointDev), webCenter.y + Math.sin(startAngle) * (pointDist+pointDev));
	
	// find partial way point
	difAngle = (startAngle === nextAngle) ? this.myAngle - nextAngle : nextAngle - this.myAngle;
	if (difAngle<-1) { difAngle+=pjs.TWO_PI; }
	if (difAngle>1) { difAngle-=pjs.TWO_PI; }
	randDif = Math.random() * difAngle;
	partialPoint = pjs.addParticle(webCenter.x + Math.cos(startAngle + randDif) * pointDist, webCenter.y + Math.sin(startAngle + randDif) * pointDist);
	
	if (startAngle === nextAngle)
	{
	    startPoint = thisPoint;
	    this.addRayPoint(startPoint);
	    
	    nextStrand.addRayPoint(nextPointA);
	    nextStrand.addRayPoint(nextPointB);
	}
	else {
	    startPoint = pjs.addParticle(webCenter.x + Math.cos(nextAngle) * pointDist, webCenter.y + Math.sin(nextAngle) * pointDist);
	    nextStrand.addRayPoint(startPoint);
	    this.addRayPoint(nextPointA);
	    this.addRayPoint(nextPointB);
	}
	
	pjs.makeSpring(startPoint, partialPoint);
	pjs.makeSpring(partialPoint, nextPointA);
	pjs.makeSpring(partialPoint, nextPointB);
	
	if(debug){
	    pjs.line(startPoint.x, startPoint.y, partialPoint.x, partialPoint.y);
	    pjs.line(partialPoint.x, partialPoint.y, nextPointA.x, nextPointA.y);
	    pjs.line(partialPoint.x, partialPoint.y, nextPointB.x, nextPointB.y);
	}
    };
    
    
    
    Ray.prototype.drawStrand = function(thisPoint, nextAngle, nextStrand, pointDist, fromOppositeSide)
    {
	var nextPoint, lineLen;
	
	nextPoint = pjs.addParticle(webCenter.x + Math.cos(nextAngle) * pointDist, webCenter.y + Math.sin(nextAngle) * pointDist);
	// draws a normal single connector line
	lineLen = pjs.getPartDist(thisPoint, nextPoint);
	if (lineLen > 0) {
		this.addRayPoint(thisPoint);
		nextStrand.addRayPoint(nextPoint);
		pjs.makeSpring(thisPoint, nextPoint);
	}
    };
    
    

    Ray.prototype.defineRayPoints = function()
    {
	var dist1, dist2, i, p1, p2, len, s;
	// sort the points from closest to furthest from the web center
	function sortDistance(a,b){
	    dist1 = pjs.getPartDist(webCenter, a);
	    dist2 = pjs.getPartDist(webCenter, b);

	    return Math.round(dist1 - dist2);
	}
	this.rayPoints.sort(sortDistance);
	
	// go through the points and create a strand and define the spring
	for (i=1; i<this.rayPoints.length; i+=1)
	{
	    p1 = this.rayPoints[i];
	    p2 = this.rayPoints[i-1];
	    len = pjs.getPartDist(p1, p2);
	    
	    pjs.makeSpring(p1, p2);
	    if(debug){pjs.ellipse(p1.x, p1.y, 3, 3);}
	    pjs.stroke(0, 255);
	    
	    s = physics.springs[physics.springs.length-1];
	    if(debug){pjs.line(s.a.x, s.a.y, s.b.x, s.b.y);}
	}
    };
    
    
    Ray.prototype.boolToInt = function(value) {
	var intVal = (value) ? 1 : 0;
        return intVal;
    };
    
    
    Ray.prototype.getRandomPoint = function(dx, dy, range, maxLength)
    {
	var pointDist = Math.sqrt((dx*dx) + (dy*dy)) + Math.random()*(range*2) - range;//-range, range);
	// make sure they are not connecting to points that don't exist
	pointDist = (pointDist > maxLength) ? maxLength : pointDist;
	return pointDist;
    };
    

    // once all the rays are defined, the ray points will be defined. Then the line and spring can be added
    Ray.prototype.addRayPoint = function(p) {
	// check to make sure we don't add any dupe points
	for(var i=0; i < this.rayPoints.length; i+=1){
	    if(this.rayPoints[i].x === p.x && this.rayPoints[i].y === p.y){
		return;
	    }
	}
	this.rayPoints.push(p);
	pjs.stroke(0, 0, 255);
	pjs.noFill();
    };


    
    


/**************************************************
 
		       STRAND

 ************************************************* */


    function Strand(theStartPt, theEndPt)
    {
	var dx, dy, angle, n;
	
	this.lineLength = undefined;
	this.segW = 10;
	this.pointNum = undefined;
      
	this.startPoint = theStartPt;
	this.endPoint = theEndPt;
	this.particles = [];
      
	this.strandColor = pjs.color(Math.random()*50);
	//this.strandColor = pjs.color(0);
	this.strokeW = undefined;
    
	n = pjs.noise(strandNoise);
	this.strandAlpha = pjs.map(n, 0, 1, 150, 255);
	//this.strandAlpha = Math.random()*200 + 55;
	
	this.strokeW = 0.1 + pjs.noise(strandNoise) * 1.2;
	
	
	dx = this.endPoint.x - this.startPoint.x;
	dy = this.endPoint.y - this.startPoint.y;
	angle = Math.atan2(dy, dx);
	this.lineLength = Math.sqrt(dx*dx + dy*dy);
    
	this.particles = [];
	this.particles[0] = this.startPoint;
	this.particles[1] = this.startPoint;
	
	strandNoise += 0.2;
	if(debug){pjs.line(this.startPoint.x, this.startPoint.y, this.endPoint.x, this.endPoint.y)};
    }
    
    
    Strand.prototype.update = function(){
	pjs.stroke(this.strandColor, this.strandAlpha);
	pjs.strokeWeight(this.strokeW);
	pjs.noFill();
	//pjs.line(this.startPoint.x, this.startPoint.y, this.endPoint.x, this.endPoint.y);
	
	pjs.beginShape();
	pjs.curveVertex(this.startPoint.x, this.startPoint.y);
	pjs.curveVertex(this.startPoint.x, this.startPoint.y);
	pjs.curveVertex(this.endPoint.x, this.endPoint.y);
	pjs.curveVertex(this.endPoint.x, this.endPoint.y);
	pjs.endShape();
    };

    pjs.setup();
}


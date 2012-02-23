window.onload = function()
{
    console.log("onLoad");
    init();
};

function init(){
    console.log("init");
    var canvas = document.getElementById('canvas'), toDraw=false;  
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
	console.log("SET UP");
	pjs.size(600,600);
	// we want to turn off animation, because this is a demo page and it
        // would use cpu while not being looked at. Only draw on mousemoves
	
	pjs.background(0);
        pjs.smooth();
           
        stageCenter = new pjs.PVector(pjs.width/2, pjs.height/2);
        this.initPhysics();
        this.initItems();
        //this.drawWeb();
        //if(!toDraw) pjs.noLoop();
	this.draw = draw;
	interval = setInterval(draw, 1000);
    }
    
    
    pjs.initPhysics = function() {
        physics = new toxi.physics2d.VerletPhysics2D();
        // set screen bounds as bounds for physics sim
        physics.setWorldBounds(new toxi.Rect(0,0,pjs.width,pjs.height));
        // add gravity along positive Y axis
        physics.addBehavior(new toxi.physics2d.GravityBehavior(new toxi.Vec2D(0,.9)));
    }
    
    
    
    pjs.initItems = function()
    {
        var point = pjs.addParticle(pjs.width/2, pjs.height/2);
        point.unlock();
        /*
	strands = new pjs.ArrayList();
        // reset vars and clear the stage
        rays = new pjs.ArrayList();
        pointNum = Math.round(Math.random()*6 + 4);
        
        spacingNoise = Math.random()*10;
        barPointAmt = Math.round(Math.random()*10 + 10);
        strandNoise = Math.random()*100;
        
        // draw everything
        this.placeAnchorPoints();
        this.drawPerimeterLines();
	
	
	for (var i=0; i< physics.springs.length; i++) {
            s = physics.springs[i];
            var strand = new Strand(s.a, s.b);
            strands.add(strand);
        }*/
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
          r.update();
        }
    }
    
    
    
    pjs.makeSpring = function(pt1, pt2)
    {
      var dx = (pt1.x - pt2.x);
      var dy = (pt1.y - pt2.y);
      var len = Math.sqrt((dx*dx) + (dy*dy));
      makeSpring(pt1, pt2, len);
    }
    
    
    pjs.makeSpring = function(p1, p2, len)
    {
      var res = 50.0;
      var ptNum = 0;
      var ptAngle;
      var ptDist;
      
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
    
    
    pjs.addSpring = function(p1, p2, len)
    {
	addSpring(p1, p2, len, 0.5);
    }
    
    pjs.addSpring = function (p1, p2, len, strength)
    {
	console.log(p2.x);
	var s = new toxi.physics2d.VerletSpring2D(p1, p2, len, strength);
	physics.addSpring(s);
    }
    
    
    
    pjs.addParticle = function(xPos,yPos)
    {
	//var v = new toxi.Vec2D(xPos, yPos);
	console.log(xPos + ", "+ yPos);
	var p = new toxi.physics2d.VerletParticle2D(xPos, yPos);
        p.setWeight(.5);
        physics.addParticle(p);
	/*for(var i in p){
	    console.log(i);
	    console.log(p[i])
	}
	console.log(p);*/
        //console.log(p.x);
	//console.log(p.invWeight)
	if(p.x == "NaN")
	    console.log("SOMETHIN' IS WRONG");
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
	
	console.log("DRAW");
        console.log(physics);
	
	
	// show all particles
	pjs.fill(0, 100);
	pjs.noStroke();
	//for(VerletParticle2D p : physics.particles) {
	for (var i=0; i < physics.particles.length; i++) {
	  var p  = physics.particles[i];
	  if(i==0){
	    //console.log(p.x);
	    console.log(p);
	  }
	  //ellipse(p.x,p.y,5,5);
	  pjs.fill(255, 50);
	  pjs.stroke(255);
	  pjs.ellipse(p.x,p.y,5,5);
	  //if(i>8)text(i-9, p.x,p.y);
	}
    
	/*
	for (var i=0; i<rays.size(); i++){
	    var r = rays.get(i);
	    r.update();
	}
	*/
	
	//console.log(webCenter.x);
	//console.log(webCenter.y);
	physics.update();
    }
    
    
    pjs.setup();
}

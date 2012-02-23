
/* 
 * Copyright (c) 2010 Karsten Schmidt
 * 
 * This demo & library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 2.1 of the License, or (at your option) any later version.
 * 
 * http://creativecommons.org/licenses/LGPL/2.1/
 * 
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 * 
 * You should have received a copy of the GNU Lesser General Public
 * License along with this library; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
 */

import toxi.geom.*;
//import toxi.physics2d.*;

//import toxi.physics2d.constraints.*;
//import toxi.physics2d.behaviors.*;
import toxi.physics2d.*;


int pointNum;                  // number of radial anchor points
float radius = 200;            // the base radius for the anchor points
ArrayList anchors;             // array of radial anchor points
PVector stageCenter;           // center of the stage
VerletParticle2D webCenter;    // center of the web
ArrayList rays;                // array of ray lines (which come from the anchor points)
float avgRadius;               // average length of a ray 
float spacingNoise;            // noise for spacing the bars
int barPointAmt;               // number of points along a ray
ArrayList<Strand> strands;

boolean toDraw = false;
int updateMax = 1000;
int updateCount = 0;
float strandNoise;

VerletPhysics2D physics;


void setup() {
  size(600, 600);
  background(0);
  smooth();
  stageCenter = new PVector(width/2, height/2);
  initPhysics();
  drawWeb();
  
  //if(!toDraw) noLoop();
}

void initPhysics() {
  physics = new toxi.physics2d.VerletPhysics2D();
  // set screen bounds as bounds for physics sim
  physics.setWorldBounds(new toxi.Rect(0,0,width,height));
  // add gravity along positive Y axis
  physics.addBehavior(new toxi.physics2d.GravityBehavior(new toxi.Vec2D(0,0.09)));
 
}

void drawWeb() 
{
  strands = new ArrayList();
  // reset vars and clear the stage
  rays = new ArrayList();
  pointNum = (int)random(4, 10);
  //pointNum = 4;
  spacingNoise = random(10);
  barPointAmt = (int)random(10, 20);
  strandNoise = random(100);
  //barPointAmt = 2;
  // draw everything
  placeAnchorPoints();
  drawPerimeterLines();
  //drawBars();

  

  for (VerletSpring2D s : physics.springs) {
    Strand strand = new Strand(s.a, s.b  );
    strands.add(strand);
  }
}


void placeAnchorPoints() 
{
  ArrayList anchorPoints = new ArrayList();
  float angleDif = TWO_PI/pointNum;
  float maxX = 0;
  float minX = width;
  float maxY = 0;
  float minY = height;
  float radiusSum = 0;

  for (int i=0; i<pointNum; i++) {
    float angle = (i * angleDif);
    float r = random(radius*.5, radius*1.5);
    radiusSum += r;
    float pX = stageCenter.x + cos(angle) * r;
    float pY = stageCenter.y + sin(angle) * r;
    VerletParticle2D p = addParticle(pX, pY);
    //p.lock();

    maxX = (pX > maxX) ? pX : maxX;
    minX = (pX < minX) ? pX : minX;
    maxY = (pY > maxY) ? pY : maxY;
    minY = (pY < minY) ? pY : minY;
    anchorPoints.add(p);

    noFill();
    stroke(255, 50);
    //ellipse(p.x, p.y, 10, 10);

    fill(255);
    noStroke();
    //ellipse(p.x, p.y, 2, 2);
  }

  avgRadius = radiusSum / pointNum;
  webCenter = addParticle(minX + (maxX - minX)/2, minY + (maxY - minY)/2);
  //webCenter.lock();

  // create the anchor strands from the points
  anchors = new ArrayList();
  for (int i=0; i<anchorPoints.size(); i++) {
    VerletParticle2D startPt = ((VerletParticle2D)anchorPoints.get(i));
    VerletParticle2D endPt = (i<anchorPoints.size()-1) ? ((VerletParticle2D)anchorPoints.get(i+1)) : (VerletParticle2D)anchorPoints.get(0);
    Anchor anchor = new Anchor(i, startPt, endPt);
    anchors.add(anchor);
  }
}



// draw the lines between the anchor points
void drawPerimeterLines() {
  for (int i=0; i<anchors.size(); i++) {
    Anchor anchor = (Anchor)anchors.get(i);
    anchor.makePoints();
  }
  
  for (int i=0; i<anchors.size(); i++) {
    Anchor anchor = (Anchor)anchors.get(i);
    
    anchor.defineSourceLines();
    //anchor.update();
  }
  makeRays();
}



void makeRays() {
  for (int i=0; i<rays.size(); i++)
  {
    Ray r = (Ray)rays.get(i);
    r.make();
  }

  for (int i=0; i<rays.size(); i++)
  {
    Ray r = (Ray)rays.get(i);
    r.defineRayPoints();
    r.update();
  }
}




void makeSpring(VerletParticle2D pt1, VerletParticle2D pt2)
{
  float dx = (pt1.x - pt2.x);
  float dy = (pt1.y - pt2.y);
  float len = sqrt((dx*dx) + (dy*dy));
  makeSpring(pt1, pt2, len);
}


void makeSpring(VerletParticle2D p1, VerletParticle2D p2, float len)
{
  float res = 50.0;
  int ptNum = 0;
  float ptAngle;
  float ptDist;
  if (len>res) {
    ptNum = floor(len/res);
  }

  if (ptNum>0)
  {
    //ptDist = len/res;
    ptAngle = getAngle(p1, p2);
    // make a bunch of midway points
    VerletParticle2D[] pts = new VerletParticle2D[0];
    for (int i=0; i<ptNum; i++) {
      float xPos = p1.x + cos(ptAngle) * ((i+1)*res);
      float yPos = p1.y + sin(ptAngle) * ((i+1)*res);
      VerletParticle2D p = addParticle(xPos, yPos);
      pts = (VerletParticle2D[])append(pts, p);
    }
    
    // add spring between all the midway points
    float sprStr = (1 / (res))*1.50;
    float sprLen = res/len;
    addSpring(p1, pts[0], sprLen, sprStr);
    for (int i=1; i<pts.length; i++) {
      VerletParticle2D pStart = pts[i];
      VerletParticle2D pEnd = pts[i-1];

      addSpring(pStart, pEnd, sprLen, sprStr);
    }
    addSpring(pts[pts.length-1], p2, sprLen, sprStr);
  }
  else
  {
    addSpring(p1, p2, len);
  }

  //physics.makeSpring(pt1, pt2, 0.2, 0.1, len/2);
  //physics.makeAttraction(pt1, pt2, -1000, len );
  //addSpring(p1, p2, len);
}


void addSpring(VerletParticle2D p1, VerletParticle2D p2, float len)
{
  addSpring(p1, p2, len, 0.5);
}

void addSpring(VerletParticle2D p1, VerletParticle2D p2, float len, float strength)
{
  VerletSpring2D s = new toxi.physics2d.VerletSpring2D(p1, p2, len, strength);
  //VerletSpring2D s= new toxi.physics2d.VerletSpring2D(p,physics.particles[idx-1],REST_LENGTH,STRENGTH);
  physics.addSpring(s);
}


VerletParticle2D addParticle(float xPos, float yPos)
{
  VerletParticle2D p = new toxi.physics2d.VerletParticle2D(xPos, yPos);
  p.setWeight(.1);
  physics.addParticle(p);
  
  return p;
}


float getPartDist(VerletParticle2D pt1, VerletParticle2D pt2)
{  
  float dx = (pt1.x - pt2.x);
  float dy = (pt1.y - pt2.y);
  float len = sqrt((dx*dx) + (dy*dy));
  return len;
}


float getAngle(VerletParticle2D pt1, VerletParticle2D pt2)
{
  float dx = (pt1.x - pt2.x);
  float dy = (pt1.y - pt2.y);
  float angle = atan2(dy, dx);
  return angle;
}



//////////////////////////
void draw() {

  // then drawing
  background(0);
  // draw all springs
  stroke(255, 0, 255, 100);

	
  
  for (Strand s : strands) {
    s.update();
  }
  
  // show all particles
  fill(0, 100);
  noStroke();
  //for(VerletParticle2D p : physics.particles) {
  for (int i=0; i < physics.particles.length; i++) {
    VerletParticle2D p  = physics.particles[i];
    //ellipse(p.x,p.y,5,5);
    fill(0, 150);
    ellipse(p.x,p.y,5,5);
    //if(i>8)text(i-9, p.x,p.y);
  }

	


  for (int i=0; i<anchors.size(); i++) {
    Anchor anchor = (Anchor)anchors.get(i);

  }

  for (int i=0; i<rays.size(); i++)
  {
    Ray r = (Ray)rays.get(i);
    r.update();
  }
  
  console.log(webCenter.x);
  console.log(webCenter.y);
  physics.update();
}





/************
 
 ANCHOR
 
************* */

class Anchor {

  PVector startPt;                        // start point of the connecting line
  PVector endPt;                          // end point of the connecting line
  float pointSpacing = 40;                // amount of space between strands (35 is good). This may have to depend on other things later such as the average line length or something.
  int myOrder;                            // order of the point within all radial points
  float myAngle;                          // angle of this strand (towards the web center)
  float nextAngle;                        // angle of the next strand
  PVector webCenterPoint;                 // vector of the web center particle
  VerletParticle2D[] randomLinePoints;    // additional random line points along the same anchor to edge line
  VerletParticle2D[] rayPoints;           // points to connect the ray

  VerletParticle2D startPoint;
  VerletParticle2D nextPoint;
  VerletParticle2D edgePoint;



  Anchor(int order, VerletParticle2D startPoint, VerletParticle2D endPoint) {
    this.startPoint = startPoint;
    this.nextPoint = endPoint;
    this.webCenterPoint = new PVector(webCenter.x, webCenter.y);
    startPt = new PVector(startPoint.x, startPoint.y);
    endPt = new PVector(endPoint.x, endPoint.y);
    myOrder = order;

    // find the angle of the anchor point (in relation to the web center)
    float dx = (startPt.x - webCenterPoint.x);
    float dy = (startPt.y - webCenterPoint.y);
    float heightDif = (stageCenter.y - height);
    float widthDif = (stageCenter.x - width);
    float dif = width  - sqrt(dx*dx + dy*dy);
    myAngle = atan2(dy, dx);

    dx = (endPt.x - webCenterPoint.x);
    dy = (endPt.y - webCenterPoint.y);
    dif = width  - sqrt(dx*dx + dy*dy);
    nextAngle = atan2(dy, dx);

    strands = new ArrayList();
    drawEdgeLines();
  }



  // draw the lines from the anchor points to the border
  void drawEdgeLines()
  {
    // randomly find a random amount of points to place between the start and end point
    int pointAmt = round(random(1)) == 0 ? round(random(1, 8)) : 0;
    //int pointAmt = 2;

    randomLinePoints = new VerletParticle2D[2 + pointAmt];
    randomLinePoints[0] = startPoint;

    float opAngle = HALF_PI - ((myAngle < 0) ? myAngle + TWO_PI : myAngle);
    float sideDistX = (startPt.x < width/2) ? -startPt.x: width - startPt.x;
    float sideDistY = (startPt.y < height/2) ? -startPt.y : height - startPt.y;

    float opRx = sideDistX/sin(opAngle);
    float opRy = sideDistY/cos(opAngle);
    float opR =  (abs(opRx)<abs(opRy)) ? opRx : opRy;

    edgePoint = addParticle(startPt.x +  cos(myAngle) * (opR), startPt.y + sin(myAngle) * (opR));
    edgePoint.lock();

    float lenFactor = opR/pointAmt;
    for (int i=0; i<pointAmt; i++) {

      float randLen = lenFactor * i + random(lenFactor); 
      VerletParticle2D midPoint = addParticle(startPt.x +  cos(myAngle) * (randLen), startPt.y + sin(myAngle) * (randLen));
      randomLinePoints[i+1] = midPoint;
    }

    randomLinePoints[randomLinePoints.length-1] = edgePoint;
    for (int i=1; i<randomLinePoints.length; i++)
    {
      VerletParticle2D curP = (VerletParticle2D)randomLinePoints[i];
      VerletParticle2D prevP = (VerletParticle2D)randomLinePoints[i-1];
      float pDist = getPartDist(prevP, curP);

      makeSpring(curP, prevP, pDist);
    }
  }




  void makePoints() {

    stroke(255, random(50, 150));

    float dx = (endPt.x - startPt.x);
    float dy = (endPt.y - startPt.y);
    float lineDist = sqrt((dx*dx) + (dy*dy));
    float lineAngle = atan2(dy, dx);

    int linePointAmt;
    // ensure that there are at least 2 points to go between
    // If only 1, it will fail
    int pointDistFactor = 0;
    do {
      linePointAmt = floor(lineDist/(pointSpacing - pointDistFactor));
      pointDistFactor++;
    }
    while (linePointAmt<2);

    float halfAngle = lineAngle + (TWO_PI);
    float rAngleFactor = random(.1, .4);

    // make the curve more random so that it's not perfect
    float angleDif = PI*rAngleFactor;        // the random angle that will be sloped between points
    float ctrlLen = lineDist*rAngleFactor;   // the random distance of the control points
    noFill();

    // make the bezier curve points based on the calculated control factors
    PVector[] curvePts = new PVector[4];
    curvePts[0] = new PVector(startPt.x, startPt.y);
    curvePts[1] = new PVector(startPt.x + cos(lineAngle+(angleDif)) * ctrlLen, startPt.y + sin(lineAngle+(angleDif))*ctrlLen);
    curvePts[2] = new PVector(endPt.x - cos(lineAngle-(angleDif)) * ctrlLen, endPt.y - sin(lineAngle-(angleDif))*ctrlLen);
    curvePts[3] = new PVector(endPt.x, endPt.y);

    // Now draw the lines between bezier points
    VerletParticle2D[] bezPts = new VerletParticle2D[linePointAmt];
    rayPoints = new VerletParticle2D[0];

    for (int i=1; i<linePointAmt; i++) {

      float t = i / (float)linePointAmt;
      float pointX = bezierPoint(curvePts[0].x, curvePts[1].x, curvePts[2].x, curvePts[3].x, t);
      float pointY = bezierPoint(curvePts[0].y, curvePts[1].y, curvePts[2].y, curvePts[3].y, t);

      float nextT = (t<linePointAmt-1) ? (i+1) / (float)linePointAmt : 0;
      float nextX = bezierPoint(curvePts[0].x, curvePts[1].x, curvePts[2].x, curvePts[3].x, nextT);
      float nextY = bezierPoint(curvePts[0].y, curvePts[1].y, curvePts[2].y, curvePts[3].y, nextT);
      stroke(255, random(50, 150));

      // create a new point
      VerletParticle2D bezP = addParticle(pointX, pointY);
      bezPts[i] = bezP;

      VerletParticle2D rayPoint = (VerletParticle2D)bezPts[i];
      Ray r = new Ray(rays.size(), rayPoint, webCenter, spacingNoise);
      rays.add(r);

      if (i>0) {
        ellipse(pointX, pointY, 4, 4);
        rayPoints = (VerletParticle2D[])append(rayPoints, bezP);
      }
      else {
        //println("DON'T ADD " + i);
      }
    }

    // go through the points and make strokes
    for (int i=0; i<linePointAmt-1; i++)
    {
      // Finds the 1st point. Either the startPt or the first of the curve
      VerletParticle2D p = (i == 0) ? startPoint : (VerletParticle2D)bezPts[i];

      // Finds the next point. Either the last point or the next in curve;
      VerletParticle2D nextP = (i < linePointAmt-1) ? (VerletParticle2D)bezPts[i+1] : nextPoint;

      dx = p.x - nextP.x;
      dy = p.y - nextP.y;
      lineDist = sqrt(dx*dx + dy*dy);

      // lines between bezier points
      makeSpring(p, nextP);
    }
    makeSpring((VerletParticle2D)bezPts[linePointAmt-1], nextPoint);
  }



  void defineSourceLines() {
    //println("DEFINE SOURCE LINES");
    // for the random line points, draw a line from that to a random ray point
    for (int i=1; i<randomLinePoints.length-1; i++)
    {
      VerletParticle2D p = (VerletParticle2D)randomLinePoints[i];
      /*
      fill(255, 50);
      stroke(255);
      ellipse(p.x, p.y, 5, 5);
       */
      int randomNum = (int)(round(random(0, 1)-1));
      randomNum += myOrder;

      if (randomNum < 0) randomNum += anchors.size();
      if (randomNum >= anchors.size()) randomNum = 0;

      Anchor rAnchor = (Anchor)anchors.get(randomNum);
      if (rAnchor.rayPoints.length < 2) return;
      VerletParticle2D rRay = rAnchor.rayPoints[round(random(1, rAnchor.rayPoints.length-1))];
      float pDist = getPartDist(p, rRay);

      makeSpring(p, rRay, pDist);
    }
    /*
    stroke(255, 0, 0, 50);
    noFill();
    ellipse(((VerletParticle2D)randomLinePoints[0]).x, ((VerletParticle2D)randomLinePoints[0]).y, 10, 10);
    */
  }
}






/**************************************************
 
			RAY
 
/************************************************** */

class Ray {

  PVector startPt;            // start point of the connecting line
  PVector endPt;
  float strandLength;      // the length of strand from the web center
  PVector points[] = new PVector[0];   // array of points along the ray line
  int myOrder;             // the order of the ray around the web            
  float myAngle;           // the angle of the current ray
  float spacingNoise;      // noise for the placement of the points along the ray.
  int rayPointAmt;         // amount of points along the array
  VerletParticle2D startPoint;
  VerletParticle2D nextPoint;
  ArrayList strands;
  VerletParticle2D rayPoints[];      // list of points that will make up the ray


  Ray(int order, VerletParticle2D startPoint, VerletParticle2D endPoint, float sNoise) {
    this.startPoint = startPoint;
    this.nextPoint = endPoint;
    myOrder = order;
    rayPoints = new VerletParticle2D[0];

    startPt = new PVector(startPoint.x, startPoint.y);
    endPt = new PVector(endPoint.x, endPoint.y);

    spacingNoise = sNoise;
    rayPointAmt = barPointAmt + (int)(random(-3, 8));
    rayPointAmt = barPointAmt;


    // Find the length and angle of current and next line
    float dx = startPt.x - endPt.x;
    float dy = startPt.y - endPt.y;
    strandLength = sqrt((dx*dx) + (dy*dy));
    myAngle = atan2(dy, dx);

    // Get the length of the strand. If the strand is longer than the average strand length, then use 
    // that as the factor for getting the number and placement of points along the ray.
    // Multiplying by a fraction will keep the points away form the edges of the strands.
    float avgRad = avgRadius;// * .9;
    strandLength = (strandLength < avgRad) ? strandLength : avgRad;

    float pointSpacing = (((strandLength-5)*.99) / barPointAmt);
    //line(pos1.x, pos1.y, pos2.x, pos2.y);

    // find the positions of all the points that will go on the given ray
    for (int i=0; i<rayPointAmt; i++) {
      float someNoise = map(noise(spacingNoise), 0f, 1f, .75, 1.15);
      PVector p = new PVector(webCenter.x + cos(myAngle)*(i*pointSpacing * someNoise), webCenter.y + sin(myAngle)*(i*pointSpacing * someNoise));
      points = (PVector[])append(points, p);
      //ellipse(p.x, p.y, 2, 2);
      spacingNoise += .2;
    }
  }



  void make() {
    // A thinner and less opaque line gives the sense of depth of a strand
    //strokeWeight(random(.5, 1));
    float radialNoise = random(100);

    strands = new ArrayList();

    addRayPoint(startPoint);
    for (int i=1; i<rayPointAmt; i++) {
      //stroke(255, (int)random(30, 140));

      // randomly DON'T draw a line
      int randomChance = (int)random(20);
      if (randomChance == 0 || randomChance == 19 || randomChance == 18) continue;


      PVector p = points[i];
      float n = noise(radialNoise)*10;

      // if not the last strand
      Ray nextStrand;
      if (myOrder < rays.size()-1) {
        nextStrand = (Ray)rays.get(myOrder+1);
      }
      else {
        nextStrand = (Ray)rays.get(0);
      }

      float nextAngle = nextStrand.myAngle;

      float dx = p.x - webCenter.x;
      float dy = p.y - webCenter.y;

      // Get a random distance to place the starting point at. it will be within a range above and 
      // below the original point. The further away from the center, the more variation it can have
      float pointDist = getRandomPoint(dx, dy, i*.2, this.strandLength);
      VerletParticle2D thisPoint = addParticle(webCenter.x + cos(myAngle) * pointDist, webCenter.y + sin(myAngle) * pointDist);
      addRayPoint(thisPoint);

      pointDist = getRandomPoint(dx, dy, i*.2, nextStrand.strandLength);
      VerletParticle2D nextPoint;// = addParticle(webCenter.x + cos(nextAngle) * pointDist, webCenter.y + sin(nextAngle) * pointDist);

      // draw y shape between rays instead of straight line
      
      if (randomChance == 1)
      {

        // find extra points for "y" shape
        float pointDev = random(2, 5);
        float startAngle = (round(random(0, 1)) == 0) ? nextAngle : myAngle;

        //PVector nextPointA = new PVector(webCenter.x + cos(startAngle) * (pointDist-pointDev), webCenter.y + sin(startAngle) * (pointDist-pointDev));
        VerletParticle2D nextPointA = addParticle(webCenter.x + cos(startAngle) * (pointDist-pointDev), webCenter.y + sin(startAngle) * (pointDist-pointDev));

        pointDev = random(2, 5);
        //PVector nextPointB = new PVector(webCenter.x + cos(startAngle) * (pointDist+pointDev), webCenter.y + sin(startAngle) * (pointDist+pointDev));
        VerletParticle2D nextPointB = addParticle(webCenter.x + cos(startAngle) * (pointDist+pointDev), webCenter.y + sin(startAngle) * (pointDist+pointDev));

        // find partial way point
        float difAngle = (startAngle == nextAngle) ? myAngle - nextAngle : nextAngle - myAngle;
        if (difAngle<-1)difAngle+=TWO_PI;
        if (difAngle>1)difAngle-=TWO_PI;
        float randDif = difAngle * random(.05, .95);
        VerletParticle2D partialPoint = addParticle(webCenter.x + cos(startAngle + randDif) * pointDist, webCenter.y + sin(startAngle + randDif) * pointDist);

        VerletParticle2D startPoint;
        if (startAngle == nextAngle)
        {
          startPoint = thisPoint;
          addRayPoint(startPoint);
          nextStrand.addRayPoint(nextPointA);
          nextStrand.addRayPoint(nextPointB);
        }
        else {
          startPoint = addParticle(webCenter.x + cos(nextAngle) * pointDist, webCenter.y + sin(nextAngle) * pointDist);
          nextStrand.addRayPoint(startPoint);
          addRayPoint(nextPointA);
          addRayPoint(nextPointB);
        }



        makeSpring(startPoint, partialPoint);
        makeSpring(partialPoint, nextPointA);
        makeSpring(partialPoint, nextPointB);

        line(startPoint.x, startPoint.y, partialPoint.x, partialPoint.y);
        line(partialPoint.x, partialPoint.y, nextPointA.x, nextPointA.y);
        line(partialPoint.x, partialPoint.y, nextPointB.x, nextPointB.y);
      }
      else
      {
        nextPoint = addParticle(webCenter.x + cos(nextAngle) * pointDist, webCenter.y + sin(nextAngle) * pointDist);
        // draws a normal single connector line
        float lineLen = getPartDist(thisPoint, nextPoint);
        if (lineLen > 0) {
          nextStrand.addRayPoint(nextPoint);
          makeSpring(thisPoint, nextPoint);
        }
      }


      // draw another line from the point
      if (randomChance == 2) 
      {
        pointDist = getRandomPoint(dx, dy, i*.8, nextStrand.strandLength);
        nextPoint = addParticle(webCenter.x + cos(nextAngle) * pointDist, webCenter.y + sin(nextAngle) * pointDist);
        nextStrand.addRayPoint(nextPoint);
        makeSpring(thisPoint, nextPoint);
      }
      
      
      // draws a much longer line from the start point (whcih can be from either side.
      else if (randomChance == 3)
      {
        
        float startAngle = (round(random(0, 1)) == 0) ? nextAngle : myAngle;
        //PVector startPoint =  (startAngle == nextAngle) ? thisPoint : nextPoint;
        //float strandLen = (startAngle != nextAngle) ? this.strandLength : nextStrand.strandLength;
        //pointDist = getRandomPoint(dx, dy, i*random(6, 10), strandLen);
        //nextPoint = new PVector(webCenter.x + cos(startAngle) * pointDist, webCenter.y + sin(startAngle) * pointDist);
        //line(startPoint.x, startPoint.y, nextPoint.x, nextPoint.y);
        
        float strandLen;
        if (startAngle == nextAngle)
        {
          startPoint = thisPoint;
          strandLen = nextStrand.strandLength;
          pointDist = getRandomPoint(dx, dy, i*random(6, 10), strandLen);
          nextPoint = addParticle(webCenter.x + cos(startAngle) * pointDist, webCenter.y + sin(startAngle) * pointDist);
          
          addRayPoint(startPoint);
          nextStrand.addRayPoint(nextPoint);
          makeSpring(startPoint, nextPoint);
        }
        else {
          startPoint = addParticle(webCenter.x + cos(nextAngle) * pointDist, webCenter.y + sin(nextAngle) * pointDist);
          strandLen = this.strandLength;
          pointDist = getRandomPoint(dx, dy, i*random(6, 10), strandLen);
          nextPoint = addParticle(webCenter.x + cos(startAngle) * pointDist, webCenter.y + sin(startAngle) * pointDist);
          //addRayPoint(startPoint);
          
          nextStrand.addRayPoint(startPoint);
          addRayPoint(nextPoint);
          makeSpring(startPoint, nextPoint);
        }
      }

      radialNoise += .1;
    }
    addRayPoint(nextPoint);
  }




  void defineRayPoints()
  {
    /*
    // order the points by distance from center
    Collections.sort(rayPoints, new Comparator<VerletParticle2D>() {
      public int compare(VerletParticle2D a, VerletParticle2D b) {
        float dist1 = getPartDist(webCenter, a);
        float dist2 = getPartDist(webCenter, b);
        //boolean val = (dist1 < dist2);
        return round(dist1 - dist2);
      }
    }
    );*/
    
    
    rayPoints.sort(function(a,b){
      float dist1 = getPartDist(webCenter, a);
        float dist2 = getPartDist(webCenter, b);
        //boolean val = (dist1 < dist2);
        return round(dist1 - dist2);

     });
    /*
    println("-");
    for (VerletParticle2D p : rayPoints) {
      println("2: " + myOrder + " " + getPartDist(webCenter, p) );
    }*/

    // go through the points and create a strand and define the spring
    //println("-");
    for (int i=1; i<rayPoints.length; i++)
    {
      VerletParticle2D p1 = (VerletParticle2D)rayPoints[i];
      //if(myOrder == 0) text(i, p1.x, p1.y);
      VerletParticle2D p2 = (VerletParticle2D)rayPoints[i-1];
      float len = getPartDist(p1, p2);

      
      makeSpring(p1, p2);

    }
  }

  int boolToInt(boolean value) {
    int intVal = (value) ? 1 : 0;
    return intVal;
  }

  float getRandomPoint(float dx, float dy, float range, float maxLength)
  {
    float pointDist = sqrt((dx*dx) + (dy*dy)) + random(-range, range);
    // make sure they are not connecting to points that don't exist
    pointDist = (pointDist > maxLength) ? maxLength : pointDist;
    return pointDist;
  }



  void update() {

    //line(startPoint.x, startPoint.y, edgePoint.x, edgePoint.y);
    //edgeStrand.update();
    if (strands == null) return;
    //println("strands " + strands.size());
    for (int i=0; i<strands.size(); i++)
    {
      Strand s = (Strand)strands.get(i);
      s.update();
    }



    for (int i=0; i<rayPoints.length; i++)
    {
      VerletParticle2D p1 = (VerletParticle2D)rayPoints[i];
      fill(0);
      //if(myOrder == 0) text(i, p1.x, p1.y);
      //text(myOrder + ":" + i, p1.x, p1.y);
      fill(255, 0, 255);
      noStroke();
      //if(myOrder == 0) ellipse(p1.x, p1.y, 3, 3);
      float alph = (myOrder == 0) ? 255: 100;
      stroke(255, 0, 255, alph);
    }
  }


  // once all the rays are defined, the ray points will be defined. Then the line and spring can be added
  void addRayPoint(VerletParticle2D p) {
    //println("------------------------------------" + myOrder);
    //println(p.x + " " + p.y);
    //println("-                                  -");

    //this.rayPoints.add(p);
	rayPoints = (VerletParticle2d[])append(rayPoints, p);
	
    stroke(0, 0, 255);
    noFill();

    //println(myOrder + " --> " + rayPoints);
  }
}

    
    


/**************************************************
 
		       STRAND
 
/************************************************** */


class Strand {
  float lineLength;
  float segW = 10;
  int pointNum;

  VerletParticle2D startPoint;
  VerletParticle2D endPoint;
  VerletParticle2D[] particles;

  color strandColor;
  float strandAlpha;
  float strokeW;


  Strand(VerletParticle2D startPt, VerletParticle2D endPt) {
    startPoint = startPt;
    endPoint = endPt;
    //lineLength = len;
    
    strandColor = color(255);
    //strandAlpha = random(80, 200);
    //float m = 50.0;
    float n = noise(strandNoise);
    strandAlpha = map(n, 0, 1, 80, 160);
    //strandAlpha = 100;
    
    //strokeW  = random(.25, 1);
    strokeW = .1 + noise(strandNoise)*1.2;
    //strokeW = .3;
    
    float dx = endPoint.x - startPoint.x;
    float dy = endPoint.y - startPoint.y;
    float angle = atan2(dy, dx);
    lineLength = sqrt(dx*dx + dy*dy);

    particles = new VerletParticle2D[2];
    particles[0] = startPt;
    particles[1] = endPt;
    
    strandNoise += .2;
  }

  void update() 
  {  
    stroke(strandColor, strandAlpha);
    strokeWeight(strokeW);
    noFill();
    line(startPoint.x, startPoint.y, endPoint.x, endPoint.y);
  }
}











/*
VerletPhysics2D physics;
VerletParticle2D selected=null;

// squared snap distance for picking particles
float snapDist=10*10;

void setup() {
  size(600,600);
  physics=new toxi.physics2d.VerletPhysics2D();
  physics.setWorldBounds(new toxi.Rect(0,0,width,height));
  // create 10 particle strings of 20 particles each
  for(int i=0; i<10; i++) {
    ParticleString2D s = new toxi.physics2d.ParticleString2D(physics,new toxi.Vec2D(width/2,height/2),toxi.Vec2D.fromTheta(i*0.1*TWO_PI).scaleSelf(10),20,1,0.5);
  }
}

void draw() {
  background(245);
  noFill();
  physics.update();
  // draw all springs
  int springLen = physics.springs.length;
  for(int i =0;i < springLen; i++) {
    VerletSpring2D s = physics.springs[i];
    line(s.a.x,s.a.y,s.b.x,s.b.y);
  }
  // draw all particles
  int partLen = physics.particles.length;
  for(int i = 0;i<partLen; i++) {
    VerletParticle2D p= physics.particles[i];
    // selected particle in cyan, all others in black
    stroke(p==selected ? 0xff00ffff : 0xff000000);
    ellipse(p.x,p.y,5,5);
  }
}

// check all particles if mouse pos is less than snap distance
void mousePressed() {
  selected=null;
  Vec2D mousePos=new toxi.Vec2D(mouseX,mouseY);
  int partLen = physics.particles.length;
  for(int i = 0;i<partLen;i++) {
    VerletParticle2D p= physics.particles[i];
    // if mouse is close enough, keep a reference to
    // the selected particle and lock it (becomes unmovable by physics)
    if (p.distanceToSquared(mousePos)<snapDist) {
      selected=p;
      selected.lock();
      break;
    }
  }
}

// only react to mouse dragging events if we have a selected particle
void mouseDragged() {
  if (selected!=null) {
    selected.set(mouseX,mouseY);
  }
}

// if we had a selected particle unlock it again and kill reference
void mouseReleased() {
  if (selected!=null) {
    selected.unlock();
    selected=null;
  }
}*/

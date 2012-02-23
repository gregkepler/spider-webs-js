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
    int pointAmt = round(random(5)) == 0 ? round(random(1, 2)) : 0;
    
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
      
      fill(255, 50);
      stroke(255);
      ellipse(curP.x, curP.y, 10, 10);
      
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
    do{
      linePointAmt = floor(lineDist/(pointSpacing - pointDistFactor));
      pointDistFactor++;
    }while(linePointAmt<2);
    
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
    println("DEFINE SOURCE LINES");
    // for the random line points, draw a line from that to a random ray point
    for (int i=1; i<randomLinePoints.length; i++)
    {
      VerletParticle2D p = (VerletParticle2D)randomLinePoints[i];
     
      
      int randomNum = (int)(round(random(0, 1)-1));
      randomNum += myOrder;

      if (randomNum < 0) randomNum += anchors.size();
      if (randomNum >= anchors.size()) randomNum = 0;
      
      Anchor rAnchor = (Anchor)anchors.get(randomNum);
      if(rAnchor.rayPoints.length < 2) return;
      VerletParticle2D rRay = rAnchor.rayPoints[round(random(1, rAnchor.rayPoints.length-1))];
      float pDist = getPartDist(p, rRay);

      makeSpring(p, rRay, pDist);
    }
  }


}

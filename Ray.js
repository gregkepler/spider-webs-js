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
  ArrayList<VerletParticle2D> rayPoints;      // list of points that will make up the ray


  Ray(int order, VerletParticle2D startPoint, VerletParticle2D endPoint, float sNoise) {
    this.startPoint = startPoint;
    this.nextPoint = endPoint;
    myOrder = order;
    rayPoints = new ArrayList();

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

    //rayPoints = new ArrayList();
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
    for (VerletParticle2D p : rayPoints) {
      println("1: " + myOrder + " " + getPartDist(webCenter, p) );
    }*/
    //println("DEFINE " + myOrder + " " + rayPoints.size());
    // order the points by distance from center
    Collections.sort(rayPoints, new Comparator<VerletParticle2D>() {
      public int compare(VerletParticle2D a, VerletParticle2D b) {
        float dist1 = getPartDist(webCenter, a);
        float dist2 = getPartDist(webCenter, b);
        //boolean val = (dist1 < dist2);
        return round(dist1 - dist2);
      }
    }
    );
    /*
    println("-");
    for (VerletParticle2D p : rayPoints) {
      println("2: " + myOrder + " " + getPartDist(webCenter, p) );
    }*/

    //if(myOrder == rays.size()-1) println("2 - " + myOrder + " " + rayPoints.size());

    // go through the points and create a strand and define the spring
    //println("\n"+myOrder + "   " + rayPoints.size());
    //println("-");
    for (int i=1; i<rayPoints.size(); i++)
    {
      VerletParticle2D p1 = (VerletParticle2D)rayPoints.get(i);
      //if(myOrder == 0) text(i, p1.x, p1.y);
      VerletParticle2D p2 = (VerletParticle2D)rayPoints.get(i-1);
      float len = getPartDist(p1, p2);

      //println("3: " + myOrder + " " + getPartDist(webCenter, p1) );
      //noStroke();
      //fill(255, 0, 0, 50);
      //ellipse(p1.x, p1.y, 8, 8);
      //ellipse(p2.x, p2.y, 4, 4);
      //println(" len " + len);
      //println(p1.x + " " + p1.y);
      //if (len > 0) {
      //strands.add(new Strand(p1, p2, len));
      makeSpring(p1, p2);

      //}
      //else {
      //physics.removeParticle(p2);
      //}
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



    for (int i=0; i<rayPoints.size(); i++)
    {
      VerletParticle2D p1 = (VerletParticle2D)rayPoints.get(i);
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

    this.rayPoints.add(p);

    stroke(0, 0, 255);
    noFill();

    //println(myOrder + " --> " + rayPoints);
  }
}

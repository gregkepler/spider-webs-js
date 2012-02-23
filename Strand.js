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

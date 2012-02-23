function Point(xPos, yPos){
    this.x = xPos;
    this.y = yPos;
}

$(function(){
    var canvas, context, width, height, pointNum, radius, anchors = [], stageCenter, webCenter, rays = [], avgRadius, spacingNoise, barPointAmt, strands = [], strandNoise;
    
    canvas = $("#canvas")[0];
    context = canvas.getContext("2d");
    
    width = canvas.width;
    height = canvas.height;
    stageCenter = new Point(width/2, height/2);
    
    
    
    // draw web
    
    // init physics
    function init()
    {
        console.log("init");
        strands = [];
        rays = [];
        pointNum = Math.random() * 6 + 4;
        spacingNoise = Math.random() * 10;
        barPointAmt = Math.round(Math.random() * 10 + 10);
        strandNoise = Math.random(100);
        
        placeAnchorPoints();
        //draw perimeter lines
        //add all the strands
    }
    
    
    function placeAnchorPoints(){
        
        var i, anchorPoints = [], angleDif = Math.PI*2/pointNum, maxX = 0, minX = width, maxY = 0, minY = height, radiusSum = 0, angle, pX, pY, p, r;
        
        for (i=0; i<pointNum; i += 1) {
            angle = (i * angleDif);
            r = Math.random(radius*0.5, radius*1.5);
            radiusSum += r;
            pX = stageCenter.x + Math.cos(angle) * r;
            pY = stageCenter.y + Math.sin(angle) * r;
            
            p = new Point(pX, pY);
            //VerletParticle2D p = addParticle(pX, pY);
            maxX = (pX > maxX) ? pX : maxX;
            minX = (pX < minX) ? pX : minX;
            maxY = (pY > maxY) ? pY : maxY;
            minY = (pY < minY) ? pY : minY;
            //anchorPoints.add(p);
            
            //stroke(255, 50);
            //ellipse(p.x, p.y, 10, 10);
      
            //fill(255);
            //noStroke();
            fillStyle = "#ffffff";
            context.beginPath();
            this.context.arc(p.x, p.y, 3, 0, Math.PI * 2, false);
            this.context.fill();
            
            console.log("place points" + String(i));
        }
    }
    
    
    init();
});





/*
// Size of canvas
var CANVAS_WIDTH = 400;
var CANVAS_HEIGHT = 400;

// Size of grid
var GRID_SIZE = 10;

// Physics constants
var PHYS_GRAVITY = 0.1;
var PHYS_DRAG = 0.01;
var SPRING_STRENGTH = 0.2;
var SPRING_DAMPING = 0.1;

// Pause between frames of animation
var FRAME_DELAY = 10;

// Globals
var physics; // ParticleSystem
var particles; // array of Particles
var canvas; // HTML5 canvas element
var ctx; // 2d drawing context of canvas element
var mouseX = null; // last user x mouse coordinate
var mouseY = null; // last user y mouse coordinate
var movingParticle = null; // reference to particle user is currently dragging









// Init
function init() {

	// Init canvas
	canvas = document.getElementById('canvas');
	canvas.style.height = CANVAS_HEIGHT + 'px';
	canvas.style.width = CANVAS_WIDTH + 'px';
	ctx = canvas.getContext('2d');
	ctx.fillStyle = 'black';

	// Start tracking mouse coords on mousedown
	canvas.onmousedown = function(e) {
		movingParticle = e.shiftKey ? particles[0][0] : particles[0][GRID_SIZE - 1];
		mouseX = e.clientX;
		mouseY = e.clientY;
		canvas.onmousemove(e);
	}

	// Stop tracking mouse coords on mouseup
	canvas.onmouseup = function(e) {
		mouseX = null;
		mouseY = null;
	}

	// Continue tracking mouse coords if mouse is down
	canvas.onmousemove = function(e) {
		if (mouseX === null || mouseY === null) {
			return;
		}
		mouseX = e.clientX;
		mouseY = e.clientY;
		mouseX -= canvas.offsetLeft;
		mouseY -= canvas.offsetTop;
		movingParticle.position.set(mouseX, mouseY, 0);
		movingParticle.velocity.clear();
	}

	// Init particle system
	physics = new ParticleSystem(PHYS_GRAVITY, PHYS_DRAG);

	// Init grid of particles
	particles = new Array(GRID_SIZE);
	for (var i = 0; i < particles.length; i++) particles[i] = new Array(GRID_SIZE);
	var gridStepX = ((CANVAS_WIDTH / 2) / GRID_SIZE);
	var gridStepY = ((CANVAS_HEIGHT / 2) / GRID_SIZE);

	// Make particles
	for (var i = 0; i < GRID_SIZE; i++) {
		for (var j = 0; j < GRID_SIZE; j++) {
			particles[i][j] = physics.makeParticle(0.2, j * gridStepX + (CANVAS_WIDTH / 4), i * gridStepY + 20, 0.0);
			if (j > 0) {
				physics.makeSpring(particles[i][j - 1], particles[i][j], SPRING_STRENGTH, SPRING_DAMPING, gridStepX);
			}
		}
	}

	// Make springs between particles
	for (var j = 0; j < GRID_SIZE; j++) {
		for (var i = 1; i < GRID_SIZE; i++) {
			physics.makeSpring(particles[i - 1][j], particles[i][j], SPRING_STRENGTH, SPRING_DAMPING, gridStepY);
		}
	}


	// Make the top left and top right particles fixed (not affected by forces)
	particles[0][0].makeFixed();
	particles[0][GRID_SIZE - 1].makeFixed();

	// Begin rendering
	setInterval(draw, FRAME_DELAY);

}

function draw() {

	// Evaluate physics
	physics.tick();

	// Clear canvas frame
	ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

	// Draw lines between all particles
	for (var i = 0; i < GRID_SIZE; i++) {
		ctx.beginPath();
		ctx.moveTo(particles[i][0].position.x, particles[i][0].position.y);
    	ctx.lineTo(particles[i][0].position.x, particles[i][0].position.y);
		for (var j = 0; j < GRID_SIZE; j++) {
			ctx.lineTo(particles[i][j].position.x, particles[i][j].position.y);
		}
		ctx.lineTo(particles[i][GRID_SIZE - 1].position.x, particles[i][GRID_SIZE - 1].position.y);
		ctx.stroke();
  	}
	for (var j = 0; j < GRID_SIZE; j++) {
		ctx.beginPath();
		ctx.moveTo(particles[0][j].position.x, particles[0][j].position.y);
		ctx.lineTo(particles[0][j].position.x, particles[0][j].position.y);
		for (var i = 0; i < GRID_SIZE; i++) {
			ctx.lineTo(particles[i][j].position.x, particles[i][j].position.y);
		}
		ctx.lineTo(particles[GRID_SIZE - 1][j].position.x, particles[GRID_SIZE - 1][j].position.y);
		ctx.stroke();
	}
}*/
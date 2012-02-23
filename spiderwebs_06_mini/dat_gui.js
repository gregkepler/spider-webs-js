function guiInit()
{
    var stats, statsInterval, container;
    
    
    // create container
    container = document.getElementById('controls');
    //document.body.appendChild(container);
    
    
    function loop()
    {
        stats.tick();
    }
	
    //document.getElementById('controls').appendChild( stats.getDisplayElement() ); // container is a DOM Element
    statsInterval = setInterval(loop, 1000/60);
    
    // stats
    stats = new Stats();
    stats.getDisplayElement().style.position = 'absolute';
    stats.getDisplayElement().style.top = '330px';
    console.log(stats.getDisplayElement());
    container.appendChild(stats.getDisplayElement());
   
    
    
    
    this.randomize = function(){
        pointNum = Math.round(getRandom(3, 12));
        barPointAmt = Math.round(getRandom(5, 20));
        webGravity = getRandom(0.0, 1.0);
        particleWeight = getRandom(.01, 1);
        radiusBase = Math.round(getRandom(50, 250));
        defSprStrength = getRandom(0.1, 2.0);
        raySpacing = getRandom(25, 80);
        strandResolution = Math.round(getRandom(10, 300));
        for (var i in gui.__controllers) {
            gui.__controllers[i].updateDisplay();
        }
        pjs.redrawWeb();
    };
    
    
    this.updateWeb = function(){
        pjs.redrawWeb();
    };
    
    var gui = new dat.GUI({autoplace:false});
    
    gui.width = 300;
    gui.add(this, 'pointNum', 3, 12).step(1).name("Anchor Points");
    gui.add(this, 'barPointAmt', 5, 20).step(1).name("Bar Points");
    gui.add(this, 'radiusBase', 50, 250).name("Base Radius");
    gui.add(this, 'raySpacing', 25, 80).name("Ray Spacing");
    gui.add(this, 'particleWeight', .01, 1).name("Particle Weight");
    gui.add(this, 'defSprStrength', .1, 2).name("Spring Strength");
    gui.add(this, 'strandResolution', 10, 300).name("Strand Resolution");
    gui.add(this, 'webGravity', 0.0, 1).name("Gravity");
    gui.add(this, 'animateWeb').name("Animate Web");
    gui.add(this, 'updateWeb').name("Redraw Web");
    gui.add(this, 'randomize').name("Randomize Web");
    
    
    
    
    gui.domElement.style.position = "absolute";
    gui.domElement.style.top = "10px";
    gui.domElement.style.overflow = "hidden";
    container.appendChild(gui.domElement);
     
}



function getRandom(num1, num2){
    if(num2 < num1){
        var numB = num1;
        var numA = num2;
    }else{
        var numB = num2;
        var numA = num1;
    }
    var randNum = Math.random() * (numB - numA) + numA;
    return randNum;
}
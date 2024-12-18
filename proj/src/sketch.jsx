const sketch = (p) => {
  let smoothedMouseX = 0;
  let smoothedMouseY = 0;

  let currentBrushSize = 30;
  let currentColor;
  let currentOvalness = 1;
  let currentRotation = 0;
  let dripsEnabled = true;
  let currentMode = "spray";

  let bgLayer;
  let drawLayer;
  let overlayLayer;
  let uiLayer;

  let backgroundImg;
  let overlayImage;
  let historyStack = [];
  const maxHistory = 35;
  const targetFrameRate = 60;
  let smoothFactor = 0.18;

  let minDripLength = 40;
  let maxDripLength = 250;
  let maxDripSpeed = 0.9;
  let drips = [];
  let previousMouseX;
  let previousMouseY;

  // Triggers to handle undo/clear
  let lastUndoCounter = 0;
  let lastClearCounter = 0;

  
  let eggs = [];


  p.preload = () => {
    // If billboardImage is set, load it
    if (p.props && p.props.billboardImage) {
      backgroundImg = p.loadImage(p.props.billboardImage);
    }
  };

  p.setup = () => {
    if (!backgroundImg) {
      // default if no image loaded
      p.createCanvas(1300, 950);
      p.background(250);
    } else {
      const canvasWidth = backgroundImg.width;
      const canvasHeight = backgroundImg.height;
      p.createCanvas(canvasWidth, canvasHeight);
      p.background(250);
    }
    p.noCursor();

    bgLayer = p.createGraphics(p.width, p.height);
    bgLayer.clear();
    drawLayer = p.createGraphics(p.width, p.height);
    drawLayer.clear();
    overlayLayer = p.createGraphics(p.width, p.height);
    overlayLayer.clear()
    uiLayer = p.createGraphics(p.width, p.height);
    uiLayer.clear();

    if (backgroundImg) {
      bgLayer.image(backgroundImg, 0, 0, p.width, p.height);
    } else {
      bgLayer.background(250);
    }

    p.frameRate(targetFrameRate);
    currentColor = p.color(0, 0, 0);

    saveCurrentStateToHistory();
  };
  p.mouseClicked= () =>  {
    if (currentMode === 'egg')
    {
      if (p.mouseY < p.height && p.mouseY > 0 && p.mouseX > 0 && p.mouseX < p.width) {
      throwEgg(p.mouseX, p.mouseY)
      }
    }
  }
  p.draw = () => {
    previousMouseX = p.mouseX;
    previousMouseY = p.mouseY;

    smoothedMouseX = p.lerp(smoothedMouseX, p.mouseX, smoothFactor);
    smoothedMouseY = p.lerp(smoothedMouseY, p.mouseY, smoothFactor);

    if (p.mouseY < p.height && p.mouseY > 0 && p.mouseX > 0 && p.mouseX < p.width) {
      if (currentMode === "spray") {
        updateSprayUI(p);
      } else if (currentMode === "marker") {
        updateMarkerUI(p);
      } else if (currentMode === "egg") {
        updateEggUI();
      }
    } else  {
      uiLayer.clear()
    }

    // currentBrushSize = p.map(p.mouseY, p.height, 0, -40, 100)

    p.image(bgLayer, 0, 0);
    p.image(drawLayer, 0, 0);
    p.image(overlayLayer, 0, 0);
    p.image(uiLayer, 0, 0);

    if (p.mouseIsPressed) {
      if (p.mouseY < p.height && p.mouseY > 0 && p.mouseX > 0 && p.mouseX < p.width) {
        if (currentMode === "spray") {
          emitSpray(p);
        } else if (currentMode === "marker") {
          emitMarker(p);
          handleDrips(p);
        } 
      }
    }
    p.mouseC

    if (drips.length > 0) {
      updateDrips(p);
    }

    if (eggs.length > 0) {
      for (let i = eggs.length - 1; i >= 0; i--) {
        eggs[i].update();
        // Check if the egg has completed its animation
        if (eggs[i].slideComplete) {
          saveCurrentStateToHistory(); // Save state after the egg has finished
          eggs.splice(i, 1); // Remove the egg from the array
        }
      }
    }

  };

  p.keyPressed = () => {
    if (p.key === "z" || p.key === "Z") {
      undoLastAction();
    }
    if (p.key === "c" || p.key === "C") {
      clearCanvas();
    }
  };

  p.touchEnded = () => {
    if (p.mouseY < p.height && p.mouseY > 0 && p.mouseX > 0 && p.mouseX < p.width && currentMode != 'egg') {
      saveCurrentStateToHistory();
    }
  };

  p.mouseDragged = () => {
    if (p.mouseY < p.height && p.mouseY > 0 && p.mouseX > 0 && p.mouseX < p.width) {
      if (currentMode === "spray") {
        emitSpray(p);
      } else if (currentMode === "marker") {
        emitMarker(p);
      }
    }
  };
  
  p.mouseReleased = () =>  {
    if (p.mouseY < p.height && p.mouseY > 0 && p.mouseX > 0 && p.mouseX < p.width) {
      if (currentMode === 'spray' || currentMode === 'marker') {
        saveCurrentStateToHistory()
      }
    }
  }
  
  p.mouseWheel = (event) => {
    let increment = 4;
    if (event.delta > 0) {
      currentBrushSize = p.max(currentBrushSize - increment, 2);
    } else {
      currentBrushSize = p.min(currentBrushSize + increment, 100);
    }
    return false;
  };

  p.updateWithProps = (props) => {

    if (props.undoCounter !== undefined && props.undoCounter !== lastUndoCounter) {
      lastUndoCounter = props.undoCounter;
      undoLastAction();
      return
    }

    if (props.billboardImage && props.billboardImage !== p.props?.billboardImage) {
      backgroundImg = p.loadImage(props.billboardImage, () => {
        bgLayer.clear();
        bgLayer.image(backgroundImg, 0, 0, p.width, p.height);
      });
      let overlayPath =
        props.billboardImage.substring(0, props.billboardImage.length - 4) +
        "Over.png";
      console.log(overlayPath);
      overlayImage = p.loadImage(overlayPath, () => {
        overlayLayer.clear();
        overlayLayer.image(overlayImage, 0, 0, p.width, p.height);
      });
    }

    if (props.brushSize !== undefined)
      currentBrushSize = p.constrain(props.brushSize, 2, 100);
    if (props.color !== undefined) currentColor = p.color(props.color);
    if (
      props.mode !== undefined &&
      (props.mode === "spray" || props.mode === "marker" || props.mode === "egg")
    )
      currentMode = props.mode;
    if (props.ovalness !== undefined) currentOvalness = props.ovalness;
    if (props.rotation !== undefined) currentRotation = props.rotation;
    if (props.dripsEnabled !== undefined) dripsEnabled = props.dripsEnabled;

    // Check undo trigger
    

    // Check clear trigger
    if (props.clearCounter !== undefined && props.clearCounter !== lastClearCounter) {
      lastClearCounter = props.clearCounter;
      clearCanvas();
    }
  };


  function saveCurrentStateToHistory() {
    if (historyStack.length >= maxHistory) {
      historyStack.shift();
    }
    historyStack.push(drawLayer.get());
  }

  function clearCanvas() {
    if (historyStack.length > 0) {
      historyStack = [historyStack[0]];
    }
    drips = [];
    if (drawLayer) {
      drawLayer.clear();
    }
  }

  function undoLastAction() {
    if (historyStack.length > 1) {
      drips = [];
      historyStack.pop();
      let previousState = historyStack[historyStack.length - 1];
      drawLayer.clear();
      drawLayer.image(previousState, 0, 0);
    }
  }

  function updateSprayUI(p) {
    
    uiLayer.clear();
    uiLayer.blendMode(p.LIGHTEST);
    uiLayer.noFill();
    uiLayer.stroke(255);
    uiLayer.strokeWeight(3);
    uiLayer.circle(p.mouseX, p.mouseY, currentBrushSize * 2);

    uiLayer.blendMode(p.DARKEST);
    uiLayer.noFill();
    uiLayer.stroke(0);
    uiLayer.strokeWeight(2);
    uiLayer.circle(p.mouseX, p.mouseY, currentBrushSize * 2);

    uiLayer.blendMode(p.BLEND);

    uiLayer.push();
    uiLayer.translate(p.mouseX + 40, p.mouseY + 45);
    uiLayer.rotate(-p.PI / 10);
    uiLayer.scale(0.5);
    sprayCan(p, 0, 0, currentColor);
    uiLayer.pop();
  }

  function updateMarkerUI(p) {
    uiLayer.clear();
    uiLayer.blendMode(p.LIGHTEST);
    uiLayer.push();
    uiLayer.translate(p.mouseX, p.mouseY);
    uiLayer.rotate(currentRotation);
    uiLayer.noFill();
    uiLayer.stroke(0);
    uiLayer.strokeWeight(3);
    uiLayer.stroke(255)
    uiLayer.ellipse(
      0,
      0,
      currentBrushSize * currentOvalness,
      currentBrushSize
    );
    uiLayer.pop();

    uiLayer.blendMode(p.DARKEST);
    uiLayer.push();
    uiLayer.translate(p.mouseX, p.mouseY);
    uiLayer.rotate(currentRotation);
    uiLayer.noFill();
    uiLayer.stroke(0);
    uiLayer.strokeWeight(2);
    uiLayer.ellipse(
      0,
      0,
      currentBrushSize * currentOvalness,
      currentBrushSize
    );
    uiLayer.pop();

    uiLayer.blendMode(p.BLEND);
    uiLayer.push();
    if (p.mouseIsPressed) {
      uiLayer.translate(p.mouseX, p.mouseY);
    } else {
      uiLayer.translate(p.mouseX + 10, p.mouseY - 10);
    }

    uiLayer.rotate(p.PI / 6);
    uiLayer.scale(1);
    marker(p, 0, 0, currentColor);
    uiLayer.pop();
  }

  function updateEggUI() {
    uiLayer.clear();
    // Optionally, add UI elements specific to egg mode
    // For example, an egg icon or indicator
    uiLayer.push();
    uiLayer.translate(p.mouseX, p.mouseY);
    eggIcon();
    uiLayer.pop();
  }

  function handleDrips(p) {
    if (dripsEnabled) {
      if (p.frameCount % 15 === 0 || p.frameCount % 40 === 0) {
        drips.push(
          new Drip(
            p.mouseX,
            p.mouseY,
            currentColor,
            p.min(currentBrushSize / 2, 5)
          )
        );
      }
    }
  }

  function emitSpray(p) {
    let size = currentBrushSize;
    let density = p.floor((size / 100) * 650);
    let currentCol = currentColor;

    drawLowOpacityFill(p, currentCol, smoothedMouseX, smoothedMouseY, size);
    innerCircle(p, size, density, currentCol, smoothedMouseX, smoothedMouseY);
    outerCircle(p, size, density, currentCol, smoothedMouseX, smoothedMouseY);
  }
  
  function throwEgg(targetX, targetY) {
    let startX = p.width / 2;
    let startY = p.height + 300; // Adjust as needed
    let newEgg = new Egg(startX, startY, targetX, targetY);
    eggs.push(newEgg)
  }

  function emitMarker(p) {
    let tmpMarkerLayer = p.createGraphics(p.width, p.height);
    tmpMarkerLayer.clear();
    let size = currentBrushSize;
    let ovalness = currentOvalness;
    let angle = currentRotation;
    let currentCol = currentColor;

    let dx = p.mouseX - (previousMouseX || p.mouseX);
    let dy = p.mouseY - (previousMouseY || p.mouseY);
    let distance = p.sqrt(dx * dx + dy * dy);
    let steps = p.max(1, p.int(distance / 2));

    for (let i = 0; i < steps; i++) {
      let t = i / steps;
      let x = p.lerp(previousMouseX || p.mouseX, p.mouseX, t);
      let y = p.lerp(previousMouseY || p.mouseY, p.mouseY, t);

      tmpMarkerLayer.push();
      tmpMarkerLayer.translate(x, y);
      tmpMarkerLayer.rotate(angle);
      tmpMarkerLayer.noStroke();
      tmpMarkerLayer.fill(currentCol);
      tmpMarkerLayer.ellipse(0, 0, size * ovalness, size);
      tmpMarkerLayer.pop();
    }

    drawLayer.image(tmpMarkerLayer, 0, 0);
    tmpMarkerLayer.remove();
  }

  function drawLowOpacityFill(p, currentCol, x, y, size) {
    for (let i = 1; i < 2.5; i += 0.5) {
      drawLayer.noStroke();
      drawLayer.fill(
        p.red(currentCol),
        p.green(currentCol),
        p.blue(currentCol),
        3
      );
      drawLayer.circle(x, y, size * i);
    }
  }

  function innerCircle(p, size, density, currentCol, posX, posY) {
    for (let i = 0; i < density; i++) {
      let angle = p.random(p.TWO_PI);
      let radius = p.abs(p.randomGaussian(0, size * 0.5));
      if (radius > size * 0.9) continue;

      let x = posX + p.cos(angle) * radius;
      let y = posY + p.sin(angle) * radius;

      if (x < 0 || x > p.width || y < 0 || y > p.height) continue;

      drawLayer.noStroke();
      drawLayer.fill(p.red(currentCol), p.green(currentCol), p.blue(currentCol), 255);
      let dropSize = p.random(1, 2);
      drawLayer.ellipse(x, y, dropSize, dropSize);
    }
  }

  function outerCircle(p, size, density, currentCol, posX, posY) {
    for (let i = 0; i < density; i++) {
      let angle = p.random(p.TWO_PI);
      let radius = p.randomGaussian(size, size / 10);
      if (radius < size * 0.9 || radius > size * 1.2) continue;

      let x = posX + p.cos(angle) * radius;
      let y = posY + p.sin(angle) * radius;

      if (x < 0 || x > p.width || y < 0 || y > p.height) continue;

      drawLayer.noStroke();
      drawLayer.fill(p.red(currentCol), p.green(currentCol), p.blue(currentCol), 255);
      let dropSize = p.random(1, 2);
      drawLayer.ellipse(x, y, dropSize, dropSize);
    }
  }

  function updateDrips() {
    for (let i = drips.length - 1; i >= 0; i--) {
      let d = drips[i];
      d.update();
      if (d.currLen >= d.maxLen) {
        drips.splice(i, 1);
      }
    }

    for (let i = 0; i < drips.length; i++) {
      drips[i].show(drawLayer);
    }
  }
  // Egg Class Definition
  class Egg {
    constructor(startX, startY, targetX, targetY) {
      // Flight Parameters
      this.startX = startX;
      this.startY = startY;
      this.targetX = targetX;
      this.targetY = targetY;
  
      this.x = startX;
      this.y = startY;
  
      this.hasHit = false;
  
      this.flightFrames = 60; // Number of frames for the flight
      this.frameCount = 0;
  
      // Scaling Parameters
      this.startScale = 5;
      this.endScale = 0.7;
      this.currentScale = this.startScale;
  
      // Rotation Parameters
      this.rotation = 0; // Current rotation angle
      this.rotationSpeed = 0.1; // Rotation increment per frame
  
      // Splash Parameters
      this.whitePoints = [];
      this.yolk = { x: targetX, y: targetY, size: p.random(30, 50) };
      this.noiseOffset = p.random(1000); // For Perlin noise variation
      this.yolkSlideOffset = 0; // Initial slide offset
      this.yolkSlideSpeed = p.random(0.1, 0.6); // Slide speed per frame
      this.maxYolkSlideOffset = p.random(6, 12); // Maximum slide offset
      this.slideComplete = false; // Flag to indicate if sliding is complete
  
      // **Color Variation Properties**
      // Generate a random light color for the egg shell
      this.eggColor = p.color(
        p.random(220, 255), // Red component
        p.random(220, 255), // Green component
        p.random(220, 255)  // Blue component
      );
  
      // Generate a random vibrant color for the yolk
      this.yolkColor = p.color(
        p.random(200, 255), // Red component
        p.random(150, 200), // Green component
        0                    // Blue component (yolk typically lacks blue)
      );
    }
  
    update() {
      if (!this.hasHit) {
        this.frameCount++;
  
        // Calculate progress from 0 to 1
        let t = this.frameCount / this.flightFrames;
        if (t > 1) t = 1; // Clamp to 1
  
        // Interpolate position
        this.x = p.lerp(this.startX, this.targetX, t);
        this.y = p.lerp(this.startY, this.targetY, t);
  
        // Interpolate scale
        this.currentScale = p.lerp(this.startScale, this.endScale, t);
  
        // Update rotation
        this.rotation += this.rotationSpeed;
        if (t < 1) {
          this.flight();
        }
        // Check if the egg has reached the target
        if (t === 1) {
          this.hasHit = true;
          this.generateSplash();
          this.displaySplash();
        }
      } else {
        // Animate the yolk sliding down after the splash
        if (this.yolkSlideOffset < this.maxYolkSlideOffset && !this.slideComplete) {
          this.yolkSlideOffset += this.yolkSlideSpeed;
          this.displaySplash();
          if (this.yolkSlideOffset >= this.maxYolkSlideOffset) {
            this.slideComplete = true; // Mark as complete
          }
        }
      }
    }
  
    flight() {
      // Display the flying egg with variable color
      p.push();
      p.translate(this.x, this.y);
      p.rotate(this.rotation);
      p.scale(this.currentScale);
      p.fill(this.eggColor); // Use the random egg color
      p.stroke(0);
      p.strokeWeight(0.5);
      p.ellipse(0, 0, 100, 140); // Egg shape
      p.pop();
    }
  
    // Method to generate splash points with smooth, rounded edges
    generateSplash() {
      let numPoints = 15; // Number of points for smoother edges
      let baseRadius = p.random(35, 55); // Base radius for the splash
      let noiseScale = 0.5; // Scale for noise variation
  
      for (let i = 0; i < numPoints; i++) {
        let angle = p.TWO_PI * (i / numPoints);
        // Use Perlin noise for smooth radius variation
        let noiseValue = p.noise(this.noiseOffset + i * noiseScale);
        let r = baseRadius + p.map(noiseValue, 0, 1, -15, 15);
        let sx = this.targetX + r * p.cos(angle);
        let sy = this.targetY + r * p.sin(angle);
        this.whitePoints.push(p.createVector(sx, sy));
      }
    }
  
    // Method to display the splash with sliding yolk
    displaySplash() {
      // Draw the white splash with smooth curves
      drawLayer.fill(255, 11); // Semi-transparent white
      drawLayer.noStroke();
      drawLayer.beginShape();
      // To make the shape smooth, use curveVertex and add extra points
      // at the beginning and end
      drawLayer.curveVertex(
        this.whitePoints[this.whitePoints.length - 2].x,
        this.whitePoints[this.whitePoints.length - 2].y
      );
      for (let v of this.whitePoints) {
        drawLayer.curveVertex(v.x, v.y);
      }
      // Repeat the first two points to close the shape smoothly
      drawLayer.curveVertex(this.whitePoints[0].x, this.whitePoints[0].y);
      drawLayer.curveVertex(this.whitePoints[1].x, this.whitePoints[1].y);
      drawLayer.endShape(p.CLOSE);
  
      // Draw the yolk sliding down with variable color
      drawLayer.fill(this.yolkColor); // Use the random yolk color
      drawLayer.noStroke();
      drawLayer.ellipse(
        this.yolk.x,
        this.yolk.y + this.yolkSlideOffset,
        this.yolk.size,
        this.yolk.size
      );
    }
  }
  
  
  class Drip {
    constructor(x, y, col, size) {
      this.x = x;
      this.y = y;
      this.maxLen = p.random(minDripLength, maxDripLength);
      this.currLen = 0;
      this.col = col;
      this.size = size;
      this.off = 0;
      this.speed = p.random(0.1, maxDripSpeed);
    }

    update() {
      this.currLen += this.speed;
      if (this.currLen < this.maxLen) {
        if (p.frameCount % 50 === 0 || p.frameCount % 70 === 0) {
          this.off += p.random(-1, 1);
        }
      }
    }

    show(pg) {
      if (this.currLen < this.maxLen) {
        pg.noStroke();
        pg.fill(this.col.levels[0], this.col.levels[1], this.col.levels[2], 180);
        pg.ellipse(this.x + this.off, this.y + this.currLen, this.size, this.size);
      }
    }
  }

  function sprayCan(p, x, y, color) {
    uiLayer.rectMode(p.CENTER);
    uiLayer.stroke(0);
    uiLayer.strokeWeight(0.8);
    uiLayer.fill(220);
    uiLayer.rect(x, y - 50, 25, 20, 2);

    uiLayer.fill(50);
    uiLayer.rect(x, y + 115, 120, 230, 10);

    uiLayer.fill(color);
    uiLayer.arc(x, y, 110, 80, p.PI, 0, p.CHORD);

    uiLayer.fill(100);
    uiLayer.rect(x, y + 230, 125, 10, 5);

    uiLayer.fill(100);
    uiLayer.rect(x, y, 125, 10, 5);

    uiLayer.fill(170);
    uiLayer.rect(x, y - 38, 50, 5, 15);
  }

  function marker(p, x, y, color) {
    uiLayer.rectMode(p.CENTER);
    uiLayer.stroke(0.5)
    uiLayer.fill(color);
    uiLayer.rect(x, y - 5, 15, 15, 2);
    uiLayer.rect(x, y - 80, 30, 98, 4);
    uiLayer.noStroke();
    uiLayer.fill(33);
    uiLayer.rect(x, y - 38, 32, 15, 2);
    uiLayer.rect(x, y - 25, 28, 15, 2);
    uiLayer.rect(x, y - 15, 20, 15, 1);
  }
  
  function eggIcon() {
    // Simple egg icon for UI indication
    // uiLayer.fill(255);
    // uiLayer.stroke(0);
    // uiLayer.strokeWeight(2);
    // uiLayer.ellipse(0, 0, 40, 50); // Egg shape
    // uiLayer.fill(255, 204, 0);
    // uiLayer.ellipse(0, 0, 20, 20); // Yolk

    uiLayer.noFill();
    uiLayer.stroke(0);
    uiLayer.strokeWeight(1);
    uiLayer.line(-20, 0, 20, 0)
    uiLayer.line(0, -20, 0, 20)
    uiLayer.circle(0,0, 30)

  }
}

export default sketch;

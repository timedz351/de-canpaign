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
  const maxHistory = 20;
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

  p.preload = () => {
    // If billboardImage is set, load it
    if (p.props && p.props.billboardImage) {
      backgroundImg = p.loadImage(p.props.billboardImage);
    }
  };

  p.setup = () => {
    if (!backgroundImg) {
      // default if no image loaded
      p.createCanvas(1600, 1100);
      p.background(250);
    } else {
      const canvasWidth = backgroundImg.height;
      const canvasHeight = backgroundImg.width;
      p.createCanvas(canvasWidth, canvasHeight);
      p.background(250);
    }

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

  p.draw = () => {
    previousMouseX = p.mouseX;
    previousMouseY = p.mouseY;

    smoothedMouseX = p.lerp(smoothedMouseX, p.mouseX, smoothFactor);
    smoothedMouseY = p.lerp(smoothedMouseY, p.mouseY, smoothFactor);

    if (currentMode === "spray") {
      updateSprayUI(p);
    } else if (currentMode === "marker") {
      updateMarkerUI(p);
    }

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

    if (drips.length > 0) {
      updateDrips(p);
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

  p.mouseReleased = () => {
    if (p.mouseY < p.height && p.mouseY > 0 && p.mouseX > 0 && p.mouseX < p.width) {
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
    if (props.billboardImage && props.billboardImage !== p.props?.billboardImage) {
      console.log(props.billboardImage)
      backgroundImg = p.loadImage(props.billboardImage, () => {
        bgLayer.clear();
        bgLayer.image(backgroundImg, 0, 0, p.width, p.height);
      });
      let overlayPath = props.billboardImage.substring(0, props.billboardImage.length - 4) + 'Over.png'
      console.log(overlayPath)
      overlayImage = p.loadImage(overlayPath, () => {
        overlayLayer.clear();
        overlayLayer.image(overlayImage, 0, 0, p.width, p.height);
      });
      
    }

    if (props.brushSize !== undefined) currentBrushSize = p.constrain(props.brushSize, 2, 100);
    if (props.color !== undefined) currentColor = p.color(props.color);
    if (props.mode !== undefined && (props.mode === 'spray' || props.mode === 'marker')) currentMode = props.mode;
    if (props.ovalness !== undefined) currentOvalness = props.ovalness;
    if (props.rotation !== undefined) currentRotation = props.rotation;
    if (props.dripsEnabled !== undefined) dripsEnabled = props.dripsEnabled;

    // Check undo trigger
    if (props.undoCounter !== undefined && props.undoCounter !== lastUndoCounter) {
      lastUndoCounter = props.undoCounter;
      undoLastAction();
    }

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

  function updateDrips(p) {
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
    uiLayer.noStroke();
    uiLayer.fill(color);
    uiLayer.rect(x, y - 5, 15, 15, 2);
    uiLayer.rect(x, y - 80, 30, 98, 4);
    uiLayer.fill(33);
    uiLayer.rect(x, y - 38, 32, 15, 2);
    uiLayer.rect(x, y - 25, 28, 15, 2);
    uiLayer.rect(x, y - 15, 20, 15, 1);
  }
};

export default sketch;

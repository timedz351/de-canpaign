
const sketch = (p) => {
  // ============================
  // Global Variables
  // ============================

  let smoothedMouseX = 0;
  let smoothedMouseY = 0;
  // Sounds
  let spraySound;
  let shakeSound;

  // UI Elements
  let commonControls;
  let sprayControls;
  let markerControls;
  let sizeSlider;
  let colorPickerElement;
  let ovalnessSlider;
  let rotationSlider;
  let dripCheckbox;
  let modeButton;
  let modeIndicator;
  let brushIndicatorGraphics;
  let brushIndicatorImg;

  // Graphics Layers
  let bgLayer;
  let drawLayer;
  let uiLayer;

  // Background Image
  let backgroundImg;

  // Buttons
  let clearButton;
  let undoButton;

  // Undo History
  let historyStack = [];
  const maxHistory = 20;

  // Frame Rate Control
  const targetFrameRate = 60;
  let smoothFactor = 0.18;

  // Shake Detection Variables
  let mouseYHistory = [];
  const shakeThreshold = 6;
  const shakeTimeWindow = 1000;
  let lastShakeTime = 0;
  const shakeCooldown = 500;
  let isShaking = false;
  let shakingTimer = 0;
  const shakingDuration = 500;

  // Mode Management
  let currentMode = "spray"; // 'spray' or 'marker'

  // Marker Specific Variables
  let minDripLength = 40;
  let maxDripLength = 250;
  let maxDripSpeed = 0.9;


  let drips = [];
  let previousMouseX;
  let previousMouseY;

  // ============================
  // Preload Function
  // ============================
  p.preload = () => {
    // spraySound = p.loadSound('/src/assets/spray.mp3');
    // shakeSound = p.loadSound('/src/assets/shake.mp3');
    backgroundImg = p.loadImage('/src/assets/pele.jpg');
  };

  // ============================
  // Setup Function
  // ============================
  p.setup = () => {
    p.createCanvas(p.windowWidth, 900);
    p.background(250); // Light gray background

    // Initialize Graphics Layers
    bgLayer = p.createGraphics(p.width, p.height);
    bgLayer.background(250);
    drawLayer = p.createGraphics(p.width, p.height);
    drawLayer.clear();
    uiLayer = p.createGraphics(p.width, p.height);
    uiLayer.clear();

    // Load Default Background Image
    bgLayer.image(backgroundImg, 0, 0, p.width, p.height); // Fit to canvas

    p.frameRate(targetFrameRate);

    // Set Initial Volume Levels
    if (spraySound) {
      spraySound.setVolume(0.5); // 50% volume
    }
    if (shakeSound) {
      shakeSound.setVolume(0.5); // 50% volume
    }

    // Save initial state to history stack
    saveCurrentStateToHistory();

    // Initialize UI Elements
    initializeUI(p);
  };

  // ============================
  // Draw Function
  // ============================
  p.draw = () => {
    previousMouseX = p.mouseX;
    previousMouseY = p.mouseY;
    // Smooth Mouse Positions

    smoothedMouseX = p.lerp(smoothedMouseX, p.mouseX, smoothFactor);
    smoothedMouseY = p.lerp(smoothedMouseY, p.mouseY, smoothFactor);

    // Display Crosshair or Brush Indicator
    if (currentMode === "spray") {
      updateSprayUI(p);
      // updateMouseYHistory(p);
    } else if (currentMode === "marker") {
      if (p.mouseIsPressed) updateMarkerUI(p);
    }

    // Draw Graphics Layers
    p.image(bgLayer, 0, 0);
    p.image(drawLayer, 0, 0);
    p.image(uiLayer, 0, 0);

    // Emit Spray or Marker based on Mode and Mouse Press
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

    // Update Drips
    if (drips.length > 0) {
      updateDrips(p);
    }

    // Detect Shake Gesture
    // detectShake(p);

    // Manage Shake Sound
    // manageShakeSound(p);
  };

  // ============================
  // UI Initialization and Management
  // ============================

  // Initialize UI Elements using p5.js DOM
  function initializeUI(p) {
    // p5.js DOM elements can conflict with React's DOM management.
    // It's recommended to handle UI with React when possible.
    // However, for simplicity, we'll proceed with p5.js DOM elements here.

    // Main container for all controls
    commonControls = p.createDiv();
    commonControls.id("commonControls");
    commonControls.style("display", "flex");
    commonControls.style("flex-direction", "column");
    commonControls.style("gap", "10px");
    commonControls.style("align-items", "flex-start");
    commonControls.style("padding", "30px");
    commonControls.style("background", "#ffffff");
    commonControls.style("margin-top", "20px");
    commonControls.style("border-radius", "8px");
    commonControls.style("box-shadow", "0 2px 5px rgba(0,0,0,0.1)");

    // Row for Undo and Clear
    let undoClearRow = p.createDiv();
    undoClearRow.parent(commonControls);
    undoClearRow.style("display", "flex");
    undoClearRow.style("flex-direction", "row");
    undoClearRow.style("gap", "10px");

    // Undo Button
    undoButton = p.createButton("Undo");
    undoButton.parent(undoClearRow);
    undoButton.mousePressed(undoLastAction);
    undoButton.style("height", "30px");
    undoButton.style("font-size", "14px");
    undoButton.style("background-color", "#4d94ff");
    undoButton.style("color", "#ffffff");
    undoButton.style("border", "none");
    undoButton.style("border-radius", "4px");
    undoButton.style("cursor", "pointer");
    undoButton.style("padding", "0 10px");

    // Clear Button
    clearButton = p.createButton("Clear all");
    clearButton.parent(undoClearRow);
    clearButton.mousePressed(clearCanvas);
    clearButton.style("height", "30px");
    clearButton.style("font-size", "14px");
    clearButton.style("background-color", "#ff4d4d");
    clearButton.style("color", "#ffffff");
    clearButton.style("border", "none");
    clearButton.style("border-radius", "4px");
    clearButton.style("cursor", "pointer");
    clearButton.style("padding", "0 10px");

    // Row for Brush Indicator and Mode Button
    let brushModeRow = p.createDiv();
    brushModeRow.parent(commonControls);
    brushModeRow.style("display", "flex");
    brushModeRow.style("flex-direction", "row");
    brushModeRow.style("gap", "10px");
    brushModeRow.style("align-items", "center");

    // Brush Indicator
    brushIndicatorGraphics = p.createGraphics(50, 50);
    brushIndicatorImg = p.createImg("", "");
    brushIndicatorImg.parent(brushModeRow);
    brushIndicatorImg.style("width", "75px");
    brushIndicatorImg.style("height", "75px");
    brushIndicatorImg.style("display", "block");
    brushIndicatorImg.style("margin-top", "10px");
    brushIndicatorImg.style("align-self", "flex-start");

    // Mode Button
    modeButton = p.createButton("Switch to Marker");
    modeButton.parent(brushModeRow);
    modeButton.style("height", "30px");
    modeButton.style("font-size", "14px");
    modeButton.style("cursor", "pointer");
    modeButton.style("background", "#ddd");
    modeButton.style("border", "none");
    modeButton.style("border-radius", "4px");
    modeButton.style("padding", "0 10px");
    modeButton.mousePressed(toggleMode);

    // Mode Indicator
    modeIndicator = p.createDiv("Current Mode: Spray");
    modeIndicator.parent(commonControls);
    modeIndicator.style("font-size", "14px");
    modeIndicator.style("font-weight", "bold");
    modeIndicator.style("margin", "0");

    // Column for Sliders and Related Controls
    let controlsColumn = p.createDiv();
    controlsColumn.parent(commonControls);
    controlsColumn.style("display", "flex");
    controlsColumn.style("flex-direction", "column");
    controlsColumn.style("gap", "10px");
    controlsColumn.style("background", "#fff");
    controlsColumn.style("padding", "10px");
    controlsColumn.style("border-radius", "8px");
    controlsColumn.style("box-shadow", "0 2px 5px rgba(0,0,0,0.1)");

    setupDrawingControls(p, controlsColumn);
  }

  // Create a row cell for label and input
  function createCell(p, parent = commonControls) {
    let cell = p.createDiv();
    cell.parent(parent);
    cell.style("display", "flex");
    cell.style("flex-direction", "row");
    cell.style("align-items", "center");
    cell.style("justify-content", "space-between");
    cell.style("gap", "10px");
    return cell;
  }

  function setupDrawingControls(p, parent) {
    // Color Picker
    let colorCell = createCell(p, parent);
    let colorLabel = p.createSpan("Color");
    colorLabel.style("margin", "0");
    colorLabel.style("font-size", "14px");
    colorCell.child(colorLabel);
    colorPickerElement = p.createColorPicker("#000000");
    colorPickerElement.parent(colorCell);
    colorPickerElement.style("width", "60px");
    colorPickerElement.style("height", "30px");
    colorPickerElement.style("border", "none");

    // Size Slider
    let sizeCell = createCell(p, parent);
    let sizeLabel = p.createSpan("Size");
    sizeLabel.style("margin", "0");
    sizeLabel.style("font-size", "14px");
    sizeCell.child(sizeLabel);
    sizeSlider = p.createSlider(2, 100, 30);
    sizeSlider.parent(sizeCell);
    sizeSlider.style("width", "200px");

    // Spray and Marker mode-specific containers
    sprayControls = p.createDiv();
    sprayControls.id("sprayControls");
    sprayControls.parent(parent);
    sprayControls.style("display", "flex");
    sprayControls.style("flex-direction", "column");
    sprayControls.style("gap", "10px");

    markerControls = p.createDiv();
    markerControls.id("markerControls");
    markerControls.parent(parent);
    markerControls.style("display", "none");
    markerControls.style("flex-direction", "column");
    markerControls.style("gap", "10px");

    let ovalnessCell = createCell(p, markerControls);
    let ovalnessLabel = p.createSpan("Ovalness");
    ovalnessLabel.style("margin", "0");
    ovalnessLabel.style("font-size", "14px");
    ovalnessCell.child(ovalnessLabel);
    ovalnessSlider = p.createSlider(0.3, 1, 1, 0.01);
    ovalnessSlider.parent(ovalnessCell);
    ovalnessSlider.style("width", "200px");

    let rotationCell = createCell(p, markerControls);
    let rotationLabel = p.createSpan("Rotation");
    rotationLabel.style("margin", "0");
    rotationLabel.style("font-size", "14px");
    rotationCell.child(rotationLabel);
    rotationSlider = p.createSlider(0, p.PI, 0, 0.01);
    rotationSlider.parent(rotationCell);
    rotationSlider.style("width", "200px");

    dripCheckbox = p.createCheckbox("Drips", true);
    dripCheckbox.parent(markerControls);
    dripCheckbox.style("font-size", "14px");
    dripCheckbox.style("margin", "0");
    dripCheckbox.style("display", "flex");
    dripCheckbox.style("align-items", "center");
  }

  // Toggle between Spray and Marker modes
  function toggleMode() {
    if (currentMode === "spray") {
      currentMode = "marker";
      modeButton.html("Switch to Spray");
      sprayControls.hide();
      markerControls.show();
      modeIndicator.html("Current Mode: Marker");
    } else {
      currentMode = "spray";
      modeButton.html("Switch to Marker");
      markerControls.hide();
      sprayControls.show();
      modeIndicator.html("Current Mode: Spray");
    }
  }

  function updateBrushSizeIndicator(p) {
    brushIndicatorGraphics.clear();
    brushIndicatorGraphics.push();
    brushIndicatorGraphics.translate(25, 25);
    brushIndicatorGraphics.rotate(rotationSlider.value());
    brushIndicatorGraphics.noStroke();
    brushIndicatorGraphics.fill(colorPickerElement.color());
    brushIndicatorGraphics.ellipse(
      0,
      0,
      sizeSlider.value() * ovalnessSlider.value(),
      sizeSlider.value()
    );
    brushIndicatorGraphics.pop();
    brushIndicatorImg.elt.src = brushIndicatorGraphics.canvas.toDataURL();
  }

  // ============================
  // UI Display Functions
  // ============================

  // Display Spray Crosshair Function
  function updateSprayUI(p) {
    uiLayer.clear();

    uiLayer.blendMode(p.LIGHTEST);
    uiLayer.noFill();
    uiLayer.stroke(255);
    uiLayer.strokeWeight(3);
    uiLayer.circle(p.mouseX, p.mouseY, sizeSlider.value() * 2);

    uiLayer.blendMode(p.DARKEST);
    uiLayer.noFill();
    uiLayer.stroke(0);
    uiLayer.strokeWeight(2);
    uiLayer.circle(p.mouseX, p.mouseY, sizeSlider.value() * 2);

    uiLayer.blendMode(p.BLEND);

    // Draw Spray Can
    uiLayer.push();
    uiLayer.translate(p.mouseX + 40, p.mouseY + 45);
    uiLayer.rotate(-p.PI / 10);
    uiLayer.scale(0.5);
    sprayCan(p, 0, 0, colorPickerElement.color());
    uiLayer.pop();
  }

  // Display Marker Indicator Function
  function updateMarkerUI(p) {
    uiLayer.clear();
    uiLayer.push();
    uiLayer.translate(p.mouseX, p.mouseY);
    uiLayer.rotate(rotationSlider.value());
    uiLayer.noFill();
    uiLayer.stroke(0);
    uiLayer.strokeWeight(2);
    uiLayer.ellipse(
      0,
      0,
      sizeSlider.value() * ovalnessSlider.value(),
      sizeSlider.value()
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
    marker(p, 0, 0, colorPickerElement.color());
    uiLayer.pop();

    updateBrushSizeIndicator(p);
  }

  function handleDrips(p) {
    if (dripCheckbox.checked()) {
      if (p.frameCount % 15 === 0 || p.frameCount % 40 === 0) {
        drips.push(
          new Drip(
            p.mouseX,
            p.mouseY,
            colorPickerElement.color(),
            p.min(sizeSlider.value() / 2, 5)
          )
        );
      }
    }
  }

  // ============================
  // Emit Spray Function
  // ============================
  function emitSpray(p) {
    let size = sizeSlider.value();
    let density = p.floor((size / 100) * 650);
    let currentColor = colorPickerElement.color();

    drawLowOpacityFill(p, currentColor, smoothedMouseX, smoothedMouseY, size);
    innerCircle(p, size, density, currentColor, smoothedMouseX, smoothedMouseY);
    outerCircle(p, size, density, currentColor, smoothedMouseX, smoothedMouseY);
  }

  // ============================
  // Emit Marker Function
  // ============================
  function emitMarker(p) {
    let tmpMarkerLayer = p.createGraphics(p.width, p.height);
    tmpMarkerLayer.clear();
    let size = sizeSlider.value();
    let ovalness = ovalnessSlider.value();
    let angle = rotationSlider.value();
    let currentColor = colorPickerElement.color();

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
      tmpMarkerLayer.fill(currentColor);
      tmpMarkerLayer.ellipse(0, 0, size * ovalness, size);
      tmpMarkerLayer.pop();
    }

    drawLayer.image(tmpMarkerLayer, 0, 0);
    tmpMarkerLayer.remove();
  }

  // ============================
  // Draw Low Opacity Fill Function
  // ============================
  function drawLowOpacityFill(p, currentColor, x, y, size) {
    for (let i = 1; i < 2.5; i += 0.5) {
      drawLayer.noStroke();
      drawLayer.fill(
        p.red(currentColor),
        p.green(currentColor),
        p.blue(currentColor),
        3
      );
      drawLayer.circle(x, y, size * i);
    }
  }

  // ============================
  // Inner Circle Function
  // ============================
  function innerCircle(p, size, density, currentColor, posX, posY) {
    for (let i = 0; i < density; i++) {
      let angle = p.random(p.TWO_PI);
      let radius = p.abs(p.randomGaussian(0, size * 0.5));
      if (radius > size * 0.9) continue;

      let x = posX + p.cos(angle) * radius;
      let y = posY + p.sin(angle) * radius;

      if (x < 0 || x > p.width || y < 0 || y > p.height) continue;

      drawLayer.noStroke();
      drawLayer.fill(
        p.red(currentColor),
        p.green(currentColor),
        p.blue(currentColor),
        255
      );
      let dropSize = p.random(1, 2);
      drawLayer.ellipse(x, y, dropSize, dropSize);
    }
  }

  // ============================
  // Outer Circle Function
  // ============================
  function outerCircle(p, size, density, currentColor, posX, posY) {
    for (let i = 0; i < density; i++) {
      let angle = p.random(p.TWO_PI);
      let radius = p.randomGaussian(size, size / 10);
      if (radius < size * 0.9 || radius > size * 1.2) continue;

      let x = posX + p.cos(angle) * radius;
      let y = posY + p.sin(angle) * radius;

      if (x < 0 || x > p.width || y < 0 || y > p.height) continue;

      drawLayer.noStroke();
      drawLayer.fill(
        p.red(currentColor),
        p.green(currentColor),
        p.blue(currentColor),
        255
      );
      let dropSize = p.random(1, 2);
      drawLayer.ellipse(x, y, dropSize, dropSize);
    }
  }

  // ============================
  // Drips
  // ============================
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

  // ============================
  // Mouse & Keyboard Events
  // ============================
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
      sizeSlider.value(p.max(sizeSlider.value() - increment, 2));
    } else {
      sizeSlider.value(p.min(sizeSlider.value() + increment, 100));
    }
    return false;
  };

  p.windowResized = () => {
    p.resizeCanvas(p.windowWidth, 900);
    bgLayer.resizeCanvas(p.windowWidth, 900);
    drawLayer.resizeCanvas(p.windowWidth, 900);
    uiLayer.resizeCanvas(p.windowWidth, 900);

    if (backgroundImg) {
      bgLayer.clear();
      bgLayer.image(backgroundImg, 0, 0, p.width, p.height);
    } else {
      bgLayer.background(250);
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

    if (spraySound && spraySound.isPlaying()) {
      spraySound.stop();
    }
  };

  p.mousePressed = () => {
    if (p.mouseY < p.height && p.mouseY > 0 && p.mouseX > 0 && p.mouseX < p.width) {
      if (currentMode === "spray" && spraySound && !spraySound.isPlaying()) {
        spraySound.loop();
      }
    }
  };

  // // ============================
  // // Shake Detection
  // // ============================
  // function updateMouseYHistory(p) {
  //   let currentTime = p.millis();
  //   mouseYHistory.push({ y: p.mouseY, time: currentTime });

  //   while (
  //     mouseYHistory.length > 0 &&
  //     currentTime - mouseYHistory[0].time > shakeTimeWindow
  //   ) {
  //     mouseYHistory.shift();
  //   }
  // }

  // function detectShake(p) {
  //   if (mouseYHistory.length < 2) return;

  //   let directionChanges = 0;
  //   let lastDirection = 0;

  //   for (let i = 1; i < mouseYHistory.length; i++) {
  //     let dy = mouseYHistory[i].y - mouseYHistory[i - 1].y;
  //     let direction = dy > 0 ? 1 : dy < 0 ? -1 : 0;

  //     if (direction !== 0) {
  //       if (lastDirection !== 0 && direction !== lastDirection) {
  //         directionChanges++;
  //       }
  //       lastDirection = direction;
  //     }
  //   }

  //   if (
  //     directionChanges >= shakeThreshold &&
  //     p.millis() - lastShakeTime > shakeCooldown
  //   ) {
  //     isShaking = true;
  //     shakingTimer = p.millis() + shakingDuration;
  //     lastShakeTime = p.millis();

  //     triggerShake(p);
  //   }

  //   if (isShaking && p.millis() > shakingTimer) {
  //     isShaking = false;
  //   }
  // }

  // function manageShakeSound(p) {
  //   if (isShaking) {
  //     if (shakeSound && !shakeSound.isPlaying()) {
  //       shakeSound.loop();
  //     }
  //   } else {
  //     if (shakeSound && shakeSound.isPlaying()) {
  //       shakeSound.stop();
  //     }
  //   }
  // }

  // function triggerShake(p) {
  //   if (shakeSound) {
  //     if (!shakeSound.isPlaying()) {
  //       shakeSound.loop();
  //     }
  //   }
  // }

  // ============================
  // Drip Class
  // ============================
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
        pg.fill(
          this.col.levels[0],
          this.col.levels[1],
          this.col.levels[2],
          180
        );
        pg.ellipse(
          this.x + this.off,
          this.y + this.currLen,
          this.size,
          this.size
        );
      }
    }
  }

  // ============================
  // Undo / Clear Functions
  // ============================
  function saveCurrentStateToHistory() {
    if (historyStack.length >= maxHistory) {
      historyStack.shift();
    }
    historyStack.push(drawLayer.get());
  }

  function clearCanvas() {
    historyStack = [historyStack[0]];
    drips = [];
    drawLayer.clear();
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

  // ============================
  // UI Control Functions
  // ============================

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

    // Tip
    uiLayer.fill(color);
    uiLayer.rect(x, y - 5, 15, 15, 2);

    // Body
    uiLayer.fill(color);
    uiLayer.rect(x, y - 80, 30, 98, 4);

    // Steps
    uiLayer.fill(33); // Black color for steps
    uiLayer.rect(x, y - 38, 32, 15, 2); // Largest step
    uiLayer.rect(x, y - 25, 28, 15, 2); // Middle step
    uiLayer.rect(x, y - 15, 20, 15, 1); // Smallest step
  }
};

export default sketch;

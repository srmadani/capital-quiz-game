// Global game manager
let gameManager;

// More streamlined event tracking
let touchStartX = 0;
let touchStartY = 0;
let isTouchDevice = false;
let touchProcessed = false;
let lastActionTime = 0; // Track when the last action occurred
const ACTION_COOLDOWN = 300; // Minimum time between actions in ms

function preload() {
  // Game data is now inline
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  
  try {
    // Simple debug logging to diagnose initialization issues
    console.log("Starting setup...");
    
    // Initialize game manager
    gameManager = new GameManager();
    gameManager.setup();
    
    // Track successful initialization
    window.gameManagerInitialized = true;
    console.log("Game initialized successfully!");
    
    // Explicitly signal the loading is complete
    if (document.getElementById('loading')) {
      setTimeout(function() {
        const loader = document.getElementById('loading');
        loader.style.opacity = 0;
        setTimeout(function() {
            loader.style.display = 'none';
        }, 500);
      }, 100);
    }
  } catch (e) {
    console.error("Error initializing game:", e);
    // Log more detailed error info
    console.error("Stack trace:", e.stack);
  }
}

function draw() {
  background(0);
  
  // Check if we've initialized successfully
  if (typeof gameManager === 'undefined' || !gameManager) {
    showInitializationError("Game manager is undefined");
    return;
  }
  
  try {
    gameManager.update();
    gameManager.draw();
  } catch (e) {
    console.error("Error in game loop:", e);
    console.error("Stack trace:", e.stack);
    showInitializationError("Runtime error: " + e.message);
  }
}

function showInitializationError(message) {
  push();
  fill(255, 0, 0);
  textAlign(CENTER);
  textSize(16);
  text("ERROR INITIALIZING GAME", width/2, height/2 - 40);
  textSize(12);
  text(message || "Check console for details", width/2, height/2);
  
  // Show appropriate instructions based on device
  let restartText = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ? 
    "Tap to retry" : "Press 'R' to retry loading";
  
  text(restartText, width/2, height/2 + 60);
  pop();
}

function mousePressed() {
  // Prevent rapid firing of actions
  if (millis() - lastActionTime < ACTION_COOLDOWN) {
    return false;
  }
  
  // Only process mouse events on non-touch devices
  if (!isTouchDevice && gameManagerInitialized) {
    lastActionTime = millis();
    gameManager.handleInteraction(mouseX, mouseY, "mouse");
  }
  return false; // Prevent default behavior
}

function keyPressed() {
  // Retry loading with 'R' key
  if (key === 'r' || key === 'R') {
    window.location.reload();
  }
  
  // Handle game manager key presses
  if (gameManagerInitialized) {
    gameManager.keyPressed();
  }
}

// Completely replace the touchStarted function
function touchStarted() {
  // Mark as touch device
  isTouchDevice = true;
  touchStartX = mouseX;
  touchStartY = mouseY;
  
  // Prevent rapid firing of actions
  if (millis() - lastActionTime < ACTION_COOLDOWN) {
    return false;
  }
  
  try {
    // If game is initialized, safely forward the touch
    if (gameManagerInitialized && gameManager) {
      lastActionTime = millis();
      
      Promise.resolve().then(() => {
        setTimeout(() => {
          gameManager.handleInteraction(mouseX, mouseY, "touch");
        }, 10);
      });
    }
  } catch (e) {
    console.error("Error in touchStarted:", e);
  }
  
  return false; // Prevent default
}

// Prevent default touch behavior
function touchEnded() {
  return false;
}

function touchMoved() {
  return false;
}

function touchCancelled() {
  return false;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  
  if (gameManagerInitialized) {
    gameManager.windowResized();
  }
}
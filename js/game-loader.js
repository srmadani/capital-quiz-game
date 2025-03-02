/**
 * This file helps ensure proper game loading and initialization
 */

// Create a helper to check if the game is ready
window.checkGameReady = function() {
  // Check if the game is initialized
  if (window.gameManagerInitialized === true) {
    console.log("Game is initialized and ready!");
    return true;
  }
  
  // Check for canvas as backup
  if (document.getElementsByTagName('canvas').length > 0) {
    console.log("Canvas exists, game appears to be working");
    window.gameManagerInitialized = true;
    return true;
  }
  
  // Check for game manager as another backup
  if (typeof gameManager !== 'undefined' && gameManager !== null) {
    console.log("Game manager exists, game appears to be working");
    window.gameManagerInitialized = true;
    return true;
  }
  
  console.log("Game is not ready yet");
  return false;
};

// Register with window load event
window.addEventListener('DOMContentLoaded', function() {
  console.log("DOM content loaded, applying game loading helpers");
  
  // Set up a backup to remove loading screen
  setTimeout(function() {
    if (window.checkGameReady()) {
      var loader = document.getElementById('loading');
      if (loader && loader.style.opacity !== '0') {
        console.log("Removing loader through backup method");
        loader.style.opacity = 0;
        setTimeout(function() {
          loader.style.display = 'none';
        }, 500);
      }
    }
  }, 3000);
});

console.log("Game loader initialized");

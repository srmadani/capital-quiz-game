/**
 * Main game manager that coordinates all game modules and handles game state
 */
class GameManager {
  /**
   * Create a new game manager
   */
  constructor() {
    this.player = new Player();
    this.enemyManager = new EnemyManager();
    this.bulletManager = new BulletManager();
    this.particleManager = new ParticleManager();
    
    this.game_over = false;
    this.wave = 0;
    this.score = CONFIG.WAVES.STARTING_SCORE;
    this.shouldStartNewWave = true;
    this.waveTimeLimit = CONFIG.WAVES.TIME_LIMIT;
    
    // Capital quiz variables
    this.currentCountry = "";
    this.countriesUsed = [];
    this.feedback = { text: "", timer: 0, color: [255, 255, 255] };
    
    this._lastInteractionTime = 0;
    
    // Game statistics
    this.stats = {
      startTime: 0,
      endTime: 0,
      wavesCompleted: 0,
      correctAnswers: 0,
      wrongAnswers: 0,
      shotsFired: 0,
      finalScore: 0,
      gameResult: "" // "completed", "failed", "quit"
    };
  }
  
  /**
   * Initialize the game and all components
   */
  setup() {
    // Initialize all components
    this.player.setup(width, height);
    this.enemyManager.setup(height);
    this.particleManager.setup(width, height);
    
    // Reset game state
    this.resetGame();
  }
  
  /**
   * Reset the game to starting state
   */
  resetGame() {
    // Use safety system
    if (window.gameSafetyFlags && !window.gameSafetyFlags.canReset()) {
      return;
    }
    
    this.game_over = false;
    this.wave = 0; // This starts at 0, and gets incremented to 1 by startNewWave
    this.score = CONFIG.WAVES.STARTING_SCORE;
    this.shouldStartNewWave = true;
    this.countriesUsed = [];
    this.currentCountry = "";
    
    // Reset player state too
    if (this.player) {
      this.player.resetState();
    }
    
    // Reset statistics
    this.stats = {
      startTime: Date.now(),
      endTime: 0,
      wavesCompleted: 0,
      correctAnswers: 0,
      wrongAnswers: 0,
      shotsFired: 0,
      finalScore: 0,
      gameResult: ""
    };
  }
  
  /**
   * End the game manually
   * @param {string} reason - Reason for ending ("quit", "failed", "completed")
   */
  endGame(reason = "quit") {
    if (this.game_over) return; // Already game over
    
    this.game_over = true;
    this.stats.endTime = Date.now();
    this.stats.wavesCompleted = this.wave;
    this.stats.finalScore = this.score;
    this.stats.gameResult = reason;
    
    // Create visual effects for game ending
    this.particleManager.addScreenShake(CONFIG.EFFECTS.SHAKE.GAME_OVER);
    this.particleManager.setGlitchIntensity(CONFIG.EFFECTS.GLITCH.EXPLOSION);
    // Play game over sound
    window.soundManager && window.soundManager.playGameOverSound();
  }
  
  /**
   * Update game state for current frame
   */
  update() {
    if (this.game_over) {
      return;
    }
    
    // Update feedback timer
    if (this.feedback.timer > 0) {
      this.feedback.timer -= deltaTime;
    }
    
    // Start a new wave if needed
    if (this.shouldStartNewWave) {
      this.startNewWave();
      this.shouldStartNewWave = false;
    }
    
    // Update player
    this.player.update(deltaTime);
    
    // Update bullets and check for collisions
    this.score = this.bulletManager.update(
      deltaTime, 
      this.enemyManager.enemies, 
      this.enemyManager, 
      this.particleManager, 
      this.score
    );
    
    // Update enemies and check for collisions with player
    if (this.enemyManager.update(width, height, this.player, this.particleManager, deltaTime)) {
      // Show feedback when enemies pass the player
      if (!this.player.isDestroyed) {
        this.showFeedback("Time's up! Answer missed.", [255, 50, 50]);
      }
      this.game_over = true;
    }
    
    // Check if all enemies are eliminated
    if (this.enemyManager.enemies.length === 0) {
      this.shouldStartNewWave = true;
      // Update stats when wave is completed
      this.stats.wavesCompleted = this.wave;
      
      // Only increment correct answers when a wave is actually completed
      if (this.wave > 0) {
        this.stats.correctAnswers++;
      }
    }
    
    // Check wave timer
    let timeRemaining = this.enemyManager.getTimeRemaining(this.waveTimeLimit);
    if (timeRemaining <= 0 && this.enemyManager.enemies.length > 0) {
      this.showFeedback("Time's up!", [255, 50, 50]);
      this.endGame("failed");
    }
  }
  
  /**
   * Draw all game elements
   */
  draw() {
    // Apply screen shake
    let currentShake = this.particleManager.updateScreenShake();
    
    // Draw background elements
    this.particleManager.drawBackgroundGrid();
    this.particleManager.drawStars();
    
    if (this.game_over) {
      this.drawGameOverScreen();
    } else {
      // Draw game elements
      this.drawTargetingSystem();
      this.player.draw();
      this.particleManager.updateParticles();
      
      // Draw UI
      this.drawWaveTimer();
      this.drawUI();
      
      // Draw current country question
      this.drawCountryQuestion();
      
      // Draw feedback if active
      this.drawFeedback();
    }
    
    // Draw global glitch effect
    this.particleManager.drawGlitchEffect();
  }
  
  /**
   * Draw the current country question
   */
  drawCountryQuestion() {
    if (this.currentCountry) {
      push();
      textAlign(CENTER);
      // Make text size responsive
      textSize(CONFIG.UI.getHeaderSize());
      fill(255);
      // Position relative to screen height
      let questionY = height * 0.1;
      text("What is the capital of " + this.currentCountry + "?", width/2, questionY);
      pop();
    }
  }
  
  /**
   * Draw the targeting reticle system
   */
  drawTargetingSystem() {
    push();
    stroke(255, 0, 0);
    // Responsive stroke weight
    strokeWeight(map(min(width, height), 300, 1200, 0.5, 1));
    noFill();
    
    // Animated targeting reticle
    let pulseRate = map(sin(frameCount * 0.1), -1, 1, 0.8, 1.2);
    
    // Scale reticle based on screen size
    let reticleSize = min(width, height) * 0.02;
    
    // Outer circle with rotation
    push();
    translate(mouseX, mouseY);
    rotate(frameCount * 0.02);
    
    ellipse(0, 0, reticleSize * pulseRate, reticleSize * pulseRate);
    
    // Add rotating elements - scaled
    let lineLen = reticleSize * 0.75;
    line(-lineLen, 0, -lineLen * 0.7, 0);
    line(lineLen * 0.7, 0, lineLen, 0);
    line(0, -lineLen, 0, -lineLen * 0.7);
    line(0, lineLen * 0.7, 0, lineLen);
    
    // Additional corner marks
    line(-lineLen * 0.7, -lineLen * 0.7, -lineLen * 0.5, -lineLen * 0.5);
    line(lineLen * 0.7, -lineLen * 0.7, lineLen * 0.5, -lineLen * 0.5);
    line(-lineLen * 0.7, lineLen * 0.7, -lineLen * 0.5, lineLen * 0.5);
    line(lineLen * 0.7, lineLen * 0.7, lineLen * 0.5, lineLen * 0.5);
    pop();
    
    // Draw line from player to target
    stroke(255, 30);
    line(this.player.x, this.player.y - 15, mouseX, mouseY);
    
    pop();
  }
  
  /**
   * Draw the wave timer UI element
   */
  drawWaveTimer() {
    // More explicit check for game being active
    if (this.game_over || this.enemyManager.enemies.length === 0) {
      return; // Don't draw timer if game is over or no enemies
    }
    
    // Get remaining time and only draw if positive
    let timeRemaining = this.enemyManager.getTimeRemaining(this.waveTimeLimit);
    
    // Use fixed 20-second scale for the progress bar
    let totalWaveTime = 20;
    
    if (timeRemaining <= 0) {
      return; // Don't draw timer if no time remains
    }
    
    // Draw the timer only if we have time and active enemies
    if (this.enemyManager.enemies.length > 0) {
      push();
      // Draw progress bar at bottom of screen
      let barHeight = height * 0.005; // Proportional to screen height
      let barWidth = map(timeRemaining, 0, totalWaveTime, 0, width);
      
      // Position relative to bottom of screen
      let barY = height - (height * 0.03);
      
      // Draw glitchy background bar
      stroke(50);
      strokeWeight(1);
      noFill();
      rect(0, barY, width, barHeight);
      
      // Draw progress
      fill(255);
      noStroke();
      rect(0, barY, barWidth, barHeight);
      
      // Add text
      fill(255);
      textFont('monospace');
      textSize(CONFIG.UI.getSmallTextSize());
      textAlign(LEFT);
      text(Math.ceil(timeRemaining) + "s", 10, barY - barHeight * 2);
      pop();
    }
  }
  
  /**
   * Draw the main UI (score, wave, instructions)
   */
  drawUI() {
    push();
    textFont('monospace');
    textSize(CONFIG.UI.getTextSize());
    textAlign(LEFT);
    fill(255);
    
    // Draw wave and score with minimal design
    text("WAVE: " + this.wave, 10, 25);
    text("SCORE: " + this.score, 10, 50);
    
    // Draw small instruction text - hide on very small screens or show simplified on mobile
    if (width > 600) {
      textSize(CONFIG.UI.getSmallTextSize());
      
      let instructions;
      if (CONFIG.isMobileDevice()) {
        instructions = "TAP: SHOOT | TOGGLE DEBUG: DOUBLE TAP";
      } else {
        instructions = "MOVE: ARROWS | SHOOT: MOUSE";
      }
      
      // Position relative to right side of screen
      textAlign(RIGHT);
      text(instructions, width - 10, 25);
    }
    pop();
  }
  
  /**
   * Draw the game over screen
   */
  drawGameOverScreen() {
    push();
    // Animated glitchy game over text
    textFont('monospace');
    textSize(CONFIG.UI.getHeaderSize() * 1.2);
    textAlign(CENTER);
    fill(255);
    
    let gameOverY = height * 0.2; // Moved up to make space for stats
    let titleText = this.stats.gameResult === "quit" ? "GAME ENDED" : "GAME OVER";
    
    // Glitch effect for game over text
    for (let i = 0; i < 5; i++) {
      if (random() > 0.7) {
        let glitchX = width/2 + random(-10, 10);
        let glitchOffset = random(-5, 5);
        fill(255);
        text(titleText, glitchX + glitchOffset, gameOverY + glitchOffset);
      }
    }
    
    // Main text
    fill(255);
    text(titleText, width/2, gameOverY);
    
    // Display game statistics
    textSize(CONFIG.UI.getTextSize());
    fill(200);
    
    let statY = height * 0.35;
    let lineHeight = CONFIG.UI.getTextSize() * 1.5;
    
    // Calculate elapsed time in minutes and seconds
    let elapsedTimeMs = this.stats.endTime - this.stats.startTime;
    let minutes = Math.floor(elapsedTimeMs / 60000);
    let seconds = Math.floor((elapsedTimeMs % 60000) / 1000);
    let timeString = `${minutes}m ${seconds}s`;
    
    // Display statistics
    text("FINAL SCORE: " + this.stats.finalScore, width/2, statY);
    statY += lineHeight;
    text("WAVES COMPLETED: " + this.stats.wavesCompleted, width/2, statY);
    statY += lineHeight;
    
    // Highlight correct answers
    fill(100, 255, 100);
    text("CORRECT ANSWERS: " + this.stats.correctAnswers, width/2, statY);
    statY += lineHeight;
    
    // Highlight wrong answers with dramatic effect
    if (this.stats.wrongAnswers > 0) {
      fill(255, 100, 100);
      text("WRONG ANSWERS: " + this.stats.wrongAnswers + " - TOTALLY WRONG!", width/2, statY);
      
      // Add additional wrong answer emphasis with animation
      if (floor(frameCount / 15) % 2 === 0) {
        textSize(CONFIG.UI.getTextSize() * 0.7);
        text("YOUR GEOGRAPHY KNOWLEDGE NEEDS IMPROVEMENT!", width/2, statY + lineHeight * 0.5);
      }
    } else {
      fill(200);
      text("WRONG ANSWERS: " + this.stats.wrongAnswers + " - PERFECT SCORE!", width/2, statY);
    }
    
    statY += lineHeight;
    fill(200);
    text("SHOTS FIRED: " + this.stats.shotsFired, width/2, statY);
    statY += lineHeight;
    text("TIME PLAYED: " + timeString, width/2, statY);
    
    // Blinking instruction text - adapt for mobile
    if (floor(frameCount / 30) % 2 === 0) {
      statY = height * 0.75;
      textSize(CONFIG.UI.getTextSize());
      let restartText = CONFIG.isMobileDevice() ? 
        "TAP TO RESTART" : "PRESS ENTER TO RESTART";
      text(restartText, width/2, statY);
    }
    
    // Draw some random distortion lines
    stroke(255);
    for (let i = 0; i < 20; i++) {
      if (random() > 0.7) {
        let y = random(height);
        line(0, y, width, y + random(-10, 10));
      }
    }
    pop();
  }
  
  /**
   * Start a new wave with a random country and capitals
   */
  startNewWave() {
    this.wave += 1;
    
    // Get a random country and capitals from CSV data
    let quizData = this.getRandomCountryData();
    
    if (!quizData) {
      this.game_over = true;
      return;
    }
    
    this.currentCountry = quizData.country;
    
    // Start new wave with the enemy manager
    this.enemyManager.startNewWave(this.wave, width, quizData.cities, quizData.correctIndex);
    
    // Add wave transition effects
    this.particleManager.addScreenShake(10);
    this.particleManager.setGlitchIntensity(30);
    this.particleManager.createExplosion(width/2, height/2, 30, 50);
  }
  
  /**
   * Get random country data
   * @returns {Object} Object with country, cities array, and correct index
   */
  getRandomCountryData() {
    try {
      // Access global CAPITALS_DATA with error checking
      if (typeof CAPITALS_DATA === 'undefined' || !CAPITALS_DATA || !CAPITALS_DATA.length) {
        console.error("CAPITALS_DATA is not available:", typeof CAPITALS_DATA);
        
        // Return emergency fallback data
        return {
          country: "Emergency Fallback",
          cities: ["Paris", "London", "Tokyo", "Berlin"],
          correctIndex: 0,
          correctCity: "Paris"
        };
      }
      
      // Try to find a country we haven't used yet
      let attempts = 0;
      let index;
      
      do {
        index = floor(random(CAPITALS_DATA.length));
        attempts++;
        // If we've tried too many times or used all countries, reset the used list
        if (attempts > 50 || this.countriesUsed.length >= CAPITALS_DATA.length * 0.8) {
          this.countriesUsed = [];
          break;
        }
      } while (this.countriesUsed.includes(index));
      
      this.countriesUsed.push(index);
      
      // Get data from the selected country
      const countryData = CAPITALS_DATA[index];
      
      // Validate the correctIndex to avoid issues
      if (countryData.correctIndex < 0 || countryData.correctIndex >= countryData.cities.length) {
        console.error(`Invalid correctIndex ${countryData.correctIndex} for ${countryData.country}`);
        // Fix the index to a safe value
        countryData.correctIndex = 0;
      }
      
      const correctCity = countryData.cities[countryData.correctIndex];
      
      return {
        country: countryData.country,
        cities: countryData.cities,
        correctIndex: countryData.correctIndex,
        correctCity: correctCity
      };
    } catch (e) {
      console.error("Error in getRandomCountryData:", e);
      
      // Return emergency fallback data
      return {
        country: "Error Country",
        cities: ["Error City 1", "Error City 2", "Error City 3", "Error City 4"],
        correctIndex: 0,
        correctCity: "Error City 1"
      };
    }
  }
  
  /**
   * Handle mouse press events
   */
  mousePressed() {
    this.handleInteraction(mouseX, mouseY, "mouse");
  }

  /**
   * Handle touch interaction - separates touch handling from mouse
   * @param {number} x - Touch X position
   * @param {number} y - Touch Y position
   */
  touchInteraction(x, y) {
    this.handleInteraction(x, y, "touch");
  }

  /**
   * Safe unified handler for all interactions (mouse or touch)
   * @param {number} x - Interaction X position
   * @param {number} y - Interaction Y position
   * @param {string} source - Source of interaction ('mouse' or 'touch')
   */
  handleInteraction(x, y, source) {
    // Add additional safety check - don't process interactions too rapidly
    let currentTime = millis();
    if (currentTime - this._lastInteractionTime < 300) {
      return;
    }
    this._lastInteractionTime = currentTime;
    
    try {
      // Make separate execution paths with no shared logic
      if (this.game_over) {
        // Only handle reset if game is already over
        setTimeout(() => this.resetGame(), 100);
      } else {
        // Game is active - handle shooting
        if (this.player && this.player.canShoot()) {
          this.safeShoot(x, y);
          // Track shots fired for statistics
          this.stats.shotsFired++;
        }
      }
    } catch (e) {
      console.error(`Error in handleInteraction:`, e);
    }
  }

  /**
   * Absolutely safe shooting method that cannot reset the game
   * @param {number} x - Target X position
   * @param {number} y - Target Y position
   */
  safeShoot(x, y) {
    try {
      // Safety checks
      if (window.gameSafetyFlags && !window.gameSafetyFlags.canShoot()) {
        return;
      }
      
      if (this.game_over) {
        return;
      }
      
      if (!this.player || !this.player.canShoot()) {
        return;
      }
      
      // Create bullet with safe coordinates
      const targetX = isNaN(x) ? width/2 : x;
      const targetY = isNaN(y) ? height/2 : y;
      
      // Create bullets from the left and right of the ship's forward cannons
      const offset = this.player.size * 0.3;
      this.bulletManager.createBullet(this.player.x - offset, this.player.y - this.player.size * 0.2, targetX, targetY);
      this.bulletManager.createBullet(this.player.x + offset, this.player.y - this.player.size * 0.2, targetX, targetY);
      
      // Muzzle flash effect - now handled in player's own draw method
      this.particleManager.createExplosion(this.player.x, this.player.y - 20, 3, 30);
      
      // Update last shot time on the player and play shoot sound
      this.player.shoot();
      window.soundManager && window.soundManager.playShootSound();
      
      // Reduce score for shooting and show feedback if cost is non-zero
      if (CONFIG.BULLETS.COST > 0) {
        const prevScore = this.score; 
        this.score -= CONFIG.BULLETS.COST;
        if (this.score < 0) this.score = 0;
        
        // Add score feedback particle
        this.particleManager.createTextParticle(
          this.player.x + 20, 
          this.player.y - 20, 
          `-${CONFIG.BULLETS.COST}`, 
          [255, 180, 100]
        );
      }
      
      // Add screen shake
      this.particleManager.addScreenShake(CONFIG.EFFECTS.SHAKE.SHOOT);
    } catch (e) {
      console.error("Error processing shot:", e);
    }
  }
  
  /**
   * Handle key press events
   */
  keyPressed() {
    if (this.game_over && keyCode === ENTER) {
      this.resetGame();
    } else if (!this.game_over && keyCode === ESCAPE) {
      // ESC key to end the game manually
      this.endGame("quit");
    }
  }
  
  /**
   * Handle window resize events
   */
  windowResized() {
    // Update bullet manager speed based on new dimensions
    if (this.bulletManager) {
      this.bulletManager.updateBulletSpeed();
    }
    
    // Update other components
    this.player.windowResized(width, height);
    this.enemyManager.windowResized(height);
    this.particleManager.windowResized(width, height);
  }
  
  /**
   * Display feedback after an answer
   */
  drawFeedback() {
    if (this.feedback.timer > 0) {
      push();
      textAlign(CENTER);
      textSize(CONFIG.UI.getTextSize() * 1.2);
      fill(this.feedback.color[0], this.feedback.color[1], this.feedback.color[2], 
           map(this.feedback.timer, 0, 2000, 0, 255));
      // Position relative to screen height
      text(this.feedback.text, width/2, height * 0.16);
      pop();
    }
  }
  
  /**
   * Show feedback message
   * @param {string} text - Message to display
   * @param {Array} color - RGB color array
   * @param {number} duration - How long to show the message in ms
   */
  showFeedback(text, color, duration = 2000) {
    this.feedback = {
      text: text,
      color: color,
      timer: duration
    };
  }
  
  /**
   * Check if an enemy is the key enemy
   * @param {number} index - Index to check
   * @returns {boolean} True if this is the key enemy
   */
  isKeyEnemy(index) {
    if (index < 0 || index >= this.enemies.length) {
      console.error(`Invalid enemy index: ${index}`);
      return false;
    }
    
    const enemy = this.enemies[index];
    // Use the stored cityIndex to check if this is the correct answer
    const isCorrect = enemy.cityIndex === this.keyEnemyIndex;
    
    // Debug the check
    console.log(`Checking enemy ${index}: ${enemy.cityName, isCorrect} (cityIndex=${enemy.cityIndex}, keyIndex=${this.keyEnemyIndex})`);
    
    return isCorrect;
  }
  
  /**
   * Check if player hit a correct or incorrect answer
   * @param {boolean} isCorrect - Whether player hit the correct answer
   */
  recordAnswer(isCorrect) {
    if (isCorrect) {
      this.stats.correctAnswers++;
    } else {
      this.stats.wrongAnswers++;
    }
  }
}

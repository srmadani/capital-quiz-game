/**
 * Manages enemies, their behavior and rendering
 */
class EnemyManager {
  /**
   * Create a new enemy manager
   */
  constructor() {
    this.enemies = [];
    this.keyEnemyIndex = -1;
    this.enemySize = CONFIG.ENEMY.SIZE;
    this.enemyBaseSpeed = 0;
    this.waveStartTime = 0;
    this.cities = [];
  }
  
  /**
   * Initialize enemy settings
   * @param {number} height - Canvas height for calculating enemy speed
   */
  setup(height) {
    this.updateSize();
    
    // Calculate speed based on exactly 20 seconds to reach bottom
    const TIME_TO_REACH_BOTTOM = 20; // seconds
    this.enemyBaseSpeed = height / TIME_TO_REACH_BOTTOM;
  }
  
  /**
   * Update enemy size based on screen dimensions
   */
  updateSize() {
    this.enemySize = CONFIG.ENEMY.getSize();
  }
  
  /**
   * Begin a new wave of enemies with cities
   * @param {number} wave - Current wave number
   * @param {number} width - Canvas width
   * @param {Array} cities - Array of city names to display
   * @param {number} correctIndex - Index of the correct city (0-based)
   * @returns {Array} The created enemies
   */
  startNewWave(wave, width, cities, correctIndex) {
    // Update enemy size for responsive design
    this.updateSize();
    
    // Always create exactly CONFIG.ENEMY.COUNT enemies with good spacing
    let spacing = width / 6;
    this.enemies = [];
    this.cities = cities || ["Missing", "City", "Data", "Error"];
    
    // Check if correctIndex is valid
    if (correctIndex === undefined || correctIndex < 0 || correctIndex >= this.cities.length) {
      correctIndex = Math.floor(Math.random() * Math.min(CONFIG.ENEMY.COUNT, this.cities.length));
    }
    
    // Set key enemy based on correct index
    this.keyEnemyIndex = correctIndex;
    
    // Ensure exactly CONFIG.ENEMY.COUNT enemies
    let positions = [1, 2, 3, 4]; // Use positions 1, 2, 3, 4
    
    for (let i = 0; i < Math.min(CONFIG.ENEMY.COUNT, cities.length); i++) {
      let xPos = spacing * (positions[i] + 0.5); // Offset to center between grid lines
      
      // Store the city index with the enemy for reference
      let cityIndex = i;
      let isCorrectCity = (cityIndex === correctIndex);
      
      this.enemies.push({
        x: xPos,
        y: -50 - i * 30, // Stagger vertical starting positions
        originalX: xPos,
        cityName: this.cities[i] || "Unknown",
        cityIndex: cityIndex, // Store the index of this city in the data
        size: this.enemySize,
        hitsTaken: 0,
        hitsNeeded: this.getHitsNeededForWave(wave),
        shrinking: false,
        hitAnimation: 0,
        speed: this.enemyBaseSpeed * random(0.8, 1.2), // Slight speed variation
        isCorrect: isCorrectCity // Explicitly mark if this is the correct answer
      });
    }
    
    // Always use exactly 20 seconds for the wave timer
    this.waveTimeEstimate = 20;
    
    this.waveStartTime = millis();
    return this.enemies;
  }
  
  /**
   * Calculate hits needed to destroy enemies based on wave number
   * Can be used to increase difficulty in later waves
   * @param {number} wave - Current wave number
   * @returns {number} Hits needed to destroy an enemy
   */
  getHitsNeededForWave(wave) {
    // For now, always 1 hit. Can be changed for difficulty progression
    return 1;
  }
  
  /**
   * Update enemy positions and check for collisions
   * @param {number} width - Canvas width
   * @param {number} height - Canvas height
   * @param {Player} player - Player object for collision detection
   * @param {ParticleManager} particleManager - For visual effects
   * @param {number} deltaTime - Time since last frame in ms
   * @returns {boolean} True if game should end (player collision or enemies passed)
   */
  update(width, height, player, particleManager, deltaTime) {
    let gameOver = false;
    
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      let enemy = this.enemies[i];
      
      // Handle shrinking enemies (after being hit)
      if (enemy.shrinking) {
        enemy.size -= 2; // Speed up shrinking
        
        if (enemy.size <= 10) {
          console.log(`Enemy ${enemy.cityName} destroyed after shrinking`);
          particleManager.createExplosion(enemy.x, enemy.y, 20, 150);
          this.enemies.splice(i, 1);
          continue;
        }
      }
      
      if (enemy.shrinking) {
        enemy.size -= 1;
        if (enemy.size <= 10) {
          particleManager.createExplosion(enemy.x, enemy.y, 20, 150);
          this.enemies.splice(i, 1);
          continue;
        }
      }
      
      // Update enemy position
      this.updateEnemyPosition(enemy, width, deltaTime);
      
      // Check if enemy has passed the player vertically
      if (enemy.y > height) {
        // Force the timer to expire when enemy passes bottom
        this.waveStartTime = 0; // Set to expired
        
        // Save the correct city name to show in feedback
        if (typeof gameManager !== 'undefined' && gameManager.showFeedback) {
          // Find the name of the correct city
          let correctCity = "";
          for (let j = 0; j < this.enemies.length; j++) {
            if (this.enemies[j].cityIndex === this.keyEnemyIndex) {
              correctCity = this.enemies[j].cityName;
              break;
            }
          }
          
          if (correctCity) {
            gameManager.showFeedback(`Correct answer: ${correctCity}`, [255, 50, 50], 3000);
          }
        }
        
        gameOver = true;
        particleManager.addScreenShake(CONFIG.EFFECTS.SHAKE.GAME_OVER);
        continue;
      }
      
      // Check for collision with player
      if (!player.isDestroyed && this.checkPlayerCollision(enemy, player)) {
        gameOver = true;
        player.destroy();
        particleManager.createExplosion(player.x, player.y, 50, 255);
        particleManager.addScreenShake(CONFIG.EFFECTS.SHAKE.GAME_OVER);
      }
      
      // Handle collisions between enemies
      this.handleEnemyCollisions(enemy, i, deltaTime);
      
      // Draw the enemy
      this.drawEnemy(enemy, i);
    }
    
    return gameOver;
  }
  
  /**
   * Update an enemy's position
   * @param {Object} enemy - Enemy to update
   * @param {number} width - Canvas width
   * @param {number} deltaTime - Time since last frame in ms
   */
  updateEnemyPosition(enemy, width, deltaTime) {
    // Calculate movement with oscillation - use enemy.cityName as source of variability
    let seed = enemy.cityName.charCodeAt(0) || 0; // Use first character of city name for consistency
    let oscillation = sin(frameCount * 0.01 + seed * 0.1) * (width * 0.03);
    
    // Keep enemies more on their original path with less center movement
    let centerX = width / 2;
    let distanceToCenter = centerX - enemy.originalX;
    let horizontalMove = distanceToCenter * 0.005; // Reduced center pull
    
    enemy.originalX += horizontalMove * (deltaTime / 1000);
    enemy.x = enemy.originalX + oscillation;
    
    // Move downward with calculated speed
    enemy.y += enemy.speed * (deltaTime / 1000);
  }
  
  /**
   * Check if an enemy has collided with the player
   * @param {Object} enemy - The enemy to check
   * @param {Player} player - The player object
   * @returns {boolean} True if collision detected
   */
  checkPlayerCollision(enemy, player) {
    // IMPROVED collision detection with player - more accurate
    // Use circular collision detection based on sizes
    let dx = enemy.x - player.x;
    let dy = enemy.y - player.y;
    let distance = sqrt(dx * dx + dy * dy);
    let minDistance = (enemy.size + player.size) * 0.4; // Adjust hitbox size for better gameplay
    
    return distance < minDistance;
  }
  
  /**
   * Handle collisions between enemies for more natural movement
   * @param {Object} enemy - Current enemy
   * @param {number} index - Index of current enemy
   * @param {number} deltaTime - Time since last frame in ms
   */
  handleEnemyCollisions(enemy, index, deltaTime) {
    for (let j = 0; j < this.enemies.length; j++) {
      if (index !== j) {
        let otherEnemy = this.enemies[j];
        let dx = enemy.x - otherEnemy.x;
        let dy = enemy.y - otherEnemy.y;
        let distance = sqrt(dx*dx + dy*dy);
        let minDistance = enemy.size * 1.2; // Keep further apart
        
        if (distance < minDistance) {
          // Horizontal avoidance - push enemies apart
          let pushForce = (minDistance - distance) * 0.1;
          let pushX = dx * pushForce / distance;
          
          // Apply force to original position to avoid oscillation conflicts
          if (dx !== 0) { // Avoid division by zero
            enemy.originalX += pushX * (deltaTime / 100);
            otherEnemy.originalX -= pushX * (deltaTime / 100);
          }
          
          // Adjust speeds if one is above the other
          if (enemy.y > otherEnemy.y) {
            enemy.speed *= 1.01; // Speed up lower enemy
            otherEnemy.speed *= 0.99; // Slow down higher enemy
          } else {
            enemy.speed *= 0.99; // Slow down higher enemy
            otherEnemy.speed *= 1.01; // Speed up lower enemy
          }
          
          // Keep speeds within reasonable bounds
          enemy.speed = constrain(enemy.speed, this.enemyBaseSpeed * 0.7, this.enemyBaseSpeed * 1.3);
          otherEnemy.speed = constrain(otherEnemy.speed, this.enemyBaseSpeed * 0.7, this.enemyBaseSpeed * 1.3);
        }
      }
    }
  }
  
  /**
   * Draw a single enemy
   * @param {Object} enemy - The enemy to draw
   * @param {number} index - Index of the enemy
   */
  drawEnemy(enemy, index) {
    push();
    let time = millis() * 0.001;
    let pulseFactor = map(sin(time * 2 + index), -1, 1, 0.9, 1.1);
    let size = enemy.size * pulseFactor;
    
    strokeWeight(1);
    
    // Create a more intimidating, sharp design
    translate(enemy.x, enemy.y);
    
    // Add subtle rotation based on movement
    let rotAngle = sin(frameCount * 0.01 + index) * 0.1;
    rotate(rotAngle);
    
    // Draw glitchy enemy base
    if (enemy.hitAnimation > 0) {
      stroke(255);
      strokeWeight(1.5); // Thicker stroke when hit
      enemy.hitAnimation--;
    } else {
      // If this is the correct answer, add a subtle pulsing color
      if (index === this.keyEnemyIndex) {
        // Very subtle hint - almost imperceptible
        let correctPulse = map(sin(frameCount * 0.05), -1, 1, 0, 15);
        stroke(255, 255 - correctPulse, 255 - correctPulse);
      } else {
        stroke(255);
      }
      strokeWeight(1);
    }
    
    noFill();
    
    // Draw main enemy shape
    this.drawEnemyShape(enemy, size);
    
    // Draw inner details
    this.drawEnemyInnerDetails(enemy, time, size);
    
    // Add random glitch effects
    this.drawEnemyGlitchEffects(enemy, size);
    
    // Draw city name instead of enemy label
    this.drawCityName(enemy);
    
    pop();
  }
  
  /**
   * Draw the main shape of an enemy
   * @param {Object} enemy - The enemy to draw
   * @param {number} size - Current size factoring in pulse
   */
  drawEnemyShape(enemy, size) {
    beginShape();
    for (let i = 0; i < 6; i++) {
      let angle = TWO_PI * i / 6;
      let spikeLength = size/2;
      
      // All enemies have some uneven spikes
      if (i % 2 === 0) {
        spikeLength *= 1.2;
      }
      
      // Add slight glitching to shapes
      if (random() > 0.95) {
        spikeLength *= random(0.9, 1.1);
      }
      
      let x = cos(angle) * spikeLength;
      let y = sin(angle) * spikeLength;
      vertex(x, y);
    }
    endShape(CLOSE);
  }
  
  /**
   * Draw the inner details of an enemy
   * @param {Object} enemy - The enemy to draw
   * @param {number} time - Current time for animation
   * @param {number} size - Current size factoring in pulse
   */
  drawEnemyInnerDetails(enemy, time, size) {
    // Generate a random value for each enemy that stays consistent
    let randomVal = noise(enemy.x * 0.01, enemy.y * 0.01, time * 0.1);
    
    push();
    stroke(255, 170);
    strokeWeight(0.8);
    
    // Randomly choose between various inner designs
    if (enemy.innerShape === undefined) {
      // Generate a consistent inner shape for this enemy
      let shapes = ['cross', 'triangle', 'circle', 'spiral', 'square'];
      enemy.innerShape = shapes[floor(random(shapes.length))];
      // Random rotation direction
      enemy.rotationDir = random() > 0.5 ? 1 : -1;
      // Random rotation speed
      enemy.rotationSpeed = random(0.1, 0.4);
      // Inner size
      enemy.innerSize = random(0.25, 0.4) * size;
    }
    
    // Apply rotation
    rotate(time * enemy.rotationSpeed * enemy.rotationDir);
    
    // Draw the assigned inner shape
    switch(enemy.innerShape) {
      case 'cross':
        line(-enemy.innerSize, 0, enemy.innerSize, 0);
        line(0, -enemy.innerSize, 0, enemy.innerSize);
        break;
      case 'triangle':
        beginShape();
        for (let i = 0; i < 3; i++) {
          let angle = TWO_PI * i / 3;
          vertex(cos(angle) * enemy.innerSize, sin(angle) * enemy.innerSize);
        }
        endShape(CLOSE);
        break;
      case 'circle':
        ellipse(0, 0, enemy.innerSize * 2, enemy.innerSize * 2);
        break;
      case 'spiral':
        for (let i = 0; i < 5; i++) {
          let angle = i * PI/3;
          let radius = i * enemy.innerSize/5;
          point(cos(angle) * radius, sin(angle) * radius);
        }
        break;
      case 'square':
        rectMode(CENTER);
        rect(0, 0, enemy.innerSize * 1.5, enemy.innerSize * 1.5);
        break;
    }
    
    pop();
  }
  
  /**
   * Draw random glitch effects on enemies
   * @param {Object} enemy - The enemy to draw
   * @param {number} size - Current size factoring in pulse
   */
  drawEnemyGlitchEffects(enemy, size) {
    if (random() > 0.97) {
      push();
      stroke(255, random(50, 150));
      let glitchStyle = floor(random(3));
      
      switch(glitchStyle) {
        case 0: // Horizontal line
          line(-size/2, random(-size/2, size/2), size/2, random(-size/2, size/2));
          break;
        case 1: // Vertical line
          line(random(-size/2, size/2), -size/2, random(-size/2, size/2), size/2);
          break;
        case 2: // Random dots
          for (let i = 0; i < 5; i++) {
            point(random(-size/2, size/2), random(-size/2, size/2));
          }
          break;
      }
      pop();
    }
  }
  
  /**
   * Draw the city name on an enemy
   * @param {Object} enemy - The enemy to draw
   */
  drawCityName(enemy) {
    noStroke();
    fill(255);
    textFont('monospace');
    // Make text size responsive
    let fontSize = map(min(width, height), 300, 1200, 12, 16);
    textSize(fontSize);
    textAlign(CENTER, CENTER);
    
    // Position text ABOVE the enemy instead of directly on it
    // Add a vertical offset proportional to enemy size
    let textYOffset = -enemy.size * 0.7;
    
    // Occasionally glitch the text position
    if (random() > 0.95) {
      text(enemy.cityName, random(-2, 2), textYOffset + random(-2, 2));
    } else {
      text(enemy.cityName, 0, textYOffset);
    }
    
    // Optionally draw a connecting line from text to enemy
    if (enemy.isCorrect) {
      // Very subtle hint with connecting line for correct answer
      stroke(255, 60);
      strokeWeight(0.5);
      line(0, textYOffset + fontSize/2, 0, -enemy.size * 0.4);
    }
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
   * Get remaining time in the current wave
   * @param {number} waveTimeLimit - Total time allowed for the wave
   * @returns {number} Seconds remaining
   */
  getTimeRemaining(waveTimeLimit) {
    // Check for game_over status before calculating time
    if (typeof gameManager !== 'undefined' && gameManager.game_over) {
      return 0; // No time left if game is over
    }
    
    // Always use our fixed estimate of 20 seconds for consistency
    const effectiveTimeLimit = 20;
    
    let timeElapsed = (millis() - this.waveStartTime) / 1000;
    return Math.max(0, effectiveTimeLimit - timeElapsed); // Always return at least 0
  }
  
  /**
   * Handle window resizing
   * @param {number} height - New canvas height
   */
  windowResized(height) {
    this.updateSize();
    this.enemyBaseSpeed = height / CONFIG.ENEMY.BASE_SPEED_FACTOR;
    
    // Update enemy sizes
    for (let enemy of this.enemies) {
      enemy.size = this.enemySize;
    }
  }
}

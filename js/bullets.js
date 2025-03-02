/**
 * Manages bullet creation, movement and collision detection
 */
class BulletManager {
  /**
   * Create a new bullet manager
   */
  constructor() {
    this.bullets = [];
    this.updateBulletSpeed();
  }
  
  /**
   * Update bullet speed based on screen size
   */
  updateBulletSpeed() {
    this.bulletSpeed = CONFIG.BULLETS.getSpeed();
  }
  
  /**
   * Create a new bullet
   * @param {number} x - Starting x position
   * @param {number} y - Starting y position
   * @param {number} targetX - Target x position
   * @param {number} targetY - Target y position
   */
  createBullet(x, y, targetX, targetY) {
    let angle = atan2(targetY - y, targetX - x);
    let dx = this.bulletSpeed * cos(angle);
    let dy = this.bulletSpeed * sin(angle);
    this.bullets.push({
      x: x, 
      y: y - 20, 
      dx: dx, 
      dy: dy
    });
    
    console.log("Bullet created at", x, y, "targeting", targetX, targetY);
  }
  
  /**
   * Update bullets and check for collisions
   * @param {number} deltaTime - Time since last frame in ms
   * @param {Array} enemies - Array of enemies to check for collisions
   * @param {EnemyManager} enemyManager - Enemy manager for key enemy check
   * @param {ParticleManager} particleManager - For visual effects
   * @param {number} score - Current score
   * @returns {number} Updated score after hits
   */
  update(deltaTime, enemies, enemyManager, particleManager, score) {
    let updatedScore = score;
    
    // Debug information
    if (this.bullets.length > 0) {
      console.log(`Active bullets: ${this.bullets.length}, Enemies: ${enemies.length}`);
    }
    
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      let bullet = this.bullets[i];
      
      // Update bullet position
      bullet.x += bullet.dx * (deltaTime / 1000);
      bullet.y += bullet.dy * (deltaTime / 1000);
      
      // Remove bullets that go off-screen
      if (this.isOffScreen(bullet)) {
        this.bullets.splice(i, 1);
        continue;
      }
      
      // Draw the bullet
      this.drawBullet(bullet);
      
      // Check for collisions with enemies
      let hitResult = this.checkEnemyCollisions(
        bullet, i, enemies, enemyManager, particleManager
      );
      
      if (hitResult.hit) {
        // Remove the bullet if it hit something
        this.bullets.splice(i, 1);
        console.log("Bullet hit detected, bullet removed");
        
        // Update score
        updatedScore += hitResult.points;
      }
    }
    
    return updatedScore;
  }
  
  /**
   * Check if a bullet is off-screen
   * @param {Object} bullet - The bullet to check
   * @returns {boolean} True if bullet is off screen
   */
  isOffScreen(bullet) {
    return bullet.x < 0 || bullet.x > width || bullet.y < 0 || bullet.y > height;
  }
  
  /**
   * Draw a bullet with trail
   * @param {Object} bullet - The bullet to draw
   */
  drawBullet(bullet) {
    push();
    stroke(255);
    // Scale strokeWeight based on screen size
    let strokeW = map(min(width, height), 300, 1200, 0.5, 1);
    strokeWeight(strokeW);
    line(bullet.x, bullet.y, bullet.x - bullet.dx * 0.01, bullet.y - bullet.dy * 0.01);
    
    noStroke();
    fill(255);
    // Scale bullet size based on screen size
    let bulletSize = map(min(width, height), 300, 1200, 2, 3);
    ellipse(bullet.x, bullet.y, bulletSize, bulletSize);
    pop();
  }
  
  /**
   * Check for and handle bullet collisions with enemies
   * @param {Object} bullet - Current bullet
   * @param {number} bulletIndex - Index of current bullet
   * @param {Array} enemies - Array of enemies
   * @param {EnemyManager} enemyManager - Enemy manager for key enemy check
   * @param {ParticleManager} particleManager - For visual effects
   * @returns {Object} Result with hit status and points earned
   */
  checkEnemyCollisions(bullet, bulletIndex, enemies, enemyManager, particleManager) {
    let result = { hit: false, points: 0 };
    
    // Debug print enemy positions and bullet positions
    if (enemies.length > 0 && frameCount % 60 === 0) {
      console.log(`Checking bullet (${bullet.x}, ${bullet.y}) against ${enemies.length} enemies`);
    }
    
    for (let j = enemies.length - 1; j >= 0; j--) {
      let enemy = enemies[j];
      
      // Calculate distance for improved collision detection
      let dx = bullet.x - enemy.x;
      let dy = bullet.y - enemy.y;
      let distance = sqrt(dx * dx + dy * dy);
      let hitThreshold = enemy.size / 2;
      
      // Check collision with improved distance-based check
      if (distance < hitThreshold) {
        console.log(`HIT: ${enemy.cityName} at (${enemy.x}, ${enemy.y})`);
        
        // Create hit particles
        particleManager.createExplosion(bullet.x, bullet.y, 5, 100);
        
        // Apply screen shake
        particleManager.addScreenShake(CONFIG.EFFECTS.SHAKE.HIT);
        
        result.hit = true;
        
        // Check if this city is the correct answer
        let isCorrect = (enemy.cityIndex === enemyManager.keyEnemyIndex);
        console.log(`Enemy hit: ${enemy.cityName}, correct: ${isCorrect}`);
        
        // Update statistics in gameManager if available
        if (typeof gameManager !== 'undefined') {
          gameManager.recordAnswer(isCorrect);
        }
        
        if (isCorrect) {
          // Correct answer! Remove all enemies
          console.log(`CORRECT ANSWER: ${enemy.cityName}`);
          result.points = CONFIG.WAVES.POINTS.KEY_ENEMY;
          
          // Create explosions for all enemies
          for (let k = 0; k < enemies.length; k++) {
            particleManager.createExplosion(enemies[k].x, enemies[k].y, 30, 255);
          }
          
          // Increase screen shake and glitch effect
          particleManager.addScreenShake(CONFIG.EFFECTS.SHAKE.EXPLOSION);
          particleManager.setGlitchIntensity(CONFIG.EFFECTS.GLITCH.EXPLOSION);
          
          // Show correct answer feedback
          if (typeof gameManager !== 'undefined' && gameManager.showFeedback) {
            gameManager.showFeedback(`CORRECT! ${enemy.cityName} is the capital`, [100, 255, 100]);
          }
          
          // Clear all enemies - use while loop for more reliable clearing
          console.log(`Clearing all enemies (${enemies.length})`);
          while(enemies.length > 0) {
            enemies.pop();
          }
        } else {
          // Wrong answer! Just remove this enemy
          console.log(`WRONG ANSWER: ${enemy.cityName}`);
          particleManager.createExplosion(enemy.x, enemy.y, 15, 150);
          
          // Show more dramatic wrong answer feedback
          if (typeof gameManager !== 'undefined' && gameManager.showFeedback) {
            const wrongMessages = [
              `TOTALLY WRONG! ${enemy.cityName} is not correct!`, 
              `NOPE! ${enemy.cityName} is not the capital!`,
              `INCORRECT! Learn your capitals!`
            ];
            const randomMessage = wrongMessages[Math.floor(random(wrongMessages.length))];
            gameManager.showFeedback(randomMessage, [255, 80, 80], 2500);
          }
          
          // Add more dramatic visual feedback for wrong answer
          particleManager.addScreenShake(CONFIG.EFFECTS.SHAKE.HIT * 1.5);
          particleManager.setGlitchIntensity(CONFIG.EFFECTS.GLITCH.HIT * 1.5);
          
          // Create "WRONG!" text particle
          if (typeof particleManager.createTextParticle === 'function') {
            particleManager.createTextParticle(
              enemy.x, 
              enemy.y - 30, 
              "WRONG!", 
              [255, 80, 80]
            );
          }
          
          // Mark for shrinking instead of immediate removal
          enemy.shrinking = true;
          enemy.hitAnimation = 15;
          
          // Apply score penalty
          result.points = CONFIG.WAVES.POINTS.WRONG_ANSWER;
        }
        
        // We found a collision, so we can break out of the loop
        break;
      }
    }
    
    return result;
  }
}

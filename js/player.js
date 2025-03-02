/**
 * Player class handling movement, rendering and player state
 */
class Player {
  /**
   * Create a new player
   */
  constructor() {
    this.x = 0;
    this.y = 0;
    this.speed = CONFIG.PLAYER.SPEED;
    this.lastShotTime = 0;
    this.isDestroyed = false;
    this.trail = [];
    this.size = 15; // Will be updated to responsive size
    
    // Ship animation properties
    this.rotationOffset = 0;
    this.thrusterAnimation = 0;
    this.shootPulse = 0;
    this.engineFlicker = 0;
    this.wingAnimation = 0;
    this.colorPulse = 0;
  }
  
  /**
   * Set up the player
   * @param {number} width - Canvas width
   * @param {number} height - Canvas height
   */
  setup(width, height) {
    // Position player at bottom center of screen
    this.x = width / 2;
    this.y = height * 0.85;
    this.updateSize();
    this.resetState();
  }
  
  /**
   * Reset player animation state
   */
  resetState() {
    this.rotationOffset = 0;
    this.thrusterAnimation = 0;
    this.shootPulse = 0;
    this.engineFlicker = 0;
    this.wingAnimation = 0;
    this.colorPulse = 0;
    this.isDestroyed = false;
  }
  
  /**
   * Update player size based on screen dimensions
   */
  updateSize() {
    this.size = CONFIG.PLAYER.getSize();
  }
  
  /**
   * Update player position and state
   * @param {number} deltaTime - Time since last frame in ms
   */
  update(deltaTime) {
    if (this.isDestroyed) return;
    
    // Update animation values
    this.thrusterAnimation = (this.thrusterAnimation + deltaTime * 0.01) % (Math.PI * 2);
    this.engineFlicker = (noise(millis() * 0.01) * 255); // Perlin noise for flickering
    this.wingAnimation = sin(millis() * 0.002) * 0.15; // Wing "breathing" animation
    
    // Decrease pulse effect over time
    if (this.shootPulse > 0) {
      this.shootPulse -= deltaTime * 0.003;
      if (this.shootPulse < 0) this.shootPulse = 0;
    }
    
    // Decrease color pulse effect
    if (this.colorPulse > 0) {
      this.colorPulse -= deltaTime * 0.003;
      if (this.colorPulse < 0) this.colorPulse = 0;
    }
    
    // Save previous position for trail
    if (frameCount % 2 === 0) {
      this.trail.push({x: this.x, y: this.y});
      if (this.trail.length > CONFIG.PLAYER.MAX_TRAIL) {
        this.trail.shift();
      }
    }
    
    // Handle keyboard movement
    let moveSpeed = this.speed * (deltaTime / 1000);
    let hasMoved = false;
    
    if (keyIsDown(LEFT_ARROW)) {
      this.x -= moveSpeed;
      this.rotationOffset = lerp(this.rotationOffset, -0.2, 0.1); // Bank left
      hasMoved = true;
    } else if (keyIsDown(RIGHT_ARROW)) {
      this.x += moveSpeed;
      this.rotationOffset = lerp(this.rotationOffset, 0.2, 0.1); // Bank right
      hasMoved = true;
    } else {
      // Return to neutral position when not moving
      this.rotationOffset = lerp(this.rotationOffset, 0, 0.1);
    }
    
    // Add touch controls for mobile
    if (CONFIG.isMobileDevice() && touches.length > 0) {
      // Calculate the horizontal distance from touch to player
      let touchX = touches[0].x;
      let distX = touchX - this.x;
      
      // Move player toward touch position
      if (Math.abs(distX) > this.size/2) {
        this.x += Math.sign(distX) * moveSpeed;
        this.rotationOffset = lerp(this.rotationOffset, Math.sign(distX) * 0.2, 0.1); // Bank in direction of movement
        hasMoved = true;
      } else {
        // Return to neutral position when not moving
        this.rotationOffset = lerp(this.rotationOffset, 0, 0.1);
      }
    }
    
    // Keep player within screen bounds
    this.x = constrain(this.x, this.size, width - this.size);
  }
  
  /**
   * Draw the player
   */
  draw() {
    if (this.isDestroyed) return;
    
    push();
    translate(this.x, this.y);
    
    // Apply rotation offset for banking
    rotate(this.rotationOffset);
    
    // Draw thruster effects (behind the ship)
    this.drawThrusters();
    
    // Draw firing effect if recently shot
    if (this.shootPulse > 0) {
      this.drawFiringEffect();
    }
    
    // Draw the ship itself
    this.drawShip();
    
    // Draw the ship trail
    this.drawTrail();
    
    pop();
  }
  
  /**
   * Draw thruster effects
   */
  drawThrusters() {
    push();
    
    // Add slight variation to engine color
    let engineBrightness = 150 + this.engineFlicker;
    
    // Main engine
    fill(200, engineBrightness, 255, 180);
    noStroke();
    
    // Thruster flame size changes with flicker
    let flameSize = this.size * 0.6 * (0.8 + sin(this.thrusterAnimation * 5) * 0.2);
    
    // Create triangular flame effect
    beginShape();
    vertex(0, this.size * 0.5); // Center
    vertex(-this.size * 0.3, this.size * 0.7);
    vertex(0, this.size * 0.5 + flameSize);
    vertex(this.size * 0.3, this.size * 0.7);
    endShape(CLOSE);
    
    // Side engines
    let sideFlameSize = this.size * 0.3 * (0.7 + sin(this.thrusterAnimation * 4 + 1) * 0.3);
    
    // Left thruster
    fill(150, engineBrightness, 255, 150);
    beginShape();
    vertex(-this.size * 0.45, this.size * 0.3);
    vertex(-this.size * 0.55, this.size * 0.4);
    vertex(-this.size * 0.45, this.size * 0.3 + sideFlameSize);
    vertex(-this.size * 0.35, this.size * 0.4);
    endShape(CLOSE);
    
    // Right thruster
    beginShape();
    vertex(this.size * 0.45, this.size * 0.3);
    vertex(this.size * 0.55, this.size * 0.4);
    vertex(this.size * 0.45, this.size * 0.3 + sideFlameSize);
    vertex(this.size * 0.35, this.size * 0.4);
    endShape(CLOSE);
    
    pop();
  }
  
  /**
   * Draw the ship itself
   */
  drawShip() {
    push();
    
    // Apply pulse effect when shooting
    let pulseMagnitude = 1 + this.shootPulse * 0.3;
    
    // Base ship color with pulse effect
    let r = 200 + this.colorPulse * 55;
    let g = 200 + this.colorPulse * 25;
    let b = 255;
    
    // Main ship body
    fill(r, g, b);
    stroke(50, 120, 250);
    strokeWeight(1);
    
    // Core fuselage
    beginShape();
    vertex(0, -this.size * 0.6 * pulseMagnitude); // Nose
    vertex(-this.size * 0.3, this.size * 0.1); // Left hull
    vertex(-this.size * 0.2, this.size * 0.3); // Left back
    vertex(0, this.size * 0.4); // Center back
    vertex(this.size * 0.2, this.size * 0.3); // Right back
    vertex(this.size * 0.3, this.size * 0.1); // Right hull
    endShape(CLOSE);
    
    // Wings with animation effect
    let wingSpread = 1 + this.wingAnimation;
    
    // Left wing
    fill(180, 180, 240);
    beginShape();
    vertex(-this.size * 0.2, 0);
    vertex(-this.size * 0.5 * wingSpread, this.size * 0.1);
    vertex(-this.size * 0.45, this.size * 0.3);
    vertex(-this.size * 0.2, this.size * 0.3);
    endShape(CLOSE);
    
    // Right wing
    beginShape();
    vertex(this.size * 0.2, 0);
    vertex(this.size * 0.5 * wingSpread, this.size * 0.1);
    vertex(this.size * 0.45, this.size * 0.3);
    vertex(this.size * 0.2, this.size * 0.3);
    endShape(CLOSE);
    
    // Cockpit windows
    fill(180 + this.colorPulse * 75, 220 + this.colorPulse * 35, 255);
    noStroke();
    ellipse(0, -this.size * 0.2, this.size * 0.15, this.size * 0.15);
    
    // Add some tech details to fuselage
    stroke(100, 180, 255);
    strokeWeight(0.5);
    line(-this.size * 0.1, -this.size * 0.4, -this.size * 0.1, this.size * 0.1);
    line(this.size * 0.1, -this.size * 0.4, this.size * 0.1, this.size * 0.1);
    
    pop();
  }
  
  /**
   * Draw trail effect
   */
  drawTrail() {
    // Already drawn trail in update method - adding additional "pulse" for shooting
    if (this.shootPulse > 0) {
      push();
      strokeWeight(this.shootPulse * 4);
      stroke(100, 200, 255, this.shootPulse * 200);
      noFill();
      ellipse(0, 0, this.size * 3, this.size * 3);
      pop();
    }
  }
  
  /**
   * Draw effects when firing weapons
   */
  drawFiringEffect() {
    push();
    // Weapon muzzle flash
    noStroke();
    
    // Left cannon
    fill(255, 200 + random(55), 50 + random(50), 200 * this.shootPulse);
    ellipse(-this.size * 0.3, -this.size * 0.2, this.size * 0.15 * this.shootPulse, this.size * 0.15 * this.shootPulse);
    
    // Right cannon
    fill(255, 200 + random(55), 50 + random(50), 200 * this.shootPulse);
    ellipse(this.size * 0.3, -this.size * 0.2, this.size * 0.15 * this.shootPulse, this.size * 0.15 * this.shootPulse);
    pop();
  }
  
  /**
   * Check if player can shoot based on cooldown
   * @returns {boolean} Whether the player can shoot
   */
  canShoot() {
    return !this.isDestroyed && millis() - this.lastShotTime > CONFIG.PLAYER.SHOOTING_COOLDOWN;
  }
  
  /**
   * Mark that the player has shot
   */
  shoot() {
    this.lastShotTime = millis();
    
    // Add visual pulse effect when shooting
    this.shootPulse = 1.0;
    this.colorPulse = 1.0;
  }
  
  /**
   * Handle window resize
   * @param {number} width - New canvas width
   * @param {number} height - New canvas height
   */
  windowResized(width, height) {
    this.x = constrain(this.x, this.size, width - this.size);
    this.y = height * 0.85;
    this.updateSize();
  }
  
  /**
   * Destroy the player
   */
  destroy() {
    this.isDestroyed = true;
  }
}

/**
 * Manages visual effects including particles, screen shake, and background effects
 */
class ParticleManager {
  /**
   * Create a new particle manager
   */
  constructor() {
    this.particles = [];
    this.stars = [];
    this.screenShake = 0;
    this.glitchIntensity = 0;
    this.gridSize = 40; // Will be updated based on screen size
  }
  
  /**
   * Set up the particle system
   * @param {number} width - Canvas width
   * @param {number} height - Canvas height
   */
  setup(width, height) {
    // Calculate responsive grid size
    this.updateGridSize();
    
    // Create stars for background
    const starCount = Math.floor(width * height / 5000); // Density based on screen area
    for (let i = 0; i < starCount; i++) {
      this.stars.push({
        x: random(width),
        y: random(height),
        size: random(0.5, 2),
        twinkle: random(0.01, 0.05)
      });
    }
  }
  
  /**
   * Update grid size based on screen dimensions
   */
  updateGridSize() {
    // Scale grid with screen size - smaller grid on smaller screens
    this.gridSize = max(20, min(width, height) / 20);
  }
  
  /**
   * Create an explosion of particles
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} count - Number of particles
   * @param {number} size - Size of explosion
   */
  createExplosion(x, y, count, size) {
    // Scale particle count based on screen size for performance
    let scaledCount = count;
    if (width < 600 || height < 600) {
      scaledCount = Math.floor(count * 0.7); // Reduce particles on small screens
    }
    
    for (let i = 0; i < scaledCount; i++) {
      let angle = random(TWO_PI);
      let speed = random(1, 5) * (size / 50);
      let life = random(200, 600);
      let particleSize = random(1, 3) * (size / 50);
      
      // Scale particle size with screen dimensions
      particleSize = map(min(width, height), 300, 1200, particleSize * 0.7, particleSize * 1.2);
      
      this.particles.push({
        x: x,
        y: y,
        vx: cos(angle) * speed,
        vy: sin(angle) * speed,
        life: life,
        maxLife: life,
        size: particleSize,
        color: [255, 255, 255]
      });
    }
  }
  
  /**
   * Create a text particle for feedback
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {string} text - Text to display
   * @param {Array} color - RGB color array
   */
  createTextParticle(x, y, text, color = [255, 255, 255]) {
    this.particles.push({
      x: x,
      y: y,
      vx: random(-0.5, 0.5),
      vy: -2,
      life: 1000,
      maxLife: 1000,
      text: text,
      size: CONFIG.UI.getSmallTextSize() * 1.2,
      color: color
    });
  }
  
  /**
   * Add screen shake effect
   * @param {number} amount - Intensity of shake
   */
  addScreenShake(amount) {
    // Scale shake based on screen size
    let scaledAmount = map(min(width, height), 300, 1200, amount * 0.6, amount);
    this.screenShake = max(this.screenShake, scaledAmount);
  }
  
  /**
   * Set glitch effect intensity
   * @param {number} intensity - Glitch intensity
   */
  setGlitchIntensity(intensity) {
    this.glitchIntensity = intensity;
  }
  
  /**
   * Update and draw particles
   */
  updateParticles() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      let p = this.particles[i];
      
      // Update position
      p.x += p.vx;
      p.y += p.vy;
      
      // Slow down particles
      p.vx *= 0.95;
      p.vy *= 0.95;
      
      // Reduce life
      p.life -= deltaTime;
      
      // Draw the particle
      if (p.text) {
        // This is a text particle
        let alpha = map(p.life, 0, p.maxLife, 0, 255);
        textAlign(CENTER);
        textSize(p.size);
        fill(p.color[0], p.color[1], p.color[2], alpha);
        text(p.text, p.x, p.y);
      } else {
        // This is a regular particle
        let alpha = map(p.life, 0, p.maxLife, 0, 255);
        fill(p.color[0], p.color[1], p.color[2], alpha);
        noStroke();
        ellipse(p.x, p.y, p.size, p.size);
      }
      
      // Remove dead particles
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
    
    // Limit particles for performance
    let maxParticles = CONFIG.EFFECTS.MAX_PARTICLES;
    if (width < 600 || height < 600) {
      maxParticles = Math.floor(maxParticles * 0.6);
    }
    
    if (this.particles.length > maxParticles) {
      this.particles.splice(0, this.particles.length - maxParticles);
    }
  }
  
  /**
   * Draw background grid
   */
  drawBackgroundGrid() {
    // Draw grid lines
    stroke(30);
    strokeWeight(1);
    
    // Draw vertical grid lines
    for (let x = 0; x < width; x += this.gridSize) {
      line(x, 0, x, height);
    }
    
    // Draw horizontal grid lines
    for (let y = 0; y < height; y += this.gridSize) {
      line(0, y, width, y);
    }
  }
  
  /**
   * Draw background stars
   */
  drawStars() {
    push();
    noStroke();
    
    for (let star of this.stars) {
      // Twinkle effect
      let brightness = map(sin(frameCount * star.twinkle), -1, 1, 100, 255);
      fill(brightness);
      
      // Draw star with size based on screen dimensions
      let sizeMultiplier = map(min(width, height), 300, 1200, 0.7, 1.2);
      ellipse(star.x, star.y, star.size * sizeMultiplier, star.size * sizeMultiplier);
    }
    
    pop();
  }
  
  /**
   * Update screen shake effect and return current shake amount
   * @returns {number} Current shake amount
   */
  updateScreenShake() {
    // Apply screen shake
    if (this.screenShake > 0) {
      translate(random(-this.screenShake, this.screenShake), random(-this.screenShake, this.screenShake));
      this.screenShake *= 0.9;
      if (this.screenShake < 0.5) this.screenShake = 0;
    }
    
    return this.screenShake;
  }
  
  /**
   * Draw global glitch effect
   */
  drawGlitchEffect() {
    if (this.glitchIntensity <= 0) return;
    
    push();
    stroke(255, this.glitchIntensity * 2);
    strokeWeight(1);
    
    // Scale glitch effect with screen size
    let glitchScale = map(min(width, height), 300, 1200, 0.7, 1.2);
    
    // Random horizontal glitch lines
    if (random() > 0.85) {
      for (let i = 0; i < 3; i++) {
        let y = random(height);
        line(0, y, width, y + random(-5, 5) * glitchScale);
      }
    }
    
    // Random vertical glitch lines
    if (random() > 0.85) {
      for (let i = 0; i < 2; i++) {
        let x = random(width);
        line(x, 0, x + random(-5, 5) * glitchScale, height);
      }
    }
    
    // Random colored rectangles
    if (random() > 0.9) {
      noStroke();
      fill(255, random(40, 80) * (this.glitchIntensity / 30));
      let rectSize = random(30, 100) * glitchScale;
      rect(random(width), random(height), rectSize, random(2, 10) * glitchScale);
    }
    
    pop();
    
    // Reduce glitch intensity over time
    this.glitchIntensity *= 0.95;
    if (this.glitchIntensity < 1) {
      this.glitchIntensity = 0;
    }
  }
  
  /**
   * Handle window resize
   * @param {number} width - New canvas width
   * @param {number} height - Canvas height
   */
  windowResized(width, height) {
    // Update grid size
    this.updateGridSize();
    
    // Redistribute stars
    this.stars = [];
    const starCount = Math.floor(width * height / 5000); // Density based on screen area
    for (let i = 0; i < starCount; i++) {
      this.stars.push({
        x: random(width),
        y: random(height),
        size: random(0.5, 2),
        twinkle: random(0.01, 0.05)
      });
    }
  }
}
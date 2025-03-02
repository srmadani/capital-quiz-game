/**
 * Game configuration and constants
 */
const CONFIG = {
  PLAYER: {
    SPEED: 200,
    MAX_TRAIL: 5,
    SHOOTING_COOLDOWN: 500, // Longer cooldown for the quiz game
    // Add responsive size calculation
    getSize: function() {
      return min(width, height) * 0.05; // 5% of the smallest screen dimension
    }
  },
  ENEMY: {
    COUNT: 4,
    // Calculate size based on screen dimensions
    getSize: function() {
      return min(width, height) * 0.08; // 8% of the smallest screen dimension
    },
    BASE_SPEED_FACTOR: 40 // INCREASED to make enemies move slower (was 25)
  },
  BULLETS: {
    // Make bullet speed responsive to screen size
    getSpeed: function() {
      return min(width, height) * 1.2; // Scale based on screen size
    },
    COST: 5 // CHANGED: Now costs 5 points per shot (was 0)
  },
  WAVES: {
    TIME_LIMIT: 20, // CHANGED: Exactly 20 seconds for the quiz
    STARTING_SCORE: 100,
    POINTS: {
      NORMAL_ENEMY: 0, // No points for shooting wrong answers
      KEY_ENEMY: 100, // Points for correct answer
      WRONG_ANSWER: -25 // Penalty for wrong answers
    }
  },
  EFFECTS: {
    MAX_PARTICLES: 100,
    SHAKE: {
      SHOOT: 2,
      HIT: 2,
      EXPLOSION: 15,
      GAME_OVER: 20
    },
    GLITCH: {
      HIT: 10,
      EXPLOSION: 30
    }
  },
  UI: {
    // Add responsive text sizes
    getHeaderSize: function() {
      return min(width, height) * 0.04; // 4% of the smallest screen dimension
    },
    getTextSize: function() {
      return min(width, height) * 0.018; // 1.8% of smallest screen dimension
    },
    getSmallTextSize: function() {
      return min(width, height) * 0.012; // 1.2% of smallest screen dimension
    },
    MESSAGES: {
      DESKTOP_QUIT: "PRESS ESC TO QUIT",
      MOBILE_QUIT: "THREE FINGER TAP TO QUIT"
    }
  },
  // Add a function to detect mobile devices
  isMobileDevice: function() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || (width < 768);
  }
};

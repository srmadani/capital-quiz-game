# Capital Quiz Game

An interactive geography quiz game where you need to identify the correct capital city for each country.

## How to Play

1. A country name appears at the top of the screen
2. Four city names approach from the top (only one is the correct capital)
3. Shoot the correct capital city to earn points
4. Shooting incorrect cities will cost you points

## Controls

### Desktop:
- **MOVE**: Arrow keys
- **SHOOT**: Mouse click
- **RESTART**: Enter (when game over)
- **DEBUG MODE**: Press 'D' to toggle

### Mobile:
- **MOVE**: Touch left/right side of screen
- **SHOOT**: Tap screen
- **RESTART**: Tap screen (when game over)
- **DEBUG MODE**: Double tap anywhere

## Features

- Responsive design that works on desktops, tablets and phones
- Automatically adjusts UI elements for different screen sizes
- Touch controls optimized for mobile play
- Visual effects that scale with device capabilities

## Technical Notes

- The game uses p5.js for rendering
- Country/capital data is loaded from embedded JavaScript data
- If you encounter loading issues, check the browser console and toggle debug mode with 'D'

## Troubleshooting

If the game doesn't start:
1. Check if data is properly loaded (check console logs)
2. Press 'D' (or double-tap on mobile) to see debug information
3. Make sure all JavaScript files are correctly referenced in index.html
4. Try refreshing the page

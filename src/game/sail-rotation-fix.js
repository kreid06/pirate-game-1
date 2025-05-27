// File: sail-rotation-fix.js
/**
 * Ship Movement Fix During Sail Rotation
 * 
 * Problem: The ship stops moving when rotating sails because:
 * 1. Sail rotation temporarily reduces sail efficiency
 * 2. The constant drag factor in the update method slows the ship
 * 3. If the ship's velocity falls below a threshold, it stops completely
 * 
 * Solution:
 * 1. Add a flag to track when sails are being rotated
 * 2. Implement a timer to maintain the "rotation state" for a short period
 * 3. Reduce drag during sail rotation to maintain momentum
 * 
 * Implementation steps:
 * 1. Add properties to Ship.ts:
 *    - isRotatingSails: boolean (flag to track sail rotation)
 *    - sailRotationTimer: number (timer to track how long sails have been rotating)
 * 
 * 2. Modify rotateSails method to set the flag and reset the timer
 * 
 * 3. Modify the update method to:
 *    - Check if sails are rotating
 *    - Apply reduced drag when rotating sails
 *    - Decrement the timer and reset the flag when done
 */

// Add to Ship class properties:
// isRotatingSails: boolean = false;
// sailRotationTimer: number = 0;

// Modify rotateSails method:
// Set isRotatingSails to true
// Reset sailRotationTimer to 10 (this will provide momentum for 10 frames)

// Modify update method:
// If isRotatingSails is true:
//   - Use a lower drag factor (0.95 instead of 0.85)
//   - Decrement sailRotationTimer
//   - If sailRotationTimer reaches 0, reset isRotatingSails to false

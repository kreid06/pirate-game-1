// Fix for ship movement during sail rotation

/**
 * PROBLEM:
 * When rotating sails, the ship stops moving because:
 * 1. Sail rotation temporarily reduces sail efficiency
 * 2. The constant drag in the update method slows the ship
 * 3. If velocity falls below threshold, ship stops completely
 * 
 * SOLUTION:
 * 1. Use the isRotatingSails and sailRotationTimer properties already in Ship.ts
 * 2. Modify the update method to reduce drag during sail rotation
 * 
 * HOW TO IMPLEMENT:
 * The file already has:
 * - isRotatingSails property (line 49)
 * - sailRotationTimer property (line 50)
 * - These are set properly in rotateSails method (lines 551-552)
 * 
 * Change needed in update method (around line 1445):
 * - Replace the constant dragFactor with a variable
 * - Reduce drag when sails are rotating
 * - Manage the rotation timer
 * 
 * Here's the code to add to the update method:
 */

// Replace this part in the update method:
// const dragFactor = 0.85; // Base drag (no sails open)

// With this code:
let dragFactor = 0.85; // Base drag (no sails open)

// Use reduced drag when rotating sails to maintain momentum
if (this.isRotatingSails) {
    dragFactor = 0.95; // Reduced drag during sail rotation
    
    // Decrement the timer
    this.sailRotationTimer--;
    
    // Reset the flag when the timer reaches zero
    if (this.sailRotationTimer <= 0) {
        this.isRotatingSails = false;
    }
}

// The rest of the update method remains the same

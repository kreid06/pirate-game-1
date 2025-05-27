# Ship Movement Fix During Sail Rotation

## Problem Description

When rotating sails in the pirate ship game, the ship stops moving because:
1. Sail rotation temporarily reduces sail efficiency
2. The constant drag factor in the `update` method slows the ship
3. If the ship's velocity falls below a threshold, it stops completely

## Solution

The solution is to implement a mechanism that reduces drag when sails are rotating, maintaining the ship's momentum during sail adjustments.

## Implementation Steps

1. **The Ship.ts file already has these properties:**
   ```typescript
   // Ship physics properties
   isRotatingSails: boolean = false; // Flag to track when sails are being actively rotated
   sailRotationTimer: number = 0;    // Timer to track how long sails have been rotating
   ```

2. **The `rotateSails` method already sets these flags:**
   ```typescript
   // In the rotateSails method
   this.isRotatingSails = true;
   this.sailRotationTimer = 10; // Set timer for how long to maintain rotation momentum
   ```

3. **Modify the `update` method (around line 1445):**
   - Find this code:
   ```typescript
   // Apply drag to slow the ship based on sail openness
   const dragFactor = 0.85; // Base drag (no sails open)
   ```

   - Replace it with:
   ```typescript
   // Apply drag to slow the ship based on sail openness and rotation state
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
   ```

## Expected Results

After implementing this fix:
1. The ship will maintain more of its momentum while rotating sails
2. Sail adjustments will feel more fluid and realistic
3. The ship will no longer come to a complete stop during minor sail adjustments

## Testing

Test the fix by:
1. Getting the ship moving at a good speed
2. Rotating the sails using Shift+A or Shift+D
3. Verifying that the ship maintains much of its momentum during rotation
4. Checking that after several seconds of not rotating, normal physics resume

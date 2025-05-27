# Speed Increase During Sail Rotation Fix

## Problem Description

The ship was gaining additional speed each time the sails were rotated. This was happening because:

1. Different drag factors were applied during sail rotation in multiple places
2. These drag adjustments were creating a cumulative effect where the ship gained speed
3. Each time sails were rotated, the ship would emerge with slightly more speed than before

## Solution

To solve this issue, we've implemented a much simpler approach that completely eliminates any special physics during sail rotation:

1. **Apply consistent drag calculation in all scenarios**:
   - Remove all special drag factors during sail rotation
   - Use the same drag calculation formula regardless of whether sails are rotating
   - This prevents any unexpected interactions between different drag calculations

2. **Preserve exact velocity during sail rotation**:
   - Store the ship's velocity at the start of sail rotation
   - After rotating the sails, restore the exact same velocity
   - This guarantees the ship doesn't gain or lose speed during sail rotation

3. **Simplify the `isRotatingSails` flag**:
   - Use it only for animation timing, not for physics calculations
   - This prevents any physics side effects from the flag

## Implementation

The changes are straightforward and focused on three methods:

1. In `update()`: Apply constant drag regardless of sail rotation status
2. In `applyWindForce()`: Remove all conditional logic related to sail rotation
3. In `rotateSails()`: Store velocity before rotation and restore it afterward

This approach maintains all the visual improvements of the sail rotation experience while ensuring the ship's physics remain predictable and stable.

## Testing

To verify the fix:
1. Sail in a straight line at a steady speed
2. Rotate sails repeatedly in the same direction (e.g., using Shift+A)
3. Observe that the ship's speed remains exactly the same

The ship should now maintain a consistent speed regardless of how many times the sails are rotated, while still providing a fluid sailing experience.

# Wind Direction Convention in the Pirate Game

## The Problem

There was a 90-degree discrepancy between how wind was visualized and how it was applied in physics calculations.

## The Solution

We now consistently use these conventions:

1. **Physics Wind Convention (Mathematical Vector)**: 
   - Direction the wind is blowing TOWARDS
   - Used in all physics force calculations
   - Stored in `windDirection` variables

2. **Visual Wind Convention (Meteorological)**: 
   - Direction the wind is coming FROM
   - Used only for arrow display in the HUD
   - Calculated as `windDirection + Math.PI` (add 180°) when drawing

3. **Ship Movement Direction**:
   - The ship always moves in the direction it is facing when sails are open
   - Wind direction and sail angle only affect the speed (efficiency), not the direction
   - This makes the ship behave like a real sailing vessel that can tack against the wind

4. **Sail Efficiency Model**:
   - Sails can only collect wind optimally within a half-circle range (±90 degrees)
   - Maximum efficiency (100%) when pointing directly at the wind direction
   - Efficiency decreases linearly to 35% at the edges of the half-circle
   - Outside the half-circle range, sails maintain a minimum 35% efficiency
   - This guarantees the ship always has some forward momentum regardless of wind direction

## Code Implementation

When calculating wind physics:
- Use wind direction vectors as-is (where the wind is blowing TO)
- Calculate dot products with sail normals to determine if wind is hitting sail from front

When drawing wind indicators:
- Use the wind direction directly to show where wind is coming FROM
- Arrow points in the actual direction of the source of the wind
- "Wind From" label clarifies that the arrow shows the origin of the wind

## Debugging

When debugging, remember:
- `windDirection` in code: Direction wind is moving TOWARDS (0° = East, 90° = South, etc.)
- Wind arrow in HUD: Direction wind is coming FROM (0° = West, 90° = North, etc.)

The debug log shows both values:
```
WindDir (math): 45.0°, WindDir (vis): 225.0°
```
- `WindDir (math)` is used in physics calculations (TO)
- `WindDir (vis)` is what players see in the HUD (FROM)

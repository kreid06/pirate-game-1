# Ship Debug Visualization Guide

This guide explains how to use the debug visualizations to understand the ship's collision box and walkable area.

## Key Commands

- **L key**: Toggle Debug Mode (shows collision boundaries, physics bodies, and velocity vectors)
- **G key**: Toggle Walkable Area Test (shows a grid of test points on the ship's deck)

## Understanding the Ship's Collision Box

The ship has two important boundaries:

1. **Physics Body** (Red Rectangle): This is the actual collision box used by the physics engine. It's offset from the visual center to account for the asymmetrical shape of the ship (extended bow).

2. **Walkable Deck Area** (Yellow Shape): This curved shape represents the area where the player can walk on the ship. It matches the visual hull of the ship.

3. **Physics Offset**: There is a 100-pixel horizontal offset between the physics center (red) and visual center (green). This ensures the collision properly aligns with the visual representation.

## Walkable Area Test Visualization

When toggling the walkable area test with the **G key**, you'll see:

- **Green dots**: Points that are valid walkable positions on the deck
- **Red dots**: Points that are not walkable (outside the ship or too close to obstacles)
- **Yellow area**: The expected walkable area based on the hull shape
- **Red circles**: Obstacle avoidance areas (masts, wheel, etc.)

## Troubleshooting

If the player can't walk in certain areas that appear to be on the ship:

1. Check if the point is within the yellow hull shape
2. Verify it's not too close to an obstacle (red circles)
3. Make sure the physics offset (100px) is correctly applied in all calculations

## Physics vs. Visual Center

- **Red dot**: Physics center (where collisions are calculated)
- **Green dot**: Visual center (where the ship is drawn)
- **Magenta line**: Shows the offset between physics and visual centers

## Coordinate Systems

When debugging ship positions, remember these coordinate systems:

1. **World coordinates**: Absolute positions in the game world
2. **Ship-local coordinates**: Positions relative to the ship's visual center
3. **Normalized coordinates**: Used in `isPositionOnDeck()` to check if a position is on the ship

The debug visualizations will help ensure that all three coordinate systems align properly.

# Ship Coordinate System

## Overview of Changes

We've normalized the ship's coordinate systems to reduce complexity and prevent inconsistencies during rotation. The key change is establishing a **single source of truth** for the ship's position.

## Coordinate System Architecture

### Previous Implementation

Previously, we had multiple offset values:
- `physicsOffsetX/Y`: Offset between physics collision box center and visual center
- `walkableOffsetX/Y`: Offset between visual center and walkable area center

This created unnecessary complexity and inconsistency during rotation.

### New Normalized System

The new system establishes a clear hierarchy of position references:

1. **Physics Body Position**: The source of truth
   - All other positions are derived from the physics body position
   - This ensures consistency with the physics engine

2. **Visual Center**: Offset from physics center
   - Defined by `visualOffsetX/Y` (relative to physics center)
   - Used for rendering the ship sprite

3. **Walkable Area Center**: Offset from physics center
   - Defined by `walkableOffsetX/Y` (relative to physics center)
   - Used for deck position calculations

## Key Benefits

1. **Simplified Updates**: The physics engine updates only one position (physics body)
2. **Consistent Rotation**: All offsets automatically rotate correctly with the ship
3. **Single Source of Truth**: No conflicting positions to reconcile
4. **Better Debugging**: Clear visualization of all center points

## Visual Debug Guide

When using the debug visualization (L key):

- **Red Box/Dot**: Physics collision body (source of truth)
- **Green Dot**: Visual center (with purple line showing offset from physics)
- **Yellow Shape**: Walkable deck area (with yellow line showing offset from visual)

## Technical Implementation

- Physics position is now the primary position reference
- Visual position is calculated as: `physicsPosition + visualOffset`
- Walkable position is calculated as: `physicsPosition + walkableOffset`

This normalized coordinate system ensures all three centers (physics, visual, and walkable) stay properly aligned during rotation and movement.

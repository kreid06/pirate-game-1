/**
 * Shapes definitions for game rendering
 * This file exports reusable canvas shape parameters for game objects
 */

export interface ShapeDefinition {
  type: 'circle' | 'rectangle' | 'polygon';
  params: any;
}

// Ship shapes
export const SHIP_SHAPES = {
  basic: {
    type: 'polygon',
    params: {
      points: [
        { x: 0, y: -30 },   // bow
        { x: 20, y: 0 },    // starboard
        { x: 0, y: 30 },    // stern
        { x: -20, y: 0 }    // port
      ]
    }
  }
};

// Player shapes
export const PLAYER_SHAPES = {
  basic: {
    type: 'circle',
    params: {
      radius: 10
    }
  }
};

// Module shapes
export const MODULE_SHAPES = {
  cannon: {
    type: 'rectangle',
    params: {
      width: 10,
      height: 20
    }
  },
  sail: {
    type: 'rectangle',
    params: {
      width: 30,
      height: 40
    }
  },
  wheel: {
    type: 'circle',
    params: {
      radius: 8
    }
  }
};
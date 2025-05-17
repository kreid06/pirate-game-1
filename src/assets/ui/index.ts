/**
 * UI element definitions for the game
 * This file exports parameters for simple UI components drawn on canvas
 */

// UI Element types
export type UIElementType = 'button' | 'panel' | 'progressBar' | 'text';

// Interface for UI elements
export interface UIElement {
  type: UIElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
  text?: string;
  fontSize?: number;
  cornerRadius?: number;
  visible: boolean;
}

// UI Presets
export const UI_PRESETS = {
  // Button presets
  button: {
    standard: {
      width: 120,
      height: 40,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      borderColor: '#ffcc00',
      textColor: '#ffffff',
      fontSize: 16,
      cornerRadius: 5
    },
    small: {
      width: 80,
      height: 30,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      borderColor: '#ffcc00',
      textColor: '#ffffff',
      fontSize: 12,
      cornerRadius: 3
    }
  },
  
  // Panel presets
  panel: {
    standard: {
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      borderColor: '#666666',
      cornerRadius: 5
    }
  },
  
  // Progress bar presets
  progressBar: {
    health: {
      height: 10,
      backgroundColor: '#333333',
      fillColor: '#00cc00',
      borderColor: '#ffffff'
    },
    water: {
      height: 10,
      backgroundColor: '#333333',
      fillColor: '#33ccff',
      borderColor: '#ffffff'
    }
  }
};
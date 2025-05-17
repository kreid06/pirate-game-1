// This file is the entry point of the game. It initializes the game loop and sets up the Matter.js engine.

import Matter from 'matter-js';
import { Game } from './game/Game';

// Canvas setup
const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;

// Resize canvas to fill window
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Initialize physics and game with zero gravity for top-down perspective
const engine = Matter.Engine.create({ 
    gravity: { x: 0, y: 0, scale: 0 } // No gravity for top-down view
});
const game = new Game(engine);

// Listen for window resize events to adjust canvas
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // Update game viewport dimensions
    game.updateViewportDimensions(window.innerWidth, window.innerHeight);
});

// Start the game
game.start();
# Pirate Game

## Overview
Pirate Game is a top-down survival game where players navigate the high seas, engage in ship battles, and explore islands. Built using TypeScript and HTML5 Canvas, this game features modular ships with plank-based damage systems, wind physics, and both melee and ranged combat.

## Getting Started

### Prerequisites
- Node.js (version 16 or higher)
- npm (Node package manager)

### Installation
1. Clone the repository:
   ```
   git clone https://github.com/yourusername/pirate-game-1.git
   ```
2. Navigate to the project directory:
   ```
   cd pirate-game-1
   ```
3. Install the dependencies:
   ```
   npm install
   ```

### Running the Game
To start the development server, run:
```
npm run dev
```
or
```
npm start
```
This will launch the game in your default web browser at `http://localhost:5173/`.

### Building for Production
To build the game for production:
```
npm run build
```
The built files will be in the `dist` directory. You can preview the production build with:
```
npm run preview
```

### Game Controls
- **WASD**: Move the player character
- **E**: Interact with ship modules (mount/dismount)
- **Space**: Fire cannons when manning a cannon
- **Mouse**: Aim and interact with objects
- **R**: Repair ship planks
- **1-4**: Switch between equipped items/weapons

## Project Structure
- **src/**: Contains the source code for the game.
  - **index.ts**: Entry point of the game.
  - **game/**: Contains game logic and classes:
    - **Game.ts**: Core game loop and initialization logic
    - **World.ts**: Game world management and environment
    - **Player.ts**: Player character implementation
    - **Ship.ts**: Ship implementation with plank system and module mounting
    - **Enemy.ts**: Enemy entities and AI behavior
  - **physics/**: Physics and collision detection
    - **PhysicsManager.ts**: Collision detection and physics calculations
  - **assets/**: Game assets
    - **audio/**: Sound effects and music
    - **shapes/**: Definition files for Canvas shapes
    - **colors/**: Color palettes for rendering
    - **ui/**: UI element definitions
  - **utils/**: Utility functions
  - **types/**: TypeScript interfaces and type definitions
- **public/**: Contains static files for the game.
  - **index.html**: Static HTML template
  - **styles.css**: CSS styles for the game interface.
- **index.html**: Main HTML entry point
- **package.json**: npm configuration file
- **tsconfig.json**: TypeScript configuration file
- **vite.config.ts**: Vite bundler configuration
- **CONTEXT.md**: Project context and requirements
- **README.md**: Documentation for the project

## Development Guide

### Debug Features

The game includes several debug features to help with development:

1. **Debug Mode (L key)**
   - Shows collision boundaries, physics bodies, and velocity vectors
   - Displays ship's physics center (red) and visual center (green)
   - Shows informative labels with position coordinates and offset values

2. **Walkable Area Test (G key)**
   - Visualizes all valid walkable positions on the ship's deck with green dots
   - Shows obstacle avoidance zones around masts, wheel, etc.
   - Helps identify issues with player movement and collision detection

3. **Ship Coordinate System**
   - The ship uses a normalized coordinate system with physics position as the source of truth
   - Visual and walkable centers are defined as offsets from the physics center
   - This ensures all centers remain properly aligned during rotation
   - See `COORDINATE_SYSTEM.md` for detailed explanation of how positions are calculated

For more detailed information about debugging the ship's collision box and walkable area, refer to the `DEBUG_GUIDE.md` and `COORDINATE_SYSTEM.md` files.

### Setting Up the Development Environment

1. **Initialize the Basic Structure**  
   The project structure is already set up with TypeScript and Vite. If you're starting from scratch, you would:
   ```
   npm init -y
   npm install vite typescript @types/matter-js matter-js --save-dev
   npx tsc --init
   ```

2. **Understanding the Canvas Implementation**  
   This game uses HTML5 Canvas for rendering instead of a third-party library. All game objects are drawn using basic shapes defined in `src/assets/shapes/`.

3. **Key Implementation Files**
   - `Game.ts`: The main game class that initializes the game loop
   - `Ship.ts`: Contains the ship implementation with plank system
   - `PhysicsManager.ts`: Handles collision detection between objects

4. **Working with Modules and Components**  
   Ship modules (cannons, sails, etc.) use a component-based architecture. Study the `Ship.ts` file to understand how modules are attached and interact.

5. **Adding New Features**  
   Refer to `CONTEXT.md` for the project vision before implementing new features.

### Development Workflow

1. Make changes to source files
2. Run the development server to test: `npm run dev`
3. Build for production when ready: `npm run build`

## Contributing
Contributions are welcome! Please open an issue or submit a pull request for any improvements or bug fixes.

## License
This project is licensed under the MIT License. See the LICENSE file for details.
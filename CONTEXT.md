# Pirate Game - Development Context Document

## Game Overview
**Name:** Pirate Game (Working Title)  
**Version:** 1.0 (Singleplayer, with multiplayer planned for future versions)  
**Genre:** MMO Survival Game  
**Perspective:** Top-down view (similar to agar.io)

## Core Game Systems

### 1. Ship System
- **Ship Base Structure**
  - Ships consist of interconnected planks with individual health
  - Ships have water level that determines actual "health" of the vessel
  - Ships have specific mounting points for modules

- **Ship Modules**
  - Modules can be placed and removed dynamically
  - Core module types:
    - **Steering Wheel:** Controls ship direction
    - **Sails:** Propulsion system affected by wind
    - **Cannons:** Offensive weapons that can damage other ships
  - Each module has its own functionality, health, and upgrade path

- **Ship Stats & Upgrades**
  - Speed, maneuverability, durability can be upgraded
  - Capacity for modules can be increased
  - Ship size/capacity can be modified

### 2. Physics & Movement Systems
- **Wind System**
  - Global wind direction and power that changes over time
  - Sail force calculated based on:
    - Individual sail module power
    - Sail angle relative to wind direction
    - Wind power

- **Damage & Destruction System**
  - **Plank System:** Ships have multiple plank hitboxes 
  - Damaged planks allow water to enter the ship
  - Ship takes "true damage" based on water level inside
  - Sinking mechanics when water level becomes critical

- **On-Ship Functionality**
  - Characters (player/NPCs) can board ships
  - Position is bound relative to the ship's position when on board
  - Characters move independently when not on a ship

### 3. Player Character Systems
- **Player Stats & Progression**
  - Skills can be upgraded through experience
  - Stats include strength, dexterity, etc.
  - Skill trees for different specializations (captain, gunner, etc.)

- **Combat System**
  - **Melee Combat:** Close-quarters fighting with swords, etc.
  - **Ranged Combat:** Distance fighting with pistols, muskets, etc.
  - Combat effectiveness based on equipped weapons and player skills

### 4. Game World
- **Environment**
  - Ocean with procedurally generated islands
  - Weather system affecting sailing and combat
  - Resources to gather for crafting and upgrades
  - Dynamic zoom system (min 0.5x, max 2.0x) for adjusting view distance

- **AI & NPCs**
  - Enemy ships with varying difficulties
  - Trading vessels
  - Island inhabitants

## Technical Implementation Considerations

### Physics Implementation
- Separate collision shapes from render shapes for performance
- Ship physics must account for:
  - Water resistance
  - Wind forces
  - Damage affecting performance

### Rendering System
- Top-down view with proper perspective
- Support for various ship sizes and configurations
- Visual feedback for damage, water levels, etc.
- Mouse wheel zoom control with configurable min/max limits
- Zoom-centered on mouse position for intuitive navigation

### Module System Architecture
- Component-based architecture for modules
- Event system for module interactions
- Simple interface for adding new module types

## Project File Structure

### Root Files
- `index.html` - Main HTML entry point for the game
- `package.json` - Project dependencies and scripts
- `README.md` - Project documentation
- `tsconfig.json` - TypeScript configuration
- `vite.config.ts` - Vite bundler configuration
- `CONTEXT.md` - This file, containing project context and requirements

### Source Code (`src/`)
- `index.ts` - Main entry point for the game code

#### Game Core (`src/game/`)
- `Game.ts` - Core game loop and initialization logic
- `World.ts` - Game world management and environment
- `Player.ts` - Player character implementation
- `Ship.ts` - Ship implementation with plank system and module mounting
- `Enemy.ts` - Enemy entities and AI behavior

#### Physics (`src/physics/`)
- `PhysicsManager.ts` - Handles collision detection and physics calculations

#### Types (`src/types/`)
- `index.ts` - TypeScript type definitions and interfaces

#### Utilities (`src/utils/`)
- `helpers.ts` - Helper functions used throughout the codebase

#### Assets (`src/assets/`)
- `audio/` - Game sound effects and music
- `shapes/` - Definition files for Canvas shapes and geometric parameters
- `colors/` - Color palettes and themes for rendering
- `ui/` - Simple UI element definitions

### Public (`public/`)
- `index.html` - Static HTML template
- `styles.css` - Global CSS styles

---

*Note: This file structure will evolve as development progresses. New files and directories will be added as necessary.*

---

*Note: This context document will evolve as development progresses. Any feature ideas should be discussed to ensure alignment with the overall vision.*
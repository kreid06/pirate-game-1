import Matter from 'matter-js';

// Game state interface
export interface GameState {
    isRunning: boolean;
    score: number;
    level: number;
    playerHealth: number;
}

// Player input interface
export interface PlayerInput {
    moveLeft: boolean;
    moveRight: boolean;
    moveUp: boolean;
    moveDown: boolean;
    fireCannon: boolean;
    boardShip: boolean;
}

// Vector type for 2D positions and velocities
export interface Vector2 {
    x: number;
    y: number;
}

// Game entity interface that all game objects implement
export interface GameEntity {
    position: Vector2;
    update(deltaTime: number): void;
}

// Physics entity interface for objects that have physics bodies
export interface PhysicsEntity extends GameEntity {
    body: Matter.Body;
}

// Health interface for damageable entities
export interface Damageable {
    health: number;
    maxHealth: number;
    takeDamage(amount: number): void;
    isDestroyed(): boolean;
}

// Module types for ship components
export enum ModuleType {
    SAIL = 'sail',
    CANNON = 'cannon',
    WHEEL = 'wheel',
    PLANK = 'plank'
}

// Wind data structure
export interface Wind {
    direction: number; // In radians
    power: number;     // Wind strength
}

// Player stats interface
export interface PlayerStats {
    strength: number;
    dexterity: number;
    intelligence: number;
}

// Player skills interface
export interface PlayerSkills {
    sailing: number;
    gunnery: number;
    carpentry: number;
    combat: number;
}

// Weapon types
export enum WeaponType {
    NONE = 'none',
    SWORD = 'sword',
    PISTOL = 'pistol',
    MUSKET = 'musket',
    DAGGER = 'dagger'
}

// Direction enum for movement
export enum Direction {
    UP = 'up',
    DOWN = 'down',
    LEFT = 'left',
    RIGHT = 'right'
}

// AI behavior types
export enum AIBehavior {
    PASSIVE = 'passive',
    AGGRESSIVE = 'aggressive',
    NEUTRAL = 'neutral',
    FLEEING = 'fleeing'
}

export interface Enemy {
    position: { x: number; y: number };
    health: number;
    aiBehavior: string;
}
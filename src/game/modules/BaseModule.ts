// BaseModule.ts - Base class for all ship modules
import Matter from 'matter-js';

// Define module types
export type ModuleType = 'cannon' | 'sail' | 'wheel' | 'plank';

// Base module class that all ship modules will extend
export class BaseModule {
    type: ModuleType;
    position: { x: number; y: number };
    rotation: number;
    health: number;
    body?: Matter.Body;

    constructor(type: ModuleType, position: { x: number; y: number }, rotation: number = 0) {
        this.type = type;
        this.position = { ...position };
        this.rotation = rotation;
        this.health = 100; // Default health
    }

    // Update method to be overridden by child classes
    update(): void {
        // Base update logic
    }

    // Use method to be overridden by child classes
    use(): void {
        // Base use logic
    }

    // Take damage
    takeDamage(amount: number): void {
        this.health -= amount;
        if (this.health <= 0) {
            this.health = 0;
            this.onDestroy();
        }
    }

    // Method called when the module is destroyed
    onDestroy(): void {
        // Base destroy logic
    }
}
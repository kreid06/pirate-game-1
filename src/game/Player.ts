import Matter from 'matter-js';

export default class Player {
    position: { x: number; y: number };
    health: number;
    body: Matter.Body;
    onShip: boolean;
    atShipWheel: boolean;

    constructor(x: number, y: number) {
        this.position = { x, y };
        this.health = 100; // Default health
        this.body = Matter.Bodies.circle(x, y, 15, {
            label: 'player',
            density: 0.002,
            frictionAir: 0.1
        });
        this.onShip = false;
        this.atShipWheel = false;
    }

    move(dx: number, dy: number) {
        this.position.x += dx;
        this.position.y += dy;
    }

    takeDamage(amount: number) {
        this.health -= amount;
        if (this.health < 0) {
            this.health = 0; // Prevent negative health
        }
    }

    isAlive(): boolean {
        return this.health > 0;
    }

    // Set player on ship status and update physics properties
    setOnShip(status: boolean, atWheel: boolean = false): void {
        this.onShip = status;
        this.atShipWheel = atWheel;
        
        // When player is on ship, make body a sensor to avoid collisions
        // but only when at wheel - we want physics when walking on deck
        Matter.Body.set(this.body, 'isSensor', status && atWheel);
    }
    
    // Toggle player between steering wheel and walking on deck
    setAtShipWheel(atWheel: boolean): void {
        if (this.onShip) {
            this.atShipWheel = atWheel;
            // Update physics - sensor when at wheel, solid when walking
            Matter.Body.set(this.body, 'isSensor', atWheel);
        }
    }
}
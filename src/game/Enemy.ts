import Matter from 'matter-js';

export default class Enemy {
    position: { x: number; y: number };
    health: number;
    speed: number;
    aiBehavior: string;
    body: Matter.Body;

    constructor(x: number, y: number, health: number, speed: number, aiBehavior: string) {
        this.position = { x, y };
        this.health = health;
        this.speed = speed;
        this.aiBehavior = aiBehavior;
        this.body = Matter.Bodies.circle(x, y, 15, {
            label: 'enemy',
            density: 0.002,
            frictionAir: 0.05
        });
    }

    moveTowards(targetX: number, targetY: number): void {
        // Calculate direction towards target
        const dx = targetX - this.position.x;
        const dy = targetY - this.position.y;
        
        // Normalize the direction
        const length = Math.sqrt(dx * dx + dy * dy);
        if (length > 0) {
            const normalizedDx = dx / length;
            const normalizedDy = dy / length;
            
            // Move in the direction of the target
            this.position.x += normalizedDx * this.speed;
            this.position.y += normalizedDy * this.speed;
            
            // Update the physics body position
            Matter.Body.setPosition(this.body, {
                x: this.position.x,
                y: this.position.y
            });
        }
    }

    attack() {
        // Implement attack logic
    }

    takeDamage(amount: number) {
        this.health -= amount;
        if (this.health <= 0) {
            this.die();
        }
    }

    die() {
        // Handle enemy death
    }
}
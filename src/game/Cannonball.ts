import Matter from 'matter-js';

export default class Cannonball {
    position: { x: number; y: number };
    velocity: { x: number; y: number };
    angle: number;
    radius: number;
    body: Matter.Body;
    lifetime: number; // How long the cannonball exists (in frames)
    maxLifetime: number;
    damage: number;
      constructor(x: number, y: number, angle: number, speed: number = 10) {
        this.position = { x, y };
        this.angle = angle;
        this.radius = 5;
        this.damage = 10;
        
        // Calculate velocity components - shift 90 degrees to the right
        const adjustedAngle = angle + Math.PI/2; // Add 90 degrees (π/2 radians) to shift right
        this.velocity = {
            x: Math.cos(adjustedAngle) * speed,
            y: Math.sin(adjustedAngle) * speed
        };
        
        // Create physics body
        this.body = Matter.Bodies.circle(x, y, this.radius, {
            label: 'cannonball',
            frictionAir: 0.001,
            friction: 0.1,
            restitution: 0.6,
            density: 0.1,
            // Make cannonballs non-colliding with the ship that fired them
            collisionFilter: {
                category: 0x0008, // Cannonball category
                mask: 0x0007 // Collide with everything except the firing ship
            }
        });
        
        // Set initial velocity
        Matter.Body.setVelocity(this.body, this.velocity);
        
        // Set lifetime
        this.lifetime = 0;
        this.maxLifetime = 180; // 3 seconds at 60fps
    }
    
    update(): boolean {
        // Update position based on physics body
        this.position.x = this.body.position.x;
        this.position.y = this.body.position.y;
        
        // Update lifetime
        this.lifetime++;
        
        // Return true if cannonball is still alive, false if it should be removed
        return this.lifetime < this.maxLifetime;
    }
    
    draw(ctx: CanvasRenderingContext2D): void {
        ctx.save();
        
        // Draw cannonball
        ctx.fillStyle = '#333333';
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.arc(this.position.x + 2, this.position.y + 2, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
    
    // Handle collision with other objects
    handleCollision(other: any): void {
        // If the other object is a ship or enemy, apply damage
        if (other.health !== undefined) {
            other.takeDamage(this.damage);
        }
    }
}
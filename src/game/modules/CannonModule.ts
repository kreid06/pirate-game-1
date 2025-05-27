// CannonModule.ts - Specialized class for ship cannons
import { BaseModule } from './BaseModule';

export class CannonModule extends BaseModule {
    turretAngle: number = 0;
    targetTurretAngle: number = 0; // Target angle the cannon should rotate toward
    rotationSpeed: number = 0.005; // Radians per frame
    reloadTime: number = 2000; // Reload time in milliseconds
    lastFiredTime: number = 0;
    isLoaded: boolean = true;
    private game: any | null = null; // Reference to the game for creating cannonballs

    constructor(position: { x: number; y: number }, rotation: number = 0) {
        super('cannon', position, rotation);
    }    // Set game reference for creating cannonballs
    setGame(game: any): void {
        // If the passed reference is a Ship instance that has a game property
        if (game && game.game && typeof game.game.addCannonball === 'function') {
            this.game = game.game; // Store the actual game reference, not the ship
            console.log("Cannon set with game reference via ship");
        } else {
            this.game = game;
            console.log("Cannon set with direct game reference");
        }
    }// Update cannon state
    override update(): void {
        // Check if cannon should reload
        if (!this.isLoaded && Date.now() - this.lastFiredTime > this.reloadTime) {
            this.isLoaded = true;
        }
          // Gradually rotate cannon towards target angle
        if (this.turretAngle !== this.targetTurretAngle) {
            // Calculate the shortest angle difference (handles wrapping around 2π)
            let angleDiff = this.targetTurretAngle - this.turretAngle;
            
            // Normalize the angle difference to be between -π and π
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
            
            // Determine rotation direction (fixed rate regardless of angle difference)
            const direction = angleDiff > 0 ? 1 : -1;
            
            // Apply fixed rotation speed in the correct direction
            this.turretAngle += this.rotationSpeed * direction;
            
            // Normalize turret angle to be between 0 and 2π
            while (this.turretAngle < 0) this.turretAngle += Math.PI * 2;
            while (this.turretAngle >= Math.PI * 2) this.turretAngle -= Math.PI * 2;
            
            // Check if we've passed or are very close to the target angle
            // Calculate the new angle difference after moving
            let newAngleDiff = this.targetTurretAngle - this.turretAngle;
            while (newAngleDiff > Math.PI) newAngleDiff -= Math.PI * 2;
            while (newAngleDiff < -Math.PI) newAngleDiff += Math.PI * 2;
            
            // If we've passed the target or are very close, snap to the target
            if (Math.abs(newAngleDiff) < this.rotationSpeed || (angleDiff > 0 !== newAngleDiff > 0)) {
                this.turretAngle = this.targetTurretAngle;
            }
        }
    }

    // Use the cannon (fire it)
    override use(): void {
        if (this.isLoaded) {
            this.isLoaded = false;
            this.lastFiredTime = Date.now();
            
            // Create cannonball if game reference exists and we have target coordinates
            if (this.game && this.game.createCannonball) {
                // Actual firing logic is handled by the Ship class
                // as it has access to proper world coordinates and physics
            }
        }
    }    // Fire the cannon at a specific target position
    fire(worldX: number, worldY: number, shipAngle: number, shipVelocity?: { x: number, y: number }): boolean {
        // Only fire if loaded
        if (!this.isLoaded) {
            return false;
        }
          
        // Determine cannon angle based on position and rotation
        // The firing angle combines:
        // 1. The ship's overall rotation (shipAngle)
        // 2. The turret's current aim adjustment (this.turretAngle)
        const firingAngle = shipAngle + this.turretAngle + this.rotation + Math.PI; 
        // Set the cannon as fired
        this.isLoaded = false;
        this.lastFiredTime = Date.now();
        
        // Calculate spawn position using barrel length
        const barrelLength = 20;
        // Use barrel length to calculate offset for the cannonball spawn position
        const spawnX = worldX - Math.sin(firingAngle) * barrelLength;
        const spawnY = worldY + Math.cos(firingAngle) * barrelLength;
          // Check if game reference exists
        if (!this.game) {
            console.error("Cannot fire cannonball: No game reference set");
            return false;
        }
        
        if (typeof this.game.addCannonball !== 'function') {
            console.error("Cannot fire cannonball: Game reference missing addCannonball method");
            console.log("Game object:", this.game);
            return false;
        }
        
        // Calculate additional speed from ship's momentum if provided
        let finalSpeed = 10; // Base cannonball speed
        
        if (shipVelocity) {
            const shipSpeed = Math.sqrt(
                shipVelocity.x * shipVelocity.x + 
                shipVelocity.y * shipVelocity.y
            );
            // Add half of the ship's speed to the cannonball
            finalSpeed += shipSpeed * 0.5;
        }
        
        // Create the cannonball through the game interface
        this.game.addCannonball(spawnX, spawnY, firingAngle, finalSpeed);
        
        // Debug log for successful firing
        console.log(`Cannon fired: Position (${spawnX.toFixed(1)}, ${spawnY.toFixed(1)}), Angle: ${firingAngle.toFixed(2)}, Speed: ${finalSpeed}`);
        
        return true;
    }// Aim the cannon at a specific world position
    aimAt(localTargetX: number, localTargetY: number): void {
        // Calculate angle from cannon position to target point in local coordinates
        const dx = localTargetX - this.position.x;
        const dy = localTargetY - this.position.y;
        
        // Calculate the base angle from cannon to target
        // Subtract PI/2 (90 degrees) to align with the visual plane coordinate system
        let targetAngle = Math.atan2(dy, dx) + Math.PI/2 + this.rotation;
        
        
        // The outward-facing direction is perpendicular to the ship at this cannon's position
        // This is represented by the cannon's original rotation
        // const outwardDirection = this.rotation;
        
        // // Calculate the difference between target angle and outward direction
        // let angleDiff = targetAngle - outwardDirection;
        
        // // Normalize the angle difference to be within -PI to PI
        while (targetAngle > Math.PI) targetAngle -= Math.PI * 2;
        while (targetAngle < -Math.PI) targetAngle += Math.PI * 2;  

        const validAngleRange = Math.PI / 4; // 45 degrees in radians

        if (targetAngle > validAngleRange) {
            this.targetTurretAngle = validAngleRange;
        } else if (targetAngle < -validAngleRange) {
            this.targetTurretAngle = -validAngleRange;
        }else{
            this.targetTurretAngle = targetAngle;
        }
     
    }    // Reset cannon angle to its default position
    resetAim(): void {
        // Default position is aligned with the cannon's base orientation
        // PI (180°) makes the turret point directly outward from the ship
        // This compensates for how the turret barrel is drawn (pointing up at angle 0)
        this.targetTurretAngle = 0;
        this.turretAngle = 0;
    }
    
    // Set the turret angle directly (for immediate positioning)
    setTurretAngle(angle: number): void {
        this.turretAngle = angle;
        this.targetTurretAngle = angle;
    }
    
    draw(ctx: CanvasRenderingContext2D): void {
        ctx.save();
        ctx.translate(this.position.x, this.position.y);
        ctx.rotate(this.rotation);
        // Draw cannon base
        ctx.fillStyle = '#8B4513';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.fillRect(-15, -10, 30, 20);
        ctx.strokeRect(-15, -10, 30, 20);
        // Draw cannon wheels
        ctx.fillStyle = '#654321';
        ctx.beginPath();
        ctx.arc(-10, 10, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(10, 10, 5, 0, Math.PI * 2);
        ctx.fill();
        // Draw turret (barrel)
        ctx.save();
        ctx.rotate(this.turretAngle);
        ctx.fillStyle = '#333333';
        ctx.beginPath();
        ctx.moveTo(-8, 0);
        ctx.lineTo(-8, -40);
        ctx.lineTo(8, -40);
        ctx.lineTo(8, 0);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        ctx.restore();
    }
}
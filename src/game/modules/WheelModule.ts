// WheelModule.ts - Specialized class for ship steering wheel
import { BaseModule } from './BaseModule';

export class WheelModule extends BaseModule {
    wheelAngle: number = 0; // Current rotation of the wheel (-30 to +30 degrees)
    isPlayerControlling: boolean = false; // Whether a player is at the wheel
    
    constructor(position: { x: number; y: number }) {
        super('wheel', position, 0);
    }
    
    // Set the wheel angle
    setWheelAngle(degrees: number): void {
        // Limit the wheel angle to -30 to +30 degrees
        this.wheelAngle = Math.max(-30, Math.min(30, degrees));
    }
    
    // Turn the wheel left by an increment
    turnLeft(increment: number = 0.5): void {
        this.setWheelAngle(this.wheelAngle - increment);
    }
    
    // Turn the wheel right by an increment
    turnRight(increment: number = 0.5): void {
        this.setWheelAngle(this.wheelAngle + increment);
    }
    
    // Center the wheel (move towards 0 degrees)
    centerWheel(increment: number = 0.5): void {
        if (this.wheelAngle > 0) {
            this.wheelAngle = Math.max(0, this.wheelAngle - increment);
        } else if (this.wheelAngle < 0) {
            this.wheelAngle = Math.min(0, this.wheelAngle + increment);
        }
    }
    
    // Set player controlling state
    setPlayerControlling(isControlling: boolean): void {
        this.isPlayerControlling = isControlling;
    }
    
    // Draw the wheel at its position
    draw(ctx: CanvasRenderingContext2D): void {
        ctx.save();
        ctx.translate(this.position.x, this.position.y);
        // Draw wheel base
        const wheelPath = new Path2D();
        wheelPath.moveTo(-10, -20);
        wheelPath.lineTo(10, -20);
        wheelPath.lineTo(10, 20);
        wheelPath.lineTo(-10, 20);
        wheelPath.closePath();
        ctx.fillStyle = '#8B4513';
        ctx.fill(wheelPath);
        // Draw wheel
        ctx.beginPath();
        ctx.arc(0, 0, 15, 0, Math.PI * 2);
        ctx.fillStyle = '#654321';
        ctx.fill();
        ctx.restore();
    }
    
    override update(): void {
        // Update wheel state if needed
    }
    
    override use(): void {
        // Toggle interaction with the wheel
    }
}
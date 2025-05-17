import Matter from 'matter-js';

export function randomInRange(min: number, max: number): number {
    return Math.random() * (max - min) + min;
}

export function isColliding(bodyA: Matter.Body, bodyB: Matter.Body): boolean {
    return Matter.SAT.collides(bodyA, bodyB).collided;
}

export function degreesToRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
}

export function radiansToDegrees(radians: number): number {
    return radians * (180 / Math.PI);
}
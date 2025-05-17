import Matter from 'matter-js';

export class PhysicsManager {
    private engine: Matter.Engine;

    constructor(engine?: Matter.Engine) {
        this.engine = engine || Matter.Engine.create();
    }

    public update(deltaTime: number): void {
        Matter.Engine.update(this.engine, deltaTime);
    }

    public addBody(body: Matter.Body): void {
        Matter.World.add(this.engine.world, body);
    }

    public removeBody(body: Matter.Body): void {
        Matter.World.remove(this.engine.world, body);
    }

    public getEngine(): Matter.Engine {
        return this.engine;
    }
}
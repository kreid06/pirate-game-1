import Matter from 'matter-js';

interface Island {
    position: { x: number, y: number };
    size: { width: number, height: number };
    body: Matter.Body;
}

export default class WorldManager {
    private engine: Matter.Engine;
    private world: Matter.World;
    private windDirection: number = 0; // In radians - represents the direction wind is blowing TOWARDS (vector convention)
    private windPower: number = 1; // Wind strength
    private islands: Island[] = [];
    private boundaries: Matter.Body[] = [];
    
    constructor() {
        this.engine = Matter.Engine.create();
        this.world = this.engine.world;
        this.setupWorld();
    }

    private setupWorld() {
        // Setup initial world properties
        this.setupBoundaries();
        this.generateIslands(5); // Generate 5 random islands
        this.setupWind();
    }
    
    private setupBoundaries() {
        // Create boundary walls to keep objects within the game area
        const worldSize = 5000; // 5000x5000 world size
        const wallThickness = 50;
        
        // Top boundary
        const top = Matter.Bodies.rectangle(worldSize/2, -wallThickness/2, worldSize, wallThickness, { isStatic: true });
        
        // Bottom boundary
        const bottom = Matter.Bodies.rectangle(worldSize/2, worldSize + wallThickness/2, worldSize, wallThickness, { isStatic: true });
        
        // Left boundary
        const left = Matter.Bodies.rectangle(-wallThickness/2, worldSize/2, wallThickness, worldSize, { isStatic: true });
        
        // Right boundary
        const right = Matter.Bodies.rectangle(worldSize + wallThickness/2, worldSize/2, wallThickness, worldSize, { isStatic: true });
        
        this.boundaries = [top, bottom, left, right];
        Matter.World.add(this.world, this.boundaries);
    }
    
    private generateIslands(count: number) {
        const worldSize = 5000;
        
        for (let i = 0; i < count; i++) {
            // Generate random island position and size
            const size = {
                width: 200 + Math.random() * 400,
                height: 200 + Math.random() * 400
            };
            
            const position = {
                x: 500 + Math.random() * (worldSize - 1000), // Keep away from boundaries
                y: 500 + Math.random() * (worldSize - 1000)
            };
            
            // Create island body
            const body = Matter.Bodies.rectangle(position.x, position.y, size.width, size.height, { 
                isStatic: true,
                label: 'island'
            });
            
            // Add island to the world
            this.islands.push({ position, size, body });
            Matter.World.add(this.world, body);
        }
    }
    
    // Time when the wind system was initialized
    private windSystemStartTime: number = Date.now();
    
    private setupWind() {
        // Initialize wind with a random direction
        this.windDirection = Math.random() * Math.PI * 2;
        this.windPower = 1.0; // Start with moderate wind power
        this.windSystemStartTime = Date.now();
    }
    
    public updateWind() {
        // Calculate time since the wind system started, in milliseconds
        const currentTime = Date.now();
        const elapsedTime = currentTime - this.windSystemStartTime;
        
        // Full cycle is 5 minutes (300000 ms)
        const cycleDuration = 5 * 60 * 1000; 
        
        // Calculate position in the cycle as a value from 0 to 1
        const cyclePosition = (elapsedTime % cycleDuration) / cycleDuration;
        
        // Set wind direction to rotate clockwise (2π radians per cycle)
        this.windDirection = cyclePosition * Math.PI * 2;
        
        // Keep wind direction in the range [0, 2π]
        while (this.windDirection < 0) this.windDirection += Math.PI * 2;
        while (this.windDirection >= Math.PI * 2) this.windDirection -= Math.PI * 2;
        
        // Determine wind power based on direction
        // Strong winds when blowing north-south (0, π, or 2π radians)
        // Weak winds when blowing east-west (π/2 or 3π/2 radians)
        
        // Calculate how close we are to the north-south axis
        const northSouthAxis = Math.min(
            Math.abs(this.windDirection % Math.PI), // Distance to 0 or π
            Math.abs((this.windDirection - Math.PI) % Math.PI) // Distance to π or 2π
        );
        
        // Normalize to 0-1, where 1 is perfect North-South alignment
        const northSouthAlignment = 1 - (northSouthAxis / (Math.PI / 2));
        
        // East is approximately π/2 (90°), West is approximately 3π/2 (270°)
        // Check if wind is blowing within 30 degrees of east or west
        const isEastWestWind = 
            Math.abs(this.windDirection - Math.PI/2) < Math.PI/6 ||    // Near East (±30°)
            Math.abs(this.windDirection - 3*Math.PI/2) < Math.PI/6;     // Near West (±30°)
        
        // If wind is blowing east or west, increase the minimum wind power by 50%
        // Original minimum power is 0.5, so 50% increase makes it 0.75
        const minWindPower = isEastWestWind ? 0.75 : 0.5;
        
        // Scale wind power from minWindPower to 2.0 based on alignment
        this.windPower = minWindPower + northSouthAlignment * (2.0 - minWindPower);
        
        // Add a small random variation to make it less mechanical
        this.windPower += (Math.random() - 0.5) * 0.1;
        
        // Clamp wind power to reasonable values
        if (this.windPower < 0.5) this.windPower = 0.5;
        if (this.windPower > 2.0) this.windPower = 2.0;
    }
    
    public getWindDirection(): number {
        return this.windDirection;
    }
    
    public getWindPower(): number {
        return this.windPower;
    }

    public update() {
        Matter.Engine.update(this.engine);
        this.updateWind();
    }

    public addEntity(entity: Matter.Body) {
        Matter.World.add(this.world, entity);
    }

    public removeEntity(entity: Matter.Body) {
        Matter.World.remove(this.world, entity);
    }
    
    public getEngine(): Matter.Engine {
        return this.engine;
    }
    
    public getIslands(): Island[] {
        return this.islands;
    }
}
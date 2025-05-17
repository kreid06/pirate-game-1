import Matter from 'matter-js';

// Define module types
export type ModuleType = 'cannon' | 'sail' | 'wheel' | 'plank';

// Define a ship module interface
export interface ShipModule {
    type: ModuleType;
    position: { x: number; y: number };
    rotation: number;
    health: number;
    openness?: number; // How open a sail is (0-100%)
    angle?: number;    // Angle of the sail relative to the mast (-45 to +45 degrees)
    body?: Matter.Body;
    update(): void;
    use(): void;
}

export default class Ship {
    // Ship's position - this is now a single unified center for all aspects (visual, physics, walkable)
    position: { x: number; y: number };
    size: { width: number; height: number };
    speed: number;
    health: number;
    body: Matter.Body;
    modules: Map<string, ShipModule> = new Map();
    planks: Array<{ position: { x: number, y: number }, health: number, body: Matter.Body }> = [];
    waterLevel: number = 0;
    
    // Ship sailing properties
    rudderAngle: number = 0;       // Current rudder angle (-30 to +30 degrees)
    sailsOpenness: number = 0;     // Overall sail openness (0-100%)
    currentWindDirection: number = 0; // Current wind direction
    currentWindPower: number = 0;    // Current wind power
    
    // Ship physics properties
    forwardForce: number = 0;      // Current forward propulsion force
    turningForce: number = 0;      // Current turning force
    momentum: number = 0;          // Ship's current momentum (affects turning)
    
    // Path for the brigantine ship shape
    path: Path2D | null = null;
    
    // Module view positions tracker to ensure consistency between visual and logical positions
    private moduleVisualPositions: Map<string, {x: number, y: number}> = new Map();
    
    // All center points are now aligned at the same position
    // No offset values needed - we're using a single unified center point for all ship positions
    // This eliminates inconsistencies during rotation
    
    // Player status properties
    playerAtWheel: boolean = false;  // Track if player is at the wheel or freely walking

    // --- Shared hull and feature definitions (single source of truth) ---
    // Hull path points (for Path2D and collision)
    private static readonly HULL_POINTS = {
        bow: { x: 190, y: 90 },
        bowTip: { x: 415, y: 0 },
        bowBottom: { x: 190, y: -90 },
        sternBottom: { x: -260, y: -90 },
        sternTip: { x: -345, y: 0 },
        stern: { x: -260, y: 90 }
    };
    // Mast positions (centered on hull)
    private static readonly MASTS = [
        { x: 165, y: 0, r: 30 },   // Front mast
        { x: -35, y: 0, r: 30 },   // Middle mast
        { x: -235, y: 0, r: 30 },  // Back mast
    ];
    // Wheel position and shape (rectangle, not circle)
    private static readonly WHEEL = { x: -90, y: 0, w: 20, h: 40 };
    // Cannon positions (centered on hull)
    private static readonly CANNONS = [
        { x: -35, y: 75, w: 30, h: 30 },    // Bottom center cannon
        { x: 65, y: 75, w: 30, h: 30 },     // Bottom right cannon
        { x: -135, y: 75, w: 30, h: 30 },   // Bottom left cannon
        { x: -35, y: -75, w: 30, h: 30 },   // Top center cannon
        { x: 65, y: -75, w: 30, h: 30 },    // Top right cannon
        { x: -135, y: -75, w: 30, h: 30 },  // Top left cannon
    ];

    // --- Hull Path2D generator (always up to date) ---
    static createHullPath(): Path2D {
        const p = Ship.HULL_POINTS;
        const path = new Path2D();
        path.moveTo(p.bow.x, p.bow.y);
        path.quadraticCurveTo(p.bowTip.x, p.bowTip.y, p.bow.x, p.bowBottom.y);
        path.lineTo(p.sternBottom.x, p.sternBottom.y);
        path.quadraticCurveTo(p.sternTip.x, p.sternTip.y, p.stern.x, p.stern.y);
        path.closePath();
        return path;
    }

    constructor(x: number, y: number, _width: number, _height: number, speed: number) {
        // Initialize position
        this.position = { x, y };
        this.speed = speed;
        this.health = 100; // Default health
        
        // Initialize physics properties
        this.forwardForce = 0;
        this.turningForce = 0;
        this.momentum = 0;
        
        // Create a more appropriate physics body for the brigantine shape
        // Using a rectangle that better approximates the full drawn path dimensions
        // Visual hull extends to control points at x=570 (bow) and x=-325 (stern)
        // Using 620x180 to account for the full visual width including curves and extended bow
        const fullShipWidth = 620; // Increased from 550 to extend the bow by approximately 1/8 of ship length (~70px)
        
        // Create physics body at its own position
        this.body = Matter.Bodies.rectangle(x, y, fullShipWidth, 180, {
            label: 'ship',
            density: 0.0005, // Lower density to make the ship more responsive
            frictionAir: 0.05, // Reduced air friction for more momentum
            friction: 0.03, // Reduced surface friction
            restitution: 0.1, // Minimal bounce
            inertia: Infinity, // Prevent rotation from collisions
            angle: 0, // Keep the ship upright initially
            sleepThreshold: 15, // Make the ship stop moving more quickly when no forces are applied
            slop: 0.05 // Tolerance for physics engine to consider the ship at rest
        });
        
        // Store the wider visual dimensions for proper deck boundary calculations
        this.size = { width: fullShipWidth, height: 180 };
        
        // Initialize the hull path for collision detection and visual rendering
        this.path = Ship.createHullPath();
        
        // Initialize ship with basic planks
        this.createPlankStructure();
    }

    // Create a basic plank structure for the ship
    private createPlankStructure(): void {
        // Create planks around the perimeter of the ship
        const totalPlanks = 40; // Total number of planks around the ship's perimeter
        
        // Place planks evenly around the brigantine shape
        for (let i = 0; i < totalPlanks; i++) {
            // Calculate angle for this plank
            const angle = (i / totalPlanks) * Math.PI * 2;
            
            // Use consistent radius to match the hull shape
            const radiusX = 225; // Match the width of the hull
            const radiusY = 90;  // Match the height of the hull
            
            // Place the plank on the hull perimeter
            this.addPlank(
                this.position.x + Math.cos(angle) * radiusX, 
                this.position.y + Math.sin(angle) * radiusY
            );
        }
        
        // Add some structural planks inside
        for (let x = -150; x <= 150; x += 50) {
            this.addPlank(this.position.x + x, this.position.y);
            this.addPlank(this.position.x + x, this.position.y - 40);
            this.addPlank(this.position.x + x, this.position.y + 40);
        }
    }
    
    // Add a single plank to the ship
    private addPlank(x: number, y: number): void {
        const plankSize = 15; // Size of each plank
        const plankBody = Matter.Bodies.rectangle(x, y, plankSize, plankSize, {
            label: 'plank',
            isSensor: true,
            density: 0.001
        });
        
        this.planks.push({
            position: { x, y },
            health: 100,
            body: plankBody
        });
    }
    
    // Add a module to the ship
    addModule(id: string, module: ShipModule): boolean {
        // Check if the position is valid
        // In a real implementation, you'd check if the position is a valid mounting point
        
        // Check if this is a standard module with a predefined visual position
        this.ensureModuleVisualPosition(id, module);
        
        this.modules.set(id, module);
        return true;
    }
    
    // Ensures that module has correct visual position for rendering and collision
    private ensureModuleVisualPosition(id: string, module: ShipModule): void {
        // Store the original module position as its visual position
        this.moduleVisualPositions.set(id, {...module.position});
        
        // Match module to standard ship fixtures if appropriate
        if (module.type === 'wheel' && Ship.WHEEL.x === module.position.x && Ship.WHEEL.y === module.position.y) {
            // This is the main wheel - use exact coordinates from WHEEL constant
            module.position = { x: Ship.WHEEL.x, y: Ship.WHEEL.y };
        } 
        else if (module.type === 'sail') {
            // Find the closest mast position for this sail
            const matchingMast = Ship.MASTS.find(mast => 
                Math.abs(mast.x - module.position.x) < 20 && 
                Math.abs(mast.y - module.position.y) < 20);
                
            if (matchingMast) {
                // Use exact mast coordinates for this sail
                module.position = { x: matchingMast.x, y: matchingMast.y };
            }
        }
        else if (module.type === 'cannon') {
            // Find the closest cannon position
            const matchingCannon = Ship.CANNONS.find(cannon => 
                Math.abs(cannon.x - module.position.x) < 20 && 
                Math.abs(cannon.y - module.position.y) < 20);
                
            if (matchingCannon) {
                // Use exact cannon coordinates
                module.position = { x: matchingCannon.x, y: matchingCannon.y };
            }
        }
    }
    
    // Get the visual position for a module (used for rendering)
    private getModuleVisualPosition(id: string): { x: number, y: number } {
        // If we have a stored visual position, use it
        if (this.moduleVisualPositions.has(id)) {
            return this.moduleVisualPositions.get(id)!;
        }
        
        // Otherwise, use the module's position directly
        const module = this.modules.get(id);
        return module ? module.position : { x: 0, y: 0 };
    }
    
    // Remove a module from the ship
    removeModule(id: string): boolean {
        if (!this.modules.has(id)) {
            return false;
        }
        
        this.modules.delete(id);
        return true;
    }
    
    // Update all modules
    updateModules(): void {
        this.modules.forEach((module, id) => {
            // Make sure module positions are consistent with visual positions
            if (this.moduleVisualPositions.has(id)) {
                // Update the moduleVisualPositions if needed for any dynamically moved modules
                if (module.type === 'sail' || module.type === 'cannon' || module.type === 'wheel') {
                    // For fixed modules like sails, cannons, and wheel, we ensure they stay at their fixed positions
                    this.ensureModuleVisualPosition(id, module);
                }
            }
            
            // Call the module's update method
            module.update();
        });
    }
    
    // Calculate water intake based on damaged planks
    calculateWaterIntake(): number {
        let damagedPlankCount = 0;
        
        for (const plank of this.planks) {
            if (plank.health < 50) {
                damagedPlankCount++;
            }
        }
        
        return damagedPlankCount * 0.05; // 5% water per damaged plank
    }
    
    // Update the ship's water level
    updateWaterLevel(): void {
        const waterIntake = this.calculateWaterIntake();
        this.waterLevel += waterIntake;
        
        if (this.waterLevel >= 100) {
            this.sink();
        }
    }
    
    // Function to handle the ship sinking
    sink(): void {
        // Debug logging removed to be reimplemented
        // Implement sinking mechanics
    }
    
    // Take damage to a specific plank
    damagePlank(plankIndex: number, amount: number): void {
        if (plankIndex >= 0 && plankIndex < this.planks.length) {
            this.planks[plankIndex].health -= amount;
            if (this.planks[plankIndex].health < 0) {
                this.planks[plankIndex].health = 0;
            }
        }
    }

    // Apply rudder force to turn the ship
    applyRudder(direction: 'left' | 'right' | 'center'): void {
        // Make rudder change rate more gradual
        const baseRudderChangeRate = 0.5; // Base rate for rudder change
        
        // Calculate current ship speed
        const currentSpeed = Math.sqrt(
            this.body.velocity.x ** 2 + 
            this.body.velocity.y ** 2
        );
        
        // Update the ship's momentum value (used for turning calculations)
        // Momentum builds up more at higher speeds, making turning harder
        this.momentum = Math.min(1.0, this.momentum * 0.95 + currentSpeed * 0.01);

        // Adjust rudder change rate based on current ship speed
        // For visual feedback, we actually want faster rudder movement at higher speeds
        // This gives a value between 0.5 and 1.2 times the base rate
        const visualSpeedFactor = 0.5 + Math.min(0.7, currentSpeed / 3);
        const rudderChangeRate = baseRudderChangeRate * visualSpeedFactor;
        
        // Adjust rudder angle based on input with the dynamic change rate
        switch (direction) {
            case 'left':
                this.rudderAngle = Math.max(-30, this.rudderAngle - rudderChangeRate);
                break;
            case 'right':
                this.rudderAngle = Math.min(30, this.rudderAngle + rudderChangeRate);
                break;
            case 'center':
                // Return rudder to center position
                if (this.rudderAngle > 0) {
                    this.rudderAngle = Math.max(0, this.rudderAngle - rudderChangeRate);
                } else if (this.rudderAngle < 0) {
                    this.rudderAngle = Math.min(0, this.rudderAngle + rudderChangeRate);
                }
                break;
        }
        
        // Calculate sail power to correlate turning with wind force
        let sailPower = 0;
        let sailCount = 0;
        
        // Calculate average sail openness and efficiency
        this.modules.forEach(module => {
            if (module.type === 'sail' && module.openness !== undefined && module.openness > 0) {
                sailPower += module.openness;
                sailCount += 1;
            }
        });
        
        // Get average sail power as a factor between 0 and 1
        const avgSailPower = sailCount > 0 ? sailPower / (sailCount * 100) : 0;
        
        // Calculate base turning force
        const baseTurningPower = 0.000015; // Base turning power constant
        
        // NEW TURNING LOGIC: Less effective at higher speeds due to inertia
        // Calculate turning effectiveness as inverse to speed with a minimum value
        // At speed 0: turnEffectiveness = 1.0
        // At high speed: turnEffectiveness approaches 0.3
        const turnEffectiveness = Math.max(0.3, 1 - (this.momentum * 0.7));
        
        // Apply sail power as a factor (no sails = reduced turning)
        const sailFactor = 0.3 + 0.7 * avgSailPower;
        
        // Calculate final turning force
        this.turningForce = this.rudderAngle * baseTurningPower * turnEffectiveness * sailFactor;
        
        // Apply the turning force as a torque
        // We now apply force even when the ship is stationary (as long as sails are open)
        // This allows the ship to start turning from a standstill
        if (currentSpeed > 0.05 || avgSailPower > 0) {
            Matter.Body.setAngularVelocity(this.body, this.body.angularVelocity + this.turningForce);
        }
        
        // Update visual position based on physics body position
        this.position.x = this.body.position.x;
        this.position.y = this.body.position.y;
        
        // Debug logging removed to be reimplemented
    }
    
    // Calculate wind power based on sail angle relative to wind direction
    calculateSailEfficiency(): number {
        // Get sail angles across all sails
        let totalEfficiency = 0;
        let sailCount = 0;
        
        this.modules.forEach(module => {
            if (module.type === 'sail' && (module.openness || 0) > 0) {
                const sailAngle = module.angle || 0; // Default to 0 if not set
                
                // Calculate angle between wind and sail
                // We need to account for:
                // 1. The ship's orientation (body.angle)
                // 2. The sail's rotation relative to the ship (sailAngle)
                // 3. The wind direction
                
                // Convert sail angle from degrees to radians
                const sailAngleRad = sailAngle * Math.PI / 180;
                
                // Calculate the sail's normal vector (perpendicular to sail face)
                // The sail normal is perpendicular to its face and indicates which way it's pointing
                const sailNormalAngle = this.body.angle + sailAngleRad + Math.PI/2; // Add 90 degrees to get normal
                
                // Calculate sail direction vector components (normal to sail face)
                const sailNormalX = Math.cos(sailNormalAngle);
                const sailNormalY = Math.sin(sailNormalAngle);
                
                // FIXED: Use the inverted wind direction to match the corrected visualization
                // The visualization shows where the wind comes FROM (meteorological convention)
                // But physics uses where the wind goes TO (mathematical vector convention)
                // We need to flip the direction by adding PI (180 degrees) to align them
                const physicsWindDirection = this.currentWindDirection;
                
                // Calculate wind direction vector components (where the wind is going)
                const windDirX = Math.cos(physicsWindDirection);
                const windDirY = Math.sin(physicsWindDirection);
                
                // Calculate dot product between wind direction and sail normal
                // Positive dot product: wind hits sail from front
                // Negative dot product: wind hits sail from behind
                const dotProduct = windDirX * sailNormalX + windDirY * sailNormalY;
                
                // Calculate angle between wind direction and sail normal vector
                let windSailAngleDiff = Math.acos(Math.min(1, Math.max(-1, dotProduct)));
                
                let efficiency = 0;
                
                // NEW HALF-CIRCLE SAIL RANGE IMPLEMENTATION:
                // Sail efficiency is now based on a half-circle range (+/- 90 degrees from wind direction)
                // Maximum efficiency when directly pointing at wind direction
                // 35% efficiency at the tolerance edges (90 degrees off wind)
                
                // Calculate the angle between the sail normal vector and wind direction in degrees
                const angleDiffDegrees = windSailAngleDiff * 180 / Math.PI;
                
                // Only consider angles within +/- 90 degrees of the wind direction for optimal efficiency
                if (angleDiffDegrees <= 90) {
                    // Linear interpolation from 1.0 (direct) to 0.35 (90 degrees off)
                    // When angleDiffDegrees = 0: efficiency = 1.0
                    // When angleDiffDegrees = 90: efficiency = 0.35
                    efficiency = 1.0 - (0.65 * angleDiffDegrees / 90);
                } else {
                    // Default to 35% efficiency when outside the optimal range
                    efficiency = 0.35;
                }
                
                // Scale efficiency from 0-1 range
                efficiency = Math.min(1, Math.max(0.35, efficiency));
                
                // Scale by sail openness
                const sailOpenness = (module.openness || 0) / 100;
                
                // Only add angle bonus if we already have some efficiency
                let angleBonus = 0;
                if (efficiency > 0) {
                    // Add a bonus for angled sails - this rewards using the wider range
                    // Sails angled more dramatically catch more wind when appropriate
                    angleBonus = Math.min(0.2, Math.abs(sailAngle) / 75 * 0.2);
                }
                
                totalEfficiency += (efficiency + angleBonus) * sailOpenness;
                sailCount++;
            }
        });
        
        return sailCount > 0 ? Math.min(1.5, totalEfficiency / sailCount) : 0; // Cap at 150% efficiency
    }
    
    // Rotate all sails by a certain angle
    rotateSails(direction: 'left' | 'right' | 'center'): void {
        const rotationRate = 1.25; // Degrees per call (reduced to 25% of original 5 degrees)
        
        this.modules.forEach(module => {
            if (module.type === 'sail') {
                // Initialize angle if not set
                if (module.angle === undefined) {
                    module.angle = 0;
                }
                
                // Adjust angle based on direction
                switch (direction) {
                    case 'left':
                        module.angle = Math.max(-75, module.angle - rotationRate);
                        break;
                    case 'right':
                        module.angle = Math.min(75, module.angle + rotationRate);
                        break;
                    case 'center':
                        // Return sails to center position
                        if (module.angle > 0) {
                            module.angle = Math.max(0, module.angle - rotationRate);
                        } else if (module.angle < 0) {
                            module.angle = Math.min(0, module.angle + rotationRate);
                        }
                        break;
                }
                
                // Debug logging removed to be reimplemented
            }
        });
    }

    fireCannon(): void {
        // Get all cannon modules
        const cannons = Array.from(this.modules.values()).filter(module => module.type === 'cannon');
        
        if (cannons.length === 0) {
            // No cannons available
            return;
        }
        
        // Fire all cannons
        cannons.forEach(cannon => {
            cannon.use();
            
            // Note: In a future implementation, we could add projectile physics here
            // using the cannon's rotation to determine direction
        });
        
        // Debug logging removed to be reimplemented
    }

    takeDamage(amount: number): void {
        this.health -= amount;
        if (this.health <= 0) {
            this.destroy();
        }
    }

    // Apply wind forces to the ship based on sail configuration
    applyWindForce(windDirection: number, windPower: number): void {
        
        // Store the current wind direction and power for use in other methods
        this.currentWindDirection = windDirection;
        this.currentWindPower = windPower;

        // Get the average openness of all sail modules
        let totalSailOpenness = 0;
        let sailCount = 0;
        let sailsAreOpen = false;
        
        this.modules.forEach(module => {
            if (module.type === 'sail') {
                const openness = module.openness || 0;
                totalSailOpenness += openness;
                sailCount++;
                
                if (openness > 0) {
                    sailsAreOpen = true;
                }
            }
        });
        
        // Average sail openness (0-100%)
        const avgSailOpenness = sailCount > 0 ? totalSailOpenness / sailCount : 0;
        
        // Apply drag based on sail openness and momentum
        // When sails are 0% open: strong drag (0.85)
        // When sails are 100% open: lighter drag (0.98)
        // We also factor in the ship's momentum - more momentum = less drag
        const momentumFactor = Math.min(0.05, this.momentum * 0.05);
        const dragFactor = sailsAreOpen ? 
            0.85 + (avgSailOpenness / 100) * 0.13 + momentumFactor : // Add momentum bonus to drag reduction
            0.85; // Strong drag when sails are closed
        
        // Apply drag to slow the ship
        Matter.Body.setVelocity(this.body, {
            x: this.body.velocity.x * dragFactor,
            y: this.body.velocity.y * dragFactor
        });
        
        // Stop the ship completely if it's moving very slowly and sails are closed
        if (!sailsAreOpen && 
            Math.abs(this.body.velocity.x) < 0.05 && 
            Math.abs(this.body.velocity.y) < 0.05) {
            Matter.Body.setVelocity(this.body, { x: 0, y: 0 });
            
            // Reset momentum when stopped
            this.momentum = 0;
        }
        
        // Only apply wind force if sails are open
        if (sailsAreOpen) {
            // Calculate sail efficiency based on wind angle
            const sailEfficiency = this.calculateSailEfficiency();
            
            // FIXED: Get wind direction components
            // Use the same physics wind direction throughout all calculations
            const physicsWindDirection = windDirection;
            const windDirectionX = Math.cos(physicsWindDirection);
            const windDirectionY = Math.sin(physicsWindDirection);
            
            // Calculate ship's forward direction vector based on its rotation
            const shipDirectionX = Math.cos(this.body.angle);
            const shipDirectionY = Math.sin(this.body.angle);
            
            // Calculate wind angle relative to ship (needed for proper sailing physics)
            const relativeWindAngle = Math.atan2(
                windDirectionY * shipDirectionX - windDirectionX * shipDirectionY,
                windDirectionX * shipDirectionX + windDirectionY * shipDirectionY
            );
            
            // Calculate force magnitude based on sail efficiency and wind power
            this.forwardForce = windPower * sailEfficiency * 0.024;
            
            // Ensure the ship always moves forward even against the wind (with lower efficiency)
            
            // Calculate alignment factor for ship direction vs wind direction using the new half-circle model
            // Maximum efficiency when directly pointing at wind direction
            // 35% efficiency at the tolerance edges (90 degrees off wind)
            let alignmentFactor;
            
            // Convert relative angle to absolute value in range 0 to PI
            const absRelativeAngle = Math.abs(relativeWindAngle);
            
            // Calculate the angle difference in degrees (0-180)
            const angleDiffDegrees = absRelativeAngle * 180 / Math.PI;
            
            // Use the new half-circle model with linear interpolation
            if (angleDiffDegrees <= 90) {
                // Direct alignment (0 degrees): 1.0 efficiency
                // Edge of tolerance (90 degrees): 0.35 efficiency
                alignmentFactor = 1.0 - (0.65 * angleDiffDegrees / 90);
            } else {
                // Outside the half-circle range
                alignmentFactor = 0.35 * Math.max(0, 1 - ((angleDiffDegrees - 90) / 90));
            }
            
            // Normalize to range 0.1-1.0
            alignmentFactor = Math.max(0.1, alignmentFactor);
            
            // Make sure we apply force in the right direction based on the sails
            // Only apply force if sails are actually catching wind effectively
            const effectiveForce = sailEfficiency > 0 ? this.forwardForce * alignmentFactor : 0;
            
            // FIXED: Force is always applied in the ship's forward direction
            // The wind just determines how much force (speed) the ship gets
            const forceVector = {
                x: shipDirectionX * effectiveForce,
                y: shipDirectionY * effectiveForce
            };
            
            // Apply force in the ship's forward direction
            Matter.Body.applyForce(this.body, this.body.position, forceVector);
            
            // Debug logging removed to be reimplemented
        }
    }

    // Open or close the sails by a specific percentage
    adjustSails(openPercent: number): void {
        // Find all sail modules
        this.modules.forEach(module => {
            if (module.type === 'sail') {
                // Ensure the value is between 0 and 100
                const newOpenness = Math.max(0, Math.min(100, openPercent));
                module.openness = newOpenness;
                // Debug logging removed to be reimplemented
            }
        });
    }

    // Gradually open all sails by 10%
    openSails(): void {
        // Get sail modules
        const sailModules = Array.from(this.modules.values()).filter(m => m.type === 'sail');
        
        // Update each sail module
        sailModules.forEach(module => {
            if (module.openness !== undefined) {
                const newOpenness = Math.min(100, module.openness + 10);
                module.openness = newOpenness;
            }
        });
        
        // Debug logging removed to be reimplemented
    }

    // Gradually close all sails by 10%
    closeSails(): void {
        // Get sail modules
        const sailModules = Array.from(this.modules.values()).filter(m => m.type === 'sail');
        
        // Update each sail module
        sailModules.forEach(module => {
            if (module.openness !== undefined) {
                const newOpenness = Math.max(0, module.openness - 10);
                module.openness = newOpenness;
            }
        });
        
        // Debug logging removed to be reimplemented
    }

    update(): void {
        // Update visual position based on physics body position
        this.position.x = this.body.position.x;
        this.position.y = this.body.position.y;
        
        // Calculate current ship speed
        const currentSpeed = Math.sqrt(
            this.body.velocity.x ** 2 + 
            this.body.velocity.y ** 2
        );
        
        // Check if sails are open
        let sailsAreOpen = false;
        
        this.modules.forEach(module => {
            if (module.type === 'sail') {
                const openness = module.openness || 0;
                
                if (openness > 0) {
                    sailsAreOpen = true;
                }
            }
        });
        
        // Update momentum value - this affects turning effectiveness
        // Momentum gradually decreases when sails are closed
        if (!sailsAreOpen) {
            this.momentum = Math.max(0, this.momentum - 0.01);
        } else {
            // When sails are open, momentum updates based on speed
            this.momentum = Math.min(1.0, this.momentum * 0.99 + currentSpeed * 0.01);
        }
        
        // Only apply extra drag when sails are closed
        if (!sailsAreOpen) {
            // Apply a small amount of additional drag to ensure the ship stops naturally
            const velocityDecay = 0.985; // Slightly lower decay for more natural motion
            Matter.Body.setVelocity(this.body, {
                x: this.body.velocity.x * velocityDecay,
                y: this.body.velocity.y * velocityDecay
            });
            
            // Apply stronger stopping force when the ship is moving very slowly
            // This prevents the ship from drifting indefinitely
            if (Math.abs(this.body.velocity.x) < 0.08 && Math.abs(this.body.velocity.y) < 0.08) {
                const strongDrag = 0.85; // Slightly higher value to allow more slow drift
                Matter.Body.setVelocity(this.body, {
                    x: this.body.velocity.x * strongDrag,
                    y: this.body.velocity.y * strongDrag
                });
                
                // Stop completely if extremely slow
                if (Math.abs(this.body.velocity.x) < 0.005 && Math.abs(this.body.velocity.y) < 0.005) {
                    Matter.Body.setVelocity(this.body, { x: 0, y: 0 });
                    // Reset momentum when stopped
                    this.momentum = 0;
                }
            }
        } else {
            // With sails open, apply a very minor decay to simulate water resistance
            const waterResistance = 0.997;
            Matter.Body.setVelocity(this.body, {
                x: this.body.velocity.x * waterResistance,
                y: this.body.velocity.y * waterResistance
            });
        }
        
        // Update water level
        this.updateWaterLevel();
        
        // Update modules
        this.updateModules();
    }
    
    // Set a flag to indicate if the player is on this ship
    // This can be used by other systems to modify physics behavior
    setPlayerOnBoard(isPlayerOnBoard: boolean, isAtWheel: boolean = false): void {
        // Update player at wheel tracking
        this.playerAtWheel = isAtWheel;
        
        if (isPlayerOnBoard) {
            // When player boards, we can disable specific collision types if needed
            Matter.Body.set(this.body, {
                collisionFilter: {
                    ...this.body.collisionFilter,
                    group: -1 // Negative group means it won't collide with other bodies in the same group
                }
            });
        } else {
            // Restore normal collision behavior when player leaves
            Matter.Body.set(this.body, {
                collisionFilter: {
                    ...this.body.collisionFilter,
                    group: 0 // Reset to default group
                }
            });
            
            // Reset wheel status when player leaves ship completely
            this.playerAtWheel = false;
        }
    }
    
    // Toggle player between steering wheel and walking on deck
    togglePlayerAtWheel(isAtWheel: boolean): void {
        this.playerAtWheel = isAtWheel;
    }
    
    // Check if a position is on the ship's deck (always matches visual hull shape, excludes obstacles)
    isPositionOnDeck(x: number, y: number, ctx?: CanvasRenderingContext2D): boolean {
        // Transform world coordinates to ship's local space
        const localX = x - this.position.x;
        const localY = y - this.position.y;
        const cosA = Math.cos(-this.body.angle);
        const sinA = Math.sin(-this.body.angle);
        const rotatedX = localX * cosA - localY * sinA;
        const rotatedY = localX * sinA + localY * cosA;
        
        // Always ensure path exists
        if (!this.path) {
            this.path = Ship.createHullPath();
        }
        
        // First check: Is point inside the hull?
        let isInHull = false;
        
        if (ctx) {
            // If we have a context, use it directly
            isInHull = ctx.isPointInPath(this.path, rotatedX, rotatedY);
        } else {
            // Use the bounding path as an approximation when no context
            // This checks if the point is roughly within the hull bounds
            // Reduce bow (front) and stern (back) walkable areas to match visual appearance
            isInHull = (
                rotatedX >= -300 && rotatedX <= 320 && 
                rotatedY >= -90 && rotatedY <= 90 &&
                // Enhanced bow curvature - uses quadratic curve simulation instead of triangular shape
                // This creates a more realistic curved bow shape that follows the visual hull
                !(rotatedX > 150 && (Math.abs(rotatedY) > 90 * (1 - Math.pow((rotatedX - 150) / 175, 2)))) &&
                // Enhanced stern curvature - also uses quadratic curve for better visual matching
                // Creates a more realistic curved stern shape that follows the visual hull
                !(rotatedX < -220 && (Math.abs(rotatedY) > 90 * (1 - Math.pow((Math.abs(rotatedX) - 220) / 85, 2))))
            );
        }
        
        if (!isInHull) return false;
        
        // Second check: Exclude obstacles
        // Exclude masts
        for (const mast of Ship.MASTS) {
            const dx = rotatedX - mast.x, dy = rotatedY - mast.y;
            if (dx*dx + dy*dy < mast.r*mast.r) return false;
        }
        // Exclude wheel (rectangle)
        const wx = Ship.WHEEL.x, wy = Ship.WHEEL.y, ww = Ship.WHEEL.w, wh = Ship.WHEEL.h;
        if (
            rotatedX > wx - ww/2 && rotatedX < wx + ww/2 &&
            rotatedY > wy - wh/2 && rotatedY < wy + wh/2
        ) return false;
        // Exclude cannons
        for (const cannon of Ship.CANNONS) {
            if (
                rotatedX > cannon.x - cannon.w/2 && rotatedX < cannon.x + cannon.w/2 &&
                rotatedY > cannon.y - cannon.h/2 && rotatedY < cannon.y + cannon.h/2
            ) return false;
        }
        
        // Also check dynamic module obstacles using their visual positions
        for (const [id, module] of this.modules.entries()) {
            // Skip modules that are already handled by static obstacles
            const isStaticObstacle = 
                (module.type === 'wheel' && module.position.x === Ship.WHEEL.x && module.position.y === Ship.WHEEL.y) ||
                (module.type === 'cannon' && Ship.CANNONS.some(c => 
                    c.x === module.position.x && c.y === module.position.y));
            
            if (!isStaticObstacle) {
                // Get visual position for collision detection
                const visualPos = this.getModuleVisualPosition(id);
                const moduleSize = 20; // Default size for modules
                
                // Simple box collision check
                if (
                    rotatedX > visualPos.x - moduleSize/2 && rotatedX < visualPos.x + moduleSize/2 &&
                    rotatedY > visualPos.y - moduleSize/2 && rotatedY < visualPos.y + moduleSize/2
                ) return false;
            }
        }
        
        return true;
    }

    destroy() {
        // Debug logging removed to be reimplemented
        // Logic for ship destruction
    }

    // Draw the ship using the provided context
    draw(ctx: CanvasRenderingContext2D): void {
        ctx.save();
        
        // Center visuals on the unified center point
        ctx.translate(this.position.x, this.position.y);
        ctx.rotate(this.body.angle);
        
        // Create hull path if needed and draw it
        if (!this.path) this.path = Ship.createHullPath();
        
        // Draw hull with wood texture effect
        ctx.fillStyle = '#D2B48C';
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 10;
        ctx.fill(this.path);
        ctx.stroke(this.path);
        
        // Draw deck features in order
        
        // Draw cannons
        for (const cannon of Ship.CANNONS) {
            this.drawCannon(ctx, cannon.x, cannon.y, cannon.y > 0 ? Math.PI : 0);
        }
        
        // Draw masts and sails
        for (const mast of Ship.MASTS) {
            this.drawMastAndSail(ctx, mast.x, mast.y, this.getSailOpennessAt(mast.x, mast.y));
        }
        
        // Draw wheel
        this.drawSteeringWheel(ctx, Ship.WHEEL.x, Ship.WHEEL.y);
        
        // Restore context to original state
        ctx.restore();
    }
    
    // Placeholder for debug collision visualization
    // @ts-ignore
    drawDebugCollision(ctx: CanvasRenderingContext2D): void {
        // Debug method removed to be reimplemented from scratch
    }

    /**
     * Placeholder for debug collision box visualization
     */
    // @ts-ignore
    drawDebugCollisionBox(ctx: CanvasRenderingContext2D): void {
        // Debug method removed to be reimplemented from scratch
    }
    
    // Helper method to draw a mast and sail at the specified position
    private drawMastAndSail(ctx: CanvasRenderingContext2D, x: number, y: number, sailOpenness: number): void {
        // Find the sail module for this position to get its angle
        let sailAngle = 0;
        
        // Find matching sail module by position
        for (const [id, module] of this.modules.entries()) {
            if (module.type === 'sail') {
                // Get the visual position for comparison
                const visualPos = this.getModuleVisualPosition(id);
                
                if (visualPos.x === x && visualPos.y === y) {
                    if (module.angle !== undefined) {
                        sailAngle = module.angle;
                    }
                    break;
                }
            }
        }
        
        ctx.save();
        ctx.translate(x, y);
        
        // Draw mast
        ctx.beginPath();
        ctx.arc(0, 0, 15, 0, Math.PI * 2);
        ctx.fillStyle = '#D2B48C';
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 4;
        ctx.fill();
        ctx.stroke();
        
       
        // Draw sail only if it's open
        if (sailOpenness > 0) {
            // Apply sail rotation based on sail angle
            ctx.save();
            ctx.rotate(sailAngle * Math.PI / 180);
            
            // Draw sail with openness affecting the curve
            ctx.beginPath();
            ctx.moveTo(0, 130);
            
            // Adjust the curve based on sail openness
            const curveAmount = 10 + sailOpenness * 90;
            ctx.quadraticCurveTo(curveAmount, 0, 0, -130);
            ctx.closePath();
            
            // Calculate sail efficiency based on wind and sail angle
            let sailEfficiency = 0.35; // Minimum efficiency
            const windDirection = this.currentWindDirection;
            
            // Calculate angle between wind and sail
            const effectiveSailAngle = this.body.angle + (sailAngle * Math.PI / 180);
            const sailNormalAngle = effectiveSailAngle + Math.PI/2;
            const sailNormalX = Math.cos(sailNormalAngle);
            const sailNormalY = Math.sin(sailNormalAngle);
            const windDirX = Math.cos(windDirection);
            const windDirY = Math.sin(windDirection);
            const dotProduct = windDirX * sailNormalX + windDirY * sailNormalY;
            const angleDiff = Math.acos(Math.min(1, Math.max(-1, dotProduct))) * 180 / Math.PI;
            
            // Calculate efficiency (1.0 at 0°, 0.35 at 90°)
            if (angleDiff <= 90) {
                sailEfficiency = 1.0 - (0.65 * angleDiff / 90);
            }
            
            // Set sail color based on efficiency
            const r = Math.floor(255 * (1 - sailEfficiency));
            const g = Math.floor(255 * sailEfficiency);
            const b = Math.floor(255 * 0.8);
            const sailColor = `rgba(${r}, ${g}, ${b}, 0.8)`;
            
            const sailGradient = ctx.createLinearGradient(-curveAmount/2, 0, curveAmount/2, 0);
            sailGradient.addColorStop(0, 'white');
            sailGradient.addColorStop(0.5, sailColor);
            sailGradient.addColorStop(1, 'white');
            
            ctx.fillStyle = sailGradient;
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2;
            ctx.fill();
            ctx.stroke();
            
            // Draw curved sail fibers that follow the sail curve
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.lineWidth = 1.5;
            
            // Draw nice curved sail fibers
            for (let i = 1; i <= 4; i++) {
                const t = i / 5; // Positions at 0.2, 0.4, 0.6, 0.8 of the sail height
                ctx.beginPath();
                const y1 = 130 - 260 * t; // Start point on the left edge
                ctx.moveTo(0, y1);
                
                // Calculate control point that adjusts with the position in the sail
                // Fibers at the center of the sail curve more than at the edges
                const controlX = curveAmount * (1 - t * 0.5);
                
                // Draw a curved fiber that follows the sail's shape
                ctx.quadraticCurveTo(controlX, 0, 0, -y1);
                ctx.stroke();
            }
            
            ctx.restore(); 
        }
        
        ctx.restore();
    }
    
    // Helper method to draw the steering wheel
    private drawSteeringWheel(ctx: CanvasRenderingContext2D, x: number, y: number): void {
        ctx.save();
        ctx.translate(x, y);
        
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
        
        // Draw wheel spokes
        // ctx.strokeStyle = '#432100';
        // ctx.lineWidth = 2;
        // for (let i = 0; i < 8; i++) {
        //     const angle = (i / 8) * Math.PI * 2;
        //     ctx.beginPath();
        //     ctx.moveTo(-30, 0);
        //     ctx.lineTo(-30 + Math.cos(angle) * 14, Math.sin(angle) * 14);
        //     ctx.stroke();
        // }
        
        ctx.restore();
    }
    
    // Helper method to draw a cannon
    private drawCannon(ctx: CanvasRenderingContext2D, x: number, y: number, rotation: number): void {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotation);
        
        // Draw cannon base
        ctx.fillStyle = '#8B4513';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.fillRect(-15, -10, 30, 20);
        ctx.strokeRect(-15, -10, 30, 20);

        // Draw cannon barrel
        ctx.fillStyle = '#333333';
        ctx.beginPath();
        ctx.moveTo(-8, 0);
        ctx.lineTo(-8, -40);
        ctx.lineTo(8, -40);
        ctx.lineTo(8, 0);
        ctx.closePath();
        ctx.fill();
        
        // Draw cannon wheels
        ctx.fillStyle = '#654321';
        ctx.beginPath();
        ctx.arc(-10, 10, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(10, 10, 5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }

    // Visualize the walkable area of the ship with a grid of test points
    testWalkableArea(ctx: CanvasRenderingContext2D, gridSize: number): void {
        // Save context state
        ctx.save();
        
        // Translate and rotate to match ship's position and orientation
        ctx.translate(this.position.x, this.position.y);
        ctx.rotate(this.body.angle);
        
        // Get ship dimensions for the test grid
        const shipWidth = this.size.width * 1.1; // Extend a bit to ensure we cover the whole ship
        const shipHeight = this.size.height * 1.1;
        
        // Create hull path if not already created
        if (!this.path) {
            this.path = Ship.createHullPath();
        }
        
        // Draw a semi-transparent fill for the hull area
        ctx.fillStyle = 'rgba(200, 200, 255, 0.15)';
        ctx.fill(this.path);
        
        // Draw hull outline for reference
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 3;
        ctx.stroke(this.path);
        
        // Draw the rectangular physics boundary
        ctx.strokeStyle = 'rgba(255, 255, 0, 0.4)';
        ctx.lineWidth = 1;
        ctx.strokeRect(-this.size.width/2, -this.size.height/2, this.size.width, this.size.height);
        
        // Calculate bounds for the test grid
        const halfWidth = shipWidth / 2;
        const halfHeight = shipHeight / 2;
        
        // Use a finer grid for debugging with smaller dots
        const testPointSize = Math.max(2, gridSize / 4);
        
        // Test grid of points to visualize walkable areas
        for (let x = -halfWidth; x <= halfWidth; x += gridSize) {
            for (let y = -halfHeight; y <= halfHeight; y += gridSize) {
                // Get world coordinates for this test point (for checking walkability)
                const worldX = this.position.x + x * Math.cos(this.body.angle) - y * Math.sin(this.body.angle);
                const worldY = this.position.y + x * Math.sin(this.body.angle) + y * Math.cos(this.body.angle);
                
                // First check directly against the path to determine if inside hull
                const insideHull = ctx.isPointInPath(this.path, x, y);
                
                // Then check against the walkable area function (includes obstacle checking)
                const isWalkable = this.isPositionOnDeck(worldX, worldY, ctx);
                
                // Determine colors based on point status
                if (isWalkable) {
                    // Walkable area - use bright green with good visibility
                    ctx.fillStyle = 'rgba(0, 220, 0, 0.85)';
                } else if (insideHull) {
                    // Inside hull but not walkable (obstacles) - use bright red
                    ctx.fillStyle = 'rgba(255, 0, 0, 0.85)';
                } else {
                    // Outside ship's hull - use translucent blue
                    // Use more translucent color to make the grid less distracting
                    ctx.fillStyle = 'rgba(0, 0, 255, 0.05)';
                }
                
                // Draw test point
                ctx.beginPath();
                ctx.arc(x, y, testPointSize, 0, Math.PI * 2);
                ctx.fill();
                
                // Add a stroke for better visibility
                if (isWalkable) {
                    ctx.strokeStyle = 'rgba(0, 100, 0, 0.8)';
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }
            }
        }
        
        // Draw the obstacles explicitly for clarity
        
        // Draw mast obstacle areas
        ctx.fillStyle = 'rgba(139, 69, 19, 0.7)'; // Brown for masts
        for (const mast of Ship.MASTS) {
            ctx.beginPath();
            ctx.arc(mast.x, mast.y, mast.r, 0, Math.PI * 2);
            ctx.fill();
            
            // Label the mast
            ctx.fillStyle = 'white';
            ctx.font = '12px Arial';
            ctx.fillText('Mast', mast.x - 15, mast.y);
            ctx.fillStyle = 'rgba(139, 69, 19, 0.7)';
        }
        
        // Draw wheel obstacle
        const wx = Ship.WHEEL.x, wy = Ship.WHEEL.y, ww = Ship.WHEEL.w, wh = Ship.WHEEL.h;
        ctx.fillStyle = 'rgba(255, 215, 0, 0.7)'; // Gold for wheel
        ctx.fillRect(wx - ww/2, wy - wh/2, ww, wh);
        
        // Label the wheel
        ctx.fillStyle = 'white';
        ctx.font = '12px Arial';
        ctx.fillText('Wheel', wx - 20, wy);
        
        // Draw cannon obstacles
        ctx.fillStyle = 'rgba(169, 169, 169, 0.7)'; // Gray for cannons
        for (const cannon of Ship.CANNONS) {
            ctx.fillRect(
                cannon.x - cannon.w/2, 
                cannon.y - cannon.h/2, 
                cannon.w, 
                cannon.h
            );
        }
        
        // Draw dynamic obstacles from modules (if any were added)
        this.modules.forEach((module, id) => {
            // Skip modules that match existing static obstacles
            const isStaticObstacle = 
                (module.type === 'wheel' && module.position.x === Ship.WHEEL.x && module.position.y === Ship.WHEEL.y) ||
                (module.type === 'cannon' && Ship.CANNONS.some(c => 
                    c.x === module.position.x && c.y === module.position.y));
            
            if (!isStaticObstacle) {
                ctx.fillStyle = 'rgba(255, 0, 255, 0.7)'; // Purple for dynamic modules
                const moduleSize = 20; // Default size for modules
                
                // Use the visual position for rendering
                const visualPos = this.getModuleVisualPosition(id);
                
                ctx.fillRect(
                    visualPos.x - moduleSize/2,
                    visualPos.y - moduleSize/2,
                    moduleSize,
                    moduleSize
                );
                
                // Label the module
                ctx.fillStyle = 'white';
                ctx.font = '10px Arial';
                ctx.fillText(module.type, visualPos.x - 15, visualPos.y);
            }
        });
        
        ctx.restore();
    }

    // Find a safe position to dismount the player without getting stuck in obstacles
    findSafeDismountPosition(startX: number, startY: number, ctx?: CanvasRenderingContext2D): { x: number, y: number } {
        // First check if the starting position is already safe
        if (this.isPositionOnDeck(startX, startY, ctx)) {
            return { x: startX, y: startY };
        }
        
        // Convert world start position to local ship coordinates
        const localX = startX - this.position.x;
        const localY = startY - this.position.y;
        const cosA = Math.cos(-this.body.angle);
        const sinA = Math.sin(-this.body.angle);
        const rotatedX = localX * cosA - localY * sinA;
        const rotatedY = localX * sinA + localY * cosA;
        
        // Define search parameters
        const searchRadius = 60; // Radius to search for a safe position
        const steps = 8; // Number of directions to check
        const increments = 5; // Number of distance increments to check in each direction
        
        // Try positions in a radial pattern around the starting point
        for (let inc = 1; inc <= increments; inc++) {
            const stepDistance = (searchRadius * inc) / increments;
            
            for (let i = 0; i < steps; i++) {
                const angle = (i / steps) * Math.PI * 2;
                const testLocalX = rotatedX + Math.cos(angle) * stepDistance;
                const testLocalY = rotatedY + Math.sin(angle) * stepDistance;
                
                // Convert back to world coordinates for testing
                const testWorldX = this.position.x + testLocalX * Math.cos(this.body.angle) - testLocalY * Math.sin(this.body.angle);
                const testWorldY = this.position.y + testLocalX * Math.sin(this.body.angle) + testLocalY * Math.cos(this.body.angle);
                
                // Check if this position is safe
                if (this.isPositionOnDeck(testWorldX, testWorldY, ctx)) {
                    return { x: testWorldX, y: testWorldY };
                }
            }
        }
        
        // If we couldn't find a good position, use the center of the ship as a last resort
        return { x: this.position.x, y: this.position.y };
    }

    // --- Helper to get sail openness at a mast position ---
    private getSailOpennessAt(x: number, y: number): number {
        for (const [id, module] of this.modules.entries()) {
            if (module.type === 'sail' && module.openness !== undefined) {
                // Get visual position to compare with the requested mast position
                const visualPos = this.getModuleVisualPosition(id);
                if (visualPos.x === x && visualPos.y === y) {
                    return module.openness / 100;
                }
            }
        }
        return 0;
    }
}


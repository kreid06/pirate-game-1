// This file exports a class Game that manages the overall game state, including starting, updating, and rendering the game.
// Fixed ship collision box alignment: The visual representation now matches the physics body with a 100px X-offset
// Press 'G' to toggle walkable area test visualization and 'L' for debug info

import Matter, { Engine } from 'matter-js';
import Player from './Player';
import Ship, { ShipModule } from './Ship';
import Enemy from './Enemy';
import WorldManager from './World';
import Cannonball from './Cannonball';
import { CannonModule, SailModule, WheelModule } from './modules';

export class Game {
    private engine: Engine;
    private player: Player;
    private ship: Ship;
    private enemies: Enemy[] = [];
    private world: WorldManager;
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private keysPressed: Set<string> = new Set();
    private playerOnShip: boolean = false;    private mousePosition: { x: number, y: number } = { x: 0, y: 0 };
    private screenMousePosition: { x: number, y: number } = { x: 0, y: 0 };
    private cannonballs: Cannonball[] = []; // Array to store active cannonballs
    private rightMouseDown: boolean = false; // Track right mouse button state
    
    // Debug mode flags
    private debugMode: boolean = false;
    private showWalkableTest: boolean = false;
    
    // Camera/viewport settings
    private viewport = {
        x: 0,
        y: 0,
        width: window.innerWidth,
        height: window.innerHeight,
        scale: 1
    };

    constructor(engine: Engine) {
        this.engine = engine;
        this.canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
        this.ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D;
        
        // Initialize debug mode
        this.debugMode = false;
        
        // Update viewport dimensions based on canvas size
        this.viewport.width = this.canvas.width;
        this.viewport.height = this.canvas.height;

        // Initialize world before creating entities
        this.world = new WorldManager();
        
        // Initialize player
        this.player = new Player(400, 300);
        this.player.setOnShip(this.playerOnShip); // Sync the onShip property with Game's state
          // Initialize ship with brigantine dimensions
        this.ship = new Ship(400, 350, 450, 180, 1);
        
        // Connect ship with game for cannonball creation
        this.ship.setGame(this);
        
        // Add ship modules
        this.addInitialShipModules();
        
        // Set up input handlers
        this.setupInputHandlers();
    }

    // Update viewport dimensions when window is resized
    public updateViewportDimensions(width: number, height: number): void {
        this.viewport.width = width;
        this.viewport.height = height;
    }

    // Set up initial ship configuration with basic modules
    private addInitialShipModules(): void {
        // Wheel
        this.ship.addModule('wheel', new WheelModule({ x: -50, y: 0 }));
        // Sails
        this.ship.addModule('sail1', new SailModule({ x: 165, y: 0 }));
        this.ship.addModule('sail2', new SailModule({ x: -35, y: 0 }));
        this.ship.addModule('sail3', new SailModule({ x: -235, y: 0 }));
        // Cannons
        this.ship.addModule('cannon1', new CannonModule({ x: -35, y: 75 }, Math.PI));
        this.ship.addModule('cannon2', new CannonModule({ x: 65, y: 75 }, Math.PI));
        this.ship.addModule('cannon3', new CannonModule({ x: -135, y: 75 }, Math.PI));
        this.ship.addModule('cannon4', new CannonModule({ x: -35, y: -75 }, 0));
        this.ship.addModule('cannon5', new CannonModule({ x: 65, y: -75 }, 0));
        this.ship.addModule('cannon6', new CannonModule({ x: -135, y: -75 }, 0));
    }
    
    // Set up keyboard and mouse input handlers
    private setupInputHandlers(): void {
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            this.keysPressed.add(e.key.toLowerCase());
        });
        
        document.addEventListener('keyup', (e) => {
            this.keysPressed.delete(e.key.toLowerCase());
        });
        
        // Mouse position tracking
        this.canvas.addEventListener('mousemove', (e) => {
            // Get the mouse position relative to the canvas
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
              // Store raw screen coordinates
            this.screenMousePosition = { x: mouseX, y: mouseY };
            
            // Convert screen coordinates to world coordinates
            this.mousePosition = this.screenToWorldCoordinates(mouseX, mouseY);
            
            // Update cannon turret angles only when player is at the wheel and holding right click
            if (this.playerOnShip && this.player.atShipWheel && this.rightMouseDown) {
                this.updateCannonAiming();
            }
        });// Mouse button handlers for cannon control
        this.canvas.addEventListener('mousedown', (e) => {
            // Check if player is on ship
            if (this.playerOnShip) {
                if (e.button === 0) {
                    // Left mouse button - fire cannons
                    // Allow firing regardless of whether the player is at the wheel or not
                    this.ship.fireCannon(this.mousePosition);
                    e.preventDefault();
                } else if (e.button === 2) {
                    // Right mouse button - set flag for cannon aiming
                    this.rightMouseDown = true;
                    e.preventDefault();
                }
            }        });
          // Add mouse up handler to track when right click is released
        this.canvas.addEventListener('mouseup', (e) => {
            if (e.button === 2) {
                this.rightMouseDown = false;
                // We no longer reset cannon angles when right click is released
                // This allows cannons to stay at their current position
            }
        });
        
        // Mouse leave handler to ensure right click state is reset when mouse leaves canvas
        this.canvas.addEventListener('mouseleave', () => {
            this.rightMouseDown = false;
            // We no longer reset cannon angles when mouse leaves canvas
            // This allows cannons to stay at their current position
        });// Right click context menu event for aiming
        this.canvas.addEventListener('contextmenu', (e) => {
            // Prevent the context menu from appearing
            e.preventDefault();
            // No need to call updateCannonAiming here, it will be handled in the update loop
        });
        
        // Mouse wheel for zooming
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault(); // Prevent page scrolling
            
            // Calculate zoom factor based on wheel delta
            const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1; // Zoom out (0.9) or in (1.1)
            
            // Apply zoom with constraints (min 0.5, max 2.0)
            const newScale = Math.max(0.5, Math.min(2.0, this.viewport.scale * zoomFactor));
            
            // Only update if the scale actually changed
            if (newScale !== this.viewport.scale) {
                // Update the scale
                this.viewport.scale = newScale;
                
                // Update mouse world position with new scale
                this.mousePosition = this.screenToWorldCoordinates(
                    this.screenMousePosition.x, 
                    this.screenMousePosition.y
                );
            }
        }, { passive: false }); // 'passive: false' is needed to use preventDefault
        
        // Ship boarding and wheel controls
        document.addEventListener('keypress', (e) => {
            if (e.key.toLowerCase() === 'f') { // 'F' to board/exit ship
                this.togglePlayerOnShip();
            }
            else if (e.key.toLowerCase() === 'e') { // 'E' to mount/dismount wheel when on ship
                this.togglePlayerAtWheel();
            }
            else if (e.key.toLowerCase() === 'l') { // 'L' to toggle debug collision shapes
                this.debugMode = !this.debugMode;
                // Debug message removed
            }            else if (e.key.toLowerCase() === 'g') { // 'G' to toggle the walkable area test grid
                this.showWalkableTest = !this.showWalkableTest;
                // Debug message removed
            }
            else if (e.key.toLowerCase() === 'r') { // 'R' to reset cannon angles
                this.resetCannonAngles();
            }
        });
    }

    // Convert screen coordinates to world coordinates, accounting for scale
    private screenToWorldCoordinates(screenX: number, screenY: number): { x: number, y: number } {
        // Calculate position based on camera center, scale, and screen position
        return {
            x: this.viewport.x + (screenX - this.viewport.width/2) / this.viewport.scale,
            y: this.viewport.y + (screenY - this.viewport.height/2) / this.viewport.scale
        };
    }

    // Convert world coordinates to ship-local coordinates
    private worldToShipCoordinates(worldX: number, worldY: number): { x: number, y: number } {
        // Calculate position relative to ship center
        const dx = worldX - this.ship.position.x;
        const dy = worldY - this.ship.position.y;
        
        // Transform to ship's local coordinates (accounting for rotation)
        const shipAngle = -this.ship.body.angle; // Negative for inverse transformation
        const localX = dx * Math.cos(shipAngle) - dy * Math.sin(shipAngle);
        const localY = dx * Math.sin(shipAngle) + dy * Math.cos(shipAngle);
        
        return { x: localX, y: localY };
    }
    
    // Convert ship-local coordinates to world coordinates
    private shipToWorldCoordinates(localX: number, localY: number): { x: number, y: number } {
        // Transform back to world coordinates with ship's position and rotation
        const shipAngle = this.ship.body.angle;
        const worldX = this.ship.position.x + 
            localX * Math.cos(shipAngle) - localY * Math.sin(shipAngle);
        const worldY = this.ship.position.y + 
            localX * Math.sin(shipAngle) + localY * Math.cos(shipAngle);
            
        return { x: worldX, y: worldY };
    }

    // Toggle player between on ship and off ship
    private togglePlayerOnShip(): void {
        // Check if player is close enough to the ship to board
        const dx = this.player.position.x - this.ship.position.x;
        const dy = this.player.position.y - this.ship.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // If player is already on the ship, check if they're at the wheel
        if (this.playerOnShip) {
            // Player wants to leave the ship completely
            this.playerOnShip = false;
            
            // Update player and ship states
            this.player.setOnShip(false, false);
            this.ship.setPlayerOnBoard(false, false);
            
            // Calculate a safe dismount position outside the ship
            // First, get player's current position
            const playerLocalPos = this.worldToShipCoordinates(
                this.player.position.x,
                this.player.position.y
            );
            
            // Find a direction vector pointing outward from the ship's center
            // Normalize the local player position to get a direction vector
            const length = Math.sqrt(playerLocalPos.x * playerLocalPos.x + playerLocalPos.y * playerLocalPos.y);
            // If player is at center, use a default direction
            const dirX = length > 0 ? playerLocalPos.x / length : 1;
            const dirY = length > 0 ? playerLocalPos.y / length : 0;
            
            // Calculate a position outside the ship
            // Use 1.5x the ship's width/height to ensure we're outside
            const shipWidth = this.ship.size.width;
            const shipHeight = this.ship.size.height;
            const outsideDistance = Math.max(shipWidth, shipHeight) * 0.75;
            
            // Calculate dismount position in world coordinates
            const dismountX = this.ship.position.x + dirX * outsideDistance;
            const dismountY = this.ship.position.y + dirY * outsideDistance;
            
            // Update player position to the safe dismount position
            this.player.position.x = dismountX;
            this.player.position.y = dismountY;
            
            // Update player physics body position
            Matter.Body.setPosition(this.player.body, {
                x: dismountX,
                y: dismountY
            });
            
            // Reset collision filters when leaving ship
            Matter.Body.set(this.player.body, {
                collisionFilter: {
                    ...this.player.body.collisionFilter,
                    group: 0  // Reset to default group
                }
            });
            
            // Player left ship message removed
            return;
        }
        
        // Player is not on ship, check if they're close enough to board
        if (distance < 200) {
            this.playerOnShip = true;
            
            // Player boards the ship but is not at the wheel initially
            this.player.setOnShip(true, false);
            this.ship.setPlayerOnBoard(true, false);
            
            // Calculate a valid boarding position on the deck
            // Calculate normalized direction vector from ship to player
            const dirX = dx / distance;
            const dirY = dy / distance;
            
            // Calculate a boarding position just inside the ship's edge
            const shipWidth = this.ship.size.width;
            const shipHeight = this.ship.size.height;
            const boardingX = this.ship.position.x + dirX * (shipWidth/2 * 0.8);
            const boardingY = this.ship.position.y + dirY * (shipHeight/2 * 0.8);
            
            // Find a safe boarding position that avoids obstacles
            const safePosition = this.ship.findSafeDismountPosition(boardingX, boardingY);
            
            // Use the safe boarding position
            this.player.position.x = safePosition.x;
            this.player.position.y = safePosition.y;
            
            // Update player physics body position
            Matter.Body.setPosition(this.player.body, {
                x: this.player.position.x,
                y: this.player.position.y
            });
            
            // Set player and ship to be in the same collision group
            Matter.Body.set(this.player.body, {
                collisionFilter: {
                    ...this.player.body.collisionFilter,
                    group: -1  // Negative group means no collision within the group
                }
            });
            
            // Player boarded ship message removed
        }
    }
    
    // Toggle player between steering the ship and walking on deck
    private togglePlayerAtWheel(): void {
        if (!this.playerOnShip) return; // Only works when on ship
        
        // Calculate distance to steering wheel
        const wheelX = this.ship.position.x - 90; // Wheel is at -90,0 relative to ship center
        const wheelY = this.ship.position.y;
        const dx = this.player.position.x - wheelX;
        const dy = this.player.position.y - wheelY;
        const distanceToWheel = Math.sqrt(dx * dx + dy * dy);
        
        const isAtWheel = this.player.atShipWheel;
        
        if (isAtWheel) {
            // Player is leaving the wheel
            this.player.setAtShipWheel(false);
            this.ship.togglePlayerAtWheel(false);
            // Player left wheel message removed
            
            // Already at a valid position, so no need to move
        } else if (distanceToWheel < 50) {
            // Player is close enough to the wheel to mount it
            this.player.setAtShipWheel(true);
            this.ship.togglePlayerAtWheel(true);
            
            // Move player exactly to the wheel position
            this.player.position.x = wheelX;
            this.player.position.y = wheelY;
            
            // Update player physics body position
            Matter.Body.setPosition(this.player.body, {
                x: this.player.position.x,
                y: this.player.position.y
            });
            
            // Player at wheel message removed
        } else {
            // Too far from wheel message removed
        }
    }
    
    public start(): void {
        // Add entities to the world
        this.setupWorld();
        
        // Start the physics engine
        // Use Runner instead of deprecated Engine.run
        const runner = Matter.Runner.create();
        Matter.Runner.run(runner, this.engine);
        
        // Start the game loop
        this.gameLoop();
    }

    private setupWorld(): void {
        // Define collision categories
        const defaultCategory = 0x0001;
        const playerCategory = 0x0002;
        const shipCategory = 0x0004;
        
        // Set collision filters for the player
        Matter.Body.set(this.player.body, {
            collisionFilter: {
                category: playerCategory,
                mask: defaultCategory // Player only collides with default category by default
            }
        });
        
        // Set collision filters for the ship
        Matter.Body.set(this.ship.body, {
            collisionFilter: {
                category: shipCategory,
                mask: defaultCategory | playerCategory // Ship collides with default and player categories
            }
        });
          // Add entities to the physics world
        Matter.World.add(this.engine.world, [this.player.body, this.ship.body]);
        
        // Add a few enemy ships
        this.spawnEnemies(3);
    }

    private spawnEnemies(count: number): void {
        for (let i = 0; i < count; i++) {
            const x = 500 + Math.random() * 1000;
            const y = 500 + Math.random() * 1000;
            const enemy = new Enemy(x, y, 100, 0.5, 'aggressive');
              this.enemies.push(enemy);
            Matter.World.add(this.engine.world, enemy.body);
        }
    }
    
    // Handle player movement based on keyboard input
    private handlePlayerMovement(): void {
        const moveSpeed = 5;
        
        if (this.playerOnShip) {
            // Player is on the ship - check if at wheel or walking
            if (this.player.atShipWheel) {
                // Player is controlling the ship from the wheel
                
                // WASD controls for ship steering:
                // W/S - Control sail openness
                // A/D - Control rudder (turning)
                // Shift+A/D - Rotate sails
                
                // Sail openness controls (W/S)
                if (this.keysPressed.has('w') && !this.keysPressed.has('s')) {
                    // Open sails with W
                    this.ship.openSails();
                    // Remove W from pressed keys to prevent continuous adjustment
                    this.keysPressed.delete('w');
                } 
                else if (this.keysPressed.has('s') && !this.keysPressed.has('w')) {
                    // Close sails with S
                    this.ship.closeSails();
                    // Remove S from pressed keys to prevent continuous adjustment
                    this.keysPressed.delete('s');
                }
                
                // Rudder controls (A/D)
                if (this.keysPressed.has('a') && !this.keysPressed.has('d') && !this.keysPressed.has('shift')) {
                    // Turn left with A
                    this.ship.applyRudder('left');
                } 
                else if (this.keysPressed.has('d') && !this.keysPressed.has('a') && !this.keysPressed.has('shift')) {
                    // Turn right with D
                    this.ship.applyRudder('right');
                }
                else if (!this.keysPressed.has('a') && !this.keysPressed.has('d')) {
                    // Return rudder to center position when no keys are pressed
                    this.ship.applyRudder('center');
                }
                
                // Sail rotation controls (Shift+A/D)
                if (this.keysPressed.has('shift')) {
                    if (this.keysPressed.has('a') && !this.keysPressed.has('d')) {
                        // Rotate sails left with Shift+A
                        this.ship.rotateSails('left');
                        // Don't remove keys as we want continuous adjustment while held
                    } 
                    else if (this.keysPressed.has('d') && !this.keysPressed.has('a')) {
                        // Rotate sails right with Shift+D
                        this.ship.rotateSails('right');
                    }
                    // Removed automatic centering - sails will stay in place when keys are released
                }
                
                // Calculate the helm position at the steering wheel
                // Transform from ship-local coordinates to world coordinates
                const wheelCoords = this.shipToWorldCoordinates(-90, 0);
                const helmPositionX = wheelCoords.x;
                const helmPositionY = wheelCoords.y;
                
                // Update player position to stay fixed at the wheel position
                this.player.position.x = helmPositionX;
                this.player.position.y = helmPositionY;
                
                // Update player physics body position
                Matter.Body.setPosition(this.player.body, {
                    x: helmPositionX,
                    y: helmPositionY
                });
                  // Keep player and ship in sync with velocity
                Matter.Body.setVelocity(this.player.body, {
                    x: this.ship.body.velocity.x,
                    y: this.ship.body.velocity.y
                });
                
                // Fire cannons with spacebar when at the wheel
                if (this.keysPressed.has(' ')) {
                    // Fire cannons using mouse position as target
                    this.ship.fireCannon(this.mousePosition);
                    // Remove spacebar from pressed keys to prevent continuous firing
                    this.keysPressed.delete(' ');
                }
                
                // Ensure player body is a sensor (non-colliding) when at wheel
                if (!this.player.body.isSensor) {
                    Matter.Body.set(this.player.body, 'isSensor', true);
                }
            } else {
                // Player is walking on the ship's deck
                // Calculate angle between player and mouse for movement direction
                const dx = this.mousePosition.x - this.player.position.x;
                const dy = this.mousePosition.y - this.player.position.y;
                const angle = Math.atan2(dy, dx);
                
                // Calculate movement vectors based on keyboard input
                let moveX = 0;
                let moveY = 0;
                
                // W = forward toward mouse
                if (this.keysPressed.has('w')) {
                    moveX += Math.cos(angle) * moveSpeed;
                    moveY += Math.sin(angle) * moveSpeed;
                }
                
                // S = backward away from mouse
                if (this.keysPressed.has('s')) {
                    moveX -= Math.cos(angle) * moveSpeed;
                    moveY -= Math.sin(angle) * moveSpeed;
                }
                
                // A = strafe left (perpendicular to mouse direction)
                if (this.keysPressed.has('a')) {
                    moveX += Math.cos(angle - Math.PI/2) * moveSpeed;
                    moveY += Math.sin(angle - Math.PI/2) * moveSpeed;
                }
                
                // D = strafe right (perpendicular to mouse direction)
                if (this.keysPressed.has('d')) {
                    moveX += Math.cos(angle + Math.PI/2) * moveSpeed;
                    moveY += Math.sin(angle + Math.PI/2) * moveSpeed;
                }
                
                if (moveX !== 0 || moveY !== 0) {
                    // Apply movement in world coordinates
                    const newPosX = this.player.position.x + moveX;
                    const newPosY = this.player.position.y + moveY;
                    
                    // First check if new position is on the ship's deck
                    if (this.ship.isPositionOnDeck(newPosX, newPosY)) {
                        // Position is valid, update player position
                        this.player.position.x = newPosX;
                        this.player.position.y = newPosY;
                        
                        // Update player physics body
                        Matter.Body.setPosition(this.player.body, {
                            x: newPosX,
                            y: newPosY
                        });
                    } else {
                        // If not valid, try to slide along the ship's edge
                        // First try X movement only
                        const newPosXOnly = {
                            x: this.player.position.x + moveX,
                            y: this.player.position.y
                        };
                        
                        if (this.ship.isPositionOnDeck(newPosXOnly.x, newPosXOnly.y)) {
                            // X-only movement is valid
                            this.player.position.x = newPosXOnly.x;
                            Matter.Body.setPosition(this.player.body, {
                                x: newPosXOnly.x,
                                y: this.player.position.y
                            });
                        }
                        
                        // Then try Y movement only
                        const newPosYOnly = {
                            x: this.player.position.x,
                            y: this.player.position.y + moveY
                        };
                        
    if (this.ship.isPositionOnDeck(newPosYOnly.x, newPosYOnly.y)) {
        // Y-only movement is valid
        this.player.position.y = newPosYOnly.y;
        Matter.Body.setPosition(this.player.body, {
            x: this.player.position.x,
            y: newPosYOnly.y
        });
    }
}
                    
                    // When walking on deck, player should not be a sensor
                    if (this.player.body.isSensor) {
                        Matter.Body.set(this.player.body, 'isSensor', false);
                    }
                }
                
                // When player is on deck, we only need to handle their relative movement
                // The absolute position coupling is handled in the update method
                
                // Apply ship velocity to player to maintain same world velocity
                Matter.Body.setVelocity(this.player.body, {
                    x: this.ship.body.velocity.x,
                    y: this.ship.body.velocity.y
                });
            }
        } else {
            // Player is moving independently (not on ship)
            // Calculate angle between player and mouse
            const dx = this.mousePosition.x - this.player.position.x;
            const dy = this.mousePosition.y - this.player.position.y;
            const angle = Math.atan2(dy, dx);
            
            // Movement vectors
            let moveX = 0;
            let moveY = 0;
            
            // W = forward toward mouse
            if (this.keysPressed.has('w')) {
                moveX += Math.cos(angle) * moveSpeed;
                moveY += Math.sin(angle) * moveSpeed;
            }
            
            // S = backward away from mouse
            if (this.keysPressed.has('s')) {
                moveX -= Math.cos(angle) * moveSpeed;
                moveY -= Math.sin(angle) * moveSpeed;
            }
            
            // A = strafe left (perpendicular to mouse direction)
            if (this.keysPressed.has('a')) {
                moveX += Math.cos(angle - Math.PI/2) * moveSpeed;
                moveY += Math.sin(angle - Math.PI/2) * moveSpeed;
            }
            
            // D = strafe right (perpendicular to mouse direction)
            if (this.keysPressed.has('d')) {
                moveX += Math.cos(angle + Math.PI/2) * moveSpeed;
                moveY += Math.sin(angle + Math.PI/2) * moveSpeed;
            }
            
            // Apply movement
            this.player.position.x += moveX;
            this.player.position.y += moveY;
            
            // Update player physics body using Matter import
            Matter.Body.setPosition(this.player.body, {
                x: this.player.position.x,
                y: this.player.position.y
            });
            
            // Ensure player body is not a sensor when off the ship
            if (this.player.body.isSensor) {
                Matter.Body.set(this.player.body, 'isSensor', false);
            }
        }
          // Spacebar to fire cannons when on ship (regardless of whether at wheel or not)
        if (this.playerOnShip && this.keysPressed.has(' ')) {
            this.ship.fireCannon(this.mousePosition);
            // Remove space from pressed keys to prevent continuous firing
            this.keysPressed.delete(' ');
        }
    }
    
    // Update camera position to follow player
    private updateCamera(): void {
        // Position camera directly on player to keep them centered in the viewport
        // No adjustment needed for width/height anymore since we handle that in the rendering
        this.viewport.x = this.player.position.x;
        this.viewport.y = this.player.position.y;
    }
    
    // Render game entities using Canvas
    private render2D(): void {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Transform context to apply camera and scaling
        this.ctx.save();
        
        // Draw water background first (before translation) to ensure it covers the entire visible area
        this.ctx.fillStyle = '#87CEEB'; // Sky blue water color
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Apply scaling from the center of the viewport
        const centerX = this.viewport.width / 2;
        const centerY = this.viewport.height / 2;
        
        // Properly center the camera on the player:
        // 1. Move to canvas center
        // 2. Apply scaling
        // 3. Move viewport so player is always centered
        this.ctx.translate(centerX, centerY);
        this.ctx.scale(this.viewport.scale, this.viewport.scale);
        this.ctx.translate(
            -this.viewport.x,
            -this.viewport.y
        );
        
        // Draw additional water for areas we're looking at in the game world, accounting for zoom
        this.ctx.fillStyle = '#87CEEB'; // Sky blue water color
        const visibleWidth = this.viewport.width / this.viewport.scale;
        const visibleHeight = this.viewport.height / this.viewport.scale;
        this.ctx.fillRect(
            this.viewport.x - visibleWidth, 
            this.viewport.y - visibleHeight, 
            visibleWidth * 3, 
            visibleHeight * 3
        );
        
        // Draw grid lines for better movement reference
        this.drawGrid();
        
        // Draw ship using the brigantine shape
        this.ship.draw(this.ctx);
        
        // Draw player exactly at their world position
        this.ctx.fillStyle = '#ffcc00'; // Yellow player color
        this.ctx.beginPath();
        this.ctx.arc(this.player.position.x, this.player.position.y, 15, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw player direction indicator (pointing toward mouse)
        if (!this.playerOnShip) {
            const dx = this.mousePosition.x - this.player.position.x;
            const dy = this.mousePosition.y - this.player.position.y;
            const angle = Math.atan2(dy, dx);
            
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(this.player.position.x, this.player.position.y);
            this.ctx.lineTo(
                this.player.position.x + Math.cos(angle) * 20,
                this.player.position.y + Math.sin(angle) * 20
            );
            this.ctx.stroke();
        }
        
        // Draw enemies
        this.ctx.fillStyle = '#ff3300'; // Red enemy color
        for (const enemy of this.enemies) {
            this.ctx.beginPath();
            this.ctx.arc(enemy.position.x, enemy.position.y, 15, 0, Math.PI * 2);
            this.ctx.fill();
        }
          // Draw additional game elements like islands, etc.
        
        // Draw cannonballs - moved here to be drawn with proper camera transform
        this.drawCannonballs();
        
        // Draw debug collision shapes if debug mode is enabled
        if (this.debugMode) {
            this.drawDebugShapes();
            
            // Also show the walkable area when debug mode is enabled
            this.ship.testWalkableArea(this.ctx, 15); // Use 15px grid size for better performance
        }
        
        // Draw walkable area test grid if enabled separately with G key
        if (this.showWalkableTest && !this.debugMode) {
            this.ship.testWalkableArea(this.ctx, 20); // Use 20px grid size
        }
        
        this.ctx.restore();
        
        // Draw HUD elements
        this.drawHUD();
    }
    
    // Draw Heads-Up Display elements
    private drawHUD(): void {
        // Player health
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(20, 20, 200, 20);
        
        this.ctx.fillStyle = '#00cc00';
        this.ctx.fillRect(20, 20, this.player.health * 2, 20);
        
        this.ctx.strokeStyle = '#fff';
        this.ctx.strokeRect(20, 20, 200, 20);
        
        // Ship water level if player is on ship
        if (this.playerOnShip) {
            this.ctx.fillStyle = '#333';
            this.ctx.fillRect(20, 50, 200, 20);
            
            this.ctx.fillStyle = '#33ccff';
            this.ctx.fillRect(20, 50, this.ship.waterLevel * 2, 20);
                 this.ctx.strokeStyle = '#fff';
        this.ctx.strokeRect(20, 50, 200, 20);
        }
        
        // Player coordinates tracker
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'; // Semi-transparent background
        this.ctx.fillRect(20, this.playerOnShip ? 80 : 50, 200, 30);
        
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '12px Arial';
        
        // Round the coordinates to integers for cleaner display
        const playerX = Math.round(this.player.position.x);
        const playerY = Math.round(this.player.position.y);
        
        // Add status text for player on ship
        let statusText = '';
        if (this.playerOnShip) {
            statusText = this.player.atShipWheel ? ' (At Wheel)' : ' (On Deck)';
        }
        
        this.ctx.fillText(`Coordinates: X: ${playerX} Y: ${playerY}${statusText}`, 30, this.playerOnShip ? 100 : 70);
        
        // Show deck position status if in debug mode
        if (this.debugMode && this.playerOnShip) {
            const onDeck = this.ship.isPositionOnDeck(
                this.player.position.x, 
                this.player.position.y
            );
            this.ctx.fillStyle = onDeck ? '#80ff80' : '#ff8080'; // Green if on deck, red if not
            this.ctx.fillText(`On Deck: ${onDeck ? 'YES' : 'NO'}`, 
                150, 
                this.playerOnShip ? 100 : 70
            );
            this.ctx.fillStyle = '#ffffff'; // Reset fill style
        }
        
        this.ctx.strokeStyle = '#fff';
        this.ctx.strokeRect(20, this.playerOnShip ? 80 : 50, 200, 30);
        
        // Zoom level indicator
        const zoomYPos = this.playerOnShip ? 120 : 90;
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'; // Semi-transparent background
        this.ctx.fillRect(20, zoomYPos, 200, 30);
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillText(`Zoom: ${this.viewport.scale.toFixed(2)}x`, 30, zoomYPos + 20);
        this.ctx.strokeStyle = '#fff';
        this.ctx.strokeRect(20, zoomYPos, 200, 30);
        
        // Sail openness and angle indicator (when on ship)
        if (this.playerOnShip) {
            const sailYPos = zoomYPos + 40;
            
            // Calculate average sail openness and angles
            let totalOpenness = 0;
            let totalAngle = 0;
            let sailCount = 0;
              this.ship.modules.forEach(module => {
                if (module.type === 'sail') {
                    if (module instanceof SailModule) {
                        // If it's a SailModule, use its properties directly
                        totalOpenness += module.openness;
                        totalAngle += module.angle;
                    } else {
                        // For legacy ShipModule, use type assertion
                        const sailModule = module as ShipModule;
                        totalOpenness += (sailModule.openness !== undefined ? sailModule.openness : 0);
                        totalAngle += (sailModule.angle !== undefined ? sailModule.angle : 0);
                    }
                    sailCount++;
                }
            });
            
            const avgSailOpenness = sailCount > 0 ? Math.round(totalOpenness / sailCount) : 0;
            const avgSailAngle = sailCount > 0 ? Math.round(totalAngle / sailCount) : 0;
            
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            this.ctx.fillRect(20, sailYPos, 200, 80); // Increased height to show all sail info
            
            // Background bar for average sail openness
            this.ctx.fillStyle = '#333';
            this.ctx.fillRect(30, sailYPos + 15, 180, 10);
            
            // Fill bar based on average sail openness
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillRect(30, sailYPos + 15, avgSailOpenness * 1.8, 10);
            
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillText(`Sails: ${avgSailOpenness}% open (W/S to adjust)`, 30, sailYPos + 12);
            
            // Show sail angle
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillText(`Sail angle: ${avgSailAngle}° (Shift+A/D to rotate)`, 30, sailYPos + 35);
            
            // Show rudder angle
            this.ctx.fillText(`Rudder: ${Math.round(this.ship.rudderAngle)}° (A/D to steer)`, 30, sailYPos + 55);
            
            // Show individual sail status
            const sailModules = Array.from(this.ship.modules.values()).filter(m => m.type === 'sail');
            
            if (sailModules.length > 0) {
                // Calculate sail efficiency based on the ship's current state
                const sailEfficiency = this.ship.calculateSailEfficiency();
                
                // Color-code based on efficiency
                if (sailEfficiency === 0) {
                    this.ctx.fillStyle = '#ff5555'; // Bright red for no wind capture
                    this.ctx.fillText(`Wind power: 0% (Bad sail angle)`, 30, sailYPos + 75);
                } else {
                    if (sailEfficiency > 0.7) {
                        this.ctx.fillStyle = '#80ff80'; // Bright green for excellent efficiency
                    } else if (sailEfficiency > 0.4) {
                        this.ctx.fillStyle = '#ccff00'; // Yellow-green for good efficiency
                    } else if (sailEfficiency > 0.2) {
                        this.ctx.fillStyle = '#ffcc00'; // Yellow for moderate efficiency
                    } else {
                        this.ctx.fillStyle = '#ff8080'; // Red for poor efficiency
                    }
                    
                    this.ctx.fillText(`Wind power: ${Math.round(sailEfficiency * 100)}%`, 30, sailYPos + 75);
                }
                
                // No need for direction information here since it's shown below
            }
            
            // Additional hint text about sail function if sails are closed
            if (avgSailOpenness === 0) {
                this.ctx.fillStyle = '#ffcc00'; // Yellow warning
                this.ctx.fillText('(Ship won\'t move with closed sails)', 30, sailYPos + 75);
            }
            
            // Calculate turning power based on new mechanics (inverse to ship's momentum)
            // Higher momentum = lower turning power
            const turnEffectiveness = Math.max(30, 100 - (this.ship.momentum * 70));
            
            // Show rudder effectiveness and ship movement direction info (combined)
            this.ctx.fillStyle = turnEffectiveness > 60 ? '#80ff80' : (turnEffectiveness > 40 ? '#ffcc00' : '#ff8080');
            this.ctx.fillText(
                `Turning power: ${Math.floor(turnEffectiveness)}% | Ship always moves forward when sails are open`, 
                30, 
                sailYPos + 95
            );
            
            this.ctx.strokeStyle = '#fff';
            this.ctx.strokeRect(20, sailYPos, 200, 100); // Extended height for new info
        }
        
        // Enhanced Wind direction indicator
        const windDirection = this.world.getWindDirection();
        const windPower = this.world.getWindPower();
        
        // Create a background for the wind indicator
        this.ctx.save();
        this.ctx.translate(this.canvas.width - 80, 80); // Moved slightly to give more room
        
        // Draw a circular background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 40, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Add a "Wind From" label above the compass
        this.ctx.font = '10px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillText('Wind From', 0, -50);
        
        // Draw a compass-like structure around the edge
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 35, 0, Math.PI * 2);
        this.ctx.stroke();
        
        // Add N, E, S, W indicators
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillText('N', 0, -30);
        this.ctx.fillText('E', 30, 0);
        this.ctx.fillText('S', 0, 30);
        this.ctx.fillText('W', -30, 0);
        
        // Draw the wind arrow to properly show where the wind is coming FROM
        // This matches meteorological convention and aligns with the physics
        this.ctx.rotate(windDirection); // Rotate to point in the direction the wind is coming FROM
        
        // Wind power affects arrow size
        const arrowSize = 20 + 10 * windPower;
        
        // Create a blue gradient for the wind arrow
        const gradient = this.ctx.createLinearGradient(0, arrowSize, 0, -arrowSize);
        gradient.addColorStop(0, '#00ccff'); // Light blue at arrow head
        gradient.addColorStop(1, '#0066cc'); // Darker blue at arrow tail
        
        // Draw wind arrow with gradient
        this.ctx.lineWidth = 3;
        this.ctx.strokeStyle = gradient;
        this.ctx.fillStyle = gradient;
        
        // Draw the arrow body
        this.ctx.beginPath();
        this.ctx.moveTo(0, arrowSize);
        this.ctx.lineTo(0, -arrowSize);
        this.ctx.stroke();
        
        // Draw arrowhead at the top (pointing FROM where the wind comes)
        this.ctx.beginPath();
        this.ctx.moveTo(0, -arrowSize);
        this.ctx.lineTo(-8, -arrowSize + 10);
        this.ctx.lineTo(8, -arrowSize + 10);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Add wind speed text
        this.ctx.save();
        // Since we rotated by windDirection earlier,
        // we need to rotate back by the same amount to make text upright
        this.ctx.rotate(-windDirection);
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '10px Arial';
        
        // Convert wind power to a more readable format (0-10 scale)
        const windSpeedDisplay = Math.round(windPower * 10);
        this.ctx.fillText(`${windSpeedDisplay}/10`, 0, 0);
        
        this.ctx.restore();
        this.ctx.restore();
        
        // Display debug mode indicator if active
        if (this.debugMode) {
            const debugYPos = this.canvas.height - 80;
            this.ctx.fillStyle = 'rgba(255, 0, 0, 0.7)';
            this.ctx.fillRect(20, debugYPos, 160, 30);
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '12px Arial';
            this.ctx.fillText('DEBUG MODE: Press L to toggle', 30, debugYPos + 20);
        }
        
        // Display controls
        const controlsYPos = this.canvas.height - 40;
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(20, controlsYPos, 500, 30); // Made wider to fit more text
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '12px Arial';
        
        if (this.playerOnShip) {
            if (this.player.atShipWheel) {
                // Controls when at the wheel
                this.ctx.fillText('W/S: Open/Close Sails | A/D: Steer | Shift+A/D: Rotate Sails | E: Leave Wheel | F: Exit Ship | SPACE: Fire Cannons | L: Debug', 30, controlsYPos + 20);
            } else {
                // Controls when walking on deck
                this.ctx.fillText('WASD: Move on Deck | E: Use Wheel (when near) | F: Exit Ship | SPACE: Fire Cannons | L: Debug', 30, controlsYPos + 20);
            }
        } else {
            this.ctx.fillText('WASD: Move (Relative to Mouse) | F: Board Ship | L: Toggle Debug Mode', 30, controlsYPos + 20);
        }
    }

    // Draw grid lines for better movement reference
    private drawGrid(): void {
        const gridSize = 100; // Size of each grid cell
        const gridColor = 'rgba(255, 255, 255, 0.2)'; // Semi-transparent white
        
        // Calculate grid boundaries to ensure coverage of the entire visible area accounting for zoom
        // Add extra padding to ensure grid covers the entire screen even after translation
        const visibleWidth = this.viewport.width / this.viewport.scale;
        const visibleHeight = this.viewport.height / this.viewport.scale;
        
        const startX = Math.floor((this.viewport.x - visibleWidth) / gridSize) * gridSize;
        const startY = Math.floor((this.viewport.y - visibleHeight) / gridSize) * gridSize;
        const endX = startX + visibleWidth * 4; // Increased coverage for wider screens
        const endY = startY + visibleHeight * 4; // Increased coverage for taller screens
        
        this.ctx.strokeStyle = gridColor;
        this.ctx.lineWidth = 1;
        
        // Draw vertical lines
        for (let x = startX; x <= endX; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, startY);
            this.ctx.lineTo(x, endY);
            this.ctx.stroke();
            
            // Add coordinate labels at major grid lines (every 500 units)
            if (x % 500 === 0) {
                this.ctx.fillStyle = gridColor;
                this.ctx.font = '10px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(x.toString(), x, startY + 15);
            }
        }
        
        // Draw a highlighted grid line at origin (0,0)
        if (0 >= startX && 0 <= endX) {
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'; // Brighter line for origin
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(0, startY);
            this.ctx.lineTo(0, endY);
            this.ctx.stroke();
            this.ctx.strokeStyle = gridColor;
            this.ctx.lineWidth = 1;
        }
        
        // Draw horizontal lines
        for (let y = startY; y <= endY; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(startX, y);
            this.ctx.lineTo(endX, y);
            this.ctx.stroke();
            
    // Add coordinate labels at major grid lines (every 500 units)
    if (y % 500 === 0) {
        this.ctx.fillStyle = gridColor;
        this.ctx.font = '10px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(y.toString(), startX + 5, y + 15);
    }
}
        
        // Draw a highlighted grid line at origin (0,0)
        if (0 >= startY && 0 <= endY) {
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'; // Brighter line for origin
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(startX, 0);
            this.ctx.lineTo(endX, 0);
            this.ctx.stroke();
            this.ctx.strokeStyle = gridColor;
            this.ctx.lineWidth = 1;
        }
    }

    // Draw collision shapes and boundaries for debugging
    private drawDebugShapes(): void {
        // Set styles for debug shapes
        this.ctx.lineWidth = 2;
        
        // Draw player physics body outline
        this.ctx.strokeStyle = 'rgba(0, 255, 0, 0.7)'; // Green for player collision body
        this.drawPhysicsBody(this.player.body);
        
        // Draw enemy physics bodies
        this.ctx.strokeStyle = 'rgba(255, 165, 0, 0.7)'; // Orange for enemy collision bodies
        for (const enemy of this.enemies) {
            this.drawPhysicsBody(enemy.body);
        }
        
        // Draw ship deck area with a semi-transparent overlay
        this.drawShipDeckArea();
        
        // Draw the wheel interaction zone
        this.drawWheelInteractionZone();
        
        // Draw debug text info
        this.drawDebugInfo();
    }
    
    // Helper method to draw a Matter.js physics body
    private drawPhysicsBody(body: Matter.Body): void {
        const vertices = body.vertices;
        
        if (!vertices || vertices.length === 0) return;
        
        this.ctx.beginPath();
        this.ctx.moveTo(vertices[0].x, vertices[0].y);
        
        for (let i = 1; i < vertices.length; i++) {
            this.ctx.lineTo(vertices[i].x, vertices[i].y);
        }
        
        // Close the shape
        this.ctx.lineTo(vertices[0].x, vertices[0].y);
        this.ctx.stroke();
        
        // Draw center of mass
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.beginPath();
        this.ctx.arc(body.position.x, body.position.y, 4, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    // Draw the ship's deck area for debugging
    private drawShipDeckArea(): void {
        // Save context state
        this.ctx.save();
        
        // Translate and rotate to ship's position and orientation
        this.ctx.translate(this.ship.position.x, this.ship.position.y);
        this.ctx.rotate(this.ship.body.angle);
        
        // Draw hull outline
        if (!this.ship.path) {
            // Make sure path exists
            this.ship.path = Ship.createHullPath();
        }
        
        // Draw a semi-transparent overlay for the ship hull
        this.ctx.fillStyle = 'rgba(0, 100, 255, 0.1)';
        this.ctx.fill(this.ship.path);
        
        // Draw hull outline
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.lineWidth = 1;
        this.ctx.stroke(this.ship.path);
        
        this.ctx.restore();
    }
    
    // Draw the wheel interaction zone and ship obstacles
    private drawWheelInteractionZone(): void {
        this.ctx.save();
        this.ctx.translate(this.ship.position.x, this.ship.position.y);
        this.ctx.rotate(this.ship.body.angle);
        
        // Draw all the ship obstacles (masts, wheel) from Ship.ts using correct positions
        const obstacles = [
            { x: 165, y: 0, name: "Front Mast" },  // Front mast - matches Ship.MASTS[0]
            { x: -35, y: 0, name: "Middle Mast" }, // Middle mast - matches Ship.MASTS[1]
            { x: -235, y: 0, name: "Back Mast" },  // Back mast - matches Ship.MASTS[2]
            { x: -90, y: 0, name: "Wheel" }        // Steering wheel - matches Ship.WHEEL
        ];
        
        // Draw obstacle avoid radius for all obstacles
        const insetWidth = this.ship.size.width / 2 * 0.95;
        const avoidRadius = 0.15 * insetWidth; // 15% of ship width as in Ship.ts
        
        for (const obstacle of obstacles) {
            // Draw obstacle position and avoid radius
            if (obstacle.name === "Wheel") {
                this.ctx.fillStyle = 'rgba(255, 255, 0, 0.2)'; // Yellow for wheel
                this.ctx.strokeStyle = 'rgba(255, 255, 0, 0.7)';
            } else {
                this.ctx.fillStyle = 'rgba(139, 69, 19, 0.2)'; // Brown for masts
                this.ctx.strokeStyle = 'rgba(139, 69, 19, 0.7)';
            }
            
            // Draw obstacle area
            this.ctx.beginPath();
            this.ctx.arc(obstacle.x, obstacle.y, avoidRadius, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.stroke();
            
            // Draw special interaction zone for wheel
            if (obstacle.name === "Wheel") {
                // Draw the wheel interaction radius (larger than avoid radius)
                this.ctx.strokeStyle = 'rgba(255, 255, 0, 0.7)';
                this.ctx.setLineDash([5, 5]); // Dashed line for interaction zone
                this.ctx.beginPath();
                this.ctx.arc(obstacle.x, obstacle.y, 50, 0, Math.PI * 2);
                this.ctx.stroke();
                this.ctx.setLineDash([]); // Reset line style
                
                // Label the wheel (just add the label without redundant circle)
                this.ctx.font = '12px Arial';
                this.ctx.fillStyle = 'white';
                this.ctx.fillText("Wheel", obstacle.x - 15, obstacle.y - 20);
            }
        }
        
        this.ctx.restore();
    }

    // Draw velocity vectors for entities
    /*
    private drawVelocityVectors(): void {
        // Draw ship velocity vector
        this.ctx.strokeStyle = 'rgba(255, 255, 0, 0.7)'; // Yellow for velocity
        this.drawVelocityVector(this.ship.body);
        
        // Draw player velocity vector
        this.ctx.strokeStyle = 'rgba(0, 255, 255, 0.7)'; // Cyan for player velocity
        this.drawVelocityVector(this.player.body);
    }
    
    // Draw a velocity vector for a physics body
    private drawVelocityVector(body: Matter.Body): void {
        const velocityScale = 10; // Scale velocity for better visualization
        const velocityX = body.velocity.x * velocityScale;
        const velocityY = body.velocity.y * velocityScale;
        
        // Only draw if there is some velocity
        if (Math.abs(velocityX) > 0.1 || Math.abs(velocityY) > 0.1) {
            this.ctx.beginPath();
            this.ctx.moveTo(body.position.x, body.position.y);
            this.ctx.lineTo(
                body.position.x + velocityX,
                body.position.y + velocityY
            );
            this.ctx.stroke();
            
            // Draw arrowhead
            const angle = Math.atan2(velocityY, velocityX);
            this.ctx.beginPath();
            this.ctx.moveTo(
                body.position.x + velocityX,
                body.position.y + velocityY
            );
            this.ctx.lineTo(
                body.position.x + velocityX - 10 * Math.cos(angle - Math.PI/6),
                body.position.y + velocityY - 10 * Math.sin(angle - Math.PI/6)
            );
            this.ctx.moveTo(
                body.position.x + velocityX,
                body.position.y + velocityY
            );
            this.ctx.lineTo(
                body.position.x + velocityX - 10 * Math.cos(angle + Math.PI/6),
                body.position.y + velocityY - 10 * Math.sin(angle + Math.PI/6)
            );
            this.ctx.stroke();
        }
    }
    */
    
    // Draw debug info as text
    private drawDebugInfo(): void {
        // Minimal implementation to avoid errors
        // Save current transform to draw in screen space
        this.ctx.save();
        this.ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset to identity matrix
        
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(10, 10, 300, 60);
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '12px monospace';
        
        // Basic info
        this.ctx.fillText(`Ship Position: ${Math.round(this.ship.position.x)}, ${Math.round(this.ship.position.y)}`, 20, 30);
        
        // Calculate actual wheel position with rotation
        const wheelCoords = this.shipToWorldCoordinates(-90, 0);
        this.ctx.fillText(`Wheel Position: ${Math.round(wheelCoords.x)}, ${Math.round(wheelCoords.y)}`, 20, 50);
        
        this.ctx.restore();    }    // Update cannon turret angles based on mouse position
    private updateCannonAiming(): void {
        // Only aim cannons when player is on ship, at the wheel, and holding right mouse button
        if (!this.playerOnShip || !this.player.atShipWheel || !this.rightMouseDown) return;
        
        // Get all cannon modules
        const cannons = Array.from(this.ship.modules.values()).filter(module => module.type === 'cannon');
        
        // Calculate local mouse position relative to ship
        const localMousePos = this.worldToShipCoordinates(
            this.mousePosition.x,
            this.mousePosition.y
        );// Update each cannon's turret angle to point toward mouse position
        cannons.forEach(cannon => {            // Calculate angle from cannon to mouse
            const dx = localMousePos.x - cannon.position.x;
            const dy = localMousePos.y - cannon.position.y;
            
            // Use the new aimAt method if it's a CannonModule
            if (cannon instanceof CannonModule) {
                // Pass local mouse position to aim at
                cannon.aimAt(localMousePos.x, localMousePos.y);
            } 
        });
    }    // Reset cannon angles to their default position
    private resetCannonAngles(): void {
        if (!this.playerOnShip) return;
        
        // Get all cannon modules
        const cannons = Array.from(this.ship.modules.values()).filter(module => module.type === 'cannon');
          // Reset each cannon's turret angle to its default
        cannons.forEach(cannon => {
            // Check if it's a proper CannonModule
            if (cannon instanceof CannonModule) {
                // Use the new resetAim method
                cannon.resetAim();
            } else {
                // For legacy modules, use type assertion
                const cannonModule = cannon as ShipModule;
                cannonModule.turretAngle = 0;
            }
        });
    }
      
    // Add a cannonball to the game
    addCannonball(x: number, y: number, angle: number, speed: number = 10): void {
        // Log cannonball creation details
        console.log('Creating cannonball:', {
            position: { x, y },
            angle: angle * (180/Math.PI), // Convert to degrees for readability
            speed: speed
        });
          const cannonball = new Cannonball(x, y, angle, speed);
        this.cannonballs.push(cannonball);
        
        // Add cannonball physics body to the world
        Matter.World.add(this.engine.world, cannonball.body);
    }
    
    // Update and manage cannonballs
    private updateCannonballs(): void {
        // Update each cannonball and remove dead ones
        for (let i = this.cannonballs.length - 1; i >= 0; i--) {
            const cannonball = this.cannonballs[i];
            
            // Update cannonball and check if it's still alive
            const isAlive = cannonball.update();
            
            if (!isAlive) {                // Remove cannonball from physics world
                Matter.World.remove(this.engine.world, cannonball.body);
                
                // Remove from our array
                this.cannonballs.splice(i, 1);
            }
        }
        
        // Check for collisions with enemies
        // In a full implementation, we would use Matter.js collision events
    }
    
    // Draw all cannonballs
    private drawCannonballs(): void {
        for (const cannonball of this.cannonballs) {
            cannonball.draw(this.ctx);
        }
    }
    
    private gameLoop(): void {
        // Update game state and render each frame
        requestAnimationFrame(() => {
            this.update();
            this.render2D();
            this.gameLoop();
        });
    }

    private update(): void {
        
        // Update world physics
        this.world.update();
        
        // Store player's position relative to ship if they're on the ship
        // We do this BEFORE updating the ship so we can maintain relative position
        let localPlayerPos = { x: 0, y: 0 };
        let wasOnDeck = false;
        let wasAtWheel = false;
        
        if (this.playerOnShip) {
            if (this.player.atShipWheel) {
                // If at wheel, store the fixed wheel position in ship coordinates
                // The wheel is always at -90,0 in ship's coordinate system (from Ship.ts line 71)
                localPlayerPos.x = -90;
                localPlayerPos.y = 0;
                wasAtWheel = true;
            } else {
                // Store player's position in ship's local coordinate system for deck walking
                const localCoords = this.worldToShipCoordinates(
                    this.player.position.x,
                    this.player.position.y
                );
                localPlayerPos.x = localCoords.x;
                localPlayerPos.y = localCoords.y;
                wasOnDeck = true;
            }
        }
        
        // Apply wind forces to the ship
        this.ship.applyWindForce(
            this.world.getWindDirection(),
            this.world.getWindPower()
        );
        
        // Update ship
        this.ship.update();
        
        // Update player position based on their location on the ship
        if (wasOnDeck || wasAtWheel) {
            // Transform back to world coordinates with updated ship position and rotation
            const worldCoords = this.shipToWorldCoordinates(
                localPlayerPos.x,
                localPlayerPos.y
            );
            
            if (wasAtWheel) {
                // If at wheel, just use the transformed position directly
                this.player.position.x = worldCoords.x;
                this.player.position.y = worldCoords.y;
                
                // Update the physics body
                Matter.Body.setPosition(this.player.body, {
                    x: worldCoords.x,
                    y: worldCoords.y
                });
            } 
            else if (this.ship.isPositionOnDeck(worldCoords.x, worldCoords.y)) {
                // For deck walking, verify the position is still valid
                // Update player position to stay with ship
                this.player.position.x = worldCoords.x;
                this.player.position.y = worldCoords.y;
                
                // Update the physics body
                Matter.Body.setPosition(this.player.body, {
                    x: worldCoords.x,
                    y: worldCoords.y
                });
            } else {
                // In case the position is no longer on deck (rare edge case),
                // find a safe position on deck using our smart algorithm
                // Start searching near the player's current position
                const safePosition = this.ship.findSafeDismountPosition(
                    this.player.position.x, 
                    this.player.position.y
                );
                
                this.player.position.x = safePosition.x;
                this.player.position.y = safePosition.y;
                Matter.Body.setPosition(this.player.body, {
                    x: safePosition.x,
                    y: safePosition.y
                });
            }
            
            // Apply the ship's velocity to the player so they move with the ship
            Matter.Body.setVelocity(this.player.body, {
                x: this.ship.body.velocity.x,
                y: this.ship.body.velocity.y
            });
        }
        
        // Handle player input AFTER maintaining ship-relative position
        this.handlePlayerMovement();
        
        // Update enemies
        for (const enemy of this.enemies) {
            if (Math.random() < 0.01) { // Occasionally move towards player
                enemy.moveTowards(this.player.position.x, this.player.position.y);
            }
        }
        
        // Update camera to follow player
        this.updateCamera();
          // Update mouse world position based on the latest camera position
        if (this.screenMousePosition.x !== 0 || this.screenMousePosition.y !== 0) {            this.mousePosition = this.screenToWorldCoordinates(
                this.screenMousePosition.x,
                this.screenMousePosition.y
            );
            
            // Keep cannons aimed at the current mouse position only when player is at the wheel and holding right click
            if (this.playerOnShip && this.player.atShipWheel && this.rightMouseDown) {
                this.updateCannonAiming();
            }
        }
        
        // Update cannonballs
        this.updateCannonballs();
    }
      // This method has been moved to avoid duplicate declaration
}
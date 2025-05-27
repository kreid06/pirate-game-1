/**
 * COMPLETED FIXES:
 * All issues have been resolved and the build is now successful.
 * 
 * Fixes implemented:
 * 1. Fixed the `isPositionOnDeck` method in Ship.ts to work with specialized module classes
 * 2. Implemented the `destroy` method in Ship.ts to properly clean up modules
 * 3. Added missing `togglePlayerAtWheel` and `setPlayerOnBoard` methods to Ship.ts
 * 4. Added the `update` method to Ship.ts for proper ship physics updates
 * 5. Fixed type safety issues in Game.ts for accessing specialized module properties:
 *    - Updated sail collection access with proper instanceof checks
 *    - Fixed cannon turret angle setting with proper type handling
 * 6. Fixed CannonModule.ts to properly use game reference and barrel length
 * 7. Implemented calculateEfficiency method in SailModule.ts with proper wind calculations
 * 8. Fixed ParticleSystem.ts to be a proper module with export statement
 * 9. Updated imports in Game.ts to only include what's actually used
 * 
 * All specialized module classes (CannonModule, SailModule, WheelModule) are now properly
 * integrated with the Ship class and the game builds without errors.
 */
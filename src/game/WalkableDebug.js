// Function to test if a point is inside the ship hull path
// Helper for debugging the isPositionOnDeck method in Ship.ts

/**
 * Tests if coordinates are within the hull and not blocked by obstacles
 * 
 * @param {number} worldX - X position in world coordinates
 * @param {number} worldY - Y position in world coordinates 
 * @param {object} shipPosition - Ship position {x, y}
 * @param {number} shipAngle - Ship rotation angle in radians
 * @returns {boolean} True if position is walkable
 */
function testIsPositionOnDeck(worldX, worldY, shipPosition, shipAngle) {
    // Transform world coordinates to ship's local space
    const localX = worldX - shipPosition.x;
    const localY = worldY - shipPosition.y;
    const cosA = Math.cos(-shipAngle);
    const sinA = Math.sin(-shipAngle);
    const rotatedX = localX * cosA - localY * sinA;
    const rotatedY = localX * sinA + localY * cosA;
    
    // Create hull path
    const hullPath = createHullPath();
    
    // Create a temporary canvas for testing
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 1000;
    tempCanvas.height = 500;
    const tempCtx = tempCanvas.getContext('2d');
    
    // Prepare canvas for isPointInPath test
    tempCtx.save();
    tempCtx.translate(500, 250); // Center the path
    tempCtx.stroke(hullPath); // Need to render the path
    
    // Check if point is inside hull
    const isInsideHull = tempCtx.isPointInPath(hullPath, rotatedX, rotatedY);
    
    // Testing output
    console.log(`Testing point: world(${worldX}, ${worldY}) -> local(${rotatedX}, ${rotatedY})`);
    console.log(`Inside hull: ${isInsideHull}`);
    
    // Check obstacles (simplified)
    const isObstacle = false; // Add obstacle checking here if needed
    
    tempCtx.restore();
    
    return isInsideHull && !isObstacle;
}

// Hull path creation (same as in Ship.ts)
function createHullPath() {
    const HULL_POINTS = {
        bow: { x: 190, y: 90 },
        bowTip: { x: 415, y: 0 },
        bowBottom: { x: 190, y: -90 },
        sternBottom: { x: -260, y: -90 },
        sternTip: { x: -345, y: 0 },
        stern: { x: -260, y: 90 }
    };
    
    const p = HULL_POINTS;
    const path = new Path2D();
    path.moveTo(p.bow.x, p.bow.y);
    path.quadraticCurveTo(p.bowTip.x, p.bowTip.y, p.bow.x, p.bowBottom.y);
    path.lineTo(p.sternBottom.x, p.sternBottom.y);
    path.quadraticCurveTo(p.sternTip.x, p.sternTip.y, p.stern.x, p.stern.y);
    path.closePath();
    return path;
}

// Example usage:
// testIsPositionOnDeck(400, 300, {x: 400, y: 300}, 0);

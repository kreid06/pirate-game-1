// Debug script for testing hull shape and walkable area

// Temporarily create a canvas to test the hull shape
const debugCanvas = document.createElement('canvas');
debugCanvas.width = 800; 
debugCanvas.height = 500;
document.body.appendChild(debugCanvas);
const debugCtx = debugCanvas.getContext('2d');

// Create a Path2D for the hull shape
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

// Draw the path to test hull shape
debugCtx.save();
debugCtx.translate(400, 250);
const hullPath = createHullPath();
debugCtx.fillStyle = 'rgba(200, 200, 255, 0.5)';
debugCtx.fill(hullPath);
debugCtx.strokeStyle = 'white';
debugCtx.lineWidth = 2;
debugCtx.stroke(hullPath);

// Test a grid of points to validate isPointInPath
const gridSize = 20;
const width = 800;
const height = 400;

for (let x = -width/2; x <= width/2; x += gridSize) {
    for (let y = -height/2; y <= height/2; y += gridSize) {
        // Check if point is in path
        const insideHull = debugCtx.isPointInPath(hullPath, x, y);
        
        // Draw test point
        if (insideHull) {
            debugCtx.fillStyle = 'rgba(0, 255, 0, 0.5)';
        } else {
            debugCtx.fillStyle = 'rgba(255, 0, 0, 0.2)';
        }
        
        debugCtx.beginPath();
        debugCtx.arc(x, y, 3, 0, Math.PI * 2);
        debugCtx.fill();
    }
}

// Draw obstacles for reference
const MASTS = [
    { x: 165, y: 0, r: 30 },  // Front mast
    { x: -35, y: 0, r: 30 },  // Middle mast
    { x: -235, y: 0, r: 30 }, // Back mast
];

const WHEEL = { x: -90, y: 0, w: 20, h: 40 };

// Draw masts
debugCtx.fillStyle = 'rgba(139, 69, 19, 0.7)';
for (const mast of MASTS) {
    debugCtx.beginPath();
    debugCtx.arc(mast.x, mast.y, mast.r, 0, Math.PI * 2);
    debugCtx.fill();
}

// Draw wheel
debugCtx.fillStyle = 'rgba(255, 215, 0, 0.7)';
debugCtx.fillRect(
    WHEEL.x - WHEEL.w/2,
    WHEEL.y - WHEEL.h/2,
    WHEEL.w,
    WHEEL.h
);

debugCtx.restore();

console.log('Hull shape and walkable area test complete');

/**
 * BuildingSystem - Church Building Data & Rendering
 * Manages building layout, walls, doors, windows, and collision
 * 
 * NEW APPROACH: Walls are rendered on the EDGES of floor tiles, not as separate tiles.
 * This creates thin walls like Theme Hospital.
 */

(function() {
    'use strict';

    window.SimChurch = window.SimChurch || {};
    window.SimChurch.Phaser = window.SimChurch.Phaser || {};

    // Tile types for the building grid
    const TILE_TYPES = {
        EMPTY: 0,       // Outside building (grass)
        FLOOR: 1,       // Inside building (walkable)
        // Wall types are no longer separate tiles - walls are edges of floor tiles
    };

    // Edge flags (bitmask) - which edges of a floor tile have walls
    const EDGE = {
        NONE: 0,
        NORTH: 1,
        SOUTH: 2,
        EAST: 4,
        WEST: 8
    };

    // Feature types for edges (doors, windows)
    const FEATURE = {
        NONE: 0,
        DOOR: 1,
        WINDOW: 2,
        STAINED_WINDOW: 3
    };

    // Wall visual heights
    const WALL_HEIGHT = 48;
    const INTERIOR_WALL_HEIGHT = 32;

    // Default church building layout
    const DEFAULT_CHURCH = {
        name: 'Grace Community Church',
        width: 20,
        height: 16,
        // Building sections define different areas
        sections: [
            // Main sanctuary (center)
            { x: 5, y: 2, width: 10, height: 10, type: 'sanctuary' },
            // Narthex/Entry (south)
            { x: 7, y: 12, width: 6, height: 3, type: 'narthex' },
            // Left wing (west) - appears at higher attendance
            { x: 1, y: 4, width: 4, height: 6, type: 'wing-left', minAttendance: 100 },
            // Right wing (east) - appears at higher attendance
            { x: 15, y: 4, width: 4, height: 6, type: 'wing-right', minAttendance: 150 }
        ],
        // Doors on specific floor tiles (edge + direction)
        doors: [
            { x: 9, y: 14, edge: 'S', type: 'main' },       // Main entrance (south edge of narthex)
            { x: 10, y: 14, edge: 'S', type: 'main' },      // Double door
        ],
        // Windows on specific floor tiles (edge + direction)
        windows: [
            // South wall of narthex (flanking door)
            { x: 7, y: 14, edge: 'S' },
            { x: 12, y: 14, edge: 'S' },
            // East wall of sanctuary
            { x: 14, y: 4, edge: 'E' },
            { x: 14, y: 7, edge: 'E' },
            { x: 14, y: 10, edge: 'E' },
            // West wall of sanctuary  
            { x: 5, y: 4, edge: 'W' },
            { x: 5, y: 7, edge: 'W' },
            { x: 5, y: 10, edge: 'W' },
            // North wall (altar area - stained glass)
            { x: 7, y: 2, edge: 'N', type: 'stained' },
            { x: 9, y: 2, edge: 'N', type: 'stained' },
            { x: 11, y: 2, edge: 'N', type: 'stained' },
        ]
    };

    // Current building data
    let buildingData = null;
    let buildingGrid = null;      // TILE_TYPES for each cell
    let edgeGrid = null;          // EDGE bitmask for each floor cell (which edges have walls)
    let featureGrid = null;       // Features on each edge { N: FEATURE, S: FEATURE, ... }
    let collisionGrid = null;

    /**
     * Initialize the building system with default or saved data
     */
    function init(savedData = null) {
        buildingData = savedData ? { ...savedData } : JSON.parse(JSON.stringify(DEFAULT_CHURCH));
        generateGrids();
        console.log('[BuildingSystem] Initialized:', buildingData.name);
    }

    /**
     * Generate all grids from section data
     */
    function generateGrids() {
        const { width, height, sections, doors, windows } = buildingData;
        
        // Initialize grids
        buildingGrid = Array(height).fill(null).map(() => Array(width).fill(TILE_TYPES.EMPTY));
        edgeGrid = Array(height).fill(null).map(() => Array(width).fill(EDGE.NONE));
        featureGrid = Array(height).fill(null).map(() => 
            Array(width).fill(null).map(() => ({ N: FEATURE.NONE, S: FEATURE.NONE, E: FEATURE.NONE, W: FEATURE.NONE }))
        );
        collisionGrid = Array(height).fill(null).map(() => Array(width).fill(true));
        
        // Get current attendance to determine which sections are visible
        const State = window.SimChurch?.State;
        const attendance = State?.getState()?.stats?.attendance || 50;
        
        // Process each section - mark floor tiles
        sections.forEach(section => {
            if (section.minAttendance && attendance < section.minAttendance) {
                return;
            }
            
            for (let y = section.y; y < section.y + section.height; y++) {
                for (let x = section.x; x < section.x + section.width; x++) {
                    if (y >= 0 && y < height && x >= 0 && x < width) {
                        buildingGrid[y][x] = TILE_TYPES.FLOOR;
                        collisionGrid[y][x] = false; // Walkable
                    }
                }
            }
        });
        
        // Calculate which edges of floor tiles need walls
        calculateEdges();
        
        // Place door features
        doors.forEach(door => {
            if (door.x >= 0 && door.x < width && door.y >= 0 && door.y < height) {
                if (buildingGrid[door.y][door.x] === TILE_TYPES.FLOOR) {
                    featureGrid[door.y][door.x][door.edge] = FEATURE.DOOR;
                }
            }
        });
        
        // Place window features
        windows.forEach(win => {
            if (win.x >= 0 && win.x < width && win.y >= 0 && win.y < height) {
                if (buildingGrid[win.y][win.x] === TILE_TYPES.FLOOR) {
                    featureGrid[win.y][win.x][win.edge] = win.type === 'stained' ? FEATURE.STAINED_WINDOW : FEATURE.WINDOW;
                }
            }
        });
    }

    /**
     * Calculate which edges of each floor tile need walls
     */
    function calculateEdges() {
        const { width, height } = buildingData;
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (buildingGrid[y][x] === TILE_TYPES.FLOOR) {
                    let edges = EDGE.NONE;
                    
                    // Check each adjacent tile - if empty or out of bounds, we need a wall
                    // North edge
                    if (y === 0 || buildingGrid[y-1][x] === TILE_TYPES.EMPTY) {
                        edges |= EDGE.NORTH;
                    }
                    // South edge
                    if (y === height-1 || buildingGrid[y+1][x] === TILE_TYPES.EMPTY) {
                        edges |= EDGE.SOUTH;
                    }
                    // East edge
                    if (x === width-1 || buildingGrid[y][x+1] === TILE_TYPES.EMPTY) {
                        edges |= EDGE.EAST;
                    }
                    // West edge
                    if (x === 0 || buildingGrid[y][x-1] === TILE_TYPES.EMPTY) {
                        edges |= EDGE.WEST;
                    }
                    
                    edgeGrid[y][x] = edges;
                }
            }
        }
    }

    /**
     * Check if a tile is a floor tile
     */
    function isFloor(gridX, gridY) {
        if (!buildingGrid) return false;
        if (gridX < 0 || gridX >= buildingData.width) return false;
        if (gridY < 0 || gridY >= buildingData.height) return false;
        return buildingGrid[gridY][gridX] === TILE_TYPES.FLOOR;
    }

    /**
     * Get the building grid
     */
    function getGrid() {
        return buildingGrid;
    }

    /**
     * Get edges for a floor tile
     */
    function getEdges(gridX, gridY) {
        if (!edgeGrid) return EDGE.NONE;
        if (gridX < 0 || gridX >= buildingData.width) return EDGE.NONE;
        if (gridY < 0 || gridY >= buildingData.height) return EDGE.NONE;
        return edgeGrid[gridY][gridX];
    }

    /**
     * Get features for a floor tile
     */
    function getFeatures(gridX, gridY) {
        if (!featureGrid) return { N: FEATURE.NONE, S: FEATURE.NONE, E: FEATURE.NONE, W: FEATURE.NONE };
        if (gridX < 0 || gridX >= buildingData.width) return { N: FEATURE.NONE, S: FEATURE.NONE, E: FEATURE.NONE, W: FEATURE.NONE };
        if (gridY < 0 || gridY >= buildingData.height) return { N: FEATURE.NONE, S: FEATURE.NONE, E: FEATURE.NONE, W: FEATURE.NONE };
        return featureGrid[gridY][gridX];
    }

    /**
     * Get the collision grid
     */
    function getCollisionGrid() {
        return collisionGrid;
    }

    /**
     * Check if a grid position is walkable
     */
    function isWalkable(gridX, gridY) {
        if (!collisionGrid) return false;
        if (gridX < 0 || gridX >= buildingData.width) return false;
        if (gridY < 0 || gridY >= buildingData.height) return false;
        return !collisionGrid[gridY][gridX];
    }

    /**
     * Get building dimensions
     */
    function getDimensions() {
        return {
            width: buildingData?.width || 20,
            height: buildingData?.height || 16
        };
    }

    /**
     * Get tile type at position
     */
    function getTileAt(gridX, gridY) {
        if (!buildingGrid) return TILE_TYPES.EMPTY;
        if (gridX < 0 || gridX >= buildingData.width) return TILE_TYPES.EMPTY;
        if (gridY < 0 || gridY >= buildingData.height) return TILE_TYPES.EMPTY;
        return buildingGrid[gridY][gridX];
    }

    /**
     * Get all door positions
     */
    function getDoors() {
        return buildingData?.doors || [];
    }

    /**
     * Get all window positions
     */
    function getWindows() {
        return buildingData?.windows || [];
    }

    /**
     * Get building sections
     */
    function getSections() {
        return buildingData?.sections || [];
    }

    /**
     * Update building when attendance changes (wings appear/disappear)
     */
    function updateForAttendance() {
        generateGrids();
    }

    /**
     * Get save data for the building
     */
    function getSaveData() {
        return JSON.parse(JSON.stringify(buildingData));
    }

    /**
     * Add a feature (door/window) to an edge
     */
    function addFeature(gridX, gridY, edge, featureType) {
        if (!isFloor(gridX, gridY)) {
            console.warn('[BuildingSystem] Cannot add feature to non-floor tile');
            return false;
        }
        
        if (!featureGrid[gridY][gridX]) {
            featureGrid[gridY][gridX] = { N: FEATURE.NONE, S: FEATURE.NONE, E: FEATURE.NONE, W: FEATURE.NONE };
        }
        
        featureGrid[gridY][gridX][edge] = featureType;
        
        // Save to building data for persistence
        if (featureType === FEATURE.DOOR) {
            if (!buildingData.doors) buildingData.doors = [];
            buildingData.doors.push({ x: gridX, y: gridY, edge: edge, type: 'interior' });
        } else if (featureType === FEATURE.WINDOW || featureType === FEATURE.STAINED_WINDOW) {
            if (!buildingData.windows) buildingData.windows = [];
            buildingData.windows.push({ 
                x: gridX, 
                y: gridY, 
                edge: edge, 
                type: featureType === FEATURE.STAINED_WINDOW ? 'stained' : 'interior' 
            });
        }
        
        return true;
    }

    /**
     * Remove a feature from an edge
     */
    function removeFeature(gridX, gridY, edge) {
        if (!isFloor(gridX, gridY)) {
            return false;
        }
        
        if (!featureGrid[gridY][gridX]) {
            return false;
        }
        
        const oldFeature = featureGrid[gridY][gridX][edge];
        featureGrid[gridY][gridX][edge] = FEATURE.NONE;
        
        // Remove from building data
        if (oldFeature === FEATURE.DOOR) {
            if (buildingData.doors) {
                buildingData.doors = buildingData.doors.filter(d => 
                    !(d.x === gridX && d.y === gridY && d.edge === edge && d.type === 'interior')
                );
            }
        } else if (oldFeature === FEATURE.WINDOW || oldFeature === FEATURE.STAINED_WINDOW) {
            if (buildingData.windows) {
                buildingData.windows = buildingData.windows.filter(w => 
                    !(w.x === gridX && w.y === gridY && w.edge === edge && w.type === 'interior')
                );
            }
        }
        
        return true;
    }

    /**
     * Add an interior wall
     * itemType: 'wall-straight-ns', 'wall-straight-ew', 'wall-corner-*', etc.
     */
    function addInteriorWall(itemType, gridX, gridY, edge) {
        if (!isFloor(gridX, gridY)) {
            console.warn('[BuildingSystem] Cannot add wall to non-floor tile');
            return false;
        }
        
        // For straight walls, we add an edge
        if (itemType === 'wall-straight-ns') {
            // North-South wall means East or West edge
            if (edge === 'E') {
                edgeGrid[gridY][gridX] |= EDGE.EAST;
            } else if (edge === 'W') {
                edgeGrid[gridY][gridX] |= EDGE.WEST;
            }
        } else if (itemType === 'wall-straight-ew') {
            // East-West wall means North or South edge
            if (edge === 'N') {
                edgeGrid[gridY][gridX] |= EDGE.NORTH;
            } else if (edge === 'S') {
                edgeGrid[gridY][gridX] |= EDGE.SOUTH;
            }
        } else if (itemType.startsWith('wall-corner-')) {
            // Corner walls add two edges
            if (itemType === 'wall-corner-ne') {
                edgeGrid[gridY][gridX] |= EDGE.NORTH;
                edgeGrid[gridY][gridX] |= EDGE.EAST;
            } else if (itemType === 'wall-corner-nw') {
                edgeGrid[gridY][gridX] |= EDGE.NORTH;
                edgeGrid[gridY][gridX] |= EDGE.WEST;
            } else if (itemType === 'wall-corner-se') {
                edgeGrid[gridY][gridX] |= EDGE.SOUTH;
                edgeGrid[gridY][gridX] |= EDGE.EAST;
            } else if (itemType === 'wall-corner-sw') {
                edgeGrid[gridY][gridX] |= EDGE.SOUTH;
                edgeGrid[gridY][gridX] |= EDGE.WEST;
            }
        }
        
        // Update collision grid (walls block movement)
        // For now, we'll keep floor tiles walkable, but pathfinding will need to check edges
        
        // Save to building data
        if (!buildingData.interiorWalls) {
            buildingData.interiorWalls = [];
        }
        buildingData.interiorWalls.push({ x: gridX, y: gridY, type: itemType, edge: edge });
        
        return true;
    }

    /**
     * Check if a wall on an edge is an interior wall (player-built)
     */
    function isInteriorWall(gridX, gridY, edge) {
        if (!buildingData.interiorWalls) {
            return false;
        }
        return buildingData.interiorWalls.some(w => 
            w.x === gridX && w.y === gridY && w.edge === edge
        );
    }

    /**
     * Remove an interior wall
     */
    function removeInteriorWall(gridX, gridY, edge) {
        if (!isFloor(gridX, gridY)) {
            return false;
        }
        
        const edgeFlag = EDGE[edge];
        if (edgeFlag) {
            edgeGrid[gridY][gridX] &= ~edgeFlag;
        }
        
        // Remove from building data
        if (buildingData.interiorWalls) {
            buildingData.interiorWalls = buildingData.interiorWalls.filter(w => 
                !(w.x === gridX && w.y === gridY && w.edge === edge)
            );
        }
        
        return true;
    }

    // Expose the BuildingSystem
    SimChurch.Phaser.BuildingSystem = {
        init,
        getGrid,
        getEdges,
        getFeatures,
        getCollisionGrid,
        isFloor,
        isWalkable,
        getDimensions,
        getTileAt,
        getDoors,
        getWindows,
        getSections,
        updateForAttendance,
        getSaveData,
        addFeature,
        removeFeature,
        addInteriorWall,
        removeInteriorWall,
        isInteriorWall,
        TILE_TYPES,
        EDGE,
        FEATURE,
        WALL_HEIGHT,
        INTERIOR_WALL_HEIGHT
    };

})();

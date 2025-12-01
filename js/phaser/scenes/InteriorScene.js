/**
 * InteriorScene - Church Interior View
 * Main isometric gameplay area with edge-based walls
 */

(function () {
    'use strict';

    window.SimChurch = window.SimChurch || {};
    window.SimChurch.Phaser = window.SimChurch.Phaser || {};

    // Isometric tile dimensions
    const TILE_WIDTH = 64;
    const TILE_HEIGHT = 32;

    class InteriorScene extends Phaser.Scene {
        constructor() {
            super({ key: 'InteriorScene' });

            this.isDragging = false;
            this.dragStartX = 0;
            this.dragStartY = 0;
            this.cameraStartX = 0;
            this.cameraStartY = 0;

            // Diagnostic state to prevent console flooding
            this.lastLogState = { gridX: null, gridY: null, edge: null };

            // Layer containers
            this.grassLayer = null;
            this.floorLayer = null;
            this.wallLayer = null;
            this.furnitureLayer = null;
            this.peopleLayer = null;
            this.gridOverlayLayer = null;
            this.previewLayer = null;
        }

        updateGridVisibility(visible) {
            if (this.gridOverlayLayer) {
                this.gridOverlayLayer.setVisible(visible);
            }

            // If turning on, make sure it's rendered
            if (visible) {
                this.renderGridOverlay();
            }
        }

        create() {
            console.log('[InteriorScene] Creating interior view');

            // Initialize building system
            const BuildingSystem = SimChurch.Phaser.BuildingSystem;
            BuildingSystem.init();

            // Initialize construction system
            const ConstructionSystem = SimChurch.Phaser.ConstructionSystem;
            if (ConstructionSystem) {
                ConstructionSystem.init();
            }

            const dimensions = BuildingSystem.getDimensions();

            // Calculate world bounds
            const worldWidth = (dimensions.width + dimensions.height) * TILE_WIDTH / 2;
            const worldHeight = (dimensions.width + dimensions.height) * TILE_HEIGHT / 2 + 200;

            this.cameras.main.setBounds(
                -worldWidth / 2 - 100,
                -150,
                worldWidth + 200,
                worldHeight + 300
            );

            this.cameras.main.fadeIn(500, 0, 0, 0);

            // Create layer containers
            this.grassLayer = this.add.container(0, 0);
            this.floorLayer = this.add.container(0, 0);
            this.wallLayer = this.add.container(0, 0);
            this.furnitureLayer = this.add.container(0, 0);
            this.peopleLayer = this.add.container(0, 0);
            this.gridOverlayLayer = this.add.container(0, 0);
            this.previewLayer = this.add.container(0, 0);

            // Render building
            this.renderGrass();
            this.renderFloor();
            this.renderFurniture(); // Initial furniture render
            this.renderWalls();

            // Initialize grid (hidden by default)
            this.renderGridOverlay();
            this.gridOverlayLayer.setVisible(false);

            // UI and controls
            this.scene.launch('InteriorUIScene', { mainScene: this });
            this.setupCameraControls();

            // Center camera
            const centerX = (dimensions.width - dimensions.height) * TILE_WIDTH / 4;
            const centerY = (dimensions.width + dimensions.height) * TILE_HEIGHT / 4;
            this.cameras.main.centerOn(centerX, centerY);

            console.log('[InteriorScene] Interior view ready');
        }

        gridToIso(gridX, gridY) {
            return {
                x: (gridX - gridY) * TILE_WIDTH / 2,
                y: (gridX + gridY) * TILE_HEIGHT / 2
            };
        }

        isoToGrid(isoX, isoY) {
            return {
                x: Math.floor((isoX / (TILE_WIDTH / 2) + isoY / (TILE_HEIGHT / 2)) / 2),
                y: Math.floor((isoY / (TILE_HEIGHT / 2) - isoX / (TILE_WIDTH / 2)) / 2)
            };
        }

        /**
         * Render grass only on EMPTY tiles
         */
        renderGrass() {
            const BuildingSystem = SimChurch.Phaser.BuildingSystem;
            const dimensions = BuildingSystem.getDimensions();
            const padding = 3;

            for (let y = -padding; y < dimensions.height + padding; y++) {
                for (let x = -padding; x < dimensions.width + padding; x++) {
                    // Only render grass on empty tiles (not floor)
                    if (!BuildingSystem.isFloor(x, y)) {
                        const iso = this.gridToIso(x, y);
                        this.drawGrassTile(iso.x, iso.y, x, y);
                    }
                }
            }
        }

        drawGrassTile(x, y, gridX, gridY) {
            const tile = this.add.graphics();

            const variation = ((gridX * 7 + gridY * 13) % 3);
            const grassColors = [0x4A8B3A, 0x52993F, 0x458534];

            tile.fillStyle(grassColors[variation], 1);
            tile.beginPath();
            tile.moveTo(x, y - TILE_HEIGHT / 2);
            tile.lineTo(x + TILE_WIDTH / 2, y);
            tile.lineTo(x, y + TILE_HEIGHT / 2);
            tile.lineTo(x - TILE_WIDTH / 2, y);
            tile.closePath();
            tile.fillPath();

            tile.setDepth(y - 1000);
            this.grassLayer.add(tile);
        }

        /**
         * Render floor tiles
         */
        renderFloor() {
            const BuildingSystem = SimChurch.Phaser.BuildingSystem;
            const dimensions = BuildingSystem.getDimensions();

            for (let y = 0; y < dimensions.height; y++) {
                for (let x = 0; x < dimensions.width; x++) {
                    if (BuildingSystem.isFloor(x, y)) {
                        const iso = this.gridToIso(x, y);
                        this.drawFloorTile(iso.x, iso.y, x, y);
                    }
                }
            }
        }

        drawFloorTile(x, y, gridX, gridY) {
            const tile = this.add.graphics();

            const isLight = (gridX + gridY) % 2 === 0;
            const baseColor = isLight ? 0x8B7355 : 0x7A6348;

            tile.fillStyle(baseColor, 1);
            tile.beginPath();
            tile.moveTo(x, y - TILE_HEIGHT / 2);
            tile.lineTo(x + TILE_WIDTH / 2, y);
            tile.lineTo(x, y + TILE_HEIGHT / 2);
            tile.lineTo(x - TILE_WIDTH / 2, y);
            tile.closePath();
            tile.fillPath();

            tile.lineStyle(1, 0x5D4E37, 0.3);
            tile.strokePath();

            tile.setDepth(y);
            this.floorLayer.add(tile);
        }

        /**
         * Render furniture on floor tiles
         */
        renderFurniture() {
            const BuildingSystem = SimChurch.Phaser.BuildingSystem;
            const dimensions = BuildingSystem.getDimensions();

            // Clear existing furniture
            this.furnitureLayer.removeAll(true);

            for (let y = 0; y < dimensions.height; y++) {
                for (let x = 0; x < dimensions.width; x++) {
                    const furniture = BuildingSystem.getFurniture(x, y);
                    if (furniture) {
                        const iso = this.gridToIso(x, y);
                        this.drawFurniture(iso.x, iso.y, x, y, furniture.type, furniture.rotation);
                    }
                }
            }
        }

        /**
         * Draw a specific furniture item
         */
        drawFurniture(x, y, gridX, gridY, type, rotation) {
            const BuildingSystem = SimChurch.Phaser.BuildingSystem;
            const F = BuildingSystem.FURNITURE;

            // Helper to get asset key
            const getAssetKey = (base, rot) => {
                const variants = ['_NW', '_NE', '_SE', '_SW'];
                // Map our rotation (0-3) to these variants
                // 0=North -> NW, 1=East -> NE, 2=South -> SE, 3=West -> SW
                // Verify mapping based on Kenney's assets:
                // _NE is facing Top-Right (East)
                // _NW is facing Top-Left (North)
                // _SE is facing Bottom-Right (South)
                // _SW is facing Bottom-Left (West)
                return `${base}${variants[rot]}`;
            };

            let textureKey = null;
            let fallbackColor = 0x8B4513;

            if (type === F.PEW) {
                textureKey = getAssetKey('pew', rotation);
            } else if (type === F.PULPIT) {
                textureKey = getAssetKey('pulpit', rotation);
            } else if (type === F.PIANO) {
                textureKey = getAssetKey('piano', rotation);
            } else if (type === F.PLANT) {
                textureKey = getAssetKey('plant', rotation);
            }

            // Check if texture exists
            if (textureKey && this.textures.exists(textureKey)) {
                const sprite = this.add.image(x, y, textureKey);

                // Adjust origin if necessary (Kenney's sprites are usually centered at bottom)
                // Default origin is 0.5, 0.5. 
                // Isometric sprites often need the "feet" at the tile center.
                // Let's try adjusting Y anchor to bottom (1.0) or slightly up.
                sprite.setOrigin(0.5, 0.75); // Trial value, might need tweaking

                sprite.setDepth(gridY + gridX + 1);
                this.furnitureLayer.add(sprite);
            } else {
                // Fallback to placeholder graphics if asset not found
                const graphics = this.add.graphics();

                if (type === F.PEW) {
                    // Pew: Long bench
                    graphics.fillStyle(0x8B4513, 1); // Saddle Brown

                    let w = 40;
                    let h = 20;
                    // Swap dimensions if rotated 90 or 270 degrees
                    if (rotation === 1 || rotation === 3) {
                        w = 20;
                        h = 40;
                    }

                    const z = 15;
                    // Draw simplified 3D box
                    // Top
                    graphics.beginPath();
                    graphics.moveTo(x - w / 2, y - h / 2 - z);
                    graphics.lineTo(x + w / 2, y - h / 2 - z);
                    graphics.lineTo(x + w / 2, y + h / 2 - z);
                    graphics.lineTo(x - w / 2, y + h / 2 - z);
                    graphics.closePath();
                    graphics.fillPath();
                    // Front
                    graphics.fillStyle(0x5D3A1A, 1); // Darker brown
                    graphics.beginPath();
                    graphics.moveTo(x - w / 2, y + h / 2 - z);
                    graphics.lineTo(x + w / 2, y + h / 2 - z);
                    graphics.lineTo(x + w / 2, y + h / 2);
                    graphics.lineTo(x - w / 2, y + h / 2);
                    graphics.closePath();
                    graphics.fillPath();
                } else if (type === F.PULPIT) {
                    // Pulpit: Tall podium
                    graphics.fillStyle(0x5D3A1A, 1);
                    const w = 20;
                    const h = 20;
                    const z = 30;
                    graphics.fillRect(x - w / 2, y - z, w, z); // Front face projection
                    // Top
                    graphics.fillStyle(0x8B4513, 1);
                    graphics.beginPath();
                    graphics.moveTo(x - w / 2, y - z - h / 2);
                    graphics.lineTo(x + w / 2, y - z - h / 2);
                    graphics.lineTo(x + w / 2, y - z + h / 2);
                    graphics.lineTo(x - w / 2, y - z + h / 2);
                    graphics.closePath();
                    graphics.fillPath();
                } else if (type === F.PIANO) {
                    // Piano: Black
                    graphics.fillStyle(0x111111, 1);
                    let w = 40;
                    let h = 30;
                    if (rotation === 1 || rotation === 3) {
                        w = 30;
                        h = 40;
                    }
                    const z = 25;
                    // Top
                    graphics.beginPath();
                    graphics.moveTo(x - w / 2, y - z - h / 2);
                    graphics.lineTo(x + w / 2, y - z - h / 2);
                    graphics.lineTo(x + w / 2, y - z + h / 2);
                    graphics.lineTo(x - w / 2, y - z + h / 2);
                    graphics.closePath();
                    graphics.fillPath();
                    // Front
                    graphics.fillRect(x - w / 2, y - z + h / 2, w, z);
                } else if (type === F.PLANT) {
                    // Plant: Green circle
                    graphics.fillStyle(0x228B22, 1); // Forest Green
                    graphics.fillCircle(x, y - 15, 10);
                    // Pot
                    graphics.fillStyle(0xA0522D, 1); // Sienna
                    graphics.fillRect(x - 5, y - 10, 10, 10);
                }

                graphics.setDepth(gridY + gridX + 1); // Higher depth than floor
                this.furnitureLayer.add(graphics);
            }
        }

        /**
         * Render walls on edges of floor tiles
         */
        renderWalls() {
            const BuildingSystem = SimChurch.Phaser.BuildingSystem;
            const EDGE = BuildingSystem.EDGE;
            const dimensions = BuildingSystem.getDimensions();
            const wallHeight = BuildingSystem.WALL_HEIGHT;

            // Collect wall segments for depth sorting
            const wallSegments = [];

            for (let y = 0; y < dimensions.height; y++) {
                for (let x = 0; x < dimensions.width; x++) {
                    if (BuildingSystem.isFloor(x, y)) {
                        const edges = BuildingSystem.getEdges(x, y);
                        const features = BuildingSystem.getFeatures(x, y);
                        const iso = this.gridToIso(x, y);

                        // Add wall segments for each edge that needs a wall
                        if (edges & EDGE.NORTH) {
                            wallSegments.push({
                                x: iso.x, y: iso.y, gridX: x, gridY: y,
                                edge: 'N', feature: features.N, depth: x + y,
                                isInterior: BuildingSystem.isInteriorWall(x, y, 'N')
                            });
                        }
                        if (edges & EDGE.SOUTH) {
                            wallSegments.push({
                                x: iso.x, y: iso.y, gridX: x, gridY: y,
                                edge: 'S', feature: features.S, depth: x + y + 1,
                                isInterior: BuildingSystem.isInteriorWall(x, y, 'S')
                            });
                        }
                        if (edges & EDGE.EAST) {
                            wallSegments.push({
                                x: iso.x, y: iso.y, gridX: x, gridY: y,
                                edge: 'E', feature: features.E, depth: x + y + 0.5,
                                isInterior: BuildingSystem.isInteriorWall(x, y, 'E')
                            });
                        }
                        if (edges & EDGE.WEST) {
                            wallSegments.push({
                                x: iso.x, y: iso.y, gridX: x, gridY: y,
                                edge: 'W', feature: features.W, depth: x + y,
                                isInterior: BuildingSystem.isInteriorWall(x, y, 'W')
                            });
                        }
                    }
                }
            }

            // Sort by depth (back to front)
            wallSegments.sort((a, b) => a.depth - b.depth);

            // Render each wall segment
            wallSegments.forEach(seg => {
                this.drawWallEdge(seg.x, seg.y, seg.edge, seg.feature, wallHeight, seg.depth, seg.isInterior);
            });
        }

        /**
         * Draw a wall on a specific edge of a floor tile
         * With 3D depth effect (top cap and thickness)
         */
        drawWallEdge(x, y, edge, feature, height, depth, isInterior = false) {
            const FEATURE = SimChurch.Phaser.BuildingSystem.FEATURE;
            const wall = this.add.graphics();

            // Wall thickness for 3D effect
            const WALL_THICKNESS = 4;

            // --- PALETTES ---
            let brickLight, brickDark, topColor, mortarColor;

            if (isInterior) {
                // Interior: Smooth cream plaster with dark wood trim
                brickLight = 0xF0F0E0;  // Cream (Lit)
                brickDark = 0xD0D0C0;   // Darker Cream (Shadow)
                topColor = 0x5D3A1A;    // Dark Wood Top Cap
                mortarColor = null;     // No lines for plaster
            } else {
                // Exterior: Reddish-brown brick
                brickLight = 0xC17F59;  // Lit face
                brickDark = 0xA66B4A;   // Shadow face
                topColor = 0xD4956B;    // Lighter brick top
                mortarColor = 0x8B6B4A; // Dark mortar lines
            }

            // Coordinates for the 4 corners of the tile
            const xN = x;
            const yN = y - TILE_HEIGHT / 2;

            const xS = x;
            const yS = y + TILE_HEIGHT / 2;

            const xW = x - TILE_WIDTH / 2;
            const yW = y;

            const xE = x + TILE_WIDTH / 2;
            const yE = y;

            let x1, y1, x2, y2;
            let thickOffsetX = 0, thickOffsetY = 0;

            if (edge === 'N') {
                // North Edge: Connects North Corner -> East Corner
                x1 = xN; y1 = yN; x2 = xE; y2 = yE;
                thickOffsetX = -WALL_THICKNESS / 2; thickOffsetY = WALL_THICKNESS / 4;
            } else if (edge === 'W') {
                // West Edge: Connects West Corner -> North Corner
                x1 = xW; y1 = yW; x2 = xN; y2 = yN;
                thickOffsetX = WALL_THICKNESS / 2; thickOffsetY = WALL_THICKNESS / 4;
            } else if (edge === 'S') {
                // South Edge: Connects South Corner -> West Corner
                x1 = xS; y1 = yS; x2 = xW; y2 = yW;
                thickOffsetX = WALL_THICKNESS / 2; thickOffsetY = -WALL_THICKNESS / 4;
            } else if (edge === 'E') {
                // East Edge: Connects East Corner -> South Corner
                x1 = xE; y1 = yE; x2 = xS; y2 = yS;
                thickOffsetX = -WALL_THICKNESS / 2; thickOffsetY = -WALL_THICKNESS / 4;
            }

            // Draw the wall with depth
            if (x1 !== undefined) {
                // Determine face color based on lighting
                // Light from top-left: S/W faces are lit, N/E faces are in shadow
                const faceColor = (edge === 'N' || edge === 'E') ? brickDark : brickLight;

                // === MAIN WALL FACE ===
                wall.fillStyle(faceColor, 1);
                wall.beginPath();
                wall.moveTo(x1, y1);
                wall.lineTo(x2, y2);
                wall.lineTo(x2, y2 - height);
                wall.lineTo(x1, y1 - height);
                wall.closePath();
                wall.fillPath();

                // Add texture lines (Only for Exterior)
                if (mortarColor !== null) {
                    this.addBrickLines(wall, x1, y1, x2, y2, height, mortarColor);
                }

                // === TOP CAP (gives 3D depth) ===
                wall.fillStyle(topColor, 1);
                wall.beginPath();
                wall.moveTo(x1, y1 - height);
                wall.lineTo(x2, y2 - height);
                wall.lineTo(x2 + thickOffsetX, y2 - height + thickOffsetY);
                wall.lineTo(x1 + thickOffsetX, y1 - height + thickOffsetY);
                wall.closePath();
                wall.fillPath();

                // === SIDE CAP (visible end of wall thickness) ===
                // Only draw on certain edges for proper 3D appearance
                if (edge === 'N' || edge === 'W') {
                    // Draw end cap at x2,y2 corner
                    const capColor = (edge === 'N') ? brickLight : brickDark;
                    wall.fillStyle(capColor, 0.9);
                    wall.beginPath();
                    wall.moveTo(x2, y2);
                    wall.lineTo(x2, y2 - height);
                    wall.lineTo(x2 + thickOffsetX, y2 - height + thickOffsetY);
                    wall.lineTo(x2 + thickOffsetX, y2 + thickOffsetY);
                    wall.closePath();
                    wall.fillPath();
                } else {
                    // Draw end cap at x1,y1 corner for S and E
                    const capColor = (edge === 'S') ? brickDark : brickLight;
                    wall.fillStyle(capColor, 0.9);
                    wall.beginPath();
                    wall.moveTo(x1, y1);
                    wall.lineTo(x1, y1 - height);
                    wall.lineTo(x1 + thickOffsetX, y1 - height + thickOffsetY);
                    wall.lineTo(x1 + thickOffsetX, y1 + thickOffsetY);
                    wall.closePath();
                    wall.fillPath();
                }

                // Draw features (doors, windows) on top of wall
                if (feature !== FEATURE.NONE) {
                    this.drawFeatureOnWall(wall, x1, y1, x2, y2, height, edge, feature);
                }
            }

            wall.setDepth(depth * 100 + 500);
            this.wallLayer.add(wall);
        }
        /**
         * Add brick texture lines to a wall
         */
        addBrickLines(graphics, x1, y1, x2, y2, height, color) {
            graphics.lineStyle(1, color, 0.3);

            const rows = 4;
            for (let i = 1; i < rows; i++) {
                const h = height * i / rows;
                graphics.lineBetween(x1, y1 - h, x2, y2 - h);
            }
        }

        /**
         * Draw a feature (door or window) on a wall edge
         */
        drawFeatureOnWall(graphics, x1, y1, x2, y2, wallHeight, edge, feature) {
            const FEATURE = SimChurch.Phaser.BuildingSystem.FEATURE;

            if (feature === FEATURE.DOOR) {
                this.drawDoorOnEdge(graphics, x1, y1, x2, y2, wallHeight, edge);
            } else if (feature === FEATURE.WINDOW || feature === FEATURE.STAINED_WINDOW) {
                this.drawWindowOnEdge(graphics, x1, y1, x2, y2, wallHeight, edge, feature === FEATURE.STAINED_WINDOW);
            }
        }

        /**
         * Draw a window on a wall edge (isometric parallelogram)
         */
        drawWindowOnEdge(graphics, x1, y1, x2, y2, wallHeight, edge, isStained) {
            const windowColor = isStained ? 0x6B4BA5 : 0x5588BB;
            const frameColor = 0x654321;

            // Window dimensions relative to wall
            const winHeightRatio = 0.4;
            const winWidthRatio = 0.5;
            const winBottomRatio = 0.25;

            const winHeight = wallHeight * winHeightRatio;
            const winBottom = wallHeight * winBottomRatio;

            // Calculate window corners along the wall edge
            const dx = x2 - x1;
            const dy = y2 - y1;
            const startRatio = (1 - winWidthRatio) / 2;
            const endRatio = 1 - startRatio;

            const wx1 = x1 + dx * startRatio;
            const wy1 = y1 + dy * startRatio;
            const wx2 = x1 + dx * endRatio;
            const wy2 = y1 + dy * endRatio;

            // Draw window glass (parallelogram following wall angle)
            graphics.fillStyle(windowColor, 0.8);
            graphics.beginPath();
            graphics.moveTo(wx1, wy1 - winBottom - winHeight);
            graphics.lineTo(wx2, wy2 - winBottom - winHeight);
            graphics.lineTo(wx2, wy2 - winBottom);
            graphics.lineTo(wx1, wy1 - winBottom);
            graphics.closePath();
            graphics.fillPath();

            // Window frame
            graphics.lineStyle(2, frameColor, 1);
            graphics.strokePath();

            // Cross dividers
            graphics.lineStyle(1, frameColor, 0.8);
            const midX = (wx1 + wx2) / 2;
            const midY1 = (wy1 + wy2) / 2;
            graphics.lineBetween(midX, midY1 - winBottom - winHeight, midX, midY1 - winBottom);

            const midH = winBottom + winHeight / 2;
            graphics.lineBetween(wx1, wy1 - midH, wx2, wy2 - midH);
        }

        /**
         * Draw a door on a wall edge
         */
        drawDoorOnEdge(graphics, x1, y1, x2, y2, wallHeight, edge) {
            const doorColor = 0x5D3A1A;
            const interiorColor = 0x1a1614;

            const doorHeightRatio = 0.75;
            const doorWidthRatio = 0.6;

            const doorHeight = wallHeight * doorHeightRatio;

            const dx = x2 - x1;
            const dy = y2 - y1;
            const startRatio = (1 - doorWidthRatio) / 2;
            const endRatio = 1 - startRatio;

            const dx1 = x1 + dx * startRatio;
            const dy1 = y1 + dy * startRatio;
            const dx2 = x1 + dx * endRatio;
            const dy2 = y1 + dy * endRatio;

            // Door opening (dark interior)
            graphics.fillStyle(interiorColor, 1);
            graphics.beginPath();
            graphics.moveTo(dx1, dy1 - doorHeight);
            graphics.lineTo(dx2, dy2 - doorHeight);
            graphics.lineTo(dx2, dy2);
            graphics.lineTo(dx1, dy1);
            graphics.closePath();
            graphics.fillPath();

            // Door frame
            graphics.lineStyle(3, doorColor, 1);
            graphics.strokePath();
        }

        setupCameraControls() {
            this.input.on('pointerdown', (pointer) => {
                if (pointer.button === 0) {
                    // Only start drag if not in construction mode or if middle/right button
                    const ConstructionSystem = SimChurch.Phaser.ConstructionSystem;
                    const inConstructionMode = ConstructionSystem && ConstructionSystem.isActive();

                    if (!inConstructionMode) {
                        this.isDragging = true;
                        this.dragStartX = pointer.x;
                        this.dragStartY = pointer.y;
                        this.cameraStartX = this.cameras.main.scrollX;
                        this.cameraStartY = this.cameras.main.scrollY;
                    } else {
                        // In construction mode, don't start dragging immediately
                        this.isDragging = false;
                        this.dragStartX = pointer.x;
                        this.dragStartY = pointer.y;
                        this.cameraStartX = this.cameras.main.scrollX;
                        this.cameraStartY = this.cameras.main.scrollY;
                        this.hasMoved = false;
                    }
                }
            });

            this.input.on('pointermove', (pointer) => {
                const ConstructionSystem = SimChurch.Phaser.ConstructionSystem;
                const inConstructionMode = ConstructionSystem && ConstructionSystem.isActive();

                if (this.dragStartX !== undefined && this.dragStartY !== undefined) {
                    const dx = Math.abs(pointer.x - this.dragStartX);
                    const dy = Math.abs(pointer.y - this.dragStartY);

                    if (inConstructionMode) {
                        // In construction mode, only drag if moved significantly
                        if (dx > 5 || dy > 5) {
                            this.isDragging = true;
                            this.hasMoved = true;
                            this.cameras.main.scrollX = this.cameraStartX - (pointer.x - this.dragStartX);
                            this.cameras.main.scrollY = this.cameraStartY - (pointer.y - this.dragStartY);
                        } else {
                            // Handle construction mode hover
                            this.handleConstructionHover(pointer);
                        }
                    } else {
                        // Not in construction mode, normal drag behavior
                        if (this.isDragging) {
                            this.cameras.main.scrollX = this.cameraStartX - (pointer.x - this.dragStartX);
                            this.cameras.main.scrollY = this.cameraStartY - (pointer.y - this.dragStartY);
                        }
                    }
                } else {
                    // Mouse is moving without clicking (Hover state)
                    if (inConstructionMode) {
                        this.handleConstructionHover(pointer);
                    }
                }
            });

            this.input.on('pointerup', (pointer) => {
                const ConstructionSystem = SimChurch.Phaser.ConstructionSystem;
                const inConstructionMode = ConstructionSystem && ConstructionSystem.isActive();

                if (inConstructionMode) {
                    // Only handle construction click if we didn't drag
                    if (!this.hasMoved && !this.isDragging) {
                        this.handleConstructionClick(pointer);
                    }
                }

                // Reset drag state
                this.isDragging = false;
                this.hasMoved = false;
                this.dragStartX = undefined;
                this.dragStartY = undefined;
            });

            this.cursors = this.input.keyboard.createCursorKeys();
            this.wasd = this.input.keyboard.addKeys({
                up: Phaser.Input.Keyboard.KeyCodes.W,
                down: Phaser.Input.Keyboard.KeyCodes.S,
                left: Phaser.Input.Keyboard.KeyCodes.A,
                right: Phaser.Input.Keyboard.KeyCodes.D
            });

            this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY) => {
                const newZoom = Phaser.Math.Clamp(
                    this.cameras.main.zoom + (deltaY > 0 ? -0.1 : 0.1),
                    0.5, 2
                );
                this.cameras.main.setZoom(newZoom);
            });

            // Rotation key
            this.input.keyboard.on('keydown-R', () => {
                const ConstructionSystem = SimChurch.Phaser.ConstructionSystem;
                if (ConstructionSystem && ConstructionSystem.isActive()) {
                    const newRotation = ConstructionSystem.rotateItem();
                    console.log(`[InteriorScene] Rotated item to: ${newRotation}`);

                    // Force preview update if hovering
                    const { gridX, gridY, edge } = ConstructionSystem.getPreview();
                    if (gridX !== null && gridY !== null) {
                        const selectedItem = ConstructionSystem.getSelectedItem();
                        this.showPreview(gridX, gridY, edge, selectedItem);
                    }
                }
            });
        }

        // UI methods removed - handled by InteriorUIScene

        updateConstructionUI() {
            // Forward to UI scene if running
            const uiScene = this.scene.get('InteriorUIScene');
            if (uiScene && uiScene.updateConstructionUI) {
                uiScene.updateConstructionUI();
            }
        }

        renderGridOverlay() {
            this.clearGridOverlay();

            const BuildingSystem = SimChurch.Phaser.BuildingSystem;
            const dimensions = BuildingSystem.getDimensions();

            const gridGraphics = this.add.graphics();
            gridGraphics.lineStyle(1, 0xFFFFFF, 0.15);

            for (let y = 0; y < dimensions.height; y++) {
                for (let x = 0; x < dimensions.width; x++) {
                    if (BuildingSystem.isFloor(x, y)) {
                        const iso = this.gridToIso(x, y);
                        // Draw diamond outline
                        gridGraphics.beginPath();
                        gridGraphics.moveTo(iso.x, iso.y - TILE_HEIGHT / 2);
                        gridGraphics.lineTo(iso.x + TILE_WIDTH / 2, iso.y);
                        gridGraphics.lineTo(iso.x, iso.y + TILE_HEIGHT / 2);
                        gridGraphics.lineTo(iso.x - TILE_WIDTH / 2, iso.y);
                        gridGraphics.closePath();
                        gridGraphics.strokePath();
                    }
                }
            }

            gridGraphics.setDepth(100);
            this.gridOverlayLayer.add(gridGraphics);
        }

        clearGridOverlay() {
            if (this.gridOverlayLayer) {
                this.gridOverlayLayer.removeAll(true);
            }
        }

        clearPreview() {
            if (this.previewLayer) {
                this.previewLayer.removeAll(true);
            }
        }

        handleConstructionHover(pointer) {
            const ConstructionSystem = SimChurch.Phaser.ConstructionSystem;
            if (!ConstructionSystem || !ConstructionSystem.isActive()) {
                return;
            }

            const selectedItem = ConstructionSystem.getSelectedItem();
            if (!selectedItem) {
                this.clearPreview();
                return;
            }

            // Convert pointer to world coordinates
            const worldX = this.cameras.main.getWorldPoint(pointer.x, pointer.y).x;
            const worldY = this.cameras.main.getWorldPoint(pointer.x, pointer.y).y;
            const grid = this.isoToGrid(worldX, worldY);

            const BuildingSystem = SimChurch.Phaser.BuildingSystem;
            if (!BuildingSystem.isFloor(grid.x, grid.y)) {
                this.clearPreview();
                return;
            }

            // Determine which edge for doors/windows/walls
            let edge = null;
            const iso = this.gridToIso(grid.x, grid.y);
            const dx = worldX - iso.x;
            const dy = worldY - iso.y;

            if (selectedItem === ConstructionSystem.ITEM_TYPES.DOOR_FRAME ||
                selectedItem === ConstructionSystem.ITEM_TYPES.WINDOW_FRAME ||
                selectedItem === ConstructionSystem.ITEM_TYPES.WALL_STRAIGHT_NS ||
                selectedItem === ConstructionSystem.ITEM_TYPES.WALL_STRAIGHT_EW ||
                selectedItem === ConstructionSystem.ITEM_TYPES.WALL_SMART || // Add Smart Wall check
                selectedItem === 'demolish') {

                // CORRECTED LOGIC: Check quadrants relative to center
                // Top-Right: x>0, y<0 -> N edge
                // Bottom-Right: x>0, y>0 -> E edge
                // Bottom-Left: x<0, y>0 -> S edge
                // Top-Left: x<0, y<0 -> W edge

                if (dx > 0) {
                    edge = dy < 0 ? 'N' : 'E';
                } else {
                    edge = dy < 0 ? 'W' : 'S';
                }
            } else if (selectedItem && selectedItem.startsWith('furniture-')) {
                edge = null;
            }

            // State change check to prevent console spam
            if (this.lastLogState.gridX !== grid.x ||
                this.lastLogState.gridY !== grid.y ||
                this.lastLogState.edge !== edge) {

                // console.log(`[InteriorScene] Hover update: Grid(${grid.x}, ${grid.y}) Edge: ${edge} Item: ${selectedItem}`);

                this.lastLogState = { gridX: grid.x, gridY: grid.y, edge: edge };
            }

            ConstructionSystem.setPreview(grid.x, grid.y, edge);

            // Determine actual item type for Smart Wall
            let actualItem = selectedItem;
            if (selectedItem === ConstructionSystem.ITEM_TYPES.WALL_SMART && edge) {
                if (edge === 'N' || edge === 'S') {
                    actualItem = ConstructionSystem.ITEM_TYPES.WALL_STRAIGHT_EW;
                } else {
                    actualItem = ConstructionSystem.ITEM_TYPES.WALL_STRAIGHT_NS;
                }
            }

            // Show preview with actual item
            this.showPreview(grid.x, grid.y, edge, actualItem);
        }

        showPreview(gridX, gridY, edge, itemType) {
            this.clearPreview();

            const ConstructionSystem = SimChurch.Phaser.ConstructionSystem;
            const validation = ConstructionSystem.validatePlacement(itemType, gridX, gridY, edge);
            const canAfford = ConstructionSystem.canAfford(itemType);
            const isValid = validation.valid && canAfford;

            // Only log detailed validation on change
            if (this.lastLogState.gridX === gridX &&
                this.lastLogState.gridY === gridY &&
                this.lastLogState.edge === edge) {
                // Throttle validation logging (maybe once per hover change)
            } else {
                console.log(`[InteriorScene] Validation: Valid=${isValid} Reason=${validation.reason} Cost=${ConstructionSystem.getCost(itemType)}`);
            }

            const BuildingSystem = SimChurch.Phaser.BuildingSystem;
            const iso = this.gridToIso(gridX, gridY);

            const previewGraphics = this.add.graphics();
            previewGraphics.lineStyle(2, isValid ? 0x88FF88 : 0xFF8888, 0.8);
            previewGraphics.fillStyle(isValid ? 0x88FF88 : 0xFF8888, 0.3);

            if (itemType === 'demolish') {
                // Show X on the edge being hovered
                if (edge) {
                    const edges = BuildingSystem.getEdges(gridX, gridY);
                    const edgeFlag = BuildingSystem.EDGE[edge];

                    // Coordinates for the edge
                    let x1, y1, x2, y2;
                    if (edge === 'N') { x1 = iso.x; y1 = iso.y - TILE_HEIGHT / 2; x2 = iso.x + TILE_WIDTH / 2; y2 = iso.y; }
                    else if (edge === 'E') { x1 = iso.x + TILE_WIDTH / 2; y1 = iso.y; x2 = iso.x; y2 = iso.y + TILE_HEIGHT / 2; }
                    else if (edge === 'S') { x1 = iso.x; y1 = iso.y + TILE_HEIGHT / 2; x2 = iso.x - TILE_WIDTH / 2; y2 = iso.y; }
                    else if (edge === 'W') { x1 = iso.x - TILE_WIDTH / 2; y1 = iso.y; x2 = iso.x; y2 = iso.y - TILE_HEIGHT / 2; }

                    if (x1 !== undefined) {
                        previewGraphics.lineStyle(3, 0xFF0000, 0.8);
                        previewGraphics.beginPath();
                        previewGraphics.moveTo(x1, y1);
                        previewGraphics.lineTo(x2, y2);
                        previewGraphics.strokePath();

                        // X mark in center of edge
                        const cx = (x1 + x2) / 2;
                        const cy = (y1 + y2) / 2;
                        previewGraphics.lineBetween(cx - 5, cy - 5, cx + 5, cy + 5);
                        previewGraphics.lineBetween(cx + 5, cy - 5, cx - 5, cy + 5);
                    }
                } else {
                    // Fallback X on tile center
                    previewGraphics.beginPath();
                    previewGraphics.moveTo(iso.x - 10, iso.y - 10);
                    previewGraphics.lineTo(iso.x + 10, iso.y + 10);
                    previewGraphics.moveTo(iso.x + 10, iso.y - 10);
                    previewGraphics.lineTo(iso.x - 10, iso.y + 10);
                    previewGraphics.strokePath();
                }
            } else if (edge && (itemType === ConstructionSystem.ITEM_TYPES.DOOR_FRAME ||
                itemType === ConstructionSystem.ITEM_TYPES.WINDOW_FRAME)) {
                // Preview door/window on edge
                const edges = BuildingSystem.getEdges(gridX, gridY);
                const edgeFlag = BuildingSystem.EDGE[edge];
                if (edges & edgeFlag) {
                    // Draw preview on the edge
                    const x1 = edge === 'W' ? iso.x - TILE_WIDTH / 2 :
                        edge === 'E' ? iso.x + TILE_WIDTH / 2 : iso.x;
                    const y1 = edge === 'N' ? iso.y - TILE_HEIGHT / 2 :
                        edge === 'S' ? iso.y + TILE_HEIGHT / 2 : iso.y;
                    const x2 = edge === 'N' ? iso.x + TILE_WIDTH / 2 :
                        edge === 'S' ? iso.x - TILE_WIDTH / 2 :
                            iso.x; // For both E and W, the wall ends at the center X (iso.x)
                    const y2 = edge === 'N' ? iso.y :
                        edge === 'S' ? iso.y :
                            edge === 'E' ? iso.y + TILE_HEIGHT / 2 : iso.y - TILE_HEIGHT / 2;

                    previewGraphics.beginPath();
                    previewGraphics.moveTo(x1, y1);
                    previewGraphics.lineTo(x2, y2);
                    previewGraphics.lineTo(x2, y2 - BuildingSystem.WALL_HEIGHT);
                    previewGraphics.lineTo(x1, y1 - BuildingSystem.WALL_HEIGHT);
                    previewGraphics.closePath();
                    previewGraphics.fillPath();
                    previewGraphics.strokePath();
                }
            } else if (itemType.startsWith('wall-') && edge) {
                // Preview wall on edge
                // Calculate edge coordinates
                let x1, y1, x2, y2;
                if (edge === 'N') {
                    x1 = iso.x;
                    y1 = iso.y - TILE_HEIGHT / 2;
                    x2 = iso.x + TILE_WIDTH / 2;
                    y2 = iso.y;
                } else if (edge === 'S') {
                    x1 = iso.x;
                    y1 = iso.y + TILE_HEIGHT / 2;
                    x2 = iso.x - TILE_WIDTH / 2;
                    y2 = iso.y;
                } else if (edge === 'E') {
                    x1 = iso.x + TILE_WIDTH / 2;
                    y1 = iso.y;
                    x2 = iso.x;
                    y2 = iso.y + TILE_HEIGHT / 2;
                } else if (edge === 'W') {
                    x1 = iso.x - TILE_WIDTH / 2;
                    y1 = iso.y;
                    x2 = iso.x;
                    y2 = iso.y - TILE_HEIGHT / 2;
                }

                if (x1 !== undefined) {
                    previewGraphics.beginPath();
                    previewGraphics.moveTo(x1, y1);
                    previewGraphics.lineTo(x2, y2);
                    previewGraphics.lineTo(x2, y2 - BuildingSystem.WALL_HEIGHT);
                    previewGraphics.lineTo(x1, y1 - BuildingSystem.WALL_HEIGHT);
                    previewGraphics.closePath();
                    previewGraphics.fillPath();
                    previewGraphics.strokePath();
                }
            } else if (itemType.startsWith('furniture-')) {
                // Preview furniture on center of tile
                previewGraphics.fillStyle(isValid ? 0x88FF88 : 0xFF8888, 0.5);

                // Determine dimensions based on item type and rotation
                let w = 30;
                let h = 30;
                const rotation = ConstructionSystem.getRotation();

                if (itemType === ConstructionSystem.ITEM_TYPES.PEW) {
                    w = 40; h = 20;
                    if (rotation === 1 || rotation === 3) { w = 20; h = 40; }
                } else if (itemType === ConstructionSystem.ITEM_TYPES.PIANO) {
                    w = 40; h = 30;
                    if (rotation === 1 || rotation === 3) { w = 30; h = 40; }
                } else if (itemType === ConstructionSystem.ITEM_TYPES.PULPIT) {
                    w = 20; h = 20;
                } else if (itemType === ConstructionSystem.ITEM_TYPES.PLANT) {
                    w = 20; h = 20;
                }

                // Draw rotated rectangle on the tile (isometric projection approximately)
                // For true iso, we'd need to project the corners, but simple box is okay for preview
                previewGraphics.beginPath();
                previewGraphics.moveTo(iso.x - w / 2, iso.y - h / 2);
                previewGraphics.lineTo(iso.x + w / 2, iso.y - h / 2);
                previewGraphics.lineTo(iso.x + w / 2, iso.y + h / 2);
                previewGraphics.lineTo(iso.x - w / 2, iso.y + h / 2);
                previewGraphics.closePath();
                previewGraphics.fillPath();

                // Draw outline
                previewGraphics.lineStyle(2, isValid ? 0x88FF88 : 0xFF8888, 0.8);
                previewGraphics.strokePath();

                // Draw direction arrow (simple line)
                previewGraphics.beginPath();
                previewGraphics.moveTo(iso.x, iso.y);
                let dx = 0, dy = 0;
                if (rotation === 0) dx = w / 2;
                else if (rotation === 1) dy = h / 2;
                else if (rotation === 2) dx = -w / 2;
                else if (rotation === 3) dy = -h / 2;
                previewGraphics.lineTo(iso.x + dx, iso.y + dy);
                previewGraphics.strokePath();
            }

            previewGraphics.setDepth(200);
            this.previewLayer.add(previewGraphics);
        }

        handleConstructionClick(pointer) {
            const ConstructionSystem = SimChurch.Phaser.ConstructionSystem;
            if (!ConstructionSystem || !ConstructionSystem.isActive()) {
                return;
            }

            const selectedItem = ConstructionSystem.getSelectedItem();
            if (!selectedItem) {
                return;
            }

            // Convert pointer to world coordinates
            const worldX = this.cameras.main.getWorldPoint(pointer.x, pointer.y).x;
            const worldY = this.cameras.main.getWorldPoint(pointer.x, pointer.y).y;
            const grid = this.isoToGrid(worldX, worldY);

            const BuildingSystem = SimChurch.Phaser.BuildingSystem;
            if (!BuildingSystem.isFloor(grid.x, grid.y)) {
                return;
            }

            // Determine which edge
            const iso = this.gridToIso(grid.x, grid.y);
            const dx = worldX - iso.x;
            const dy = worldY - iso.y;
            let edge = null;

            // CORRECTED LOGIC: Check quadrants relative to center
            if (dx > 0) {
                edge = dy < 0 ? 'N' : 'E';
            } else {
                edge = dy < 0 ? 'W' : 'S';
            }

            if (selectedItem === 'demolish') {
                console.log(`[InteriorScene] Demolish click at grid (${grid.x}, ${grid.y}), edge: ${edge}`);
                const result = ConstructionSystem.demolishItem(grid.x, grid.y, edge);
                console.log(`[InteriorScene] Demolish result:`, result);
                if (result.success) {
                    console.log(`[ConstructionSystem] Demolished, refund: $${result.refund}`);
                    // Re-render walls and furniture
                    this.wallLayer.removeAll(true);
                    this.furnitureLayer.removeAll(true);
                    this.renderWalls();
                    this.renderFurniture();
                } else {
                    console.warn(`[ConstructionSystem] Cannot demolish: ${result.reason}`);
                }
            } else {
                // Determine actual item type for Smart Wall
                let actualItem = selectedItem;
                if (selectedItem === ConstructionSystem.ITEM_TYPES.WALL_SMART && edge) {
                    if (edge === 'N' || edge === 'S') {
                        actualItem = ConstructionSystem.ITEM_TYPES.WALL_STRAIGHT_EW;
                    } else {
                        actualItem = ConstructionSystem.ITEM_TYPES.WALL_STRAIGHT_NS;
                    }
                }

                // Determine edge for doors/windows/walls (not needed for furniture)
                if (actualItem.startsWith('furniture-')) {
                    edge = null;
                }

                console.log(`[ConstructionSystem] Attempting to place ${actualItem} at (${grid.x}, ${grid.y}), edge: ${edge}`);
                const result = ConstructionSystem.placeItem(actualItem, grid.x, grid.y, edge);
                if (result.success) {
                    console.log(`[ConstructionSystem] Successfully placed ${actualItem}, cost: $${result.cost}`);
                    // Re-render walls and furniture
                    this.wallLayer.removeAll(true);
                    this.furnitureLayer.removeAll(true);
                    this.renderWalls();
                    this.renderFurniture();
                    // Update UI
                    if (window.SimChurch?.UI) {
                        window.SimChurch.UI.renderUI();
                    }
                } else {
                    console.warn(`[ConstructionSystem] Cannot place: ${result.reason}`);
                }
            }
        }

        update(time, delta) {
            const panSpeed = 5;

            if (this.cursors.left.isDown || this.wasd.left.isDown) {
                this.cameras.main.scrollX -= panSpeed;
            }
            if (this.cursors.right.isDown || this.wasd.right.isDown) {
                this.cameras.main.scrollX += panSpeed;
            }
            if (this.cursors.up.isDown || this.wasd.up.isDown) {
                this.cameras.main.scrollY -= panSpeed;
            }
            if (this.cursors.down.isDown || this.wasd.down.isDown) {
                this.cameras.main.scrollY += panSpeed;
            }

            if (this.zoomText) {
                this.zoomText.setText(`Zoom: ${Math.round(this.cameras.main.zoom * 100)}%`);
            }

            const TimeSystem = SimChurch.Phaser.TimeSystem;
            if (TimeSystem && this.dayText) {
                this.dayText.setText(TimeSystem.getDayName());
                this.timeText.setText(TimeSystem.getTimeString());
                const isPaused = TimeSystem.isPaused();
                this.speedText.setText(isPaused ? '⏸ Paused' : `▶ ${TimeSystem.getSpeedName()}`);
                this.speedText.setColor(isPaused ? '#FFAA00' : '#88FF88');
            }

            if (TimeSystem && !TimeSystem.isPaused()) {
                TimeSystem.update(delta);
            }
        }
    }

    SimChurch.Phaser.InteriorScene = InteriorScene;

})();
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
            this.renderWalls();

            // UI and controls
            this.createUIOverlay();
            this.setupCameraControls();
            this.createTimeDisplay();

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
        }

        createUIOverlay() {
            // Exit button
            const exitBtn = this.add.graphics();
            exitBtn.fillStyle(0x722F37, 1);
            exitBtn.fillRoundedRect(0, 0, 100, 36, 8);
            exitBtn.setScrollFactor(0);
            exitBtn.setDepth(9999);
            exitBtn.setPosition(690, 10);

            const exitText = this.add.text(740, 28, '← Exit', {
                font: 'bold 14px Arial',
                fill: '#FFFFFF'
            }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(10000);

            const exitHit = this.add.rectangle(740, 28, 100, 36, 0xffffff, 0)
                .setScrollFactor(0).setDepth(10001).setInteractive({ useHandCursor: true });

            exitHit.on('pointerover', () => {
                exitBtn.clear().fillStyle(0x8B3A44, 1).fillRoundedRect(0, 0, 100, 36, 8).setPosition(690, 10);
            });
            exitHit.on('pointerout', () => {
                exitBtn.clear().fillStyle(0x722F37, 1).fillRoundedRect(0, 0, 100, 36, 8).setPosition(690, 10);
            });
            exitHit.on('pointerdown', () => {
                this.cameras.main.fadeOut(500, 0, 0, 0);
            });

            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.start('ExteriorScene');
            });

            // Build mode button
            this.buildBtn = this.add.graphics();
            this.buildBtn.fillStyle(0x2F5233, 1);
            this.buildBtn.fillRoundedRect(0, 0, 120, 36, 8);
            this.buildBtn.setScrollFactor(0);
            this.buildBtn.setDepth(9999);
            this.buildBtn.setPosition(10, 10);

            this.buildBtnText = this.add.text(70, 28, '🔨 Build', {
                font: 'bold 14px Arial',
                fill: '#FFFFFF'
            }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(10000);

            this.buildBtnHit = this.add.rectangle(70, 28, 120, 36, 0xffffff, 0)
                .setScrollFactor(0).setDepth(10001).setInteractive({ useHandCursor: true });

            this.buildBtnHit.on('pointerdown', () => {
                const ConstructionSystem = SimChurch.Phaser.ConstructionSystem;
                if (ConstructionSystem) {
                    const isActive = ConstructionSystem.toggleMode();
                    this.updateBuildButton(isActive);
                    this.updateConstructionUI();
                }
            });

            // Construction mode indicator
            this.constructionModeIndicator = this.add.text(10, 50, '', {
                font: 'bold 12px Arial',
                fill: '#FFD700',
                backgroundColor: '#00000080',
                padding: { x: 8, y: 4 }
            }).setScrollFactor(0).setDepth(9999).setVisible(false);

            // Construction item selection panel (hidden by default)
            this.createConstructionPanel();

            // Zoom indicator
            this.zoomText = this.add.text(400, 480, 'Zoom: 100%', {
                font: '12px Arial',
                fill: '#FFFFFF',
                backgroundColor: '#00000080',
                padding: { x: 8, y: 4 }
            }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(9999);
        }

        createTimeDisplay() {
            const TimeSystem = SimChurch.Phaser.TimeSystem;
            if (!TimeSystem) return;

            const panel = this.add.graphics();
            panel.fillStyle(0x000000, 0.6);
            panel.fillRoundedRect(0, 0, 170, 46, 8);
            panel.setScrollFactor(0);
            panel.setDepth(9998);
            panel.setPosition(315, 10);

            this.dayText = this.add.text(325, 20, TimeSystem.getDayName(), {
                font: 'bold 13px Arial',
                fill: '#D4AF37'
            }).setScrollFactor(0).setDepth(9999);

            this.timeText = this.add.text(325, 38, TimeSystem.getTimeString(), {
                font: '11px Arial',
                fill: '#FFFFFF'
            }).setScrollFactor(0).setDepth(9999);

            this.speedText = this.add.text(420, 33, '▶ Normal', {
                font: '10px Arial',
                fill: '#88FF88'
            }).setScrollFactor(0).setDepth(9999);
        }

        updateBuildButton(isActive) {
            if (isActive) {
                this.buildBtn.clear().fillStyle(0x4A7C59, 1).fillRoundedRect(0, 0, 120, 36, 8).setPosition(10, 10);
                this.buildBtnText.setText('🔨 Building');
            } else {
                this.buildBtn.clear().fillStyle(0x2F5233, 1).fillRoundedRect(0, 0, 120, 36, 8).setPosition(10, 10);
                this.buildBtnText.setText('🔨 Build');
            }
        }

        createConstructionPanel() {
            const ConstructionSystem = SimChurch.Phaser.ConstructionSystem;
            if (!ConstructionSystem) return;

            // Panel background
            this.constructionPanel = this.add.graphics();
            this.constructionPanel.fillStyle(0x1a1a1a, 0.95);
            this.constructionPanel.fillRoundedRect(0, 0, 200, 400, 8);
            this.constructionPanel.setScrollFactor(0);
            this.constructionPanel.setDepth(9997);
            this.constructionPanel.setPosition(10, 90);
            this.constructionPanel.setVisible(false);

            // Panel title
            this.constructionTitle = this.add.text(110, 110, 'Construction', {
                font: 'bold 16px Arial',
                fill: '#D4AF37'
            }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(9998).setVisible(false);

            // Item buttons
            const items = [
                // Consolidated Smart Wall Button
                { type: ConstructionSystem.ITEM_TYPES.WALL_SMART, label: 'Wall', cost: 50 },
                { type: ConstructionSystem.ITEM_TYPES.DOOR_FRAME, label: 'Door', cost: 100 },
                { type: ConstructionSystem.ITEM_TYPES.WINDOW_FRAME, label: 'Window', cost: 150 }
            ];

            this.constructionButtons = [];
            items.forEach((item, index) => {
                const y = 140 + index * 50;

                const btn = this.add.graphics();
                btn.fillStyle(0x3a3a3a, 1);
                btn.fillRoundedRect(0, 0, 180, 40, 6);
                btn.setScrollFactor(0);
                btn.setDepth(9998);
                btn.setPosition(20, y);
                btn.y = y; // Store y position
                btn.setVisible(false);

                const btnText = this.add.text(110, y + 20, `${item.label}\n$${item.cost}`, {
                    font: '12px Arial',
                    fill: '#FFFFFF',
                    align: 'center'
                }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(9999).setVisible(false);

                const btnHit = this.add.rectangle(110, y + 20, 180, 40, 0xffffff, 0)
                    .setScrollFactor(0).setDepth(10000).setInteractive({ useHandCursor: true }).setVisible(false);

                btnHit.on('pointerdown', () => {
                    ConstructionSystem.selectItem(item.type);
                    this.updateConstructionUI();
                });

                btnHit.on('pointerover', () => {
                    btn.clear().fillStyle(0x4a4a4a, 1).fillRoundedRect(0, 0, 180, 40, 6).setPosition(20, y);
                });

                btnHit.on('pointerout', () => {
                    const selected = ConstructionSystem.getSelectedItem();
                    const btnY = btn.y || y;
                    if (selected === item.type) {
                        btn.clear().fillStyle(0x5a7a5a, 1).fillRoundedRect(0, 0, 180, 40, 6).setPosition(20, btnY);
                    } else {
                        btn.clear().fillStyle(0x3a3a3a, 1).fillRoundedRect(0, 0, 180, 40, 6).setPosition(20, btnY);
                    }
                });

                this.constructionButtons.push({ btn, btnText, btnHit, item, y });
            });

            // Demolish button
            const demolishBtn = this.add.graphics();
            demolishBtn.fillStyle(0x7a3a3a, 1);
            demolishBtn.fillRoundedRect(0, 0, 180, 40, 6);
            demolishBtn.setScrollFactor(0);
            demolishBtn.setDepth(9998);
            demolishBtn.setPosition(20, 350);
            demolishBtn.setVisible(false);

            const demolishText = this.add.text(110, 370, '🗑️ Demolish', {
                font: 'bold 12px Arial',
                fill: '#FFFFFF'
            }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(9999).setVisible(false);

            const demolishHit = this.add.rectangle(110, 370, 180, 40, 0xffffff, 0)
                .setScrollFactor(0).setDepth(10000).setInteractive({ useHandCursor: true }).setVisible(false);

            demolishHit.on('pointerdown', () => {
                ConstructionSystem.selectItem('demolish');
                this.updateConstructionUI();
            });

            this.demolishButton = { btn: demolishBtn, text: demolishText, hit: demolishHit };
        }

        updateConstructionUI() {
            const ConstructionSystem = SimChurch.Phaser.ConstructionSystem;
            if (!ConstructionSystem) return;

            const isActive = ConstructionSystem.isActive();
            const selectedItem = ConstructionSystem.getSelectedItem();

            // Show/hide panel
            this.constructionPanel.setVisible(isActive);
            this.constructionTitle.setVisible(isActive);
            this.constructionModeIndicator.setVisible(isActive);
            this.constructionButtons.forEach(({ btn, btnText, btnHit, item, y }) => {
                btn.setVisible(isActive);
                btnText.setVisible(isActive);
                btnHit.setVisible(isActive);

                // Highlight selected
                const btnY = btn.y || y;
                if (isActive && selectedItem === item.type) {
                    btn.clear().fillStyle(0x5a7a5a, 1).fillRoundedRect(0, 0, 180, 40, 6).setPosition(20, btnY);
                } else if (isActive) {
                    btn.clear().fillStyle(0x3a3a3a, 1).fillRoundedRect(0, 0, 180, 40, 6).setPosition(20, btnY);
                }
            });

            if (this.demolishButton) {
                this.demolishButton.btn.setVisible(isActive);
                this.demolishButton.text.setVisible(isActive);
                this.demolishButton.hit.setVisible(isActive);

                if (isActive && selectedItem === 'demolish') {
                    this.demolishButton.btn.clear().fillStyle(0x9a5a5a, 1).fillRoundedRect(0, 0, 180, 40, 6).setPosition(20, 350);
                } else if (isActive) {
                    this.demolishButton.btn.clear().fillStyle(0x7a3a3a, 1).fillRoundedRect(0, 0, 180, 40, 6).setPosition(20, 350);
                }
            }

            // Update indicator
            if (isActive) {
                if (selectedItem) {
                    const cost = ConstructionSystem.getCost(selectedItem);
                    const canAfford = ConstructionSystem.canAfford(selectedItem);
                    this.constructionModeIndicator.setText(
                        `Construction Mode\nSelected: ${selectedItem}\nCost: $${cost} ${canAfford ? '✓' : '✗'}`
                    );
                    this.constructionModeIndicator.setColor(canAfford ? '#88FF88' : '#FF8888');
                } else {
                    this.constructionModeIndicator.setText('Construction Mode\nSelect an item');
                    this.constructionModeIndicator.setColor('#FFD700');
                }
            }

            // Render grid overlay
            if (isActive) {
                this.renderGridOverlay();
            } else {
                this.clearGridOverlay();
                this.clearPreview();
            }
        }

        renderGridOverlay() {
            this.clearGridOverlay();

            const BuildingSystem = SimChurch.Phaser.BuildingSystem;
            const dimensions = BuildingSystem.getDimensions();

            const gridGraphics = this.add.graphics();
            gridGraphics.lineStyle(1, 0xFFFFFF, 0.3);

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
                    // Re-render walls
                    this.wallLayer.removeAll(true);
                    this.renderWalls();
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

                // Determine edge for doors/windows/walls
                console.log(`[ConstructionSystem] Attempting to place ${actualItem} at (${grid.x}, ${grid.y}), edge: ${edge}`);
                const result = ConstructionSystem.placeItem(actualItem, grid.x, grid.y, edge);
                if (result.success) {
                    console.log(`[ConstructionSystem] Successfully placed ${actualItem}, cost: $${result.cost}`);
                    // Re-render walls
                    this.wallLayer.removeAll(true);
                    this.renderWalls();
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
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

            // Layer containers
            this.grassLayer = null;
            this.floorLayer = null;
            this.wallLayer = null;
            this.furnitureLayer = null;
            this.peopleLayer = null;
        }

        create() {
            console.log('[InteriorScene] Creating interior view');

            // Initialize building system
            const BuildingSystem = SimChurch.Phaser.BuildingSystem;
            BuildingSystem.init();

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
            const FEATURE = BuildingSystem.FEATURE;
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
                                edge: 'N', feature: features.N, depth: x + y
                            });
                        }
                        if (edges & EDGE.SOUTH) {
                            wallSegments.push({
                                x: iso.x, y: iso.y, gridX: x, gridY: y,
                                edge: 'S', feature: features.S, depth: x + y + 1
                            });
                        }
                        if (edges & EDGE.EAST) {
                            wallSegments.push({
                                x: iso.x, y: iso.y, gridX: x, gridY: y,
                                edge: 'E', feature: features.E, depth: x + y + 0.5
                            });
                        }
                        if (edges & EDGE.WEST) {
                            wallSegments.push({
                                x: iso.x, y: iso.y, gridX: x, gridY: y,
                                edge: 'W', feature: features.W, depth: x + y
                            });
                        }
                    }
                }
            }

            // Sort by depth (back to front)
            wallSegments.sort((a, b) => a.depth - b.depth);

            // Render each wall segment
            wallSegments.forEach(seg => {
                this.drawWallEdge(seg.x, seg.y, seg.edge, seg.feature, wallHeight, seg.depth);
            });
        }

        /**
         * Draw a wall on a specific edge of a floor tile
         * Simple thin walls - just a parallelogram face along the edge
         */
        /**
         * Draw a wall on a specific edge of a floor tile
         * Corrected for proper isometric alignment
         */
        drawWallEdge(x, y, edge, feature, height, depth) {
            const FEATURE = SimChurch.Phaser.BuildingSystem.FEATURE;
            const wall = this.add.graphics();

            // Brick colors
            const brickLight = 0xC17F59;
            const brickDark = 0xA66B4A;
            const mortarColor = 0x8B6B4A;

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

            if (edge === 'N') {
                // North Edge: Connects North Corner -> East Corner
                x1 = xN;
                y1 = yN;
                x2 = xE;
                y2 = yE;
            } else if (edge === 'W') {
                // West Edge: Connects West Corner -> North Corner
                x1 = xW;
                y1 = yW;
                x2 = xN;
                y2 = yN;
            } else if (edge === 'S') {
                // South Edge: Connects South Corner -> West Corner
                x1 = xS;
                y1 = yS;
                x2 = xW;
                y2 = yW;
            } else if (edge === 'E') {
                // East Edge: Connects East Corner -> South Corner
                x1 = xE;
                y1 = yE;
                x2 = xS;
                y2 = yS;
            }

            // Draw the wall face
            if (x1 !== undefined) {
                // Determine face color based on lighting (Left/West facing walls are usually lighter or darker)
                // W and S walls face "Left/Front", N and E walls face "Right/Back"
                // Simple lighting: N/E darker, S/W lighter (or vice versa depending on light source)
                const color = (edge === 'N' || edge === 'E') ? brickDark : brickLight;

                wall.fillStyle(color, 1);
                wall.beginPath();
                wall.moveTo(x1, y1);
                wall.lineTo(x2, y2);
                wall.lineTo(x2, y2 - height);
                wall.lineTo(x1, y1 - height);
                wall.closePath();
                wall.fillPath();

                this.addBrickLines(wall, x1, y1, x2, y2, height, mortarColor);

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
                    this.isDragging = true;
                    this.dragStartX = pointer.x;
                    this.dragStartY = pointer.y;
                    this.cameraStartX = this.cameras.main.scrollX;
                    this.cameraStartY = this.cameras.main.scrollY;
                }
            });

            this.input.on('pointermove', (pointer) => {
                if (this.isDragging) {
                    this.cameras.main.scrollX = this.cameraStartX - (pointer.x - this.dragStartX);
                    this.cameras.main.scrollY = this.cameraStartY - (pointer.y - this.dragStartY);
                }
            });

            this.input.on('pointerup', () => {
                this.isDragging = false;
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
            const buildBtn = this.add.graphics();
            buildBtn.fillStyle(0x2F5233, 1);
            buildBtn.fillRoundedRect(0, 0, 120, 36, 8);
            buildBtn.setScrollFactor(0);
            buildBtn.setDepth(9999);
            buildBtn.setPosition(10, 10);

            this.add.text(70, 28, '🔨 Build', {
                font: 'bold 14px Arial',
                fill: '#FFFFFF'
            }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(10000);

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


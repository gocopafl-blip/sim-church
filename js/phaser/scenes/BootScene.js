/**
 * BootScene - Asset Preloading
 * Loads all game assets before starting
 */

(function() {
    'use strict';

    window.SimChurch = window.SimChurch || {};
    window.SimChurch.Phaser = window.SimChurch.Phaser || {};

    class BootScene extends Phaser.Scene {
        constructor() {
            super({ key: 'BootScene' });
        }

        preload() {
            console.log('[BootScene] Preloading assets...');

            // Show loading progress
            const width = this.cameras.main.width;
            const height = this.cameras.main.height;

            // Loading bar background
            const progressBar = this.add.graphics();
            const progressBox = this.add.graphics();
            progressBox.fillStyle(0x222222, 0.8);
            progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50);

            // Loading text
            const loadingText = this.add.text(width / 2, height / 2 - 50, 'Loading...', {
                font: '20px Arial',
                fill: '#ffffff'
            }).setOrigin(0.5, 0.5);

            // Progress events
            this.load.on('progress', (value) => {
                progressBar.clear();
                progressBar.fillStyle(0xD4AF37, 1); // Gold color
                progressBar.fillRect(width / 2 - 150, height / 2 - 15, 300 * value, 30);
            });

            this.load.on('complete', () => {
                progressBar.destroy();
                progressBox.destroy();
                loadingText.destroy();
            });

            // === LOAD ASSETS ===
            // Load actual sprite assets using the config
            if (SimChurch.Phaser.Assets) {
                const assets = SimChurch.Phaser.Assets;
                const basePath = assets.basePath;

                // Load Furniture
                if (assets.furniture) {
                    Object.entries(assets.furniture).forEach(([key, config]) => {
                        // Load each variant
                        config.variants.forEach(variant => {
                            const path = `${basePath}${config.base}${variant}${config.extension}`;
                            const textureKey = `${key}${variant}`;
                            this.load.image(textureKey, path);
                            console.log(`[BootScene] Queued asset: ${textureKey} -> ${path}`);
                        });
                    });
                }
            } else {
                console.warn('[BootScene] Asset config not found, skipping asset load');
            }

            // === LOAD PLACEHOLDER ASSETS ===
            // We'll create these programmatically for now
            // Later these will be replaced with actual isometric sprites
            
            // Create placeholder graphics as textures
            this.createPlaceholderTextures();
        }

        /**
         * Create placeholder textures for development
         * These will be replaced with actual isometric sprites later
         */
        createPlaceholderTextures() {
            // === ISOMETRIC FLOOR TILE (64x32 diamond) ===
            const floorGraphics = this.make.graphics({ x: 0, y: 0, add: false });
            floorGraphics.fillStyle(0x8B7355, 1); // Wood brown
            floorGraphics.beginPath();
            floorGraphics.moveTo(32, 0);      // Top
            floorGraphics.lineTo(64, 16);     // Right
            floorGraphics.lineTo(32, 32);     // Bottom
            floorGraphics.lineTo(0, 16);      // Left
            floorGraphics.closePath();
            floorGraphics.fillPath();
            floorGraphics.lineStyle(1, 0x6B5344, 1);
            floorGraphics.strokePath();
            floorGraphics.generateTexture('floor-tile', 64, 32);

            // === ISOMETRIC WALL (64x64 with height) ===
            const wallGraphics = this.make.graphics({ x: 0, y: 0, add: false });
            // Wall face (front)
            wallGraphics.fillStyle(0xD2B48C, 1); // Tan/beige
            wallGraphics.beginPath();
            wallGraphics.moveTo(0, 16);       // Top-left
            wallGraphics.lineTo(32, 32);      // Top-right
            wallGraphics.lineTo(32, 80);      // Bottom-right
            wallGraphics.lineTo(0, 64);       // Bottom-left
            wallGraphics.closePath();
            wallGraphics.fillPath();
            // Wall face (side)
            wallGraphics.fillStyle(0xC4A67C, 1); // Slightly darker
            wallGraphics.beginPath();
            wallGraphics.moveTo(32, 32);      // Top-left
            wallGraphics.lineTo(64, 16);      // Top-right
            wallGraphics.lineTo(64, 64);      // Bottom-right
            wallGraphics.lineTo(32, 80);      // Bottom-left
            wallGraphics.closePath();
            wallGraphics.fillPath();
            // Wall top
            wallGraphics.fillStyle(0xE8DCC8, 1); // Lighter
            wallGraphics.beginPath();
            wallGraphics.moveTo(32, 0);       // Top
            wallGraphics.lineTo(64, 16);      // Right
            wallGraphics.lineTo(32, 32);      // Bottom
            wallGraphics.lineTo(0, 16);       // Left
            wallGraphics.closePath();
            wallGraphics.fillPath();
            wallGraphics.generateTexture('wall-block', 64, 80);

            // === EXTERIOR WALL SEGMENT ===
            const extWallGraphics = this.make.graphics({ x: 0, y: 0, add: false });
            // Brick-like exterior wall
            extWallGraphics.fillStyle(0x8B4513, 1); // Saddle brown (brick)
            extWallGraphics.beginPath();
            extWallGraphics.moveTo(0, 16);
            extWallGraphics.lineTo(32, 32);
            extWallGraphics.lineTo(32, 96);
            extWallGraphics.lineTo(0, 80);
            extWallGraphics.closePath();
            extWallGraphics.fillPath();
            extWallGraphics.fillStyle(0x7A3C10, 1);
            extWallGraphics.beginPath();
            extWallGraphics.moveTo(32, 32);
            extWallGraphics.lineTo(64, 16);
            extWallGraphics.lineTo(64, 80);
            extWallGraphics.lineTo(32, 96);
            extWallGraphics.closePath();
            extWallGraphics.fillPath();
            extWallGraphics.fillStyle(0x9A5523, 1);
            extWallGraphics.beginPath();
            extWallGraphics.moveTo(32, 0);
            extWallGraphics.lineTo(64, 16);
            extWallGraphics.lineTo(32, 32);
            extWallGraphics.lineTo(0, 16);
            extWallGraphics.closePath();
            extWallGraphics.fillPath();
            extWallGraphics.generateTexture('exterior-wall', 64, 96);

            // === PLAYER CHARACTER (simple isometric person) ===
            const playerGraphics = this.make.graphics({ x: 0, y: 0, add: false });
            // Body (oval)
            playerGraphics.fillStyle(0x2F2F2F, 1); // Dark suit
            playerGraphics.fillEllipse(16, 28, 20, 24);
            // Head (circle)
            playerGraphics.fillStyle(0xFFDBB4, 1); // Skin tone
            playerGraphics.fillCircle(16, 10, 8);
            // Collar (white)
            playerGraphics.fillStyle(0xFFFFFF, 1);
            playerGraphics.fillRect(12, 16, 8, 4);
            playerGraphics.generateTexture('player', 32, 40);

            // === CONGREGANT (simple isometric person) ===
            const congGraphics = this.make.graphics({ x: 0, y: 0, add: false });
            congGraphics.fillStyle(0x4169E1, 1); // Royal blue clothes
            congGraphics.fillEllipse(16, 28, 20, 24);
            congGraphics.fillStyle(0xFFDBB4, 1);
            congGraphics.fillCircle(16, 10, 8);
            congGraphics.generateTexture('congregant', 32, 40);

            // === PEW (church bench) ===
            const pewGraphics = this.make.graphics({ x: 0, y: 0, add: false });
            // Bench seat
            pewGraphics.fillStyle(0x654321, 1); // Dark wood
            pewGraphics.beginPath();
            pewGraphics.moveTo(0, 16);
            pewGraphics.lineTo(64, 16);
            pewGraphics.lineTo(96, 32);
            pewGraphics.lineTo(32, 32);
            pewGraphics.closePath();
            pewGraphics.fillPath();
            // Bench back
            pewGraphics.fillStyle(0x8B4513, 1);
            pewGraphics.fillRect(0, 0, 64, 16);
            pewGraphics.generateTexture('pew', 96, 40);

            // === DOOR ===
            const doorGraphics = this.make.graphics({ x: 0, y: 0, add: false });
            doorGraphics.fillStyle(0x5D3A1A, 1); // Dark wood door
            doorGraphics.fillRect(8, 8, 48, 72);
            doorGraphics.fillStyle(0xD4AF37, 1); // Gold handle
            doorGraphics.fillCircle(48, 44, 4);
            doorGraphics.generateTexture('door', 64, 88);

            console.log('[BootScene] Placeholder textures created');
        }

        create() {
            console.log('[BootScene] Assets loaded, starting ExteriorScene');
            
            // Initialize the time system
            if (SimChurch.Phaser.TimeSystem) {
                SimChurch.Phaser.TimeSystem.init();
            }
            
            // Initialize the building system
            if (SimChurch.Phaser.BuildingSystem) {
                SimChurch.Phaser.BuildingSystem.init();
            }

            // Start with the exterior scene
            this.scene.start('ExteriorScene');
        }
    }

    // Expose the scene
    SimChurch.Phaser.BootScene = BootScene;

})();


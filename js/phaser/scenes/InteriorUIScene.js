/**
 * InteriorUIScene - UI Overlay for Interior View
 * Handles buttons, panels, and HUD elements in a static camera view
 */

(function () {
    'use strict';

    window.SimChurch = window.SimChurch || {};
    window.SimChurch.Phaser = window.SimChurch.Phaser || {};

    class InteriorUIScene extends Phaser.Scene {
        constructor() {
            super({ key: 'InteriorUIScene' });
            this.mainScene = null;
            this.scrollContainer = null;
            this.scrollY = 0;
        }

        init(data) {
            this.mainScene = data.mainScene;
        }

        create() {
            console.log('[InteriorUIScene] Creating UI overlay');

            // UI Elements
            this.createUIOverlay();
            this.createTimeDisplay();
            
            // Initial UI State
            this.updateConstructionUI();
            
            // Listen for shutdown to clean up if needed
            this.events.on('shutdown', this.shutdown, this);
        }

        shutdown() {
            // Cleanup
        }

        createUIOverlay() {
            // Exit button
            const exitBtn = this.add.graphics();
            exitBtn.fillStyle(0x722F37, 1);
            exitBtn.fillRoundedRect(0, 0, 100, 36, 8);
            exitBtn.setPosition(690, 10);

            const exitText = this.add.text(740, 28, '← Exit', {
                font: 'bold 14px Arial',
                fill: '#FFFFFF'
            }).setOrigin(0.5, 0.5);

            const exitHit = this.add.rectangle(740, 28, 100, 36, 0xffffff, 0)
                .setInteractive({ useHandCursor: true });

            exitHit.on('pointerover', () => {
                exitBtn.clear().fillStyle(0x8B3A44, 1).fillRoundedRect(0, 0, 100, 36, 8).setPosition(690, 10);
            });
            exitHit.on('pointerout', () => {
                exitBtn.clear().fillStyle(0x722F37, 1).fillRoundedRect(0, 0, 100, 36, 8).setPosition(690, 10);
            });
            exitHit.on('pointerdown', () => {
                // Fade out main scene
                if (this.mainScene) {
                    this.mainScene.cameras.main.fadeOut(500, 0, 0, 0);
                    this.mainScene.cameras.main.once('camerafadeoutcomplete', () => {
                        this.mainScene.scene.start('ExteriorScene');
                        this.scene.stop(); // Stop UI scene
                    });
                }
            });

            // Build mode button
            this.buildBtn = this.add.graphics();
            this.buildBtn.fillStyle(0x2F5233, 1);
            this.buildBtn.fillRoundedRect(0, 0, 120, 36, 8);
            this.buildBtn.setPosition(10, 10);

            this.buildBtnText = this.add.text(70, 28, '🔨 Build', {
                font: 'bold 14px Arial',
                fill: '#FFFFFF'
            }).setOrigin(0.5, 0.5);

            this.buildBtnHit = this.add.rectangle(70, 28, 120, 36, 0xffffff, 0)
                .setInteractive({ useHandCursor: true });

            this.buildBtnHit.on('pointerdown', () => {
                const ConstructionSystem = SimChurch.Phaser.ConstructionSystem;
                if (ConstructionSystem) {
                    const isActive = ConstructionSystem.toggleMode();
                    this.updateBuildButton(isActive);
                    this.updateConstructionUI();
                    
                    // Update main scene grid visibility if needed
                    if (this.mainScene) {
                        this.mainScene.updateGridVisibility(isActive);
                    }
                }
            });

            // Construction mode indicator
            this.constructionModeIndicator = this.add.text(10, 50, '', {
                font: 'bold 12px Arial',
                fill: '#FFD700',
                backgroundColor: '#00000080',
                padding: { x: 8, y: 4 }
            }).setVisible(false);

            // Construction item selection panel (hidden by default)
            this.createConstructionPanel();

            // Zoom indicator
            this.zoomText = this.add.text(400, 480, 'Zoom: 100%', {
                font: '12px Arial',
                fill: '#FFFFFF',
                backgroundColor: '#00000080',
                padding: { x: 8, y: 4 }
            }).setOrigin(0.5, 0.5);
        }

        createTimeDisplay() {
            const TimeSystem = SimChurch.Phaser.TimeSystem;
            if (!TimeSystem) return;

            const panel = this.add.graphics();
            panel.fillStyle(0x000000, 0.6);
            panel.fillRoundedRect(0, 0, 170, 46, 8);
            panel.setPosition(315, 10);

            this.dayText = this.add.text(325, 20, TimeSystem.getDayName(), {
                font: 'bold 13px Arial',
                fill: '#D4AF37'
            });

            this.timeText = this.add.text(325, 38, TimeSystem.getTimeString(), {
                font: '11px Arial',
                fill: '#FFFFFF'
            });

            this.speedText = this.add.text(420, 33, '▶ Normal', {
                font: '10px Arial',
                fill: '#88FF88'
            });
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

            // --- Panel Constants ---
            const PANEL_X = 10;
            const PANEL_Y = 90;
            const PANEL_WIDTH = 200;
            const PANEL_HEIGHT = 400; // Shorter panel height
            const SCROLL_MASK_Y = PANEL_Y + 40; // Start content below title
            const SCROLL_MASK_HEIGHT = PANEL_HEIGHT - 50; // Leave room for title

            // Panel background (Fixed)
            this.constructionPanel = this.add.graphics();
            this.constructionPanel.fillStyle(0x1a1a1a, 0.95);
            this.constructionPanel.fillRoundedRect(PANEL_X, PANEL_Y, PANEL_WIDTH, PANEL_HEIGHT, 8);
            this.constructionPanel.setVisible(false);

            // Panel title (Fixed)
            this.constructionTitle = this.add.text(PANEL_X + 100, PANEL_Y + 20, 'Construction', {
                font: 'bold 16px Arial',
                fill: '#D4AF37'
            }).setOrigin(0.5, 0.5).setVisible(false);

            // --- Scroll Container ---
            this.scrollContainer = this.add.container(0, 0);
            this.scrollContainer.setVisible(false);

            // Mask for scrolling area
            const maskShape = this.make.graphics();
            maskShape.fillStyle(0xffffff);
            maskShape.fillRect(PANEL_X, SCROLL_MASK_Y, PANEL_WIDTH, SCROLL_MASK_HEIGHT);
            const mask = maskShape.createGeometryMask();
            this.scrollContainer.setMask(mask);

            // Mouse Wheel Scrolling
            this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY) => {
                // Only scroll if mouse is over the panel
                if (this.constructionPanel.visible && 
                    pointer.x >= PANEL_X && pointer.x <= PANEL_X + PANEL_WIDTH &&
                    pointer.y >= PANEL_Y && pointer.y <= PANEL_Y + PANEL_HEIGHT) {
                    
                    const scrollSpeed = 0.5;
                    this.scrollY -= deltaY * scrollSpeed;

                    // Clamp scroll
                    // Content height approx: items * 50 + 100 (for demolish)
                    // Let's calculate dynamic max scroll based on content
                    const contentHeight = (this.constructionButtons.length * 50) + 60; // +60 for demolish
                    const maxScroll = 0;
                    const minScroll = -Math.max(0, contentHeight - SCROLL_MASK_HEIGHT);

                    this.scrollY = Phaser.Math.Clamp(this.scrollY, minScroll, maxScroll);
                    
                    // Apply scroll
                    this.scrollContainer.y = this.scrollY;
                }
            });

            // Item buttons
            const items = [
                { type: ConstructionSystem.ITEM_TYPES.WALL_SMART, label: 'Wall', cost: 50 },
                { type: ConstructionSystem.ITEM_TYPES.DOOR_FRAME, label: 'Door', cost: 100 },
                { type: ConstructionSystem.ITEM_TYPES.WINDOW_FRAME, label: 'Window', cost: 150 },
                { type: ConstructionSystem.ITEM_TYPES.PEW, label: 'Pew', cost: 100 },
                { type: ConstructionSystem.ITEM_TYPES.PULPIT, label: 'Pulpit', cost: 200 },
                { type: ConstructionSystem.ITEM_TYPES.PIANO, label: 'Piano', cost: 800 },
                { type: ConstructionSystem.ITEM_TYPES.PLANT, label: 'Plant', cost: 50 }
            ];

            this.constructionButtons = [];
            
            // Create buttons inside container (offsets relative to container 0,0)
            // But container is masked at world coordinates, so we need to position elements
            // relative to the mask start Y (SCROLL_MASK_Y)
            
            items.forEach((item, index) => {
                // Position relative to the top of the scroll area
                const y = SCROLL_MASK_Y + 10 + index * 50;

                const btn = this.add.graphics();
                btn.fillStyle(0x3a3a3a, 1);
                btn.fillRoundedRect(0, 0, 180, 40, 6);
                btn.setPosition(20, y);
                
                const btnText = this.add.text(110, y + 20, `${item.label}\n$${item.cost}`, {
                    font: '12px Arial',
                    fill: '#FFFFFF',
                    align: 'center'
                }).setOrigin(0.5, 0.5);

                // Hit area needs to be static relative to camera for interaction, 
                // but we need it to move with scroll... 
                // Phaser containers handle hit areas IF the interactive object is added to container.
                const btnHit = this.add.rectangle(110, 20, 180, 40, 0xffffff, 0)
                    .setInteractive({ useHandCursor: true });
                
                // We need a container for EACH button to handle the local coordinate system correctly for the hit area
                const btnContainer = this.add.container(0, y);
                btnContainer.add([btnHit]); // Add hit area to local container
                
                // Graphics and Text are weird in containers sometimes with positions. 
                // Let's keep it simple: redraw graphics in update loop or use images.
                // Actually, for this simple case, we can just move the individual elements in the scroll loop?
                // No, container is best.
                
                // RE-STRATEGY: 
                // Add everything to `this.scrollContainer`.
                // `this.scrollContainer` is at (0, this.scrollY).
                // Items inside should be at their layout positions.
                
                // Reset positions to be relative to container origin (0,0)
                const localY = SCROLL_MASK_Y + 10 + (index * 50); 
                
                btn.setPosition(20, localY);
                btnText.setPosition(110, localY + 20);
                btnHit.setPosition(110, localY + 20);
                
                this.scrollContainer.add([btn, btnText, btnHit]);

                btnHit.on('pointerdown', () => {
                    // Only click if visible in mask? Phaser handles this usually, but let's be safe
                    ConstructionSystem.selectItem(item.type);
                    this.updateConstructionUI();
                });

                btnHit.on('pointerover', () => {
                    btn.clear().fillStyle(0x4a4a4a, 1).fillRoundedRect(0, 0, 180, 40, 6).setPosition(20, localY);
                });

                btnHit.on('pointerout', () => {
                    const selected = ConstructionSystem.getSelectedItem();
                    // Check logic in update
                    if (selected === item.type) {
                        btn.clear().fillStyle(0x5a7a5a, 1).fillRoundedRect(0, 0, 180, 40, 6).setPosition(20, localY);
                    } else {
                        btn.clear().fillStyle(0x3a3a3a, 1).fillRoundedRect(0, 0, 180, 40, 6).setPosition(20, localY);
                    }
                });

                this.constructionButtons.push({ btn, btnText, btnHit, item, localY });
            });

            // Demolish button at the bottom
            const demolishY = SCROLL_MASK_Y + 10 + (items.length * 50) + 10; // Extra spacing
            
            const demolishBtn = this.add.graphics();
            demolishBtn.fillStyle(0x7a3a3a, 1);
            demolishBtn.fillRoundedRect(0, 0, 180, 40, 6);
            demolishBtn.setPosition(20, demolishY);
            
            const demolishText = this.add.text(110, demolishY + 20, '🗑️ Demolish', {
                font: 'bold 12px Arial',
                fill: '#FFFFFF'
            }).setOrigin(0.5, 0.5);

            const demolishHit = this.add.rectangle(110, demolishY + 20, 180, 40, 0xffffff, 0)
                .setInteractive({ useHandCursor: true });

            this.scrollContainer.add([demolishBtn, demolishText, demolishHit]);

            demolishHit.on('pointerdown', () => {
                ConstructionSystem.selectItem('demolish');
                this.updateConstructionUI();
            });

            this.demolishButton = { btn: demolishBtn, text: demolishText, hit: demolishHit, localY: demolishY };
        }

        updateConstructionUI() {
            const ConstructionSystem = SimChurch.Phaser.ConstructionSystem;
            if (!ConstructionSystem) return;

            const isActive = ConstructionSystem.isActive();
            const selectedItem = ConstructionSystem.getSelectedItem();

            // Show/hide panel components
            if (this.constructionPanel) this.constructionPanel.setVisible(isActive);
            if (this.constructionTitle) this.constructionTitle.setVisible(isActive);
            if (this.constructionModeIndicator) this.constructionModeIndicator.setVisible(isActive);
            if (this.scrollContainer) this.scrollContainer.setVisible(isActive);

            // Update buttons highlight state
            if (isActive && this.constructionButtons) {
                this.constructionButtons.forEach(({ btn, item, localY }) => {
                    if (selectedItem === item.type) {
                        btn.clear().fillStyle(0x5a7a5a, 1).fillRoundedRect(0, 0, 180, 40, 6).setPosition(20, localY);
                    } else {
                        btn.clear().fillStyle(0x3a3a3a, 1).fillRoundedRect(0, 0, 180, 40, 6).setPosition(20, localY);
                    }
                });

                if (this.demolishButton) {
                    const { btn, localY } = this.demolishButton;
                    if (selectedItem === 'demolish') {
                        btn.clear().fillStyle(0x9a5a5a, 1).fillRoundedRect(0, 0, 180, 40, 6).setPosition(20, localY);
                    } else {
                        btn.clear().fillStyle(0x7a3a3a, 1).fillRoundedRect(0, 0, 180, 40, 6).setPosition(20, localY);
                    }
                }
            }

            // Update indicator text
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
        }

        update(time, delta) {
            // Update time display
            const TimeSystem = SimChurch.Phaser.TimeSystem;
            if (TimeSystem && this.dayText) {
                this.dayText.setText(TimeSystem.getDayName());
                this.timeText.setText(TimeSystem.getTimeString());
                const isPaused = TimeSystem.isPaused();
                this.speedText.setText(isPaused ? '⏸ Paused' : `▶ ${TimeSystem.getSpeedName()}`);
                this.speedText.setColor(isPaused ? '#FFAA00' : '#88FF88');
            }

            // Update zoom text
            if (this.zoomText && this.mainScene) {
                const zoom = this.mainScene.cameras.main.zoom;
                this.zoomText.setText(`Zoom: ${Math.round(zoom * 100)}%`);
            }
        }
    }

    SimChurch.Phaser.InteriorUIScene = InteriorUIScene;

})();

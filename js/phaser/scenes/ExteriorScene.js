/**
 * ExteriorScene - Church Exterior View
 * Shows the church building from outside
 * Click to enter interior view
 */

(function() {
    'use strict';

    window.SimChurch = window.SimChurch || {};
    window.SimChurch.Phaser = window.SimChurch.Phaser || {};

    class ExteriorScene extends Phaser.Scene {
        constructor() {
            super({ key: 'ExteriorScene' });
        }

        create() {
            console.log('[ExteriorScene] Creating exterior view');

            const width = this.cameras.main.width;
            const height = this.cameras.main.height;

            // === SKY GRADIENT BACKGROUND ===
            const sky = this.add.graphics();
            sky.fillGradientStyle(0x87CEEB, 0x87CEEB, 0xE0F6FF, 0xE0F6FF, 1);
            sky.fillRect(0, 0, width, height * 0.6);

            // === GROUND ===
            const ground = this.add.graphics();
            ground.fillStyle(0x228B22, 1); // Forest green
            ground.fillRect(0, height * 0.6, width, height * 0.4);

            // Path to church
            ground.fillStyle(0xC4A67C, 1); // Sandy path
            ground.fillRect(width / 2 - 40, height * 0.6, 80, height * 0.4);

            // === CHURCH BUILDING (Isometric-style) ===
            const churchX = width / 2;
            const churchY = height * 0.55;

            // Main building base
            const church = this.add.graphics();
            
            // Building shadow
            church.fillStyle(0x000000, 0.2);
            church.fillEllipse(churchX, churchY + 100, 280, 60);

            // Main building body
            church.fillStyle(0xF5F5DC, 1); // Beige
            church.fillRect(churchX - 120, churchY - 80, 240, 160);

            // Roof
            church.fillStyle(0x8B4513, 1); // Brown roof
            church.beginPath();
            church.moveTo(churchX - 140, churchY - 80);
            church.lineTo(churchX, churchY - 160);
            church.lineTo(churchX + 140, churchY - 80);
            church.closePath();
            church.fillPath();

            // Steeple
            church.fillStyle(0xF5F5DC, 1);
            church.fillRect(churchX - 25, churchY - 220, 50, 80);
            
            // Steeple roof
            church.fillStyle(0x8B4513, 1);
            church.beginPath();
            church.moveTo(churchX - 35, churchY - 220);
            church.lineTo(churchX, churchY - 280);
            church.lineTo(churchX + 35, churchY - 220);
            church.closePath();
            church.fillPath();

            // Cross
            church.fillStyle(0xD4AF37, 1); // Gold
            church.fillRect(churchX - 4, churchY - 310, 8, 40);
            church.fillRect(churchX - 15, churchY - 300, 30, 8);

            // Windows (stained glass effect)
            church.fillStyle(0x4169E1, 1); // Royal blue
            church.fillRect(churchX - 90, churchY - 50, 40, 60);
            church.fillRect(churchX + 50, churchY - 50, 40, 60);

            // Window frames
            church.lineStyle(3, 0x654321, 1);
            church.strokeRect(churchX - 90, churchY - 50, 40, 60);
            church.strokeRect(churchX + 50, churchY - 50, 40, 60);

            // Main door
            church.fillStyle(0x5D3A1A, 1); // Dark wood
            church.fillRect(churchX - 25, churchY + 10, 50, 70);
            
            // Door arch
            church.fillStyle(0x5D3A1A, 1);
            church.beginPath();
            church.arc(churchX, churchY + 10, 25, Math.PI, 0, false);
            church.fillPath();

            // Door handle
            church.fillStyle(0xD4AF37, 1);
            church.fillCircle(churchX + 15, churchY + 50, 5);

            // === CLICK TO ENTER PROMPT ===
            const promptBg = this.add.graphics();
            promptBg.fillStyle(0x000000, 0.7);
            promptBg.fillRoundedRect(churchX - 120, churchY + 120, 240, 50, 10);

            const enterText = this.add.text(churchX, churchY + 145, '🏠 Click church to enter', {
                font: 'bold 18px Arial',
                fill: '#ffffff'
            }).setOrigin(0.5, 0.5);

            // Pulsing animation for the prompt
            this.tweens.add({
                targets: [promptBg, enterText],
                alpha: { from: 1, to: 0.6 },
                duration: 800,
                yoyo: true,
                repeat: -1
            });

            // === INTERACTIVE ZONE ===
            // Create an invisible clickable area over the church
            const hitArea = this.add.rectangle(churchX, churchY - 50, 260, 280, 0xffffff, 0);
            hitArea.setInteractive({ useHandCursor: true });

            // Hover effect
            hitArea.on('pointerover', () => {
                this.tweens.add({
                    targets: church,
                    alpha: 0.9,
                    duration: 200
                });
                enterText.setText('🚪 Enter Church');
            });

            hitArea.on('pointerout', () => {
                this.tweens.add({
                    targets: church,
                    alpha: 1,
                    duration: 200
                });
                enterText.setText('🏠 Click church to enter');
            });

            // Click to enter
            hitArea.on('pointerdown', () => {
                console.log('[ExteriorScene] Entering interior...');
                this.cameras.main.fadeOut(500, 0, 0, 0);
            });

            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.start('InteriorScene');
            });

            // === DECORATIVE ELEMENTS ===
            // Trees
            this.drawTree(100, height * 0.5);
            this.drawTree(700, height * 0.52);
            this.drawTree(50, height * 0.55);
            this.drawTree(750, height * 0.48);

            // Clouds
            this.drawCloud(100, 60);
            this.drawCloud(300, 40);
            this.drawCloud(600, 70);

            // Animate clouds
            this.tweens.add({
                targets: this.clouds,
                x: '+=50',
                duration: 10000,
                yoyo: true,
                repeat: -1
            });

            // === TIME/DAY DISPLAY ===
            this.createTimeDisplay();

            console.log('[ExteriorScene] Exterior view ready');
        }

        /**
         * Draw a simple tree
         */
        drawTree(x, y) {
            const tree = this.add.graphics();
            // Trunk
            tree.fillStyle(0x654321, 1);
            tree.fillRect(x - 8, y, 16, 40);
            // Foliage
            tree.fillStyle(0x228B22, 1);
            tree.fillCircle(x, y - 10, 30);
            tree.fillCircle(x - 15, y + 5, 22);
            tree.fillCircle(x + 15, y + 5, 22);
        }

        /**
         * Draw a cloud
         */
        drawCloud(x, y) {
            this.clouds = this.clouds || [];
            const cloud = this.add.graphics();
            cloud.fillStyle(0xFFFFFF, 0.9);
            cloud.fillCircle(x, y, 25);
            cloud.fillCircle(x + 25, y + 5, 20);
            cloud.fillCircle(x - 25, y + 5, 20);
            cloud.fillCircle(x + 10, y - 10, 18);
            cloud.x = x;
            this.clouds.push(cloud);
        }

        /**
         * Create the time/day display in the corner
         */
        createTimeDisplay() {
            const TimeSystem = SimChurch.Phaser.TimeSystem;
            if (!TimeSystem) return;

            // Background panel
            const panel = this.add.graphics();
            panel.fillStyle(0x000000, 0.6);
            panel.fillRoundedRect(10, 10, 150, 60, 8);

            // Day text
            this.dayText = this.add.text(20, 20, TimeSystem.getDayName(), {
                font: 'bold 16px Arial',
                fill: '#D4AF37'
            });

            // Time text
            this.timeText = this.add.text(20, 42, TimeSystem.getTimeString(), {
                font: '14px Arial',
                fill: '#FFFFFF'
            });

            // Update every second
            this.time.addEvent({
                delay: 1000,
                callback: this.updateTimeDisplay,
                callbackScope: this,
                loop: true
            });
        }

        /**
         * Update the time display
         */
        updateTimeDisplay() {
            const TimeSystem = SimChurch.Phaser.TimeSystem;
            if (!TimeSystem || !this.dayText) return;

            this.dayText.setText(TimeSystem.getDayName());
            this.timeText.setText(TimeSystem.getTimeString());
        }
    }

    // Expose the scene
    SimChurch.Phaser.ExteriorScene = ExteriorScene;

})();


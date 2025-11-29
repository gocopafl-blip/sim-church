/**
 * Phaser Game Configuration
 * Sim Church - Visual Overhaul
 */

(function() {
    'use strict';

    // Ensure namespace exists
    window.SimChurch = window.SimChurch || {};
    window.SimChurch.Phaser = window.SimChurch.Phaser || {};

    /**
     * Get the Phaser game configuration
     * @returns {Phaser.Types.Core.GameConfig}
     */
    function getConfig() {
        return {
            type: Phaser.AUTO,
            parent: 'phaser-container',
            width: 800,
            height: 500,
            backgroundColor: '#87CEEB', // Sky blue default
            pixelArt: true, // Crisp pixel rendering for isometric art
            scale: {
                mode: Phaser.Scale.FIT,
                autoCenter: Phaser.Scale.CENTER_BOTH
            },
            scene: [
                SimChurch.Phaser.BootScene,
                SimChurch.Phaser.ExteriorScene,
                SimChurch.Phaser.InteriorScene
            ],
            physics: {
                default: 'arcade',
                arcade: {
                    gravity: { y: 0 },
                    debug: false
                }
            }
        };
    }

    /**
     * Initialize the Phaser game instance
     * Called after all scenes are loaded
     */
    function initGame() {
        const config = getConfig();
        const game = new Phaser.Game(config);
        
        // Store reference for later access
        SimChurch.Phaser.game = game;
        
        console.log('[Phaser] Game initialized');
        return game;
    }

    // Expose functions
    SimChurch.Phaser.getConfig = getConfig;
    SimChurch.Phaser.initGame = initGame;

})();


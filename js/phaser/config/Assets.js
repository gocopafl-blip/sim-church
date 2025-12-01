/**
 * Asset Configuration
 * Maps game entities to sprite assets
 */

(function () {
    'use strict';

    window.SimChurch = window.SimChurch || {};
    window.SimChurch.Phaser = window.SimChurch.Phaser || {};

    SimChurch.Phaser.Assets = {
        // Path to sprite assets
        basePath: 'assets/sprites/',

        // Furniture mappings
        furniture: {
            // Pew -> Bench
            pew: {
                base: 'furniture/pew',
                variants: ['_NE', '_NW', '_SE', '_SW'],
                extension: '.png',
                scale: 1
            },
            // Pulpit -> Desk (placeholder)
            pulpit: {
                base: 'furniture/pulpit',
                variants: ['_NE', '_NW', '_SE', '_SW'],
                extension: '.png',
                scale: 1
            },
            // Piano -> Bookcase (placeholder)
            piano: {
                base: 'furniture/piano',
                variants: ['_NE', '_NW', '_SE', '_SW'],
                extension: '.png',
                scale: 1
            },
            // Plant
            plant: {
                base: 'furniture/Isometric/pottedPlant',
                variants: ['_NE', '_NW', '_SE', '_SW'],
                extension: '.png',
                scale: 1
            }
        }
    };
})();


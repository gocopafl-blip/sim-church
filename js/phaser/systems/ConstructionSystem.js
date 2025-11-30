/**
 * ConstructionSystem - Construction Mode Management
 * Handles building placement, costs, validation, and demolition
 */

(function () {
    'use strict';

    window.SimChurch = window.SimChurch || {};
    window.SimChurch.Phaser = window.SimChurch.Phaser || {};

    // Construction item types
    const ITEM_TYPES = {
        WALL_SMART: 'wall-smart',                // NEW: Smart Context-Aware Wall
        WALL_STRAIGHT_NS: 'wall-straight-ns',    // North-South wall
        WALL_STRAIGHT_EW: 'wall-straight-ew',    // East-West wall
        WALL_CORNER_NE: 'wall-corner-ne',        // Corner (North-East)
        WALL_CORNER_NW: 'wall-corner-nw',        // Corner (North-West)
        WALL_CORNER_SE: 'wall-corner-se',        // Corner (South-East)
        WALL_CORNER_SW: 'wall-corner-sw',        // Corner (South-West)
        DOOR_FRAME: 'door-frame',
        WINDOW_FRAME: 'window-frame',
        STAIRWELL: 'stairwell'
    };

    // Construction costs
    const COSTS = {
        [ITEM_TYPES.WALL_SMART]: 50,
        [ITEM_TYPES.WALL_STRAIGHT_NS]: 50,
        [ITEM_TYPES.WALL_STRAIGHT_EW]: 50,
        [ITEM_TYPES.WALL_CORNER_NE]: 60,
        [ITEM_TYPES.WALL_CORNER_NW]: 60,
        [ITEM_TYPES.WALL_CORNER_SE]: 60,
        [ITEM_TYPES.WALL_CORNER_SW]: 60,
        [ITEM_TYPES.DOOR_FRAME]: 100,
        [ITEM_TYPES.WINDOW_FRAME]: 150,
        [ITEM_TYPES.STAIRWELL]: 200
    };

    // Demolition refund (50% of original cost)
    const DEMOLITION_REFUND_RATIO = 0.5;

    // Current state
    let isConstructionMode = false;
    let selectedItemType = null;
    let previewGridX = null;
    let previewGridY = null;
    let previewEdge = null;

    /**
     * Initialize the construction system
     */
    function init() {
        isConstructionMode = false;
        selectedItemType = null;
        previewGridX = null;
        previewGridY = null;
        previewEdge = null;
        console.log('[ConstructionSystem] Initialized');
    }

    /**
     * Toggle construction mode on/off
     */
    function toggleMode() {
        isConstructionMode = !isConstructionMode;
        if (!isConstructionMode) {
            selectedItemType = null;
            previewGridX = null;
            previewGridY = null;
            previewEdge = null;
        }
        return isConstructionMode;
    }

    /**
     * Check if construction mode is active
     */
    function isActive() {
        return isConstructionMode;
    }

    /**
     * Select an item type for placement
     */
    function selectItem(itemType) {
        // Allow 'demolish' as a special case (not a construction item)
        if (itemType === 'demolish') {
            selectedItemType = 'demolish';
            return true;
        }

        // Validate against ITEM_TYPES for actual construction items
        if (!Object.values(ITEM_TYPES).includes(itemType)) {
            console.warn('[ConstructionSystem] Invalid item type:', itemType);
            return false;
        }
        selectedItemType = itemType;
        return true;
    }

    /**
     * Get currently selected item type
     */
    function getSelectedItem() {
        return selectedItemType;
    }

    /**
     * Set preview position (for hover feedback)
     */
    function setPreview(gridX, gridY, edge = null) {
        previewGridX = gridX;
        previewGridY = gridY;
        previewEdge = edge;
    }

    /**
     * Get preview position
     */
    function getPreview() {
        return {
            gridX: previewGridX,
            gridY: previewGridY,
            edge: previewEdge
        };
    }

    /**
     * Get cost for an item type
     */
    function getCost(itemType) {
        // Demolish has no cost (it's a tool, not an item)
        if (itemType === 'demolish') {
            return 0;
        }
        return COSTS[itemType] || 0;
    }

    /**
     * Get demolition refund for an item type
     */
    function getDemolitionRefund(itemType) {
        return Math.floor(getCost(itemType) * DEMOLITION_REFUND_RATIO);
    }

    /**
     * Check if player can afford an item
     */
    function canAfford(itemType) {
        // Demolish is always "affordable" (it's free, just a tool)
        if (itemType === 'demolish') {
            return true;
        }

        const State = window.SimChurch?.State;
        if (!State) return false;

        const state = State.getState();
        const budget = state?.stats?.budget || 0;
        const cost = getCost(itemType);

        return budget >= cost;
    }

    /**
     * Validate placement of an item
     * Returns { valid: boolean, reason: string }
     */
    function validatePlacement(itemType, gridX, gridY, edge = null) {
        const BuildingSystem = SimChurch.Phaser.BuildingSystem;

        // Must be on a floor tile
        if (!BuildingSystem.isFloor(gridX, gridY)) {
            return { valid: false, reason: 'Must place on floor tile' };
        }

        // Check if we can afford it
        if (!canAfford(itemType)) {
            return { valid: false, reason: 'Insufficient funds' };
        }

        // Item-specific validation
        if (itemType === ITEM_TYPES.DOOR_FRAME || itemType === ITEM_TYPES.WINDOW_FRAME) {
            if (!edge) {
                return { valid: false, reason: 'Must specify edge for door/window' };
            }

            // Check if edge already has a feature
            const features = BuildingSystem.getFeatures(gridX, gridY);
            if (features[edge] !== BuildingSystem.FEATURE.NONE) {
                return { valid: false, reason: 'Edge already has a feature' };
            }

            // Check if edge has a wall
            const edges = BuildingSystem.getEdges(gridX, gridY);
            // Convert single char edge (N, S, E, W) to full name used in EDGE object if needed, 
            // BUT BuildingSystem was updated to support single letters, so this works:
            const edgeFlag = BuildingSystem.EDGE[edge];

            if (!(edges & edgeFlag)) {
                return { valid: false, reason: 'No wall on this edge' };
            }
        } else if (itemType.startsWith('wall-')) {
            // Wall placement validation
            // Check if wall already exists
            const edges = BuildingSystem.getEdges(gridX, gridY);
            const edgeFlag = BuildingSystem.EDGE[edge];

            if (edges & edgeFlag) {
                return { valid: false, reason: 'Wall already exists here' };
            }
        }

        return { valid: true, reason: '' };
    }

    /**
     * Place an item (if valid and affordable)
     * Returns { success: boolean, cost: number, reason: string }
     */
    function placeItem(itemType, gridX, gridY, edge = null) {
        const validation = validatePlacement(itemType, gridX, gridY, edge);
        if (!validation.valid) {
            return { success: false, cost: 0, reason: validation.reason };
        }

        const cost = getCost(itemType);

        // Deduct from budget
        const State = window.SimChurch?.State;
        if (State) {
            const state = State.getState();
            if (state.stats.budget >= cost) {
                const newBudget = state.stats.budget - cost;
                State.updateState('stats.budget', newBudget);
            } else {
                return { success: false, cost: 0, reason: 'Insufficient funds' };
            }
        }

        // Actually place the item via BuildingSystem
        const BuildingSystem = SimChurch.Phaser.BuildingSystem;
        if (itemType === ITEM_TYPES.DOOR_FRAME) {
            BuildingSystem.addFeature(gridX, gridY, edge, BuildingSystem.FEATURE.DOOR);
        } else if (itemType === ITEM_TYPES.WINDOW_FRAME) {
            BuildingSystem.addFeature(gridX, gridY, edge, BuildingSystem.FEATURE.WINDOW);
        } else if (itemType.startsWith('wall-')) {
            // Add interior wall
            BuildingSystem.addInteriorWall(itemType, gridX, gridY, edge);
        }

        return { success: true, cost: cost, reason: '' };
    }

    /**
     * Demolish an item (remove feature or wall)
     * Returns { success: boolean, refund: number, reason: string }
     */
    function demolishItem(gridX, gridY, edge = null, isRecursive = false) {
        const BuildingSystem = SimChurch.Phaser.BuildingSystem;

        if (!BuildingSystem.isFloor(gridX, gridY)) {
            return { success: false, refund: 0, reason: 'Not a floor tile' };
        }

        if (!edge) {
            return { success: false, refund: 0, reason: 'Must specify edge' };
        }

        // First, check if there's a feature (door/window) to remove
        const features = BuildingSystem.getFeatures(gridX, gridY);
        const feature = features[edge];

        if (feature !== BuildingSystem.FEATURE.NONE) {
            // Determine item type from feature
            let itemType = null;
            if (feature === BuildingSystem.FEATURE.DOOR) {
                itemType = ITEM_TYPES.DOOR_FRAME;
            } else if (feature === BuildingSystem.FEATURE.WINDOW || feature === BuildingSystem.FEATURE.STAINED_WINDOW) {
                itemType = ITEM_TYPES.WINDOW_FRAME;
            }

            if (itemType) {
                const refund = getDemolitionRefund(itemType);

                // Remove feature
                BuildingSystem.removeFeature(gridX, gridY, edge);

                // Add refund to budget
                const State = window.SimChurch?.State;
                if (State) {
                    const state = State.getState();
                    const newBudget = state.stats.budget + refund;
                    State.updateState('stats.budget', newBudget);
                }

                return { success: true, refund: refund, reason: '' };
            }
        }

        // If no feature, check if there's an interior wall to remove
        const edges = BuildingSystem.getEdges(gridX, gridY);
        const edgeFlag = BuildingSystem.EDGE[edge];

        console.log(`[ConstructionSystem] Checking wall demolition: grid(${gridX}, ${gridY}), edge=${edge}, edgeFlag=${edgeFlag}, edges=${edges}`);

        // Check if there's a wall on this edge
        if (edges & edgeFlag) {
            console.log(`[ConstructionSystem] Wall exists on edge, checking if interior wall...`);
            // Check if this is an interior wall (player-built) vs exterior wall (auto-generated)
            const isInterior = BuildingSystem.isInteriorWall(gridX, gridY, edge);
            console.log(`[ConstructionSystem] Is interior wall: ${isInterior}`);

            if (isInterior) {
                // Determine wall type for refund calculation
                const wallCost = 50;
                const refund = Math.floor(wallCost * DEMOLITION_REFUND_RATIO);

                // Remove the wall
                BuildingSystem.removeInteriorWall(gridX, gridY, edge);

                // Add refund to budget
                const State = window.SimChurch?.State;
                if (State) {
                    const state = State.getState();
                    const newBudget = state.stats.budget + refund;
                    State.updateState('stats.budget', newBudget);
                }

                return { success: true, refund: refund, reason: '' };
            } else if (!isRecursive) {
                // Only return failure if we're not checking a neighbor recursively
                return { success: false, refund: 0, reason: 'Cannot demolish exterior walls' };
            }
        }

        // If checking recursively (checking neighbor), stop here to prevent infinite loops
        if (isRecursive) {
            return { success: false, refund: 0, reason: 'No feature or wall on this edge' };
        }

        // If no wall on this tile's edge, check the neighbor's shared edge
        // S -> neighbor N
        // N -> neighbor S
        // E -> neighbor W
        // W -> neighbor E
        let neighborX = gridX;
        let neighborY = gridY;
        let neighborEdge = null;

        if (edge === 'S') { neighborY++; neighborEdge = 'N'; }
        else if (edge === 'N') { neighborY--; neighborEdge = 'S'; }
        else if (edge === 'E') { neighborX++; neighborEdge = 'W'; }
        else if (edge === 'W') { neighborX--; neighborEdge = 'E'; }

        if (neighborEdge && BuildingSystem.isFloor(neighborX, neighborY)) {
            console.log(`[ConstructionSystem] Checking neighbor (${neighborX}, ${neighborY}) edge ${neighborEdge}`);
            // Recursive call for the neighbor
            const result = demolishItem(neighborX, neighborY, neighborEdge, true);
            if (result.success) {
                return result;
            }
        }

        return { success: false, refund: 0, reason: 'No feature or wall on this edge' };
    }

    // Expose public API
    SimChurch.Phaser.ConstructionSystem = {
        init,
        toggleMode,
        isActive,
        selectItem,
        getSelectedItem,
        setPreview,
        getPreview,
        getCost,
        getDemolitionRefund,
        canAfford,
        validatePlacement,
        placeItem,
        demolishItem,
        ITEM_TYPES,
        COSTS
    };

})();
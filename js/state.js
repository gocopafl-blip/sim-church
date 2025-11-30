/**
 * Sim Church - State Management
 * Handles all game state and data persistence
 */

// Initial game state template
const initialState = {
    meta: {
        week: 1,
        gameMode: 'sandbox',
        difficulty: 'normal',
        startedAt: null,
        lastSaved: null
    },
    church: {
        name: 'Grace Community Church',
        founded: 1,
        building: {
            size: 'small',
            condition: 100,
            capacity: 150,
            layout: null // Placeholder for building layout data
        }
    },
    stats: {
        attendance: 50,
        budget: 5000,
        reputation: 50,
        // Secondary stats
        congregationMorale: 70,
        staffMorale: 75,
        spiritualHealth: 60,
        communityOutreach: 30
    },
    // Track previous stats for trend indicators
    previousStats: {
        attendance: 50,
        budget: 5000,
        reputation: 50
    },
    staff: [],
    congregation: [],
    candidates: [],
    policies: {
        worshipStyle: 'blended',
        serviceLength: 'standard',
        theologicalStance: 'moderate',
        membershipRequirements: 'classes',
        communityFocus: 'balanced',
        decisionMaking: 'elderBoard',
        financialTransparency: 'partial'
    },
    policyHistory: [],
    events: {
        active: [],
        history: []
    },
    finances: {
        weeklyIncome: {
            tithes: 0,
            offerings: 0,
            other: 0
        },
        weeklyExpenses: {
            salaries: 0,
            utilities: 200,
            programs: 100,
            maintenance: 50,
            supplies: 50
        },
        history: []
    },
    news: []
};

// Current game state
let gameState = null;

/**
 * Initialize a new game state
 * @returns {Object} Fresh game state
 */
function initializeState() {
    gameState = JSON.parse(JSON.stringify(initialState));
    gameState.meta.startedAt = Date.now();

    // Generate initial congregation if Congregation module is loaded
    if (window.SimChurch && window.SimChurch.Congregation) {
        const Congregation = window.SimChurch.Congregation;
        gameState.congregation = Congregation.generateInitialCongregation(50);
    }

    return gameState;
}

/**
 * Get the current game state
 * @returns {Object} Current game state
 */
function getState() {
    if (!gameState) {
        return initializeState();
    }
    return gameState;
}

/**
 * Update a specific part of the state
 * @param {string} path - Dot notation path (e.g., 'stats.attendance')
 * @param {any} value - New value
 */
function updateState(path, value) {
    const keys = path.split('.');
    let current = gameState;

    for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
    }

    current[keys[keys.length - 1]] = value;
}

/**
 * Store previous stats before updating (for trend calculation)
 */
function storePreviousStats() {
    if (!gameState) return;

    gameState.previousStats = {
        attendance: gameState.stats.attendance,
        budget: gameState.stats.budget,
        reputation: gameState.stats.reputation
    };
}

/**
 * Get the change in a stat compared to previous week
 * @param {string} statName - Name of the stat
 * @returns {number} Change from previous value
 */
function getStatChange(statName) {
    if (!gameState) return 0;
    return gameState.stats[statName] - gameState.previousStats[statName];
}

/**
 * Advance to the next week
 */
function advanceWeek() {
    if (!gameState) return;
    gameState.meta.week += 1;
}

/**
 * Get current week number
 * @returns {number} Current week
 */
function getCurrentWeek() {
    return gameState?.meta.week || 1;
}

/**
 * Add a news item
 * @param {string} text - News text
 * @param {string} type - Type: 'normal', 'positive', 'negative', 'highlight'
 */
function addNews(text, type = 'normal') {
    if (!gameState) return;

    gameState.news.unshift({
        text,
        type,
        week: gameState.meta.week
    });

    // Keep only last 50 news items
    if (gameState.news.length > 50) {
        gameState.news.pop();
    }
}

/**
 * Get the most recent news item
 * @returns {Object|null} Most recent news
 */
function getLatestNews() {
    return gameState?.news[0] || null;
}

/**
 * Save game to localStorage
 * @returns {boolean} Success
 */
function saveGame() {
    try {
        gameState.meta.lastSaved = Date.now();
        localStorage.setItem('simchurch_save', JSON.stringify(gameState));
        return true;
    } catch (e) {
        console.error('Failed to save game:', e);
        return false;
    }
}

/**
 * Load game from localStorage
 * @returns {boolean} Success
 */
function loadGame() {
    try {
        const saved = localStorage.getItem('simchurch_save');
        if (saved) {
            gameState = JSON.parse(saved);
            return true;
        }
        return false;
    } catch (e) {
        console.error('Failed to load game:', e);
        return false;
    }
}

/**
 * Check if a saved game exists
 * @returns {boolean}
 */
function hasSavedGame() {
    return localStorage.getItem('simchurch_save') !== null;
}

// Expose functions globally
window.SimChurch = window.SimChurch || {};
window.SimChurch.State = {
    initializeState,
    getState,
    updateState,
    storePreviousStats,
    getStatChange,
    advanceWeek,
    getCurrentWeek,
    addNews,
    getLatestNews,
    saveGame,
    loadGame,
    hasSavedGame
};

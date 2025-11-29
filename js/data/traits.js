/**
 * Sim Church - Personality Traits Data
 * Defines all personality traits that staff can have
 */

window.SimChurch = window.SimChurch || {};
window.SimChurch.Data = window.SimChurch.Data || {};

window.SimChurch.Data.Traits = {
    // Trait definitions with effects
    definitions: {
        // Positive Traits
        hardWorker: {
            id: 'hardWorker',
            name: 'Hard Worker',
            emoji: '💪',
            type: 'positive',
            description: 'Gets more done, but may burn out faster',
            effects: {
                productivity: 1.2,      // 20% more effective
                burnoutRate: 1.3        // Burns out 30% faster
            }
        },
        cheerful: {
            id: 'cheerful',
            name: 'Cheerful',
            emoji: '😊',
            type: 'positive',
            description: 'Boosts morale of those around them',
            effects: {
                teamMoraleBonus: 5,     // +5 to team morale
                congregationBonus: 3    // +3 to congregation satisfaction
            }
        },
        learner: {
            id: 'learner',
            name: 'Learner',
            emoji: '📚',
            type: 'positive',
            description: 'Skills improve faster over time',
            effects: {
                skillGrowthRate: 1.5    // Skills improve 50% faster
            }
        },
        teamPlayer: {
            id: 'teamPlayer',
            name: 'Team Player',
            emoji: '🤝',
            type: 'positive',
            description: 'Works well with others, reduces conflicts',
            effects: {
                conflictChance: 0.5,    // 50% less likely to cause conflicts
                teamEfficiency: 1.1     // 10% team efficiency bonus
            }
        },
        dedicated: {
            id: 'dedicated',
            name: 'Dedicated',
            emoji: '🎯',
            type: 'positive',
            description: 'Less likely to leave, very loyal',
            effects: {
                quitChance: 0.3,        // 70% less likely to quit
                loyaltyBonus: 20        // +20 to loyalty score
            }
        },

        // Negative Traits
        difficult: {
            id: 'difficult',
            name: 'Difficult',
            emoji: '😤',
            type: 'negative',
            description: 'Creates friction with other staff',
            effects: {
                conflictChance: 2.0,    // 2x more likely to cause conflicts
                teamMoralePenalty: -5   // -5 to team morale
            }
        },
        lazy: {
            id: 'lazy',
            name: 'Lazy',
            emoji: '😴',
            type: 'negative',
            description: 'Lower productivity',
            effects: {
                productivity: 0.7       // 30% less effective
            }
        },
        greedy: {
            id: 'greedy',
            name: 'Greedy',
            emoji: '💰',
            type: 'negative',
            description: 'Demands raises more often',
            effects: {
                raiseFrequency: 2.0,    // Asks for raises 2x as often
                salaryExpectation: 1.2  // Expects 20% higher salary
            }
        },
        primaDonna: {
            id: 'primaDonna',
            name: 'Prima Donna',
            emoji: '🎭',
            type: 'negative',
            description: 'High maintenance, needs constant praise',
            effects: {
                attentionNeed: 2.0,     // Needs 2x attention
                moraleDecayRate: 1.5    // Morale drops 50% faster without praise
            }
        },
        flightRisk: {
            id: 'flightRisk',
            name: 'Flight Risk',
            emoji: '🚪',
            type: 'negative',
            description: 'May leave for better opportunities',
            effects: {
                quitChance: 2.5,        // 2.5x more likely to quit
                loyaltyBonus: -15       // -15 to loyalty score
            }
        },

        // Neutral/Mixed Traits
        passionate: {
            id: 'passionate',
            name: 'Passionate',
            emoji: '🔥',
            type: 'neutral',
            description: 'High highs, low lows - inconsistent but inspired',
            effects: {
                performanceVariance: 2.0, // More variable performance
                inspirationChance: 1.5    // More likely to have breakthrough moments
            }
        },
        introverted: {
            id: 'introverted',
            name: 'Introverted',
            emoji: '🤫',
            type: 'neutral',
            description: 'Great one-on-one, struggles with groups',
            effects: {
                counselingBonus: 1.3,   // 30% better at counseling
                groupLeadingPenalty: 0.8 // 20% worse at leading groups
            }
        },
        extroverted: {
            id: 'extroverted',
            name: 'Extroverted',
            emoji: '📢',
            type: 'neutral',
            description: 'Great with crowds, may overlook individuals',
            effects: {
                groupLeadingBonus: 1.3, // 30% better at leading groups
                counselingPenalty: 0.8  // 20% worse at individual counseling
            }
        }
    },

    // Trait pools by type for random selection
    pools: {
        positive: ['hardWorker', 'cheerful', 'learner', 'teamPlayer', 'dedicated'],
        negative: ['difficult', 'lazy', 'greedy', 'primaDonna', 'flightRisk'],
        neutral: ['passionate', 'introverted', 'extroverted']
    },

    /**
     * Get a trait definition by ID
     * @param {string} traitId - The trait ID
     * @returns {Object} Trait definition
     */
    getTrait: function(traitId) {
        return this.definitions[traitId] || null;
    },

    /**
     * Generate random traits for a candidate
     * @param {number} count - Number of traits (1-2)
     * @returns {Array} Array of trait IDs
     */
    generateRandomTraits: function(count = null) {
        // Randomly decide 1 or 2 traits if not specified
        if (count === null) {
            count = Math.random() < 0.6 ? 1 : 2;
        }

        const traits = [];
        const allTraits = Object.keys(this.definitions);
        
        // Weight towards positive/neutral, but negatives possible
        // 50% positive, 30% neutral, 20% negative
        for (let i = 0; i < count; i++) {
            let pool;
            const roll = Math.random();
            
            if (roll < 0.5) {
                pool = this.pools.positive;
            } else if (roll < 0.8) {
                pool = this.pools.neutral;
            } else {
                pool = this.pools.negative;
            }

            // Pick a random trait from the pool that isn't already selected
            let attempts = 0;
            let trait;
            do {
                trait = pool[Math.floor(Math.random() * pool.length)];
                attempts++;
            } while (traits.includes(trait) && attempts < 10);

            if (!traits.includes(trait)) {
                traits.push(trait);
            }
        }

        return traits;
    }
};


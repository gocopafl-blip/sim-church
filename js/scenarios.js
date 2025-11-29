/**
 * Sim Church - Challenge Scenarios
 * Predefined scenarios with specific goals and starting conditions
 */

(function() {
    const State = window.SimChurch.State;

    // ========================================
    // SCENARIO DEFINITIONS
    // ========================================

    const SCENARIOS = {
        newPlant: {
            id: 'newPlant',
            name: 'Church Plant',
            icon: '🌱',
            difficulty: 'Easy',
            description: 'Start a new church from scratch with just 20 members and $2,000. Grow it to 100 members.',
            goals: [
                { type: 'attendance', target: 100, label: 'Reach 100 attendance' }
            ],
            startingState: {
                stats: {
                    attendance: 20,
                    budget: 2000,
                    reputation: 30,
                    congregationMorale: 80,
                    spiritualHealth: 70,
                    communityOutreach: 20
                },
                church: {
                    name: 'New Hope Fellowship',
                    building: { size: 'small', condition: 100, capacity: 80 }
                }
            },
            timeLimit: null, // No time limit
            reward: '🏆 Church Planter'
        },

        turnaround: {
            id: 'turnaround',
            name: 'The Turnaround',
            icon: '🔄',
            difficulty: 'Medium',
            description: 'A struggling church with low morale and dwindling attendance. Can you save it?',
            goals: [
                { type: 'attendance', target: 75, label: 'Restore attendance to 75' },
                { type: 'congregationMorale', target: 70, label: 'Raise morale to 70%' }
            ],
            startingState: {
                stats: {
                    attendance: 35,
                    budget: 3000,
                    reputation: 25,
                    congregationMorale: 35,
                    spiritualHealth: 40,
                    communityOutreach: 15
                },
                church: {
                    name: 'Revival Baptist Church',
                    building: { size: 'medium', condition: 60, capacity: 150 }
                }
            },
            timeLimit: 52, // 1 year
            reward: '🏆 Revivalist'
        },

        megachurch: {
            id: 'megachurch',
            name: 'Megachurch Dreams',
            icon: '🏛️',
            difficulty: 'Hard',
            description: 'Start with a healthy church of 150. Can you grow it to 500 in 2 years?',
            goals: [
                { type: 'attendance', target: 500, label: 'Reach 500 attendance' },
                { type: 'reputation', target: 85, label: 'Achieve 85 reputation' }
            ],
            startingState: {
                stats: {
                    attendance: 150,
                    budget: 25000,
                    reputation: 60,
                    congregationMorale: 70,
                    spiritualHealth: 65,
                    communityOutreach: 50
                },
                church: {
                    name: 'Community Life Church',
                    building: { size: 'large', condition: 90, capacity: 300 }
                }
            },
            timeLimit: 104, // 2 years
            reward: '🏆 Visionary Leader'
        },

        budgetCrisis: {
            id: 'budgetCrisis',
            name: 'Budget Crisis',
            icon: '💸',
            difficulty: 'Medium',
            description: 'Your church is in debt! Balance the budget and get to $10,000 in savings.',
            goals: [
                { type: 'budget', target: 10000, label: 'Reach $10,000 budget' }
            ],
            startingState: {
                stats: {
                    attendance: 80,
                    budget: -2000, // In debt!
                    reputation: 45,
                    congregationMorale: 50,
                    spiritualHealth: 55,
                    communityOutreach: 30
                },
                church: {
                    name: 'Grace Community Church',
                    building: { size: 'medium', condition: 70, capacity: 150 }
                }
            },
            timeLimit: 26, // 6 months
            reward: '🏆 Financial Steward'
        },

        communityChampion: {
            id: 'communityChampion',
            name: 'Community Champion',
            icon: '🤝',
            difficulty: 'Medium',
            description: 'Focus on outreach. Build your community reputation to 90.',
            goals: [
                { type: 'reputation', target: 90, label: 'Reach 90 reputation' },
                { type: 'communityOutreach', target: 80, label: 'Reach 80 outreach' }
            ],
            startingState: {
                stats: {
                    attendance: 60,
                    budget: 8000,
                    reputation: 40,
                    congregationMorale: 65,
                    spiritualHealth: 60,
                    communityOutreach: 25
                },
                church: {
                    name: 'Open Arms Church',
                    building: { size: 'small', condition: 85, capacity: 100 }
                }
            },
            timeLimit: 52, // 1 year
            reward: '🏆 Community Leader'
        }
    };

    // ========================================
    // SCENARIO FUNCTIONS
    // ========================================

    /**
     * Get all available scenarios
     * @returns {Object} All scenarios
     */
    function getScenarios() {
        return SCENARIOS;
    }

    /**
     * Get a specific scenario
     * @param {string} scenarioId - Scenario ID
     * @returns {Object|null} Scenario or null
     */
    function getScenario(scenarioId) {
        return SCENARIOS[scenarioId] || null;
    }

    /**
     * Start a scenario
     * @param {string} scenarioId - Scenario ID
     * @returns {boolean} Success
     */
    function startScenario(scenarioId) {
        const scenario = SCENARIOS[scenarioId];
        if (!scenario) return false;

        // Get fresh state
        State.initializeState();
        const state = State.getState();

        // Apply scenario starting conditions
        state.meta.gameMode = 'challenge';
        state.meta.scenarioId = scenarioId;
        state.meta.scenarioStartWeek = 1;
        state.meta.goals = scenario.goals;
        state.meta.timeLimit = scenario.timeLimit;

        // Apply starting stats
        Object.assign(state.stats, scenario.startingState.stats);
        Object.assign(state.church, scenario.startingState.church);

        // Update previous stats to match
        state.previousStats = {
            attendance: state.stats.attendance,
            budget: state.stats.budget,
            reputation: state.stats.reputation
        };

        // Generate congregation to match attendance
        if (window.SimChurch.Congregation) {
            state.congregation = window.SimChurch.Congregation.generateInitialCongregation(
                state.stats.attendance
            );
        }

        State.addNews(`📜 Scenario: ${scenario.name} - ${scenario.description}`, 'highlight');

        return true;
    }

    /**
     * Check if scenario goals are met
     * @returns {Object} Goal status
     */
    function checkGoals() {
        const state = State.getState();
        
        if (state.meta.gameMode !== 'challenge' || !state.meta.goals) {
            return { active: false };
        }

        const goals = state.meta.goals;
        const results = goals.map(goal => {
            let current;
            switch (goal.type) {
                case 'attendance':
                    current = state.stats.attendance;
                    break;
                case 'budget':
                    current = state.stats.budget;
                    break;
                case 'reputation':
                    current = state.stats.reputation;
                    break;
                case 'congregationMorale':
                    current = state.stats.congregationMorale;
                    break;
                case 'communityOutreach':
                    current = state.stats.communityOutreach;
                    break;
                default:
                    current = 0;
            }

            return {
                ...goal,
                current,
                progress: Math.min(100, Math.round((current / goal.target) * 100)),
                completed: current >= goal.target
            };
        });

        const allComplete = results.every(r => r.completed);
        const weeksElapsed = state.meta.week - (state.meta.scenarioStartWeek || 1);
        const timeUp = state.meta.timeLimit && weeksElapsed >= state.meta.timeLimit;

        return {
            active: true,
            goals: results,
            allComplete,
            timeUp,
            weeksRemaining: state.meta.timeLimit ? state.meta.timeLimit - weeksElapsed : null,
            victory: allComplete,
            defeat: timeUp && !allComplete
        };
    }

    /**
     * Get scenario display info
     * @returns {Object|null} Display info or null if not in scenario
     */
    function getScenarioInfo() {
        const state = State.getState();
        
        if (state.meta.gameMode !== 'challenge' || !state.meta.scenarioId) {
            return null;
        }

        const scenario = SCENARIOS[state.meta.scenarioId];
        const goalStatus = checkGoals();

        return {
            scenario,
            ...goalStatus
        };
    }

    // ========================================
    // EXPORTS
    // ========================================

    window.SimChurch = window.SimChurch || {};
    window.SimChurch.Scenarios = {
        SCENARIOS,
        getScenarios,
        getScenario,
        startScenario,
        checkGoals,
        getScenarioInfo
    };
})();


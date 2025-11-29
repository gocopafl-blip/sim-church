/**
 * Sim Church - Events System
 * Handles random events, decisions, and consequences
 */

(function() {
    const State = window.SimChurch.State;

    // ========================================
    // EVENT TEMPLATES
    // ========================================

    const EVENT_TEMPLATES = {
        // === POSITIVE EVENTS ===
        anonymousDonation: {
            id: 'anonymousDonation',
            type: 'positive',
            title: '💝 Anonymous Donation',
            description: 'An anonymous donor has given a generous gift to the church!',
            icon: '💝',
            probability: 0.05,
            conditions: { minWeek: 4 },
            effects: {
                immediate: (state) => {
                    const amount = randomInRange(500, 2000);
                    state.stats.budget += amount;
                    return { budgetChange: amount };
                }
            },
            getMessage: (result) => `You received an anonymous donation of $${result.budgetChange}!`
        },

        mediaAttention: {
            id: 'mediaAttention',
            type: 'positive',
            title: '📺 Media Attention',
            description: 'Local news wants to feature your church\'s community outreach!',
            icon: '📺',
            probability: 0.03,
            conditions: { minReputation: 60, minWeek: 8 },
            effects: {
                immediate: (state) => {
                    state.stats.reputation = Math.min(100, state.stats.reputation + 10);
                    return { reputationChange: 10 };
                }
            },
            getMessage: () => 'The news coverage boosted your reputation by 10!'
        },

        skilledVolunteer: {
            id: 'skilledVolunteer',
            type: 'positive',
            title: '🙋 Skilled Volunteer',
            description: 'A talented church member wants to volunteer their professional skills!',
            icon: '🙋',
            probability: 0.04,
            conditions: { minAttendance: 60 },
            effects: {
                immediate: (state) => {
                    state.stats.congregationMorale = Math.min(100, state.stats.congregationMorale + 5);
                    // Reduce a random expense
                    state.finances.weeklyExpenses.maintenance = Math.max(25, state.finances.weeklyExpenses.maintenance - 25);
                    return { moraleChange: 5, savingsPerWeek: 25 };
                }
            },
            getMessage: () => 'Their help saves $25/week on maintenance and boosts morale!'
        },

        // === NEGATIVE EVENTS ===
        buildingIssue: {
            id: 'buildingIssue',
            type: 'negative',
            title: '🔧 Building Emergency',
            description: 'A pipe burst in the church building! Repairs are needed immediately.',
            icon: '🔧',
            probability: 0.04,
            conditions: { minWeek: 3 },
            effects: {
                immediate: (state) => {
                    const cost = randomInRange(300, 800);
                    state.stats.budget -= cost;
                    return { budgetChange: -cost };
                }
            },
            getMessage: (result) => `Emergency repairs cost $${Math.abs(result.budgetChange)}.`
        },

        keyFamilyUnhappy: {
            id: 'keyFamilyUnhappy',
            type: 'negative',
            title: '😟 Unhappy Family',
            description: 'A key family in the congregation is expressing dissatisfaction.',
            icon: '😟',
            probability: 0.05,
            conditions: { minAttendance: 40 },
            effects: {
                immediate: (state) => {
                    state.stats.congregationMorale = Math.max(0, state.stats.congregationMorale - 8);
                    return { moraleChange: -8 };
                }
            },
            getMessage: () => 'Congregation morale dropped by 8. Try to address their concerns!'
        },

        gossipSpreading: {
            id: 'gossipSpreading',
            type: 'negative',
            title: '🗣️ Gossip Spreading',
            description: 'Rumors are circulating about recent church decisions.',
            icon: '🗣️',
            probability: 0.06,
            conditions: { minWeek: 6 },
            effects: {
                immediate: (state) => {
                    state.stats.reputation = Math.max(0, state.stats.reputation - 5);
                    state.stats.congregationMorale = Math.max(0, state.stats.congregationMorale - 3);
                    return { reputationChange: -5, moraleChange: -3 };
                }
            },
            getMessage: () => 'Reputation -5, Morale -3. Address this before it escalates!'
        },

        // === CHOICE EVENTS ===
        collaborationRequest: {
            id: 'collaborationRequest',
            type: 'choice',
            title: '🤝 Collaboration Opportunity',
            description: 'Another local church wants to partner on a community outreach event.',
            icon: '🤝',
            probability: 0.04,
            conditions: { minReputation: 40, minWeek: 5 },
            choices: [
                {
                    id: 'accept',
                    text: 'Accept the partnership',
                    description: 'Costs $200 but increases reputation',
                    effects: (state) => {
                        state.stats.budget -= 200;
                        state.stats.reputation = Math.min(100, state.stats.reputation + 8);
                        state.stats.communityOutreach = Math.min(100, state.stats.communityOutreach + 10);
                        return { budgetChange: -200, reputationChange: 8 };
                    },
                    resultMessage: 'The partnership was a success! Reputation +8, Outreach +10.'
                },
                {
                    id: 'decline',
                    text: 'Politely decline',
                    description: 'No cost, but miss the opportunity',
                    effects: (state) => {
                        return {};
                    },
                    resultMessage: 'You declined the offer. Perhaps another time.'
                }
            ]
        },

        buildingRental: {
            id: 'buildingRental',
            type: 'choice',
            title: '🏢 Building Rental Request',
            description: 'A community group wants to rent your building for a secular event.',
            icon: '🏢',
            probability: 0.05,
            conditions: { minWeek: 4 },
            choices: [
                {
                    id: 'accept',
                    text: 'Allow the rental ($150)',
                    description: 'Earn money but some members may disapprove',
                    effects: (state) => {
                        state.stats.budget += 150;
                        state.stats.congregationMorale = Math.max(0, state.stats.congregationMorale - 3);
                        state.stats.communityOutreach = Math.min(100, state.stats.communityOutreach + 5);
                        return { budgetChange: 150, moraleChange: -3 };
                    },
                    resultMessage: 'Earned $150! Some members are uneasy, but community ties improved.'
                },
                {
                    id: 'decline',
                    text: 'Decline the request',
                    description: 'Keep members happy, miss the income',
                    effects: (state) => {
                        state.stats.congregationMorale = Math.min(100, state.stats.congregationMorale + 2);
                        return { moraleChange: 2 };
                    },
                    resultMessage: 'Members appreciate keeping the building for church use only.'
                }
            ]
        },

        staffConflict: {
            id: 'staffConflict',
            type: 'choice',
            title: '⚡ Staff Disagreement',
            description: 'Two staff members are in conflict over ministry direction.',
            icon: '⚡',
            probability: 0.06,
            conditions: { minStaff: 2 },
            choices: [
                {
                    id: 'sideA',
                    text: 'Side with the senior staff member',
                    description: 'May upset the other staff member',
                    effects: (state) => {
                        if (state.staff.length >= 2) {
                            state.staff[0].morale = Math.min(100, state.staff[0].morale + 10);
                            state.staff[1].morale = Math.max(0, state.staff[1].morale - 15);
                        }
                        return { decision: 'sideA' };
                    },
                    resultMessage: 'The senior staff member is pleased, but the other feels overlooked.'
                },
                {
                    id: 'sideB',
                    text: 'Side with the newer staff member',
                    description: 'Shows you value fresh ideas',
                    effects: (state) => {
                        if (state.staff.length >= 2) {
                            state.staff[0].morale = Math.max(0, state.staff[0].morale - 15);
                            state.staff[1].morale = Math.min(100, state.staff[1].morale + 10);
                        }
                        return { decision: 'sideB' };
                    },
                    resultMessage: 'The newer staff member feels validated. The senior staff is frustrated.'
                },
                {
                    id: 'compromise',
                    text: 'Mandate a compromise',
                    description: 'Neither fully happy, but workable',
                    effects: (state) => {
                        state.staff.forEach(s => {
                            s.morale = Math.max(0, s.morale - 5);
                        });
                        return { decision: 'compromise' };
                    },
                    resultMessage: 'Both staff accepted the compromise, though neither is thrilled.'
                },
                {
                    id: 'letResolve',
                    text: 'Let them work it out',
                    description: 'May resolve naturally or escalate',
                    effects: (state) => {
                        // 50/50 chance of resolution or escalation
                        if (Math.random() < 0.5) {
                            state.stats.congregationMorale = Math.min(100, state.stats.congregationMorale + 3);
                            return { resolved: true };
                        } else {
                            state.staff.forEach(s => {
                                s.morale = Math.max(0, s.morale - 10);
                            });
                            state.stats.congregationMorale = Math.max(0, state.stats.congregationMorale - 5);
                            return { resolved: false };
                        }
                    },
                    resultMessage: (result) => result.resolved 
                        ? 'They worked it out themselves! Team spirit improved.'
                        : 'The conflict escalated. Staff morale dropped significantly.'
                }
            ]
        },

        memberCrisis: {
            id: 'memberCrisis',
            type: 'choice',
            title: '🆘 Member in Crisis',
            description: 'A congregation member is going through a difficult time and needs significant pastoral care.',
            icon: '🆘',
            probability: 0.05,
            conditions: { minAttendance: 30 },
            choices: [
                {
                    id: 'fullSupport',
                    text: 'Provide full support (10+ hours this week)',
                    description: 'Deep investment but other things suffer',
                    effects: (state) => {
                        state.stats.congregationMorale = Math.min(100, state.stats.congregationMorale + 8);
                        state.stats.reputation = Math.min(100, state.stats.reputation + 3);
                        // Some programs suffer
                        state.stats.communityOutreach = Math.max(0, state.stats.communityOutreach - 5);
                        return { fullSupport: true };
                    },
                    resultMessage: 'Your dedicated care made a real difference. The congregation notices your compassion.'
                },
                {
                    id: 'moderate',
                    text: 'Provide moderate support',
                    description: 'Balance care with other responsibilities',
                    effects: (state) => {
                        state.stats.congregationMorale = Math.min(100, state.stats.congregationMorale + 3);
                        return { moderate: true };
                    },
                    resultMessage: 'You provided meaningful support while maintaining balance.'
                },
                {
                    id: 'referOut',
                    text: 'Refer to professional counseling',
                    description: 'Professional help, but feels less personal',
                    effects: (state) => {
                        state.stats.budget -= 100;
                        return { referral: true };
                    },
                    resultMessage: 'You connected them with professional help (-$100 for referral assistance).'
                }
            ]
        },

        largeDonorOffer: {
            id: 'largeDonorOffer',
            type: 'choice',
            title: '💎 Major Donor Offer',
            description: 'A wealthy visitor offers a large donation, but wants naming rights to the fellowship hall.',
            icon: '💎',
            probability: 0.02,
            conditions: { minWeek: 10, minReputation: 50 },
            choices: [
                {
                    id: 'accept',
                    text: 'Accept the offer ($5,000)',
                    description: 'Big money, but some see it as selling out',
                    effects: (state) => {
                        state.stats.budget += 5000;
                        state.stats.congregationMorale = Math.max(0, state.stats.congregationMorale - 10);
                        state.stats.reputation = Math.min(100, state.stats.reputation + 5);
                        return { accepted: true, amount: 5000 };
                    },
                    resultMessage: 'You received $5,000! The "Smith Fellowship Hall" sign goes up. Some members grumble.'
                },
                {
                    id: 'negotiate',
                    text: 'Negotiate (smaller donation, no naming)',
                    description: 'Try to find middle ground',
                    effects: (state) => {
                        state.stats.budget += 1500;
                        return { negotiated: true, amount: 1500 };
                    },
                    resultMessage: 'The donor agreed to $1,500 without naming rights. A fair compromise.'
                },
                {
                    id: 'decline',
                    text: 'Politely decline',
                    description: 'Maintain principles, miss the funding',
                    effects: (state) => {
                        state.stats.congregationMorale = Math.min(100, state.stats.congregationMorale + 5);
                        return { declined: true };
                    },
                    resultMessage: 'Members respect your decision to keep the church\'s integrity. Morale +5.'
                }
            ]
        }
    };

    // ========================================
    // EVENT SYSTEM FUNCTIONS
    // ========================================

    /**
     * Check if an event's conditions are met
     * @param {Object} event - Event template
     * @param {Object} state - Game state
     * @returns {boolean}
     */
    function checkConditions(event, state) {
        const c = event.conditions || {};
        
        if (c.minWeek && state.meta.week < c.minWeek) return false;
        if (c.minAttendance && state.stats.attendance < c.minAttendance) return false;
        if (c.minReputation && state.stats.reputation < c.minReputation) return false;
        if (c.minBudget && state.stats.budget < c.minBudget) return false;
        if (c.minStaff && state.staff.length < c.minStaff) return false;
        
        return true;
    }

    /**
     * Roll for random events this week
     * @returns {Object|null} Event that triggered, or null
     */
    function rollForEvents() {
        const state = State.getState();
        const possibleEvents = [];
        
        // Check each event template
        Object.values(EVENT_TEMPLATES).forEach(event => {
            if (checkConditions(event, state)) {
                if (Math.random() < event.probability) {
                    possibleEvents.push(event);
                }
            }
        });
        
        // Return one random event from those that triggered (or null)
        if (possibleEvents.length === 0) return null;
        return possibleEvents[Math.floor(Math.random() * possibleEvents.length)];
    }

    /**
     * Process a non-choice event (positive or negative)
     * @param {Object} event - Event template
     * @returns {Object} Result of the event
     */
    function processImmediateEvent(event) {
        const state = State.getState();
        
        // Apply effects
        const result = event.effects.immediate(state);
        
        // Record in history
        recordEvent(event, result);
        
        // Add news
        const message = event.getMessage(result);
        const newsType = event.type === 'positive' ? 'positive' : 'negative';
        State.addNews(`${event.icon} ${message}`, newsType);
        
        return {
            event,
            result,
            message
        };
    }

    /**
     * Process a player's choice for a choice event
     * @param {Object} event - Event template
     * @param {string} choiceId - ID of the choice made
     * @returns {Object} Result of the choice
     */
    function processChoice(event, choiceId) {
        const state = State.getState();
        const choice = event.choices.find(c => c.id === choiceId);
        
        if (!choice) {
            console.error('Invalid choice:', choiceId);
            return null;
        }
        
        // Apply effects
        const result = choice.effects(state);
        
        // Get result message
        const message = typeof choice.resultMessage === 'function' 
            ? choice.resultMessage(result) 
            : choice.resultMessage;
        
        // Record in history
        recordEvent(event, { choiceId, result, message });
        
        // Add news
        State.addNews(`${event.icon} ${message}`, 'normal');
        
        return {
            event,
            choice,
            result,
            message
        };
    }

    /**
     * Record an event in history
     * @param {Object} event - Event that occurred
     * @param {Object} result - Result/outcome
     */
    function recordEvent(event, result) {
        const state = State.getState();
        
        state.events.history.unshift({
            eventId: event.id,
            title: event.title,
            type: event.type,
            week: state.meta.week,
            result,
            timestamp: Date.now()
        });
        
        // Keep last 50 events
        if (state.events.history.length > 50) {
            state.events.history.pop();
        }
    }

    /**
     * Get the current active event (if any)
     * @returns {Object|null}
     */
    function getActiveEvent() {
        const state = State.getState();
        return state.events.active.length > 0 ? state.events.active[0] : null;
    }

    /**
     * Set an active event that needs player response
     * @param {Object} event - Event to set as active
     */
    function setActiveEvent(event) {
        const state = State.getState();
        state.events.active = [event];
    }

    /**
     * Clear the active event
     */
    function clearActiveEvent() {
        const state = State.getState();
        state.events.active = [];
    }

    /**
     * Get event history
     * @param {number} limit - Max events to return
     * @returns {Array}
     */
    function getEventHistory(limit = 20) {
        const state = State.getState();
        return state.events.history.slice(0, limit);
    }

    /**
     * Get all event templates
     * @returns {Object}
     */
    function getEventTemplates() {
        return EVENT_TEMPLATES;
    }

    // ========================================
    // UTILITY
    // ========================================

    function randomInRange(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    // ========================================
    // EXPORTS
    // ========================================

    window.SimChurch = window.SimChurch || {};
    window.SimChurch.Events = {
        rollForEvents,
        processImmediateEvent,
        processChoice,
        getActiveEvent,
        setActiveEvent,
        clearActiveEvent,
        getEventHistory,
        getEventTemplates,
        EVENT_TEMPLATES
    };
})();


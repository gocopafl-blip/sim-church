/**
 * Sim Church - Core Game Logic
 * Handles the game loop, calculations, and progression
 */

(function () {
    // Get state functions from global
    const State = window.SimChurch.State;

    /**
     * Process a single week of game time
     * This is the core game loop tick
     */
    function processWeek() {
        const state = State.getState();
        const Staff = window.SimChurch.Staff;

        // Store current stats for trend comparison
        State.storePreviousStats();

        // 0. Staff system updates
        Staff.removeExpiredCandidates();
        const newCandidates = Staff.generateWeeklyCandidates();
        state.candidates.push(...newCandidates);

        // Get staff effects for this week
        const staffEffects = Staff.calculateStaffEffects();

        // 0b. Congregation system updates
        const Congregation = window.SimChurch.Congregation;
        let congregationResults = { newVisitors: 0, conversions: 0, departures: 0, attendedThisWeek: 0 };
        if (Congregation) {
            congregationResults = Congregation.processWeeklyBehaviors();
            // Update attendance stat to match actual attendance
            State.updateState('stats.attendance', congregationResults.attendedThisWeek);
        }

        // 1. Calculate income
        const income = calculateWeeklyIncome(state);

        // 2. Calculate expenses (now includes staff salaries)
        const expenses = calculateWeeklyExpenses(state);

        // 3. Update budget
        const netIncome = income.total - expenses.total;
        const newBudget = state.stats.budget + netIncome;
        State.updateState('stats.budget', Math.round(newBudget));

        // 4. Update attendance (with staff bonuses)
        const attendanceChange = calculateAttendanceChange(state, staffEffects);
        const newAttendance = Math.max(1, state.stats.attendance + attendanceChange);
        State.updateState('stats.attendance', Math.round(newAttendance));

        // 5. Update reputation (with staff bonuses)
        const reputationChange = calculateReputationChange(state, staffEffects);
        const newReputation = clamp(state.stats.reputation + reputationChange, 0, 100);
        State.updateState('stats.reputation', Math.round(newReputation));

        // 6. Update congregation morale (with staff bonuses and policy effects)
        let moraleChange = staffEffects.moraleBonus > 0 ? randomRange(0, 2) : randomRange(-1, 1);

        // Apply policy satisfaction modifier (gradual effect)
        const Policies = window.SimChurch.Policies;
        if (Policies) {
            const policyEffects = Policies.calculatePolicyEffects();
            moraleChange += Math.round(policyEffects.satisfactionModifier / 10);
        }

        const newMorale = clamp(state.stats.congregationMorale + moraleChange + (staffEffects.moraleBonus / 5), 30, 100);
        State.updateState('stats.congregationMorale', Math.round(newMorale));

        // 7. Record financial history
        recordFinancialHistory(state, income, expenses, netIncome);

        // 8. Generate weekly news/events
        generateWeeklyNews(state, {
            income,
            expenses,
            netIncome,
            attendanceChange,
            reputationChange,
            newCandidates,
            congregationResults
        });

        // 9. Check for budget warnings
        checkBudgetWarnings(state, netIncome);

        // 10. Roll for random events
        let triggeredEvent = null;
        const Events = window.SimChurch.Events;
        if (Events) {
            triggeredEvent = Events.rollForEvents();

            if (triggeredEvent) {
                if (triggeredEvent.type === 'choice') {
                    // Choice events need player input - store as active
                    Events.setActiveEvent(triggeredEvent);
                } else {
                    // Positive/Negative events process immediately
                    Events.processImmediateEvent(triggeredEvent);
                }
            }
        }

        // 11. Advance week counter
        State.advanceWeek();

        return {
            income,
            expenses,
            netIncome,
            attendanceChange,
            reputationChange,
            newCandidates: newCandidates.length,
            event: triggeredEvent
        };
    }

    /**
     * Calculate weekly income
     * @param {Object} state - Game state
     * @returns {Object} Income breakdown
     */
    function calculateWeeklyIncome(state) {
        // Use congregation-based giving if available
        const Congregation = window.SimChurch.Congregation;
        const Policies = window.SimChurch.Policies;
        let tithes;

        if (Congregation && state.congregation.length > 0) {
            // Calculate giving from actual congregation members
            tithes = Congregation.calculateWeeklyGiving();
        } else {
            // Fallback: simple calculation
            const baseGivingPerPerson = 25;
            const satisfactionMultiplier = state.stats.congregationMorale / 100;
            tithes = state.stats.attendance * baseGivingPerPerson * satisfactionMultiplier;
        }

        // Apply policy giving modifier
        if (Policies) {
            const policyEffects = Policies.calculatePolicyEffects();
            tithes *= policyEffects.givingModifier;
        }

        // Random special offerings (occasionally)
        const offerings = Math.random() < 0.1 ? randomRange(50, 200) : 0;

        // Other income (minimal for now)
        const other = 0;

        return {
            tithes: Math.round(tithes),
            offerings: Math.round(offerings),
            other,
            total: Math.round(tithes + offerings + other)
        };
    }

    /**
     * Calculate weekly expenses
     * @param {Object} state - Game state
     * @returns {Object} Expense breakdown
     */
    function calculateWeeklyExpenses(state) {
        // Calculate staff salaries using the Staff module
        const Staff = window.SimChurch.Staff;
        const salaries = Staff.calculateTotalSalaries();

        // Fixed expenses (for now)
        const utilities = state.finances.weeklyExpenses.utilities;
        const programs = state.finances.weeklyExpenses.programs;
        const maintenance = state.finances.weeklyExpenses.maintenance;
        const supplies = state.finances.weeklyExpenses.supplies;

        return {
            salaries,
            utilities,
            programs,
            maintenance,
            supplies,
            total: salaries + utilities + programs + maintenance + supplies
        };
    }

    /**
     * Calculate attendance change for the week
     * @param {Object} state - Game state
     * @param {Object} staffEffects - Bonuses from staff
     * @returns {number} Change in attendance
     */
    function calculateAttendanceChange(state, staffEffects = {}) {
        let change = 0;

        // Base random fluctuation (-5 to +5)
        change += randomRange(-5, 5);

        // Reputation effect (high rep attracts people)
        if (state.stats.reputation > 60) {
            change += randomRange(0, 3);
        } else if (state.stats.reputation < 40) {
            change += randomRange(-3, 0);
        }

        // Morale effect (happy congregation invites others)
        if (state.stats.congregationMorale > 70) {
            change += randomRange(0, 2);
        } else if (state.stats.congregationMorale < 50) {
            change += randomRange(-2, 0);
        }

        // Staff attendance bonus (from position effects and skills)
        if (staffEffects.attendanceBonus) {
            change += Math.floor(staffEffects.attendanceBonus / 2); // Scaled down for balance
        }

        // Apply policy attendance growth modifier
        const Policies = window.SimChurch.Policies;
        if (Policies) {
            const policyEffects = Policies.calculatePolicyEffects();
            // Only apply to positive growth, negative stays as-is
            if (change > 0) {
                change = Math.round(change * policyEffects.attendanceGrowthModifier);
            }
        }

        // Ensure we don't grow too fast or shrink too fast
        change = clamp(change, -10, 15);

        return change;
    }

    /**
     * Calculate reputation change for the week
     * @param {Object} state - Game state
     * @param {Object} staffEffects - Bonuses from staff
     * @returns {number} Change in reputation
     */
    function calculateReputationChange(state, staffEffects = {}) {
        let change = 0;

        // Small random fluctuation
        change += randomRange(-2, 2);

        // Budget health affects reputation
        if (state.stats.budget < 0) {
            change -= 2; // Being in debt hurts reputation
        } else if (state.stats.budget > 20000) {
            change += 1; // Financial stability helps
        }

        // Outreach programs help reputation
        if (state.stats.communityOutreach > 50) {
            change += randomRange(0, 2);
        }

        // Staff reputation bonus
        if (staffEffects.reputationBonus) {
            change += Math.floor(staffEffects.reputationBonus / 3); // Scaled down
        }

        // Apply policy reputation modifier (gradual effect)
        const Policies = window.SimChurch.Policies;
        if (Policies) {
            const policyEffects = Policies.calculatePolicyEffects();
            // Add a small fraction of the policy modifier each week
            change += Math.round(policyEffects.reputationModifier / 10);
        }

        // Clamp the change
        change = clamp(change, -5, 5);

        return change;
    }

    /**
     * Generate news based on weekly events
     * @param {Object} state - Game state
     * @param {Object} changes - This week's changes
     */
    function generateWeeklyNews(state, changes) {
        const newsOptions = [];

        // Attendance-based news
        if (changes.attendanceChange > 5) {
            newsOptions.push({
                text: `Great week! ${changes.attendanceChange} new people attended this Sunday!`,
                type: 'positive'
            });
        } else if (changes.attendanceChange < -5) {
            newsOptions.push({
                text: `Attendance dropped by ${Math.abs(changes.attendanceChange)} this week.`,
                type: 'negative'
            });
        }

        // Budget-based news
        if (changes.netIncome > 500) {
            newsOptions.push({
                text: `Generous giving this week! Budget increased by $${changes.netIncome}.`,
                type: 'positive'
            });
        } else if (changes.netIncome < -500) {
            newsOptions.push({
                text: `Tight week financially. Budget decreased by $${Math.abs(changes.netIncome)}.`,
                type: 'negative'
            });
        }

        // Milestone news - use unshift for highest priority (shows before other news)
        const newState = State.getState();
        if (newState.stats.attendance >= 100 && newState.previousStats.attendance < 100) {
            newsOptions.unshift({
                text: `🎉 Milestone reached! Your church now has 100+ in attendance!`,
                type: 'highlight'
            });
        }

        if (newState.stats.reputation >= 75 && newState.previousStats.reputation < 75) {
            newsOptions.unshift({
                text: `⭐ Your church is becoming well-known in the community!`,
                type: 'highlight'
            });
        }

        // News about new candidates
        if (changes.newCandidates && changes.newCandidates.length > 0) {
            if (changes.newCandidates.length === 1) {
                newsOptions.push({
                    text: `📋 A new candidate is available for hire: ${changes.newCandidates[0].position}`,
                    type: 'normal'
                });
            } else {
                newsOptions.push({
                    text: `📋 ${changes.newCandidates.length} new candidates are looking for positions!`,
                    type: 'normal'
                });
            }
        }

        // Congregation-related news
        if (changes.congregationResults) {
            const cr = changes.congregationResults;
            if (cr.newVisitors > 2) {
                newsOptions.push({
                    text: `👋 ${cr.newVisitors} new visitors attended this week!`,
                    type: 'positive'
                });
            }
            if (cr.conversions > 0) {
                newsOptions.push({
                    text: `🎉 ${cr.conversions} visitor${cr.conversions > 1 ? 's' : ''} decided to become regular${cr.conversions > 1 ? 's' : ''}!`,
                    type: 'positive'
                });
            }
            if (cr.departures > 2) {
                newsOptions.push({
                    text: `😢 ${cr.departures} members left the church this week.`,
                    type: 'negative'
                });
            }
        }

        // Random flavor news if nothing notable happened
        if (newsOptions.length === 0) {
            const flavorNews = [
                { text: 'A steady week at the church. The congregation seems content.', type: 'normal' },
                { text: 'Sunday service went smoothly this week.', type: 'normal' },
                { text: 'A few visitors stopped by to check out the church.', type: 'normal' },
                { text: 'The weekly prayer meeting had good attendance.', type: 'normal' },
                { text: 'A member mentioned they invited a friend to visit next week.', type: 'normal' }
            ];
            newsOptions.push(flavorNews[Math.floor(Math.random() * flavorNews.length)]);
        }

        // Add the first (most relevant) news item
        const news = newsOptions[0];
        State.addNews(news.text, news.type);
    }

    /**
     * Get a status message based on current church state
     * @returns {string} Status message
     */
    function getChurchStatus() {
        const state = State.getState();

        if (state.stats.attendance < 30) {
            return "Your church is just getting started. Every new member counts!";
        } else if (state.stats.attendance < 75) {
            return "Your church is growing steadily. Keep up the good work!";
        } else if (state.stats.attendance < 150) {
            return "A thriving community is forming around your church.";
        } else if (state.stats.attendance < 300) {
            return "Your church has become a pillar of the community!";
        } else {
            return "A megachurch in the making! Incredible growth!";
        }
    }

    // ========================================
    // FINANCIAL TRACKING
    // ========================================

    /**
     * Record weekly financial data for history tracking
     * @param {Object} state - Game state
     * @param {Object} income - Income breakdown
     * @param {Object} expenses - Expense breakdown
     * @param {number} netIncome - Net income for the week
     */
    function recordFinancialHistory(state, income, expenses, netIncome) {
        const record = {
            week: state.meta.week,
            income: income,
            expenses: expenses,
            net: netIncome,
            balance: state.stats.budget,
            attendance: state.stats.attendance
        };

        // Add to history (keep last 52 weeks / 1 year)
        state.finances.history.unshift(record);
        if (state.finances.history.length > 52) {
            state.finances.history.pop();
        }

        // Update last week's income/expense tracking
        state.finances.weeklyIncome = income;
        state.finances.lastWeeklyExpenses = expenses;
    }

    /**
     * Check budget status and add warnings if needed
     * @param {Object} state - Game state
     * @param {number} netIncome - This week's net income
     */
    function checkBudgetWarnings(state, netIncome) {
        // Calculate runway (weeks until broke if losing money)
        if (netIncome < 0 && state.stats.budget > 0) {
            const runway = Math.floor(state.stats.budget / Math.abs(netIncome));
            if (runway <= 4) {
                State.addNews(`⚠️ Warning: At this rate, you'll run out of funds in ${runway} weeks!`, 'negative');
            }
        }

        // Alert if in debt
        if (state.stats.budget < 0) {
            State.addNews(`🚨 Your church is in debt! Balance: $${state.stats.budget.toLocaleString()}`, 'negative');
        }

        // Alert if budget is critically low
        if (state.stats.budget > 0 && state.stats.budget < 1000) {
            State.addNews(`💸 Funds are running low. Only $${state.stats.budget.toLocaleString()} remaining.`, 'negative');
        }
    }

    /**
     * Get financial statistics for display
     * @returns {Object} Financial stats
     */
    function getFinancialStats() {
        const state = State.getState();
        const history = state.finances.history;

        if (history.length === 0) {
            return {
                bestWeek: 0,
                worstWeek: 0,
                average: 0,
                runway: Infinity
            };
        }

        const nets = history.map(h => h.net);
        const bestWeek = Math.max(...nets);
        const worstWeek = Math.min(...nets);
        const average = Math.round(nets.reduce((a, b) => a + b, 0) / nets.length);

        // Calculate runway
        let runway = Infinity;
        if (average < 0 && state.stats.budget > 0) {
            runway = Math.floor(state.stats.budget / Math.abs(average));
        }

        return {
            bestWeek,
            worstWeek,
            average,
            runway
        };
    }

    /**
     * Get projected income/expenses for current week
     * @returns {Object} Projected financials
     */
    function getProjectedFinancials() {
        const state = State.getState();
        const income = calculateWeeklyIncome(state);
        const expenses = calculateWeeklyExpenses(state);
        const net = income.total - expenses.total;

        return { income, expenses, net };
    }

    // ========================================
    // UTILITY FUNCTIONS
    // ========================================

    /**
     * Generate a random number between min and max (inclusive)
     * @param {number} min - Minimum value
     * @param {number} max - Maximum value
     * @returns {number} Random number
     */
    function randomRange(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /**
     * Clamp a value between min and max
     * @param {number} value - Value to clamp
     * @param {number} min - Minimum
     * @param {number} max - Maximum
     * @returns {number} Clamped value
     */
    function clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    // Expose functions globally
    window.SimChurch = window.SimChurch || {};
    window.SimChurch.Game = {
        processWeek,
        getChurchStatus,
        getFinancialStats,
        getProjectedFinancials
    };
})();

/**
 * Sim Church - UI Management
 * Handles all DOM updates and user interface rendering
 */

(function() {
    // Get dependencies from global
    const State = window.SimChurch.State;
    const Game = window.SimChurch.Game;

    // DOM Element references (cached for performance)
    let elements = {};

    /**
     * Initialize UI by caching DOM elements
     */
    function initializeUI() {
        elements = {
            // Stats
            statAttendance: document.getElementById('stat-attendance'),
            statBudget: document.getElementById('stat-budget'),
            statReputation: document.getElementById('stat-reputation'),
            trendAttendance: document.getElementById('trend-attendance'),
            trendBudget: document.getElementById('trend-budget'),
            trendReputation: document.getElementById('trend-reputation'),
            
            // Stat cards (for animations)
            cardAttendance: document.querySelector('[data-stat="attendance"]'),
            cardBudget: document.querySelector('[data-stat="budget"]'),
            cardReputation: document.querySelector('[data-stat="reputation"]'),
            
            // Header
            weekDisplay: document.getElementById('week-display'),
            churchName: document.getElementById('church-name'),
            
            // Main content
            buildingStatus: document.getElementById('building-status'),
            newsText: document.getElementById('news-text'),
            
            // Buttons
            btnNextWeek: document.getElementById('btn-next-week')
        };
    }

    /**
     * Render all UI elements based on current state
     */
    function renderUI() {
        const state = State.getState();
        
        renderStats(state);
        renderHeader(state);
        renderNews();
        renderBuildingStatus();
        renderChurchBuilding(state);
    }

    /**
     * Render the stats bar
     * @param {Object} state - Game state
     */
    function renderStats(state) {
        // Attendance
        elements.statAttendance.textContent = state.stats.attendance.toLocaleString();
        
        // Budget (formatted as currency)
        elements.statBudget.textContent = formatCurrency(state.stats.budget);
        
        // Reputation
        elements.statReputation.textContent = state.stats.reputation;
        
        // Render trends
        renderTrend('attendance', elements.trendAttendance);
        renderTrend('budget', elements.trendBudget);
        renderTrend('reputation', elements.trendReputation);
    }

    /**
     * Render a trend indicator
     * @param {string} statName - Name of the stat
     * @param {HTMLElement} element - Trend element
     */
    function renderTrend(statName, element) {
        const change = State.getStatChange(statName);
        
        element.classList.remove('positive', 'negative');
        
        if (change > 0) {
            element.textContent = `+${statName === 'budget' ? formatCurrency(change) : change}`;
            element.classList.add('positive');
        } else if (change < 0) {
            element.textContent = statName === 'budget' ? formatCurrency(change) : change;
            element.classList.add('negative');
        } else {
            element.textContent = '';
        }
    }

    /**
     * Render the header information
     * @param {Object} state - Game state
     */
    function renderHeader(state) {
        elements.weekDisplay.textContent = `Week ${state.meta.week}`;
        elements.churchName.textContent = state.church.name;
    }

    /**
     * Render the news ticker
     */
    function renderNews() {
        const news = State.getLatestNews();
        
        if (news) {
            elements.newsText.textContent = news.text;
            elements.newsText.className = ''; // Reset classes
            
            if (news.type === 'positive') {
                elements.newsText.classList.add('event-positive');
            } else if (news.type === 'negative') {
                elements.newsText.classList.add('event-negative');
            } else if (news.type === 'highlight') {
                elements.newsText.classList.add('event-highlight');
            }
        }
    }

    /**
     * Render the building status message
     */
    function renderBuildingStatus() {
        const status = Game.getChurchStatus();
        elements.buildingStatus.textContent = status;
    }

    /**
     * Render the animated church building based on state
     * @param {Object} state - Game state
     */
    function renderChurchBuilding(state) {
        const building = document.getElementById('church-building');
        const wingLeft = document.getElementById('wing-left');
        const wingRight = document.getElementById('wing-right');
        const peopleContainer = document.getElementById('people-indicators');
        const windows = document.querySelectorAll('.window');
        
        if (!building) return;
        
        const attendance = state.stats.attendance;
        
        // Update building size class
        building.classList.remove('size-small', 'size-medium', 'size-large', 'size-mega');
        if (attendance < 50) {
            building.classList.add('size-small');
        } else if (attendance < 100) {
            building.classList.add('size-medium');
        } else if (attendance < 200) {
            building.classList.add('size-large');
        } else {
            building.classList.add('size-mega');
        }
        
        // Show/hide wings based on attendance
        if (wingLeft && wingRight) {
            if (attendance >= 100) {
                wingLeft.classList.add('visible');
                wingLeft.classList.remove('hidden');
            } else {
                wingLeft.classList.remove('visible');
            }
            
            if (attendance >= 150) {
                wingRight.classList.add('visible');
                wingRight.classList.remove('hidden');
            } else {
                wingRight.classList.remove('visible');
            }
        }
        
        // Light up windows based on morale/spiritual health
        if (windows.length > 0) {
            const lightWindows = state.stats.congregationMorale > 60 || state.stats.spiritualHealth > 60;
            windows.forEach(w => {
                w.classList.toggle('lit', lightWindows);
            });
        }
        
        // Update people indicators (show dots for attendance, max 30 visible)
        if (peopleContainer) {
            const visiblePeople = Math.min(30, Math.floor(attendance / 3));
            const currentDots = peopleContainer.querySelectorAll('.person-dot').length;
            
            // Only update if count changed significantly
            if (Math.abs(visiblePeople - currentDots) > 2) {
                peopleContainer.innerHTML = '';
                for (let i = 0; i < visiblePeople; i++) {
                    const dot = document.createElement('div');
                    dot.className = 'person-dot';
                    dot.style.animationDelay = `${i * 0.05}s`;
                    peopleContainer.appendChild(dot);
                }
            }
        }
    }

    /**
     * Animate stat cards based on changes
     */
    function animateStatChanges() {
        const stats = ['attendance', 'budget', 'reputation'];
        
        stats.forEach(stat => {
            const change = State.getStatChange(stat);
            const card = elements[`card${capitalize(stat)}`];
            
            if (!card) return;
            
            // Remove existing animation classes
            card.classList.remove('animating-positive', 'animating-negative');
            
            // Force reflow to restart animation
            void card.offsetWidth;
            
            // Add appropriate animation class
            if (change > 0) {
                card.classList.add('animating-positive');
                animateStatValue(stat, 'up');
            } else if (change < 0) {
                card.classList.add('animating-negative');
                animateStatValue(stat, 'down');
            }
        });
    }

    /**
     * Animate the week display when advancing
     */
    function animateWeekAdvance() {
        elements.weekDisplay.classList.add('advancing');
        setTimeout(() => {
            elements.weekDisplay.classList.remove('advancing');
        }, 400);
    }

    /**
     * Disable the Next Week button (during processing)
     */
    function disableNextWeek() {
        elements.btnNextWeek.disabled = true;
        elements.btnNextWeek.querySelector('.btn-text').textContent = 'Processing...';
    }

    /**
     * Enable the Next Week button
     */
    function enableNextWeek() {
        elements.btnNextWeek.disabled = false;
        elements.btnNextWeek.querySelector('.btn-text').textContent = 'Next Week';
    }

    // ========================================
    // UTILITY FUNCTIONS
    // ========================================

    /**
     * Format a number as currency
     * @param {number} amount - Amount to format
     * @returns {string} Formatted currency string
     */
    function formatCurrency(amount) {
        const absAmount = Math.abs(amount);
        let formatted;
        
        if (absAmount >= 1000000) {
            formatted = `$${(absAmount / 1000000).toFixed(1)}M`;
        } else if (absAmount >= 1000) {
            formatted = `$${(absAmount / 1000).toFixed(1)}K`;
        } else {
            formatted = `$${absAmount.toLocaleString()}`;
        }
        
        return amount < 0 ? `-${formatted}` : formatted;
    }

    /**
     * Capitalize first letter of a string
     * @param {string} str - String to capitalize
     * @returns {string} Capitalized string
     */
    function capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    // ========================================
    // STAFF MODAL RENDERING
    // ========================================

    /**
     * Open the staff modal
     */
    function openStaffModal() {
        const modal = document.getElementById('staff-modal');
        modal.classList.remove('hidden');
        renderStaffModal();
    }

    /**
     * Close the staff modal
     */
    function closeStaffModal() {
        const modal = document.getElementById('staff-modal');
        modal.classList.add('hidden');
    }

    /**
     * Switch tabs in staff modal
     * @param {string} tabId - Tab to switch to ('candidates' or 'current')
     */
    function switchStaffTab(tabId) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabId);
        });

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `tab-${tabId}`);
            content.classList.toggle('hidden', content.id !== `tab-${tabId}`);
        });
    }

    /**
     * Render the entire staff modal content
     */
    function renderStaffModal() {
        renderCandidates();
        renderCurrentStaff();
        renderSalarySummary();
    }

    /**
     * Render candidates list
     */
    function renderCandidates() {
        const state = State.getState();
        const container = document.getElementById('candidates-list');
        const emptyMessage = document.getElementById('no-candidates');
        const Staff = window.SimChurch.Staff;
        const Traits = window.SimChurch.Data.Traits;

        container.innerHTML = '';

        if (state.candidates.length === 0) {
            emptyMessage.classList.remove('hidden');
            return;
        }

        emptyMessage.classList.add('hidden');

        state.candidates.forEach(candidate => {
            const position = Staff.getPositions()[candidate.positionId];
            const card = document.createElement('div');
            card.className = 'candidate-card';
            card.innerHTML = `
                <div class="card-header">
                    <div class="card-icon">${position?.icon || '👤'}</div>
                    <div class="card-title-area">
                        <h3 class="card-name">${candidate.name}</h3>
                        <div class="card-position">${candidate.position} Candidate</div>
                    </div>
                    <div class="card-salary">
                        <div class="salary-value">$${candidate.salaryExpectation}</div>
                        <div class="salary-period">per week</div>
                    </div>
                </div>
                <div class="card-body">
                    <div class="skills-section">
                        <div class="skills-title">Skills</div>
                        ${renderSkillBars(candidate.skills, position)}
                    </div>
                    <div class="traits-section">
                        <div class="skills-title">Personality</div>
                        <div class="traits-list">
                            ${candidate.traits.map(traitId => {
                                const trait = Traits.getTrait(traitId);
                                if (!trait) return '';
                                return `<span class="trait-badge ${trait.type}" title="${trait.description}">
                                    ${trait.emoji} ${trait.name}
                                </span>`;
                            }).join('')}
                        </div>
                    </div>
                    <div class="backstory">"${candidate.backstory}"</div>
                </div>
                <div class="card-actions">
                    <button class="btn-hire" data-candidate-id="${candidate.id}">
                        ✓ Hire — $${candidate.salaryExpectation}/wk
                    </button>
                    <button class="btn-pass" data-candidate-id="${candidate.id}">
                        Pass
                    </button>
                </div>
            `;
            container.appendChild(card);
        });

        // Add event listeners for hire/pass buttons
        container.querySelectorAll('.btn-hire').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const candidateId = e.target.dataset.candidateId;
                handleHire(candidateId);
            });
        });

        container.querySelectorAll('.btn-pass').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const candidateId = e.target.dataset.candidateId;
                handlePass(candidateId);
            });
        });
    }

    /**
     * Render skill bars for a candidate/staff
     * @param {Object} skills - Skills object
     * @param {Object} position - Position definition
     * @returns {string} HTML string
     */
    function renderSkillBars(skills, position) {
        const Staff = window.SimChurch.Staff;
        let html = '';

        // Show primary skill first, then secondary, then others
        const skillOrder = [position?.primarySkill, position?.secondarySkill, 'administration', 'peopleSkills'];
        const shownSkills = new Set();

        skillOrder.forEach(skillId => {
            if (skillId && skills[skillId] !== undefined && !shownSkills.has(skillId)) {
                const skillDef = Staff.getSkill(skillId);
                const value = skills[skillId];
                const isPrimary = skillId === position?.primarySkill;
                shownSkills.add(skillId);

                html += `
                    <div class="skill-row">
                        <span class="skill-name">${skillDef.icon} ${skillDef.name}</span>
                        <div class="skill-bar-container">
                            <div class="skill-bar" style="width: ${value * 10}%"></div>
                        </div>
                        <span class="skill-value">${value}</span>
                    </div>
                `;
            }
        });

        return html;
    }

    /**
     * Render current staff list
     */
    function renderCurrentStaff() {
        const state = State.getState();
        const container = document.getElementById('staff-list');
        const emptyMessage = document.getElementById('no-staff');
        const Staff = window.SimChurch.Staff;
        const Traits = window.SimChurch.Data.Traits;

        container.innerHTML = '';

        if (state.staff.length === 0) {
            emptyMessage.classList.remove('hidden');
            return;
        }

        emptyMessage.classList.add('hidden');

        state.staff.forEach(staffMember => {
            const position = Staff.getPositions()[staffMember.positionId];
            const weeksEmployed = state.meta.week - staffMember.hiredWeek;
            const card = document.createElement('div');
            card.className = 'staff-card';
            card.innerHTML = `
                <div class="card-header">
                    <div class="card-icon">${position?.icon || '👤'}</div>
                    <div class="card-title-area">
                        <h3 class="card-name">${staffMember.name}</h3>
                        <div class="card-position">${staffMember.position}</div>
                    </div>
                    <div class="card-salary">
                        <div class="salary-value">$${staffMember.salary}</div>
                        <div class="salary-period">per week</div>
                    </div>
                </div>
                <div class="card-body">
                    <div class="staff-stats">
                        <div class="staff-stat">
                            <span class="staff-stat-icon">📅</span>
                            <span class="staff-stat-value">${weeksEmployed}</span>
                            <span class="staff-stat-label">Weeks</span>
                        </div>
                        <div class="staff-stat">
                            <span class="staff-stat-icon">😊</span>
                            <span class="staff-stat-value">${staffMember.morale}%</span>
                            <span class="staff-stat-label">Morale</span>
                        </div>
                        <div class="staff-stat">
                            <span class="staff-stat-icon">⚡</span>
                            <span class="staff-stat-value">${staffMember.energy}%</span>
                            <span class="staff-stat-label">Energy</span>
                        </div>
                    </div>
                    <div class="meter-row">
                        <span class="meter-label">Morale</span>
                        <div class="meter-bar-container">
                            <div class="meter-bar morale" style="width: ${staffMember.morale}%"></div>
                        </div>
                    </div>
                    <div class="meter-row">
                        <span class="meter-label">Energy</span>
                        <div class="meter-bar-container">
                            <div class="meter-bar energy" style="width: ${staffMember.energy}%"></div>
                        </div>
                    </div>
                    <div class="skills-section">
                        <div class="skills-title">Skills</div>
                        ${renderSkillBars(staffMember.skills, position)}
                    </div>
                    <div class="traits-section">
                        <div class="skills-title">Personality</div>
                        <div class="traits-list">
                            ${staffMember.traits.map(traitId => {
                                const trait = Traits.getTrait(traitId);
                                if (!trait) return '';
                                return `<span class="trait-badge ${trait.type}" title="${trait.description}">
                                    ${trait.emoji} ${trait.name}
                                </span>`;
                            }).join('')}
                        </div>
                    </div>
                </div>
                <div class="card-actions">
                    <button class="btn-fire" data-staff-id="${staffMember.id}">
                        Let Go
                    </button>
                </div>
            `;
            container.appendChild(card);
        });

        // Add event listeners for fire buttons
        container.querySelectorAll('.btn-fire').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const staffId = e.target.dataset.staffId;
                handleFire(staffId);
            });
        });
    }

    /**
     * Render salary summary in footer
     */
    function renderSalarySummary() {
        const Staff = window.SimChurch.Staff;
        const total = Staff.calculateTotalSalaries();
        document.getElementById('total-salaries').textContent = `$${total.toLocaleString()}`;
    }

    /**
     * Handle hiring a candidate
     * @param {string} candidateId - Candidate ID
     */
    function handleHire(candidateId) {
        const Staff = window.SimChurch.Staff;
        const result = Staff.hireCandidate(candidateId);
        
        if (result.success) {
            renderStaffModal();
            renderUI(); // Update main UI (stats might change)
        } else {
            console.warn('Hire failed:', result.message);
        }
    }

    /**
     * Handle passing on a candidate
     * @param {string} candidateId - Candidate ID
     */
    function handlePass(candidateId) {
        const Staff = window.SimChurch.Staff;
        Staff.passOnCandidate(candidateId);
        renderStaffModal();
    }

    /**
     * Handle firing a staff member
     * @param {string} staffId - Staff ID
     */
    function handleFire(staffId) {
        if (confirm('Are you sure you want to let this staff member go?')) {
            const Staff = window.SimChurch.Staff;
            const result = Staff.fireStaff(staffId);
            
            if (result.success) {
                renderStaffModal();
                renderUI();
            }
        }
    }

    // ========================================
    // BUDGET MODAL RENDERING
    // ========================================

    /**
     * Open the budget modal
     */
    function openBudgetModal() {
        const modal = document.getElementById('budget-modal');
        modal.classList.remove('hidden');
        renderBudgetModal();
    }

    /**
     * Close the budget modal
     */
    function closeBudgetModal() {
        const modal = document.getElementById('budget-modal');
        modal.classList.add('hidden');
    }

    /**
     * Switch tabs in budget modal
     * @param {string} tabId - Tab to switch to
     */
    function switchBudgetTab(tabId) {
        const modal = document.getElementById('budget-modal');
        
        // Update tab buttons
        modal.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabId);
        });

        // Update tab content
        modal.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `tab-${tabId}`);
            content.classList.toggle('hidden', content.id !== `tab-${tabId}`);
        });
    }

    /**
     * Render the entire budget modal content
     */
    function renderBudgetModal() {
        renderBudgetOverview();
        renderBudgetAllocations();
        renderBudgetHistory();
        renderBudgetWarnings();
    }

    /**
     * Render the budget overview tab
     */
    function renderBudgetOverview() {
        const state = State.getState();
        const Game = window.SimChurch.Game;
        const projected = Game.getProjectedFinancials();
        
        // Income breakdown
        const incomeContainer = document.getElementById('income-breakdown');
        incomeContainer.innerHTML = `
            <div class="budget-item">
                <span class="budget-item-name">⛪ Tithes & Offerings</span>
                <span class="budget-item-value income">$${projected.income.tithes.toLocaleString()}</span>
            </div>
            ${projected.income.offerings > 0 ? `
            <div class="budget-item">
                <span class="budget-item-name">🎁 Special Offerings</span>
                <span class="budget-item-value income">$${projected.income.offerings.toLocaleString()}</span>
            </div>
            ` : ''}
            ${projected.income.other > 0 ? `
            <div class="budget-item">
                <span class="budget-item-name">📦 Other Income</span>
                <span class="budget-item-value income">$${projected.income.other.toLocaleString()}</span>
            </div>
            ` : ''}
        `;
        
        document.getElementById('total-income').textContent = `$${projected.income.total.toLocaleString()}`;
        
        // Expense breakdown
        const expenseContainer = document.getElementById('expense-breakdown');
        expenseContainer.innerHTML = `
            ${projected.expenses.salaries > 0 ? `
            <div class="budget-item">
                <span class="budget-item-name">👔 Staff Salaries</span>
                <span class="budget-item-value expense">$${projected.expenses.salaries.toLocaleString()}</span>
            </div>
            ` : ''}
            <div class="budget-item">
                <span class="budget-item-name">💡 Utilities</span>
                <span class="budget-item-value expense">$${projected.expenses.utilities.toLocaleString()}</span>
            </div>
            <div class="budget-item">
                <span class="budget-item-name">📚 Programs</span>
                <span class="budget-item-value expense">$${projected.expenses.programs.toLocaleString()}</span>
            </div>
            <div class="budget-item">
                <span class="budget-item-name">🔧 Maintenance</span>
                <span class="budget-item-value expense">$${projected.expenses.maintenance.toLocaleString()}</span>
            </div>
            <div class="budget-item">
                <span class="budget-item-name">📎 Supplies</span>
                <span class="budget-item-value expense">$${projected.expenses.supplies.toLocaleString()}</span>
            </div>
        `;
        
        document.getElementById('total-expenses').textContent = `$${projected.expenses.total.toLocaleString()}`;
        
        // Net income
        const netElement = document.getElementById('net-weekly');
        const netSign = projected.net >= 0 ? '+' : '';
        netElement.textContent = `${netSign}$${projected.net.toLocaleString()}`;
        netElement.className = 'net-value ' + (projected.net >= 0 ? 'positive' : 'negative');
        
        // Bank balance
        document.getElementById('current-balance').textContent = `$${state.stats.budget.toLocaleString()}`;
        
        // Runway calculation
        const stats = Game.getFinancialStats();
        const runwayElement = document.getElementById('runway-weeks');
        if (stats.runway === Infinity || projected.net >= 0) {
            runwayElement.textContent = '∞ weeks';
            runwayElement.classList.remove('warning');
        } else {
            runwayElement.textContent = `${stats.runway} weeks`;
            runwayElement.classList.toggle('warning', stats.runway <= 8);
        }
    }

    /**
     * Render budget allocation controls
     */
    function renderBudgetAllocations() {
        const state = State.getState();
        const container = document.getElementById('allocation-controls');
        
        const allocations = [
            { id: 'utilities', name: 'Utilities', icon: '💡', min: 100, max: 500, value: state.finances.weeklyExpenses.utilities },
            { id: 'programs', name: 'Programs', icon: '📚', min: 0, max: 500, value: state.finances.weeklyExpenses.programs },
            { id: 'maintenance', name: 'Maintenance', icon: '🔧', min: 25, max: 300, value: state.finances.weeklyExpenses.maintenance },
            { id: 'supplies', name: 'Supplies', icon: '📎', min: 25, max: 200, value: state.finances.weeklyExpenses.supplies }
        ];
        
        container.innerHTML = allocations.map(alloc => `
            <div class="allocation-row">
                <span class="allocation-label">${alloc.icon} ${alloc.name}</span>
                <input type="range" 
                       class="allocation-slider" 
                       id="alloc-${alloc.id}"
                       data-expense="${alloc.id}"
                       min="${alloc.min}" 
                       max="${alloc.max}" 
                       step="25"
                       value="${alloc.value}">
                <span class="allocation-value" id="alloc-value-${alloc.id}">$${alloc.value}</span>
            </div>
        `).join('');
        
        // Add event listeners to sliders
        container.querySelectorAll('.allocation-slider').forEach(slider => {
            slider.addEventListener('input', handleAllocationChange);
        });
        
        updateAllocationTotal();
    }

    /**
     * Handle allocation slider changes
     * @param {Event} e - Input event
     */
    function handleAllocationChange(e) {
        const slider = e.target;
        const expenseKey = slider.dataset.expense;
        const value = parseInt(slider.value);
        
        // Update display
        document.getElementById(`alloc-value-${expenseKey}`).textContent = `$${value}`;
        
        // Update state
        const state = State.getState();
        state.finances.weeklyExpenses[expenseKey] = value;
        
        // Update totals
        updateAllocationTotal();
        renderBudgetOverview();
    }

    /**
     * Update the total allocation display
     */
    function updateAllocationTotal() {
        const state = State.getState();
        const exp = state.finances.weeklyExpenses;
        const total = exp.utilities + exp.programs + exp.maintenance + exp.supplies;
        document.getElementById('allocation-total-value').textContent = `$${total.toLocaleString()}`;
    }

    /**
     * Render budget history tab
     */
    function renderBudgetHistory() {
        const state = State.getState();
        const Game = window.SimChurch.Game;
        const history = state.finances.history;
        const stats = Game.getFinancialStats();
        
        // Stats
        document.getElementById('best-week-income').textContent = `+$${stats.bestWeek.toLocaleString()}`;
        document.getElementById('worst-week-income').textContent = `$${stats.worstWeek.toLocaleString()}`;
        document.getElementById('avg-income').textContent = `$${stats.average.toLocaleString()}`;
        
        // Chart (simple bar chart showing last 12 weeks)
        const chartContainer = document.getElementById('history-chart');
        const recentHistory = history.slice(0, 12).reverse();
        
        if (recentHistory.length === 0) {
            chartContainer.innerHTML = '<p style="color: var(--color-cream-dim); text-align: center; width: 100%;">No history yet. Advance a few weeks!</p>';
        } else {
            const maxNet = Math.max(...recentHistory.map(h => Math.abs(h.net)), 1);
            chartContainer.innerHTML = recentHistory.map(h => {
                const height = Math.max(10, (Math.abs(h.net) / maxNet) * 100);
                const isNegative = h.net < 0;
                return `<div class="chart-bar ${isNegative ? 'negative' : ''}" 
                            style="height: ${height}%;" 
                            title="Week ${h.week}: ${h.net >= 0 ? '+' : ''}$${h.net.toLocaleString()}"></div>`;
            }).join('');
        }
        
        // History list
        const listContainer = document.getElementById('history-list');
        if (history.length === 0) {
            listContainer.innerHTML = '<p class="empty-message">No history yet.</p>';
        } else {
            listContainer.innerHTML = history.slice(0, 10).map(h => `
                <div class="history-row">
                    <span class="history-week">Week ${h.week}</span>
                    <span class="history-amount ${h.net >= 0 ? 'positive' : 'negative'}">
                        ${h.net >= 0 ? '+' : ''}$${h.net.toLocaleString()}
                    </span>
                </div>
            `).join('');
        }
    }

    /**
     * Render budget warnings in footer
     */
    function renderBudgetWarnings() {
        const state = State.getState();
        const Game = window.SimChurch.Game;
        const projected = Game.getProjectedFinancials();
        const stats = Game.getFinancialStats();
        const warningArea = document.getElementById('budget-warning-area');
        
        let warnings = [];
        
        if (state.stats.budget < 0) {
            warnings.push('🚨 Your church is in debt!');
        } else if (state.stats.budget < 1000) {
            warnings.push('💸 Funds are critically low!');
        }
        
        if (projected.net < 0 && stats.runway <= 8 && stats.runway !== Infinity) {
            warnings.push(`⚠️ At this rate, you'll run out of funds in ~${stats.runway} weeks.`);
        }
        
        if (warnings.length > 0) {
            warningArea.innerHTML = `
                <div class="budget-warning">
                    <span class="budget-warning-icon">⚠️</span>
                    <span class="budget-warning-text">${warnings.join(' ')}</span>
                </div>
            `;
        } else {
            warningArea.innerHTML = '';
        }
    }

    // ========================================
    // PEOPLE MODAL RENDERING
    // ========================================

    /**
     * Open the people modal
     */
    function openPeopleModal() {
        const modal = document.getElementById('people-modal');
        modal.classList.remove('hidden');
        renderPeopleModal();
    }

    /**
     * Close the people modal
     */
    function closePeopleModal() {
        const modal = document.getElementById('people-modal');
        modal.classList.add('hidden');
    }

    /**
     * Switch tabs in people modal
     * @param {string} tabId - Tab to switch to
     */
    function switchPeopleTab(tabId) {
        const modal = document.getElementById('people-modal');
        
        modal.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabId);
        });

        modal.querySelectorAll('.tab-content').forEach(content => {
            const contentId = `tab-people-${tabId}`;
            content.classList.toggle('active', content.id === contentId);
            content.classList.toggle('hidden', content.id !== contentId);
        });
    }

    /**
     * Render the entire people modal
     */
    function renderPeopleModal() {
        renderPeopleOverview();
        renderMembersList();
        renderDemographics();
    }

    /**
     * Render the people overview tab
     */
    function renderPeopleOverview() {
        const Congregation = window.SimChurch.Congregation;
        const stats = Congregation.getStats();
        
        // Main stats
        document.getElementById('cong-total').textContent = stats.total;
        document.getElementById('cong-active').textContent = stats.activeThisWeek;
        document.getElementById('cong-satisfaction').textContent = `${stats.avgSatisfaction}%`;
        document.getElementById('cong-visitors').textContent = stats.byPattern.visitor || 0;
        
        // Attendance pattern bars
        const patternBars = document.getElementById('pattern-bars');
        const patterns = Congregation.ATTENDANCE_PATTERNS;
        const maxPattern = Math.max(...Object.values(stats.byPattern), 1);
        
        patternBars.innerHTML = Object.keys(patterns).map(key => {
            const count = stats.byPattern[key] || 0;
            const percent = (count / maxPattern) * 100;
            return `
                <div class="pattern-row">
                    <span class="pattern-label">${patterns[key].icon} ${patterns[key].name}</span>
                    <div class="pattern-bar-container">
                        <div class="pattern-bar ${key}" style="width: ${percent}%"></div>
                    </div>
                    <span class="pattern-count">${count}</span>
                </div>
            `;
        }).join('');
        
        // Giving level bars
        const givingBars = document.getElementById('giving-bars');
        const levels = Congregation.GIVING_LEVELS;
        const maxGiving = Math.max(...Object.values(stats.byGiving), 1);
        
        givingBars.innerHTML = Object.keys(levels).map(key => {
            const count = stats.byGiving[key] || 0;
            const percent = (count / maxGiving) * 100;
            return `
                <div class="giving-row">
                    <span class="giving-label">${levels[key].icon} ${levels[key].name}</span>
                    <div class="giving-bar-container">
                        <div class="giving-bar ${key}" style="width: ${percent}%"></div>
                    </div>
                    <span class="giving-count">${count}</span>
                </div>
            `;
        }).join('');
        
        // Giving potential
        const givingPotential = Congregation.calculateWeeklyGiving();
        document.getElementById('giving-potential').textContent = `~$${givingPotential.toLocaleString()}`;
    }

    /**
     * Render the members list tab
     */
    function renderMembersList() {
        const Congregation = window.SimChurch.Congregation;
        const filter = document.getElementById('member-filter')?.value || 'all';
        const sort = document.getElementById('member-sort')?.value || 'satisfaction';
        
        const options = {
            sortBy: sort,
            limit: 50
        };
        
        if (filter !== 'all') {
            options.pattern = filter;
        }
        
        const members = Congregation.getMembers(options);
        const container = document.getElementById('members-list');
        const state = State.getState();
        
        if (members.length === 0) {
            container.innerHTML = '<p class="empty-message">No members match the filter.</p>';
            return;
        }
        
        const ageGroups = Congregation.AGE_GROUPS;
        const patterns = Congregation.ATTENDANCE_PATTERNS;
        const givingLevels = Congregation.GIVING_LEVELS;
        
        container.innerHTML = members.map(member => {
            const ageGroup = ageGroups[member.ageGroup];
            const pattern = patterns[member.attendancePattern];
            const giving = givingLevels[member.givingLevel];
            const weeksAttending = state.meta.week - member.joinedWeek;
            
            let satisfactionClass = 'medium';
            if (member.satisfaction >= 75) satisfactionClass = 'high';
            else if (member.satisfaction < 50) satisfactionClass = 'low';
            
            return `
                <div class="member-card">
                    <div class="member-card-header">
                        <div class="member-avatar">${ageGroup.icon}</div>
                        <div class="member-info">
                            <div class="member-name">${member.name}</div>
                            <div class="member-pattern">${pattern.icon} ${pattern.name}</div>
                        </div>
                        <div class="member-satisfaction">
                            <div class="satisfaction-value ${satisfactionClass}">${member.satisfaction}%</div>
                        </div>
                    </div>
                    <div class="member-details">
                        <span class="member-detail">🎂 ${member.age}y</span>
                        <span class="member-detail">${giving.icon} ${giving.name}</span>
                        <span class="member-detail">📅 ${weeksAttending}w</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    /**
     * Render the demographics tab
     */
    function renderDemographics() {
        const Congregation = window.SimChurch.Congregation;
        const stats = Congregation.getStats();
        const state = State.getState();
        
        // Age distribution
        const ageChart = document.getElementById('age-chart');
        const ageGroups = Congregation.AGE_GROUPS;
        const maxAge = Math.max(...Object.values(stats.byAgeGroup), 1);
        
        ageChart.innerHTML = Object.keys(ageGroups).map(key => {
            const count = stats.byAgeGroup[key] || 0;
            const percent = (count / maxAge) * 100;
            return `
                <div class="demo-row">
                    <span class="demo-label">${ageGroups[key].icon} ${ageGroups[key].name}</span>
                    <div class="demo-bar-container">
                        <div class="demo-bar" style="width: ${percent}%"></div>
                    </div>
                    <span class="demo-count">${count} (${stats.total > 0 ? Math.round(count/stats.total*100) : 0}%)</span>
                </div>
            `;
        }).join('');
        
        // Tenure stats
        const tenureStats = document.getElementById('tenure-stats');
        const members = state.congregation;
        
        let newMembers = 0, established = 0, longTime = 0;
        members.forEach(m => {
            const weeks = state.meta.week - m.joinedWeek;
            if (weeks < 8) newMembers++;
            else if (weeks < 26) established++;
            else longTime++;
        });
        
        tenureStats.innerHTML = `
            <div class="tenure-stat">
                <div class="tenure-value">${newMembers}</div>
                <div class="tenure-label">New (< 8 weeks)</div>
            </div>
            <div class="tenure-stat">
                <div class="tenure-value">${established}</div>
                <div class="tenure-label">Established</div>
            </div>
            <div class="tenure-stat">
                <div class="tenure-value">${longTime}</div>
                <div class="tenure-label">Long-time (6+ mo)</div>
            </div>
        `;
    }

    /**
     * Set up people modal event listeners
     */
    function setupPeopleModalEvents() {
        // Filter and sort changes
        const filterSelect = document.getElementById('member-filter');
        const sortSelect = document.getElementById('member-sort');
        
        if (filterSelect) {
            filterSelect.addEventListener('change', renderMembersList);
        }
        if (sortSelect) {
            sortSelect.addEventListener('change', renderMembersList);
        }
    }

    // ========================================
    // EVENT MODAL RENDERING
    // ========================================

    /**
     * Show an event modal
     * @param {Object} event - Event template
     */
    function showEventModal(event) {
        const modal = document.getElementById('event-modal');
        const header = modal.querySelector('.event-header');
        const icon = document.getElementById('event-icon');
        const title = document.getElementById('event-title');
        const description = document.getElementById('event-description');
        const choicesContainer = document.getElementById('event-choices');
        
        // Set header style based on event type
        header.className = 'modal-header event-header ' + event.type;
        
        // Set content
        icon.textContent = event.icon;
        title.textContent = event.title;
        description.textContent = event.description;
        
        // Render choices or dismiss button
        if (event.type === 'choice') {
            choicesContainer.innerHTML = event.choices.map(choice => `
                <button class="event-choice-btn" data-choice-id="${choice.id}">
                    <span class="choice-text">${choice.text}</span>
                    <span class="choice-description">${choice.description}</span>
                </button>
            `).join('');
            
            // Add click handlers
            choicesContainer.querySelectorAll('.event-choice-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const choiceId = btn.dataset.choiceId;
                    handleEventChoice(event, choiceId);
                });
            });
        } else {
            // Non-choice events - just show dismiss button
            choicesContainer.innerHTML = `
                <div class="event-single-action">
                    <button class="event-dismiss-btn" id="event-dismiss">Got it</button>
                </div>
            `;
            
            document.getElementById('event-dismiss').addEventListener('click', () => {
                closeEventModal();
            });
        }
        
        // Show modal
        modal.classList.remove('hidden');
    }

    /**
     * Handle player choosing an option in a choice event
     * @param {Object} event - Event template
     * @param {string} choiceId - Selected choice ID
     */
    function handleEventChoice(event, choiceId) {
        const Events = window.SimChurch.Events;
        const result = Events.processChoice(event, choiceId);
        
        if (result) {
            // Show result briefly
            const choicesContainer = document.getElementById('event-choices');
            choicesContainer.innerHTML = `
                <div class="event-result">
                    <p>${result.message}</p>
                </div>
                <div class="event-single-action">
                    <button class="event-dismiss-btn" id="event-dismiss">Continue</button>
                </div>
            `;
            
            document.getElementById('event-dismiss').addEventListener('click', () => {
                closeEventModal();
                // Update the main UI to reflect changes
                renderUI();
            });
        }
    }

    /**
     * Close the event modal
     */
    function closeEventModal() {
        const modal = document.getElementById('event-modal');
        modal.classList.add('hidden');
        
        const Events = window.SimChurch.Events;
        Events.clearActiveEvent();
    }

    /**
     * Check for and show any pending events
     * @returns {boolean} True if an event was shown
     */
    function checkAndShowEvent() {
        const Events = window.SimChurch.Events;
        const activeEvent = Events.getActiveEvent();
        
        if (activeEvent) {
            showEventModal(activeEvent);
            return true;
        }
        return false;
    }

    // ========================================
    // TOAST NOTIFICATIONS
    // ========================================

    /**
     * Show a toast notification
     * @param {string} message - Message to display
     * @param {string} type - Type: 'normal', 'positive', 'negative', 'highlight'
     * @param {number} duration - Duration in ms (default 3000)
     */
    function showToast(message, type = 'normal', duration = 3000) {
        const container = document.getElementById('toast-container');
        if (!container) return;
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        // Add icon based on type
        let icon = '📢';
        if (type === 'positive') icon = '✅';
        else if (type === 'negative') icon = '⚠️';
        else if (type === 'highlight') icon = '🎉';
        
        toast.innerHTML = `
            <span class="toast-icon">${icon}</span>
            <span class="toast-message">${message}</span>
        `;
        
        container.appendChild(toast);
        
        // Auto-remove after duration
        setTimeout(() => {
            toast.classList.add('hiding');
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, duration);
    }

    /**
     * Animate a stat value change
     * @param {string} statName - 'attendance', 'budget', or 'reputation'
     * @param {string} direction - 'up' or 'down'
     */
    function animateStatValue(statName, direction) {
        const element = elements[`stat${capitalize(statName)}`];
        if (!element) return;
        
        element.classList.remove('bumping-up', 'bumping-down');
        void element.offsetWidth; // Force reflow
        element.classList.add(direction === 'up' ? 'bumping-up' : 'bumping-down');
        
        setTimeout(() => {
            element.classList.remove('bumping-up', 'bumping-down');
        }, 400);
    }

    // ========================================
    // POLICIES MODAL RENDERING
    // ========================================

    /**
     * Open the policies modal
     */
    function openPoliciesModal() {
        const modal = document.getElementById('policies-modal');
        modal.classList.remove('hidden');
        renderPoliciesModal();
    }

    /**
     * Close the policies modal
     */
    function closePoliciesModal() {
        const modal = document.getElementById('policies-modal');
        modal.classList.add('hidden');
    }

    /**
     * Switch tabs in policies modal
     * @param {string} tabId - Tab to switch to
     */
    function switchPoliciesTab(tabId) {
        const modal = document.getElementById('policies-modal');
        
        modal.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabId);
        });

        modal.querySelectorAll('.tab-content').forEach(content => {
            const contentId = `tab-policies-${tabId}`;
            content.classList.toggle('active', content.id === contentId);
            content.classList.toggle('hidden', content.id !== contentId);
        });
    }

    /**
     * Render the entire policies modal
     */
    function renderPoliciesModal() {
        renderPolicyGroups();
        renderPolicyEffects();
        renderPolicyHistory();
    }

    /**
     * Render the policy groups and options
     */
    function renderPolicyGroups() {
        const Policies = window.SimChurch.Policies;
        const categories = Policies.getPolicyCategories();
        const groups = Policies.getCategoryGroups();
        const currentPolicies = Policies.getCurrentPolicies();
        
        const container = document.getElementById('policy-groups');
        
        container.innerHTML = Object.keys(groups).map(groupId => {
            const group = groups[groupId];
            
            const policyItems = group.policies.map(policyId => {
                const policy = categories[policyId];
                if (!policy) return '';
                
                const currentOption = currentPolicies[policyId];
                
                const optionButtons = Object.keys(policy.options).map(optionId => {
                    const option = policy.options[optionId];
                    const isSelected = currentOption === optionId;
                    
                    return `
                        <button class="policy-option-btn ${isSelected ? 'selected' : ''}"
                                data-policy="${policyId}"
                                data-option="${optionId}">
                            <span class="policy-option-icon">${option.icon}</span>
                            <span class="policy-option-name">${option.name}</span>
                        </button>
                    `;
                }).join('');
                
                return `
                    <div class="policy-item">
                        <div class="policy-item-header">
                            <div class="policy-name">
                                <span class="policy-icon">${policy.icon}</span>
                                ${policy.name}
                            </div>
                        </div>
                        <div class="policy-description">${policy.description}</div>
                        <div class="policy-options">
                            ${optionButtons}
                        </div>
                    </div>
                `;
            }).join('');
            
            return `
                <div class="policy-group">
                    <div class="policy-group-header">
                        <span class="policy-group-icon">${group.icon}</span>
                        <span class="policy-group-name">${group.name}</span>
                    </div>
                    <div class="policy-items">
                        ${policyItems}
                    </div>
                </div>
            `;
        }).join('');
        
        // Add click handlers for policy options
        container.querySelectorAll('.policy-option-btn').forEach(btn => {
            btn.addEventListener('click', handlePolicyOptionClick);
        });
    }

    /**
     * Handle clicking a policy option
     * @param {Event} e - Click event
     */
    function handlePolicyOptionClick(e) {
        const btn = e.currentTarget;
        const policyId = btn.dataset.policy;
        const optionId = btn.dataset.option;
        
        const Policies = window.SimChurch.Policies;
        const result = Policies.setPolicy(policyId, optionId);
        
        if (result.success && result.changed) {
            // Re-render to show new selection
            renderPoliciesModal();
            // Update main UI
            renderUI();
        }
    }

    /**
     * Render the policy effects tab
     */
    function renderPolicyEffects() {
        const Policies = window.SimChurch.Policies;
        const effects = Policies.calculatePolicyEffects();
        
        // Effects grid
        const effectsGrid = document.getElementById('policy-effects-grid');
        
        const effectItems = [
            { 
                label: 'Giving Modifier', 
                value: effects.givingModifier,
                format: (v) => `${Math.round((v - 1) * 100)}%`,
                isPositive: (v) => v >= 1
            },
            { 
                label: 'Growth Modifier', 
                value: effects.attendanceGrowthModifier,
                format: (v) => `${Math.round((v - 1) * 100)}%`,
                isPositive: (v) => v >= 1
            },
            { 
                label: 'Reputation', 
                value: effects.reputationModifier,
                format: (v) => v >= 0 ? `+${v}` : `${v}`,
                isPositive: (v) => v >= 0
            },
            { 
                label: 'Satisfaction', 
                value: effects.satisfactionModifier,
                format: (v) => v >= 0 ? `+${v}` : `${v}`,
                isPositive: (v) => v >= 0
            },
            { 
                label: 'Spiritual Health', 
                value: effects.spiritualHealthModifier,
                format: (v) => v >= 0 ? `+${v}` : `${v}`,
                isPositive: (v) => v >= 0
            },
            { 
                label: 'Member Retention', 
                value: effects.retentionBonus,
                format: (v) => `${Math.round((v - 1) * 100)}%`,
                isPositive: (v) => v >= 1
            }
        ];
        
        effectsGrid.innerHTML = effectItems.map(item => {
            const valueClass = item.value === 1 || item.value === 0 ? 'neutral' : 
                              item.isPositive(item.value) ? 'positive' : 'negative';
            const prefix = item.isPositive(item.value) && item.value !== 1 && item.value !== 0 ? '+' : '';
            
            return `
                <div class="effect-card">
                    <div class="effect-value ${valueClass}">${prefix}${item.format(item.value)}</div>
                    <div class="effect-label">${item.label}</div>
                </div>
            `;
        }).join('');
        
        // Demographic appeal
        const appealContainer = document.getElementById('demographic-appeal');
        const ageGroupNames = {
            child: '👶 Children',
            teen: '🧒 Teens',
            youngAdult: '🧑 Young Adults',
            middleAge: '👨 Middle Age',
            senior: '👴 Seniors'
        };
        
        const attractsList = effects.attractsAgeGroups.map(ag => 
            `<span class="appeal-badge">${ageGroupNames[ag] || ag}</span>`
        ).join('') || '<span class="appeal-badge">None specifically</span>';
        
        const repelsList = effects.repelsAgeGroups.map(ag => 
            `<span class="appeal-badge">${ageGroupNames[ag] || ag}</span>`
        ).join('') || '<span class="appeal-badge">None specifically</span>';
        
        appealContainer.innerHTML = `
            <div class="appeal-section">
                <div class="appeal-title attracts">✅ Attracts</div>
                <div class="appeal-list">${attractsList}</div>
            </div>
            <div class="appeal-section">
                <div class="appeal-title repels">⛔ May Repel</div>
                <div class="appeal-list">${repelsList}</div>
            </div>
        `;
    }

    /**
     * Render the policy history tab
     */
    function renderPolicyHistory() {
        const Policies = window.SimChurch.Policies;
        const history = Policies.getPolicyHistory(15);
        const categories = Policies.getPolicyCategories();
        
        const container = document.getElementById('policy-history-list');
        
        if (history.length === 0) {
            container.innerHTML = `
                <div class="policy-history-empty">
                    No policy changes yet. Your current policies have been in place since the beginning.
                </div>
            `;
            return;
        }
        
        container.innerHTML = history.map(item => {
            const policy = categories[item.policyId];
            const fromOption = policy?.options[item.from];
            const toOption = policy?.options[item.to];
            
            return `
                <div class="policy-history-item">
                    <span class="history-week">Week ${item.week}</span>
                    <div class="history-change">
                        <div class="history-policy-name">${policy?.icon || ''} ${policy?.name || item.policyId}</div>
                        <div class="history-values">
                            <span class="history-from">${fromOption?.name || item.from}</span>
                            <span class="history-arrow">→</span>
                            <span class="history-to">${toOption?.name || item.to}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // ========================================
    // STATISTICS MODAL
    // ========================================

    /**
     * Open the statistics modal
     */
    function openStatsModal() {
        const modal = document.getElementById('stats-modal');
        modal.classList.remove('hidden');
        renderStatsModal();
    }

    /**
     * Close the statistics modal
     */
    function closeStatsModal() {
        const modal = document.getElementById('stats-modal');
        modal.classList.add('hidden');
    }

    /**
     * Render the statistics modal content
     */
    function renderStatsModal() {
        const state = State.getState();
        const history = state.finances?.history || [];
        
        // Calculate summary stats
        const totalWeeks = state.meta.week;
        const peakAttendance = Math.max(state.stats.attendance, ...history.map(h => h.attendance || 0));
        const peakBudget = Math.max(state.stats.budget, ...history.map(h => h.balance || 0));
        const staffHired = (state.staff?.length || 0) + (state.events?.history?.filter(e => e.type === 'hire')?.length || 0);
        
        // Update summary cards
        document.getElementById('stat-total-weeks').textContent = totalWeeks;
        document.getElementById('stat-peak-attendance').textContent = peakAttendance;
        document.getElementById('stat-peak-budget').textContent = formatCurrency(peakBudget);
        document.getElementById('stat-staff-hired').textContent = state.staff?.length || 0;
        
        // Render trend charts
        renderTrendChart('attendance-chart', history, 'attendance', state.stats.attendance);
        renderTrendChart('budget-chart', history, 'balance', state.stats.budget, true);
        renderTrendChart('reputation-chart', history, 'reputation', state.stats.reputation);
        
        // Render congregation breakdown
        renderCongregationBreakdown();
    }

    /**
     * Render a simple bar chart for trends
     */
    function renderTrendChart(containerId, history, field, currentValue, isMoney = false) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        // Get last 20 weeks of data plus current
        const data = [...history.slice(-19).map(h => h[field] || 0), currentValue];
        
        // If we don't have enough data, pad with current value
        while (data.length < 20) {
            data.unshift(data[0] || currentValue);
        }
        
        const maxValue = Math.max(...data, 1);
        const minValue = Math.min(...data, 0);
        const range = maxValue - Math.min(0, minValue);
        
        container.innerHTML = data.map((value, i) => {
            const height = range > 0 ? Math.max(4, ((value - Math.min(0, minValue)) / range) * 80) : 50;
            const isNegative = value < 0;
            const displayValue = isMoney ? formatCurrency(value) : value;
            return `<div class="chart-bar ${isNegative ? 'negative' : ''}" 
                        style="height: ${height}px" 
                        data-value="Week ${history.length - 19 + i + 1}: ${displayValue}"></div>`;
        }).join('');
    }

    /**
     * Render congregation breakdown
     */
    function renderCongregationBreakdown() {
        const state = State.getState();
        const congregation = state.congregation || [];
        const container = document.getElementById('congregation-breakdown');
        if (!container) return;
        
        // Calculate breakdowns
        const total = congregation.length;
        const patterns = {
            visitor: congregation.filter(m => m.attendancePattern === 'visitor').length,
            sporadic: congregation.filter(m => m.attendancePattern === 'sporadic').length,
            regular: congregation.filter(m => m.attendancePattern === 'regular').length,
            dedicated: congregation.filter(m => m.attendancePattern === 'dedicated').length
        };
        
        const ages = {
            children: congregation.filter(m => m.age < 13).length,
            youth: congregation.filter(m => m.age >= 13 && m.age < 25).length,
            adults: congregation.filter(m => m.age >= 25 && m.age < 55).length,
            seniors: congregation.filter(m => m.age >= 55).length
        };
        
        const avgSatisfaction = total > 0 
            ? Math.round(congregation.reduce((sum, m) => sum + m.satisfaction, 0) / total) 
            : 0;
        
        container.innerHTML = `
            <div class="breakdown-item">
                <span class="breakdown-label">👋 Visitors</span>
                <div class="breakdown-bar"><div class="breakdown-fill" style="width: ${total > 0 ? (patterns.visitor / total * 100) : 0}%"></div></div>
                <span class="breakdown-value">${patterns.visitor}</span>
            </div>
            <div class="breakdown-item">
                <span class="breakdown-label">🔄 Sporadic</span>
                <div class="breakdown-bar"><div class="breakdown-fill" style="width: ${total > 0 ? (patterns.sporadic / total * 100) : 0}%"></div></div>
                <span class="breakdown-value">${patterns.sporadic}</span>
            </div>
            <div class="breakdown-item">
                <span class="breakdown-label">✅ Regular</span>
                <div class="breakdown-bar"><div class="breakdown-fill" style="width: ${total > 0 ? (patterns.regular / total * 100) : 0}%"></div></div>
                <span class="breakdown-value">${patterns.regular}</span>
            </div>
            <div class="breakdown-item">
                <span class="breakdown-label">⭐ Dedicated</span>
                <div class="breakdown-bar"><div class="breakdown-fill" style="width: ${total > 0 ? (patterns.dedicated / total * 100) : 0}%"></div></div>
                <span class="breakdown-value">${patterns.dedicated}</span>
            </div>
            <div class="breakdown-item">
                <span class="breakdown-label">👶 Children (0-12)</span>
                <div class="breakdown-bar"><div class="breakdown-fill" style="width: ${total > 0 ? (ages.children / total * 100) : 0}%"></div></div>
                <span class="breakdown-value">${ages.children}</span>
            </div>
            <div class="breakdown-item">
                <span class="breakdown-label">🧒 Youth (13-24)</span>
                <div class="breakdown-bar"><div class="breakdown-fill" style="width: ${total > 0 ? (ages.youth / total * 100) : 0}%"></div></div>
                <span class="breakdown-value">${ages.youth}</span>
            </div>
            <div class="breakdown-item">
                <span class="breakdown-label">👨 Adults (25-54)</span>
                <div class="breakdown-bar"><div class="breakdown-fill" style="width: ${total > 0 ? (ages.adults / total * 100) : 0}%"></div></div>
                <span class="breakdown-value">${ages.adults}</span>
            </div>
            <div class="breakdown-item">
                <span class="breakdown-label">👴 Seniors (55+)</span>
                <div class="breakdown-bar"><div class="breakdown-fill" style="width: ${total > 0 ? (ages.seniors / total * 100) : 0}%"></div></div>
                <span class="breakdown-value">${ages.seniors}</span>
            </div>
            <div class="breakdown-item" style="grid-column: span 2; background: rgba(212, 168, 75, 0.1);">
                <span class="breakdown-label">😊 Average Satisfaction</span>
                <div class="breakdown-bar"><div class="breakdown-fill" style="width: ${avgSatisfaction}%; background: ${avgSatisfaction >= 70 ? 'var(--color-positive)' : avgSatisfaction >= 40 ? 'var(--color-gold)' : 'var(--color-negative)'}"></div></div>
                <span class="breakdown-value">${avgSatisfaction}%</span>
            </div>
        `;
    }

    // Expose functions globally
    window.SimChurch = window.SimChurch || {};
    window.SimChurch.UI = {
        initializeUI,
        renderUI,
        animateStatChanges,
        animateWeekAdvance,
        disableNextWeek,
        enableNextWeek,
        // Staff modal functions
        openStaffModal,
        closeStaffModal,
        switchStaffTab,
        renderStaffModal,
        // Budget modal functions
        openBudgetModal,
        closeBudgetModal,
        switchBudgetTab,
        renderBudgetModal,
        // People modal functions
        openPeopleModal,
        closePeopleModal,
        switchPeopleTab,
        renderPeopleModal,
        setupPeopleModalEvents,
        // Event modal functions
        showEventModal,
        closeEventModal,
        checkAndShowEvent,
        handleEventChoice,
        // Policies modal functions
        openPoliciesModal,
        closePoliciesModal,
        switchPoliciesTab,
        renderPoliciesModal,
        // Statistics modal functions
        openStatsModal,
        closeStatsModal,
        renderStatsModal,
        // Visual feedback functions
        showToast,
        animateStatValue,
        renderChurchBuilding
    };
})();

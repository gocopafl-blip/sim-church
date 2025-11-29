/**
 * Sim Church - Main Entry Point
 * Initializes the game and sets up event handlers
 */

(function() {
    // Game configuration
    const config = {
        processingDelay: 300, // ms to show "processing" state
        autoSaveInterval: 60000 // Auto-save every 60 seconds (when implemented)
    };

    // Wait for all scripts to load
    function waitForDependencies(callback) {
        const checkInterval = setInterval(() => {
            if (window.SimChurch && 
                window.SimChurch.State && 
                window.SimChurch.Game && 
                window.SimChurch.UI &&
                window.SimChurch.Events &&
                window.SimChurch.Policies) {
                clearInterval(checkInterval);
                callback();
            }
        }, 10);
    }

    /**
     * Initialize the game
     */
    function initGame() {
        console.log('🏛️ Sim Church - Initializing...');
        
        const UI = window.SimChurch.UI;
        
        // Initialize UI first
        UI.initializeUI();
        
        // Set up event listeners
        setupEventListeners();
        
        // Show start menu
        showStartMenu();
        
        console.log('✅ Game initialized successfully!');
    }

    /**
     * Show the start menu
     */
    function showStartMenu() {
        const State = window.SimChurch.State;
        const startMenu = document.getElementById('start-menu');
        const continueBtn = document.getElementById('btn-continue');
        const continueInfo = document.getElementById('continue-info');
        
        // Check for saved game
        if (State.hasSavedGame()) {
            continueBtn.disabled = false;
            // Try to get save info
            try {
                const saved = localStorage.getItem('simchurch_save');
                if (saved) {
                    const data = JSON.parse(saved);
                    continueInfo.textContent = `Week ${data.meta.week} • ${data.church.name}`;
                }
            } catch (e) {
                continueInfo.textContent = 'Saved game available';
            }
        }
        
        startMenu.classList.remove('hidden');
        
        // Set up start menu event listeners
        setupStartMenuEvents();
    }

    /**
     * Set up start menu event listeners
     */
    function setupStartMenuEvents() {
        const newGameBtn = document.getElementById('btn-new-game');
        const continueBtn = document.getElementById('btn-continue');
        const modeBtns = document.querySelectorAll('.mode-btn');
        const showScenariosBtn = document.getElementById('btn-show-scenarios');
        const backToModesBtn = document.getElementById('btn-back-to-modes');
        
        newGameBtn.addEventListener('click', handleNewGame);
        continueBtn.addEventListener('click', handleContinueGame);
        
        modeBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                modeBtns.forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                
                // Show scenario selection when challenge is selected
                if (btn.dataset.mode === 'challenge') {
                    showScenarioSelection();
                }
            });
        });
        
        if (backToModesBtn) {
            backToModesBtn.addEventListener('click', hideScenarioSelection);
        }
    }

    let selectedScenario = null;

    /**
     * Show scenario selection panel
     */
    function showScenarioSelection() {
        const modeSelection = document.getElementById('mode-selection');
        const scenarioSelection = document.getElementById('scenario-selection');
        const scenarioList = document.getElementById('scenario-list');
        const Scenarios = window.SimChurch.Scenarios;
        
        if (!Scenarios) return;
        
        // Populate scenarios
        const scenarios = Scenarios.getScenarios();
        scenarioList.innerHTML = Object.values(scenarios).map(s => `
            <div class="scenario-card" data-scenario="${s.id}">
                <span class="scenario-icon">${s.icon}</span>
                <div class="scenario-info">
                    <div class="scenario-name">${s.name}</div>
                    <div class="scenario-desc">${s.description}</div>
                    <div class="scenario-meta">
                        <span class="scenario-difficulty ${s.difficulty.toLowerCase()}">${s.difficulty}</span>
                        ${s.timeLimit ? `<span>⏱️ ${s.timeLimit} weeks</span>` : '<span>∞ No time limit</span>'}
                    </div>
                </div>
            </div>
        `).join('');
        
        // Add click handlers
        scenarioList.querySelectorAll('.scenario-card').forEach(card => {
            card.addEventListener('click', () => {
                scenarioList.querySelectorAll('.scenario-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                selectedScenario = card.dataset.scenario;
            });
        });
        
        // Select first scenario by default
        const firstCard = scenarioList.querySelector('.scenario-card');
        if (firstCard) {
            firstCard.classList.add('selected');
            selectedScenario = firstCard.dataset.scenario;
        }
        
        modeSelection.classList.add('hidden');
        scenarioSelection.classList.remove('hidden');
    }

    /**
     * Hide scenario selection panel
     */
    function hideScenarioSelection() {
        const modeSelection = document.getElementById('mode-selection');
        const scenarioSelection = document.getElementById('scenario-selection');
        const sandboxBtn = document.querySelector('[data-mode="sandbox"]');
        
        scenarioSelection.classList.add('hidden');
        modeSelection.classList.remove('hidden');
        
        // Reset to sandbox mode
        document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('selected'));
        if (sandboxBtn) sandboxBtn.classList.add('selected');
        selectedScenario = null;
    }

    /**
     * Handle New Game button
     */
    function handleNewGame() {
        const State = window.SimChurch.State;
        const UI = window.SimChurch.UI;
        const Scenarios = window.SimChurch.Scenarios;
        const startMenu = document.getElementById('start-menu');
        const selectedMode = document.querySelector('.mode-btn.selected');
        const gameMode = selectedMode?.dataset.mode || 'sandbox';
        
        // Check if this is a challenge mode with a scenario
        if (gameMode === 'challenge' && selectedScenario && Scenarios) {
            Scenarios.startScenario(selectedScenario);
            startMenu.classList.add('hidden');
            UI.renderUI();
            renderGoalsDisplay();
            showTutorial();
            return;
        }
        
        // Initialize new sandbox game state
        State.initializeState();
        
        // Set game mode
        const state = State.getState();
        state.meta.gameMode = gameMode;
        
        // Add welcome news
        State.addNews('Welcome, Pastor! Your journey begins here. Click "Next Week" to advance time.', 'highlight');
        
        // Close start menu and render
        startMenu.classList.add('hidden');
        UI.renderUI();
        showTutorial();
        
        UI.showToast(`Started new ${gameMode} game!`, 'highlight');
    }

    /**
     * Render goals display for challenge mode
     */
    function renderGoalsDisplay() {
        const Scenarios = window.SimChurch.Scenarios;
        if (!Scenarios) return;
        
        const info = Scenarios.getScenarioInfo();
        if (!info || !info.active) {
            // Remove goals display if exists
            const existing = document.getElementById('goals-display');
            if (existing) existing.remove();
            return;
        }
        
        let goalsDisplay = document.getElementById('goals-display');
        if (!goalsDisplay) {
            goalsDisplay = document.createElement('div');
            goalsDisplay.id = 'goals-display';
            goalsDisplay.className = 'goals-display';
            document.body.appendChild(goalsDisplay);
        }
        
        const timeText = info.weeksRemaining !== null 
            ? `${info.weeksRemaining} weeks left` 
            : '∞';
        
        goalsDisplay.innerHTML = `
            <div class="goals-header">
                <span class="goals-title">${info.scenario.icon} ${info.scenario.name}</span>
                <span class="goals-time">⏱️ ${timeText}</span>
            </div>
            ${info.goals.map(goal => `
                <div class="goal-item">
                    <div class="goal-label">${goal.completed ? '✅' : '⬜'} ${goal.label}</div>
                    <div class="goal-progress-bar">
                        <div class="goal-progress-fill ${goal.completed ? 'complete' : ''}" 
                             style="width: ${goal.progress}%"></div>
                    </div>
                    <div class="goal-values">
                        <span>${goal.current}</span>
                        <span>${goal.target}</span>
                    </div>
                </div>
            `).join('')}
        `;
        
        // Check for victory/defeat
        if (info.victory) {
            const UI = window.SimChurch.UI;
            UI.showToast(`🎉 Victory! You completed ${info.scenario.name}!`, 'highlight', 5000);
        } else if (info.defeat) {
            const UI = window.SimChurch.UI;
            UI.showToast(`😔 Time's up! Challenge failed.`, 'negative', 5000);
        }
    }

    /**
     * Handle Continue Game button
     */
    function handleContinueGame() {
        const State = window.SimChurch.State;
        const UI = window.SimChurch.UI;
        const startMenu = document.getElementById('start-menu');
        
        const success = State.loadGame();
        
        if (success) {
            startMenu.classList.add('hidden');
            UI.renderUI();
            
            // Check if challenge mode, render goals
            const state = State.getState();
            if (state.meta.gameMode === 'challenge') {
                renderGoalsDisplay();
            }
            
            UI.showToast('Welcome back, Pastor!', 'positive');
        } else {
            UI.showToast('Failed to load saved game', 'negative');
        }
    }

    // ========================================
    // TUTORIAL SYSTEM
    // ========================================

    const TUTORIAL_STEPS = [
        {
            title: 'Welcome to Sim Church!',
            content: 'You are the pastor of a small church. Your goal is to grow your congregation, manage finances, and build a thriving community of faith.'
        },
        {
            title: 'The Basics',
            content: 'Click <strong>Next Week</strong> (or press Space) to advance time. Each week, your church will earn tithes, pay expenses, and may experience events.'
        },
        {
            title: 'Your Stats',
            content: '<strong>Attendance</strong> shows how many come on Sunday. <strong>Budget</strong> is your money. <strong>Reputation</strong> affects how the community sees you.'
        },
        {
            title: 'Managing Your Church',
            content: 'Use the action buttons to hire <strong>Staff</strong>, view your <strong>People</strong>, manage your <strong>Budget</strong>, and set <strong>Policies</strong> that shape your church\'s identity.'
        },
        {
            title: 'Ready to Begin!',
            content: 'That\'s the basics! Remember to save your game regularly. Good luck, Pastor!'
        }
    ];

    let tutorialStep = 0;
    let tutorialOverlay = null;

    /**
     * Show the tutorial
     */
    function showTutorial() {
        // Check if tutorial has been seen
        if (localStorage.getItem('simchurch_tutorial_seen')) {
            return;
        }
        
        tutorialStep = 0;
        renderTutorialStep();
    }

    /**
     * Render current tutorial step
     */
    function renderTutorialStep() {
        if (tutorialStep >= TUTORIAL_STEPS.length) {
            closeTutorial();
            return;
        }
        
        const step = TUTORIAL_STEPS[tutorialStep];
        
        if (!tutorialOverlay) {
            tutorialOverlay = document.createElement('div');
            tutorialOverlay.className = 'tutorial-overlay';
            tutorialOverlay.id = 'tutorial-overlay';
            document.body.appendChild(tutorialOverlay);
        }
        
        tutorialOverlay.innerHTML = `
            <div class="tutorial-card">
                <div class="tutorial-step">Step ${tutorialStep + 1} of ${TUTORIAL_STEPS.length}</div>
                <h2 class="tutorial-title">${step.title}</h2>
                <div class="tutorial-content">${step.content}</div>
                <div class="tutorial-buttons">
                    <button class="tutorial-btn secondary" id="tutorial-skip">Skip Tutorial</button>
                    <button class="tutorial-btn primary" id="tutorial-next">
                        ${tutorialStep < TUTORIAL_STEPS.length - 1 ? 'Next →' : 'Start Playing!'}
                    </button>
                </div>
            </div>
        `;
        
        document.getElementById('tutorial-next').addEventListener('click', nextTutorialStep);
        document.getElementById('tutorial-skip').addEventListener('click', closeTutorial);
    }

    /**
     * Go to next tutorial step
     */
    function nextTutorialStep() {
        tutorialStep++;
        renderTutorialStep();
    }

    /**
     * Close the tutorial
     */
    function closeTutorial() {
        localStorage.setItem('simchurch_tutorial_seen', 'true');
        if (tutorialOverlay) {
            tutorialOverlay.remove();
            tutorialOverlay = null;
        }
    }

    /**
     * Set up all event listeners
     */
    function setupEventListeners() {
        // Next Week button
        const btnNextWeek = document.getElementById('btn-next-week');
        btnNextWeek.addEventListener('click', handleNextWeek);
        
        // Speed buttons
        const speedBtns = document.querySelectorAll('.speed-btn');
        speedBtns.forEach(btn => {
            btn.addEventListener('click', handleSpeedChange);
        });
        
        // Settings button (placeholder for now)
        const btnSettings = document.getElementById('btn-settings');
        btnSettings.addEventListener('click', handleSettings);
        
        // Staff button
        const btnStaff = document.getElementById('btn-staff');
        btnStaff.addEventListener('click', handleStaffButton);
        
        // Budget button
        const btnBudget = document.getElementById('btn-budget');
        btnBudget.addEventListener('click', handleBudgetButton);
        
        // People button
        const btnPeople = document.getElementById('btn-congregation');
        btnPeople.addEventListener('click', handlePeopleButton);
        
        // Policies button
        const btnPolicies = document.getElementById('btn-policies');
        btnPolicies.addEventListener('click', handlePoliciesButton);
        
        // Statistics button
        const btnStats = document.getElementById('btn-stats');
        btnStats.addEventListener('click', handleStatsButton);
        
        // Save/Load/Exit buttons
        const btnSave = document.getElementById('btn-save');
        const btnLoad = document.getElementById('btn-load');
        const btnExit = document.getElementById('btn-exit');
        btnSave.addEventListener('click', handleSaveGame);
        btnLoad.addEventListener('click', handleLoadGame);
        btnExit.addEventListener('click', handleSaveAndExit);
        
        // Staff modal events
        setupStaffModalEvents();
        
        // Budget modal events
        setupBudgetModalEvents();
        
        // People modal events
        setupPeopleModalEvents();
        
        // Policies modal events
        setupPoliciesModalEvents();
        
        // Statistics modal events
        setupStatsModalEvents();
        
        // Keyboard shortcuts
        document.addEventListener('keydown', handleKeyboard);
    }
    
    /**
     * Set up staff modal event listeners
     */
    function setupStaffModalEvents() {
        const UI = window.SimChurch.UI;
        
        // Close button
        const closeBtn = document.getElementById('close-staff-modal');
        closeBtn.addEventListener('click', UI.closeStaffModal);
        
        // Overlay click to close
        const overlay = document.querySelector('#staff-modal .modal-overlay');
        overlay.addEventListener('click', UI.closeStaffModal);
        
        // Tab switching
        const tabBtns = document.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                UI.switchStaffTab(e.target.dataset.tab);
            });
        });
    }
    
    /**
     * Handle Staff button click
     */
    function handleStaffButton() {
        const UI = window.SimChurch.UI;
        UI.openStaffModal();
    }
    
    /**
     * Set up budget modal event listeners
     */
    function setupBudgetModalEvents() {
        const UI = window.SimChurch.UI;
        
        // Close button
        const closeBtn = document.getElementById('close-budget-modal');
        closeBtn.addEventListener('click', UI.closeBudgetModal);
        
        // Overlay click to close
        const overlay = document.querySelector('#budget-modal .modal-overlay');
        overlay.addEventListener('click', UI.closeBudgetModal);
        
        // Tab switching
        const tabBtns = document.querySelectorAll('#budget-modal .tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                UI.switchBudgetTab(e.target.dataset.tab);
            });
        });
    }
    
    /**
     * Handle Budget button click
     */
    function handleBudgetButton() {
        const UI = window.SimChurch.UI;
        UI.openBudgetModal();
    }
    
    /**
     * Set up people modal event listeners
     */
    function setupPeopleModalEvents() {
        const UI = window.SimChurch.UI;
        
        // Close button
        const closeBtn = document.getElementById('close-people-modal');
        closeBtn.addEventListener('click', UI.closePeopleModal);
        
        // Overlay click to close
        const overlay = document.querySelector('#people-modal .modal-overlay');
        overlay.addEventListener('click', UI.closePeopleModal);
        
        // Tab switching
        const tabBtns = document.querySelectorAll('#people-modal .tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                UI.switchPeopleTab(e.target.dataset.tab);
            });
        });
        
        // Set up filter/sort listeners
        UI.setupPeopleModalEvents();
    }
    
    /**
     * Handle People button click
     */
    function handlePeopleButton() {
        const UI = window.SimChurch.UI;
        UI.openPeopleModal();
    }
    
    /**
     * Set up policies modal event listeners
     */
    function setupPoliciesModalEvents() {
        const UI = window.SimChurch.UI;
        
        // Close button
        const closeBtn = document.getElementById('close-policies-modal');
        closeBtn.addEventListener('click', UI.closePoliciesModal);
        
        // Overlay click to close
        const overlay = document.querySelector('#policies-modal .modal-overlay');
        overlay.addEventListener('click', UI.closePoliciesModal);
        
        // Tab switching
        const tabBtns = document.querySelectorAll('#policies-modal .tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                UI.switchPoliciesTab(e.target.dataset.tab);
            });
        });
    }
    
    /**
     * Handle Policies button click
     */
    function handlePoliciesButton() {
        const UI = window.SimChurch.UI;
        UI.openPoliciesModal();
    }
    
    /**
     * Handle Statistics button click
     */
    function handleStatsButton() {
        const UI = window.SimChurch.UI;
        UI.openStatsModal();
    }
    
    /**
     * Set up statistics modal event listeners
     */
    function setupStatsModalEvents() {
        const UI = window.SimChurch.UI;
        
        // Close buttons
        const closeBtns = document.querySelectorAll('#stats-modal .modal-close-btn, #stats-modal [data-modal="stats-modal"]');
        closeBtns.forEach(btn => {
            btn.addEventListener('click', UI.closeStatsModal);
        });
        
        // Overlay click to close
        const overlay = document.querySelector('#stats-modal .modal-overlay');
        if (overlay) {
            overlay.addEventListener('click', UI.closeStatsModal);
        }
    }

    /**
     * Handle Next Week button click
     */
    async function handleNextWeek() {
        const State = window.SimChurch.State;
        const Game = window.SimChurch.Game;
        const UI = window.SimChurch.UI;
        
        // Disable button during processing
        UI.disableNextWeek();
        
        // Brief delay for UX feedback
        await delay(config.processingDelay);
        
        // Process the week
        const results = Game.processWeek();
        
        // Animate the week counter
        UI.animateWeekAdvance();
        
        // Update UI
        UI.renderUI();
        
        // Animate stat changes
        UI.animateStatChanges();
        
        // Re-enable button
        UI.enableNextWeek();
        
        // Check if a choice event was triggered
        if (results.event && results.event.type === 'choice') {
            // Show the event modal for player decision
            UI.showEventModal(results.event);
        }
        
        // Update goals display if in challenge mode
        renderGoalsDisplay();
        
        // Log to console for debugging
        console.log(`📅 Week ${State.getState().meta.week} processed:`, results);
        if (results.event) {
            console.log(`📣 Event triggered:`, results.event.title);
        }
    }

    /**
     * Handle speed button clicks
     * @param {Event} e - Click event
     */
    function handleSpeedChange(e) {
        const speedBtns = document.querySelectorAll('.speed-btn');
        
        // Remove active class from all
        speedBtns.forEach(btn => btn.classList.remove('active'));
        
        // Add active class to clicked button
        e.target.classList.add('active');
        
        // Get speed value (for future auto-advance feature)
        const speed = parseInt(e.target.dataset.speed);
        console.log(`⏱️ Speed set to ${speed}x`);
        
        // TODO: Implement auto-advance at different speeds
    }

    /**
     * Handle settings button click
     */
    function handleSettings() {
        console.log('⚙️ Settings clicked (not yet implemented)');
        // TODO: Implement settings modal
    }

    /**
     * Handle Save Game button click
     */
    function handleSaveGame() {
        const State = window.SimChurch.State;
        const UI = window.SimChurch.UI;
        
        const success = State.saveGame();
        
        if (success) {
            UI.showToast('Game saved successfully!', 'positive');
            console.log('💾 Game saved');
        } else {
            UI.showToast('Failed to save game', 'negative');
        }
    }

    /**
     * Handle Load Game button click
     */
    function handleLoadGame() {
        const State = window.SimChurch.State;
        const UI = window.SimChurch.UI;
        
        if (!State.hasSavedGame()) {
            UI.showToast('No saved game found', 'negative');
            return;
        }
        
        if (confirm('Load saved game? Current progress will be lost.')) {
            const success = State.loadGame();
            
            if (success) {
                UI.renderUI();
                UI.showToast('Game loaded successfully!', 'positive');
                console.log('📂 Game loaded');
            } else {
                UI.showToast('Failed to load game', 'negative');
            }
        }
    }

    /**
     * Handle Save and Exit button click
     */
    function handleSaveAndExit() {
        const State = window.SimChurch.State;
        const UI = window.SimChurch.UI;
        
        if (confirm('Save and return to main menu?')) {
            // Save the game first
            const success = State.saveGame();
            
            if (success) {
                UI.showToast('Game saved!', 'positive');
            }
            
            // Remove goals display if present
            const goalsDisplay = document.getElementById('goals-display');
            if (goalsDisplay) goalsDisplay.remove();
            
            // Show start menu
            showStartMenu();
        }
    }

    /**
     * Handle keyboard shortcuts
     * @param {KeyboardEvent} e - Keyboard event
     */
    function handleKeyboard(e) {
        const UI = window.SimChurch.UI;
        
        // Check if event modal is open (don't allow closing with ESC - player must choose)
        const eventModal = document.getElementById('event-modal');
        if (eventModal && !eventModal.classList.contains('hidden')) {
            // Only allow Enter/Space to click dismiss if single action event
            if (e.code === 'Space' || e.code === 'Enter') {
                const dismissBtn = document.getElementById('event-dismiss');
                if (dismissBtn) {
                    e.preventDefault();
                    dismissBtn.click();
                }
            }
            return; // Block all other shortcuts while event modal is open
        }
        
        // ESC to close modals
        if (e.code === 'Escape') {
            UI.closeStaffModal();
            UI.closeBudgetModal();
            UI.closePeopleModal();
            UI.closePoliciesModal();
            UI.closeStatsModal();
            return;
        }
        
        // Don't process other shortcuts if any modal is open
        const staffModal = document.getElementById('staff-modal');
        const budgetModal = document.getElementById('budget-modal');
        const peopleModal = document.getElementById('people-modal');
        const policiesModal = document.getElementById('policies-modal');
        if (!staffModal.classList.contains('hidden') || 
            !budgetModal.classList.contains('hidden') ||
            !peopleModal.classList.contains('hidden') ||
            !policiesModal.classList.contains('hidden')) {
            return;
        }
        
        // Spacebar or Enter to advance week
        if (e.code === 'Space' || e.code === 'Enter') {
            // Don't trigger if user is typing in an input
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }
            e.preventDefault();
            handleNextWeek();
        }
        
        // Number keys for speed
        if (e.code === 'Digit1') {
            document.querySelector('[data-speed="1"]')?.click();
        } else if (e.code === 'Digit2') {
            document.querySelector('[data-speed="2"]')?.click();
        } else if (e.code === 'Digit3') {
            document.querySelector('[data-speed="3"]')?.click();
        }
        
        // Ctrl+S to save
        if (e.ctrlKey && e.code === 'KeyS') {
            e.preventDefault();
            handleSaveGame();
        }
        
        // Ctrl+L to load
        if (e.ctrlKey && e.code === 'KeyL') {
            e.preventDefault();
            handleLoadGame();
        }
    }

    /**
     * Utility: Promise-based delay
     * @param {number} ms - Milliseconds to delay
     * @returns {Promise}
     */
    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // ========================================
    // START THE GAME
    // ========================================

    // Wait for DOM and dependencies, then initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            waitForDependencies(initGame);
        });
    } else {
        waitForDependencies(initGame);
    }
})();

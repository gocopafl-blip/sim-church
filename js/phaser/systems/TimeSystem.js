/**
 * TimeSystem - Day/Time Management
 * Handles game time progression, day/night cycle, and speed controls
 */

(function() {
    'use strict';

    window.SimChurch = window.SimChurch || {};
    window.SimChurch.Phaser = window.SimChurch.Phaser || {};

    // Time constants
    const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    // Speed settings (milliseconds of real time per in-game day)
    const SPEEDS = {
        slow: 4 * 60 * 1000,    // 4 minutes = 1 day
        normal: 2 * 60 * 1000,  // 2 minutes = 1 day
        fast: 60 * 1000         // 60 seconds = 1 day
    };

    // Hours in a day for display
    const HOURS_PER_DAY = 24;
    const SERVICE_HOURS = {
        morning: 10,    // 10 AM
        evening: 18     // 6 PM
    };

    // Time state
    const timeState = {
        currentDay: 0,          // 0 = Sunday, 6 = Saturday
        currentHour: 8,         // 0-23
        currentMinute: 0,       // 0-59
        currentWeek: 1,
        totalDays: 0,
        
        speed: 'normal',
        paused: true,           // Start paused until player unpauses
        
        accumulatedTime: 0,     // Accumulated real time (ms)
        
        // Callbacks
        onDayChange: null,
        onWeekChange: null,
        onHourChange: null,
        onServiceTime: null
    };

    /**
     * Initialize the time system
     */
    function init() {
        // Sync with existing game state if available
        const State = window.SimChurch?.State;
        if (State) {
            const gameState = State.getState();
            if (gameState && gameState.meta) {
                timeState.currentWeek = gameState.meta.week || 1;
                // Start on Sunday morning of the current week
                timeState.currentDay = 0;
                timeState.currentHour = 8;
                timeState.totalDays = (timeState.currentWeek - 1) * 7;
            }
        }
        
        console.log('[TimeSystem] Initialized:', {
            week: timeState.currentWeek,
            day: DAYS[timeState.currentDay],
            hour: timeState.currentHour
        });
    }

    /**
     * Update time based on elapsed real time
     * @param {number} delta - Time since last frame in ms
     */
    function update(delta) {
        if (timeState.paused) return;

        timeState.accumulatedTime += delta;
        
        const msPerDay = SPEEDS[timeState.speed];
        const msPerHour = msPerDay / HOURS_PER_DAY;
        const msPerMinute = msPerHour / 60;

        // Calculate minutes passed
        while (timeState.accumulatedTime >= msPerMinute) {
            timeState.accumulatedTime -= msPerMinute;
            advanceMinute();
        }
    }

    /**
     * Advance time by one minute
     */
    function advanceMinute() {
        timeState.currentMinute++;
        
        if (timeState.currentMinute >= 60) {
            timeState.currentMinute = 0;
            advanceHour();
        }
    }

    /**
     * Advance time by one hour
     */
    function advanceHour() {
        const previousHour = timeState.currentHour;
        timeState.currentHour++;
        
        if (timeState.currentHour >= 24) {
            timeState.currentHour = 0;
            advanceDay();
        }
        
        // Check for service times
        checkServiceTime(previousHour, timeState.currentHour);
        
        // Callback
        if (timeState.onHourChange) {
            timeState.onHourChange(timeState.currentHour, timeState.currentDay);
        }
    }

    /**
     * Advance to the next day
     */
    function advanceDay() {
        const previousDay = timeState.currentDay;
        timeState.currentDay++;
        timeState.totalDays++;
        
        if (timeState.currentDay >= 7) {
            timeState.currentDay = 0;
            advanceWeek();
        }
        
        console.log('[TimeSystem] Day changed:', DAYS[timeState.currentDay]);
        
        // Callback
        if (timeState.onDayChange) {
            timeState.onDayChange(timeState.currentDay, previousDay);
        }
    }

    /**
     * Advance to the next week
     */
    function advanceWeek() {
        timeState.currentWeek++;
        
        console.log('[TimeSystem] Week changed:', timeState.currentWeek);
        
        // Sync with game state
        const State = window.SimChurch?.State;
        const Game = window.SimChurch?.Game;
        
        if (State && Game) {
            // This triggers the existing weekly processing
            Game.processWeek();
        }
        
        // Callback
        if (timeState.onWeekChange) {
            timeState.onWeekChange(timeState.currentWeek);
        }
    }

    /**
     * Check if it's service time
     */
    function checkServiceTime(previousHour, currentHour) {
        // Sunday services
        if (timeState.currentDay === 0) {
            // Morning service at 10 AM
            if (previousHour < SERVICE_HOURS.morning && currentHour >= SERVICE_HOURS.morning) {
                triggerService('sunday-morning');
            }
            // Evening service at 6 PM
            if (previousHour < SERVICE_HOURS.evening && currentHour >= SERVICE_HOURS.evening) {
                triggerService('sunday-evening');
            }
        }
        
        // Wednesday evening service
        if (timeState.currentDay === 3) {
            if (previousHour < SERVICE_HOURS.evening && currentHour >= SERVICE_HOURS.evening) {
                triggerService('wednesday-evening');
            }
        }
    }

    /**
     * Trigger a service event
     */
    function triggerService(serviceType) {
        console.log('[TimeSystem] Service time:', serviceType);
        
        // Pause the game during services
        timeState.paused = true;
        
        if (timeState.onServiceTime) {
            timeState.onServiceTime(serviceType);
        }
    }

    /**
     * Get the current day name
     */
    function getDayName() {
        return DAYS[timeState.currentDay];
    }

    /**
     * Get formatted time string
     */
    function getTimeString() {
        const hour12 = timeState.currentHour % 12 || 12;
        const ampm = timeState.currentHour < 12 ? 'AM' : 'PM';
        const minutes = timeState.currentMinute.toString().padStart(2, '0');
        return `${hour12}:${minutes} ${ampm}`;
    }

    /**
     * Get time of day period
     */
    function getTimePeriod() {
        const hour = timeState.currentHour;
        if (hour >= 5 && hour < 12) return 'morning';
        if (hour >= 12 && hour < 17) return 'afternoon';
        if (hour >= 17 && hour < 21) return 'evening';
        return 'night';
    }

    /**
     * Get current speed name
     */
    function getSpeedName() {
        return timeState.speed.charAt(0).toUpperCase() + timeState.speed.slice(1);
    }

    /**
     * Set game speed
     */
    function setSpeed(speed) {
        if (SPEEDS[speed]) {
            timeState.speed = speed;
            console.log('[TimeSystem] Speed set to:', speed);
        }
    }

    /**
     * Toggle pause state
     */
    function togglePause() {
        timeState.paused = !timeState.paused;
        console.log('[TimeSystem] Paused:', timeState.paused);
        return timeState.paused;
    }

    /**
     * Set pause state
     */
    function setPaused(paused) {
        timeState.paused = paused;
    }

    /**
     * Check if paused
     */
    function isPaused() {
        return timeState.paused;
    }

    /**
     * Get current state
     */
    function getState() {
        return { ...timeState };
    }

    /**
     * Set callback for day change
     */
    function onDayChange(callback) {
        timeState.onDayChange = callback;
    }

    /**
     * Set callback for week change
     */
    function onWeekChange(callback) {
        timeState.onWeekChange = callback;
    }

    /**
     * Set callback for hour change
     */
    function onHourChange(callback) {
        timeState.onHourChange = callback;
    }

    /**
     * Set callback for service time
     */
    function onServiceTime(callback) {
        timeState.onServiceTime = callback;
    }

    // Expose the TimeSystem
    SimChurch.Phaser.TimeSystem = {
        init,
        update,
        getDayName,
        getTimeString,
        getTimePeriod,
        getSpeedName,
        setSpeed,
        togglePause,
        setPaused,
        isPaused,
        getState,
        onDayChange,
        onWeekChange,
        onHourChange,
        onServiceTime,
        DAYS,
        SPEEDS
    };

})();


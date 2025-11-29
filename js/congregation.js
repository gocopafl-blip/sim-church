/**
 * Sim Church - Congregation System
 * Manages individual congregation members, their behaviors, and satisfaction
 */

(function() {
    const State = window.SimChurch.State;
    const Names = window.SimChurch.Data.Names;

    // ========================================
    // CONSTANTS & DEFINITIONS
    // ========================================

    const AGE_GROUPS = {
        child: { name: 'Child', range: [0, 12], icon: '👶' },
        youth: { name: 'Youth', range: [13, 17], icon: '🧒' },
        youngAdult: { name: 'Young Adult', range: [18, 30], icon: '👤' },
        middleAge: { name: 'Middle Age', range: [31, 55], icon: '🧑' },
        senior: { name: 'Senior', range: [56, 90], icon: '👴' }
    };

    const ATTENDANCE_PATTERNS = {
        visitor: { name: 'Visitor', frequency: 0.3, icon: '👋' },
        sporadic: { name: 'Sporadic', frequency: 0.5, icon: '🔄' },
        regular: { name: 'Regular', frequency: 0.85, icon: '✅' },
        dedicated: { name: 'Dedicated', frequency: 0.95, icon: '⭐' }
    };

    const GIVING_LEVELS = {
        nonGiver: { name: 'Non-Giver', weeklyAmount: 0, icon: '➖' },
        occasional: { name: 'Occasional', weeklyAmount: [5, 20], icon: '💵' },
        tither: { name: 'Tither', weeklyAmount: [25, 75], icon: '💰' },
        generous: { name: 'Generous', weeklyAmount: [100, 300], icon: '💎' }
    };

    const INTERESTS = [
        'music', 'outreach', 'children', 'youth', 'prayer',
        'bible study', 'fellowship', 'missions', 'hospitality', 'counseling'
    ];

    // ========================================
    // MEMBER GENERATION
    // ========================================

    /**
     * Generate a random age based on church demographics
     * @returns {number} Age
     */
    function generateAge() {
        // Weighted distribution favoring middle age and young adults
        const roll = Math.random();
        if (roll < 0.15) return randomInRange(0, 12);      // 15% children
        if (roll < 0.25) return randomInRange(13, 17);     // 10% youth
        if (roll < 0.45) return randomInRange(18, 30);     // 20% young adult
        if (roll < 0.80) return randomInRange(31, 55);     // 35% middle age
        return randomInRange(56, 85);                       // 20% seniors
    }

    /**
     * Get age group from age
     * @param {number} age - Age in years
     * @returns {string} Age group key
     */
    function getAgeGroup(age) {
        if (age <= 12) return 'child';
        if (age <= 17) return 'youth';
        if (age <= 30) return 'youngAdult';
        if (age <= 55) return 'middleAge';
        return 'senior';
    }

    /**
     * Generate a giving level based on age and randomness
     * @param {number} age - Member's age
     * @returns {string} Giving level key
     */
    function generateGivingLevel(age) {
        // Children don't give
        if (age < 18) return 'nonGiver';
        
        // Adults have weighted giving patterns
        const roll = Math.random();
        if (roll < 0.25) return 'nonGiver';      // 25% non-givers
        if (roll < 0.50) return 'occasional';    // 25% occasional
        if (roll < 0.85) return 'tither';        // 35% tithers
        return 'generous';                        // 15% generous
    }

    /**
     * Generate random interests for a member
     * @param {number} count - Number of interests (1-3)
     * @returns {Array} Array of interest strings
     */
    function generateInterests(count = null) {
        if (count === null) {
            count = Math.floor(Math.random() * 3) + 1; // 1-3 interests
        }
        
        const selected = [];
        const available = [...INTERESTS];
        
        for (let i = 0; i < count && available.length > 0; i++) {
            const index = Math.floor(Math.random() * available.length);
            selected.push(available.splice(index, 1)[0]);
        }
        
        return selected;
    }

    /**
     * Generate a new congregation member
     * @param {Object} options - Optional overrides
     * @returns {Object} Member object
     */
    function generateMember(options = {}) {
        const state = State.getState();
        const age = options.age || generateAge();
        const ageGroup = getAgeGroup(age);
        
        const member = {
            id: `member_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: options.name || Names.generateName(),
            age: age,
            ageGroup: ageGroup,
            joinedWeek: options.joinedWeek || state.meta.week,
            attendancePattern: options.attendancePattern || 'visitor',
            satisfaction: options.satisfaction || randomInRange(60, 80),
            givingLevel: options.givingLevel || generateGivingLevel(age),
            interests: options.interests || generateInterests(),
            concerns: [],
            familyId: options.familyId || null,
            lastAttended: state.meta.week,
            totalAttendance: 0,
            invitedBy: options.invitedBy || null
        };
        
        return member;
    }

    /**
     * Generate a family unit
     * @returns {Array} Array of family members
     */
    function generateFamily() {
        const familyId = `family_${Date.now()}`;
        const lastName = Names.lastNames[Math.floor(Math.random() * Names.lastNames.length)];
        const members = [];
        
        // Generate parents (1-2 adults)
        const numParents = Math.random() < 0.7 ? 2 : 1;
        for (let i = 0; i < numParents; i++) {
            const firstName = Names.firstNames[Math.floor(Math.random() * Names.firstNames.length)];
            members.push(generateMember({
                name: `${firstName} ${lastName}`,
                age: randomInRange(28, 55),
                familyId: familyId,
                attendancePattern: 'regular'
            }));
        }
        
        // Maybe generate children (0-4)
        const numChildren = Math.floor(Math.random() * 4);
        for (let i = 0; i < numChildren; i++) {
            const firstName = Names.firstNames[Math.floor(Math.random() * Names.firstNames.length)];
            members.push(generateMember({
                name: `${firstName} ${lastName}`,
                age: randomInRange(3, 17),
                familyId: familyId,
                attendancePattern: 'regular',
                givingLevel: 'nonGiver'
            }));
        }
        
        return members;
    }

    /**
     * Generate initial congregation for a new game
     * @param {number} targetSize - Target congregation size
     * @returns {Array} Array of members
     */
    function generateInitialCongregation(targetSize = 50) {
        const members = [];
        
        // Generate some families (about 60% of attendance)
        const familyTarget = Math.floor(targetSize * 0.6);
        let familyCount = 0;
        while (familyCount < familyTarget) {
            const family = generateFamily();
            members.push(...family);
            familyCount += family.length;
        }
        
        // Generate singles/individuals for the rest
        const singlesTarget = targetSize - members.length;
        for (let i = 0; i < singlesTarget; i++) {
            const member = generateMember({
                attendancePattern: Math.random() < 0.7 ? 'regular' : 'sporadic'
            });
            members.push(member);
        }
        
        return members;
    }

    // ========================================
    // MEMBER BEHAVIORS
    // ========================================

    /**
     * Process weekly congregation behaviors
     * @returns {Object} Results of processing
     */
    function processWeeklyBehaviors() {
        const state = State.getState();
        const results = {
            newVisitors: 0,
            conversions: 0,
            departures: 0,
            attendedThisWeek: 0
        };
        
        // Process each member
        state.congregation.forEach(member => {
            // Determine if they attend this week
            const pattern = ATTENDANCE_PATTERNS[member.attendancePattern];
            const willAttend = Math.random() < pattern.frequency;
            
            if (willAttend) {
                member.lastAttended = state.meta.week;
                member.totalAttendance++;
                results.attendedThisWeek++;
            }
            
            // Update satisfaction based on various factors
            updateMemberSatisfaction(member, state);
            
            // Check for pattern changes
            checkPatternChange(member, results);
        });
        
        // Generate new visitors based on reputation
        const newVisitors = generateNewVisitors(state);
        results.newVisitors = newVisitors.length;
        state.congregation.push(...newVisitors);
        results.attendedThisWeek += newVisitors.length;
        
        // Check for invites from happy members
        const invited = processInvitations(state);
        results.newVisitors += invited.length;
        state.congregation.push(...invited);
        
        // Remove members who have left
        const beforeCount = state.congregation.length;
        state.congregation = state.congregation.filter(m => !m.hasLeft);
        results.departures = beforeCount - state.congregation.length;
        
        return results;
    }

    /**
     * Update a member's satisfaction
     * @param {Object} member - Member to update
     * @param {Object} state - Game state
     */
    function updateMemberSatisfaction(member, state) {
        let change = 0;
        
        // Base random fluctuation
        change += randomInRange(-3, 3);
        
        // Staff quality bonus
        if (state.staff.length > 0) {
            change += randomInRange(0, 2);
        }
        
        // Reputation effect
        if (state.stats.reputation > 70) {
            change += 1;
        } else if (state.stats.reputation < 40) {
            change -= 2;
        }
        
        // Program spending effect (more programs = happier members)
        const programSpending = state.finances.weeklyExpenses.programs;
        if (programSpending >= 200) {
            change += 1;
        } else if (programSpending < 50) {
            change -= 1;
        }
        
        // Long-time members are more stable
        const weeksAttending = state.meta.week - member.joinedWeek;
        if (weeksAttending > 20) {
            change = Math.round(change * 0.5); // More stable
        }
        
        // Apply change with bounds
        member.satisfaction = clamp(member.satisfaction + change, 0, 100);
    }

    /**
     * Check if member should change attendance pattern
     * @param {Object} member - Member to check
     * @param {Object} results - Results object to update
     */
    function checkPatternChange(member, results) {
        const state = State.getState();
        
        // Visitors may become regular or leave
        if (member.attendancePattern === 'visitor') {
            const weeksVisiting = state.meta.week - member.joinedWeek;
            
            if (weeksVisiting >= 4) {
                if (member.satisfaction >= 70) {
                    // Convert to sporadic/regular
                    member.attendancePattern = member.satisfaction >= 85 ? 'regular' : 'sporadic';
                    results.conversions++;
                } else if (member.satisfaction < 50 || weeksVisiting > 8) {
                    // Leave
                    member.hasLeft = true;
                }
            }
        }
        
        // Regular members may become sporadic or dedicated
        else if (member.attendancePattern === 'regular') {
            if (member.satisfaction < 50) {
                member.attendancePattern = 'sporadic';
            } else if (member.satisfaction >= 90 && Math.random() < 0.1) {
                member.attendancePattern = 'dedicated';
            }
        }
        
        // Sporadic members may become regular or leave
        else if (member.attendancePattern === 'sporadic') {
            if (member.satisfaction >= 75 && Math.random() < 0.2) {
                member.attendancePattern = 'regular';
            } else if (member.satisfaction < 40 && Math.random() < 0.3) {
                member.hasLeft = true;
            }
        }
    }

    /**
     * Generate new visitors based on reputation
     * @param {Object} state - Game state
     * @returns {Array} New visitor members
     */
    function generateNewVisitors(state) {
        const visitors = [];
        
        // Base chance of visitors, modified by reputation
        const baseChance = 0.3;
        const reputationBonus = (state.stats.reputation - 50) / 100;
        const visitorChance = baseChance + reputationBonus;
        
        // 0-3 potential visitors per week
        const potentialVisitors = Math.floor(Math.random() * 4);
        
        for (let i = 0; i < potentialVisitors; i++) {
            if (Math.random() < visitorChance) {
                // Sometimes visitors come as families
                if (Math.random() < 0.3) {
                    visitors.push(...generateFamily().map(m => ({
                        ...m,
                        attendancePattern: 'visitor'
                    })));
                } else {
                    visitors.push(generateMember({ attendancePattern: 'visitor' }));
                }
            }
        }
        
        return visitors;
    }

    /**
     * Process invitations from happy members
     * @param {Object} state - Game state
     * @returns {Array} Invited visitors
     */
    function processInvitations(state) {
        const invited = [];
        
        // Very satisfied members may invite friends
        const happyMembers = state.congregation.filter(m => 
            m.satisfaction >= 85 && 
            m.attendancePattern !== 'visitor' &&
            m.age >= 18
        );
        
        happyMembers.forEach(member => {
            // 5% chance per happy adult member to invite someone
            if (Math.random() < 0.05) {
                const newVisitor = generateMember({
                    attendancePattern: 'visitor',
                    invitedBy: member.id
                });
                invited.push(newVisitor);
            }
        });
        
        return invited;
    }

    // ========================================
    // GIVING CALCULATIONS
    // ========================================

    /**
     * Calculate total giving from congregation for this week
     * @returns {number} Total weekly giving
     */
    function calculateWeeklyGiving() {
        const state = State.getState();
        let total = 0;
        
        state.congregation.forEach(member => {
            // Only members who attended this week give
            if (member.lastAttended !== state.meta.week) return;
            
            const level = GIVING_LEVELS[member.givingLevel];
            if (level.weeklyAmount === 0) return;
            
            // Calculate giving based on level
            const [min, max] = level.weeklyAmount;
            let amount = randomInRange(min, max);
            
            // Satisfaction affects giving
            const satisfactionMod = member.satisfaction / 100;
            amount = Math.round(amount * satisfactionMod);
            
            total += amount;
        });
        
        return total;
    }

    // ========================================
    // STATISTICS & QUERIES
    // ========================================

    /**
     * Get congregation statistics
     * @returns {Object} Stats object
     */
    function getStats() {
        const state = State.getState();
        const members = state.congregation;
        
        if (members.length === 0) {
            return {
                total: 0,
                byPattern: {},
                byAgeGroup: {},
                byGiving: {},
                avgSatisfaction: 0,
                activeThisWeek: 0
            };
        }
        
        // Count by pattern
        const byPattern = {};
        Object.keys(ATTENDANCE_PATTERNS).forEach(key => {
            byPattern[key] = members.filter(m => m.attendancePattern === key).length;
        });
        
        // Count by age group
        const byAgeGroup = {};
        Object.keys(AGE_GROUPS).forEach(key => {
            byAgeGroup[key] = members.filter(m => m.ageGroup === key).length;
        });
        
        // Count by giving level
        const byGiving = {};
        Object.keys(GIVING_LEVELS).forEach(key => {
            byGiving[key] = members.filter(m => m.givingLevel === key).length;
        });
        
        // Average satisfaction
        const avgSatisfaction = Math.round(
            members.reduce((sum, m) => sum + m.satisfaction, 0) / members.length
        );
        
        // Active this week
        const activeThisWeek = members.filter(m => 
            m.lastAttended === state.meta.week
        ).length;
        
        return {
            total: members.length,
            byPattern,
            byAgeGroup,
            byGiving,
            avgSatisfaction,
            activeThisWeek
        };
    }

    /**
     * Get members filtered and sorted
     * @param {Object} options - Filter options
     * @returns {Array} Filtered members
     */
    function getMembers(options = {}) {
        const state = State.getState();
        let members = [...state.congregation];
        
        // Filter by pattern
        if (options.pattern) {
            members = members.filter(m => m.attendancePattern === options.pattern);
        }
        
        // Filter by age group
        if (options.ageGroup) {
            members = members.filter(m => m.ageGroup === options.ageGroup);
        }
        
        // Sort
        if (options.sortBy === 'satisfaction') {
            members.sort((a, b) => b.satisfaction - a.satisfaction);
        } else if (options.sortBy === 'name') {
            members.sort((a, b) => a.name.localeCompare(b.name));
        } else if (options.sortBy === 'joined') {
            members.sort((a, b) => b.joinedWeek - a.joinedWeek);
        }
        
        // Limit
        if (options.limit) {
            members = members.slice(0, options.limit);
        }
        
        return members;
    }

    // ========================================
    // UTILITY FUNCTIONS
    // ========================================

    function randomInRange(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    // ========================================
    // EXPORTS
    // ========================================

    // Expose functions globally
    window.SimChurch = window.SimChurch || {};
    window.SimChurch.Congregation = {
        // Generation
        generateMember,
        generateFamily,
        generateInitialCongregation,
        // Processing
        processWeeklyBehaviors,
        calculateWeeklyGiving,
        // Queries
        getStats,
        getMembers,
        // Constants
        AGE_GROUPS,
        ATTENDANCE_PATTERNS,
        GIVING_LEVELS,
        INTERESTS
    };
})();


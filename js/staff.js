/**
 * Sim Church - Staff System
 * Handles staff positions, hiring, and management
 * Inspired by Theme Hospital's brilliant hiring mechanics
 */

(function() {
    const State = window.SimChurch.State;
    const Names = window.SimChurch.Data.Names;
    const Traits = window.SimChurch.Data.Traits;

    // ========================================
    // STAFF POSITION DEFINITIONS
    // ========================================
    
    const positions = {
        associatePastor: {
            id: 'associatePastor',
            title: 'Associate Pastor',
            icon: '👔',
            description: 'Assists with preaching, counseling, and pastoral care',
            primarySkill: 'preaching',
            secondarySkill: 'counseling',
            baseSalary: 800,
            salaryRange: [650, 1000],
            unlockAtAttendance: 0,
            maxPositions: 2,
            effects: {
                attendanceBonus: 5,
                reputationBonus: 2,
                moraleBonus: 3
            }
        },
        youthPastor: {
            id: 'youthPastor',
            title: 'Youth Pastor',
            icon: '🎸',
            description: 'Leads teen and young adult ministry',
            primarySkill: 'youthConnection',
            secondarySkill: 'creativity',
            baseSalary: 650,
            salaryRange: [500, 850],
            unlockAtAttendance: 50,
            maxPositions: 1,
            effects: {
                youthAttraction: 10,
                attendanceBonus: 3,
                energyBonus: 5
            }
        },
        worshipLeader: {
            id: 'worshipLeader',
            title: 'Worship Leader',
            icon: '🎵',
            description: 'Leads music and worship services',
            primarySkill: 'musicalTalent',
            secondarySkill: 'leadership',
            baseSalary: 600,
            salaryRange: [450, 800],
            unlockAtAttendance: 30,
            maxPositions: 1,
            effects: {
                worshipQuality: 15,
                attendanceBonus: 4,
                moraleBonus: 5
            }
        },
        childrensDirector: {
            id: 'childrensDirector',
            title: "Children's Director",
            icon: '🧒',
            description: 'Oversees all children\'s programs',
            primarySkill: 'patience',
            secondarySkill: 'creativity',
            baseSalary: 550,
            salaryRange: [400, 700],
            unlockAtAttendance: 40,
            maxPositions: 1,
            effects: {
                familyAttraction: 12,
                attendanceBonus: 3,
                safetyRating: 10
            }
        },
        adminAssistant: {
            id: 'adminAssistant',
            title: 'Administrative Assistant',
            icon: '📋',
            description: 'Manages office operations and communications',
            primarySkill: 'organization',
            secondarySkill: 'communication',
            baseSalary: 450,
            salaryRange: [350, 600],
            unlockAtAttendance: 0,
            maxPositions: 2,
            effects: {
                efficiency: 15,
                communicationBonus: 10,
                errorReduction: 20
            }
        },
        outreachCoordinator: {
            id: 'outreachCoordinator',
            title: 'Outreach Coordinator',
            icon: '🌍',
            description: 'Coordinates community outreach programs',
            primarySkill: 'communication',
            secondarySkill: 'compassion',
            baseSalary: 500,
            salaryRange: [400, 650],
            unlockAtAttendance: 60,
            maxPositions: 1,
            effects: {
                outreachBonus: 20,
                reputationBonus: 5,
                communityConnection: 15
            }
        }
    };

    // ========================================
    // SKILL DEFINITIONS
    // ========================================

    const skills = {
        preaching: { name: 'Preaching', icon: '🎤' },
        counseling: { name: 'Counseling', icon: '💬' },
        youthConnection: { name: 'Youth Connection', icon: '🤙' },
        creativity: { name: 'Creativity', icon: '🎨' },
        musicalTalent: { name: 'Musical Talent', icon: '🎵' },
        leadership: { name: 'Leadership', icon: '👑' },
        patience: { name: 'Patience', icon: '🧘' },
        organization: { name: 'Organization', icon: '📁' },
        communication: { name: 'Communication', icon: '📣' },
        compassion: { name: 'Compassion', icon: '❤️' },
        administration: { name: 'Administration', icon: '📊' },
        peopleSkills: { name: 'People Skills', icon: '🤝' }
    };

    // ========================================
    // CANDIDATE GENERATION
    // ========================================

    /**
     * Generate a random skill level (1-10)
     * @param {boolean} isPrimary - Is this the primary skill for the position
     * @returns {number} Skill level 1-10
     */
    function generateSkillLevel(isPrimary = false) {
        // Primary skills tend to be higher (5-10), secondary (3-8), others (1-6)
        if (isPrimary) {
            return Math.floor(Math.random() * 6) + 5; // 5-10
        }
        return Math.floor(Math.random() * 6) + 3; // 3-8
    }

    /**
     * Generate a random salary expectation
     * @param {Object} position - Position definition
     * @param {Object} skillLevels - Candidate's skills
     * @returns {number} Weekly salary expectation
     */
    function generateSalaryExpectation(position, skillLevels) {
        const [min, max] = position.salaryRange;
        const range = max - min;
        
        // Higher skills = higher salary expectation
        const primarySkill = skillLevels[position.primarySkill] || 5;
        const skillFactor = (primarySkill - 1) / 9; // 0 to 1 based on skill
        
        // Add some randomness
        const randomFactor = (Math.random() * 0.3) - 0.15; // -15% to +15%
        
        const salary = min + (range * skillFactor) + (range * randomFactor);
        return Math.round(salary / 25) * 25; // Round to nearest $25
    }

    /**
     * Generate a backstory snippet for a candidate
     * @param {Object} position - Position definition
     * @returns {string} Backstory text
     */
    function generateBackstory(position) {
        const backstories = {
            associatePastor: [
                "Recently graduated from seminary, eager to serve.",
                "Has 5 years experience at a small rural church.",
                "Former missionary returning to pastoral ministry.",
                "Transitioning from a career in counseling.",
                "Grew up in this denomination, feels called to ministry."
            ],
            youthPastor: [
                "Just finished youth ministry internship.",
                "Former Young Life leader with great energy.",
                "Has a heart for reaching the next generation.",
                "College campus ministry background.",
                "Was a youth group kid who wants to give back."
            ],
            worshipLeader: [
                "Classically trained musician seeking ministry role.",
                "Led worship at a church plant for 3 years.",
                "Professional musician feeling called to serve.",
                "Self-taught guitarist with a passion for worship.",
                "Former choir director at a large church."
            ],
            childrensDirector: [
                "Elementary school teacher transitioning to ministry.",
                "Parent volunteer who's ready to lead.",
                "Has run VBS programs for 10 years.",
                "Early childhood education background.",
                "Sunday school teacher with big ideas."
            ],
            adminAssistant: [
                "Office management experience in corporate sector.",
                "Looking for meaningful work in a church setting.",
                "Organized and detail-oriented church member.",
                "Former executive assistant seeking change.",
                "Recent graduate with admin skills."
            ],
            outreachCoordinator: [
                "Non-profit background with community focus.",
                "Passionate about serving the underserved.",
                "Former social worker with big vision.",
                "Has organized multiple community events.",
                "Believes the church should be the hands and feet."
            ]
        };

        const options = backstories[position.id] || ["Seeking a new opportunity in ministry."];
        return options[Math.floor(Math.random() * options.length)];
    }

    /**
     * Generate a single candidate for a position
     * @param {string} positionId - ID of the position
     * @returns {Object} Candidate object
     */
    function generateCandidate(positionId) {
        const position = positions[positionId];
        if (!position) return null;

        const name = Names.generateName();
        const traits = Traits.generateRandomTraits();
        
        // Generate skills
        const skillLevels = {
            [position.primarySkill]: generateSkillLevel(true),
            [position.secondarySkill]: generateSkillLevel(false),
            administration: generateSkillLevel(false),
            peopleSkills: generateSkillLevel(false)
        };

        const salary = generateSalaryExpectation(position, skillLevels);
        const backstory = generateBackstory(position);

        return {
            id: `candidate_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name,
            positionId,
            position: position.title,
            skills: skillLevels,
            traits,
            salaryExpectation: salary,
            backstory,
            generatedWeek: State.getCurrentWeek(),
            // Candidates expire after 3 weeks if not hired
            expiresWeek: State.getCurrentWeek() + 3
        };
    }

    /**
     * Generate weekly candidates (0-3 new candidates)
     * @returns {Array} Array of new candidates
     */
    function generateWeeklyCandidates() {
        const state = State.getState();
        const newCandidates = [];
        
        // Determine how many candidates appear (0-3)
        const numCandidates = Math.floor(Math.random() * 4); // 0, 1, 2, or 3
        
        if (numCandidates === 0) {
            return newCandidates;
        }

        // Get available positions (unlocked and not at max)
        const availablePositions = Object.values(positions).filter(pos => {
            // Check if unlocked
            if (state.stats.attendance < pos.unlockAtAttendance) {
                return false;
            }
            // Check if at max capacity
            const currentCount = state.staff.filter(s => s.positionId === pos.id).length;
            if (currentCount >= pos.maxPositions) {
                return false;
            }
            return true;
        });

        if (availablePositions.length === 0) {
            return newCandidates;
        }

        // Generate candidates for random available positions
        for (let i = 0; i < numCandidates; i++) {
            const randomPos = availablePositions[Math.floor(Math.random() * availablePositions.length)];
            const candidate = generateCandidate(randomPos.id);
            if (candidate) {
                newCandidates.push(candidate);
            }
        }

        return newCandidates;
    }

    /**
     * Remove expired candidates
     */
    function removeExpiredCandidates() {
        const state = State.getState();
        const currentWeek = state.meta.week;
        
        state.candidates = state.candidates.filter(c => c.expiresWeek > currentWeek);
    }

    // ========================================
    // HIRING & MANAGEMENT
    // ========================================

    /**
     * Hire a candidate
     * @param {string} candidateId - ID of candidate to hire
     * @returns {Object} Result with success status and message
     */
    function hireCandidate(candidateId) {
        const state = State.getState();
        const candidateIndex = state.candidates.findIndex(c => c.id === candidateId);
        
        if (candidateIndex === -1) {
            return { success: false, message: 'Candidate not found' };
        }

        const candidate = state.candidates[candidateIndex];
        const position = positions[candidate.positionId];

        // Check if position is still available
        const currentCount = state.staff.filter(s => s.positionId === candidate.positionId).length;
        if (currentCount >= position.maxPositions) {
            const maxMsg = position.maxPositions === 1 
                ? `You can only have one ${position.title}.`
                : `You already have the maximum number of ${position.title}s (${position.maxPositions}).`;
            alert(`Position Full!\n\n${maxMsg}\n\nYou'll need to let someone go before hiring another.`);
            return { success: false, message: `Already have maximum ${position.title}s` };
        }

        // Create staff member from candidate
        const staffMember = {
            id: `staff_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: candidate.name,
            positionId: candidate.positionId,
            position: candidate.position,
            skills: candidate.skills,
            traits: candidate.traits,
            salary: candidate.salaryExpectation,
            hiredWeek: state.meta.week,
            morale: 80, // Start with good morale
            energy: 100,
            loyalty: 50
        };

        // Add to staff, remove from candidates
        state.staff.push(staffMember);
        state.candidates.splice(candidateIndex, 1);

        // Add news
        State.addNews(`Welcome ${staffMember.name}! They joined as ${staffMember.position}.`, 'positive');

        return { success: true, message: `Hired ${staffMember.name} as ${staffMember.position}`, staff: staffMember };
    }

    /**
     * Fire a staff member
     * @param {string} staffId - ID of staff to fire
     * @returns {Object} Result with success status and message
     */
    function fireStaff(staffId) {
        const state = State.getState();
        const staffIndex = state.staff.findIndex(s => s.id === staffId);
        
        if (staffIndex === -1) {
            return { success: false, message: 'Staff member not found' };
        }

        const staffMember = state.staff[staffIndex];
        
        // Remove from staff
        state.staff.splice(staffIndex, 1);

        // Affect team morale slightly
        state.staff.forEach(s => {
            s.morale = Math.max(0, s.morale - 5);
        });

        State.addNews(`${staffMember.name} has left the church staff.`, 'normal');

        return { success: true, message: `${staffMember.name} has been let go` };
    }

    /**
     * Pass on a candidate (remove from pool)
     * @param {string} candidateId - ID of candidate to pass on
     */
    function passOnCandidate(candidateId) {
        const state = State.getState();
        state.candidates = state.candidates.filter(c => c.id !== candidateId);
    }

    /**
     * Calculate total weekly staff salaries
     * @returns {number} Total weekly salary expense
     */
    function calculateTotalSalaries() {
        const state = State.getState();
        return state.staff.reduce((total, staff) => total + staff.salary, 0);
    }

    /**
     * Calculate staff effects on church stats
     * @returns {Object} Bonuses from staff
     */
    function calculateStaffEffects() {
        const state = State.getState();
        const effects = {
            attendanceBonus: 0,
            reputationBonus: 0,
            moraleBonus: 0,
            outreachBonus: 0
        };

        state.staff.forEach(staffMember => {
            const position = positions[staffMember.positionId];
            if (!position) return;

            // Base position effects (scaled by average skill level)
            const avgSkill = Object.values(staffMember.skills).reduce((a, b) => a + b, 0) / 
                           Object.values(staffMember.skills).length;
            const skillMultiplier = avgSkill / 10; // 0.1 to 1.0

            if (position.effects.attendanceBonus) {
                effects.attendanceBonus += Math.round(position.effects.attendanceBonus * skillMultiplier);
            }
            if (position.effects.reputationBonus) {
                effects.reputationBonus += Math.round(position.effects.reputationBonus * skillMultiplier);
            }
            if (position.effects.moraleBonus) {
                effects.moraleBonus += Math.round(position.effects.moraleBonus * skillMultiplier);
            }
            if (position.effects.outreachBonus) {
                effects.outreachBonus += Math.round(position.effects.outreachBonus * skillMultiplier);
            }

            // Trait effects
            staffMember.traits.forEach(traitId => {
                const trait = Traits.getTrait(traitId);
                if (!trait) return;

                if (trait.effects.teamMoraleBonus) {
                    effects.moraleBonus += trait.effects.teamMoraleBonus;
                }
                if (trait.effects.teamMoralePenalty) {
                    effects.moraleBonus += trait.effects.teamMoralePenalty;
                }
            });
        });

        return effects;
    }

    /**
     * Get all position definitions
     * @returns {Object} Positions object
     */
    function getPositions() {
        return positions;
    }

    /**
     * Get skill definition
     * @param {string} skillId - Skill ID
     * @returns {Object} Skill definition
     */
    function getSkill(skillId) {
        return skills[skillId] || { name: skillId, icon: '📊' };
    }

    /**
     * Get all available positions for hiring (unlocked, not at max)
     * @returns {Array} Available positions
     */
    function getAvailablePositions() {
        const state = State.getState();
        
        return Object.values(positions).filter(pos => {
            if (state.stats.attendance < pos.unlockAtAttendance) {
                return false;
            }
            const currentCount = state.staff.filter(s => s.positionId === pos.id).length;
            return currentCount < pos.maxPositions;
        });
    }

    // Expose functions globally
    window.SimChurch = window.SimChurch || {};
    window.SimChurch.Staff = {
        generateCandidate,
        generateWeeklyCandidates,
        removeExpiredCandidates,
        hireCandidate,
        fireStaff,
        passOnCandidate,
        calculateTotalSalaries,
        calculateStaffEffects,
        getPositions,
        getSkill,
        getAvailablePositions
    };
})();


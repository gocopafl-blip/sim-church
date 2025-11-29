/**
 * Sim Church - Policies & Beliefs System
 * Defines church identity through policy choices
 */

(function() {
    const State = window.SimChurch.State;

    // ========================================
    // POLICY DEFINITIONS
    // ========================================

    const POLICY_CATEGORIES = {
        // === WORSHIP & SERVICE ===
        worshipStyle: {
            id: 'worshipStyle',
            name: 'Worship Style',
            icon: '🎵',
            description: 'The musical and liturgical style of your services',
            category: 'worship',
            options: {
                traditional: {
                    id: 'traditional',
                    name: 'Traditional',
                    description: 'Hymns, organ, formal liturgy',
                    icon: '🎹',
                    effects: {
                        attractsAgeGroups: ['senior', 'middleAge'],
                        repelsAgeGroups: ['youngAdult', 'teen'],
                        reputationModifier: 0,
                        givingModifier: 1.1, // Traditional givers tend to give more
                        attendanceGrowthModifier: 0.9
                    }
                },
                contemporary: {
                    id: 'contemporary',
                    name: 'Contemporary',
                    description: 'Modern worship bands, casual atmosphere',
                    icon: '🎸',
                    effects: {
                        attractsAgeGroups: ['youngAdult', 'teen', 'child'],
                        repelsAgeGroups: ['senior'],
                        reputationModifier: 5,
                        givingModifier: 0.9,
                        attendanceGrowthModifier: 1.2
                    }
                },
                blended: {
                    id: 'blended',
                    name: 'Blended',
                    description: 'Mix of traditional and contemporary elements',
                    icon: '🎶',
                    effects: {
                        attractsAgeGroups: ['middleAge', 'youngAdult'],
                        repelsAgeGroups: [],
                        reputationModifier: 2,
                        givingModifier: 1.0,
                        attendanceGrowthModifier: 1.0
                    }
                }
            },
            default: 'blended'
        },

        serviceLength: {
            id: 'serviceLength',
            name: 'Service Length',
            icon: '⏱️',
            description: 'How long your Sunday services typically run',
            category: 'worship',
            options: {
                short: {
                    id: 'short',
                    name: 'Short (45 min)',
                    description: 'Quick, focused services for busy families',
                    icon: '⚡',
                    effects: {
                        attractsAgeGroups: ['youngAdult', 'child'],
                        repelsAgeGroups: ['senior'],
                        spiritualHealthModifier: -5,
                        attendanceGrowthModifier: 1.1,
                        satisfactionModifier: 0
                    }
                },
                standard: {
                    id: 'standard',
                    name: 'Standard (75 min)',
                    description: 'Traditional service length',
                    icon: '⏰',
                    effects: {
                        attractsAgeGroups: [],
                        repelsAgeGroups: [],
                        spiritualHealthModifier: 0,
                        attendanceGrowthModifier: 1.0,
                        satisfactionModifier: 0
                    }
                },
                long: {
                    id: 'long',
                    name: 'Extended (2+ hrs)',
                    description: 'Deep worship and teaching time',
                    icon: '🕐',
                    effects: {
                        attractsAgeGroups: ['senior', 'middleAge'],
                        repelsAgeGroups: ['youngAdult', 'child'],
                        spiritualHealthModifier: 10,
                        attendanceGrowthModifier: 0.85,
                        satisfactionModifier: 5
                    }
                }
            },
            default: 'standard'
        },

        // === THEOLOGY & BELIEFS ===
        theologicalStance: {
            id: 'theologicalStance',
            name: 'Theological Stance',
            icon: '📖',
            description: 'Your church\'s position on doctrinal matters',
            category: 'beliefs',
            options: {
                conservative: {
                    id: 'conservative',
                    name: 'Conservative',
                    description: 'Traditional interpretation of scripture',
                    icon: '📕',
                    effects: {
                        attractsAgeGroups: ['senior', 'middleAge'],
                        repelsAgeGroups: [],
                        reputationModifier: -5, // Some community friction
                        givingModifier: 1.15,
                        spiritualHealthModifier: 5
                    }
                },
                moderate: {
                    id: 'moderate',
                    name: 'Moderate',
                    description: 'Balanced approach to doctrine',
                    icon: '📗',
                    effects: {
                        attractsAgeGroups: [],
                        repelsAgeGroups: [],
                        reputationModifier: 5,
                        givingModifier: 1.0,
                        spiritualHealthModifier: 0
                    }
                },
                progressive: {
                    id: 'progressive',
                    name: 'Progressive',
                    description: 'Contemporary interpretation and inclusivity focus',
                    icon: '📘',
                    effects: {
                        attractsAgeGroups: ['youngAdult', 'teen'],
                        repelsAgeGroups: ['senior'],
                        reputationModifier: 10,
                        givingModifier: 0.9,
                        spiritualHealthModifier: -5
                    }
                }
            },
            default: 'moderate'
        },

        // === COMMUNITY & MEMBERSHIP ===
        membershipRequirements: {
            id: 'membershipRequirements',
            name: 'Membership Requirements',
            icon: '📋',
            description: 'How people officially join your church',
            category: 'community',
            options: {
                open: {
                    id: 'open',
                    name: 'Open Door',
                    description: 'Anyone can join with minimal process',
                    icon: '🚪',
                    effects: {
                        attendanceGrowthModifier: 1.2,
                        givingModifier: 0.85,
                        satisfactionModifier: -5, // Less connected
                        conversionRate: 1.3 // Visitors become members faster
                    }
                },
                classes: {
                    id: 'classes',
                    name: 'Classes Required',
                    description: 'New member classes before joining',
                    icon: '📚',
                    effects: {
                        attendanceGrowthModifier: 1.0,
                        givingModifier: 1.0,
                        satisfactionModifier: 5,
                        conversionRate: 1.0
                    }
                },
                strict: {
                    id: 'strict',
                    name: 'Strict Process',
                    description: 'Interview, classes, and commitment covenant',
                    icon: '✍️',
                    effects: {
                        attendanceGrowthModifier: 0.8,
                        givingModifier: 1.2,
                        satisfactionModifier: 10,
                        conversionRate: 0.7
                    }
                }
            },
            default: 'classes'
        },

        communityFocus: {
            id: 'communityFocus',
            name: 'Community Focus',
            icon: '🎯',
            description: 'Where your church directs its energy',
            category: 'community',
            options: {
                inward: {
                    id: 'inward',
                    name: 'Member Care',
                    description: 'Focus on nurturing existing members',
                    icon: '🏠',
                    effects: {
                        satisfactionModifier: 15,
                        attendanceGrowthModifier: 0.7,
                        communityOutreachModifier: -10,
                        retentionBonus: 1.3 // Members stay longer
                    }
                },
                balanced: {
                    id: 'balanced',
                    name: 'Balanced',
                    description: 'Equal focus on members and outreach',
                    icon: '⚖️',
                    effects: {
                        satisfactionModifier: 5,
                        attendanceGrowthModifier: 1.0,
                        communityOutreachModifier: 0,
                        retentionBonus: 1.0
                    }
                },
                outward: {
                    id: 'outward',
                    name: 'Evangelism Focus',
                    description: 'Prioritize reaching new people',
                    icon: '🌍',
                    effects: {
                        satisfactionModifier: -5,
                        attendanceGrowthModifier: 1.4,
                        communityOutreachModifier: 15,
                        retentionBonus: 0.85
                    }
                }
            },
            default: 'balanced'
        },

        // === LEADERSHIP & GOVERNANCE ===
        decisionMaking: {
            id: 'decisionMaking',
            name: 'Decision Making',
            icon: '🗳️',
            description: 'How major decisions are made',
            category: 'governance',
            options: {
                pastorLed: {
                    id: 'pastorLed',
                    name: 'Pastor-Led',
                    description: 'Pastor makes final decisions',
                    icon: '👔',
                    effects: {
                        policyChangeSpeed: 1.5, // Can change policies faster
                        satisfactionModifier: -5,
                        conflictChance: 0.8
                    }
                },
                elderBoard: {
                    id: 'elderBoard',
                    name: 'Elder Board',
                    description: 'Council of elders guide decisions',
                    icon: '👥',
                    effects: {
                        policyChangeSpeed: 1.0,
                        satisfactionModifier: 5,
                        conflictChance: 1.0
                    }
                },
                congregational: {
                    id: 'congregational',
                    name: 'Congregational Vote',
                    description: 'Members vote on major decisions',
                    icon: '🗳️',
                    effects: {
                        policyChangeSpeed: 0.5, // Slower to change
                        satisfactionModifier: 10,
                        conflictChance: 1.3
                    }
                }
            },
            default: 'elderBoard'
        },

        financialTransparency: {
            id: 'financialTransparency',
            name: 'Financial Transparency',
            icon: '💰',
            description: 'How open you are about church finances',
            category: 'governance',
            options: {
                private: {
                    id: 'private',
                    name: 'Private',
                    description: 'Only leadership sees finances',
                    icon: '🔒',
                    effects: {
                        givingModifier: 0.9,
                        satisfactionModifier: -10,
                        trustModifier: -15
                    }
                },
                partial: {
                    id: 'partial',
                    name: 'Partial',
                    description: 'Annual reports and general updates',
                    icon: '📊',
                    effects: {
                        givingModifier: 1.0,
                        satisfactionModifier: 0,
                        trustModifier: 0
                    }
                },
                full: {
                    id: 'full',
                    name: 'Full Transparency',
                    description: 'Detailed monthly reports available to all',
                    icon: '📈',
                    effects: {
                        givingModifier: 1.1,
                        satisfactionModifier: 5,
                        trustModifier: 10
                    }
                }
            },
            default: 'partial'
        }
    };

    // Category groupings for UI
    const CATEGORY_GROUPS = {
        worship: {
            name: 'Worship & Service',
            icon: '⛪',
            policies: ['worshipStyle', 'serviceLength']
        },
        beliefs: {
            name: 'Theology & Beliefs',
            icon: '📖',
            policies: ['theologicalStance']
        },
        community: {
            name: 'Community & Membership',
            icon: '👥',
            policies: ['membershipRequirements', 'communityFocus']
        },
        governance: {
            name: 'Leadership & Governance',
            icon: '🏛️',
            policies: ['decisionMaking', 'financialTransparency']
        }
    };

    // ========================================
    // POLICY FUNCTIONS
    // ========================================

    /**
     * Get all policy categories
     * @returns {Object} Policy categories
     */
    function getPolicyCategories() {
        return POLICY_CATEGORIES;
    }

    /**
     * Get category groups for UI organization
     * @returns {Object} Category groups
     */
    function getCategoryGroups() {
        return CATEGORY_GROUPS;
    }

    /**
     * Get current policy settings from state
     * @returns {Object} Current policies
     */
    function getCurrentPolicies() {
        const state = State.getState();
        return state.policies || getDefaultPolicies();
    }

    /**
     * Get default policy settings
     * @returns {Object} Default policies
     */
    function getDefaultPolicies() {
        const defaults = {};
        Object.keys(POLICY_CATEGORIES).forEach(policyId => {
            defaults[policyId] = POLICY_CATEGORIES[policyId].default;
        });
        return defaults;
    }

    /**
     * Set a policy value
     * @param {string} policyId - Policy category ID
     * @param {string} optionId - Selected option ID
     * @returns {Object} Result with success and any consequences
     */
    function setPolicy(policyId, optionId) {
        const state = State.getState();
        const policy = POLICY_CATEGORIES[policyId];
        
        if (!policy) {
            return { success: false, message: 'Invalid policy' };
        }
        
        if (!policy.options[optionId]) {
            return { success: false, message: 'Invalid option' };
        }
        
        const oldOption = state.policies[policyId];
        const isChange = oldOption !== optionId;
        
        // Update the policy
        state.policies[policyId] = optionId;
        
        // Track policy change in history
        if (isChange) {
            state.policyHistory = state.policyHistory || [];
            state.policyHistory.unshift({
                policyId,
                from: oldOption,
                to: optionId,
                week: state.meta.week,
                timestamp: Date.now()
            });
            
            // Keep last 20 changes
            if (state.policyHistory.length > 20) {
                state.policyHistory.pop();
            }
            
            // Calculate consequences of policy change
            const consequences = calculatePolicyChangeConsequences(policyId, oldOption, optionId);
            
            return { 
                success: true, 
                changed: true,
                consequences 
            };
        }
        
        return { success: true, changed: false };
    }

    /**
     * Calculate consequences when a policy changes
     * @param {string} policyId - Policy that changed
     * @param {string} oldOption - Previous option
     * @param {string} newOption - New option
     * @returns {Object} Consequences
     */
    function calculatePolicyChangeConsequences(policyId, oldOption, newOption) {
        const state = State.getState();
        const policy = POLICY_CATEGORIES[policyId];
        const consequences = {
            moraleChange: 0,
            reputationChange: 0,
            membersUpset: 0,
            newsMessage: null
        };
        
        // Base consequence: any change causes some disruption
        consequences.moraleChange = -5;
        
        // Calculate how "dramatic" the change is
        const optionKeys = Object.keys(policy.options);
        const oldIndex = optionKeys.indexOf(oldOption);
        const newIndex = optionKeys.indexOf(newOption);
        const changeMagnitude = Math.abs(newIndex - oldIndex);
        
        // Bigger changes = bigger consequences
        if (changeMagnitude > 1) {
            consequences.moraleChange -= 10;
            consequences.membersUpset = Math.floor(state.congregation.length * 0.1);
            consequences.newsMessage = `Major shift in ${policy.name}! Some members are concerned about the direction.`;
        } else {
            consequences.newsMessage = `${policy.name} policy adjusted to ${policy.options[newOption].name}.`;
        }
        
        // Apply immediate consequences
        state.stats.congregationMorale = Math.max(0, 
            state.stats.congregationMorale + consequences.moraleChange
        );
        
        // Add news
        if (consequences.newsMessage) {
            State.addNews(`📜 ${consequences.newsMessage}`, changeMagnitude > 1 ? 'negative' : 'normal');
        }
        
        return consequences;
    }

    /**
     * Calculate combined effects of all current policies
     * @returns {Object} Combined policy effects
     */
    function calculatePolicyEffects() {
        const policies = getCurrentPolicies();
        
        const effects = {
            reputationModifier: 0,
            givingModifier: 1.0,
            attendanceGrowthModifier: 1.0,
            satisfactionModifier: 0,
            spiritualHealthModifier: 0,
            communityOutreachModifier: 0,
            conversionRate: 1.0,
            retentionBonus: 1.0,
            trustModifier: 0,
            attractsAgeGroups: new Set(),
            repelsAgeGroups: new Set()
        };
        
        // Combine effects from all policies
        Object.keys(policies).forEach(policyId => {
            const optionId = policies[policyId];
            const policy = POLICY_CATEGORIES[policyId];
            const option = policy?.options[optionId];
            
            if (option?.effects) {
                const e = option.effects;
                
                // Additive modifiers
                if (e.reputationModifier) effects.reputationModifier += e.reputationModifier;
                if (e.satisfactionModifier) effects.satisfactionModifier += e.satisfactionModifier;
                if (e.spiritualHealthModifier) effects.spiritualHealthModifier += e.spiritualHealthModifier;
                if (e.communityOutreachModifier) effects.communityOutreachModifier += e.communityOutreachModifier;
                if (e.trustModifier) effects.trustModifier += e.trustModifier;
                
                // Multiplicative modifiers
                if (e.givingModifier) effects.givingModifier *= e.givingModifier;
                if (e.attendanceGrowthModifier) effects.attendanceGrowthModifier *= e.attendanceGrowthModifier;
                if (e.conversionRate) effects.conversionRate *= e.conversionRate;
                if (e.retentionBonus) effects.retentionBonus *= e.retentionBonus;
                
                // Age group attractions/repulsions
                if (e.attractsAgeGroups) {
                    e.attractsAgeGroups.forEach(ag => effects.attractsAgeGroups.add(ag));
                }
                if (e.repelsAgeGroups) {
                    e.repelsAgeGroups.forEach(ag => effects.repelsAgeGroups.add(ag));
                }
            }
        });
        
        // Convert sets to arrays for easier use
        effects.attractsAgeGroups = Array.from(effects.attractsAgeGroups);
        effects.repelsAgeGroups = Array.from(effects.repelsAgeGroups);
        
        return effects;
    }

    /**
     * Check if a congregation member's preferences align with policies
     * @param {Object} member - Congregation member
     * @returns {number} Alignment score (-100 to +100)
     */
    function calculateMemberPolicyAlignment(member) {
        const effects = calculatePolicyEffects();
        let alignment = 0;
        
        // Check age group alignment
        if (effects.attractsAgeGroups.includes(member.ageGroup)) {
            alignment += 20;
        }
        if (effects.repelsAgeGroups.includes(member.ageGroup)) {
            alignment -= 30;
        }
        
        // Add base satisfaction modifier
        alignment += effects.satisfactionModifier;
        
        return Math.max(-100, Math.min(100, alignment));
    }

    /**
     * Get a summary of current policies for display
     * @returns {Array} Policy summaries
     */
    function getPolicySummary() {
        const policies = getCurrentPolicies();
        const summaries = [];
        
        Object.keys(policies).forEach(policyId => {
            const policy = POLICY_CATEGORIES[policyId];
            const optionId = policies[policyId];
            const option = policy.options[optionId];
            
            summaries.push({
                policyId,
                policyName: policy.name,
                policyIcon: policy.icon,
                optionId,
                optionName: option.name,
                optionIcon: option.icon,
                description: option.description
            });
        });
        
        return summaries;
    }

    /**
     * Get policy change history
     * @param {number} limit - Max items to return
     * @returns {Array} Policy change history
     */
    function getPolicyHistory(limit = 10) {
        const state = State.getState();
        return (state.policyHistory || []).slice(0, limit);
    }

    // ========================================
    // EXPORTS
    // ========================================

    window.SimChurch = window.SimChurch || {};
    window.SimChurch.Policies = {
        POLICY_CATEGORIES,
        CATEGORY_GROUPS,
        getPolicyCategories,
        getCategoryGroups,
        getCurrentPolicies,
        getDefaultPolicies,
        setPolicy,
        calculatePolicyEffects,
        calculateMemberPolicyAlignment,
        getPolicySummary,
        getPolicyHistory
    };
})();


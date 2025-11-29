# Sim Church — Game Design Document

> **Version:** 1.0 (All Core Phases Complete)  
> **Last Updated:** November 29, 2025  
> **Status:** Playable — Ready for Content Expansion

---

## Table of Contents

1. [Game Overview](#1-game-overview)
2. [Core Game Loop](#2-core-game-loop)
3. [Primary Statistics](#3-primary-statistics)
4. [Staff System](#4-staff-system)
5. [Congregation System](#5-congregation-system)
6. [Financial System](#6-financial-system)
7. [Policies & Beliefs](#7-policies--beliefs)
8. [Events & Conflicts](#8-events--conflicts)
9. [Game Modes](#9-game-modes)
10. [UI/UX Design](#10-uiux-design)
11. [Technical Architecture](#11-technical-architecture)
12. [Art & Audio Direction](#12-art--audio-direction)
13. [Development Phases](#13-development-phases)
14. [Task Checklist](#14-task-checklist)
15. [Ideas Backlog](#15-ideas-backlog)
16. [Session Notes](#16-session-notes)

---

## 1. Game Overview

### 1.1 Concept
**Sim Church** is a management simulation game where the player takes on the role of a young pastor experiencing their first pastoral position. Inspired by classic Maxis "Sim" games (SimCity, SimAnt) and Bullfrog's "Theme" series (Theme Hospital), players will manage resources, hire staff, set policies, and grow their church while navigating interpersonal challenges.

### 1.2 Inspirations
| Game | What We're Taking |
|------|-------------------|
| **SimCity** | City-building progression, balancing multiple stats, sandbox freedom |
| **SimAnt** | Managing a colony of individuals, emergent behaviors |
| **Theme Hospital** | Staff hiring system with randomized candidates, personality traits, skill levels |
| **Game Dev Tycoon** | Decision-making that affects outcomes, reputation mechanics |

### 1.3 Core Experience
The player should feel like they're:
- Making meaningful decisions with real tradeoffs
- Watching their church grow (or struggle) based on their choices
- Managing personalities, not just numbers
- Experiencing emergent stories from the simulation

### 1.4 Starting Scenarios
Players can choose to:
1. **Start a New Church** — Begin from scratch with limited funds, no congregation, hire your first staff
2. **Accept an Established Position** — Inherit an existing church with staff, congregation, budget (and problems!)

---

## 2. Core Game Loop

### 2.1 Time System
- Game progresses in **weekly ticks**
- Each week:
  1. **Sunday Service** occurs (attendance calculated)
  2. **Income** collected (tithes, donations)
  3. **Expenses** paid (salaries, utilities, programs)
  4. **Events** may trigger (random or scheduled)
  5. **Stats update** based on all factors

### 2.2 Player Actions Per Week
- Review staff and make hiring/firing decisions
- Adjust budget allocations
- Respond to events/conflicts
- Set or change policies
- Start new programs/ministries
- Interact with specific congregation members (optional)

### 2.3 Progression
- **Short-term:** Weekly stat changes, immediate event outcomes
- **Mid-term:** Monthly/quarterly reviews, staff development, program results
- **Long-term:** Church growth milestones, reputation in community, building expansions

---

## 3. Primary Statistics

### 3.1 The Big Three
These are always visible and represent overall church health:

| Stat | Description | Influenced By |
|------|-------------|---------------|
| 📊 **Attendance** | Weekly service attendance | Reputation, programs, staff quality, events |
| 💰 **Budget Balance** | Current funds (can go negative!) | Tithes, expenses, financial decisions |
| ⭐ **Reputation** | Community perception (0-100) | Decisions, scandals, outreach, word-of-mouth |

### 3.2 Secondary Statistics
Tracked but not always prominently displayed:

| Stat | Description |
|------|-------------|
| 😊 **Congregation Morale** | Overall happiness of members |
| 👔 **Staff Morale** | How happy/burnt out staff are |
| 🙏 **Spiritual Health** | Abstract measure of church's spiritual vitality |
| 🤝 **Community Outreach** | How much the church serves the local area |
| 📈 **Growth Rate** | Trend of attendance over time |

### 3.3 Stat Interactions
- High **Reputation** → Attracts new visitors → Increases **Attendance**
- Low **Staff Morale** → Poor service quality → Decreases **Congregation Morale**
- Good **Outreach** → Improves **Reputation** → But costs **Budget**
- High **Attendance** → More **Tithes** → Better **Budget Balance**

---

## 4. Staff System

> *Inspired by Theme Hospital's brilliant hiring mechanics*

### 4.1 Staff Positions

| Position | Role | Key Skills |
|----------|------|------------|
| **Senior Pastor** | (Player) Overall leadership | — |
| **Associate Pastor** | Assists with preaching, counseling | Preaching, Counseling, Administration |
| **Youth Pastor** | Teen/young adult ministry | Youth Connection, Energy, Creativity |
| **Worship Leader** | Music and worship services | Musical Talent, Leadership, Creativity |
| **Children's Director** | Kids programs | Patience, Creativity, Organization |
| **Administrative Assistant** | Office management | Organization, Communication, Tech Skills |
| **Custodian/Janitor** | Building maintenance | Reliability, Attention to Detail |
| **Outreach Coordinator** | Community programs | Communication, Compassion, Organization |

### 4.2 Staff Attributes

Each staff member has:

#### Skills (1-10 scale)
```
Primary Skill:     ████████░░ 8/10  (Role-specific main skill)
Secondary Skill:   ██████░░░░ 6/10  (Supporting skill)
Administration:    ████░░░░░░ 4/10  (Paperwork, organization)
People Skills:     ███████░░░ 7/10  (Interpersonal effectiveness)
```

#### Personality Traits
Each staff member has 1-2 personality traits that affect gameplay:

**Positive Traits:**
- 💪 **Hard Worker** — Gets more done, but may burn out faster
- 😊 **Cheerful** — Boosts morale of those around them
- 📚 **Learner** — Skills improve faster over time
- 🤝 **Team Player** — Works well with others, reduces conflicts
- 🎯 **Dedicated** — Less likely to leave, loyal

**Negative Traits:**
- 😤 **Difficult** — Creates friction with other staff
- 😴 **Lazy** — Lower productivity
- 💰 **Greedy** — Demands raises more often
- 🎭 **Prima Donna** — High maintenance, needs praise
- 🚪 **Flight Risk** — May leave for better opportunities

**Neutral/Mixed Traits:**
- 🔥 **Passionate** — High highs, low lows
- 🤫 **Introverted** — Great one-on-one, struggles with groups
- 📢 **Extroverted** — Great with crowds, may overlook individuals

### 4.3 Hiring System

#### The Candidate Pool
- Each week, 0-3 new candidates become available
- Candidates are **randomly generated** with:
  - Random skill levels (weighted by position)
  - Random personality traits (1-2)
  - Salary expectation (based on skills + randomness)
  - Sometimes a "backstory" snippet

#### Hiring Interface
```
┌─────────────────────────────────────────────────────────┐
│  📋 AVAILABLE CANDIDATES                                │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────┐   │
│  │ SARAH MARTINEZ — Youth Pastor Candidate         │   │
│  │ ──────────────────────────────────────────────  │   │
│  │ Youth Connection: ████████░░ 8    Salary: $650/wk│  │
│  │ Energy:           ██████░░░░ 6                   │   │
│  │ Creativity:       █████░░░░░ 5                   │   │
│  │ Administration:   ███░░░░░░░ 3                   │   │
│  │ ──────────────────────────────────────────────  │   │
│  │ Traits: 💪 Hard Worker, 🔥 Passionate            │   │
│  │ "Recently graduated from seminary, eager to     │   │
│  │  make an impact with young people."             │   │
│  │                                                  │   │
│  │  [HIRE - $650/wk]  [PASS]  [NEGOTIATE]          │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ ROBERT CHEN — Youth Pastor Candidate            │   │
│  │ ...                                              │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### 4.4 Staff Management

#### Salary & Raises
- Staff expect periodic raises
- Underpaying leads to decreased morale → quitting
- Overpaying strains budget but increases loyalty

#### Training
- Invest money to train staff
- Improves skills over time
- Some traits affect training speed (📚 Learner)

#### Fatigue & Burnout
- Staff have an energy/stamina meter
- Overworked staff become less effective
- Severe burnout → mistakes, conflicts, quitting

#### Firing
- Can fire staff at any time
- May require severance pay
- Affects morale of remaining staff
- Some congregation members may leave with popular staff

---

## 5. Congregation System

### 5.1 Congregation as Individuals
Rather than just a number, congregation members are (simplified) individuals:

```javascript
congregationMember = {
  name: "John Smith",
  age: 45,
  memberSince: week 12,
  attendancePattern: "regular",  // regular, sporadic, visitor
  satisfaction: 75,              // 0-100
  givingLevel: "tither",         // non-giver, occasional, tither, generous
  connections: ["Mary Smith", "Bob Johnson"],  // social ties
  interests: ["music", "outreach"],
  concerns: []                   // current issues they have
}
```

### 5.2 Congregation Behaviors
- **Visitors** → May become **Regular** if satisfied
- **Regular** members → May become **Sporadic** if dissatisfied
- **Sporadic** → May leave entirely
- Members with strong **Connections** are stickier
- Unhappy members may **Gossip** (spread dissatisfaction)
- Happy members **Invite** others (organic growth)

### 5.3 Demographics
Track congregation makeup:
- Age distribution (children, youth, young adult, middle-age, seniors)
- Family units vs. singles
- New visitors vs. established members
- Giving patterns

Different demographics have different needs and respond to different programs.

---

## 6. Financial System

### 6.1 Income Sources

| Source | Description | Factors |
|--------|-------------|---------|
| **Weekly Tithes** | Regular giving from members | Attendance × avg giving × satisfaction |
| **Special Offerings** | One-time designated gifts | Events, campaigns, reputation |
| **Building Rentals** | Rent facilities to community | Building size, reputation |
| **Fundraisers** | Special events | Staff effort, planning, community ties |

### 6.2 Expenses

| Expense | Description | Notes |
|---------|-------------|-------|
| **Staff Salaries** | Weekly payroll | Largest expense usually |
| **Utilities** | Electric, water, etc. | Scales with building size |
| **Building Maintenance** | Repairs, upkeep | Neglect → problems |
| **Programs** | Ministry budgets | Youth, children, outreach, etc. |
| **Supplies** | Office, worship, etc. | Basic operational costs |
| **Mortgage/Rent** | Building payments | If applicable |

### 6.3 Budget Management Interface
```
┌─────────────────────────────────────────────────────────┐
│  💰 WEEKLY BUDGET OVERVIEW                              │
├─────────────────────────────────────────────────────────┤
│  INCOME                          EXPENSES               │
│  ────────────────────           ────────────────────    │
│  Tithes:        $4,200          Salaries:    $2,800    │
│  Offerings:       $350          Utilities:     $400    │
│  Rentals:         $200          Programs:      $600    │
│                                 Maintenance:   $200    │
│                                 Supplies:      $150    │
│  ────────────────────           ────────────────────    │
│  TOTAL:         $4,750          TOTAL:       $4,150    │
│                                                         │
│  NET THIS WEEK: +$600     BANK BALANCE: $12,450        │
└─────────────────────────────────────────────────────────┘
```

### 6.4 Financial Decisions
- Allocate budget percentages to different areas
- Decide on staff salaries
- Choose to save vs. invest in growth
- Handle shortfalls (cut programs? reduce staff? special fundraising?)

---

## 7. Policies & Beliefs

### 7.1 Core Beliefs
At game start (or inherited), choose theological positions that affect gameplay:

| Belief Area | Options | Gameplay Effect |
|-------------|---------|-----------------|
| **Worship Style** | Traditional / Contemporary / Blended | Affects who's attracted, staff needs |
| **Dress Code** | Formal / Casual / No Policy | Member expectations, visitor comfort |
| **Theology** | Conservative / Moderate / Progressive | Community perception, member base |
| **Service Length** | Short (45min) / Standard (75min) / Long (2hr+) | Attendance patterns, depth |

### 7.2 Operational Policies

| Policy | Options | Tradeoffs |
|--------|---------|-----------|
| **Membership Requirements** | Open / Classes Required / Strict | Growth vs. commitment |
| **Volunteer Expectations** | Encouraged / Expected / Required | Engagement vs. burnout |
| **Financial Transparency** | Full / Partial / Private | Trust vs. complexity |
| **Decision Making** | Pastor-led / Elder Board / Congregational | Speed vs. buy-in |

### 7.3 Policy Effects
- Policies attract certain types of people, repel others
- Changing policies mid-game can cause conflict
- Some combinations work well together, others clash

---

## 8. Events & Conflicts

### 8.1 Random Events
Events trigger periodically and require player response:

#### Positive Events
- A wealthy visitor is considering joining
- Local news wants to feature your outreach program
- A skilled worship leader is looking for a church
- Anonymous donation received

#### Negative Events
- Staff conflict erupts
- Key family threatens to leave
- Building issue requires immediate repair
- Gossip spreading about a decision you made

#### Neutral/Choice Events
- Another church invites collaboration (benefit vs. time cost)
- Member asks for significant counseling time
- Community requests building use for secular event

### 8.2 Conflict Resolution
When conflicts arise, player chooses response:

```
┌─────────────────────────────────────────────────────────┐
│  ⚠️ CONFLICT: Staff Disagreement                        │
├─────────────────────────────────────────────────────────┤
│  Your Worship Leader (Mike) and Youth Pastor (Sarah)    │
│  are in conflict over the direction of youth worship.   │
│  Mike wants traditional hymns, Sarah wants contemporary │
│  music. The tension is affecting Sunday services.       │
│                                                         │
│  How do you respond?                                    │
│                                                         │
│  [A] Side with Mike (traditional)                       │
│      → Sarah's morale drops, may affect youth program   │
│                                                         │
│  [B] Side with Sarah (contemporary)                     │
│      → Mike's morale drops, some older members unhappy  │
│                                                         │
│  [C] Mandate a compromise (blended)                     │
│      → Both somewhat unhappy, but workable              │
│                                                         │
│  [D] Let them work it out themselves                    │
│      → Conflict may escalate or resolve naturally       │
└─────────────────────────────────────────────────────────┘
```

### 8.3 Consequences
- Choices have short-term and long-term effects
- Some effects are immediate, others delayed
- Player reputation (as pastor) is tracked
- Past decisions may be referenced in future events

---

## 9. Game Modes

### 9.1 Sandbox Mode
- No win/lose conditions
- Play indefinitely
- Focus on building and experimentation
- Choose starting conditions (difficulty, starting resources)

### 9.2 Challenge Mode
Short scenarios with specific goals:

| Challenge | Goal | Difficulty |
|-----------|------|------------|
| **The Turnaround** | Inherit struggling church, reach 200 attendance | Medium |
| **Balanced Books** | Start in debt, achieve $50,000 balance | Medium |
| **Community Pillar** | Reach 90+ reputation, start 3 outreach programs | Hard |
| **Church Planter** | Start from zero, reach 100 members in 1 year | Hard |
| **Crisis Manager** | Handle 3 major crises without losing key staff | Expert |

### 9.3 Story Mode (Future?)
- Guided narrative experience
- Pre-set characters and situations
- Branching storyline based on decisions

---

## 10. UI/UX Design

### 10.1 Main Screen Layout
```
┌─────────────────────────────────────────────────────────────────┐
│  SIM CHURCH                              Week 24 | [⏸️] [⚙️]    │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                                                          │  │
│  │                    MAIN VIEW AREA                        │  │
│  │                                                          │  │
│  │    (Church building visualization / Current screen)      │  │
│  │                                                          │  │
│  │                                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─────────┬─────────┬─────────┐  ┌──────────────────────────┐ │
│  │ 📊 147  │ 💰 $12K │ ⭐ 72   │  │  [📋Staff] [👥People]    │ │
│  │ Attend  │ Budget  │ Repute  │  │  [💵Budget] [📜Policy]   │ │
│  └─────────┴─────────┴─────────┘  │  [📰Events] [📈Stats]    │ │
│                                    └──────────────────────────┘ │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 📰 Latest: "New family visited this week!"    [NEXT WEEK]│  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 10.2 Key Screens

| Screen | Purpose |
|--------|---------|
| **Dashboard** | Overview, stats, quick actions |
| **Staff Panel** | View/manage all staff, hiring |
| **Congregation** | Member list, demographics, trends |
| **Budget** | Financial details, allocations |
| **Policies** | View/change church policies |
| **Events** | Current situations requiring attention |
| **Statistics** | Detailed graphs and trends |

### 10.3 Visual Style
- Clean, readable interface
- Soft, welcoming color palette
- Simple character sprites (not too cartoony, not too realistic)
- Clear iconography
- Satisfying animations for positive events

---

## 11. Technical Architecture

### 11.1 File Structure
```
sim-church/
├── index.html              # Main game page
├── GDD.md                  # This document
├── css/
│   ├── main.css            # Core styles, variables, layout
│   ├── ui.css              # Buttons, panels, menus
│   ├── dashboard.css       # Dashboard-specific styles
│   └── animations.css      # Transitions, sprite animations
├── js/
│   ├── main.js             # Entry point, initialization
│   ├── config.js           # Game constants, settings
│   ├── state.js            # Game state management
│   ├── game.js             # Core game loop, time progression
│   ├── ui.js               # UI rendering and updates
│   ├── staff.js            # Staff system logic
│   ├── congregation.js     # Congregation simulation
│   ├── finances.js         # Budget and money logic
│   ├── events.js           # Event generation and handling
│   ├── policies.js         # Policy system
│   └── data/
│       ├── names.js        # Name generation data
│       ├── traits.js       # Personality traits definitions
│       ├── events.js       # Event templates
│       └── scenarios.js    # Challenge mode scenarios
├── assets/
│   ├── sprites/
│   │   ├── characters/     # Staff and congregation sprites
│   │   └── buildings/      # Church building graphics
│   ├── icons/              # UI icons
│   └── audio/              # Sound effects, music
└── saves/                  # Save game data (localStorage)
```

### 11.2 State Management
Central game state object:
```javascript
gameState = {
  meta: {
    week: 24,
    gameMode: "sandbox",
    difficulty: "normal",
    lastSaved: timestamp
  },
  church: {
    name: "Grace Community Church",
    founded: week 1,
    building: { size: "small", condition: 85 }
  },
  stats: {
    attendance: 147,
    budget: 12450,
    reputation: 72,
    // ... secondary stats
  },
  staff: [ /* array of staff objects */ ],
  congregation: [ /* array of member objects */ ],
  candidates: [ /* available hires */ ],
  policies: { /* current policy settings */ },
  events: {
    active: [ /* current unresolved events */ ],
    history: [ /* past events and outcomes */ ]
  },
  finances: {
    income: { /* breakdown */ },
    expenses: { /* breakdown */ },
    history: [ /* weekly records */ ]
  }
}
```

### 11.3 Key Technical Concepts to Learn
| Concept | Where Used | Learning Priority |
|---------|------------|-------------------|
| ES6 Modules | File organization | Phase 1 |
| State Management | Entire game | Phase 1 |
| DOM Manipulation | UI updates | Phase 1 |
| CSS Variables | Theming | Phase 1 |
| Event Listeners | User interaction | Phase 1 |
| setInterval/Timing | Game loop | Phase 2 |
| LocalStorage | Save/Load | Phase 3 |
| Sprite Sheets | Character display | Phase 6 |
| CSS Animations | UI polish | Phase 6 |
| Random Generation | Staff, events | Phase 4 |

---

## 12. Art & Audio Direction

### 12.1 Visual Style
- **Aesthetic:** Warm, approachable, slightly stylized
- **Color Palette:** 
  - Primary: Warm wood tones, soft creams
  - Accent: Stained glass colors (deep blue, burgundy, gold)
  - UI: Clean whites and soft grays
- **Characters:** Simple, expressive sprites (think Stardew Valley level of detail)

### 12.2 Staff Portraits (Future Polish)
- **Location:** Staff cards in hiring interface and current staff view
- **Style:** Simple pixel art or illustrated portraits (48x48 or 64x64)
- **Variety:** Multiple portrait options per position, randomly assigned
- **Personality hints:** Portraits could subtly reflect traits (cheerful = smiling, etc.)
- **Implementation:** Replace emoji icons with actual portrait images

### 12.3 Audio (Future Phase)
- Gentle background music (optional)
- UI feedback sounds (clicks, notifications)
- Positive achievement chimes
- Warning sounds for problems

---

## 13. Development Phases

### Phase 1: Foundation ✅ COMPLETE
> **Goal:** Basic playable loop with stats and time progression

- [x] Set up project file structure
- [x] Create HTML skeleton
- [x] Implement basic CSS layout and styling
- [x] Create game state structure
- [x] Build dashboard UI with three main stats
- [x] Implement "Next Week" button
- [x] Add basic stat fluctuation logic
- [x] Display week number and basic info

**Deliverable:** Click "Next Week" and watch stats change

---

### Phase 2: Staff System (Core) ✅ COMPLETE
> **Goal:** Hire and manage staff Theme Hospital style

- [x] Create staff data structure
- [x] Build staff generation system (random candidates)
- [x] Implement personality traits system
- [x] Create hiring interface UI
- [x] Add staff management panel
- [x] Implement salary and budget effects
- [x] Add staff morale basics
- [x] Staff affects church stats

**Deliverable:** Hire staff from random candidates, see their effects

---

### Phase 3: Financial System ✅ COMPLETE
> **Goal:** Full budget management

- [x] Implement income calculation (tithes based on attendance)
- [x] Create expense tracking
- [x] Build budget allocation interface
- [x] Add financial history/trends
- [x] Implement budget warnings (low funds)
- [x] Add basic financial decisions

**Deliverable:** Manage a realistic church budget

---

### Phase 4: Congregation System ✅ COMPLETE
> **Goal:** Members as individuals, not just numbers

- [x] Create congregation member data structure
- [x] Implement member generation
- [x] Add attendance patterns
- [x] Create satisfaction system
- [x] Implement member behaviors (join, leave, invite)
- [x] Add congregation panel UI
- [x] Connect to giving/finances

**Deliverable:** Watch individual members join, participate, and potentially leave

---

### Phase 5: Events & Decisions ✅ COMPLETE
> **Goal:** Dynamic situations requiring player choice

- [x] Create event system architecture
- [x] Build event templates (positive, negative, choice)
- [x] Implement event UI (notifications, decision dialogs)
- [x] Add consequence system
- [x] Create staff conflict events
- [x] Add congregation-related events
- [x] Implement event history

**Deliverable:** Respond to random events that affect the game

---

### Phase 6: Policies & Beliefs ✅ COMPLETE
> **Goal:** Shape your church's identity

- [x] Define policy categories and options
- [x] Create policy selection interface
- [x] Implement policy effects on stats
- [x] Add policy change consequences
- [x] Connect policies to congregation preferences

**Deliverable:** Set policies that meaningfully affect gameplay

---

### Phase 7: Visual Polish ✅ COMPLETE
> **Goal:** Make it look great, learn sprite animations

- [x] Design and implement church building visualization
- [x] Create character sprite sheets (CSS-based people dots)
- [x] Implement sprite animations (clouds, building, people)
- [x] Add UI animations and transitions
- [x] Polish color scheme and typography
- [x] Add visual feedback for actions

**Deliverable:** Visually appealing game with animations

---

### Phase 8: Game Modes & Polish ✅ COMPLETE
> **Goal:** Complete game experience

- [x] Implement save/load system
- [x] Create game mode selection
- [x] Build challenge scenarios
- [x] Add tutorial/onboarding
- [x] Balance and playtest
- [x] Bug fixes and polish

**Deliverable:** Complete, playable game with multiple modes

---

## 14. Task Checklist

### Current Phase: 1 - Foundation ✅ COMPLETE

#### Setup
- [x] Create folder structure
- [x] Create index.html
- [x] Create main.css
- [x] Create main.js
- [x] Verify files load correctly

#### HTML Structure
- [x] Basic page structure
- [x] Dashboard container
- [x] Stats display area
- [x] Control buttons area
- [x] News/notification area

#### CSS Styling
- [x] CSS reset/normalize
- [x] CSS variables for colors
- [x] Dashboard layout (flexbox/grid)
- [x] Stat card styling
- [x] Button styling
- [x] Responsive basics

#### JavaScript Core
- [x] Game state object (state.js)
- [x] Initialize function (main.js)
- [x] Render stats function (ui.js)
- [x] Next week function (game.js)
- [x] Basic stat calculation (game.js)

#### First Playable
- [x] Stats update each week
- [x] Week counter advances
- [x] Basic visual feedback (animations)
- [x] Test in browser - no errors in console

---

## 15. Ideas Backlog

*Ideas to consider for future development:*

- [ ] Building expansion/upgrades
- [ ] Multiple service times
- [ ] Seasonal events (Christmas, Easter)
- [ ] Community reputation events (news coverage)
- [ ] Staff training mini-game
- [ ] Sermon preparation mechanic
- [ ] Denominational affiliation options
- [ ] Church splits (negative event)
- [ ] Revival events (positive surge)
- [ ] Mentorship system for staff
- [ ] Visitor follow-up mechanic
- [ ] Small group/Sunday school programs
- [ ] Mission trips
- [ ] Building campaigns
- [ ] Volunteer management
- [ ] Social media presence stat
- [ ] Podcast/online ministry expansion

---

## 16. Session Notes

### Session 1 — November 28, 2025
**Topic:** Initial Planning  
**Summary:** 
- Defined core concept: Church management sim inspired by SimCity and Theme Hospital
- Established staff system based on Theme Hospital's hiring mechanics
- Outlined core statistics: Attendance, Budget, Reputation
- Created this GDD document
- Ready to begin Phase 1 implementation

**Next Steps:**
- ~~Begin Phase 1: Foundation~~
- ~~Create file structure~~
- ~~Build basic dashboard UI~~

---

### Session 2 — November 28, 2025
**Topic:** Phase 1 Implementation  
**Summary:**
- Created complete folder structure (css/, js/, assets/)
- Built index.html with full dashboard layout
- Implemented warm church aesthetic with CSS (burgundy, gold, cream palette)
- Created modular JavaScript architecture:
  - `state.js` - Game state management with save/load foundation
  - `game.js` - Core game loop, income/expense/attendance calculations
  - `ui.js` - DOM manipulation and rendering
  - `main.js` - Entry point and event handlers
- Implemented features:
  - Three main stats with trend indicators
  - "Next Week" button advances time
  - Random stat fluctuations based on game logic
  - News ticker with contextual messages
  - Stat card animations (pulse on change)
  - Keyboard shortcuts (Space/Enter to advance)
  - Speed buttons (UI ready, auto-advance not yet implemented)

**Files Created:**
- `index.html`
- `css/main.css`
- `js/main.js`
- `js/state.js`
- `js/game.js`
- `js/ui.js`

**Next Steps:**
- ~~Test the game in browser~~
- ~~Fix any bugs~~
- ~~Begin Phase 2: Staff System (Theme Hospital-style hiring)~~

---

### Session 3 — November 29, 2025
**Topic:** Phase 1 Testing & Phase 2 Implementation  
**Summary:**
- Tested Phase 1 functionality thoroughly
- Fixed bugs discovered during testing:
  - Scripts not loading (added all JS files to index.html)
  - Milestone messages not appearing (fixed previousStats comparison)
  - Milestones overwritten by other news (changed to unshift for priority)
- Implemented complete Phase 2 Staff System:
  - Created `js/data/names.js` for random name generation
  - Created `js/data/traits.js` with 13 personality traits
  - Created `js/staff.js` with positions, skills, hiring logic
  - Built beautiful modal UI with Candidates and Current Staff tabs
  - Theme Hospital-style candidate cards with skill bars, traits, backstories
  - Hiring and firing functionality
  - Staff salaries integrated into weekly budget
  - Staff quality affects attendance/reputation/morale

**Files Created:**
- `js/data/names.js`
- `js/data/traits.js`
- `js/staff.js`

**Files Modified:**
- `index.html` (added modal HTML, script tags)
- `css/main.css` (added modal and card styles)
- `js/main.js` (added staff modal handlers)
- `js/game.js` (integrated staff into weekly processing)
- `js/ui.js` (added staff modal rendering)

**Future Polish Notes:**
- Add staff portrait images to replace emoji icons
- Add more news message variety
- Consider staff portraits that reflect personality traits
- Replace browser alerts/confirms with custom styled modal dialogs:
  - "Let Go" confirmation → styled confirmation modal
  - "Position Full" alert → styled notification/toast
  - Other game notifications → consistent UI treatment

**Next Steps:**
- ~~Begin Phase 3: Financial System~~
- ~~Or continue testing/polishing Phase 2~~

---

### Session 3 (continued) — November 29, 2025
**Topic:** Phase 3 Financial System Implementation  
**Summary:**
- Built complete Budget Management modal with three tabs
- Overview tab: Income/expense breakdown, net weekly, bank balance, runway calculation
- Allocations tab: Sliders to adjust ministry spending (utilities, programs, maintenance, supplies)
- History tab: Bar chart of last 12 weeks, best/worst/average stats, week-by-week list
- Implemented financial history tracking (keeps last 52 weeks)
- Added low funds warning system (warnings at <$1000, in debt, low runway)
- Fixed max position alert for staff hiring

**Files Modified:**
- `index.html` (added budget modal HTML)
- `css/main.css` (added budget modal styles)
- `js/game.js` (added financial history tracking, budget warnings)
- `js/ui.js` (added budget modal rendering functions)
- `js/main.js` (added budget modal event handlers)
- `js/staff.js` (added max position alert)
- `GDD.md` (added staff portraits note, session notes)

**Next Steps:**
- ~~Phase 4: Congregation System (members as individuals)~~
- ~~Or Phase 5: Events & Decisions~~

---

### Session 4 — November 29, 2025
**Topic:** Phase 4 Congregation System & Phase 5 Events System  
**Summary:**

**Phase 4 - Congregation System:**
- Built People Management modal with three tabs (Overview, Members, Demographics)
- Individual congregation members with names, ages, satisfaction, attendance patterns
- Four attendance patterns: Visitor → Sporadic → Regular → Dedicated
- Four giving levels: Non-giver, Occasional, Tither, Generous
- Dynamic member behaviors (satisfaction changes, pattern transitions, departures)
- Visitors can become regulars; unhappy members can leave
- Member demographics: age groups, tenure tracking
- Giving calculated from actual member patterns and satisfaction

**Phase 5 - Events & Decisions:**
- Created comprehensive event system architecture
- Three event types: Positive (auto-resolve), Negative (auto-resolve), Choice (player decides)
- 10 event templates with conditions and probabilities:
  - Positive: Anonymous Donation, Media Attention, Skilled Volunteer
  - Negative: Building Emergency, Unhappy Family, Gossip Spreading
  - Choice: Collaboration Request, Building Rental, Staff Conflict, Member in Crisis, Major Donor Offer
- Dramatic event modal UI with color-coded headers
- Consequence system affecting budget, reputation, morale, staff
- Event history tracking (last 50 events)

**Files Created:**
- `js/events.js` (event system)

**Files Modified:**
- `index.html` (added event modal HTML)
- `css/main.css` (added event modal styles)
- `js/game.js` (integrated events into weekly processing)
- `js/ui.js` (added event modal rendering)
- `js/main.js` (added event modal handlers, keyboard support)

**Future Event Ideas:**
- Seasonal events (Christmas, Easter)
- Community disaster response
- Building expansion opportunities
- Staff personal events (illness, family issues)
- Denominational events
- Youth program milestones
- Music/worship style debates

**Next Steps:**
- ~~Phase 6: Policies & Beliefs~~

---

### Session 5 — November 29, 2025
**Topic:** Phase 6 Policies & Beliefs System  
**Summary:**

- Created comprehensive Policies system shaping church identity
- 7 policy categories across 4 groups:
  - **Worship & Service:** Worship Style (Traditional/Contemporary/Blended), Service Length
  - **Theology & Beliefs:** Theological Stance (Conservative/Moderate/Progressive)
  - **Community & Membership:** Membership Requirements, Community Focus
  - **Leadership & Governance:** Decision Making, Financial Transparency
- Each policy option has unique effects on:
  - Giving modifier
  - Attendance growth modifier
  - Reputation
  - Congregation satisfaction
  - Spiritual health
  - Age group attraction/repulsion
- Built Policies modal with three tabs:
  - Current Policies: Select options for each policy category
  - Effects: View combined policy effects and demographic appeal
  - History: Track policy changes over time
- Policy changes cause morale impact (bigger changes = bigger disruption)
- Integrated policy effects into game loop (income, attendance, reputation, morale)
- Enabled the Policies button in the action panel

**Files Created:**
- `js/policies.js` (policy definitions, functions, effects calculation)

**Files Modified:**
- `index.html` (added policies modal, script tag, enabled button)
- `css/main.css` (added policies modal styles)
- `js/state.js` (added full policy defaults, policyHistory)
- `js/game.js` (integrated policy effects into calculations)
- `js/ui.js` (added policies modal rendering)
- `js/main.js` (added policies modal handlers)

**Future Enhancements:**
- Add visual indicators showing current policy effects on stats
- Policy "conflicts" when incompatible policies are selected
- Events triggered by specific policy combinations
- Member preferences that align/conflict with policies

**Next Steps:**
- ~~Phase 7: Visual Polish (sprites, animations)~~

---

### Session 6 — November 29, 2025
**Topic:** Phase 7 Visual Polish  
**Summary:**

- Created animated church building scene:
  - CSS-based church with steeple, cross, main building, windows, door
  - Animated clouds drifting across night sky
  - Side wings that appear at 100+ and 150+ attendance
  - Windows that glow when congregation morale is high
  - People indicators showing attendance as dots
  - Building scales based on attendance (small/medium/large/mega)
- Enhanced UI animations:
  - Smooth modal open/close with scale transitions
  - Button ripple effects on click
  - Stat value bump animations (up/down)
  - Card hover lift effects
  - Tab button transitions
  - Action button shine effect on hover
- Added Toast notification system:
  - Slide-in notifications for events
  - Color-coded (positive/negative/highlight)
  - Auto-dismiss after 3 seconds
- Enhanced stat feedback:
  - Trend indicators with pulse animations
  - Color changes on value updates
  - Smooth number transitions

**Files Modified:**
- `index.html` (added church scene HTML, toast container)
- `css/main.css` (extensive visual polish: church scene, animations, toasts)
- `js/ui.js` (renderChurchBuilding, showToast, animateStatValue)

**Future Visual Enhancements:**
- Actual character sprites with different appearances
- Seasonal decorations (Christmas, Easter)
- Weather effects
- Day/night cycle
- Building expansion animations

**Next Steps:**
- ~~Phase 8: Game Modes & Polish (save/load, tutorials, scenarios)~~

---

### Session 7 — November 29, 2025
**Topic:** Phase 8 Game Modes & Polish  
**Summary:**

- Implemented complete Save/Load system:
  - Save button saves to localStorage
  - Load button restores game state
  - Keyboard shortcuts: Ctrl+S (save), Ctrl+L (load)
  - Toast notifications for save/load feedback
- Created beautiful Start Menu:
  - Title screen with church branding
  - New Game / Continue buttons
  - Game mode selection (Sandbox / Challenge)
  - Continue shows saved game info
- Built Challenge Scenarios system:
  - 5 unique scenarios: Church Plant, The Turnaround, Megachurch Dreams, Budget Crisis, Community Champion
  - Each with starting conditions, goals, time limits
  - In-game goals display showing progress
  - Victory/defeat detection
  - Difficulty ratings (Easy/Medium/Hard)
- Added Tutorial System:
  - 5-step interactive tutorial
  - Explains game basics
  - Skip option available
  - Only shows once (localStorage flag)

**Files Created:**
- `js/scenarios.js` (challenge scenario definitions and logic)

**Files Modified:**
- `index.html` (start menu, scenario selection, save/load buttons)
- `css/main.css` (start menu, scenarios, goals, tutorial styles)
- `js/main.js` (start menu, scenarios, tutorial handlers)
- `js/state.js` (save/load functions already existed)

**All 8 Phases Complete!** 🎉

---

*This is a living document. Update it as the game evolves!*


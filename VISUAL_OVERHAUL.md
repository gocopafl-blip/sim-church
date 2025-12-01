# Sim Church — Visual & Interactive Overhaul

> **Version:** 1.0 (Planning Document)  
> **Created:** November 29, 2025  
> **Status:** Planning Complete — Ready for Implementation

---

## Table of Contents

1. [Overview](#overview)
2. [Technical Decisions](#technical-decisions)
3. [Time System](#time-system)
4. [Layer Architecture](#layer-architecture)
5. [Phase 1: Foundation](#phase-1-foundation)
6. [Phase 2: Building Shell](#phase-2-building-shell)
7. [Phase 3: Construction Mode](#phase-3-construction-mode)
8. [Phase 4: Furniture & Objects](#phase-4-furniture--objects)
9. [Phase 5: Player Character](#phase-5-player-character)
10. [Phase 6: Congregants](#phase-6-congregants)
11. [Phase 7: Interactions](#phase-7-interactions)
12. [Phase 8: Integration & Polish](#phase-8-integration--polish)
13. [Future Enhancements](#future-enhancements)
14. [Asset Resources](#asset-resources)
15. [Session Notes](#session-notes)

---

## Overview

Transform Sim Church from a menu-driven simulation into an interactive, Theme Hospital-style isometric game where players can:

- **Click the church exterior** to enter an interior view
- **Build and customize** the church interior (walls, doors, furniture)
- **Control a player character** (the senior pastor)
- **Watch congregants** enter, sit, and participate in services
- **Interact with individuals** through click menus and observe mood via thought bubbles

The existing UI (Staff, Budget, People, Policies, Statistics buttons) remains intact. Only the church exterior view panel is replaced with the new interactive interior view.

---

## Technical Decisions

### Graphics Engine
| Decision | Choice |
|----------|--------|
| **Engine** | Phaser.js |
| **Reason** | Built-in sprite handling, depth sorting, camera/scrolling, pathfinding plugins, well-documented |

> 📝 **Note to self**: Explain Phaser.js integration with existing file structure when implementation begins.

### Visual Style
| Decision | Choice |
|----------|--------|
| **Perspective** | Isometric 2.5D |
| **Grid Size** | 64x64 pixels (base tile) |
| **Sprite Sizes** | Flexible (sprites can be larger than grid, e.g., 128x128 character on 1x1 tile) |

### Art Assets Strategy
| Phase | Approach |
|-------|----------|
| **Development** | Free isometric asset packs (Kenney.nl, OpenGameArt, itch.io) |
| **Future** | AI-generated custom sprites, swapped in when ready |

The system will be designed for easy asset swapping — sprites organized by category with consistent naming conventions.

---

## Time System

### Day-Based Advancement

The game now advances **day-by-day** instead of week-by-week.

| Speed | Real Time per Day | Days per Hour | Weeks per Hour |
|-------|-------------------|---------------|----------------|
| **Slow** | 4 minutes | 15 | ~2 |
| **Normal** | 2 minutes | 30 | ~4 |
| **Fast** | 60 seconds | 60 | ~8.5 |

### Key Mechanics

- **Sprite speed is constant** — game speed affects time progression only, not animation/movement speed
- **Day-of-week tracking** — Monday through Sunday cycle
- **Time-of-day display** — Morning, Afternoon, Evening (visual + UI indicator)
- **Pause button** — Stops time for construction mode or manual control

### Service Events

Services are **special events** that interrupt normal time flow:

1. **Service Schedule** — Set in Policies (e.g., Wednesday night, Sunday AM & PM)
2. **Service Trigger** — When scheduled time arrives, game pauses/slows to real-time
3. **Congregants Enter** — AI guides them to pews
4. **Order of Service** — Player-configurable sequence (set in Policies)
5. **Skip Ahead** — Option to fast-forward through service
6. **Dismiss Congregation** — Player action that ends service and resumes normal time

### Order of Service (Policies)

Player can customize service flow:
- Welcome / Announcements
- Opening Prayer
- Worship / Hymns
- Offering
- Sermon
- Altar Call
- Closing Prayer
- Dismissal

Each segment has configurable duration. "Skip Ahead" jumps to next segment or ends service.

---

## Layer Architecture

The interior view consists of 5 distinct layers, rendered in order:

### Layer 1: Background Canvas
- **Purpose**: Scrollable base layer
- **Interaction**: Pan/scroll with mouse drag or edge detection
- **Content**: Floor tiles, ground texture

### Layer 2: Building Shell
- **Purpose**: Exterior walls of the church
- **Interaction**: Non-modifiable (initially)
- **Content**: Outer walls matching exterior view shape, doors, exterior windows
- **Future**: Building expansions, new wings, relocating to larger building

### Layer 3: Interior Structures
- **Purpose**: Interior walls, doors, partitions, stairs
- **Interaction**: Player-modifiable in **Construction Mode**
- **Content**:
  - Straight wall pieces
  - Corner wall pieces
  - Door frame openings
  - Window frame pieces
  - Stairwell pieces
  - Room dividers/partitions
- **System**: Snap-to-grid placement, costs money

### Layer 4: Furniture & Decorations
- **Purpose**: Placeable objects
- **Interaction**: Drag-and-drop placement, costs money
- **Content**:
  - **Seating**: Pews, chairs, folding chairs
  - **Fixtures**: Pulpit, altar, lectern, communion table
  - **Office**: Desks, bookshelves, filing cabinets
  - **Classroom**: Whiteboards, chalkboards, tables
  - **Lighting**: Lamps, chandeliers, candles (appear to illuminate)
  - **Decor**: Plants, crosses, artwork, banners

### Layer 4a: Musical Instruments (Special Category)
- **Purpose**: Permanent instruments
- **Cost**: More expensive than regular furniture
- **Content**:
  - Piano, Organ
  - Percussion (drums, timpani)
  - Harp
  - Music stands, choir chairs
- **Animation**: May have idle animations (keys moving, etc.)

> **Note**: Portable instruments (guitars, trumpets, violins) are carried by congregation members, not placed.

### Layer 5: People
- **Purpose**: Animated characters with AI
- **Types**:
  - **Player Character** — Senior pastor, directly controllable
  - **Staff** — Hired employees, AI-controlled
  - **Congregation** — Members, AI-controlled
- **Behaviors**:
  - Pathfinding around Layers 2-4
  - Sitting on chairs/pews
  - Interacting with objects (whiteboards, instruments, lights)
  - Social interactions with each other
  - Collision avoidance with other people

---

## Phase 1: Foundation

**Goal**: Integrate Phaser.js and establish the basic view system.

### Tasks

- [x] Add Phaser.js to project (CDN or npm)
- [x] Create Phaser game configuration
- [x] Integrate Phaser canvas into existing `index.html` (replacing church exterior view area)
- [x] Implement click-to-enter: clicking church exterior transitions to interior view
- [x] Create scrollable/pannable isometric camera
- [x] Implement basic isometric coordinate system (screen ↔ iso conversion)
- [x] Add day/time system:
  - [x] Day counter (Monday-Sunday)
  - [x] Time-of-day tracking
  - [x] UI display for current day/time
- [x] Revamp speed controls:
  - [x] Replace 1x/2x/3x with Slow/Normal/Fast
  - [x] Add Pause button
  - [x] Implement time scaling (4min/2min/60sec per day)
- [x] Add "Exit to Exterior" button/key to return to exterior view
- [x] Placeholder background layer (simple tiled floor)

### Files to Create/Modify

```
js/
├── phaser/
│   ├── config.js          # Phaser game configuration
│   ├── scenes/
│   │   ├── ExteriorScene.js   # Church exterior (clickable)
│   │   ├── InteriorScene.js   # Main interior view
│   │   └── BootScene.js       # Asset preloading
│   └── systems/
│       └── TimeSystem.js      # Day/time management
```

### Phaser.js Integration Notes

**How Phaser integrates with existing code:**

1. **Phaser runs in a `<canvas>` element** — We'll place this where the church exterior currently displays
2. **Existing modules (`state.js`, `game.js`, etc.) remain unchanged** — Phaser scenes will call into them
3. **Communication pattern**:
   - Phaser scenes read from `window.SimChurch.State.getState()`
   - Phaser scenes trigger updates via `window.SimChurch.Game.processDay()` (modified from `processWeek`)
   - UI buttons still work normally, opening modals over the Phaser canvas
4. **The existing `ui.js` renderUI()` still updates stats, news ticker, etc.**

---

## Phase 2: Building Shell

**Goal**: Render the isometric church building exterior walls.

### Tasks

- [x] Source/create isometric wall tileset
- [x] Define church building footprint (match exterior view shape)
- [x] Render exterior walls with proper depth sorting
- [x] Define collision boundaries (walls block movement)
- [x] Place entry/exit door locations (2-3 doors)
- [x] Place exterior window positions (visual only)
- [x] Create building data structure for future expansion
- [x] Add exterior grass surrounding building
- [x] Add brick texture to walls
- [x] Fix windows/doors to be proper isometric parallelograms

### Building Data Structure

```javascript
const buildingData = {
  width: 20,  // tiles
  height: 15, // tiles
  walls: [
    { x: 0, y: 0, type: 'corner-se' },
    { x: 1, y: 0, type: 'wall-s' },
    // ...
  ],
  doors: [
    { x: 10, y: 0, type: 'door-main' },
    { x: 5, y: 14, type: 'door-side' }
  ],
  windows: [
    { x: 3, y: 0, type: 'window-stained' },
    // ...
  ]
};
```

---

## Phase 3: Construction Mode

**Goal**: Allow players to build interior walls and structures.

### Tasks

- [x] Create Construction Mode toggle (button + visual indicator)
- [x] Implement snap grid overlay (visible in construction mode)
- [x] Create wall placement system:
  - [x] Straight walls (N-S, E-W orientations)
  - [x] Corner pieces (4 orientations)
  - [x] Door frames
  - [x] Window frames
- [x] ~~Create stairwell pieces (for future multi-floor)~~ (Skipped for now)
- [x] Implement placement validation:
  - [x] No overlapping walls
  - [x] Must connect to existing structure or exterior wall (partially covered by wall connectivity logic)
  - [ ] Cannot block all exits (requires pathfinding)
- [x] Cost system:
  - [x] Each piece has a cost
  - [x] Deduct from budget on placement
  - [x] Show cost preview before placing
- [x] Demolition tool (refund partial cost)
- [x] Save/load building layouts to game state

### Construction Costs (Initial)

| Item | Cost |
|------|------|
| Straight wall | $50 |
| Corner wall | $60 |
| Door frame | $100 |
| Interior window | $150 |
| Stairwell piece | $200 |
| Demolition | -50% refund |

---

## Phase 4: Furniture & Objects

**Goal**: Implement placeable furniture and decorations.

### Tasks

- [x] Create furniture placement mode (integrated into construction mode)
- [x] Implement object catalog UI:
  - [x] Categories: Seating (Pew), Fixtures (Pulpit), Instruments (Piano), Decor (Plant)
  - [x] Preview, cost, size display (via tooltip/button text)
- [x] Drag-and-drop placement (click-to-place)
- [ ] Rotation support (4 orientations for most items)
- [x] Depth sorting (people can walk behind tall furniture)
- [x] Object collision (people walk around furniture - logic added to collision grid)
- [ ] Lighting objects:
  - [ ] Visual illumination effect (sprite glow or light overlay)
  - [ ] On/off state
- [ ] Musical instruments:
  - [x] Higher cost category (Piano added)
  - [ ] Idle animations (optional)
- [x] Save/load furniture positions

### Furniture Catalog (Initial)

| Category | Items | Cost Range |
|----------|-------|------------|
| Seating | Pew, Chair, Folding Chair | $30-$200 |
| Fixtures | Pulpit, Altar, Lectern, Communion Table | $100-$500 |
| Office | Desk, Bookshelf, Filing Cabinet | $75-$300 |
| Classroom | Whiteboard, Table, Chalkboard | $50-$200 |
| Lighting | Lamp, Chandelier, Candelabra | $50-$400 |
| Decor | Cross, Plant, Banner, Artwork | $25-$300 |
| Instruments | Piano, Organ, Drums, Harp | $500-$5000 |

---

## Phase 5: Player Character

**Goal**: Implement controllable senior pastor character.

### Tasks

- [ ] Create/source isometric character sprite (8 directions or 4 + flip)
- [ ] Implement keyboard movement (WASD or arrow keys)
- [ ] Implement click-to-move (pathfinding to clicked location)
- [ ] Collision detection with:
  - [ ] Exterior walls (Layer 2)
  - [ ] Interior walls (Layer 3)
  - [ ] Furniture (Layer 4)
- [ ] Door interaction (walk through door frames)
- [ ] Stair interaction (move between floors - future)
- [ ] Camera follow option (camera tracks player)
- [ ] Idle animation
- [ ] Walking animation

---

## Phase 6: Congregants

**Goal**: Add AI-controlled congregation members.

### Tasks

- [ ] Create congregant sprite variations (multiple appearances)
- [ ] Implement A* pathfinding (or Phaser pathfinding plugin)
- [ ] Basic AI behaviors:
  - [ ] **Idle** — Stand/wander when no service
  - [ ] **Enter** — Walk from door to available seat at service time
  - [ ] **Seated** — Sit in pew/chair during service
  - [ ] **Exit** — Walk from seat to door when dismissed
- [ ] Seat assignment system:
  - [ ] Identify valid seating (pews, chairs)
  - [ ] Track occupied/available seats
  - [ ] Assign seats based on arrival order or preference
- [ ] Collision avoidance:
  - [ ] Don't walk through other congregants
  - [ ] Queue at narrow passages
  - [ ] Slide past in pews (seated shuffling)
- [ ] Integrate with service schedule:
  - [ ] Congregants spawn at door at service time
  - [ ] Number based on `gameState.stats.attendance`
- [ ] Visual variety:
  - [ ] Different sprites per congregation member
  - [ ] Match to congregation data (age groups if possible)

---

## Phase 7: Interactions

**Goal**: Enable player-to-congregant and congregant-to-congregant interactions.

### Tasks

#### Player-to-Congregant

- [ ] Click on congregant to select
- [ ] Display interaction menu popup:
  - [ ] **Show Interest** — Increases satisfaction, builds relationship
  - [ ] **Ask for Help** — Request volunteer assistance
  - [ ] **Ask for Donations** — Direct ask (can backfire)
  - [ ] **Pray With** — Spiritual interaction
  - [ ] More options added later
- [ ] Interaction outcomes:
  - [ ] Modify individual member satisfaction
  - [ ] Affect reputation
  - [ ] Track relationship level

#### Congregant-to-Congregant (Autonomous)

- [ ] Random social interactions between nearby congregants
- [ ] Visual indicators:
  - [ ] **Speech bubbles** — 💬 when talking to each other
  - [ ] **Thought bubbles** — 💭 when idle/thinking
- [ ] Emoji contents based on mood/activity:
  - [ ] 🎵 — During worship/singing
  - [ ] 😊 😐 😟 😴 😠 — Mood during sermon
  - [ ] 🤔 💭 — Thinking/pondering
  - [ ] ❤️ 🙏 — Positive spiritual response
  - [ ] 😴 — Bored/sleepy (low engagement)
- [ ] Moods tied to:
  - [ ] Individual satisfaction level
  - [ ] Service quality (sermon skill, worship quality)
  - [ ] Policy effects (theology, worship style)
  - [ ] Interpersonal relationships

#### During Services

- [ ] Order of Service progression triggers visual changes:
  - [ ] Worship → 🎵 bubbles appear
  - [ ] Sermon → Mix of 🤔 😊 😴 based on engagement
  - [ ] Prayer → 🙏 bubbles
- [ ] Angry/conflict emojis indicate problems:
  - [ ] Theological disagreements
  - [ ] Interpersonal conflict
  - [ ] General dissatisfaction

---

## Phase 8: Integration & Polish

**Goal**: Tie up loose ends, polish, and ensure all systems work together.

### Tasks

#### Order of Service Feature

- [ ] Add to Policies modal:
  - [ ] Service schedule (days/times)
  - [ ] Order of Service editor (drag to reorder segments)
  - [ ] Segment duration settings
- [ ] In-service UI:
  - [ ] Current segment indicator
  - [ ] "Skip Ahead" button
  - [ ] "Dismiss Congregation" button

#### Speed Controls Revamp

- [ ] Replace speed buttons:
  - [ ] 🐢 Slow (4 min/day)
  - [ ] ▶️ Normal (2 min/day)
  - [ ] ⏩ Fast (60 sec/day)
  - [ ] ⏸️ Pause
- [ ] Visual indicator of current speed
- [ ] Keyboard shortcuts (1, 2, 3, Space for pause)

#### System Integration

- [ ] Ensure existing modals work over Phaser canvas
- [ ] Verify state synchronization (Phaser ↔ gameState)
- [ ] Day-based stat calculations (adapt from weekly)
- [ ] News ticker updates for daily events
- [ ] Save/load includes:
  - [ ] Building layout (walls, doors)
  - [ ] Furniture positions
  - [ ] Player character position
  - [ ] Time/day state

#### Art Asset System

- [ ] Organize sprites by category
- [ ] Consistent naming convention
- [ ] Document swap procedure for custom assets
- [ ] Create asset manifest for easy updates

#### Visual Polish

- [ ] Day/night cycle (lighting changes)
- [ ] Weather effects (optional)
- [ ] Ambient animations (candles flicker, etc.)

#### Testing

- [ ] Start with elevated budget ($50,000+) for construction testing
- [ ] Test all construction pieces
- [ ] Test pathfinding edge cases
- [ ] Test service flow start-to-finish
- [ ] Performance testing with many congregants

---

## Future Enhancements

*Items noted for future implementation, beyond this overhaul:*

### Budget Expansion
- [ ] Separate Building Fund
- [ ] Donation splitting (tithes vs. building fund)
- [ ] Loan system (SimCity-style)
  - [ ] Borrow against future income
  - [ ] Interest rates
  - [ ] Repayment schedule
- [ ] Fundraiser events
- [ ] Grant applications

### Building Expansion
- [ ] Add-on wings/rooms
- [ ] Multi-floor buildings
- [ ] Purchase adjacent land
- [ ] Relocate to new/larger building

### Staff Integration
- [ ] Staff characters visible in interior
- [ ] Staff AI behaviors (working at desks, leading activities)
- [ ] Staff interaction menus

### Advanced Congregant AI
- [ ] Relationship web between members
- [ ] Clique formation
- [ ] Conflict resolution mechanics
- [ ] Family groups (arrive/sit together)

### Events in Interior View
- [ ] Visual representation of events
- [ ] Interactive event resolution

---

## Asset Resources

### Free Isometric Tilesets

| Source | URL | Notes |
|--------|-----|-------|
| Kenney | https://kenney.nl/assets | High quality, CC0 license |
| OpenGameArt | https://opengameart.org | Various licenses, search "isometric" |
| itch.io | https://itch.io/game-assets/tag-isometric | Mix of free and paid |

### Recommended Starting Packs

- **Kenney Isometric** — Building blocks, furniture
- **Search**: "isometric church", "isometric interior", "isometric furniture"

### Asset Naming Convention

```
assets/
├── sprites/
│   ├── building/
│   │   ├── wall-straight-ns.png
│   │   ├── wall-straight-ew.png
│   │   ├── wall-corner-ne.png
│   │   └── ...
│   ├── furniture/
│   │   ├── pew-wood.png
│   │   ├── chair-folding.png
│   │   └── ...
│   ├── characters/
│   │   ├── pastor-idle-s.png
│   │   ├── pastor-walk-s-1.png
│   │   └── ...
│   └── ui/
│       ├── bubble-speech.png
│       ├── bubble-thought.png
│       └── emoji-*.png
```

---

## Session Notes

### Session 1 — November 29, 2025 (Planning)

**Decisions Made:**
1. ✅ Perspective: Isometric 2.5D
2. ✅ Engine: Phaser.js
3. ✅ Art: Free asset packs → AI-generated custom later
4. ✅ Grid: 64x64 base with flexible sprite sizes
5. ✅ Time: Day-based (slow/normal/fast speeds)
6. ✅ Services: Events that pause time, Order of Service customizable
7. ✅ Budget: Use existing for now, expand later
8. ✅ UI: Keep button bar, interior replaces exterior view only
9. ✅ Phases: 8 phases planned

**Next Steps:**
- ~~Begin Phase 1: Foundation~~ ✅ COMPLETE
- ~~Download Phaser.js~~ ✅
- ~~Source initial isometric assets~~ ✅ (placeholder graphics created)
- ~~Create scene structure~~ ✅

### Session 2 — November 29, 2025 (Phase 1 Implementation)

**Completed:**
- ✅ Added Phaser.js via CDN
- ✅ Created `js/phaser/config.js` — Game configuration
- ✅ Created `js/phaser/systems/TimeSystem.js` — Day/time management
- ✅ Created `js/phaser/scenes/BootScene.js` — Asset preloading with placeholder textures
- ✅ Created `js/phaser/scenes/ExteriorScene.js` — Church exterior view
- ✅ Created `js/phaser/scenes/InteriorScene.js` — Isometric interior with 20x15 floor
- ✅ Updated `index.html` — Phaser container, speed controls, day/time display
- ✅ Updated `js/main.js` — Phaser integration, TimeSystem callbacks
- ✅ Updated `css/main.css` — Phaser container and speed button styles
- ✅ Tested all features successfully

**Files Created:**
- `js/phaser/config.js`
- `js/phaser/systems/TimeSystem.js`
- `js/phaser/scenes/BootScene.js`
- `js/phaser/scenes/ExteriorScene.js`
- `js/phaser/scenes/InteriorScene.js`

**Next Steps:**
- ~~Begin Phase 2: Building Shell~~ ✅ COMPLETE

### Session 3 — November 29, 2025 (Phase 2 Implementation)

**Completed:**
- ✅ Created `js/phaser/systems/BuildingSystem.js` — Building data management
- ✅ Cross-shaped church layout: sanctuary, narthex, expandable wings
- ✅ Proper isometric wall rendering with brick texture
- ✅ Isometric windows (parallelograms matching wall angles)
- ✅ Isometric doors (proper openings with frames)
- ✅ Exterior grass layer surrounding building
- ✅ Collision grid system for future pathfinding
- ✅ Depth-sorted wall rendering

**Files Created:**
- `js/phaser/systems/BuildingSystem.js`

**Files Modified:**
- `js/phaser/scenes/InteriorScene.js` — Complete rewrite with building system
- `js/phaser/scenes/BootScene.js` — Initialize BuildingSystem
- `index.html` — Added BuildingSystem script

**Next Steps:**
- Begin Phase 3: Construction Mode

---

### Session 4 — November 30, 2025 (Phase 3 & 4 Implementation)

**Completed Phase 3 (Construction Mode):**
- ✅ Created `js/phaser/systems/ConstructionSystem.js`
- ✅ Implemented "Thin Wall" rendering (walls on tile edges, Theme Hospital style)
- ✅ Smart Wall placement logic (auto-orientation N/S or E/W based on quadrant)
- ✅ Construction Mode UI (Build button, cost display, placement validation)
- ✅ Save/Load building persistence
- ✅ Skipped Stairwells per user request

**Completed Phase 4 (Furniture & Objects):**
- ✅ Implemented Furniture System (Pews, Pulpit, Piano, Plants)
- ✅ Added Asset Management (`js/phaser/config/Assets.js`)
- ✅ Integrated Kenney's Isometric Asset Pack (replacing colored boxes)
- ✅ Implemented 4-direction rotation (R key) with sprite swapping (_NE, _NW, _SE, _SW)
- ✅ Persistent furniture data

**Files Created:**
- `js/phaser/systems/ConstructionSystem.js`
- `js/phaser/config/Assets.js`

**Next Steps:**
- Begin Phase 5: Player Character



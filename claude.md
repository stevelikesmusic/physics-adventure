# Physics Adventure

## Workflow

1. Read the game spec in .claude
2. Read the .claude/project.md and DEVELOPMENT-LOG.md
3. Always document your work 
4. Add any tools or scripts you use here for future sessions

## Current Status: Phase 2 Complete ✅

### Completed Features
- ✅ **Drag & Drop System**: Click and drag any physics object
- ✅ **Vehicle System**: Cars with wheels, joints, and WASD controls
- ✅ **Maze Construction**: Click to build walls, preset templates
- ✅ **Robot AI**: A* pathfinding with behavioral states (max 5 robots)
- ✅ **All 5 Tools**: Block, Ball, Car, Maze, Robot tools working
- ✅ **Material System**: Wood, Stone, Metal with different physics
- ✅ **Performance Optimized**: Memory leaks fixed, stable AI behavior

### Controls
- **Tools**: 1-5 keys or click buttons (Block, Ball, Car, Maze, Robot)
- **Vehicles**: Arrow keys or WASD to drive cars
- **Drag & Drop**: Click and drag any object to move it
- **Maze**: Click walls on/off, use preset buttons when Maze tool active
- **Reset**: R key to clear all objects

## Scripts

### Local Server

```
npm run dev
```

- Starts the local dev server using `serve` on port 3000
- Files served from `/public/` directory

### Development Notes

#### File Structure
- All working game files in `/public/src/`
- Main entry: `/public/index.html` → `/public/src/main.js`
- Assets and styles in `/public/`

#### Recent Fixes
- Fixed robot AI memory leak (force limiting, bounds checking)
- Resolved ComponentTypes import error in game-system.js
- Consolidated file structure (removed duplicate `/src/`)
- Added robot population limit (max 5)
- Optimized pathfinding performance

#### Architecture
- **ECS Pattern**: Entity Component System for clean separation
- **Physics**: Matter.js with custom constraint system
- **AI**: A* pathfinding with behavioral state machine
- **Input**: Tool-based interaction system with drag support
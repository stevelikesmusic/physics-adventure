import { System, ComponentTypes } from '../core/ecs.js';
import { EventTypes } from '../core/events.js';
import { MazeFactory } from '../entities/maze.js';

export class MazeSystem extends System {
    constructor(eventBus, physicsSystem) {
        super();
        this.eventBus = eventBus;
        this.physicsSystem = physicsSystem;
        this.mazeFactory = new MazeFactory(null, physicsSystem);
        this.isBuilding = false;
        this.currentMaze = [];
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.eventBus.on(EventTypes.INPUT_CLICK, (data) => this.handleClick(data));
        this.eventBus.on(EventTypes.TOOL_CHANGED, (data) => this.handleToolChange(data));
        this.eventBus.on('create_preset_maze', (data) => this.createPredefinedMaze(data.type));
        this.eventBus.on('clear_maze', () => this.clearCurrentMaze());
    }

    handleToolChange(data) {
        this.isBuilding = (data.tool === 'maze');
    }

    handleClick(data) {
        if (!this.isBuilding) return;
        
        const { x, y } = data;
        const gridPos = this.mazeFactory.getGridPosition(x, y);
        
        // Check if there's already a wall at this position
        const existingWall = this.findWallAtGridPosition(gridPos.gridX, gridPos.gridY);
        
        if (existingWall) {
            // Remove wall
            this.removeWall(existingWall);
        } else {
            // Add wall
            const wallId = this.mazeFactory.createWall(gridPos.worldX, gridPos.worldY);
            this.currentMaze.push(wallId);
        }
    }

    findWallAtGridPosition(gridX, gridY) {
        const walls = this.ecs.getEntitiesWithComponents(ComponentTypes.MAZE_ELEMENT);
        
        for (const wallId of walls) {
            const mazeElement = this.ecs.getComponent(wallId, ComponentTypes.MAZE_ELEMENT);
            if (mazeElement && mazeElement.gridX === gridX && mazeElement.gridY === gridY) {
                return wallId;
            }
        }
        
        return null;
    }

    removeWall(wallId) {
        this.physicsSystem.removePhysicsBody(wallId);
        this.ecs.removeEntity(wallId);
        
        // Remove from current maze array
        const index = this.currentMaze.indexOf(wallId);
        if (index > -1) {
            this.currentMaze.splice(index, 1);
        }
    }

    createPredefinedMaze(type = 'simple') {
        this.clearCurrentMaze();
        
        let walls = [];
        switch (type) {
            case 'simple':
                walls = this.mazeFactory.createSimpleMaze(200, 150);
                break;
            case 'l-shape':
                walls = this.mazeFactory.createLMaze(300, 200);
                break;
            default:
                console.warn(`Unknown maze type: ${type}`);
                return;
        }
        
        this.currentMaze = walls;
        
        this.eventBus.emit(EventTypes.ENTITY_CREATED, {
            type: 'maze',
            walls: walls
        });
    }

    clearCurrentMaze() {
        this.currentMaze.forEach(wallId => {
            this.removeWall(wallId);
        });
        this.currentMaze = [];
    }

    getAllMazeWalls() {
        return this.ecs.getEntitiesWithComponents(ComponentTypes.MAZE_ELEMENT);
    }

    isMazePosition(x, y) {
        const gridPos = this.mazeFactory.getGridPosition(x, y);
        return this.findWallAtGridPosition(gridPos.gridX, gridPos.gridY) !== null;
    }

    getMazeGrid() {
        // Return a 2D array representation of the current maze
        const walls = this.getAllMazeWalls();
        const grid = {};
        
        walls.forEach(wallId => {
            const mazeElement = this.ecs.getComponent(wallId, ComponentTypes.MAZE_ELEMENT);
            if (mazeElement) {
                const key = `${mazeElement.gridX},${mazeElement.gridY}`;
                grid[key] = 1; // 1 represents a wall
            }
        });
        
        return grid;
    }

    update(deltaTime) {
        this.mazeFactory.ecs = this.ecs;
        
        // Visual feedback when in maze building mode
        if (this.isBuilding) {
            // Could add visual indicators here
        }
    }
}
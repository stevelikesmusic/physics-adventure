import { ComponentTypes } from '../core/ecs.js';

export class MazeFactory {
    constructor(ecs, physicsSystem) {
        this.ecs = ecs;
        this.physicsSystem = physicsSystem;
        this.wallSize = 20;
        this.gridSize = 40;
    }

    createWall(x, y, width = this.wallSize, height = this.wallSize) {
        const entityId = this.ecs.createEntity();

        this.ecs.addComponent(entityId, ComponentTypes.TRANSFORM, {
            x: x,
            y: y,
            rotation: 0,
            scaleX: 1,
            scaleY: 1
        });

        this.ecs.addComponent(entityId, ComponentTypes.PHYSICS, {
            body: null,
            type: 'wall',
            material: 'stone',
            isStatic: true
        });

        this.ecs.addComponent(entityId, ComponentTypes.RENDERABLE, {
            type: 'rect',
            width: width,
            height: height,
            color: '#444444',
            layer: 1
        });

        // Add maze component to identify walls as part of maze system
        this.ecs.addComponent(entityId, ComponentTypes.MAZE_ELEMENT, {
            type: 'wall',
            gridX: Math.floor(x / this.gridSize),
            gridY: Math.floor(y / this.gridSize)
        });

        this.physicsSystem.createPhysicsBody(entityId, 'block', {
            width: width,
            height: height,
            material: 'stone',
            isStatic: true
        });

        return entityId;
    }

    createMazeFromPattern(pattern, startX = 100, startY = 100) {
        const walls = [];
        
        for (let row = 0; row < pattern.length; row++) {
            for (let col = 0; col < pattern[row].length; col++) {
                if (pattern[row][col] === 1) {
                    const x = startX + col * this.gridSize;
                    const y = startY + row * this.gridSize;
                    const wallId = this.createWall(x, y);
                    walls.push(wallId);
                }
            }
        }
        
        return walls;
    }

    createSimpleMaze(startX = 100, startY = 100) {
        // Simple maze pattern (1 = wall, 0 = empty)
        const mazePattern = [
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            [1, 0, 0, 0, 1, 0, 0, 0, 0, 1],
            [1, 0, 1, 0, 1, 0, 1, 1, 0, 1],
            [1, 0, 1, 0, 0, 0, 1, 0, 0, 1],
            [1, 0, 1, 1, 1, 0, 1, 0, 1, 1],
            [1, 0, 0, 0, 1, 0, 0, 0, 0, 1],
            [1, 1, 1, 0, 1, 1, 1, 1, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 1, 0, 1],
            [1, 0, 1, 1, 1, 1, 0, 1, 0, 1],
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
        ];
        
        return this.createMazeFromPattern(mazePattern, startX, startY);
    }

    createLMaze(startX = 100, startY = 100) {
        const lPattern = [
            [1, 1, 1, 1, 1, 1],
            [1, 0, 0, 0, 0, 1],
            [1, 0, 1, 1, 0, 1],
            [1, 0, 1, 0, 0, 1],
            [1, 0, 1, 1, 1, 1],
            [1, 0, 0, 0, 0, 0],
            [1, 1, 1, 1, 1, 1]
        ];
        
        return this.createMazeFromPattern(lPattern, startX, startY);
    }

    removeMazeWalls(wallIds) {
        wallIds.forEach(wallId => {
            this.physicsSystem.removePhysicsBody(wallId);
            this.ecs.removeEntity(wallId);
        });
    }

    getMazeWalls() {
        return this.ecs.getEntitiesWithComponents(ComponentTypes.MAZE_ELEMENT);
    }

    isValidMazePosition(x, y) {
        // Check if position is not occupied by existing maze walls
        const walls = this.getMazeWalls();
        const gridX = Math.floor(x / this.gridSize);
        const gridY = Math.floor(y / this.gridSize);
        
        for (const wallId of walls) {
            const mazeElement = this.ecs.getComponent(wallId, ComponentTypes.MAZE_ELEMENT);
            if (mazeElement && mazeElement.gridX === gridX && mazeElement.gridY === gridY) {
                return false;
            }
        }
        
        return true;
    }

    getGridPosition(x, y) {
        return {
            gridX: Math.floor(x / this.gridSize),
            gridY: Math.floor(y / this.gridSize),
            worldX: Math.floor(x / this.gridSize) * this.gridSize,
            worldY: Math.floor(y / this.gridSize) * this.gridSize
        };
    }
}
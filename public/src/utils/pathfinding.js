// Simple A* pathfinding implementation for robot mice

export class Pathfinder {
    constructor() {
        this.gridSize = 40; // Must match maze grid size
    }

    // Convert world coordinates to grid coordinates
    worldToGrid(x, y) {
        return {
            x: Math.floor(x / this.gridSize),
            y: Math.floor(y / this.gridSize)
        };
    }

    // Convert grid coordinates to world coordinates
    gridToWorld(gridX, gridY) {
        return {
            x: gridX * this.gridSize + this.gridSize / 2,
            y: gridY * this.gridSize + this.gridSize / 2
        };
    }

    // Calculate heuristic distance (Manhattan distance)
    heuristic(a, b) {
        return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    }

    // Get neighboring grid positions
    getNeighbors(pos) {
        return [
            { x: pos.x + 1, y: pos.y },     // Right
            { x: pos.x - 1, y: pos.y },     // Left
            { x: pos.x, y: pos.y + 1 },     // Down
            { x: pos.x, y: pos.y - 1 },     // Up
            { x: pos.x + 1, y: pos.y + 1 }, // Diagonal: Down-Right
            { x: pos.x - 1, y: pos.y + 1 }, // Diagonal: Down-Left
            { x: pos.x + 1, y: pos.y - 1 }, // Diagonal: Up-Right
            { x: pos.x - 1, y: pos.y - 1 }  // Diagonal: Up-Left
        ];
    }

    // Check if a grid position is walkable (not a wall)
    isWalkable(gridX, gridY, obstacles) {
        const key = `${gridX},${gridY}`;
        return !obstacles.has(key);
    }

    // A* pathfinding algorithm
    findPath(startPos, endPos, obstacles) {
        const start = this.worldToGrid(startPos.x, startPos.y);
        const end = this.worldToGrid(endPos.x, endPos.y);

        // If start or end is in a wall, return empty path
        if (!this.isWalkable(start.x, start.y, obstacles) || 
            !this.isWalkable(end.x, end.y, obstacles)) {
            return [];
        }

        const openSet = [];
        const closedSet = new Set();
        const cameFrom = new Map();
        const gScore = new Map();
        const fScore = new Map();

        const startKey = `${start.x},${start.y}`;
        const endKey = `${end.x},${end.y}`;

        openSet.push(start);
        gScore.set(startKey, 0);
        fScore.set(startKey, this.heuristic(start, end));

        while (openSet.length > 0) {
            // Find node with lowest fScore
            openSet.sort((a, b) => {
                const aKey = `${a.x},${a.y}`;
                const bKey = `${b.x},${b.y}`;
                return (fScore.get(aKey) || Infinity) - (fScore.get(bKey) || Infinity);
            });

            const current = openSet.shift();
            const currentKey = `${current.x},${current.y}`;

            if (currentKey === endKey) {
                // Reconstruct path
                return this.reconstructPath(cameFrom, current);
            }

            closedSet.add(currentKey);

            for (const neighbor of this.getNeighbors(current)) {
                const neighborKey = `${neighbor.x},${neighbor.y}`;

                if (closedSet.has(neighborKey) || 
                    !this.isWalkable(neighbor.x, neighbor.y, obstacles)) {
                    continue;
                }

                // For diagonal movement, cost is sqrt(2), for cardinal movement, cost is 1
                const isDiagonal = neighbor.x !== current.x && neighbor.y !== current.y;
                const moveCost = isDiagonal ? Math.sqrt(2) : 1;
                const tentativeGScore = (gScore.get(currentKey) || Infinity) + moveCost;

                if (!openSet.some(node => node.x === neighbor.x && node.y === neighbor.y)) {
                    openSet.push(neighbor);
                } else if (tentativeGScore >= (gScore.get(neighborKey) || Infinity)) {
                    continue;
                }

                cameFrom.set(neighborKey, current);
                gScore.set(neighborKey, tentativeGScore);
                fScore.set(neighborKey, tentativeGScore + this.heuristic(neighbor, end));
            }
        }

        return []; // No path found
    }

    // Reconstruct path from A* result
    reconstructPath(cameFrom, current) {
        const path = [current];
        let currentKey = `${current.x},${current.y}`;

        while (cameFrom.has(currentKey)) {
            current = cameFrom.get(currentKey);
            currentKey = `${current.x},${current.y}`;
            path.unshift(current);
        }

        // Convert grid path to world coordinates
        return path.map(gridPos => this.gridToWorld(gridPos.x, gridPos.y));
    }

    // Smooth path to reduce sharp turns
    smoothPath(path) {
        if (path.length <= 2) return path;

        const smoothed = [path[0]];
        let current = 0;

        while (current < path.length - 1) {
            let next = current + 1;
            
            // Try to skip intermediate points if we can go directly
            while (next < path.length - 1) {
                const canSkip = this.canMoveDirect(path[current], path[next + 1]);
                if (canSkip) {
                    next++;
                } else {
                    break;
                }
            }
            
            smoothed.push(path[next]);
            current = next;
        }

        return smoothed;
    }

    // Check if we can move directly between two points (simplified line-of-sight)
    canMoveDirect(start, end) {
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const steps = Math.ceil(distance / (this.gridSize / 2));
        
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const x = start.x + dx * t;
            const y = start.y + dy * t;
            const gridPos = this.worldToGrid(x, y);
            
            // This is a simplified check - in a real implementation,
            // you'd check against the actual obstacle map
            if (gridPos.x < 0 || gridPos.y < 0) {
                return false;
            }
        }
        
        return true;
    }
}
export class ECS {
    constructor() {
        this.entities = new Map();
        this.components = new Map();
        this.systems = [];
        this.nextEntityId = 1;
    }

    createEntity() {
        const id = this.nextEntityId++;
        this.entities.set(id, new Set());
        return id;
    }

    removeEntity(entityId) {
        if (this.entities.has(entityId)) {
            const componentTypes = this.entities.get(entityId);
            componentTypes.forEach(type => {
                this.components.get(type).delete(entityId);
            });
            this.entities.delete(entityId);
        }
    }

    addComponent(entityId, componentType, componentData) {
        if (!this.entities.has(entityId)) {
            throw new Error(`Entity ${entityId} does not exist`);
        }

        if (!this.components.has(componentType)) {
            this.components.set(componentType, new Map());
        }

        this.components.get(componentType).set(entityId, componentData);
        this.entities.get(entityId).add(componentType);
    }

    removeComponent(entityId, componentType) {
        if (this.components.has(componentType)) {
            this.components.get(componentType).delete(entityId);
        }
        if (this.entities.has(entityId)) {
            this.entities.get(entityId).delete(componentType);
        }
    }

    getComponent(entityId, componentType) {
        if (this.components.has(componentType)) {
            return this.components.get(componentType).get(entityId);
        }
        return null;
    }

    hasComponent(entityId, componentType) {
        return this.entities.has(entityId) && 
               this.entities.get(entityId).has(componentType);
    }

    getEntitiesWithComponents(...componentTypes) {
        const entities = [];
        for (const [entityId, entityComponents] of this.entities) {
            if (componentTypes.every(type => entityComponents.has(type))) {
                entities.push(entityId);
            }
        }
        return entities;
    }

    addSystem(system) {
        this.systems.push(system);
        system.ecs = this;
    }

    update(deltaTime) {
        this.systems.forEach(system => {
            if (system.update) {
                system.update(deltaTime);
            }
        });
    }
}

export class System {
    constructor() {
        this.ecs = null;
    }

    update(deltaTime) {
    }
}

export const ComponentTypes = {
    TRANSFORM: 'transform',
    PHYSICS: 'physics',
    RENDERABLE: 'renderable',
    INPUT: 'input',
    LIFETIME: 'lifetime',
    ROBOT: 'robot',
    DOT: 'dot'
};
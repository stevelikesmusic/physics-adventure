import { System, ComponentTypes } from '../core/ecs.js';
import { EventTypes } from '../core/events.js';

export class DragSystem extends System {
    constructor(eventBus, physicsSystem, camera = null) {
        super();
        this.eventBus = eventBus;
        this.physicsSystem = physicsSystem;
        this.camera = camera;
        this.isDragging = false;
        this.dragEntity = null;
        this.dragOffset = { x: 0, y: 0 };
        this.dragConstraint = null;
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.eventBus.on(EventTypes.DRAG_START, (data) => this.handleDragStart(data));
        this.eventBus.on(EventTypes.DRAG_MOVE, (data) => this.handleDragMove(data));
        this.eventBus.on(EventTypes.DRAG_END, (data) => this.handleDragEnd(data));
    }

    handleDragStart(data) {
        const { x, y } = data;
        
        // Find entity at mouse position
        const entity = this.findEntityAtPosition(x, y);
        
        if (entity) {
            const transform = this.ecs.getComponent(entity, ComponentTypes.TRANSFORM);
            const physics = this.ecs.getComponent(entity, ComponentTypes.PHYSICS);
            
            if (transform && physics && physics.body) {
                this.isDragging = true;
                this.dragEntity = entity;
                
                // Calculate offset from mouse to entity center
                this.dragOffset = {
                    x: x - transform.x,
                    y: y - transform.y
                };
                
                // Create physics constraint for smooth dragging
                this.dragConstraint = this.physicsSystem.physicsEngine.createConstraint(
                    physics.body,
                    { x: x, y: y },
                    { stiffness: 0.8, damping: 0.1 }
                );
                
                // Notify input system
                const inputSystem = this.getInputSystem();
                if (inputSystem) {
                    inputSystem.startDragging(entity, this.dragOffset.x, this.dragOffset.y);
                }
            }
        }
    }

    handleDragMove(data) {
        if (!this.isDragging || !this.dragEntity || !this.dragConstraint) return;
        
        const { x, y } = data;
        
        // Update constraint position
        this.physicsSystem.physicsEngine.updateConstraintPosition(
            this.dragConstraint,
            { x: x + this.dragOffset.x, y: y + this.dragOffset.y }
        );
    }

    handleDragEnd(data) {
        if (!this.isDragging || !this.dragEntity) return;
        
        // Remove physics constraint
        if (this.dragConstraint) {
            this.physicsSystem.physicsEngine.removeConstraint(this.dragConstraint);
            this.dragConstraint = null;
        }
        
        // Reset drag state
        this.isDragging = false;
        this.dragEntity = null;
        this.dragOffset = { x: 0, y: 0 };
        
        // Notify input system
        const inputSystem = this.getInputSystem();
        if (inputSystem) {
            inputSystem.stopDragging();
        }
    }

    findEntityAtPosition(x, y) {
        const entities = this.ecs.getEntitiesWithComponents(
            ComponentTypes.TRANSFORM,
            ComponentTypes.PHYSICS,
            ComponentTypes.RENDERABLE
        );

        // Check entities from front to back (reverse order for proper layering)
        for (let i = entities.length - 1; i >= 0; i--) {
            const entityId = entities[i];
            const transform = this.ecs.getComponent(entityId, ComponentTypes.TRANSFORM);
            const renderable = this.ecs.getComponent(entityId, ComponentTypes.RENDERABLE);
            
            if (this.isPointInEntity(x, y, transform, renderable)) {
                return entityId;
            }
        }
        
        return null;
    }

    isPointInEntity(x, y, transform, renderable) {
        const halfWidth = renderable.width / 2;
        const halfHeight = renderable.height / 2;
        
        return (
            x >= transform.x - halfWidth &&
            x <= transform.x + halfWidth &&
            y >= transform.y - halfHeight &&
            y <= transform.y + halfHeight
        );
    }

    getInputSystem() {
        // This would typically be injected or retrieved from a service locator
        // For now, we'll assume it's available globally or through the engine
        return window.gameEngine?.inputSystem;
    }

    update(deltaTime) {
        // Update any drag-related logic if needed
        // Most of the work is done in event handlers
    }
}
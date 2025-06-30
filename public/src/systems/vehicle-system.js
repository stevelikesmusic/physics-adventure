import { System, ComponentTypes } from '../core/ecs.js';
import { EventTypes } from '../core/events.js';

export class VehicleSystem extends System {
    constructor(eventBus, physicsSystem) {
        super();
        this.eventBus = eventBus;
        this.physicsSystem = physicsSystem;
        this.inputKeys = new Set();
        
        this.setupEventListeners();
        this.setupKeyboardInput();
    }

    setupEventListeners() {
        this.eventBus.on(EventTypes.ENTITY_CREATED, (data) => {
            if (data.type === 'vehicle') {
                console.log('Vehicle created:', data.entityId);
            }
        });
    }

    setupKeyboardInput() {
        document.addEventListener('keydown', (e) => {
            this.inputKeys.add(e.key.toLowerCase());
        });

        document.addEventListener('keyup', (e) => {
            this.inputKeys.delete(e.key.toLowerCase());
        });
    }

    update(deltaTime) {
        const vehicles = this.ecs.getEntitiesWithComponents(ComponentTypes.VEHICLE);
        
        vehicles.forEach(vehicleId => {
            this.updateVehicleInput(vehicleId, deltaTime);
        });
    }

    updateVehicleInput(vehicleId, deltaTime) {
        const vehicle = this.ecs.getComponent(vehicleId, ComponentTypes.VEHICLE);
        if (!vehicle || !vehicle.parts) return;

        const forceMultiplier = 0.01;
        let force = { x: 0, y: 0 };
        
        // Check for movement input
        if (this.inputKeys.has('arrowleft') || this.inputKeys.has('a')) {
            force.x = -forceMultiplier;
        }
        if (this.inputKeys.has('arrowright') || this.inputKeys.has('d')) {
            force.x = forceMultiplier;
        }
        
        // Apply force to wheels for movement
        if (force.x !== 0) {
            this.applyForceToVehicleWheels(vehicle.parts, force);
        }
    }

    applyForceToVehicleWheels(parts, force) {
        // Apply force to wheels (assuming last 2 parts are wheels)
        const wheelIndices = parts.length >= 2 ? [parts.length - 2, parts.length - 1] : [];
        
        wheelIndices.forEach(index => {
            const partId = parts[index];
            const physics = this.ecs.getComponent(partId, ComponentTypes.PHYSICS);
            
            if (physics && physics.body && physics.type === 'wheel') {
                this.physicsSystem.applyForce(partId, force);
            }
        });
    }

    createVehicle(x, y, type = 'simple_car') {
        const vehicleId = this.ecs.createEntity();
        
        switch (type) {
            case 'simple_car':
                return this.createSimpleCar(x, y);
            default:
                console.warn(`Unknown vehicle type: ${type}`);
                return null;
        }
    }

    createSimpleCar(x, y, material = 'wood') {
        const vehicleId = this.ecs.createEntity();
        
        // Create chassis
        const chassisId = this.createChassis(x, y, 80, 30, material);
        
        // Create wheels
        const frontWheelId = this.createWheel(x + 25, y + 20, 15, 'metal');
        const rearWheelId = this.createWheel(x - 25, y + 20, 15, 'metal');
        
        // Connect wheels to chassis
        this.connectWheelToChassis(chassisId, frontWheelId, 25, 20);
        this.connectWheelToChassis(chassisId, rearWheelId, -25, 20);
        
        // Add vehicle component
        this.ecs.addComponent(vehicleId, ComponentTypes.VEHICLE, {
            parts: [chassisId, frontWheelId, rearWheelId],
            type: 'simple_car',
            speed: 0,
            maxSpeed: 200,
            acceleration: 100
        });
        
        this.eventBus.emit(EventTypes.ENTITY_CREATED, {
            entityId: vehicleId,
            type: 'vehicle'
        });
        
        return vehicleId;
    }

    createChassis(x, y, width, height, material) {
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
            type: 'chassis',
            material: material,
            isStatic: false
        });

        const color = this.getMaterialColor(material);
        this.ecs.addComponent(entityId, ComponentTypes.RENDERABLE, {
            type: 'rect',
            width: width,
            height: height,
            color: color,
            layer: 2
        });

        this.physicsSystem.createPhysicsBody(entityId, 'block', {
            width: width,
            height: height,
            material: material
        });

        return entityId;
    }

    createWheel(x, y, radius, material) {
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
            type: 'wheel',
            material: material,
            isStatic: false
        });

        const color = this.getMaterialColor(material);
        this.ecs.addComponent(entityId, ComponentTypes.RENDERABLE, {
            type: 'circle',
            radius: radius,
            color: color,
            layer: 2
        });

        this.physicsSystem.createPhysicsBody(entityId, 'ball', {
            radius: radius,
            material: material
        });

        return entityId;
    }

    connectWheelToChassis(chassisId, wheelId, offsetX, offsetY) {
        const chassisPhysics = this.ecs.getComponent(chassisId, ComponentTypes.PHYSICS);
        const wheelPhysics = this.ecs.getComponent(wheelId, ComponentTypes.PHYSICS);
        const chassisTransform = this.ecs.getComponent(chassisId, ComponentTypes.TRANSFORM);
        
        if (!chassisPhysics.body || !wheelPhysics.body || !chassisTransform) {
            console.error('Cannot create wheel joint: missing components');
            return null;
        }

        const constraint = this.physicsSystem.physicsEngine.createWheelConstraint(
            chassisPhysics.body,
            wheelPhysics.body,
            { 
                x: chassisTransform.x + offsetX, 
                y: chassisTransform.y + offsetY 
            }
        );

        return constraint;
    }

    getMaterialColor(material) {
        const colors = {
            wood: '#8B4513',
            stone: '#696969',
            metal: '#C0C0C0'
        };
        return colors[material] || colors.wood;
    }
}
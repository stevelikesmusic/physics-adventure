import { ComponentTypes } from '../core/ecs.js';

export class VehicleFactory {
    constructor(ecs, physicsSystem) {
        this.ecs = ecs;
        this.physicsSystem = physicsSystem;
        this.vehicleComponents = new Map(); // Track vehicle parts
    }

    createSimpleCar(x, y, material = 'wood') {
        const vehicleId = this.ecs.createEntity();
        
        // Create chassis (main body)
        const chassisId = this.createChassis(x, y, 80, 30, material);
        
        // Create wheels
        const frontWheelId = this.createWheel(x + 25, y + 20, 15, 'metal');
        const rearWheelId = this.createWheel(x - 25, y + 20, 15, 'metal');
        
        // Connect wheels to chassis with joints
        const frontJoint = this.createWheelJoint(chassisId, frontWheelId, x + 25, y + 20);
        const rearJoint = this.createWheelJoint(chassisId, rearWheelId, x - 25, y + 20);
        
        // Store vehicle components
        this.vehicleComponents.set(vehicleId, {
            chassis: chassisId,
            wheels: [frontWheelId, rearWheelId],
            joints: [frontJoint, rearJoint],
            type: 'simple_car'
        });
        
        // Add vehicle component to main entity
        this.ecs.addComponent(vehicleId, ComponentTypes.VEHICLE, {
            parts: [chassisId, frontWheelId, rearWheelId],
            type: 'car',
            speed: 0,
            maxSpeed: 200,
            acceleration: 100
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

    createWheelJoint(chassisId, wheelId, x, y) {
        const chassisPhysics = this.ecs.getComponent(chassisId, ComponentTypes.PHYSICS);
        const wheelPhysics = this.ecs.getComponent(wheelId, ComponentTypes.PHYSICS);
        
        if (!chassisPhysics.body || !wheelPhysics.body) {
            console.error('Cannot create joint: missing physics bodies');
            return null;
        }

        const constraint = this.physicsSystem.physicsEngine.createWheelConstraint(
            chassisPhysics.body,
            wheelPhysics.body,
            { x: x, y: y }
        );

        return constraint;
    }

    applyForceToVehicle(vehicleId, force) {
        const vehicle = this.ecs.getComponent(vehicleId, ComponentTypes.VEHICLE);
        if (!vehicle) return;

        const components = this.vehicleComponents.get(vehicleId);
        if (!components) return;

        // Apply force to wheels for movement
        components.wheels.forEach(wheelId => {
            this.physicsSystem.applyForce(wheelId, force);
        });
    }

    destroyVehicle(vehicleId) {
        const components = this.vehicleComponents.get(vehicleId);
        if (!components) return;

        // Remove joints first
        components.joints.forEach(joint => {
            if (joint) {
                this.physicsSystem.physicsEngine.removeConstraint(joint);
            }
        });

        // Remove all parts
        components.parts.forEach(partId => {
            this.physicsSystem.removePhysicsBody(partId);
            this.ecs.removeEntity(partId);
        });

        // Remove main vehicle entity
        this.ecs.removeEntity(vehicleId);
        this.vehicleComponents.delete(vehicleId);
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
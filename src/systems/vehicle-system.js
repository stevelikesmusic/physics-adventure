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

        const forceMultiplier = 0.03;
        let force = { x: 0, y: 0 };
        
        // Check for movement input
        if (this.inputKeys.has('arrowleft') || this.inputKeys.has('a')) {
            force.x = -forceMultiplier;
        }
        if (this.inputKeys.has('arrowright') || this.inputKeys.has('d')) {
            force.x = forceMultiplier;
        }
        
        // Apply damping to reduce automatic movement when no input
        if (force.x === 0) {
            // this.applyDampingToVehicle(vehicle.parts);
        } else {
            this.applyForceToVehicleWheels(vehicle.parts, force);
        }
    }

    applyForceToVehicleWheels(parts, force) {
        // Apply force to wheels (parts array: [chassis, frontWheel, rearWheel])
        if (parts.length >= 3) {
            const frontWheelId = parts[1]; // Second part is front wheel
            const rearWheelId = parts[2];  // Third part is rear wheel
            
            [frontWheelId, rearWheelId].forEach((wheelId, index) => {
                const physics = this.ecs.getComponent(wheelId, ComponentTypes.PHYSICS);
                
                if (physics && physics.body && physics.type === 'wheel') {
                    this.physicsSystem.applyForce(wheelId, force);
                }
            });
        }
    }

    applyDampingToVehicle(parts) {
        // Apply counter-force to reduce automatic movement
        if (parts.length >= 3) {
            const frontWheelId = parts[1];
            const rearWheelId = parts[2];
            
            [frontWheelId, rearWheelId].forEach((wheelId) => {
                const physics = this.ecs.getComponent(wheelId, ComponentTypes.PHYSICS);
                
                if (physics && physics.body && physics.type === 'wheel') {
                    const body = physics.body;
                    // Apply opposing force proportional to velocity to create damping
                    const dampingForce = {
                        x: body.velocity.x > 0 ? body.velocity.x * -0.1 : 0,
                        y: 0
                    };
                    this.physicsSystem.applyForce(wheelId, dampingForce);
                }
            });
        }
    }

}
// Using global Matter object from CDN
const { Engine, Render, World, Bodies, Body, Events, Constraint } = Matter;

export class PhysicsEngine {
    constructor(canvas, eventBus) {
        this.canvas = canvas;
        this.eventBus = eventBus;
        
        this.engine = Engine.create();
        this.world = this.engine.world;
        
        this.engine.world.gravity.y = 0.8;
        
        this.bodies = new Map();
        this.setupCollisionDetection();
        this.createGround();
    }

    setupCollisionDetection() {
        Events.on(this.engine, 'collisionStart', (event) => {
            event.pairs.forEach(pair => {
                this.eventBus.emit('collision', {
                    bodyA: pair.bodyA,
                    bodyB: pair.bodyB,
                    collision: pair.collision
                });
            });
        });
    }

    createGround() {
        const groundHeight = this.canvas.height * 0.3;
        const ground = Bodies.rectangle(
            this.canvas.width / 2,
            this.canvas.height - groundHeight / 2,
            this.canvas.width,
            groundHeight,
            { 
                isStatic: true,
                label: 'ground',
                render: { fillStyle: '#8B4513' }
            }
        );
        
        World.add(this.world, ground);
        this.bodies.set('ground', ground);
    }

    createBlock(x, y, width, height, material = 'wood') {
        const materialProps = this.getMaterialProperties(material);
        
        const block = Bodies.rectangle(x, y, width, height, {
            density: materialProps.density,
            friction: materialProps.friction,
            restitution: materialProps.restitution,
            label: `block_${material}`,
            render: { fillStyle: materialProps.color }
        });

        World.add(this.world, block);
        return block;
    }

    createBall(x, y, radius, material = 'wood') {
        const materialProps = this.getMaterialProperties(material);
        
        const ball = Bodies.circle(x, y, radius, {
            density: materialProps.density,
            friction: materialProps.friction,
            restitution: materialProps.restitution,
            label: `ball_${material}`,
            render: { fillStyle: materialProps.color }
        });

        World.add(this.world, ball);
        return ball;
    }

    getMaterialProperties(material) {
        const materials = {
            wood: {
                density: 0.001,
                friction: 0.8,
                restitution: 0.3,
                color: '#8B4513'
            },
            stone: {
                density: 0.003,
                friction: 0.9,
                restitution: 0.1,
                color: '#696969'
            },
            metal: {
                density: 0.005,
                friction: 0.7,
                restitution: 0.5,
                color: '#C0C0C0'
            }
        };
        
        return materials[material] || materials.wood;
    }

    applyForce(body, force) {
        const position = { x: body.position.x, y: body.position.y };
        Body.applyForce(body, position, force);
    }

    removeBody(body) {
        World.remove(this.world, body);
    }

    update(deltaTime) {
        Engine.update(this.engine, deltaTime * 1000);
    }

    getAllBodies() {
        return this.world.bodies;
    }

    setGravity(x, y) {
        this.engine.world.gravity.x = x;
        this.engine.world.gravity.y = y;
    }

    createConstraint(bodyA, pointB, options = {}) {
        const constraint = Constraint.create({
            bodyA: bodyA,
            pointB: pointB,
            stiffness: options.stiffness || 0.8,
            damping: options.damping || 0.1,
            length: options.length || 0
        });
        
        World.add(this.world, constraint);
        return constraint;
    }

    updateConstraintPosition(constraint, newPosition) {
        constraint.pointB = newPosition;
    }

    removeConstraint(constraint) {
        World.remove(this.world, constraint);
    }

    createWheelConstraint(chassisBody, wheelBody, position) {
        const constraint = Constraint.create({
            bodyA: chassisBody,
            bodyB: wheelBody,
            pointA: { x: position.x - chassisBody.position.x, y: position.y - chassisBody.position.y },
            pointB: { x: 0, y: 0 },
            stiffness: 0.8,
            damping: 0.1,
            length: 0
        });
        
        World.add(this.world, constraint);
        return constraint;
    }
}
# Physics Adventure Sandbox - System Architecture

## Overview

This document outlines the complete system architecture for the Physics Adventure Sandbox game, designed around Entity Component System (ECS) architecture with modular subsystems for maximum extensibility and maintainability.

## Core Architecture Pattern: Entity Component System (ECS)

### Entity System
- **Entity**: Unique identifier for game objects
- **Component**: Pure data containers (no logic)
- **System**: Logic processors that operate on entities with specific component combinations

```javascript
// Example Entity Structure
const entity1 = {
  id: uuid(),
  components: new Set(['transform', 'rigidbody', 'renderable'])
};
```

## Component Types

### Core Components
- **Transform**: Position, rotation, scale
- **RigidBody**: Physics properties (mass, velocity, friction)
- **Renderable**: Visual representation data
- **Collider**: Collision detection boundaries
- **Input**: Input handling capabilities
- **Lifetime**: Time-based existence management

### Game-Specific Components
- **Block**: Material type, density, durability
- **Projectile**: Launch parameters, trajectory data
- **Vehicle**: Wheel attachments, motor properties
- **RobotMouse**: AI state, pathfinding data
- **FluidParticle**: Viscosity, flow properties
- **AquaticLife**: Behavior type, health, ecosystem role
- **Tool**: Tool type, interaction mode
- **Environment**: Theme, gravity settings

## System Architecture

### 1. Core Systems

#### Physics System
- **Responsibility**: Handles all physics simulation
- **Engine**: Matter.js for 2D physics
- **Components**: Transform, RigidBody, Collider
- **Features**:
  - Gravity simulation
  - Collision detection/response
  - Force application
  - Constraint management

#### Rendering System
- **Responsibility**: All visual output
- **Technology**: HTML5 Canvas with optimizations
- **Components**: Transform, Renderable
- **Features**:
  - Sprite rendering
  - Particle effects
  - UI overlays
  - Debug visualization
  - Spatial culling for performance

#### Input System
- **Responsibility**: User interaction processing
- **Components**: Input, Transform
- **Interaction Types**:
  - Drag & Drop (object manipulation)
  - Tap & Hold (water creation)
  - Click & Release (projectile launch)
  - Construction Mode (building)

### 2. Game Feature Systems

#### Block Construction System
- **Components**: Block, Transform, RigidBody, Renderable
- **Materials**: Wood (density: 0.6), Stone (2.5), Metal (7.8)
- **Interaction**: Drag-and-drop placement, snapping to grid
- **Physics**: Full collision response, stacking stability

#### Projectile System
- **Components**: Projectile, Transform, RigidBody, Renderable, Lifetime
- **Launch Mechanics**: 
  - Click-and-drag trajectory preview
  - Force calculation based on mouse distance
  - Real-time physics simulation
- **Projectile Types**: Balls, cannonballs, custom shapes

#### Vehicle System
- **Components**: Vehicle, Transform, RigidBody, Multiple Colliders
- **Assembly**: Block + Wheel combination system
- **Physics**: Wheel constraints, motor forces, friction simulation
- **Control**: Player-applied forces or autonomous movement

#### Robot Mouse AI System
- **Components**: RobotMouse, Transform, RigidBody, Renderable
- **AI Features**:
  - A* pathfinding algorithm
  - Dynamic obstacle avoidance
  - Goal-seeking behavior
  - State machine (Seeking, Navigating, Stuck, Success)

#### Fluid Dynamics System
- **Components**: FluidParticle, Transform, RigidBody (lightweight)
- **Simulation**: Particle-based fluid with neighbor interactions
- **Features**:
  - Tap-and-hold water creation
  - Buoyancy forces on objects
  - Viscosity simulation
  - Conservation of volume

#### Aquatic Life System
- **Components**: AquaticLife, Transform, RigidBody, AI_Behavior
- **Behaviors**:
  - Flocking (boids algorithm)
  - Feeding patterns
  - Predator-prey relationships
  - Environmental responses

#### Environmental System
- **Components**: Environment (global singleton)
- **Controls**:
  - Gravity strength/direction
  - Visual themes
  - Ambient effects
  - Hazard placement

## Game State Management

### State Architecture
```javascript
const GameState = {
  // Game Mode
  currentMode: 'construction', // construction, simulation, test
  
  // Entity Management
  entities: Map<EntityId, Entity>(),
  components: Map<ComponentType, Map<EntityId, ComponentData>>(),
  
  // System State
  physics: PhysicsWorld,
  renderer: RenderContext,
  input: InputManager,
  
  // Game Settings
  environment: EnvironmentConfig,
  tools: ToolManager,
  
  // Save Data
  creations: SavedCreation[]
};
```

### State Management Patterns
- **Command Pattern**: For undo/redo functionality
- **Observer Pattern**: For system communication
- **Factory Pattern**: For entity/component creation

## User Interface & Interaction Systems

### Tool System Architecture
```javascript
const ToolManager = {
  tools: {
    block: BlockTool,
    projectile: ProjectileTool,
    water: WaterTool,
    vehicle: VehicleTool,
    mouse: MouseTool,
    environment: EnvironmentTool
  },
  currentTool: null,
  
  switchTool(toolType) {
    this.currentTool?.deactivate();
    this.currentTool = this.tools[toolType];
    this.currentTool.activate();
  }
};
```

### Interaction Modes
- **Construction Mode**: Place/remove objects, build structures
- **Simulation Mode**: Watch physics play out, limited interaction
- **Test Mode**: Interact with vehicles, trigger events

### UI Components
- **Tool Palette**: Visual tool selection
- **Property Panel**: Object configuration
- **Environment Controls**: Gravity, theme settings
- **Creation Gallery**: Save/load interface

## Save/Load System

### Save Data Structure
```javascript
const SavedCreation = {
  id: uuid(),
  name: string,
  timestamp: Date,
  preview: ImageData,
  entities: SerializedEntity[],
  environment: EnvironmentSettings
};
```

### Serialization Strategy
- **Component-based**: Save only necessary component data
- **Reference Resolution**: Handle entity relationships
- **Version Compatibility**: Schema versioning for future updates
- **Compression**: Binary format for large creations

## System Interactions & Communication

### Event System
```javascript
const EventBus = {
  // Physics Events
  'collision': (entityA, entityB) => {},
  'object-created': (entity) => {},
  'object-destroyed': (entity) => {},
  
  // Game Events
  'tool-changed': (newTool) => {},
  'mode-changed': (newMode) => {},
  'environment-changed': (setting) => {},
  
  // AI Events
  'mouse-goal-reached': (mouseEntity) => {},
  'pathfinding-failed': (mouseEntity) => {}
};
```

### System Dependencies
```
Input System → Tool Manager → Entity Creation
Physics System → Rendering System (visual feedback)
AI System → Physics System (pathfinding obstacles)
Fluid System → Physics System (buoyancy forces)
Environment System → All Systems (global effects)
```

## Performance Considerations

### Optimization Strategies
1. **Spatial Partitioning**: Quadtree for collision detection
2. **Object Pooling**: Reuse entities/components
3. **Level of Detail**: Simplified physics for distant objects
4. **Culling**: Skip processing for off-screen entities
5. **Update Scheduling**: Stagger expensive operations
6. **Memory Management**: Component arrays for cache efficiency

### Performance Monitoring
- FPS counter
- Entity count tracking
- Memory usage metrics
- Physics step timing

## Module Structure

```
src/
├── core/
│   ├── ecs/                  # Entity Component System
│   ├── input/               # Input handling
│   ├── events/              # Event system
│   └── utils/               # Utilities
├── systems/
│   ├── physics/             # Physics simulation
│   ├── rendering/           # Visual rendering
│   ├── ai/                  # Artificial intelligence
│   ├── fluid/               # Fluid dynamics
│   └── environment/         # Environmental effects
├── components/              # All component definitions
├── tools/                   # Tool implementations
├── ui/                      # User interface
├── save/                    # Save/load system
└── game/                    # Game-specific logic
```

## Technology Stack

- **Core**: Vanilla JavaScript (ES6+)
- **Physics**: Matter.js
- **Rendering**: HTML5 Canvas
- **Build**: Webpack/Vite for bundling
- **Storage**: LocalStorage + IndexedDB for saves
- **Testing**: Jest for unit tests

## Development Workflow

### Feature Development Process
1. Define required components
2. Implement system logic
3. Create tool interface
4. Add UI controls
5. Test interactions with existing systems
6. Performance optimization
7. Save/load integration

### Testing Strategy
- **Unit Tests**: Individual systems and components
- **Integration Tests**: System interactions
- **Performance Tests**: Frame rate and memory usage
- **User Tests**: Interaction flow validation

## Extensibility Design

### Adding New Features
1. **New Components**: Define data structure
2. **New Systems**: Implement logic processor
3. **Tool Integration**: Add to tool manager
4. **UI Addition**: Create interface elements
5. **Save Format**: Update serialization

### Plugin Architecture
Future consideration for user-created tools and components through a plugin system with safe sandboxing.

## Conclusion

This architecture provides a robust, modular foundation for the Physics Adventure Sandbox. The ECS pattern ensures clean separation of concerns, while the modular system design allows for independent feature development. Performance optimizations and extensibility considerations make this suitable for both current requirements and future enhancements.
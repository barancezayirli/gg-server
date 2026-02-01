# Dungeon Crawler - Live Code Interview Platform

## Purpose

A fun, simplified version of an IoT platform for live code interviews. The system mimics a real-world architecture (engines producing data streams, gateways consuming/persisting events) using a dungeon crawler game theme.

## Interview Tracks

- **Candidate 1**: Add a Notification Service that subscribes to dungeon events, calculates player proximity, and publishes alerts
- **Candidate 2**: Automate testing of the existing system (GraphQL, event flow, persistence)

## Architecture

Single NestJS process. All services are NestJS modules sharing an in-memory event bus.

```
AppModule
  ├── EventBusModule        (global singleton, in-memory pub/sub)
  ├── DungeonEngineModule   (timer-based, produces dungeon events)
  ├── RepositoryModule      (persists events, exposes REST for profile/history)
  └── ConsumerModule        (GraphQL + subscriptions, player-facing)
```

### Workspace Structure

```
apps/
  gg-gateway/                → Main process, bootstraps all modules

libs/
  modules/
    dungeon-engine/          → DungeonEngineModule
    repository/              → RepositoryModule
    consumer/                → ConsumerModule
  shared/
    event-bus/               → EventBusModule
    types/                   → Interfaces, enums, event payloads
```

Candidate 1 adds:
```
libs/
  modules/
    notification/            → NotificationModule (new service)
```

## Data Model

### Dungeon Map
Simple 2D grid (20x20). Cells: floor, wall, entrance, treasure room.

### Player
- `id`, `name`, `position {x, y}`, `hp`, `xp`, `class` (warrior/mage/rogue)
- Players interact via Consumer Gateway (GraphQL mutations)
- Profile and history stored in Repository

### Monster
- `id`, `type` (goblin/skeleton/dragon), `position {x, y}`, `hp`, `damage`
- Generated and moved by Dungeon Engine on a timer

### Events

| Event | Payload | Producer |
|-------|---------|----------|
| `monster.spawned` | `{id, type, position}` | Dungeon Engine |
| `monster.moved` | `{id, from, to}` | Dungeon Engine |
| `monster.attacked` | `{monsterId, playerId, damage}` | Dungeon Engine |
| `player.damaged` | `{playerId, damage, hp}` | Dungeon Engine |
| `loot.dropped` | `{id, type, position}` | Dungeon Engine |
| `player.moved` | `{playerId, from, to}` | Consumer Gateway |

Candidate 1 adds:
| `alert.boss_nearby` | `{playerId, monsterId, distance}` | Notification Service |
| `alert.loot_nearby` | `{playerId, lootId, distance}` | Notification Service |

## Event Flow

### Tick Cycle (every 2-3 seconds)

```
Dungeon Engine (tick)
  ├─ spawns monster at position
  │   → publishes "monster.spawned"
  ├─ moves monsters
  │   → publishes "monster.moved"
  └─ monster attacks adjacent player
      → publishes "monster.attacked"

Consumer Gateway receives events → pushes to players via GraphQL subscriptions
Repository receives events → appends to in-memory store
```

### Player Action

```
Player sends movePlayer(direction)
  → Consumer Gateway validates move (not a wall)
  → publishes "player.moved"
  → Repository persists
  → Dungeon Engine reacts (monster aggro if nearby)
```

### Notification Service (Candidate 1 builds this)

```
Subscribes to: monster.spawned, monster.moved, loot.dropped
Cross-references with player positions (from player.moved)
  → publishes "alert.boss_nearby" / "alert.loot_nearby"
  → Consumer Gateway pushes to specific player
```

## Module Responsibilities

### EventBusModule (shared lib)
- In-memory pub/sub (EventEmitter-style)
- Injectable `EventBusService` with `publish(topic, payload)` and `subscribe(topic, handler)`
- Global module, singleton across the process

### DungeonEngineModule
- Timer-based (2-3 second intervals)
- Maintains dungeon state: map grid, active monsters
- Spawns, moves, and triggers monster attacks
- Publishes events to EventBus
- Listens to `player.moved` to update its internal state (monster aggro)

### ConsumerModule
- GraphQL schema with queries, mutations, subscriptions
- Queries: `myProfile` (calls Repository), `dungeonMap`
- Mutations: `joinGame(name, class)`, `movePlayer(direction)`
- Subscriptions: `dungeonEvents`, `playerAlerts`
- Single entry point for all player interaction

### RepositoryModule
- Subscribes to all events from EventBus
- In-memory store for player profiles, event history, leaderboard
- Exposes REST API for Consumer Gateway: `GET /players/:id/profile`, `GET /leaderboard`

### NotificationModule (Candidate 1)
- Subscribes to monster/loot events
- Tracks player positions from `player.moved` events
- Calculates proximity between players and threats/loot
- Publishes alert events to EventBus

## Running

```
npx nx serve gg-gateway    # starts everything
```

## Tech Stack

- NX monorepo
- NestJS 11
- GraphQL (with subscriptions)
- In-memory event bus (shared NX lib)
- In-memory data store
- TypeScript strict mode

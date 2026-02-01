# GG Server - Dungeon Crawler

A real-time dungeon crawler game server built with NestJS and NX. This project simulates an event-driven IoT platform architecture using a fun game theme.

## Architecture

The system uses an **event-driven architecture** where isolated services communicate through an in-memory event bus (mimicking Kafka in a production system).

```
                        ┌──────────────────────┐
                        │    Consumer Gateway   │
                        │  (GraphQL + WebSocket)│
                        │                       │
Players ◄──────────────►│  Queries / Mutations  │
(browser/client)        │  Subscriptions        │
                        └──────────┬───────────┘
                                   │
                            ┌──────┴──────┐
                            │  Event Bus  │
                            │ (in-memory) │
                            └──┬──────┬───┘
                               │      │
              ┌────────────────┘      └────────────────┐
              ▼                                        ▼
┌─────────────────────┐                  ┌─────────────────────┐
│   Dungeon Engine    │                  │  Repository Gateway │
│                     │                  │                     │
│  Timer-based (3s)   │                  │  Persists events    │
│  Spawns monsters    │                  │  Player profiles    │
│  Moves monsters     │                  │  Leaderboard        │
│  Triggers combat    │                  │  REST API           │
│  Drops loot         │                  │                     │
└─────────────────────┘                  └─────────────────────┘
```

### Key Concepts

- **Event Bus**: All services communicate through events, never directly. This decouples producers from consumers, just like Kafka does in a distributed system.
- **Modules as Services**: Each NX library is an isolated NestJS module with its own responsibility. They share nothing except the event bus and type definitions.
- **Single Process**: All modules run in one NestJS process for simplicity, but the architecture mirrors a microservice deployment.

## Workspace Structure

```
apps/
  gg-gateway/              # Main process, bootstraps all modules
  gg-gateway-e2e/          # End-to-end tests (Jest + Axios)

libs/
  shared/
    event-bus/             # EventBusModule - in-memory pub/sub (RxJS Subject)
    types/                 # Shared interfaces, enums, event payloads
  modules/
    dungeon-engine/        # DungeonEngineModule - game world simulation
    repository/            # RepositoryModule - persistence + REST API
    consumer/              # ConsumerModule - GraphQL for players
```

## Data Model

### Player
`id`, `name`, `position {x, y}`, `hp`, `xp`, `playerClass` (Warrior / Mage / Rogue)

### Monster
`id`, `type` (Goblin / Skeleton / Dragon), `position {x, y}`, `hp`, `damage`

### Dungeon Map
20x20 grid. Cell types: `floor`, `wall`, `entrance`, `treasure_room`

### Events

| Event | Payload | Producer |
|---|---|---|
| `monster.spawned` | `{monster}` | Dungeon Engine |
| `monster.moved` | `{monsterId, from, to}` | Dungeon Engine |
| `monster.attacked` | `{monsterId, playerId, damage}` | Dungeon Engine |
| `player.damaged` | `{playerId, damage, remainingHp}` | Dungeon Engine |
| `player.moved` | `{playerId, from, to}` | Consumer Gateway |
| `player.joined` | `{player}` | Consumer Gateway |
| `loot.dropped` | `{loot}` | Dungeon Engine |

## Event Flow

```
Dungeon Engine (every 3s)
  ├── spawns monster → publishes "monster.spawned"
  ├── moves monsters → publishes "monster.moved"
  ├── attacks nearby players → publishes "monster.attacked" + "player.damaged"
  └── drops loot → publishes "loot.dropped"

Consumer Gateway receives all events → pushes to players via GraphQL subscriptions
Repository Gateway receives all events → persists to in-memory store
```

Player actions flow in the opposite direction:

```
Player sends movePlayer(direction)
  → Consumer Gateway validates move (wall check)
  → publishes "player.moved"
  → Repository Gateway persists new position
  → Dungeon Engine updates internal state (monster aggro)
```

## API Reference

### GraphQL (POST /graphql)

**Mutations:**
- `joinGame(name: String!, playerClass: PlayerClass!): Player` - Join the dungeon
- `movePlayer(playerId: String!, direction: String!): Position` - Move (north/south/east/west)

**Queries:**
- `myProfile(playerId: String!): PlayerProfile` - Get player stats from Repository
- `leaderboard: [PlayerProfile]` - All players sorted by XP
- `dungeonMap: [[String]]` - The dungeon grid

**Subscriptions (WebSocket via graphql-ws):**
- `dungeonEvents: DungeonEvent` - Real-time stream of all dungeon events

### REST (internal, used by Consumer Gateway)

- `GET /api/repository/players` - All player profiles
- `GET /api/repository/players/:id/profile` - Single player profile
- `GET /api/repository/leaderboard` - Leaderboard

## Getting Started

```sh
npm install
npx nx build gg-gateway
npx nx serve gg-gateway
```

The server starts at `http://localhost:3000`. GraphQL playground is available at `http://localhost:3000/graphql`.

## Running Tests

```sh
# Unit tests
npx nx test

# E2E tests (requires server running)
npx nx serve gg-gateway   # in one terminal
npx nx e2e gg-gateway-e2e # in another
```

## NX Commands

```sh
# Build
npx nx build gg-gateway

# Serve with hot reload
npx nx serve gg-gateway

# Generate a new NestJS library
npx nx g @nx/nest:library --name=my-module --directory=libs/modules/my-module

# Visualize project graph
npx nx graph
```

// ── Map ──────────────────────────────────────────

export enum CellType {
  Floor = 'floor',
  Wall = 'wall',
  Entrance = 'entrance',
  TreasureRoom = 'treasure_room',
}

export interface Position {
  x: number;
  y: number;
}

export interface DungeonMap {
  width: number;
  height: number;
  cells: CellType[][];
}

// ── Player ───────────────────────────────────────

export enum PlayerClass {
  Warrior = 'warrior',
  Mage = 'mage',
  Rogue = 'rogue',
}

export interface Player {
  id: string;
  name: string;
  position: Position;
  hp: number;
  xp: number;
  playerClass: PlayerClass;
}

// ── Monster ──────────────────────────────────────

export enum MonsterType {
  Goblin = 'goblin',
  Skeleton = 'skeleton',
  Dragon = 'dragon',
}

export interface Monster {
  id: string;
  type: MonsterType;
  position: Position;
  hp: number;
  damage: number;
}

// ── Loot ─────────────────────────────────────────

export enum LootType {
  Gold = 'gold',
  Potion = 'potion',
  Weapon = 'weapon',
}

export interface Loot {
  id: string;
  type: LootType;
  position: Position;
}

// ── Events ───────────────────────────────────────

export enum EventTopic {
  MonsterSpawned = 'monster.spawned',
  MonsterMoved = 'monster.moved',
  MonsterAttacked = 'monster.attacked',
  PlayerDamaged = 'player.damaged',
  PlayerMoved = 'player.moved',
  PlayerJoined = 'player.joined',
  LootDropped = 'loot.dropped',
  // Candidate 1 will add alert topics here
}

export interface MonsterSpawnedEvent {
  monster: Monster;
}

export interface MonsterMovedEvent {
  monsterId: string;
  from: Position;
  to: Position;
}

export interface MonsterAttackedEvent {
  monsterId: string;
  playerId: string;
  damage: number;
}

export interface PlayerDamagedEvent {
  playerId: string;
  damage: number;
  remainingHp: number;
}

export interface PlayerMovedEvent {
  playerId: string;
  from: Position;
  to: Position;
}

export interface PlayerJoinedEvent {
  player: Player;
}

export interface LootDroppedEvent {
  loot: Loot;
}

export type DungeonEvent =
  | { topic: EventTopic.MonsterSpawned; data: MonsterSpawnedEvent }
  | { topic: EventTopic.MonsterMoved; data: MonsterMovedEvent }
  | { topic: EventTopic.MonsterAttacked; data: MonsterAttackedEvent }
  | { topic: EventTopic.PlayerDamaged; data: PlayerDamagedEvent }
  | { topic: EventTopic.PlayerMoved; data: PlayerMovedEvent }
  | { topic: EventTopic.PlayerJoined; data: PlayerJoinedEvent }
  | { topic: EventTopic.LootDropped; data: LootDroppedEvent };

import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { EventBusService } from '@gg-server/event-bus';
import {
  EventTopic,
  MonsterType,
  LootType,
  CellType,
} from '@gg-server/types';
import type {
  Monster,
  Player,
  PlayerJoinedEvent,
  PlayerMovedEvent,
  Position,
  DungeonMap,
} from '@gg-server/types';
import { generateDungeonMap, isWalkable } from './dungeon-map.js';
import { randomUUID } from 'node:crypto';

const TICK_INTERVAL_MS = 3000;
const MAX_MONSTERS = 5;
const SPAWN_CHANCE = 0.3;
const LOOT_DROP_CHANCE = 0.1;
const ATTACK_RANGE = 1;

const MONSTER_STATS: Record<MonsterType, { hp: number; damage: number }> = {
  [MonsterType.Goblin]: { hp: 20, damage: 5 },
  [MonsterType.Skeleton]: { hp: 30, damage: 8 },
  [MonsterType.Dragon]: { hp: 100, damage: 25 },
};

@Injectable()
export class DungeonEngineService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DungeonEngineService.name);
  private timer: ReturnType<typeof setInterval> | null = null;

  readonly map: DungeonMap;
  readonly monsters = new Map<string, Monster>();
  readonly players = new Map<string, Player>();

  constructor(private readonly eventBus: EventBusService) {
    this.map = generateDungeonMap();
  }

  onModuleInit(): void {
    this.listenForPlayers();
    this.startEngine();
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  private listenForPlayers(): void {
    this.eventBus.subscribe(EventTopic.PlayerJoined).subscribe((raw) => {
      const data = raw as PlayerJoinedEvent;
      this.players.set(data.player.id, { ...data.player });
    });

    this.eventBus.subscribe(EventTopic.PlayerMoved).subscribe((raw) => {
      const data = raw as PlayerMovedEvent;
      const player = this.players.get(data.playerId);
      if (player) {
        player.position = { ...data.to };
      }
    });
  }

  private startEngine(): void {
    this.logger.log('Dungeon engine started');
    this.timer = setInterval(() => this.tick(), TICK_INTERVAL_MS);
  }

  private tick(): void {
    this.maybeSpawnMonster();
    this.moveMonsters();
    this.attackNearbyPlayers();
    this.maybeDropLoot();
  }

  private maybeSpawnMonster(): void {
    if (this.monsters.size >= MAX_MONSTERS) return;
    if (Math.random() > SPAWN_CHANCE) return;

    const position = this.randomFloorPosition();
    if (!position) return;

    const types = Object.values(MonsterType);
    const type = types[Math.floor(Math.random() * types.length)];
    const stats = MONSTER_STATS[type];

    const monster: Monster = {
      id: randomUUID(),
      type,
      position,
      hp: stats.hp,
      damage: stats.damage,
    };

    this.monsters.set(monster.id, monster);
    this.eventBus.publish({
      topic: EventTopic.MonsterSpawned,
      data: { monster },
    });
    this.logger.debug(`Spawned ${type} at (${position.x},${position.y})`);
  }

  private moveMonsters(): void {
    for (const monster of this.monsters.values()) {
      const directions = [
        { x: 0, y: -1 },
        { x: 0, y: 1 },
        { x: -1, y: 0 },
        { x: 1, y: 0 },
      ];
      const dir = directions[Math.floor(Math.random() * directions.length)];
      const newX = monster.position.x + dir.x;
      const newY = monster.position.y + dir.y;

      if (!isWalkable(this.map, newX, newY)) continue;

      const from = { ...monster.position };
      monster.position = { x: newX, y: newY };

      this.eventBus.publish({
        topic: EventTopic.MonsterMoved,
        data: { monsterId: monster.id, from, to: monster.position },
      });
    }
  }

  private attackNearbyPlayers(): void {
    for (const monster of this.monsters.values()) {
      for (const player of this.players.values()) {
        if (player.hp <= 0) continue;
        const dist = Math.abs(monster.position.x - player.position.x)
          + Math.abs(monster.position.y - player.position.y);

        if (dist <= ATTACK_RANGE) {
          player.hp = Math.max(0, player.hp - monster.damage);

          this.eventBus.publish({
            topic: EventTopic.MonsterAttacked,
            data: {
              monsterId: monster.id,
              playerId: player.id,
              damage: monster.damage,
            },
          });

          this.eventBus.publish({
            topic: EventTopic.PlayerDamaged,
            data: {
              playerId: player.id,
              damage: monster.damage,
              remainingHp: player.hp,
            },
          });
        }
      }
    }
  }

  private maybeDropLoot(): void {
    if (Math.random() > LOOT_DROP_CHANCE) return;

    const position = this.randomFloorPosition();
    if (!position) return;

    const types = Object.values(LootType);
    const type = types[Math.floor(Math.random() * types.length)];

    this.eventBus.publish({
      topic: EventTopic.LootDropped,
      data: {
        loot: { id: randomUUID(), type, position },
      },
    });
  }

  private randomFloorPosition(): Position | null {
    for (let attempt = 0; attempt < 50; attempt++) {
      const x = Math.floor(Math.random() * (this.map.width - 2)) + 1;
      const y = Math.floor(Math.random() * (this.map.height - 2)) + 1;
      if (this.map.cells[y][x] === CellType.Floor) {
        return { x, y };
      }
    }
    return null;
  }
}

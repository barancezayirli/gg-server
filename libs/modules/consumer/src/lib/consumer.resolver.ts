import {
  Resolver,
  Query,
  Mutation,
  Subscription,
  Args,
} from '@nestjs/graphql';
import { EventBusService } from '@gg-server/event-bus';
import { DungeonEngineService } from '@gg-server/dungeon-engine';
import { RepositoryService } from '@gg-server/repository';
import { EventTopic, PlayerClass } from '@gg-server/types';
import type { Player, Position } from '@gg-server/types';
import { PlayerModel, PlayerProfileModel, PositionModel } from './models/player.model.js';
import { DungeonEventModel } from './models/dungeon-event.model.js';
import { PubSub } from 'graphql-subscriptions';
import { randomUUID } from 'node:crypto';
import { NotFoundException } from '@nestjs/common';
import { isWalkable } from '@gg-server/dungeon-engine';

const pubSub = new PubSub();
const DUNGEON_EVENTS = 'dungeonEvents';

@Resolver()
export class ConsumerResolver {
  constructor(
    private readonly eventBus: EventBusService,
    private readonly dungeonEngine: DungeonEngineService,
    private readonly repository: RepositoryService,
  ) {
    this.eventBus.subscribeAll().subscribe((event) => {
      pubSub.publish(DUNGEON_EVENTS, { dungeonEvents: event });
    });
  }

  @Query(() => [PlayerProfileModel])
  leaderboard() {
    return this.repository.getLeaderboard();
  }

  @Query(() => PlayerProfileModel)
  myProfile(@Args('playerId') playerId: string) {
    const profile = this.repository.getPlayerProfile(playerId);
    if (!profile) throw new NotFoundException(`Player ${playerId} not found`);
    return profile;
  }

  @Query(() => [[String]])
  dungeonMap() {
    return this.dungeonEngine.map.cells;
  }

  @Mutation(() => PlayerModel)
  joinGame(
    @Args('name') name: string,
    @Args('playerClass', { type: () => PlayerClass }) playerClass: PlayerClass,
  ) {
    const player: Player = {
      id: randomUUID(),
      name,
      position: { x: 1, y: 1 }, // spawn at entrance
      hp: 100,
      xp: 0,
      playerClass,
    };

    this.eventBus.publish({
      topic: EventTopic.PlayerJoined,
      data: { player },
    });

    return player;
  }

  @Mutation(() => PositionModel)
  movePlayer(
    @Args('playerId') playerId: string,
    @Args('direction') direction: string,
  ) {
    const player = this.dungeonEngine.players.get(playerId);
    if (!player) throw new NotFoundException(`Player ${playerId} not found`);

    const dirMap: Record<string, Position> = {
      north: { x: 0, y: -1 },
      south: { x: 0, y: 1 },
      east: { x: 1, y: 0 },
      west: { x: -1, y: 0 },
    };

    const delta = dirMap[direction.toLowerCase()];
    if (!delta) throw new Error(`Invalid direction: ${direction}`);

    const newX = player.position.x + delta.x;
    const newY = player.position.y + delta.y;

    if (!isWalkable(this.dungeonEngine.map, newX, newY)) {
      return player.position;
    }

    const from = { ...player.position };
    const to = { x: newX, y: newY };

    this.eventBus.publish({
      topic: EventTopic.PlayerMoved,
      data: { playerId, from, to },
    });

    return to;
  }

  @Subscription(() => DungeonEventModel, { resolve: (value) => value.dungeonEvents })
  dungeonEvents() {
    return pubSub.asyncIterableIterator(DUNGEON_EVENTS);
  }
}

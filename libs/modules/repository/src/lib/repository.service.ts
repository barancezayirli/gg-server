import { Injectable, OnModuleInit } from '@nestjs/common';
import { EventBusService } from '@gg-server/event-bus';
import { EventTopic } from '@gg-server/types';
import type { Player, DungeonEvent } from '@gg-server/types';

export interface PlayerProfile {
  player: Player;
  totalDamageReceived: number;
  monstersEncountered: number;
  lootCollected: number;
}

@Injectable()
export class RepositoryService implements OnModuleInit {
  private readonly players = new Map<string, PlayerProfile>();
  private readonly eventLog: DungeonEvent[] = [];

  constructor(private readonly eventBus: EventBusService) {}

  onModuleInit(): void {
    this.eventBus.subscribeAll().subscribe((event) => {
      this.eventLog.push(event);
      this.handleEvent(event);
    });
  }

  private handleEvent(event: DungeonEvent): void {
    switch (event.topic) {
      case EventTopic.PlayerJoined: {
        this.players.set(event.data.player.id, {
          player: { ...event.data.player },
          totalDamageReceived: 0,
          monstersEncountered: 0,
          lootCollected: 0,
        });
        break;
      }
      case EventTopic.PlayerMoved: {
        const profile = this.players.get(event.data.playerId);
        if (profile) {
          profile.player.position = { ...event.data.to };
        }
        break;
      }
      case EventTopic.PlayerDamaged: {
        const profile = this.players.get(event.data.playerId);
        if (profile) {
          profile.totalDamageReceived += event.data.damage;
          profile.player.hp = event.data.remainingHp;
        }
        break;
      }
      case EventTopic.MonsterAttacked: {
        const profile = this.players.get(event.data.playerId);
        if (profile) {
          profile.monstersEncountered++;
        }
        break;
      }
    }
  }

  getPlayerProfile(playerId: string): PlayerProfile | undefined {
    return this.players.get(playerId);
  }

  getAllPlayers(): PlayerProfile[] {
    return Array.from(this.players.values());
  }

  getLeaderboard(): PlayerProfile[] {
    return this.getAllPlayers()
      .sort((a, b) => b.player.xp - a.player.xp);
  }

  getEventLog(): DungeonEvent[] {
    return this.eventLog;
  }
}

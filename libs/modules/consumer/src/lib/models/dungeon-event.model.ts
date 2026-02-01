import { ObjectType, Field, createUnionType } from '@nestjs/graphql';
import { registerEnumType, Int } from '@nestjs/graphql';
import { EventTopic, MonsterType, LootType } from '@gg-server/types';
import { PositionModel } from './player.model.js';

registerEnumType(EventTopic, { name: 'EventTopic' });
registerEnumType(MonsterType, { name: 'MonsterType' });
registerEnumType(LootType, { name: 'LootType' });

@ObjectType()
export class MonsterModel {
  @Field()
  id!: string;

  @Field(() => MonsterType)
  type!: MonsterType;

  @Field(() => PositionModel)
  position!: PositionModel;

  @Field(() => Int)
  hp!: number;

  @Field(() => Int)
  damage!: number;
}

@ObjectType()
export class MonsterSpawnedPayload {
  @Field(() => MonsterModel)
  monster!: MonsterModel;
}

@ObjectType()
export class MonsterMovedPayload {
  @Field()
  monsterId!: string;

  @Field(() => PositionModel)
  from!: PositionModel;

  @Field(() => PositionModel)
  to!: PositionModel;
}

@ObjectType()
export class MonsterAttackedPayload {
  @Field()
  monsterId!: string;

  @Field()
  playerId!: string;

  @Field(() => Int)
  damage!: number;
}

@ObjectType()
export class PlayerDamagedPayload {
  @Field()
  playerId!: string;

  @Field(() => Int)
  damage!: number;

  @Field(() => Int)
  remainingHp!: number;
}

@ObjectType()
export class LootModel {
  @Field()
  id!: string;

  @Field(() => LootType)
  type!: LootType;

  @Field(() => PositionModel)
  position!: PositionModel;
}

@ObjectType()
export class LootDroppedPayload {
  @Field(() => LootModel)
  loot!: LootModel;
}

export const DungeonEventUnion = createUnionType({
  name: 'DungeonEventPayload',
  types: () =>
    [
      MonsterSpawnedPayload,
      MonsterMovedPayload,
      MonsterAttackedPayload,
      PlayerDamagedPayload,
      LootDroppedPayload,
    ] as const,
  resolveType(value) {
    if ('monster' in value) return MonsterSpawnedPayload;
    if ('monsterId' in value && 'from' in value) return MonsterMovedPayload;
    if ('monsterId' in value && 'damage' in value) return MonsterAttackedPayload;
    if ('remainingHp' in value) return PlayerDamagedPayload;
    if ('loot' in value) return LootDroppedPayload;
    return undefined;
  },
});

@ObjectType()
export class DungeonEventModel {
  @Field(() => EventTopic)
  topic!: EventTopic;

  @Field(() => DungeonEventUnion)
  data!: typeof DungeonEventUnion;
}

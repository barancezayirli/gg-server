import { ObjectType, Field, Int, registerEnumType } from '@nestjs/graphql';
import { PlayerClass } from '@gg-server/types';

registerEnumType(PlayerClass, { name: 'PlayerClass' });

@ObjectType()
export class PositionModel {
  @Field(() => Int)
  x!: number;

  @Field(() => Int)
  y!: number;
}

@ObjectType()
export class PlayerModel {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field(() => PositionModel)
  position!: PositionModel;

  @Field(() => Int)
  hp!: number;

  @Field(() => Int)
  xp!: number;

  @Field(() => PlayerClass)
  playerClass!: PlayerClass;
}

@ObjectType()
export class PlayerProfileModel {
  @Field(() => PlayerModel)
  player!: PlayerModel;

  @Field(() => Int)
  totalDamageReceived!: number;

  @Field(() => Int)
  monstersEncountered!: number;

  @Field(() => Int)
  lootCollected!: number;
}

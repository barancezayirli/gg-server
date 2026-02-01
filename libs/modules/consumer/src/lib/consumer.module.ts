import { Module } from '@nestjs/common';
import { DungeonEngineModule } from '@gg-server/dungeon-engine';
import { RepositoryModule } from '@gg-server/repository';
import { ConsumerResolver } from './consumer.resolver.js';

@Module({
  imports: [DungeonEngineModule, RepositoryModule],
  providers: [ConsumerResolver],
})
export class ConsumerModule {}

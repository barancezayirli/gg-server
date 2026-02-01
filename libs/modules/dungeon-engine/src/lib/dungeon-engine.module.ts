import { Module } from '@nestjs/common';
import { DungeonEngineService } from './dungeon-engine.service.js';

@Module({
  providers: [DungeonEngineService],
  exports: [DungeonEngineService],
})
export class DungeonEngineModule {}

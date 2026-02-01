import { Module } from '@nestjs/common';
import { RepositoryService } from './repository.service.js';
import { RepositoryController } from './repository.controller.js';

@Module({
  controllers: [RepositoryController],
  providers: [RepositoryService],
  exports: [RepositoryService],
})
export class RepositoryModule {}

import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { RepositoryService } from './repository.service.js';

@Controller('repository')
export class RepositoryController {
  constructor(private readonly repositoryService: RepositoryService) {}

  @Get('players')
  getAllPlayers() {
    return this.repositoryService.getAllPlayers();
  }

  @Get('players/:id/profile')
  getPlayerProfile(@Param('id') id: string) {
    const profile = this.repositoryService.getPlayerProfile(id);
    if (!profile) throw new NotFoundException(`Player ${id} not found`);
    return profile;
  }

  @Get('leaderboard')
  getLeaderboard() {
    return this.repositoryService.getLeaderboard();
  }
}

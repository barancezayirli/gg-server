import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { EventBusModule } from '@gg-server/event-bus';
import { DungeonEngineModule } from '@gg-server/dungeon-engine';
import { RepositoryModule } from '@gg-server/repository';
import { ConsumerModule } from '@gg-server/consumer';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      subscriptions: {
        'graphql-ws': true,
      },
    }),
    EventBusModule,
    DungeonEngineModule,
    RepositoryModule,
    ConsumerModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

import { Injectable } from '@nestjs/common';
import { Subject, Observable, filter, map } from 'rxjs';
import type { DungeonEvent } from '@gg-server/types';

@Injectable()
export class EventBusService {
  private readonly bus$ = new Subject<DungeonEvent>();

  publish(event: DungeonEvent): void {
    this.bus$.next(event);
  }

  subscribe(topic: DungeonEvent['topic']): Observable<DungeonEvent['data']> {
    return this.bus$.pipe(
      filter((event) => event.topic === topic),
      map((event) => event.data),
    );
  }

  subscribeAll(): Observable<DungeonEvent> {
    return this.bus$.asObservable();
  }
}

import { Injectable } from '@angular/core';
import { DataComponentStore, DataState, getInitialDataState } from '@rx-mind/data-component-store';
import { Musician } from './musician.model';

interface MusiciansState extends DataState<Musician, number> {
  query: string;
}

const baseUrl = 'http://localhost:3000/musicians';
const initialState = getInitialDataState<MusiciansState>({ query: '' });

@Injectable()
export class MusiciansStore extends DataComponentStore<MusiciansState> {
  private readonly query$ = this.select((s) => s.query);
  private readonly loadParams$ = this.select(this.query$, (query) => ({ name_like: query }));

  readonly vm$ = this.select(
    this.all$,
    this.isLoadPending$,
    this.query$,
    (musicians, isLoading, query) => ({ musicians, isLoading, query })
  );

  constructor() {
    super({ baseUrl, initialState });
    this.load(this.loadParams$);
  }
}

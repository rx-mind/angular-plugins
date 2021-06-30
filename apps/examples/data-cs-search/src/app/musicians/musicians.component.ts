import { Component } from '@angular/core';
import { MusiciansStore } from './musicians.store';

@Component({
  selector: 'rx-mind-musicians',
  templateUrl: './musicians.component.html',
  styleUrls: ['./musicians.component.scss'],
  viewProviders: [MusiciansStore],
})
export class MusiciansComponent {
  readonly vm$ = this.musiciansStore.vm$;

  constructor(private readonly musiciansStore: MusiciansStore) {}

  onSearch(query: string) {
    this.musiciansStore.patchState({ query });
  }
}

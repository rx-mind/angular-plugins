import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BooksStore } from './books.store';

@Component({
  selector: 'rx-mind-books',
  templateUrl: './books.component.html',
  styleUrls: ['./books.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  viewProviders: [BooksStore],
})
export class BooksComponent {
  readonly vm$ = this.booksStore.vm$;

  constructor(private readonly booksStore: BooksStore) {}

  onCurrentPageChange(currentPage: number) {
    this.booksStore.patchState({ currentPage });
  }

  onPageSizeChange(pageSize: number) {
    this.booksStore.patchState({ currentPage: 1, pageSize });
  }
}

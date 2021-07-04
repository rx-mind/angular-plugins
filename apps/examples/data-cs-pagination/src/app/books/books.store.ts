import { Injectable } from '@angular/core';
import {
  DataComponentStore,
  DataEffectsBuilder,
  DataState,
  getInitialDataState,
} from '@rx-mind/data-component-store';
import { Book } from './book.model';
import { BooksService } from './books.service';

interface BooksState extends DataState<Book, number> {
  currentPage: number;
  pageSize: number;
  totalCount: number;
}

const initialState = getInitialDataState<BooksState>({
  currentPage: 1,
  pageSize: 10,
  totalCount: 0,
});

@Injectable()
export class BooksStore extends DataComponentStore<BooksState> {
  private readonly currentPage$ = this.select((s) => s.currentPage);
  private readonly pageSize$ = this.select((s) => s.pageSize);
  private readonly totalCount$ = this.select((s) => s.totalCount);

  private readonly loadParams$ = this.select(
    this.currentPage$,
    this.pageSize$,
    (currentPage, pageSize) => ({
      _page: currentPage,
      _limit: pageSize,
    })
  );

  readonly vm$ = this.select(
    this.all$,
    this.isLoadPending$,
    this.currentPage$,
    this.pageSize$,
    this.totalCount$,
    (books, isLoading, currentPage, pageSize, totalCount) => ({
      books,
      isLoading,
      currentPage,
      pageSize,
      totalCount,
    })
  );

  constructor(private readonly booksService: BooksService) {
    super({ initialState, dataService: booksService });
    this.load(this.loadParams$);
  }

  protected overrideDataEffects(builder: DataEffectsBuilder<Book, number>): void {
    builder.loadSuccess<{ books: Book[]; totalCount: number }>(({ books, totalCount }) => {
      this.setAll(books, { totalCount });
    });
  }
}

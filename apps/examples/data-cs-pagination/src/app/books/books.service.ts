import { Injectable } from '@angular/core';
import { DefaultDataService, QueryParams } from '@rx-mind/data-component-store';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Book } from './book.model';

const baseUrl = 'http://localhost:3000/books';

@Injectable({
  providedIn: 'root',
})
export class BooksService extends DefaultDataService<Book, number> {
  constructor() {
    super(baseUrl);
  }

  get(params?: QueryParams): Observable<{ books: Book[]; totalCount: number }> {
    return this.http
      .get<Book[]>(baseUrl, { params, observe: 'response' })
      .pipe(
        map(({ body, headers }) => ({
          books: body as Book[],
          totalCount: Number(headers.get('x-total-count')),
        }))
      );
  }
}

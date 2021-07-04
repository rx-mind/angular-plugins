import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Book } from '../book.model';

@Component({
  selector: 'rx-mind-books-table',
  templateUrl: './books-table.component.html',
  styleUrls: ['./books-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BooksTableComponent {
  readonly displayedColumns = ['title', 'author', 'year', 'language', 'pages', 'country'];

  @Input() books: Book[] = [];
  @Input() isLoading = false;
}

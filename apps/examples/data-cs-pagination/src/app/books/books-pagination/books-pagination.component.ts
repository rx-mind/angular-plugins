import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';

@Component({
  selector: 'rx-mind-books-pagination',
  templateUrl: './books-pagination.component.html',
  styleUrls: ['./books-pagination.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BooksPaginationComponent {
  @Input() currentPage = 1;
  @Input() pageSize = 10;
  @Input() totalCount = 0;

  @Output() currentPageChange = new EventEmitter<number>();
  @Output() pageSizeChange = new EventEmitter<number>();

  onPaginationChange({ pageIndex, pageSize }: PageEvent) {
    if (pageSize !== this.pageSize) {
      this.pageSizeChange.emit(pageSize);
    } else {
      this.currentPageChange.emit(pageIndex + 1);
    }
  }
}

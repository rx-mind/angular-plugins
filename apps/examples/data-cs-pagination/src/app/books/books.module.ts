import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { BooksComponent } from './books.component';
import { BooksPaginationComponent } from './books-pagination/books-pagination.component';
import { BooksTableComponent } from './books-table/books-table.component';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSelectModule } from '@angular/material/select';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@NgModule({
  declarations: [BooksComponent, BooksPaginationComponent, BooksTableComponent],
  imports: [
    CommonModule,
    HttpClientModule,
    MatToolbarModule,
    MatSelectModule,
    MatPaginatorModule,
    MatTableModule,
    MatProgressSpinnerModule,
  ],
  exports: [BooksComponent],
})
export class BooksModule {}

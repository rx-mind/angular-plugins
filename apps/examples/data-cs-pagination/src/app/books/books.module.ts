import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { BooksMaterialModule } from './books-material.module';
import { BooksComponent } from './books.component';
import { BooksPaginationComponent } from './books-pagination/books-pagination.component';
import { BooksTableComponent } from './books-table/books-table.component';

@NgModule({
  declarations: [BooksComponent, BooksPaginationComponent, BooksTableComponent],
  imports: [CommonModule, HttpClientModule, BooksMaterialModule],
  exports: [BooksComponent],
})
export class BooksModule {}

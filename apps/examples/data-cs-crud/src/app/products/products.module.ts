import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';
import { ProductsComponent } from './products.component';
import { ProductListComponent } from './product-list/product-list.component';
import { ProductCreateComponent } from './product-create/product-create.component';
import { ProductUpdateComponent } from './product-update/product-update.component';
import { ProductsMaterialModule } from './products-material.module';

@NgModule({
  declarations: [
    ProductsComponent,
    ProductListComponent,
    ProductCreateComponent,
    ProductUpdateComponent,
  ],
  imports: [CommonModule, HttpClientModule, ReactiveFormsModule, ProductsMaterialModule],
  exports: [ProductsComponent],
})
export class ProductsModule {}

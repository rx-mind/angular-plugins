import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { Update } from '@rx-mind/entity-component-store';
import { ProductsStore } from './products.store';
import { Product } from './product.model';

@Component({
  selector: 'rx-mind-products',
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  viewProviders: [ProductsStore],
})
export class ProductsComponent implements OnInit {
  readonly vm$ = this.productsStore.vm$;

  constructor(private readonly productsStore: ProductsStore) {}

  ngOnInit(): void {
    this.productsStore.load();
  }

  onReload(): void {
    this.productsStore.load();
  }

  onSelect(product: Product): void {
    this.productsStore.patchState({ selectedId: product.id });
  }

  onCreate(product: Omit<Product, 'id'>): void {
    this.productsStore.create(product);
  }

  onUpdate(productUpdate: Update<Product, number>): void {
    this.productsStore.update(productUpdate);
  }

  onDelete(product: Product): void {
    this.productsStore.delete(product.id);
  }
}

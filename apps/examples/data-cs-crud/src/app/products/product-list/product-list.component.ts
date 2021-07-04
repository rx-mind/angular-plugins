import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { Product } from '../product.model';

@Component({
  selector: 'rx-mind-product-list',
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductListComponent {
  @Input() products: Product[] = [];
  @Input() isLoading = false;
  @Input() selectedProduct: Product | null = null;

  @Output() reloadProducts = new EventEmitter<void>();
  @Output() selectProduct = new EventEmitter<Product>();
  @Output() deleteProduct = new EventEmitter<Product>();
}

import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { Product } from '../product.model';
import { ProductForm } from '../product.form';
import { Update } from '@rx-mind/entity-component-store';

@Component({
  selector: 'rx-mind-product-update',
  templateUrl: './product-update.component.html',
  styleUrls: ['./product-update.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductUpdateComponent {
  readonly productForm = new ProductForm();

  @Input() isUpdating = false;
  @Input() set selectedProduct(product: Product | null) {
    if (product) {
      this.productForm.setValue(product);
    } else {
      this.productForm.reset();
    }
  }

  @Output() update = new EventEmitter<Update<Product, number>>();

  onUpdate(): void {
    const { id, ...changes } = this.productForm.getRawValue();
    this.update.emit({ id, changes });
  }
}

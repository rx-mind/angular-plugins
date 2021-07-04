import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { ProductForm } from '../product-form.model';
import { Product } from '../product.model';

@Component({
  selector: 'rx-mind-product-create',
  templateUrl: './product-create.component.html',
  styleUrls: ['./product-create.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductCreateComponent {
  readonly productForm = new ProductForm();

  @Input() isCreating = false;
  @Output() create = new EventEmitter<Omit<Product, 'id'>>();

  onCreate(): void {
    this.create.emit(this.productForm.value);
  }
}

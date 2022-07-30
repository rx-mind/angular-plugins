import { FormControl, FormGroup, Validators } from '@angular/forms';

export class ProductForm extends FormGroup<ProductFormModel> {
  constructor() {
    super({
      id: new FormControl({ value: 0, disabled: true }, { nonNullable: true }),
      name: new FormControl('', { validators: [Validators.required], nonNullable: true }),
      price: new FormControl(0, {
        validators: [Validators.required, Validators.min(0)],
        nonNullable: true,
      }),
    });
  }
}

type ProductFormModel = {
  id: FormControl<number>;
  name: FormControl<string>;
  price: FormControl<number>;
};

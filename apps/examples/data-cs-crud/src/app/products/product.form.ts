import { FormControl, FormGroup, Validators } from '@angular/forms';

export class ProductForm extends FormGroup {
  readonly id = this.controls.id as FormControl;
  readonly name = this.controls.name as FormControl;
  readonly price = this.controls.price as FormControl;

  constructor() {
    super({
      id: new FormControl({ value: null, disabled: true }),
      name: new FormControl(null, Validators.required),
      price: new FormControl(null, [Validators.required, Validators.min(0)]),
    });
  }
}

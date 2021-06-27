import { Injectable } from '@angular/core';
import {
  DataComponentStore,
  DataEffectsBuilder,
  DataState,
  getInitialDataState,
} from '@rx-mind/data-component-store';
import { Product } from './product.model';
import { HttpErrorResponse } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';

interface ProductsState extends DataState<Product, number> {
  selectedId: number | null;
}

const baseUrl = 'http://localhost:3000/products';
const initialState = getInitialDataState<ProductsState>({ selectedId: null });

@Injectable()
export class ProductsStore extends DataComponentStore<ProductsState> {
  private readonly selectedId$ = this.select((s) => s.selectedId);

  readonly vm$ = this.select(
    this.all$,
    this.entities$,
    this.selectedId$,
    this.isPending$,
    this.isLoadPending$,
    this.isCreatePending$,
    this.isUpdatePending$,
    (products, productDictionary, selectedId, isPending, isLoading, isCreating, isUpdating) => ({
      products,
      selectedProduct: selectedId !== null ? productDictionary[selectedId] : null,
      isPending,
      isLoading,
      isCreating,
      isUpdating,
    })
  );

  constructor(private readonly snackbar: MatSnackBar) {
    super({ baseUrl, initialState });
  }

  protected overrideDataEffects(builder: DataEffectsBuilder<Product, number>): void {
    builder.error<HttpErrorResponse>(({ message }) => {
      this.snackbar.open(message, undefined, { panelClass: 'error-snackbar', duration: 3000 });
    });
  }
}

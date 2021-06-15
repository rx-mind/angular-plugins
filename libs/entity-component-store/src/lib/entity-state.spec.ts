import { getInitialEntityState } from './entity-state';
import { EntityState } from './models';

describe('getInitialEntityState', () => {
  interface Product {
    id: number;
    name: string;
  }

  interface ProductsState extends EntityState<Product, number> {
    selectedId: number | null;
  }

  it('should return initial entity state', () => {
    const initialState = getInitialEntityState<EntityState<Product, number>>();
    expect(initialState).toEqual({ entities: {}, ids: [] });
  });

  it('should return initial entity state with passed additional state', () => {
    const initialState = getInitialEntityState<ProductsState>({ selectedId: 1 });
    expect(initialState).toEqual({ entities: {}, ids: [], selectedId: 1 });
  });
});

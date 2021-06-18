import { EntityState, ExtractEntity, ExtractId } from './models';

/**
 * Returns initial entity state.
 *
 * @param additionalState An object that contains initial values for additional
 * state properties. If the state does not contain additional properties,
 * this argument should not passed.
 *
 * @example
 *
 * **With additional state properties**
 *
 * interface ProductsState extends EntityState<Product, number> {
 *   selectedId: number | null;
 * }
 * const initialState = getInitialEntityState<ProductsState>({ selectedId: null });
 *
 * **Without additional state properties**
 *
 * type ProductsState = EntityState<Product, number>;
 * const initialState = getInitialEntityState<ProductsState>();
 */
export function getInitialEntityState<
  State extends EntityState<Entity, Id>,
  Entity extends Record<string, any> = ExtractEntity<State>,
  Id extends string | number = ExtractId<State>,
  AdditionalState = Omit<State, keyof EntityState<Entity, Id>>,
  Args extends [Record<string, any>?] = keyof AdditionalState extends never
    ? []
    : [additionalState: AdditionalState]
>(...additionalState: Args): State;
export function getInitialEntityState<
  State extends EntityState<Entity, Id>,
  Entity extends Record<string, any>,
  Id extends string | number
>(additionalState = {}): State {
  const initialEntityState: EntityState<Entity, Id> = {
    ids: [],
    entities: {} as Record<Id, Entity>,
  };

  return {
    ...initialEntityState,
    ...additionalState,
  } as State;
}

import { EntityState, ExtractEntity, ExtractId } from './models';

export function getInitialEntityState<
  Entity extends Record<string, any>,
  Id extends string | number
>(): EntityState<Entity, Id>;
export function getInitialEntityState<
  State extends EntityState<Entity, Id>,
  Entity extends Record<string, any> = ExtractEntity<State>,
  Id extends string | number = ExtractId<State>,
  AdditionalState = Omit<State, keyof EntityState<Entity, Id>>,
  Args extends [unknown?] = keyof AdditionalState extends never
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

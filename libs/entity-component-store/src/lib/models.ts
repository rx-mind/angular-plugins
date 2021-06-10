export interface EntityState<Entity extends Record<string, any>, Id extends string | number> {
  ids: Id[];
  entities: Record<Id, Entity>;
}

export interface EntityStateAdapter<
  Entity extends Record<string, any>,
  Id extends string | number
> {
  addOne<State extends EntityState<Entity, Id>>(entity: Entity, state: State): State;
  addMany<State extends EntityState<Entity, Id>>(entities: Entity[], state: State): State;

  setOne<State extends EntityState<Entity, Id>>(entity: Entity, state: State): State;
  setMany<State extends EntityState<Entity, Id>>(entities: Entity[], state: State): State;
  setAll<State extends EntityState<Entity, Id>>(entities: Entity[], state: State): State;

  removeOne<State extends EntityState<Entity, Id>>(id: Id, state: State): State;
  removeMany<State extends EntityState<Entity, Id>>(ids: Id[], state: State): State;
  removeMany<State extends EntityState<Entity, Id>>(
    predicate: Predicate<Entity>,
    state: State
  ): State;
  removeAll<State extends EntityState<Entity, Id>>(state: State): State;

  updateOne<State extends EntityState<Entity, Id>>(update: Update<Entity, Id>, state: State): State;
  updateMany<State extends EntityState<Entity, Id>>(
    updates: Update<Entity, Id>[],
    state: State
  ): State;

  upsertOne<State extends EntityState<Entity, Id>>(entity: Entity, state: State): State;
  upsertMany<State extends EntityState<Entity, Id>>(entities: Entity[], state: State): State;

  mapOne<State extends EntityState<Entity, Id>>(map: EntityMapOne<Entity, Id>, state: State): State;
  map<State extends EntityState<Entity, Id>>(map: EntityMap<Entity>, state: State): State;
}

export interface EntityStateAdapterConfig<
  Entity extends Record<string, any>,
  Id extends string | number
> {
  selectId?: SelectId<Entity, Id>;
  sortComparer?: SortComparer<Entity>;
}

export interface EntityComponentStoreConfig<
  State extends EntityState<Entity, Id>,
  Entity,
  Id extends string | number
> extends EntityStateAdapterConfig<Entity, Id> {
  initialState?: State;
}

export type EntityStateOperator<
  Arg,
  Entity extends Record<string, any>,
  Id extends string | number
> = <State extends EntityState<Entity, Id>>(arg: Arg, state: State) => State;

export interface EntityMapOne<Entity extends Record<string, any>, Id extends string | number> {
  id: Id;
  map: EntityMap<Entity>;
}

export type EntityMap<Entity extends Record<string, any>> = (entity: Entity) => Entity;

export type Predicate<Entity extends Record<string, any>> = (entity: Entity) => boolean;

export type SelectId<Entity extends Record<string, any>, Id extends string | number> = (
  entity: Entity
) => Id;

export type SortComparer<Entity extends Record<string, any>> = (e1: Entity, e2: Entity) => number;

export interface Update<Entity extends Record<string, any>, Id extends string | number> {
  id: Id;
  changes: Partial<Entity>;
}

export type PartialUpdater<State> = (state: State) => Partial<State>;

export type ExtractEntity<State> = State extends EntityState<infer Entity, string | number>
  ? Entity
  : never;

export type ExtractId<State> = State extends EntityState<Record<string, any>, infer Id>
  ? Id
  : never;

export enum DidMutate {
  EntitiesOnly,
  Both,
  None,
}

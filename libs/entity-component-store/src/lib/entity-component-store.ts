import { ComponentStore } from '@ngrx/component-store';
import { Inject, Injectable, InjectionToken, Optional } from '@angular/core';
import {
  EntityComponentStoreConfig,
  EntityMap,
  EntityMapOne,
  EntityState,
  EntityStateAdapter,
  ExtractEntity,
  ExtractId,
  PartialUpdater,
  Predicate,
  Update,
} from './models';
import { createEntityStateAdapter } from './entity-state-adapter';

export const ENTITY_COMPONENT_STORE_CONFIG = new InjectionToken(
  '@rx-mind/entity-component-store: Entity Component Store Config'
);

@Injectable()
export class EntityComponentStore<
  State extends EntityState<Entity, Id>,
  Entity extends Record<string, any> = ExtractEntity<State>,
  Id extends string | number = ExtractId<State>
> extends ComponentStore<State> {
  private readonly stateAdapter: EntityStateAdapter<Entity, Id>;

  constructor(
    @Optional()
    @Inject(ENTITY_COMPONENT_STORE_CONFIG)
    config: EntityComponentStoreConfig<State, Entity, Id> = {}
  ) {
    super(config.initialState);
    this.stateAdapter = createEntityStateAdapter(config);
  }

  /**
   * Selectors
   */
  readonly ids$ = this.select((state) => state.ids);
  readonly entities$ = this.select((state) => state.entities);
  readonly all$ = this.select(this.ids$, this.entities$, (ids, entities) =>
    ids.map((id) => entities[id])
  );
  readonly total$ = this.select(this.ids$, (ids) => ids.length);

  /**
   * Updaters
   */
  addOne(entity: Entity, partialState?: Partial<State>): void;
  addOne(entity: Entity, partialUpdater?: PartialUpdater<State>): void;
  addOne(entity: Entity, partialStateOrUpdater?: Partial<State> | PartialUpdater<State>): void {
    this.setState((state) => ({
      ...this.stateAdapter.addOne(entity, state),
      ...getPartialState(partialStateOrUpdater, state),
    }));
  }

  addMany(entities: Entity[], partialState?: Partial<State>): void;
  addMany(entities: Entity[], partialUpdater?: PartialUpdater<State>): void;
  addMany(
    entities: Entity[],
    partialStateOrUpdater?: Partial<State> | PartialUpdater<State>
  ): void {
    this.setState((state) => ({
      ...this.stateAdapter.addMany(entities, state),
      ...getPartialState(partialStateOrUpdater, state),
    }));
  }

  setOne(entity: Entity, partialState?: Partial<State>): void;
  setOne(entity: Entity, partialUpdater?: PartialUpdater<State>): void;
  setOne(entity: Entity, partialStateOrUpdater?: Partial<State> | PartialUpdater<State>): void {
    this.setState((state) => ({
      ...this.stateAdapter.setOne(entity, state),
      ...getPartialState(partialStateOrUpdater, state),
    }));
  }

  setMany(entities: Entity[], partialState?: Partial<State>): void;
  setMany(entities: Entity[], partialUpdater?: PartialUpdater<State>): void;
  setMany(
    entities: Entity[],
    partialStateOrUpdater?: Partial<State> | PartialUpdater<State>
  ): void {
    this.setState((state) => ({
      ...this.stateAdapter.setMany(entities, state),
      ...getPartialState(partialStateOrUpdater, state),
    }));
  }

  setAll(entities: Entity[], partialState?: Partial<State>): void;
  setAll(entities: Entity[], partialUpdater?: PartialUpdater<State>): void;
  setAll(entities: Entity[], partialStateOrUpdater?: Partial<State> | PartialUpdater<State>): void {
    this.setState((state) => ({
      ...this.stateAdapter.setAll(entities, state),
      ...getPartialState(partialStateOrUpdater, state),
    }));
  }

  removeOne(id: Id, partialState?: Partial<State>): void;
  removeOne(id: Id, partialUpdater?: PartialUpdater<State>): void;
  removeOne(id: Id, partialStateOrUpdater?: Partial<State> | PartialUpdater<State>): void {
    this.setState((state) => ({
      ...this.stateAdapter.removeOne(id, state),
      ...getPartialState(partialStateOrUpdater, state),
    }));
  }

  removeMany(ids: Id[], partialState?: Partial<State>): void;
  removeMany(ids: Id[], partialUpdater?: PartialUpdater<State>): void;
  removeMany(predicate: Predicate<Entity>, partialState?: Partial<State>): void;
  removeMany(predicate: Predicate<Entity>, partialUpdater?: PartialUpdater<State>): void;
  removeMany(
    idsOrPredicate: Id[] | Predicate<Entity>,
    partialStateOrUpdater?: Partial<State> | PartialUpdater<State>
  ): void {
    this.setState((state) => ({
      ...this.stateAdapter.removeMany(idsOrPredicate as Id[], state),
      ...getPartialState(partialStateOrUpdater, state),
    }));
  }

  removeAll(partialState?: Partial<State>): void;
  removeAll(partialUpdater?: PartialUpdater<State>): void;
  removeAll(partialStateOrUpdater?: Partial<State> | PartialUpdater<State>): void {
    this.setState((state) => ({
      ...this.stateAdapter.removeAll(state),
      ...getPartialState(partialStateOrUpdater, state),
    }));
  }

  updateOne(update: Update<Entity, Id>, partialState?: Partial<State>): void;
  updateOne(update: Update<Entity, Id>, partialUpdater?: PartialUpdater<State>): void;
  updateOne(
    update: Update<Entity, Id>,
    partialStateOrUpdater?: Partial<State> | PartialUpdater<State>
  ): void {
    this.setState((state) => ({
      ...this.stateAdapter.updateOne(update, state),
      ...getPartialState(partialStateOrUpdater, state),
    }));
  }

  updateMany(updates: Update<Entity, Id>[], partialState?: Partial<State>): void;
  updateMany(updates: Update<Entity, Id>[], partialUpdater?: PartialUpdater<State>): void;
  updateMany(
    updates: Update<Entity, Id>[],
    partialStateOrUpdater?: Partial<State> | PartialUpdater<State>
  ): void {
    this.setState((state) => ({
      ...this.stateAdapter.updateMany(updates, state),
      ...getPartialState(partialStateOrUpdater, state),
    }));
  }

  upsertOne(entity: Entity, partialState?: Partial<State>): void;
  upsertOne(entity: Entity, partialUpdater?: PartialUpdater<State>): void;
  upsertOne(entity: Entity, partialStateOrUpdater?: Partial<State> | PartialUpdater<State>): void {
    this.setState((state) => ({
      ...this.stateAdapter.upsertOne(entity, state),
      ...getPartialState(partialStateOrUpdater, state),
    }));
  }

  upsertMany(entities: Entity[], partialState?: Partial<State>): void;
  upsertMany(entities: Entity[], partialUpdater?: PartialUpdater<State>): void;
  upsertMany(
    entities: Entity[],
    partialStateOrUpdater?: Partial<State> | PartialUpdater<State>
  ): void {
    this.setState((state) => ({
      ...this.stateAdapter.upsertMany(entities, state),
      ...getPartialState(partialStateOrUpdater, state),
    }));
  }

  mapOne(map: EntityMapOne<Entity, Id>, partialState?: Partial<State>): void;
  mapOne(map: EntityMapOne<Entity, Id>, partialUpdater?: PartialUpdater<State>): void;
  mapOne(
    map: EntityMapOne<Entity, Id>,
    partialStateOrUpdater?: Partial<State> | PartialUpdater<State>
  ): void {
    this.setState((state) => ({
      ...this.stateAdapter.mapOne(map, state),
      ...getPartialState(partialStateOrUpdater, state),
    }));
  }

  map(map: EntityMap<Entity>, partialState?: Partial<State>): void;
  map(map: EntityMap<Entity>, partialUpdater?: PartialUpdater<State>): void;
  map(
    map: EntityMap<Entity>,
    partialStateOrUpdater?: Partial<State> | PartialUpdater<State>
  ): void {
    this.setState((state) => ({
      ...this.stateAdapter.map(map, state),
      ...getPartialState(partialStateOrUpdater, state),
    }));
  }
}

function getPartialState<State>(
  partialStateOrUpdater: Partial<State> | PartialUpdater<State> | undefined,
  state: State
): Partial<State> | undefined {
  return typeof partialStateOrUpdater === 'function'
    ? partialStateOrUpdater(state)
    : partialStateOrUpdater;
}

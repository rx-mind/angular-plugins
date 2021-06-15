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

  // selectors
  readonly ids$ = this.select((state) => state.ids);
  readonly entities$ = this.select((state) => state.entities);
  readonly all$ = this.select(this.ids$, this.entities$, (ids, entities) =>
    ids.map((id) => entities[id])
  );
  readonly total$ = this.select(this.ids$, (ids) => ids.length);

  // updaters
  addOne(entity: Entity, partialStateOrUpdater?: Partial<State> | PartialUpdater<State>): void {
    this.setState((state) => {
      const patchedState = getPatchedState(state, partialStateOrUpdater);
      return this.stateAdapter.addOne(entity, patchedState);
    });
  }

  addMany(
    entities: Entity[],
    partialStateOrUpdater?: Partial<State> | PartialUpdater<State>
  ): void {
    this.setState((state) => {
      const patchedState = getPatchedState(state, partialStateOrUpdater);
      return this.stateAdapter.addMany(entities, patchedState);
    });
  }

  setOne(entity: Entity, partialStateOrUpdater?: Partial<State> | PartialUpdater<State>): void {
    this.setState((state) => {
      const patchedState = getPatchedState(state, partialStateOrUpdater);
      return this.stateAdapter.setOne(entity, patchedState);
    });
  }

  setMany(
    entities: Entity[],
    partialStateOrUpdater?: Partial<State> | PartialUpdater<State>
  ): void {
    this.setState((state) => {
      const patchedState = getPatchedState(state, partialStateOrUpdater);
      return this.stateAdapter.setMany(entities, patchedState);
    });
  }

  setAll(entities: Entity[], partialStateOrUpdater?: Partial<State> | PartialUpdater<State>): void {
    this.setState((state) => {
      const patchedState = getPatchedState(state, partialStateOrUpdater);
      return this.stateAdapter.setAll(entities, patchedState);
    });
  }

  removeOne(id: Id, partialStateOrUpdater?: Partial<State> | PartialUpdater<State>): void {
    this.setState((state) => {
      const patchedState = getPatchedState(state, partialStateOrUpdater);
      return this.stateAdapter.removeOne(id, patchedState);
    });
  }

  removeMany(ids: Id[], partialStateOrUpdater?: Partial<State> | PartialUpdater<State>): void;
  removeMany(
    predicate: Predicate<Entity>,
    partialStateOrUpdater?: Partial<State> | PartialUpdater<State>
  ): void;
  removeMany(
    idsOrPredicate: Id[] | Predicate<Entity>,
    partialStateOrUpdater?: Partial<State> | PartialUpdater<State>
  ): void {
    this.setState((state) => {
      const patchedState = getPatchedState(state, partialStateOrUpdater);
      return this.stateAdapter.removeMany(idsOrPredicate as Id[], patchedState);
    });
  }

  removeAll(partialStateOrUpdater?: Partial<State> | PartialUpdater<State>): void {
    this.setState((state) => {
      const patchedState = getPatchedState(state, partialStateOrUpdater);
      return this.stateAdapter.removeAll(patchedState);
    });
  }

  updateOne(
    update: Update<Entity, Id>,
    partialStateOrUpdater?: Partial<State> | PartialUpdater<State>
  ): void {
    this.setState((state) => {
      const patchedState = getPatchedState(state, partialStateOrUpdater);
      return this.stateAdapter.updateOne(update, patchedState);
    });
  }

  updateMany(
    updates: Update<Entity, Id>[],
    partialStateOrUpdater?: Partial<State> | PartialUpdater<State>
  ): void {
    this.setState((state) => {
      const patchedState = getPatchedState(state, partialStateOrUpdater);
      return this.stateAdapter.updateMany(updates, patchedState);
    });
  }

  upsertOne(entity: Entity, partialStateOrUpdater?: Partial<State> | PartialUpdater<State>): void {
    this.setState((state) => {
      const patchedState = getPatchedState(state, partialStateOrUpdater);
      return this.stateAdapter.upsertOne(entity, patchedState);
    });
  }

  upsertMany(
    entities: Entity[],
    partialStateOrUpdater?: Partial<State> | PartialUpdater<State>
  ): void {
    this.setState((state) => {
      const patchedState = getPatchedState(state, partialStateOrUpdater);
      return this.stateAdapter.upsertMany(entities, patchedState);
    });
  }

  mapOne(
    map: EntityMapOne<Entity, Id>,
    partialStateOrUpdater?: Partial<State> | PartialUpdater<State>
  ): void {
    this.setState((state) => {
      const patchedState = getPatchedState(state, partialStateOrUpdater);
      return this.stateAdapter.mapOne(map, patchedState);
    });
  }

  map(
    map: EntityMap<Entity>,
    partialStateOrUpdater?: Partial<State> | PartialUpdater<State>
  ): void {
    this.setState((state) => {
      const patchedState = getPatchedState(state, partialStateOrUpdater);
      return this.stateAdapter.map(map, patchedState);
    });
  }
}

function getPatchedState<State>(
  state: State,
  partialStateOrUpdater?: Partial<State> | PartialUpdater<State>
): State {
  const partialState =
    typeof partialStateOrUpdater === 'function'
      ? partialStateOrUpdater(state)
      : partialStateOrUpdater;

  return {
    ...state,
    ...partialState,
  };
}

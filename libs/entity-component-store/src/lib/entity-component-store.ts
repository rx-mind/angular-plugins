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

/**
 * Used to provide entity component store config.
 *
 * @example
 *
 * const initialState = getInitialEntityState<ProductsState>({ selectedId: null });
 *
 * \@Component({
 *   // ...
 *   viewProviders: [
 *     {
 *       provide: ENTITY_COMPONENT_STORE_CONFIG,
 *       useValue: { initialState }, // additionally, selectId and sortComparer can be provided
 *     },
 *     ProductsStore,
 *   ],
 * })
 * export class ProductsComponent {
 *   constructor(private readonly productsStore: ProductsStore) {}
 * }
 */
export const ENTITY_COMPONENT_STORE_CONFIG = new InjectionToken(
  '@rx-mind/entity-component-store: Entity Component Store Config'
);

/**
 * Component store with entity updaters and selectors.
 *
 * @example
 *
 * interface ProductsState extends EntityState<Product, number> {
 *   query: string;
 * }
 *
 * const initialState = getInitialEntityState<ProductsState>({ query: '' });
 *
 * \@Injectable()
 * export class ProductsStore extends EntityComponentStore<ProductsState> {
 *   private readonly query$ = this.select(s => s.query);
 *
 *   readonly vm$ = this.select(
 *     this.all$,
 *     this.query$,
 *     (allProducts, query) => ({
 *       products: allProducts.filter(p => p.name.includes(query)),
 *       query,
 *     }),
 *   );
 *
 *   constructor(private readonly productsService: ProductsService) {
 *     super({ initialState });
 *   }
 *
 *   readonly loadProducts = this.effect<void>($ => {
 *     return $.pipe(
 *       concatMap(() =>
 *         this.productsService.getAll().pipe(
 *           tapResponse(
 *             products => this.setAll(products);
 *             console.error,
 *           ),
 *         )
 *       ),
 *     );
 *   });
 *
 *   readonly deleteProduct = this.effect<number>(id$ => {
 *     return id$.pipe(
 *       concatMap(id =>
 *         this.productsService.create(id).pipe(
 *           tapResponse(
 *             () => this.removeOne(id),
 *             console.error,
 *           ),
 *         ),
 *       ),
 *     ),
 *   });
 * }
 */
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
   * Selects the array of entity ids.
   */
  readonly ids$ = this.select((state) => state.ids);

  /**
   * Selects the entity dictionary.
   */
  readonly entities$ = this.select((state) => state.entities);

  /**
   * Selects the array of all entities.
   */
  readonly all$ = this.select(this.ids$, this.entities$, (ids, entities) =>
    ids.map((id) => entities[id])
  );

  /**
   * Selects the total number of entities.
   */
  readonly total$ = this.select(this.ids$, (ids) => ids.length);

  /**
   * Adds one entity to the collection.
   *
   * @param entity An entity that will be added to the collection.
   * @param partialStateOrUpdater A partial state or a partial updater
   * function that accepts the state and returns the partial state.
   */
  addOne(entity: Entity, partialStateOrUpdater?: Partial<State> | PartialUpdater<State>): void {
    this.setState((state) => {
      const patchedState = getPatchedState(state, partialStateOrUpdater);
      return this.stateAdapter.addOne(entity, patchedState);
    });
  }

  /**
   * Adds multiple entities to the collection.
   *
   * @param entities An array of entities that will be added to the collection.
   * @param partialStateOrUpdater A partial state or a partial updater
   * function that accepts the state and returns the partial state.
   */
  addMany(
    entities: Entity[],
    partialStateOrUpdater?: Partial<State> | PartialUpdater<State>
  ): void {
    this.setState((state) => {
      const patchedState = getPatchedState(state, partialStateOrUpdater);
      return this.stateAdapter.addMany(entities, patchedState);
    });
  }

  /**
   * Adds or replaces one entity in the collection.
   *
   * @param entity An entity that will be added or replaced in the collection.
   * @param partialStateOrUpdater A partial state or a partial updater
   * function that accepts the state and returns the partial state.
   */
  setOne(entity: Entity, partialStateOrUpdater?: Partial<State> | PartialUpdater<State>): void {
    this.setState((state) => {
      const patchedState = getPatchedState(state, partialStateOrUpdater);
      return this.stateAdapter.setOne(entity, patchedState);
    });
  }

  /**
   * Adds or replaces multiple entities in the collection.
   *
   * @param entities An array of entities that will be added or replaced in the collection.
   * @param partialStateOrUpdater A partial state or a partial updater
   * function that accepts the state and returns the partial state.
   */
  setMany(
    entities: Entity[],
    partialStateOrUpdater?: Partial<State> | PartialUpdater<State>
  ): void {
    this.setState((state) => {
      const patchedState = getPatchedState(state, partialStateOrUpdater);
      return this.stateAdapter.setMany(entities, patchedState);
    });
  }

  /**
   * Replaces current collection with the provided collection.
   *
   * @param entities An array of entities that will replace current collection.
   * @param partialStateOrUpdater A partial state or a partial updater
   * function that accepts the state and returns the partial state.
   */
  setAll(entities: Entity[], partialStateOrUpdater?: Partial<State> | PartialUpdater<State>): void {
    this.setState((state) => {
      const patchedState = getPatchedState(state, partialStateOrUpdater);
      return this.stateAdapter.setAll(entities, patchedState);
    });
  }

  /**
   * Removes one entity from the collection.
   *
   * @param id An entity id that will be removed from the collection.
   * @param partialStateOrUpdater A partial state or a partial updater
   * function that accepts the state and returns the partial state.
   */
  removeOne(id: Id, partialStateOrUpdater?: Partial<State> | PartialUpdater<State>): void {
    this.setState((state) => {
      const patchedState = getPatchedState(state, partialStateOrUpdater);
      return this.stateAdapter.removeOne(id, patchedState);
    });
  }

  /**
   * Removes multiple entities from the collection by ids.
   *
   * @param ids An array of entity ids that will be removed from the collection.
   * @param partialStateOrUpdater A partial state or a partial updater
   * function that accepts the state and returns the partial state.
   */
  removeMany(ids: Id[], partialStateOrUpdater?: Partial<State> | PartialUpdater<State>): void;
  /**
   * Removes multiple entities from the collection by predicate.
   *
   * @param predicate A function that accepts an entity and returns true
   * if the entity should be removed.
   * @param partialStateOrUpdater A partial state or a partial updater
   * function that accepts the state and returns the partial state.
   */
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

  /**
   * Clears entity collection.
   *
   * @param partialStateOrUpdater A partial state or a partial updater
   * function that accepts the state and returns the partial state.
   */
  removeAll(partialStateOrUpdater?: Partial<State> | PartialUpdater<State>): void {
    this.setState((state) => {
      const patchedState = getPatchedState(state, partialStateOrUpdater);
      return this.stateAdapter.removeAll(patchedState);
    });
  }

  /**
   * Updates one entity in the collection. Supports partial updates.
   *
   * @param update An object that contains entity id and entity changes.
   * @param partialStateOrUpdater A partial state or a partial updater
   * function that accepts the state and returns the partial state.
   */
  updateOne(
    update: Update<Entity, Id>,
    partialStateOrUpdater?: Partial<State> | PartialUpdater<State>
  ): void {
    this.setState((state) => {
      const patchedState = getPatchedState(state, partialStateOrUpdater);
      return this.stateAdapter.updateOne(update, patchedState);
    });
  }

  /**
   * Updates multiple entities in the collection. Supports partial updates.
   *
   * @param updates An array of objects that contain entity id and entity changes.
   * @param partialStateOrUpdater A partial state or a partial updater
   * function that accepts the state and returns the partial state.
   */
  updateMany(
    updates: Update<Entity, Id>[],
    partialStateOrUpdater?: Partial<State> | PartialUpdater<State>
  ): void {
    this.setState((state) => {
      const patchedState = getPatchedState(state, partialStateOrUpdater);
      return this.stateAdapter.updateMany(updates, patchedState);
    });
  }

  /**
   * Adds or updates one entity in the collection. Supports partial updates.
   *
   * @param entity An entity that will be added or updated in the collection.
   * @param partialStateOrUpdater A partial state or a partial updater
   * function that accepts the state and returns the partial state.
   */
  upsertOne(entity: Entity, partialStateOrUpdater?: Partial<State> | PartialUpdater<State>): void {
    this.setState((state) => {
      const patchedState = getPatchedState(state, partialStateOrUpdater);
      return this.stateAdapter.upsertOne(entity, patchedState);
    });
  }

  /**
   * Adds or updates multiple entities in the collection. Supports partial updates.
   *
   * @param entities An array of entities that will be added or updated in the collection.
   * @param partialStateOrUpdater A partial state or a partial updater
   * function that accepts the state and returns the partial state.
   */
  upsertMany(
    entities: Entity[],
    partialStateOrUpdater?: Partial<State> | PartialUpdater<State>
  ): void {
    this.setState((state) => {
      const patchedState = getPatchedState(state, partialStateOrUpdater);
      return this.stateAdapter.upsertMany(entities, patchedState);
    });
  }

  /**
   * Updates one entity in the collection by defining a map function.
   *
   * @param map An object that contains entity id and map function.
   * @param partialStateOrUpdater A partial state or a partial updater
   * function that accepts the state and returns the partial state.
   */
  mapOne(
    map: EntityMapOne<Entity, Id>,
    partialStateOrUpdater?: Partial<State> | PartialUpdater<State>
  ): void {
    this.setState((state) => {
      const patchedState = getPatchedState(state, partialStateOrUpdater);
      return this.stateAdapter.mapOne(map, patchedState);
    });
  }

  /**
   * Updates multiple entities in the collection by defining a map function.
   *
   * @param map A function that accepts an entity and returns mapped entity.
   * @param partialStateOrUpdater A partial state or a partial updater
   * function that accepts the state and returns the partial state.
   */
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

/**
 * @license
 * Copyright NgRx Team. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/ngrx/platform
 */

import { createEntityStateOperator } from './entity-state-operator';
import {
  DidMutate,
  EntityMap,
  EntityMapOne,
  EntityState,
  EntityStateAdapter,
  Predicate,
  SelectId,
  Update,
} from './models';
import { selectIdValue } from './select-id';

export function createUnsortedStateAdapter<
  Entity extends Record<string, any>,
  Id extends string | number
>(selectId: SelectId<Entity, Id>): EntityStateAdapter<Entity, Id> {
  type State = EntityState<Entity, Id>;

  function addOneMutably(entity: Entity, state: State): DidMutate {
    const id = selectIdValue(entity, selectId);

    if (id in state.entities) {
      return DidMutate.None;
    }

    state.ids.push(id);
    state.entities[id] = entity;

    return DidMutate.Both;
  }

  function addManyMutably(entities: Entity[], state: State): DidMutate {
    let didMutate = false;

    for (const entity of entities) {
      didMutate = addOneMutably(entity, state) !== DidMutate.None || didMutate;
    }

    return didMutate ? DidMutate.Both : DidMutate.None;
  }

  function setAllMutably(entities: Entity[], state: State): DidMutate {
    state.ids = [];
    state.entities = {} as Record<Id, Entity>;

    addManyMutably(entities, state);

    return DidMutate.Both;
  }

  function setOneMutably(entity: Entity, state: State): DidMutate {
    const id = selectIdValue(entity, selectId);

    if (id in state.entities) {
      state.entities[id] = entity;
      return DidMutate.EntitiesOnly;
    }

    state.ids.push(id);
    state.entities[id] = entity;

    return DidMutate.Both;
  }

  function setManyMutably(entities: Entity[], state: State): DidMutate {
    const didMutateSetOne = entities.map((entity) => setOneMutably(entity, state));

    switch (true) {
      case didMutateSetOne.some((didMutate) => didMutate === DidMutate.Both):
        return DidMutate.Both;
      case didMutateSetOne.some((didMutate) => didMutate === DidMutate.EntitiesOnly):
        return DidMutate.EntitiesOnly;
      default:
        return DidMutate.None;
    }
  }

  function removeOneMutably(id: Id, state: State): DidMutate {
    return removeManyMutably([id], state);
  }

  function removeManyMutably(ids: Id[], state: State): DidMutate;
  function removeManyMutably(predicate: Predicate<Entity>, state: State): DidMutate;
  function removeManyMutably(idsOrPredicate: Id[] | Predicate<Entity>, state: State): DidMutate {
    const ids =
      idsOrPredicate instanceof Array
        ? idsOrPredicate
        : state.ids.filter((id) => idsOrPredicate(state.entities[id]));

    const didMutate =
      ids.filter((id) => id in state.entities).map((id) => delete state.entities[id]).length > 0;

    if (didMutate) {
      state.ids = state.ids.filter((id) => id in state.entities);
    }

    return didMutate ? DidMutate.Both : DidMutate.None;
  }

  function removeAll<S extends State>(state: S): S {
    return Object.assign({}, state, {
      ids: [],
      entities: {},
    });
  }

  function takeNewKey(
    keys: { [id: string]: Id },
    update: Update<Entity, Id>,
    state: State
  ): boolean {
    const original = state.entities[update.id];
    const updated: Entity = Object.assign({}, original, update.changes);
    const newKey = selectIdValue(updated, selectId);
    const hasNewKey = newKey !== update.id;

    if (hasNewKey) {
      keys[update.id] = newKey;
      delete state.entities[update.id];
    }

    state.entities[newKey] = updated;

    return hasNewKey;
  }

  function updateOneMutably(update: Update<Entity, Id>, state: State): DidMutate {
    return updateManyMutably([update], state);
  }

  function updateManyMutably(updates: Update<Entity, Id>[], state: State): DidMutate {
    const newKeys: { [id: string]: Id } = {};

    updates = updates.filter((update) => update.id in state.entities);

    const didMutateEntities = updates.length > 0;

    if (didMutateEntities) {
      const didMutateIds =
        updates.filter((update) => takeNewKey(newKeys, update, state)).length > 0;

      if (didMutateIds) {
        state.ids = state.ids.map((id) => newKeys[id] || id);
        return DidMutate.Both;
      } else {
        return DidMutate.EntitiesOnly;
      }
    }

    return DidMutate.None;
  }

  function mapMutably(map: EntityMap<Entity>, state: State): DidMutate {
    const changes = state.ids.reduce((changes, id) => {
      const change = map(state.entities[id]);
      if (change !== state.entities[id]) {
        changes.push({ id, changes: change });
      }
      return changes;
    }, [] as Update<Entity, Id>[]);
    const updates = changes.filter(({ id }) => id in state.entities);

    return updateManyMutably(updates, state);
  }

  function mapOneMutably({ map, id }: EntityMapOne<Entity, Id>, state: State): DidMutate {
    const entity = state.entities[id];
    if (!entity) {
      return DidMutate.None;
    }

    const updatedEntity = map(entity);
    return updateOneMutably(
      {
        id,
        changes: updatedEntity,
      },
      state
    );
  }

  function upsertOneMutably(entity: Entity, state: State): DidMutate {
    return upsertManyMutably([entity], state);
  }

  function upsertManyMutably(entities: Entity[], state: State): DidMutate {
    const added: any[] = [];
    const updated: any[] = [];

    for (const entity of entities) {
      const id = selectIdValue(entity, selectId);
      if (id in state.entities) {
        updated.push({ id, changes: entity });
      } else {
        added.push(entity);
      }
    }

    const didMutateByUpdated = updateManyMutably(updated, state);
    const didMutateByAdded = addManyMutably(added, state);

    switch (true) {
      case didMutateByAdded === DidMutate.None && didMutateByUpdated === DidMutate.None:
        return DidMutate.None;
      case didMutateByAdded === DidMutate.Both || didMutateByUpdated === DidMutate.Both:
        return DidMutate.Both;
      default:
        return DidMutate.EntitiesOnly;
    }
  }

  return {
    addOne: createEntityStateOperator(addOneMutably),
    addMany: createEntityStateOperator(addManyMutably),
    setOne: createEntityStateOperator(setOneMutably),
    setMany: createEntityStateOperator(setManyMutably),
    setAll: createEntityStateOperator(setAllMutably),
    updateOne: createEntityStateOperator(updateOneMutably),
    updateMany: createEntityStateOperator(updateManyMutably),
    upsertOne: createEntityStateOperator(upsertOneMutably),
    upsertMany: createEntityStateOperator(upsertManyMutably),
    removeOne: createEntityStateOperator(removeOneMutably),
    removeMany: createEntityStateOperator(removeManyMutably),
    removeAll,
    mapOne: createEntityStateOperator(mapOneMutably),
    map: createEntityStateOperator(mapMutably),
  } as EntityStateAdapter<Entity, Id>;
}

/**
 * @license
 * Copyright NgRx Team. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/ngrx/platform
 */

import { createUnsortedStateAdapter } from './unsorted-state-adapter';
import { createEntityStateOperator } from './entity-state-operator';
import {
  DidMutate,
  EntityMap,
  EntityMapOne,
  EntityState,
  EntityStateAdapter,
  SelectId,
  SortComparer,
  Update,
} from './models';
import { selectIdValue } from './select-id';

export function createSortedStateAdapter<
  Entity extends Record<string, any>,
  Id extends string | number
>(
  selectId: SelectId<Entity, Id>,
  sortComparer: SortComparer<Entity>
): EntityStateAdapter<Entity, Id> {
  type State = EntityState<Entity, Id>;

  const { removeOne, removeMany, removeAll } = createUnsortedStateAdapter(selectId);

  function addOneMutably(entity: Entity, state: State): DidMutate {
    return addManyMutably([entity], state);
  }

  function addManyMutably(newModels: Entity[], state: State): DidMutate {
    const models = newModels.filter((model) => !(selectIdValue(model, selectId) in state.entities));

    if (models.length === 0) {
      return DidMutate.None;
    } else {
      merge(models, state);
      return DidMutate.Both;
    }
  }

  function setAllMutably(models: Entity[], state: State): DidMutate {
    state.entities = {} as Record<Id, Entity>;
    state.ids = [];

    addManyMutably(models, state);

    return DidMutate.Both;
  }

  function setOneMutably(entity: Entity, state: State): DidMutate {
    const id = selectIdValue(entity, selectId);
    if (id in state.entities) {
      state.ids = state.ids.filter((val) => val !== id);
      merge([entity], state);
      return DidMutate.Both;
    } else {
      return addOneMutably(entity, state);
    }
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

  function updateOneMutably(update: Update<Entity, Id>, state: State): DidMutate {
    return updateManyMutably([update], state);
  }

  function takeUpdatedModel(models: Entity[], update: Update<Entity, Id>, state: State): boolean {
    if (!(update.id in state.entities)) {
      return false;
    }

    const original = state.entities[update.id];
    const updated = Object.assign({}, original, update.changes);
    const newKey = selectIdValue(updated, selectId);

    delete state.entities[update.id];

    models.push(updated);

    return newKey !== update.id;
  }

  function updateManyMutably(updates: Update<Entity, Id>[], state: State): DidMutate {
    const models: Entity[] = [];

    const didMutateIds =
      updates.filter((update) => takeUpdatedModel(models, update, state)).length > 0;

    if (models.length === 0) {
      return DidMutate.None;
    } else {
      const originalIds = state.ids;
      const updatedIndexes: number[] = [];
      state.ids = state.ids.filter((id, index) => {
        if (id in state.entities) {
          return true;
        } else {
          updatedIndexes.push(index);
          return false;
        }
      });

      merge(models, state);

      if (!didMutateIds && updatedIndexes.every((i) => state.ids[i] === originalIds[i])) {
        return DidMutate.EntitiesOnly;
      } else {
        return DidMutate.Both;
      }
    }
  }

  function mapMutably(updatesOrMap: EntityMap<Entity>, state: State): DidMutate {
    const updates = state.ids.reduce((changes, id) => {
      const change = updatesOrMap(state.entities[id]);
      if (change !== state.entities[id]) {
        changes.push({ id, changes: change });
      }
      return changes;
    }, [] as Update<Entity, Id>[]);

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
        id: id,
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

  function merge(models: Entity[], state: State): void {
    models.sort(sortComparer);

    const ids: any[] = [];

    let i = 0;
    let j = 0;

    while (i < models.length && j < state.ids.length) {
      const model = models[i];
      const modelId = selectIdValue(model, selectId);
      const entityId = state.ids[j];
      const entity = state.entities[entityId];

      if (sortComparer(model, entity) <= 0) {
        ids.push(modelId);
        i++;
      } else {
        ids.push(entityId);
        j++;
      }
    }

    if (i < models.length) {
      state.ids = ids.concat(models.slice(i).map(selectId));
    } else {
      state.ids = ids.concat(state.ids.slice(j));
    }

    models.forEach((model) => {
      state.entities[selectId(model)] = model;
    });
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
    removeOne,
    removeMany,
    removeAll,
    map: createEntityStateOperator(mapMutably),
    mapOne: createEntityStateOperator(mapOneMutably),
  };
}

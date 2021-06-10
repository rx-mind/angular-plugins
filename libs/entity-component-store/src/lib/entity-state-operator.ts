/**
 * @license
 * Copyright NgRx Team. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/ngrx/platform
 */

import { DidMutate, EntityState, EntityStateOperator } from './models';

export function createEntityStateOperator<
  Arg,
  Entity extends Record<string, any>,
  Id extends string | number
>(
  mutator: (arg: Arg, state: EntityState<Entity, Id>) => DidMutate
): EntityStateOperator<Arg, Entity, Id> {
  return function operation<State extends EntityState<Entity, Id>>(arg: Arg, state: State): State {
    const clonedEntityState: EntityState<Entity, Id> = {
      ids: [...state.ids],
      entities: { ...state.entities },
    };

    const didMutate = mutator(arg, clonedEntityState);

    if (didMutate === DidMutate.Both) {
      return Object.assign({}, state, clonedEntityState);
    }

    if (didMutate === DidMutate.EntitiesOnly) {
      return {
        ...state,
        entities: clonedEntityState.entities,
      };
    }

    return state;
  };
}

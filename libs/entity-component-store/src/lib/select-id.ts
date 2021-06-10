/**
 * @license
 * Copyright NgRx Team. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/ngrx/platform
 */

import { SelectId } from './models';
import { isDevMode } from '@angular/core';

export function selectIdValue<Entity extends Record<string, any>, Id extends string | number>(
  entity: Entity,
  selectId: SelectId<Entity, Id>
): Id {
  const id = selectId(entity);

  if (isDevMode() && id === undefined) {
    console.warn(
      '@rx-mind/entity-component-store: The entity passed to the `selectId` implementation returned undefined.',
      'You should probably provide your own `selectId` implementation.',
      'The entity that was passed:',
      entity,
      'The `selectId` implementation:',
      selectId.toString()
    );
  }

  return id;
}

export function getDefaultSelectId<
  Entity extends Record<string, any>,
  Id extends string | number
>(): SelectId<Entity, Id> {
  return (entity) => ((entity as unknown) as { id: Id }).id;
}

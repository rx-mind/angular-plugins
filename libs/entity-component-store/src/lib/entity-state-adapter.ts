import { EntityStateAdapter, EntityStateAdapterConfig } from './models';
import { createSortedStateAdapter } from './sorted-state-adapter';
import { createUnsortedStateAdapter } from './unsorted-state-adapter';
import { getDefaultSelectId } from './select-id';

export function createEntityStateAdapter<
  Entity extends Record<string, any>,
  Id extends string | number
>(config: EntityStateAdapterConfig<Entity, Id> = {}): EntityStateAdapter<Entity, Id> {
  const selectId = config.selectId ?? getDefaultSelectId();

  return config.sortComparer
    ? createSortedStateAdapter(selectId, config.sortComparer)
    : createUnsortedStateAdapter(selectId);
}

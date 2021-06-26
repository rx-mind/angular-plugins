import {
  EntityState,
  ExtractEntity,
  ExtractId,
  getInitialEntityState,
} from '@rx-mind/entity-component-store';
import { DataState, PendingStatuses } from './models';

export function getInitialDataState<
  State extends DataState<Entity, Id>,
  Entity extends Record<string, any> = ExtractEntity<State>,
  Id extends string | number = ExtractId<State>,
  AdditionalState = Omit<State, keyof DataState<Entity, Id>>,
  Args extends [Record<string, any>?] = keyof AdditionalState extends never
    ? []
    : [additionalState: AdditionalState]
>(...additionalState: Args): State;
export function getInitialDataState<
  State extends DataState<Entity, Id>,
  Entity extends Record<string, any>,
  Id extends string | number
>(additionalState = {}): State {
  const initialEntityState = (getInitialEntityState() as unknown) as EntityState<Entity, Id>;
  const initialPendingStatuses = getInitialPendingStatuses();

  return {
    ...initialEntityState,
    ...initialPendingStatuses,
    ...additionalState,
  } as State;
}

function getInitialPendingStatuses(): PendingStatuses {
  return {
    isLoadPending: false,
    isLoadByIdPending: false,
    isCreatePending: false,
    isUpdatePending: false,
    isDeletePending: false,
  };
}

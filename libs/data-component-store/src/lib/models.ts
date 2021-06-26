import {
  EntityComponentStoreConfig,
  EntityState,
  ExtractEntity,
  ExtractId,
} from '@rx-mind/entity-component-store';
import { DataService } from './data-service';

export type DataState<
  Entity extends Record<string, any>,
  Id extends string | number = string | number
> = EntityState<Entity, Id> & PendingStatuses;

export type DataComponentStoreConfig<
  State extends DataState<Entity, Id>,
  Entity extends Record<string, any> = ExtractEntity<State>,
  Id extends string | number = ExtractId<State>
> =
  | ({ baseUrl: string } & EntityComponentStoreConfig<State, Entity, Id>)
  | ({ dataService: DataService<Entity, Id> } & EntityComponentStoreConfig<State, Entity, Id>);

export interface PendingStatuses {
  isLoadPending: boolean;
  isLoadByIdPending: boolean;
  isCreatePending: boolean;
  isUpdatePending: boolean;
  isDeletePending: boolean;
}

export type QueryParams = {
  [param: string]: string | number | boolean | ReadonlyArray<string | number | boolean>;
};

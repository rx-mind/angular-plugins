import { Update } from '@rx-mind/entity-component-store';
import { QueryParams } from './models';

export interface DataEffectsBuilder<
  Entity extends Record<string, any>,
  Id extends string | number = string | number
> {
  loadStart<Params extends QueryParams | undefined>(callback: (params: Params) => void): void;
  loadSuccess<Response extends Entity[] | Record<string, any>>(
    callback: (response: Response) => void
  ): void;
  loadError<Error>(callback: (error: Error) => void): void;

  loadByIdStart(callback: (id: Id) => void): void;
  loadByIdSuccess(callback: (entity: Entity) => void): void;
  loadByIdError<Error>(callback: (error: Error) => void): void;

  createStart(callback: (entity: Partial<Entity>) => void): void;
  createSuccess(callback: (entity: Entity) => void): void;
  createError<Error>(callback: (error: Error) => void): void;

  updateStart(callback: (entityUpdate: Update<Entity, Id>) => void): void;
  updateSuccess(callback: (entity: Entity) => void): void;
  updateError<Error>(callback: (error: Error) => void): void;

  deleteStart(callback: (id: Id) => void): void;
  deleteSuccess<Response extends Entity | Id | void>(callback: (response: Response) => void): void;
  deleteError<Error>(callback: (error: Error) => void): void;

  error<Error>(callback: (error: Error) => void): void;
}

export interface DataEffectCallbacks<
  Entity extends Record<string, any>,
  Id extends string | number = string | number
> {
  loadStart<Params extends QueryParams | undefined>(params: Params): void;
  loadSuccess<Response extends Entity[] | Record<string, any>>(response: Response): void;
  loadError<Error>(error: Error): void;

  loadByIdStart(id: Id): void;
  loadByIdSuccess(entity: Entity): void;
  loadByIdError<Error>(error: Error): void;

  createStart(entity: Partial<Entity>): void;
  createSuccess(entity: Entity): void;
  createError<Error>(error: Error): void;

  updateStart(entityUpdate: Update<Entity, Id>): void;
  updateSuccess(entity: Entity): void;
  updateError<Error>(error: Error): void;

  deleteStart(id: Id): void;
  deleteSuccess<Response extends Entity | Id | void>(response: Response): void;
  deleteError<Error>(error: Error): void;

  error<Error>(error: Error): void;
}

export function createDataEffectsBuilder<
  Entity extends Record<string, any>,
  Id extends string | number = string | number
>(): {
  builder: DataEffectsBuilder<Entity, Id>;
  overriddenEffects: Partial<DataEffectCallbacks<Entity, Id>>;
} {
  const overriddenEffects: Partial<DataEffectCallbacks<Entity, Id>> = {};

  return {
    builder: {
      loadStart(callback) {
        overriddenEffects.loadStart = callback as <Params>(params: Params) => void;
      },
      loadSuccess(callback) {
        overriddenEffects.loadSuccess = callback as <Response>(response: Response) => void;
      },
      loadError(callback) {
        overriddenEffects.loadError = callback as <Error>(error: Error) => void;
      },
      loadByIdStart(callback) {
        overriddenEffects.loadByIdStart = callback;
      },
      loadByIdSuccess(callback) {
        overriddenEffects.loadByIdSuccess = callback;
      },
      loadByIdError(callback) {
        overriddenEffects.loadByIdError = callback as <Error>(error: Error) => void;
      },
      createStart(callback) {
        overriddenEffects.createStart = callback;
      },
      createSuccess(callback) {
        overriddenEffects.createSuccess = callback;
      },
      createError(callback) {
        overriddenEffects.createError = callback as <Error>(error: Error) => void;
      },
      updateStart(callback) {
        overriddenEffects.updateStart = callback;
      },
      updateSuccess(callback) {
        overriddenEffects.updateSuccess = callback;
      },
      updateError(callback) {
        overriddenEffects.updateError = callback as <Error>(error: Error) => void;
      },
      deleteStart(callback) {
        overriddenEffects.deleteStart = callback;
      },
      deleteSuccess(callback) {
        overriddenEffects.deleteSuccess = callback as <Response>(response: Response) => void;
      },
      deleteError(callback) {
        overriddenEffects.deleteError = callback as <Error>(error: Error) => void;
      },
      error(callback) {
        overriddenEffects.error = callback as <Error>(error: Error) => void;
      },
    },
    overriddenEffects,
  };
}

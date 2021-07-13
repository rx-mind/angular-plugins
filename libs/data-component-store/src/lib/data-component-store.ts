import { Inject, Injectable, InjectionToken } from '@angular/core';
import { Subscription } from 'rxjs';
import { mergeMap, scan, startWith, switchMap, tap } from 'rxjs/operators';
import { tapResponse } from '@ngrx/component-store';
import {
  EntityComponentStore,
  ExtractEntity,
  ExtractId,
  Update,
} from '@rx-mind/entity-component-store';
import {
  createDataEffectsBuilder,
  DataEffectCallbacks,
  DataEffectsBuilder,
} from './data-effects-builder';
import { createDefaultDataService, DataService } from './data-service';
import { capitalize } from './helpers';
import { DataComponentStoreConfig, DataState, QueryParams } from './models';

export const DATA_COMPONENT_STORE_CONFIG = new InjectionToken(
  '@rx-mind/data-component-store: Data Component Store Config'
);

@Injectable()
export class DataComponentStore<
  State extends DataState<Entity, Id>,
  Entity extends Record<string, any> = ExtractEntity<State>,
  Id extends string | number = ExtractId<State>
> extends EntityComponentStore<State, Entity, Id> {
  protected readonly dataService: DataService<Entity, Id>;
  private readonly overriddenEffects: Partial<DataEffectCallbacks<Entity, Id>>;

  constructor(
    @Inject(DATA_COMPONENT_STORE_CONFIG) config: DataComponentStoreConfig<State, Entity, Id>
  ) {
    super(config);

    if ('baseUrl' in config) {
      this.dataService = createDefaultDataService<Entity, Id>(config.baseUrl);
    } else {
      this.dataService = config.dataService;
    }

    const { builder, overriddenEffects } = createDataEffectsBuilder<Entity, Id>();
    this.overrideDataEffects(builder);
    this.overriddenEffects = overriddenEffects;
  }

  readonly isLoadPending$ = this.select((s) => s.isLoadPending);
  readonly isLoadByIdPending$ = this.select((s) => s.isLoadByIdPending);
  readonly isCreatePending$ = this.select((s) => s.isCreatePending);
  readonly isUpdatePending$ = this.select((s) => s.isUpdatePending);
  readonly isDeletePending$ = this.select((s) => s.isDeletePending);
  readonly isPending$ = this.select(
    this.isLoadPending$,
    this.isLoadByIdPending$,
    this.isCreatePending$,
    this.isUpdatePending$,
    this.isDeletePending$,
    (...isPending) => isPending.some(Boolean)
  );

  readonly load = this.effect<QueryParams | void>((params$) =>
    params$.pipe(
      tap((params) => {
        this.patchState({ isLoadPending: true } as Partial<State>);

        if (this.overriddenEffects.loadStart) {
          this.overriddenEffects.loadStart(params || undefined);
        }
      }),
      switchMap((params) => {
        return this.dataService.get(params || undefined).pipe(
          tapResponse(
            (response) => {
              this.patchState({ isLoadPending: false } as Partial<State>);

              if (this.overriddenEffects.loadSuccess) {
                this.overriddenEffects.loadSuccess(response);
              } else if (Array.isArray(response)) {
                this.setAll(response);
              } else {
                console.error(
                  '@rx-mind/data-component-store: Load request does not return an array of entities. ' +
                    'Use `overrideDataEffects` method to change the default behavior of `loadSuccess` method.'
                );
              }
            },
            (error) => {
              this.patchState({ isLoadPending: false } as Partial<State>);

              if (this.overriddenEffects.loadError) {
                this.overriddenEffects.loadError(error);
              } else if (this.overriddenEffects.error) {
                this.overriddenEffects.error(error);
              }
            }
          )
        );
      })
    )
  );

  readonly loadById = this.effect<Id>((id$) => {
    return id$.pipe(
      tap((id) => {
        this.addToLoadByIdRequestCount(1);

        if (this.overriddenEffects.loadByIdStart) {
          this.overriddenEffects.loadByIdStart(id);
        }
      }),
      mergeMap((id) => {
        return this.dataService.getById(id).pipe(
          tapResponse(
            (entity) => {
              this.addToLoadByIdRequestCount(-1);

              if (this.overriddenEffects.loadByIdSuccess) {
                this.overriddenEffects.loadByIdSuccess(entity);
              } else {
                this.setOne(entity);
              }
            },
            (error) => {
              this.addToLoadByIdRequestCount(-1);

              if (this.overriddenEffects.loadByIdError) {
                this.overriddenEffects.loadByIdError(error);
              } else if (this.overriddenEffects.error) {
                this.overriddenEffects.error(error);
              }
            }
          )
        );
      })
    );
  });

  readonly create = this.effect<Partial<Entity>>((entity$) => {
    return entity$.pipe(
      tap((entity) => {
        this.addToCreateRequestCount(1);

        if (this.overriddenEffects.createStart) {
          this.overriddenEffects.createStart(entity);
        }
      }),
      mergeMap((entity) => {
        return this.dataService.create(entity).pipe(
          tapResponse(
            (createdEntity) => {
              this.addToCreateRequestCount(-1);

              if (this.overriddenEffects.createSuccess) {
                this.overriddenEffects.createSuccess(createdEntity);
              } else {
                this.addOne(createdEntity);
              }
            },
            (error) => {
              this.addToCreateRequestCount(-1);

              if (this.overriddenEffects.createError) {
                this.overriddenEffects.createError(error);
              } else if (this.overriddenEffects.error) {
                this.overriddenEffects.error(error);
              }
            }
          )
        );
      })
    );
  });

  readonly update = this.effect<Update<Entity, Id>>((entityUpdate$) => {
    return entityUpdate$.pipe(
      tap((entityUpdate) => {
        this.addToUpdateRequestCount(1);

        if (this.overriddenEffects.updateStart) {
          this.overriddenEffects.updateStart(entityUpdate);
        }
      }),
      mergeMap((entityUpdate) => {
        return this.dataService.update(entityUpdate).pipe(
          tapResponse(
            (updatedEntity) => {
              this.addToUpdateRequestCount(-1);

              if (this.overriddenEffects.updateSuccess) {
                this.overriddenEffects.updateSuccess(updatedEntity);
              } else {
                this.updateOne({ id: entityUpdate.id, changes: updatedEntity });
              }
            },
            (error) => {
              this.addToUpdateRequestCount(-1);

              if (this.overriddenEffects.updateError) {
                this.overriddenEffects.updateError(error);
              } else if (this.overriddenEffects.error) {
                this.overriddenEffects.error(error);
              }
            }
          )
        );
      })
    );
  });

  readonly delete = this.effect<Id>((id$) => {
    return id$.pipe(
      tap((id) => {
        this.addToDeleteRequestCount(1);

        if (this.overriddenEffects.deleteStart) {
          this.overriddenEffects.deleteStart(id);
        }
      }),
      mergeMap((id) => {
        return this.dataService.delete(id).pipe(
          tapResponse(
            (response) => {
              this.addToDeleteRequestCount(-1);

              if (this.overriddenEffects.deleteSuccess) {
                this.overriddenEffects.deleteSuccess(response);
              } else {
                this.removeOne(id);
              }
            },
            (error) => {
              this.addToDeleteRequestCount(-1);

              if (this.overriddenEffects.deleteError) {
                this.overriddenEffects.deleteError(error);
              } else if (this.overriddenEffects.error) {
                this.overriddenEffects.error(error);
              }
            }
          )
        );
      })
    );
  });

  private readonly addToLoadByIdRequestCount = this.createAddToRequestCountEffect('loadById');
  private readonly addToCreateRequestCount = this.createAddToRequestCountEffect('create');
  private readonly addToUpdateRequestCount = this.createAddToRequestCountEffect('update');
  private readonly addToDeleteRequestCount = this.createAddToRequestCountEffect('delete');

  private createAddToRequestCountEffect(
    entityMethodName: 'loadById' | 'create' | 'update' | 'delete'
  ): (value: number) => Subscription {
    return this.effect<number>((value$) => {
      return value$.pipe(
        startWith(0),
        scan((pendingRequestCount, value) => {
          pendingRequestCount = pendingRequestCount + value;

          this.patchState(({
            [`is${capitalize(entityMethodName)}Pending`]: pendingRequestCount > 0,
          } as unknown) as Partial<State>);

          return pendingRequestCount;
        })
      );
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function,@typescript-eslint/no-unused-vars
  protected overrideDataEffects(builder: DataEffectsBuilder<Entity, Id>): void {}
}

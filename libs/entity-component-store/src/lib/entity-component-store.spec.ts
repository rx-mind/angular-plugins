import { TestBed } from '@angular/core/testing';
import { TestScheduler } from 'rxjs/testing';
import { ENTITY_COMPONENT_STORE_CONFIG, EntityComponentStore } from './entity-component-store';
import { getInitialEntityState } from './entity-state';
import { EntityComponentStoreConfig, EntityState } from './models';

describe('EntityComponentStore', () => {
  function setup() {
    return {
      testScheduler: new TestScheduler((actual, expected) => expect(actual).toEqual(expected)),
    };
  }

  describe('initialization', () => {
    describe('with default config', () => {
      function withDefaultConfigSetup() {
        return {
          store: new EntityComponentStore(),
          ...setup(),
        };
      }

      it('should not initialize the state', () => {
        const { testScheduler, store } = withDefaultConfigSetup();

        testScheduler.run(({ expectObservable }) => {
          expectObservable(store.state$).toBe('-');
        });
      });

      it('should initialize the state via setState', () => {
        const { testScheduler, store } = withDefaultConfigSetup();

        testScheduler.run(({ expectObservable }) => {
          store.setState(getInitialEntityState());
          expectObservable(store.state$).toBe('x', { x: getInitialEntityState() });
        });
      });
    });

    describe('with passed config', () => {
      function withPassedConfigSetup(
        config: EntityComponentStoreConfig<
          EntityState<Record<string, unknown>>,
          Record<string, unknown>,
          string | number
        >
      ) {
        return {
          store: new EntityComponentStore(config),
          ...setup(),
        };
      }

      it('should initialize the state when initial state is provided', () => {
        const { testScheduler, store } = withPassedConfigSetup({
          initialState: getInitialEntityState(),
        });

        testScheduler.run(({ expectObservable }) => {
          expectObservable(store.state$).toBe('x', { x: getInitialEntityState() });
        });
      });

      it('should not initialize the state when initial state is not provided', () => {
        const { testScheduler, store } = withPassedConfigSetup({
          selectId: (e) => e.key as string,
        });

        testScheduler.run(({ expectObservable }) => {
          expectObservable(store.state$).toBe('-');
        });
      });
    });

    describe('with injection token', () => {
      function withInjectionTokenSetup(initialState?: unknown) {
        TestBed.configureTestingModule({
          providers: [
            EntityComponentStore,
            { provide: ENTITY_COMPONENT_STORE_CONFIG, useValue: { initialState } },
          ],
        });

        return {
          ...setup(),
          store: TestBed.inject(EntityComponentStore),
        };
      }

      it('should initialize the state when initial state is provided', () => {
        const { testScheduler, store } = withInjectionTokenSetup(getInitialEntityState());

        testScheduler.run(({ expectObservable }) => {
          expectObservable(store.state$).toBe('x', { x: getInitialEntityState() });
        });
      });

      it('should not initialize the state when initial state is not provided', () => {
        const { testScheduler, store } = withInjectionTokenSetup();

        testScheduler.run(({ expectObservable }) => {
          expectObservable(store.state$).toBe('-');
        });
      });
    });
  });

  describe('selectors', () => {
    function selectorsSetup(initialState: EntityState<Record<string, unknown>>) {
      return {
        store: new EntityComponentStore({ initialState }),
        ...setup(),
      };
    }

    describe('ids$', () => {
      it('should select ids', () => {
        const ids = [1, 2, 3];
        const { testScheduler, store } = selectorsSetup({ ids, entities: {} });

        testScheduler.run(({ expectObservable }) => {
          expectObservable(store.ids$).toBe('x', { x: [1, 2, 3] });
        });
      });
    });

    describe('entities$', () => {
      it('should select an entity dictionary', () => {
        const entities = { '1': { id: '1' }, '2': { id: '2' } };
        const { testScheduler, store } = selectorsSetup({ ids: [], entities });

        testScheduler.run(({ expectObservable }) => {
          expectObservable(store.entities$).toBe('x', { x: entities });
        });
      });
    });

    describe('all$', () => {
      it('should select a list of all entities', () => {
        const ids = [1, 2];
        const entities = { '1': { id: '1' }, '2': { id: '2' } };
        const { testScheduler, store } = selectorsSetup({ ids, entities });

        testScheduler.run(({ expectObservable }) => {
          expectObservable(store.all$).toBe('x', { x: Object.values(entities) });
        });
      });
    });

    describe('total$', () => {
      it('should select the total number of entities', () => {
        const ids = [1, 2, 3, 4, 5];
        const { testScheduler, store } = selectorsSetup({ ids, entities: {} });

        testScheduler.run(({ expectObservable }) => {
          expectObservable(store.total$).toBe('x', { x: ids.length });
        });
      });
    });
  });

  describe('updaters', () => {
    describe('with unsorted state adapter', () => {
      interface Musician {
        key: string;
        name: string;
      }

      interface MusiciansState extends EntityState<Musician, string> {
        selectedKey: string | null;
      }

      function withUnsortedStateAdapterSetup() {
        const initialState: MusiciansState = {
          ids: ['1', '2', '3'],
          entities: {
            '1': { key: '1', name: 'John' },
            '2': { key: '2', name: 'Jimmy' },
            '3': { key: '3', name: 'Eric' },
          },
          selectedKey: null,
        };

        return {
          initialState,
          store: new EntityComponentStore<MusiciansState>({ initialState, selectId: (e) => e.key }),
          ...setup(),
        };
      }

      describe('addOne', () => {
        it('should add one entity', () => {
          const musician: Musician = { key: '4', name: 'Carlos' };
          const { testScheduler, store, initialState } = withUnsortedStateAdapterSetup();

          testScheduler.run(({ expectObservable }) => {
            store.addOne(musician);
            expectObservable(store.state$).toBe('x', {
              x: {
                ...initialState,
                ids: [...initialState.ids, musician.key],
                entities: { ...initialState.entities, [musician.key]: musician },
              },
            });
          });
        });

        it('should patch the state with partial state', () => {
          const musician: Musician = { key: '4', name: 'Steve' };
          const { testScheduler, store, initialState } = withUnsortedStateAdapterSetup();

          testScheduler.run(({ expectObservable }) => {
            store.addOne(musician, { selectedKey: '4' });
            expectObservable(store.state$).toBe('x', {
              x: {
                ...initialState,
                ids: [...initialState.ids, musician.key],
                entities: { ...initialState.entities, [musician.key]: musician },
                selectedKey: '4',
              },
            });
          });
        });

        it('should patch the state with partial updater', () => {
          const musician: Musician = { key: '4', name: 'Mark' };
          const { testScheduler, store, initialState } = withUnsortedStateAdapterSetup();

          testScheduler.run(({ expectObservable }) => {
            store.addOne(musician, ({ ids }) => ({ selectedKey: ids[0] }));
            expectObservable(store.state$).toBe('x', {
              x: {
                ...initialState,
                ids: [...initialState.ids, musician.key],
                entities: { ...initialState.entities, [musician.key]: musician },
                selectedKey: '1',
              },
            });
          });
        });
      });

      describe('addMany', () => {
        it('should add many entities', () => {
          const musicians: Musician[] = [
            { key: '4', name: 'Carlos' },
            { key: '5', name: 'Phil' },
          ];
          const { testScheduler, store, initialState } = withUnsortedStateAdapterSetup();

          testScheduler.run(({ expectObservable }) => {
            store.addMany(musicians);
            expectObservable(store.state$).toBe('x', {
              x: {
                ...initialState,
                ids: [...initialState.ids, musicians[0].key, musicians[1].key],
                entities: {
                  ...initialState.entities,
                  [musicians[0].key]: musicians[0],
                  [musicians[1].key]: musicians[1],
                },
              },
            });
          });
        });

        it('should patch the state with partial state', () => {
          const musicians: Musician[] = [
            { key: '4', name: 'Steve' },
            { key: '5', name: 'Phil' },
          ];
          const { testScheduler, store, initialState } = withUnsortedStateAdapterSetup();

          testScheduler.run(({ expectObservable }) => {
            store.addMany(musicians, { selectedKey: '5' });
            expectObservable(store.state$).toBe('x', {
              x: {
                ...initialState,
                ids: [...initialState.ids, musicians[0].key, musicians[1].key],
                entities: {
                  ...initialState.entities,
                  [musicians[0].key]: musicians[0],
                  [musicians[1].key]: musicians[1],
                },
                selectedKey: '5',
              },
            });
          });
        });

        it('should patch the state with partial updater', () => {
          const musicians: Musician[] = [
            { key: '4', name: 'Mark' },
            { key: '5', name: 'Phil' },
          ];
          const { testScheduler, store, initialState } = withUnsortedStateAdapterSetup();

          testScheduler.run(({ expectObservable }) => {
            store.addMany(musicians, (state) => ({ selectedKey: state.ids[2] }));
            expectObservable(store.state$).toBe('x', {
              x: {
                ...initialState,
                ids: [...initialState.ids, musicians[0].key, musicians[1].key],
                entities: {
                  ...initialState.entities,
                  [musicians[0].key]: musicians[0],
                  [musicians[1].key]: musicians[1],
                },
                selectedKey: '3',
              },
            });
          });
        });
      });

      describe('setOne', () => {
        it('should add one entity when it does not exist in the collection', () => {
          const musician: Musician = { key: '4', name: 'Carlos' };
          const { testScheduler, store, initialState } = withUnsortedStateAdapterSetup();

          testScheduler.run(({ expectObservable }) => {
            store.setOne(musician);
            expectObservable(store.state$).toBe('x', {
              x: {
                ...initialState,
                ids: [...initialState.ids, musician.key],
                entities: { ...initialState.entities, [musician.key]: musician },
              },
            });
          });
        });

        it('should replace one entity when it exist in the collection', () => {
          const musician: Musician = { key: '2', name: 'Carlos' };
          const { testScheduler, store, initialState } = withUnsortedStateAdapterSetup();

          testScheduler.run(({ expectObservable }) => {
            store.setOne(musician);
            expectObservable(store.state$).toBe('x', {
              x: {
                ...initialState,
                entities: { ...initialState.entities, [musician.key]: musician },
              },
            });
          });
        });

        it('should patch the state with partial state', () => {
          const musician: Musician = { key: '4', name: 'Steve' };
          const { testScheduler, store, initialState } = withUnsortedStateAdapterSetup();

          testScheduler.run(({ expectObservable }) => {
            store.setOne(musician, { selectedKey: '2' });
            expectObservable(store.state$).toBe('x', {
              x: {
                ...initialState,
                ids: [...initialState.ids, musician.key],
                entities: { ...initialState.entities, [musician.key]: musician },
                selectedKey: '2',
              },
            });
          });
        });

        it('should patch the state with partial updater', () => {
          const musician: Musician = { key: '2', name: 'Mark' };
          const { testScheduler, store, initialState } = withUnsortedStateAdapterSetup();

          testScheduler.run(({ expectObservable }) => {
            store.setOne(musician, ({ ids }) => ({ selectedKey: ids[1] }));
            expectObservable(store.state$).toBe('x', {
              x: {
                ...initialState,
                entities: { ...initialState.entities, [musician.key]: musician },
                selectedKey: '2',
              },
            });
          });
        });
      });

      describe('setMany', () => {
        it('should add or replace many entities', () => {
          const musicians: Musician[] = [
            { key: '4', name: 'Carlos' },
            { key: '1', name: 'Frank' },
          ];
          const { testScheduler, store, initialState } = withUnsortedStateAdapterSetup();

          testScheduler.run(({ expectObservable }) => {
            store.setMany(musicians);
            expectObservable(store.state$).toBe('x', {
              x: {
                ...initialState,
                ids: [...initialState.ids, musicians[0].key],
                entities: {
                  ...initialState.entities,
                  [musicians[0].key]: musicians[0],
                  [musicians[1].key]: musicians[1],
                },
              },
            });
          });
        });

        it('should patch the state with partial state', () => {
          const musicians: Musician[] = [
            { key: '4', name: 'Carlos' },
            { key: '1', name: 'Frank' },
          ];
          const { testScheduler, store, initialState } = withUnsortedStateAdapterSetup();

          testScheduler.run(({ expectObservable }) => {
            store.setMany(musicians, { selectedKey: '4' });
            expectObservable(store.state$).toBe('x', {
              x: {
                ...initialState,
                ids: [...initialState.ids, musicians[0].key],
                entities: {
                  ...initialState.entities,
                  [musicians[0].key]: musicians[0],
                  [musicians[1].key]: musicians[1],
                },
                selectedKey: '4',
              },
            });
          });
        });

        it('should patch the state with partial updater', () => {
          const musicians: Musician[] = [{ key: '2', name: 'Mark' }];
          const { testScheduler, store, initialState } = withUnsortedStateAdapterSetup();

          testScheduler.run(({ expectObservable }) => {
            store.setMany(musicians, ({ ids }) => ({ selectedKey: ids[0] }));
            expectObservable(store.state$).toBe('x', {
              x: {
                ...initialState,
                entities: { ...initialState.entities, [musicians[0].key]: musicians[0] },
                selectedKey: '1',
              },
            });
          });
        });
      });

      describe('setAll', () => {
        it('should replace all entities', () => {
          const musicians: Musician[] = [
            { key: '10', name: 'Carlos' },
            { key: '20', name: 'Frank' },
          ];
          const { testScheduler, store, initialState } = withUnsortedStateAdapterSetup();

          testScheduler.run(({ expectObservable }) => {
            store.setAll(musicians);
            expectObservable(store.state$).toBe('x', {
              x: {
                ...initialState,
                ids: [musicians[0].key, musicians[1].key],
                entities: {
                  [musicians[0].key]: musicians[0],
                  [musicians[1].key]: musicians[1],
                },
              },
            });
          });
        });

        it('should patch the state with partial state', () => {
          const musicians: Musician[] = [{ key: '100', name: 'Mark' }];
          const { testScheduler, store, initialState } = withUnsortedStateAdapterSetup();

          testScheduler.run(({ expectObservable }) => {
            store.setAll(musicians, { selectedKey: '100' });
            expectObservable(store.state$).toBe('x', {
              x: {
                ...initialState,
                ids: [musicians[0].key],
                entities: {
                  [musicians[0].key]: musicians[0],
                },
                selectedKey: '100',
              },
            });
          });
        });

        it('should patch the state with partial updater', () => {
          const musicians: Musician[] = [{ key: '200', name: 'Eric' }];
          const { testScheduler, store, initialState } = withUnsortedStateAdapterSetup();

          testScheduler.run(({ expectObservable }) => {
            store.setAll(musicians, ({ ids }) => ({ selectedKey: ids[0] }));
            expectObservable(store.state$).toBe('x', {
              x: {
                ...initialState,
                ids: [musicians[0].key],
                entities: { [musicians[0].key]: musicians[0] },
                selectedKey: '1',
              },
            });
          });
        });
      });

      describe('removeOne', () => {
        it('should remove one entity', () => {
          const { testScheduler, store, initialState } = withUnsortedStateAdapterSetup();

          testScheduler.run(({ expectObservable }) => {
            store.removeOne('1');
            expectObservable(store.state$).toBe('x', {
              x: {
                ...initialState,
                ids: ['2', '3'],
                entities: { '2': initialState.entities['2'], '3': initialState.entities['3'] },
              },
            });
          });
        });

        it('should patch the state with partial state', () => {
          const { testScheduler, store, initialState } = withUnsortedStateAdapterSetup();

          testScheduler.run(({ expectObservable }) => {
            store.removeOne('2', { selectedKey: '1' });
            expectObservable(store.state$).toBe('x', {
              x: {
                ...initialState,
                ids: ['1', '3'],
                entities: { '1': initialState.entities[1], '3': initialState.entities[3] },
                selectedKey: '1',
              },
            });
          });
        });

        it('should patch the state with partial updater', () => {
          const { testScheduler, store, initialState } = withUnsortedStateAdapterSetup();

          testScheduler.run(({ expectObservable }) => {
            store.removeOne('3', ({ ids }) => ({ selectedKey: ids[0] }));
            expectObservable(store.state$).toBe('x', {
              x: {
                ...initialState,
                ids: ['1', '2'],
                entities: { '1': initialState.entities[1], '2': initialState.entities[2] },
                selectedKey: '1',
              },
            });
          });
        });
      });

      describe('removeMany', () => {
        it('should remove many entities by ids', () => {
          const { testScheduler, store, initialState } = withUnsortedStateAdapterSetup();

          testScheduler.run(({ expectObservable }) => {
            store.removeMany(['1', '2']);
            expectObservable(store.state$).toBe('x', {
              x: {
                ...initialState,
                ids: ['3'],
                entities: { '3': initialState.entities['3'] },
              },
            });
          });
        });

        it('should remove many entities by predicate', () => {
          const { testScheduler, store, initialState } = withUnsortedStateAdapterSetup();

          testScheduler.run(({ expectObservable }) => {
            store.removeMany((entity) => entity.name.startsWith('J'));
            expectObservable(store.state$).toBe('x', {
              x: {
                ...initialState,
                ids: ['3'],
                entities: { '3': initialState.entities['3'] },
              },
            });
          });
        });

        it('should patch the state with partial state', () => {
          const { testScheduler, store, initialState } = withUnsortedStateAdapterSetup();

          testScheduler.run(({ expectObservable }) => {
            store.removeMany(['1', '3'], { selectedKey: '2' });
            expectObservable(store.state$).toBe('x', {
              x: {
                ...initialState,
                ids: ['2'],
                entities: { '2': initialState.entities[2] },
                selectedKey: '2',
              },
            });
          });
        });

        it('should patch the state with partial updater', () => {
          const { testScheduler, store, initialState } = withUnsortedStateAdapterSetup();

          testScheduler.run(({ expectObservable }) => {
            store.removeMany(
              (entity) => entity.name.indexOf('i') > -1,
              ({ ids }) => ({ selectedKey: ids[0] })
            );
            expectObservable(store.state$).toBe('x', {
              x: {
                ...initialState,
                ids: ['1'],
                entities: { '1': initialState.entities[1] },
                selectedKey: '1',
              },
            });
          });
        });
      });

      describe('removeAll', () => {
        it('should remove all entities', () => {
          const { testScheduler, store, initialState } = withUnsortedStateAdapterSetup();

          testScheduler.run(({ expectObservable }) => {
            store.removeAll();
            expectObservable(store.state$).toBe('x', {
              x: {
                ...initialState,
                ids: [],
                entities: {},
              },
            });
          });
        });

        it('should patch the state with partial state', () => {
          const { testScheduler, store, initialState } = withUnsortedStateAdapterSetup();

          testScheduler.run(({ expectObservable }) => {
            store.removeAll({ selectedKey: '123' });
            expectObservable(store.state$).toBe('x', {
              x: {
                ...initialState,
                ids: [],
                entities: {},
                selectedKey: '123',
              },
            });
          });
        });

        it('should patch the state with partial updater', () => {
          const { testScheduler, store, initialState } = withUnsortedStateAdapterSetup();

          testScheduler.run(({ expectObservable }) => {
            store.removeAll(({ ids }) => ({ selectedKey: ids[0] }));
            expectObservable(store.state$).toBe('x', {
              x: {
                ...initialState,
                ids: [],
                entities: {},
                selectedKey: '1',
              },
            });
          });
        });
      });

      describe('updateOne', () => {
        it('should update one entity', () => {
          const musician: Musician = { key: '1', name: 'Elvis' };
          const { testScheduler, store, initialState } = withUnsortedStateAdapterSetup();

          testScheduler.run(({ expectObservable }) => {
            store.updateOne({ id: musician.key, changes: { name: musician.name } });
            expectObservable(store.state$).toBe('x', {
              x: {
                ...initialState,
                entities: { ...initialState.entities, [musician.key]: musician },
              },
            });
          });
        });

        it('should patch the state with partial state', () => {
          const musician: Musician = { key: '2', name: 'Johnny' };
          const { testScheduler, store, initialState } = withUnsortedStateAdapterSetup();

          testScheduler.run(({ expectObservable }) => {
            store.updateOne(
              { id: musician.key, changes: { name: musician.name } },
              { selectedKey: '3' }
            );
            expectObservable(store.state$).toBe('x', {
              x: {
                ...initialState,
                entities: { ...initialState.entities, [musician.key]: musician },
                selectedKey: '3',
              },
            });
          });
        });

        it('should patch the state with partial updater', () => {
          const musician: Musician = { key: '3', name: 'Mark' };
          const { testScheduler, store, initialState } = withUnsortedStateAdapterSetup();

          testScheduler.run(({ expectObservable }) => {
            store.updateOne({ id: musician.key, changes: { name: musician.name } }, ({ ids }) => ({
              selectedKey: ids[2],
            }));
            expectObservable(store.state$).toBe('x', {
              x: {
                ...initialState,
                entities: { ...initialState.entities, [musician.key]: musician },
                selectedKey: '3',
              },
            });
          });
        });
      });

      describe('updateMany', () => {
        it('should update many entities', () => {
          const musicians: Musician[] = [
            { key: '1', name: 'Elvis' },
            { key: '2', name: 'Michael' },
          ];
          const { testScheduler, store, initialState } = withUnsortedStateAdapterSetup();

          testScheduler.run(({ expectObservable }) => {
            store.updateMany([
              { id: musicians[0].key, changes: { name: musicians[0].name } },
              { id: musicians[1].key, changes: {} },
            ]);
            expectObservable(store.state$).toBe('x', {
              x: {
                ...initialState,
                entities: {
                  ...initialState.entities,
                  [musicians[0].key]: musicians[0],
                },
              },
            });
          });
        });

        it('should patch the state with partial state', () => {
          const musician: Musician = { key: '3', name: 'Peter' };
          const { testScheduler, store, initialState } = withUnsortedStateAdapterSetup();

          testScheduler.run(({ expectObservable }) => {
            store.updateMany([{ id: musician.key, changes: { name: musician.name } }], {
              selectedKey: '3',
            });
            expectObservable(store.state$).toBe('x', {
              x: {
                ...initialState,
                entities: { ...initialState.entities, [musician.key]: musician },
                selectedKey: '3',
              },
            });
          });
        });

        it('should patch the state with partial updater', () => {
          const musician: Musician = { key: '2', name: 'George' };
          const { testScheduler, store, initialState } = withUnsortedStateAdapterSetup();

          testScheduler.run(({ expectObservable }) => {
            store.updateMany(
              [{ id: musician.key, changes: { name: musician.name } }],
              ({ ids }) => ({
                selectedKey: ids[0],
              })
            );
            expectObservable(store.state$).toBe('x', {
              x: {
                ...initialState,
                entities: { ...initialState.entities, [musician.key]: musician },
                selectedKey: '1',
              },
            });
          });
        });
      });

      describe('upsertOne', () => {
        it('should add one entity when it does not exist in the collection', () => {
          const musician: Musician = { key: '4', name: 'Jim' };
          const { testScheduler, store, initialState } = withUnsortedStateAdapterSetup();

          testScheduler.run(({ expectObservable }) => {
            store.upsertOne(musician);
            expectObservable(store.state$).toBe('x', {
              x: {
                ...initialState,
                ids: [...initialState.ids, musician.key],
                entities: { ...initialState.entities, [musician.key]: musician },
              },
            });
          });
        });

        it('should update one entity when it exists in the collection', () => {
          const musician: Musician = { key: '1', name: 'Phil' };
          const { testScheduler, store, initialState } = withUnsortedStateAdapterSetup();

          testScheduler.run(({ expectObservable }) => {
            store.upsertOne(musician);
            expectObservable(store.state$).toBe('x', {
              x: {
                ...initialState,
                entities: { ...initialState.entities, [musician.key]: musician },
              },
            });
          });
        });

        it('should patch the state with partial state', () => {
          const musician: Musician = { key: '2', name: 'Johnny' };
          const { testScheduler, store, initialState } = withUnsortedStateAdapterSetup();

          testScheduler.run(({ expectObservable }) => {
            store.upsertOne(musician, { selectedKey: '3' });
            expectObservable(store.state$).toBe('x', {
              x: {
                ...initialState,
                entities: { ...initialState.entities, [musician.key]: musician },
                selectedKey: '3',
              },
            });
          });
        });

        it('should patch the state with partial updater', () => {
          const musician: Musician = { key: '4', name: 'Steve' };
          const { testScheduler, store, initialState } = withUnsortedStateAdapterSetup();

          testScheduler.run(({ expectObservable }) => {
            store.upsertOne(musician, ({ ids }) => ({
              selectedKey: ids[0],
            }));
            expectObservable(store.state$).toBe('x', {
              x: {
                ...initialState,
                ids: [...initialState.ids, musician.key],
                entities: { ...initialState.entities, [musician.key]: musician },
                selectedKey: '1',
              },
            });
          });
        });
      });

      describe('upsertMany', () => {
        it('should add or update many entities', () => {
          const musicians: Musician[] = [
            { key: '1', name: 'Elvis' },
            { key: '4', name: 'Nick' },
          ];
          const { testScheduler, store, initialState } = withUnsortedStateAdapterSetup();

          testScheduler.run(({ expectObservable }) => {
            store.upsertMany(musicians);
            expectObservable(store.state$).toBe('x', {
              x: {
                ...initialState,
                ids: [...initialState.ids, musicians[1].key],
                entities: {
                  ...initialState.entities,
                  [musicians[0].key]: musicians[0],
                  [musicians[1].key]: musicians[1],
                },
              },
            });
          });
        });

        it('should patch the state with partial state', () => {
          const musician: Musician = { key: '3', name: 'Will' };
          const { testScheduler, store, initialState } = withUnsortedStateAdapterSetup();

          testScheduler.run(({ expectObservable }) => {
            store.upsertMany([musician], {
              selectedKey: '1',
            });
            expectObservable(store.state$).toBe('x', {
              x: {
                ...initialState,
                entities: { ...initialState.entities, [musician.key]: musician },
                selectedKey: '1',
              },
            });
          });
        });

        it('should patch the state with partial updater', () => {
          const musician: Musician = { key: '4', name: 'Gregor' };
          const { testScheduler, store, initialState } = withUnsortedStateAdapterSetup();

          testScheduler.run(({ expectObservable }) => {
            store.upsertMany([musician], ({ ids }) => ({
              selectedKey: ids[3] || null,
            }));
            expectObservable(store.state$).toBe('x', {
              x: {
                ...initialState,
                ids: [...initialState.ids, musician.key],
                entities: { ...initialState.entities, [musician.key]: musician },
                selectedKey: null,
              },
            });
          });
        });
      });

      describe('mapOne', () => {
        it('should map one entity', () => {
          const { testScheduler, store, initialState } = withUnsortedStateAdapterSetup();

          testScheduler.run(({ expectObservable }) => {
            store.mapOne({ id: '1', map: (entity) => ({ ...entity, name: entity.key }) });
            expectObservable(store.state$).toBe('x', {
              x: {
                ...initialState,
                entities: { ...initialState.entities, '1': { key: '1', name: '1' } },
              },
            });
          });
        });

        it('should patch the state with partial state', () => {
          const { testScheduler, store, initialState } = withUnsortedStateAdapterSetup();

          testScheduler.run(({ expectObservable }) => {
            store.mapOne({ id: '1', map: (entity) => entity }, { selectedKey: '100' });
            expectObservable(store.state$).toBe('x', {
              x: {
                ...initialState,
                selectedKey: '100',
              },
            });
          });
        });

        it('should patch the state with partial updater', () => {
          const { testScheduler, store, initialState } = withUnsortedStateAdapterSetup();

          testScheduler.run(({ expectObservable }) => {
            store.mapOne({ id: '1', map: (entity) => entity }, ({ ids }) => ({
              selectedKey: ids[2],
            }));
            expectObservable(store.state$).toBe('x', {
              x: {
                ...initialState,
                selectedKey: '3',
              },
            });
          });
        });
      });

      describe('map', () => {
        it('should map entities', () => {
          const { testScheduler, store, initialState } = withUnsortedStateAdapterSetup();

          testScheduler.run(({ expectObservable }) => {
            store.map((entity) => ({ ...entity, name: entity.key }));
            expectObservable(store.state$).toBe('x', {
              x: {
                ...initialState,
                entities: {
                  '1': { key: '1', name: '1' },
                  '2': { key: '2', name: '2' },
                  '3': { key: '3', name: '3' },
                },
              },
            });
          });
        });

        it('should patch the state with partial state', () => {
          const { testScheduler, store, initialState } = withUnsortedStateAdapterSetup();

          testScheduler.run(({ expectObservable }) => {
            store.map((entity) => entity, { selectedKey: '123' });
            expectObservable(store.state$).toBe('x', {
              x: {
                ...initialState,
                selectedKey: '123',
              },
            });
          });
        });

        it('should patch the state with partial updater', () => {
          const { testScheduler, store, initialState } = withUnsortedStateAdapterSetup();

          testScheduler.run(({ expectObservable }) => {
            store.map(
              (entity) => entity,
              ({ ids }) => ({
                selectedKey: ids[1],
              })
            );
            expectObservable(store.state$).toBe('x', {
              x: {
                ...initialState,
                selectedKey: '2',
              },
            });
          });
        });
      });
    });

    describe('with sorted state adapter', () => {
      interface Book {
        id: number;
        title: string;
      }

      type BooksState = EntityState<Book, number>;

      function withSortedStateAdapterSetup() {
        const initialState: BooksState = {
          ids: [1, 2],
          entities: {
            1: { id: 1, title: 'b' },
            2: { id: 2, title: 'n' },
          },
        };

        return {
          initialState,
          store: new EntityComponentStore<BooksState>({
            initialState,
            sortComparer: (b1, b2) => b1.title.localeCompare(b2.title),
          }),
          ...setup(),
        };
      }

      describe('addOne', () => {
        it('should add one entity', () => {
          const book: Book = { id: 3, title: 'm' };
          const { testScheduler, store, initialState } = withSortedStateAdapterSetup();

          testScheduler.run(({ expectObservable }) => {
            store.addOne(book);
            expectObservable(store.state$).toBe('x', {
              x: {
                ids: [1, 3, 2],
                entities: { ...initialState.entities, [book.id]: book },
              },
            });
          });
        });
      });

      describe('addMany', () => {
        it('should add many entities', () => {
          const books: Book[] = [
            { id: 3, title: 'd' },
            { id: 4, title: 'z' },
          ];
          const { testScheduler, store, initialState } = withSortedStateAdapterSetup();

          testScheduler.run(({ expectObservable }) => {
            store.addMany(books);
            expectObservable(store.state$).toBe('x', {
              x: {
                ids: [1, 3, 2, 4],
                entities: {
                  ...initialState.entities,
                  [books[0].id]: books[0],
                  [books[1].id]: books[1],
                },
              },
            });
          });
        });
      });

      describe('setOne', () => {
        it('should add one entity when it does not exist in the collection', () => {
          const book: Book = { id: 3, title: 'a' };
          const { testScheduler, store, initialState } = withSortedStateAdapterSetup();

          testScheduler.run(({ expectObservable }) => {
            store.setOne(book);
            expectObservable(store.state$).toBe('x', {
              x: {
                ids: [3, 1, 2],
                entities: { ...initialState.entities, [book.id]: book },
              },
            });
          });
        });

        it('should replace one entity when it exist in the collection', () => {
          const book: Book = { id: 1, title: 'z' };
          const { testScheduler, store, initialState } = withSortedStateAdapterSetup();

          testScheduler.run(({ expectObservable }) => {
            store.setOne(book);
            expectObservable(store.state$).toBe('x', {
              x: {
                ids: [2, 1],
                entities: { ...initialState.entities, [book.id]: book },
              },
            });
          });
        });
      });

      describe('setMany', () => {
        it('should add or replace many entities', () => {
          const books: Book[] = [
            { id: 1, title: 'x' },
            { id: 3, title: 'a' },
          ];
          const { testScheduler, store, initialState } = withSortedStateAdapterSetup();

          testScheduler.run(({ expectObservable }) => {
            store.setMany(books);
            expectObservable(store.state$).toBe('x', {
              x: {
                ids: [3, 2, 1],
                entities: {
                  ...initialState.entities,
                  [books[0].id]: books[0],
                  [books[1].id]: books[1],
                },
              },
            });
          });
        });
      });

      describe('setAll', () => {
        it('should replace all entities', () => {
          const books: Book[] = [
            { id: 1, title: 'z' },
            { id: 3, title: 'a' },
          ];
          const { testScheduler, store } = withSortedStateAdapterSetup();

          testScheduler.run(({ expectObservable }) => {
            store.setAll(books);
            expectObservable(store.state$).toBe('x', {
              x: {
                ids: [3, 1],
                entities: {
                  [books[0].id]: books[0],
                  [books[1].id]: books[1],
                },
              },
            });
          });
        });
      });

      describe('removeOne', () => {
        it('should remove one entity', () => {
          const { testScheduler, store, initialState } = withSortedStateAdapterSetup();

          testScheduler.run(({ expectObservable }) => {
            store.removeOne(1);
            expectObservable(store.state$).toBe('x', {
              x: {
                ids: [2],
                entities: { 2: initialState.entities[2] },
              },
            });
          });
        });
      });

      describe('removeMany', () => {
        it('should remove many entities by ids', () => {
          const { testScheduler, store, initialState } = withSortedStateAdapterSetup();

          testScheduler.run(({ expectObservable }) => {
            store.removeMany([1]);
            expectObservable(store.state$).toBe('x', {
              x: {
                ids: [2],
                entities: { 2: initialState.entities[2] },
              },
            });
          });
        });

        it('should remove many entities by predicate', () => {
          const { testScheduler, store, initialState } = withSortedStateAdapterSetup();

          testScheduler.run(({ expectObservable }) => {
            store.removeMany((entity) => entity.id > 1);
            expectObservable(store.state$).toBe('x', {
              x: {
                ids: [1],
                entities: { 1: initialState.entities[1] },
              },
            });
          });
        });
      });

      describe('removeAll', () => {
        it('should remove all entities', () => {
          const { testScheduler, store } = withSortedStateAdapterSetup();

          testScheduler.run(({ expectObservable }) => {
            store.removeAll();
            expectObservable(store.state$).toBe('x', {
              x: {
                ids: [],
                entities: {},
              },
            });
          });
        });
      });

      describe('updateOne', () => {
        it('should update one entity', () => {
          const book: Book = { id: 1, title: 'z' };
          const { testScheduler, store, initialState } = withSortedStateAdapterSetup();

          testScheduler.run(({ expectObservable }) => {
            store.updateOne({ id: book.id, changes: { title: book.title } });
            expectObservable(store.state$).toBe('x', {
              x: {
                ids: [2, 1],
                entities: { ...initialState.entities, [book.id]: book },
              },
            });
          });
        });
      });

      describe('updateMany', () => {
        it('should update many entities', () => {
          const book: Book = { id: 2, title: 'a' };
          const { testScheduler, store, initialState } = withSortedStateAdapterSetup();

          testScheduler.run(({ expectObservable }) => {
            store.updateMany([{ id: book.id, changes: { title: book.title } }]);
            expectObservable(store.state$).toBe('x', {
              x: {
                ids: [2, 1],
                entities: {
                  ...initialState.entities,
                  [book.id]: book,
                },
              },
            });
          });
        });
      });

      describe('upsertOne', () => {
        it('should add one entity when it does not exist in the collection', () => {
          const book: Book = { id: 3, title: 'z' };
          const { testScheduler, store, initialState } = withSortedStateAdapterSetup();

          testScheduler.run(({ expectObservable }) => {
            store.upsertOne(book);
            expectObservable(store.state$).toBe('x', {
              x: {
                ids: [...initialState.ids, book.id],
                entities: { ...initialState.entities, [book.id]: book },
              },
            });
          });
        });

        it('should update one entity when it exists in the collection', () => {
          const book: Book = { id: 2, title: 'a' };
          const { testScheduler, store, initialState } = withSortedStateAdapterSetup();

          testScheduler.run(({ expectObservable }) => {
            store.upsertOne(book);
            expectObservable(store.state$).toBe('x', {
              x: {
                ids: [2, 1],
                entities: { ...initialState.entities, [book.id]: book },
              },
            });
          });
        });
      });

      describe('upsertMany', () => {
        it('should add or update many entities', () => {
          const books: Book[] = [
            { id: 3, title: 'z' },
            { id: 1, title: 'o' },
          ];
          const { testScheduler, store, initialState } = withSortedStateAdapterSetup();

          testScheduler.run(({ expectObservable }) => {
            store.upsertMany(books);
            expectObservable(store.state$).toBe('x', {
              x: {
                ids: [2, 1, 3],
                entities: {
                  ...initialState.entities,
                  [books[0].id]: books[0],
                  [books[1].id]: books[1],
                },
              },
            });
          });
        });
      });

      describe('mapOne', () => {
        it('should map one entity', () => {
          const { testScheduler, store, initialState } = withSortedStateAdapterSetup();

          testScheduler.run(({ expectObservable }) => {
            store.mapOne({ id: 2, map: (entity) => ({ ...entity, title: `a${entity.title}` }) });
            expectObservable(store.state$).toBe('x', {
              x: {
                ids: [2, 1],
                entities: { ...initialState.entities, 2: { id: 2, title: 'an' } },
              },
            });
          });
        });
      });

      describe('map', () => {
        it('should map entities', () => {
          const { testScheduler, store } = withSortedStateAdapterSetup();

          testScheduler.run(({ expectObservable }) => {
            store.map((entity) => ({ ...entity, title: `${entity.id}` }));
            expectObservable(store.state$).toBe('x', {
              x: {
                ids: [1, 2],
                entities: {
                  1: { id: 1, title: '1' },
                  2: { id: 2, title: '2' },
                },
              },
            });
          });
        });
      });
    });
  });
});

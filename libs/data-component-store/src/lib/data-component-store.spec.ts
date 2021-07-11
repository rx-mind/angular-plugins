import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import { TestScheduler } from 'rxjs/testing';
import { DATA_COMPONENT_STORE_CONFIG, DataComponentStore } from './data-component-store';
import { DataEffectsBuilder } from './data-effects-builder';
import { DataService, DefaultDataService } from './data-service';
import { getInitialDataState } from './data-state';
import { DataComponentStoreConfig, DataState } from './models';

describe('DataComponentStore', () => {
  interface Product {
    id: number;
    name: string;
  }

  interface ProductsState extends DataState<Product, number> {
    filter: string;
  }

  const initialState = getInitialDataState<ProductsState>({ filter: '' });

  class BaseProductsStore extends DataComponentStore<ProductsState> {
    readonly filter$ = this.select((s) => s.filter);
  }

  function getProductsService(): DataService<Product, number> {
    return {
      /* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function */
      get(..._) {},
      getById(..._) {},
      create(..._) {},
      update(..._) {},
      delete(..._) {},
      /* eslint-enable @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function */
    } as DataService<Product, number>;
  }

  const p1: Product = { id: 1, name: 'P1' };
  const p2: Product = { id: 2, name: 'P2' };
  const p3: Product = { id: 3, name: 'P3' };

  function setup() {
    return {
      testScheduler: new TestScheduler((actual, expected) => expect(actual).toEqual(expected)),
    };
  }

  describe('initialization', () => {
    describe('state', () => {
      describe('via constructor', () => {
        function viaConstructorSetup(initialState?: ProductsState) {
          return {
            ...setup(),
            store: new DataComponentStore<ProductsState>({
              initialState,
              dataService: getProductsService(),
            }),
          };
        }

        it('should initialize when initial state is provided', () => {
          const { testScheduler, store } = viaConstructorSetup(initialState);

          testScheduler.run(({ expectObservable }) => {
            expectObservable(store.state$).toBe('x', { x: initialState });
          });
        });

        it('should not initialize when initial state is not provided', () => {
          const { testScheduler, store } = viaConstructorSetup();

          testScheduler.run(({ expectObservable }) => {
            expectObservable(store.state$).toBe('-');
          });
        });

        it('should initialize via setState', () => {
          const { testScheduler, store } = viaConstructorSetup();

          testScheduler.run(({ expectObservable }) => {
            testScheduler.schedule(() => store.setState(initialState), 1);
            expectObservable(store.state$).toBe('-x', { x: initialState });
          });
        });
      });

      describe('via injection token', () => {
        function viaInjectionTokenSetup(initialState?: ProductsState) {
          TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [
              DataComponentStore,
              {
                provide: DATA_COMPONENT_STORE_CONFIG,
                useValue: { initialState, baseUrl: '/products' },
              },
            ],
          });

          return {
            ...setup(),
            store: (TestBed.inject(
              DataComponentStore
            ) as unknown) as DataComponentStore<ProductsState>,
          };
        }

        it('should initialize when initial state is provided', () => {
          const { testScheduler, store } = viaInjectionTokenSetup(initialState);

          testScheduler.run(({ expectObservable }) => {
            expectObservable(store.state$).toBe('x', {
              x: initialState,
            });
          });
        });

        it('should not initialize when initial state is not provided', () => {
          const { testScheduler, store } = viaInjectionTokenSetup();

          testScheduler.run(({ expectObservable }) => {
            expectObservable(store.state$).toBe('-');
          });
        });

        it('should initialize via setState', () => {
          const { testScheduler, store } = viaInjectionTokenSetup();

          testScheduler.run(({ expectObservable }) => {
            testScheduler.schedule(() => store.setState(initialState), 1);
            expectObservable(store.state$).toBe('-x', { x: initialState });
          });
        });
      });
    });

    describe('data service', () => {
      function dataServiceSetup(config: DataComponentStoreConfig<ProductsState>) {
        TestBed.configureTestingModule({
          imports: [HttpClientTestingModule],
          providers: [
            DataComponentStore,
            {
              provide: DATA_COMPONENT_STORE_CONFIG,
              useValue: config,
            },
          ],
        });

        return {
          dataService: (TestBed.inject(DataComponentStore) as any).dataService as DataService<
            Product,
            number
          >,
        };
      }

      it('should use default data service when base url is provided', () => {
        const { dataService } = dataServiceSetup({ baseUrl: '/products' });
        expect(dataService).toBeInstanceOf(DefaultDataService);
      });

      it('should use provided data service', () => {
        const customDataService = {} as DataService<Product, number>;
        const { dataService } = dataServiceSetup({ dataService: customDataService });

        expect(dataService).toBe(customDataService);
      });
    });
  });

  describe('selectors', () => {
    function selectorsSetup() {
      const dataService = getProductsService();

      return {
        ...setup(),
        store: new BaseProductsStore({ initialState, dataService }),
        dataService,
      };
    }

    describe('isLoadPending', () => {
      it('should return true when any load request is pending', () => {
        const { testScheduler, store, dataService } = selectorsSetup();

        spyOn(dataService, 'get').and.returnValues(
          of([]).pipe(delay(10)),
          throwError('error'),
          of([]).pipe(delay(3))
        );

        testScheduler.run(({ expectObservable }) => {
          store.load();
          testScheduler.schedule(() => store.load(), 2);
          testScheduler.schedule(() => store.load(), 6);

          expectObservable(store.isLoadPending$).toBe('k-l---m--n', {
            k: true,
            l: false,
            m: true,
            n: false,
          });
        });
      });
    });

    describe('isLoadByIdPending', () => {
      it('should return true when any load by id request is pending', () => {
        const { testScheduler, store, dataService } = selectorsSetup();

        spyOn(dataService, 'getById').and.returnValues(
          of(p1).pipe(delay(4)),
          throwError('error'),
          of(p2).pipe(delay(2)),
          of(p3).pipe(delay(3))
        );

        testScheduler.run(({ expectObservable }) => {
          store.loadById(1);
          testScheduler.schedule(() => store.loadById(-1), 2);
          testScheduler.schedule(() => {
            store.loadById(2);
            store.loadById(3);
          }, 5);

          expectObservable(store.isLoadByIdPending$).toBe('k---lm--n', {
            k: true,
            l: false,
            m: true,
            n: false,
          });
        });
      });
    });

    describe('isCreatePending', () => {
      it('should return true when any create request is pending', () => {
        const { testScheduler, store, dataService } = selectorsSetup();

        spyOn(dataService, 'create').and.returnValues(
          of(p1).pipe(delay(3)),
          of(p2).pipe(delay(2)),
          of(p3).pipe(delay(2))
        );

        testScheduler.run(({ expectObservable }) => {
          testScheduler.schedule(() => store.create(p1), 1);
          testScheduler.schedule(() => store.create(p2), 2);
          testScheduler.schedule(() => store.create(p3), 6);

          expectObservable(store.isCreatePending$).toBe('kl--m-n-o', {
            k: false,
            l: true,
            m: false,
            n: true,
            o: false,
          });
        });
      });
    });

    describe('isUpdatePending', () => {
      it('should return true when any update request is pending', () => {
        const { testScheduler, store, dataService } = selectorsSetup();

        spyOn(dataService, 'update').and.returnValues(
          of(p1).pipe(delay(2)),
          of(p2).pipe(delay(2)),
          of(p1).pipe(delay(3))
        );

        testScheduler.run(({ expectObservable }) => {
          store.update({ id: p1.id, changes: { name: p1.name } });
          testScheduler.schedule(() => store.update({ id: p2.id, changes: {} }), 1);
          testScheduler.schedule(() => store.update({ id: p1.id, changes: {} }), 6);

          expectObservable(store.isUpdatePending$).toBe('k--l--m--n', {
            k: true,
            l: false,
            m: true,
            n: false,
          });
        });
      });
    });

    describe('isDeletePending', () => {
      it('should return true when any delete request is pending', () => {
        const { testScheduler, store, dataService } = selectorsSetup();

        spyOn(dataService, 'delete').and.returnValues(of(1).pipe(delay(2)), of(2).pipe(delay(2)));

        testScheduler.run(({ expectObservable }) => {
          testScheduler.schedule(() => store.delete(1), 1);
          testScheduler.schedule(() => store.delete(2), 2);

          expectObservable(store.isDeletePending$).toBe('kl--m', {
            k: false,
            l: true,
            m: false,
          });
        });
      });
    });

    describe('isPending', () => {
      it('should return true when load request is pending', () => {
        const { testScheduler, store } = selectorsSetup();

        testScheduler.run(({ expectObservable }) => {
          store.patchState({ isLoadPending: true });
          expectObservable(store.isPending$).toBe('x', { x: true });
        });
      });

      it('should return true when load by id request is pending', () => {
        const { testScheduler, store } = selectorsSetup();

        testScheduler.run(({ expectObservable }) => {
          store.patchState({ isLoadByIdPending: true });
          expectObservable(store.isPending$).toBe('x', { x: true });
        });
      });

      it('should return true when create request is pending', () => {
        const { testScheduler, store } = selectorsSetup();

        testScheduler.run(({ expectObservable }) => {
          store.patchState({ isCreatePending: true });
          expectObservable(store.isPending$).toBe('x', { x: true });
        });
      });

      it('should return true when update request is pending', () => {
        const { testScheduler, store } = selectorsSetup();

        testScheduler.run(({ expectObservable }) => {
          store.patchState({ isUpdatePending: true });
          expectObservable(store.isPending$).toBe('x', { x: true });
        });
      });

      it('should return true when delete request is pending', () => {
        const { testScheduler, store } = selectorsSetup();

        testScheduler.run(({ expectObservable }) => {
          store.patchState({ isDeletePending: true });
          expectObservable(store.isPending$).toBe('x', { x: true });
        });
      });
    });
  });

  describe('effects', () => {
    function effectsSetup() {
      const dataService = getProductsService();
      const store = new BaseProductsStore({ initialState, dataService });

      return {
        ...setup(),
        store,
        dataService,
      };
    }

    describe('load', () => {
      it('should invoke get from data service with provided query parameters', () => {
        const { store, dataService } = effectsSetup();
        const params = { filter: 'product' };

        spyOn(dataService, 'get').and.returnValue(of([]));

        store.load(params);
        expect(dataService.get).toHaveBeenCalledWith(params);
      });

      it('should invoke get from data service without query parameters', () => {
        const { store, dataService } = effectsSetup();

        spyOn(dataService, 'get').and.returnValue(of([]));

        store.load();
        expect(dataService.get).toHaveBeenCalledWith(undefined);
      });

      it('should invoke custom load start effect when load start effect is overridden', () => {
        const { dataService, testScheduler } = effectsSetup();
        const filter = 'product';

        spyOn(dataService, 'get').and.returnValue(of([]));

        class ProductsStore extends BaseProductsStore {
          constructor() {
            super({ initialState, dataService });
          }

          protected overrideDataEffects(builder: DataEffectsBuilder<Product, number>): void {
            builder.loadStart<{ filter: string }>(({ filter }) => {
              this.patchState({ filter });
            });
          }
        }
        const store = new ProductsStore();

        testScheduler.run(({ expectObservable }) => {
          testScheduler.schedule(() => store.load({ filter }), 1);
          expectObservable(store.filter$).toBe('xy', { x: initialState.filter, y: filter });
        });
      });

      it('should invoke default load success effect when load success effect is not overridden', () => {
        const { testScheduler, store, dataService } = effectsSetup();

        spyOn(dataService, 'get').and.returnValue(of([p1, p2]).pipe(delay(3)));

        testScheduler.run(({ expectObservable }) => {
          testScheduler.schedule(() => store.load(), 1);

          expectObservable(store.ids$).toBe('x---y', { x: [], y: [p1.id, p2.id] });
          expectObservable(store.entities$).toBe('x---y', {
            x: {},
            y: { [p1.id]: p1, [p2.id]: p2 },
          });
        });
      });

      it('should invoke custom load success effect when load success effect is overridden', () => {
        const { dataService, testScheduler } = effectsSetup();
        const filter = 'p';

        spyOn(dataService, 'get').and.returnValue(of({ products: [p1] }).pipe(delay(2)));

        class ProductsStore extends BaseProductsStore {
          constructor() {
            super({ initialState, dataService });
          }

          protected overrideDataEffects(builder: DataEffectsBuilder<Product, number>): void {
            builder.loadSuccess<{ products: Product[] }>(({ products }) => {
              this.addMany(products, { filter });
            });
          }
        }
        const store = new ProductsStore();

        testScheduler.run(({ expectObservable }) => {
          testScheduler.schedule(() => store.load(), 1);

          expectObservable(store.ids$).toBe('x--y', { x: [], y: [p1.id] });
          expectObservable(store.entities$).toBe('x--y', {
            x: {},
            y: { [p1.id]: p1 },
          });
          expectObservable(store.filter$).toBe('x--y', { x: initialState.filter, y: filter });
        });
      });

      it('should log error when load success effect is not overridden and data service does not return an array of entities', () => {
        const { store, dataService } = effectsSetup();

        console.error = jest.fn();
        spyOn(dataService, 'get').and.returnValue(of({ products: [p1, p2] }));

        store.load();
        expect(console.error).toHaveBeenCalledWith(
          '@rx-mind/data-component-store: Load request does not return an array of entities. ' +
            'Use `overrideDataEffects` method to change the default behavior of `loadSuccess` method.'
        );
      });

      it('should invoke custom load error effect when load error effect is overridden', () => {
        const { dataService, testScheduler } = effectsSetup();
        const message = 'productsError';

        spyOn(dataService, 'get').and.returnValue(throwError({ message }));

        class ProductsStore extends BaseProductsStore {
          constructor() {
            super({ initialState, dataService });
          }

          protected overrideDataEffects(builder: DataEffectsBuilder<Product, number>): void {
            builder.loadError<{ message: string }>(({ message }) => {
              this.patchState({ filter: message });
            });
          }
        }
        const store = new ProductsStore();

        testScheduler.run(({ expectObservable }) => {
          testScheduler.schedule(() => store.load(), 2);
          expectObservable(store.filter$).toBe('x-y', { x: initialState.filter, y: message });
        });
      });

      it('should invoke custom error effect when error effect is overridden', () => {
        const { dataService, testScheduler } = effectsSetup();
        const errorMessage = 'error';

        spyOn(dataService, 'get').and.returnValue(throwError(errorMessage));

        class ProductsStore extends BaseProductsStore {
          constructor() {
            super({ initialState, dataService });
          }

          protected overrideDataEffects(builder: DataEffectsBuilder<Product, number>): void {
            builder.error<string>((message) => {
              this.patchState({ filter: message });
            });
          }
        }
        const store = new ProductsStore();

        testScheduler.run(({ expectObservable }) => {
          testScheduler.schedule(() => store.load(), 3);
          expectObservable(store.filter$).toBe('x--y', { x: initialState.filter, y: errorMessage });
        });
      });

      it('should invoke custom load error effect when error and load error effects are overridden', () => {
        const { dataService, testScheduler } = effectsSetup();
        const loadErrorMessage = 'loadErrorMessage';
        const errorMessage = 'errorMessage';

        spyOn(dataService, 'get').and.returnValue(throwError('error'));

        class ProductsStore extends BaseProductsStore {
          constructor() {
            super({ initialState, dataService });
          }

          protected overrideDataEffects(builder: DataEffectsBuilder<Product, number>): void {
            builder.loadError(() => {
              this.patchState({ filter: loadErrorMessage });
            });

            builder.error(() => {
              this.patchState({ filter: errorMessage });
            });
          }
        }
        const store = new ProductsStore();

        testScheduler.run(({ expectObservable }) => {
          testScheduler.schedule(() => store.load(), 2);

          expectObservable(store.filter$).toBe('x-y', {
            x: initialState.filter,
            y: loadErrorMessage,
          });
        });
      });
    });

    describe('loadById', () => {
      it('should invoke get by id from data service', () => {
        const { store, dataService } = effectsSetup();

        spyOn(dataService, 'getById').and.returnValue(of(p1));

        store.loadById(p1.id);
        expect(dataService.getById).toHaveBeenCalledWith(p1.id);
      });

      it('should invoke custom load by id start effect when load by id start effect is overridden', () => {
        const { dataService, testScheduler } = effectsSetup();

        spyOn(dataService, 'getById').and.returnValue(of(p1));

        class ProductsStore extends BaseProductsStore {
          constructor() {
            super({ initialState, dataService });
          }

          protected overrideDataEffects(builder: DataEffectsBuilder<Product, number>): void {
            builder.loadByIdStart((id) => {
              this.patchState({ filter: `${id}` });
            });
          }
        }
        const store = new ProductsStore();

        testScheduler.run(({ expectObservable }) => {
          testScheduler.schedule(() => store.loadById(p1.id), 1);
          expectObservable(store.filter$).toBe('xy', { x: initialState.filter, y: `${p1.id}` });
        });
      });

      it('should invoke default load by id success effect when load by id success effect is not overridden', () => {
        const { testScheduler, store, dataService } = effectsSetup();

        spyOn(dataService, 'getById').and.returnValue(of(p1).pipe(delay(2)));

        testScheduler.run(({ expectObservable }) => {
          testScheduler.schedule(() => store.loadById(1), 1);

          expectObservable(store.ids$).toBe('x--y', { x: [], y: [p1.id] });
          expectObservable(store.entities$).toBe('x--y', {
            x: {},
            y: { [p1.id]: p1 },
          });
        });
      });

      it('should invoke custom load by id success effect when load by id success effect is overridden', () => {
        const { dataService, testScheduler } = effectsSetup();

        spyOn(dataService, 'getById').and.returnValue(of(p1).pipe(delay(3)));

        class ProductsStore extends BaseProductsStore {
          constructor() {
            super({ initialState, dataService });
          }

          protected overrideDataEffects(builder: DataEffectsBuilder<Product, number>): void {
            builder.loadByIdSuccess(() => {
              this.addOne(p2);
            });
          }
        }
        const store = new ProductsStore();

        testScheduler.run(({ expectObservable }) => {
          testScheduler.schedule(() => store.loadById(1), 1);

          expectObservable(store.ids$).toBe('x---y', { x: [], y: [p2.id] });
          expectObservable(store.entities$).toBe('x---y', {
            x: {},
            y: { [p2.id]: p2 },
          });
        });
      });

      it('should invoke custom load by id error effect when load by id error effect is overridden', () => {
        const { dataService, testScheduler } = effectsSetup();
        const message = 'loadByIdError';

        spyOn(dataService, 'getById').and.returnValue(throwError({ message }));

        class ProductsStore extends BaseProductsStore {
          constructor() {
            super({ initialState, dataService });
          }

          protected overrideDataEffects(builder: DataEffectsBuilder<Product, number>): void {
            builder.loadByIdError<{ message: string }>(({ message }) => {
              this.patchState({ filter: message });
            });
          }
        }
        const store = new ProductsStore();

        testScheduler.run(({ expectObservable }) => {
          testScheduler.schedule(() => store.loadById(1), 3);
          expectObservable(store.filter$).toBe('x--y', { x: initialState.filter, y: message });
        });
      });

      it('should invoke custom error effect when error effect is overridden', () => {
        const { dataService, testScheduler } = effectsSetup();
        const errorMessage = 'error';

        spyOn(dataService, 'getById').and.returnValue(throwError({ errorMessage }));

        class ProductsStore extends BaseProductsStore {
          constructor() {
            super({ initialState, dataService });
          }

          protected overrideDataEffects(builder: DataEffectsBuilder<Product, number>): void {
            builder.error<{ errorMessage: string }>(({ errorMessage }) => {
              this.patchState({ filter: errorMessage });
            });
          }
        }
        const store = new ProductsStore();

        testScheduler.run(({ expectObservable }) => {
          testScheduler.schedule(() => store.loadById(1), 3);
          expectObservable(store.filter$).toBe('x--y', { x: initialState.filter, y: errorMessage });
        });
      });

      it('should invoke custom load by id error effect when error and load by id error effects are overridden', () => {
        const { dataService, testScheduler } = effectsSetup();
        const loadByIdError = 'loadByIdError';
        const commonError = 'commonError';

        spyOn(dataService, 'getById').and.returnValue(throwError('error'));

        class ProductsStore extends BaseProductsStore {
          constructor() {
            super({ initialState, dataService });
          }

          protected overrideDataEffects(builder: DataEffectsBuilder<Product, number>): void {
            builder.loadByIdError(() => {
              this.patchState({ filter: loadByIdError });
            });

            builder.error(() => {
              this.patchState({ filter: commonError });
            });
          }
        }
        const store = new ProductsStore();

        testScheduler.run(({ expectObservable }) => {
          testScheduler.schedule(() => store.loadById(1), 3);

          expectObservable(store.filter$).toBe('x--y', {
            x: initialState.filter,
            y: loadByIdError,
          });
        });
      });
    });

    describe('create', () => {
      it('should invoke create from data service', () => {
        const { store, dataService } = effectsSetup();

        spyOn(dataService, 'create').and.returnValue(of(p1));

        store.create(p1);
        expect(dataService.create).toHaveBeenCalledWith(p1);
      });

      it('should invoke custom create start effect when create start effect is overridden', () => {
        const { dataService, testScheduler } = effectsSetup();

        spyOn(dataService, 'create').and.returnValue(of(p1));

        class ProductsStore extends BaseProductsStore {
          constructor() {
            super({ initialState, dataService });
          }

          protected overrideDataEffects(builder: DataEffectsBuilder<Product, number>): void {
            builder.createStart((product) => {
              this.patchState({ filter: product.name });
            });
          }
        }
        const store = new ProductsStore();

        testScheduler.run(({ expectObservable }) => {
          testScheduler.schedule(() => store.create(p1), 2);
          expectObservable(store.filter$).toBe('x-y', { x: initialState.filter, y: p1.name });
        });
      });

      it('should invoke default create success effect when create success effect is not overridden', () => {
        const { testScheduler, store, dataService } = effectsSetup();

        spyOn(dataService, 'create').and.returnValue(of(p1).pipe(delay(3)));

        testScheduler.run(({ expectObservable }) => {
          testScheduler.schedule(() => store.create(p1), 1);

          expectObservable(store.ids$).toBe('x---y', { x: [], y: [p1.id] });
          expectObservable(store.entities$).toBe('x---y', {
            x: {},
            y: { [p1.id]: p1 },
          });
        });
      });

      it('should invoke custom create success effect when create success effect is overridden', () => {
        const { dataService, testScheduler } = effectsSetup();

        spyOn(dataService, 'create').and.returnValue(of(p1).pipe(delay(1)));

        class ProductsStore extends BaseProductsStore {
          constructor() {
            super({ initialState, dataService });
          }

          protected overrideDataEffects(builder: DataEffectsBuilder<Product, number>): void {
            builder.createSuccess(() => {
              this.addOne(p2);
            });
          }
        }
        const store = new ProductsStore();

        testScheduler.run(({ expectObservable }) => {
          testScheduler.schedule(() => store.create(p1), 2);

          expectObservable(store.ids$).toBe('x--y', { x: [], y: [p2.id] });
          expectObservable(store.entities$).toBe('x--y', {
            x: {},
            y: { [p2.id]: p2 },
          });
        });
      });

      it('should invoke custom create error effect when create error effect is overridden', () => {
        const { dataService, testScheduler } = effectsSetup();
        const createError = 'createError';

        spyOn(dataService, 'create').and.returnValue(throwError({ createError }));

        class ProductsStore extends BaseProductsStore {
          constructor() {
            super({ initialState, dataService });
          }

          protected overrideDataEffects(builder: DataEffectsBuilder<Product, number>): void {
            builder.createError<{ createError: string }>(({ createError }) => {
              this.patchState({ filter: createError });
            });
          }
        }
        const store = new ProductsStore();

        testScheduler.run(({ expectObservable }) => {
          testScheduler.schedule(() => store.create(p1), 2);
          expectObservable(store.filter$).toBe('x-y', { x: initialState.filter, y: createError });
        });
      });

      it('should invoke custom error effect when error effect is overridden', () => {
        const { dataService, testScheduler } = effectsSetup();
        const error = 'error';

        spyOn(dataService, 'create').and.returnValue(throwError({ error }));

        class ProductsStore extends BaseProductsStore {
          constructor() {
            super({ initialState, dataService });
          }

          protected overrideDataEffects(builder: DataEffectsBuilder<Product, number>): void {
            builder.error<{ error: string }>(({ error }) => {
              this.patchState({ filter: error });
            });
          }
        }
        const store = new ProductsStore();

        testScheduler.run(({ expectObservable }) => {
          testScheduler.schedule(() => store.create(p1), 2);
          expectObservable(store.filter$).toBe('x-y', { x: initialState.filter, y: error });
        });
      });

      it('should invoke custom create error effect when error and create error effects are overridden', () => {
        const { dataService, testScheduler } = effectsSetup();
        const createError = 'createError';
        const commonError = 'commonError';

        spyOn(dataService, 'create').and.returnValue(throwError('error'));

        class ProductsStore extends BaseProductsStore {
          constructor() {
            super({ initialState, dataService });
          }

          protected overrideDataEffects(builder: DataEffectsBuilder<Product, number>): void {
            builder.createError(() => {
              this.patchState({ filter: createError });
            });

            builder.error(() => {
              this.patchState({ filter: commonError });
            });
          }
        }
        const store = new ProductsStore();

        testScheduler.run(({ expectObservable }) => {
          testScheduler.schedule(() => store.create(p1), 4);

          expectObservable(store.filter$).toBe('x---y', {
            x: initialState.filter,
            y: createError,
          });
        });
      });
    });

    describe('update', () => {
      it('should invoke update from data service', () => {
        const { store, dataService } = effectsSetup();

        spyOn(dataService, 'update').and.returnValue(of(p2));

        store.update({ id: p2.id, changes: p2 });
        expect(dataService.update).toHaveBeenCalledWith(p2.id, p2);
      });

      it('should invoke custom update start effect when update start effect is overridden', () => {
        const { dataService, testScheduler } = effectsSetup();

        spyOn(dataService, 'update').and.returnValue(of(p2));

        class ProductsStore extends BaseProductsStore {
          constructor() {
            super({ initialState, dataService });
          }

          protected overrideDataEffects(builder: DataEffectsBuilder<Product, number>): void {
            builder.updateStart((product) => {
              this.patchState({ filter: `${product.id}` });
            });
          }
        }
        const store = new ProductsStore();

        testScheduler.run(({ expectObservable }) => {
          testScheduler.schedule(() => store.update({ id: p2.id, changes: p2 }), 3);
          expectObservable(store.filter$).toBe('x--y', { x: initialState.filter, y: `${p2.id}` });
        });
      });

      it('should invoke default update success effect when update success effect is not overridden', () => {
        const { testScheduler, store, dataService } = effectsSetup();
        const name = 'P2 updated';

        spyOn(dataService, 'update').and.returnValue(of({ ...p2, name }).pipe(delay(2)));

        testScheduler.run(({ expectObservable }) => {
          store.addOne(p2);
          testScheduler.schedule(() => store.update({ id: p2.id, changes: { name } }), 2);

          expectObservable(store.ids$).toBe('x', { x: [p2.id] });
          expectObservable(store.entities$).toBe('x---y', {
            x: { [p2.id]: p2 },
            y: { [p2.id]: { ...p2, name } },
          });
        });
      });

      it('should invoke custom update success effect when update success effect is overridden', () => {
        const { dataService, testScheduler } = effectsSetup();

        spyOn(dataService, 'update').and.returnValue(of(p2).pipe(delay(2)));

        class ProductsStore extends BaseProductsStore {
          constructor() {
            super({ initialState, dataService });
          }

          protected overrideDataEffects(builder: DataEffectsBuilder<Product, number>): void {
            builder.updateSuccess((product) => {
              this.upsertOne(product, { filter: product.name });
            });
          }
        }
        const store = new ProductsStore();

        testScheduler.run(({ expectObservable }) => {
          testScheduler.schedule(() => store.update({ id: p2.id, changes: p2 }), 2);

          expectObservable(store.ids$).toBe('x---y', { x: [], y: [p2.id] });
          expectObservable(store.entities$).toBe('x---y', {
            x: {},
            y: { [p2.id]: p2 },
          });
          expectObservable(store.filter$).toBe('x---y', { x: initialState.filter, y: p2.name });
        });
      });

      it('should invoke custom update error effect when update error effect is overridden', () => {
        const { dataService, testScheduler } = effectsSetup();
        const message = 'updateError';

        spyOn(dataService, 'update').and.returnValue(throwError({ message }));

        class ProductsStore extends BaseProductsStore {
          constructor() {
            super({ initialState, dataService });
          }

          protected overrideDataEffects(builder: DataEffectsBuilder<Product, number>): void {
            builder.updateError<{ message: string }>(({ message }) => {
              this.patchState({ filter: message });
            });
          }
        }
        const store = new ProductsStore();

        testScheduler.run(({ expectObservable }) => {
          testScheduler.schedule(() => store.update({ id: p2.id, changes: p2 }), 3);
          expectObservable(store.filter$).toBe('x--y', { x: initialState.filter, y: message });
        });
      });

      it('should invoke custom error effect when error effect is overridden', () => {
        const { dataService, testScheduler } = effectsSetup();
        const error = 'commonError';

        spyOn(dataService, 'update').and.returnValue(throwError({ error }));

        class ProductsStore extends BaseProductsStore {
          constructor() {
            super({ initialState, dataService });
          }

          protected overrideDataEffects(builder: DataEffectsBuilder<Product, number>): void {
            builder.error<{ error: string }>(({ error }) => {
              this.patchState({ filter: error });
            });
          }
        }
        const store = new ProductsStore();

        testScheduler.run(({ expectObservable }) => {
          testScheduler.schedule(() => store.update({ id: p2.id, changes: p2 }), 4);
          expectObservable(store.filter$).toBe('x---y', { x: initialState.filter, y: error });
        });
      });

      it('should invoke custom update error effect when error and update error effects are overridden', () => {
        const { dataService, testScheduler } = effectsSetup();
        const updateError = 'updateError';
        const commonError = 'commonError';

        spyOn(dataService, 'update').and.returnValue(throwError('error'));

        class ProductsStore extends BaseProductsStore {
          constructor() {
            super({ initialState, dataService });
          }

          protected overrideDataEffects(builder: DataEffectsBuilder<Product, number>): void {
            builder.updateError(() => {
              this.patchState({ filter: updateError });
            });

            builder.error(() => {
              this.patchState({ filter: commonError });
            });
          }
        }
        const store = new ProductsStore();

        testScheduler.run(({ expectObservable }) => {
          testScheduler.schedule(() => store.update({ id: p2.id, changes: p2 }), 2);

          expectObservable(store.filter$).toBe('x-y', {
            x: initialState.filter,
            y: updateError,
          });
        });
      });
    });

    describe('delete', () => {
      it('should invoke delete from data service', () => {
        const { store, dataService } = effectsSetup();

        spyOn(dataService, 'delete').and.returnValue(of(p3.id));

        store.delete(p3.id);
        expect(dataService.delete).toHaveBeenCalledWith(p3.id);
      });

      it('should invoke custom delete start effect when delete start effect is overridden', () => {
        const { dataService, testScheduler } = effectsSetup();

        spyOn(dataService, 'delete').and.returnValue(of(p3.id).pipe(delay(2)));

        class ProductsStore extends BaseProductsStore {
          constructor() {
            super({ initialState, dataService });
          }

          protected overrideDataEffects(builder: DataEffectsBuilder<Product, number>): void {
            builder.deleteStart((id) => {
              this.patchState({ filter: `${id}` });
            });
          }
        }
        const store = new ProductsStore();

        testScheduler.run(({ expectObservable }) => {
          testScheduler.schedule(() => store.delete(p3.id), 2);
          expectObservable(store.filter$).toBe('x-y', { x: initialState.filter, y: `${p3.id}` });
        });
      });

      it('should invoke default delete success effect when delete success effect is not overridden', () => {
        const { testScheduler, store, dataService } = effectsSetup();

        spyOn(dataService, 'delete').and.returnValue(of(p3).pipe(delay(1)));

        testScheduler.run(({ expectObservable }) => {
          store.addOne(p3);
          testScheduler.schedule(() => store.delete(p3.id), 2);

          expectObservable(store.ids$).toBe('x--y', { x: [p3.id], y: [] });
          expectObservable(store.entities$).toBe('x--y', {
            x: { [p3.id]: p3 },
            y: {},
          });
        });
      });

      it('should invoke custom delete success effect when delete success effect is overridden', () => {
        const { dataService, testScheduler } = effectsSetup();

        spyOn(dataService, 'delete').and.returnValue(of(p3).pipe(delay(2)));

        class ProductsStore extends BaseProductsStore {
          constructor() {
            super({ initialState, dataService });
          }

          protected overrideDataEffects(builder: DataEffectsBuilder<Product, number>): void {
            builder.deleteSuccess<Product>((product) => {
              this.removeOne(product.id, { filter: product.name });
            });
          }
        }
        const store = new ProductsStore();

        testScheduler.run(({ expectObservable }) => {
          store.addOne(p3);
          testScheduler.schedule(() => store.delete(p3.id), 1);

          expectObservable(store.ids$).toBe('x--y', { x: [p3.id], y: [] });
          expectObservable(store.entities$).toBe('x--y', {
            x: { [p3.id]: p3 },
            y: {},
          });
          expectObservable(store.filter$).toBe('x--y', { x: initialState.filter, y: p3.name });
        });
      });

      it('should invoke custom delete error effect when delete error effect is overridden', () => {
        const { dataService, testScheduler } = effectsSetup();
        const deleteError = 'deleteError';

        spyOn(dataService, 'delete').and.returnValue(throwError({ deleteError }));

        class ProductsStore extends BaseProductsStore {
          constructor() {
            super({ initialState, dataService });
          }

          protected overrideDataEffects(builder: DataEffectsBuilder<Product, number>): void {
            builder.deleteError<{ deleteError: string }>(({ deleteError }) => {
              this.patchState({ filter: deleteError });
            });
          }
        }
        const store = new ProductsStore();

        testScheduler.run(({ expectObservable }) => {
          testScheduler.schedule(() => store.delete(p3.id), 2);
          expectObservable(store.filter$).toBe('x-y', { x: initialState.filter, y: deleteError });
        });
      });

      it('should invoke custom error effect when error effect is overridden', () => {
        const { dataService, testScheduler } = effectsSetup();
        const message = 'commonError';

        spyOn(dataService, 'delete').and.returnValue(throwError({ message }));

        class ProductsStore extends BaseProductsStore {
          constructor() {
            super({ initialState, dataService });
          }

          protected overrideDataEffects(builder: DataEffectsBuilder<Product, number>): void {
            builder.error<{ message: string }>(({ message }) => {
              this.patchState({ filter: message });
            });
          }
        }
        const store = new ProductsStore();

        testScheduler.run(({ expectObservable }) => {
          testScheduler.schedule(() => store.delete(p3.id), 3);
          expectObservable(store.filter$).toBe('x--y', { x: initialState.filter, y: message });
        });
      });

      it('should invoke custom delete error effect when error and delete error effects are overridden', () => {
        const { dataService, testScheduler } = effectsSetup();
        const deleteError = 'deleteError';
        const commonError = 'commonError';

        spyOn(dataService, 'delete').and.returnValue(throwError('error'));

        class ProductsStore extends BaseProductsStore {
          constructor() {
            super({ initialState, dataService });
          }

          protected overrideDataEffects(builder: DataEffectsBuilder<Product, number>): void {
            builder.deleteError(() => {
              this.patchState({ filter: deleteError });
            });

            builder.error(() => {
              this.patchState({ filter: commonError });
            });
          }
        }
        const store = new ProductsStore();

        testScheduler.run(({ expectObservable }) => {
          testScheduler.schedule(() => store.delete(p3.id), 4);

          expectObservable(store.filter$).toBe('x---y', {
            x: initialState.filter,
            y: deleteError,
          });
        });
      });
    });
  });
});

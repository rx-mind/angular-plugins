# @rx-mind/data-component-store

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/rx-mind/angular-plugins/blob/master/LICENSE)
[![NPM](https://img.shields.io/npm/v/@rx-mind/data-component-store)](https://www.npmjs.com/package/@rx-mind/data-component-store)
[![CI Status](https://github.com/rx-mind/angular-plugins/actions/workflows/ci.yml/badge.svg)](https://github.com/rx-mind/angular-plugins/actions/workflows/ci.yml)

**[Component Store](https://ngrx.io/guide/component-store) with [Entity](https://ngrx.io/guide/entity) Selectors, Updaters, and Effects**

## Contents

- [Overview](#overview)
- [Walkthrough](#walkthrough)
- [Demo](#demo)
- [Installation](#installation)
- [Data State](#data-state)
- [Initialization](#initialization)
- [Data Service](#data-service)
  - [Default Data Service](#default-data-service)
  - [Custom Data Service](#custom-data-service)
- [Selectors](#selectors)
- [Updaters](#updaters)
- [Effects](#effects)
  - [`load`](#load)
  - [`loadById`](#loadbyid)
  - [`create`](#create)
  - [`update`](#update)
  - [`delete`](#delete)
  - [`overrideDataEffects`](#overridedataeffects)
- [Examples](#examples)
- [TODO List](#todo-list)

## Overview

`DataComponentStore` provides a simple way to handle common CRUD use cases.
It's inspired by `@ngrx/component-store` reactivity, `@ngrx/data` simplicity, and `rtk-query` flexibility.

### Key Concepts

- **Extendable State.**
  In addition to default state properties (`entities`, `ids`, and pending request statuses), the state of
  `DataComponentStore` may contain additional properties.

- **Customizable Effects.**
  `DataComponentStore` provides `load`, `loadById`, `create`, `update`, and `delete` effects.
  The default behavior of all data effects can be completely or partially changed.

- **Built-In Entity Updaters and Selectors.**
  `DataComponentStore` extends [`EntityComponentStore`](https://github.com/rx-mind/angular-plugins/tree/master/libs/entity-component-store#readme)
  and contains all of its selectors and updaters.

- **Fully Reactive.**
  `DataComponentStore` provides the reactive power of [`ComponentStore`](https://ngrx.io/guide/component-store).

- **Parallel Requests.**
  `DataComponentStore` supports parallel `loadById`, `create`, `update`, and `delete` requests.
  Each type of request has its own pending status as part of the state.

## Walkthrough

### Defining State

Define the state type by extending `DataState` interface:

```ts
import { DataState } from '@rx-mind/data-component-store';

interface ProductsState extends DataState<Product, number> {
  query: string;
}
```

Create the initial state by using `getInitialDataState` function that accepts the initial state of additional
state properties as an input argument:

```ts
import { getInitialDataState } from '@rx-mind/data-component-store';

const initialState = getInitialDataState<ProductsState>({ query: '' });
```

### Defining Base Url

Define the base url:

```ts
const baseUrl = '/products';
```

### Creating Store

Create a store by extending `DataComponentStore` and pass `baseUrl` and `initialState` to the parent constructor:

```ts
import { DataComponentStore } from '@rx-mind/data-component-store';

@Injectable()
export class ProductsStore extends DataComponentStore<ProductsState> {
  constructor() {
    super({ baseUrl, initialState });
  }
}
```

### Creating View Model

Create a view model selector by combining other selectors:

```ts
@Injectable()
export class ProductsStore extends DataComponentStore<ProductsState> {
  private readonly query$ = this.select((s) => s.query);

  readonly vm$ = this.select(
    this.all$,
    this.total$,
    this.isLoadPending$,
    this.query$,
    (products, totalProducts, isLoading, query) => ({
      products,
      totalProducts,
      isLoading,
      query,
    })
  );
}
```

### Creating Container Component

Provide `ProductsStore` via `providers` array, inject it through the constructor and use the view model selector
in the template. Then define `onSearch` method that will patch the state with the new query value.

```ts
@Component({
  selector: 'rx-mind-products',
  template: `
    <ng-container *ngIf="vm$ | async as vm">
      <h2>Products ({{ vm.totalProducts }})</h2>

      <app-search [query]="vm.query" (search)="onSearch($event)"></app-search>

      <app-loading-spinner *ngIf="vm.isLoading"></app-loading-spinner>

      <ul>
        <li *ngFor="let product of vm.products">{{ product.name }}</li>
      </ul>
    </ng-container>
  `,
  providers: [ProductsStore],
})
export class ProductsComponent {
  readonly vm$ = this.productsStore.vm$;

  constructor(private readonly productsStore: ProductsStore) {}

  onSearch(query: string): void {
    this.productsStore.patchState({ query });
  }
}
```

### Loading Data from Server

Create `loadParams$` selector that contains the query parameters of the product load request.
Then call `load` effect in the constructor with `loadParams$` as the input argument.

```ts
@Injectable()
export class ProductsStore extends DataComponentStore<ProductsState> {
  private readonly query$ = this.select((s) => s.query);
  private readonly loadParams$ = this.select(this.query$, (query) => ({ query }));

  constructor() {
    super({ baseUrl, initialState });
    this.load(this.loadParams$);
  }
}
```

By passing `loadParams$` Observable to the `load` effect, products will be re-fetched each time the query is changed.
Initially, products will be fetched with an initial query value (empty string).
Target URL will be `/products?query=${value}`, where `value` is the current query value.

### Customizing Data Effects

Clear the product collection and display an error message each time the load request fails:

```ts
import { HttpErrorResponse } from '@angular/common/http';

@Injectable()
export class ProductsStore extends DataComponentStore<ProductsState> {
  protected overrideDataEffects(builder: DataEffectsBuilder<Product, number>): void {
    builder.loadError<HttpErrorResponse>((error) => {
      this.removeAll();
      this.alertService.error(error.message);
    });
  }
}
```

## Demo

See `DataComponentStore` in action on [StackBlitz](https://stackblitz.com/edit/data-component-store-demo?file=src/app/books/books.component.ts).
More examples are available [here](#examples).

## Installation

- NPM: `npm i @rx-mind/data-component-store`
- Yarn: `yarn add @rx-mind/data-component-store`

> **Note:** `@rx-mind/data-component-store` has `@rx-mind/entity-component-store` and `@ngrx/component-store`
> as peer dependencies.

## Data State

The state of `DataComponentStore` is defined by extending `DataState` interface:

```ts
import { DataState } from '@rx-mind/data-component-store';

interface MoviesState extends DataState<Movie, string> {
  selectedId: string | null;
  query: string;
}
```

`DataState` interface contains following properties: `ids`, `entities`, `isLoadPending`, `isLoadByIdPending`, `isCreatePending`,
`isUpdatePending`, and `isDeletePending`.
It extends [`EntityState`](https://github.com/rx-mind/angular-plugins/tree/master/libs/entity-component-store#entity-state)
and accepts entity type as the first and id type as the second generic argument. The second argument is optional
and if not provided, the id type will be `string | number`.

To create the initial state, there is `getInitialDataState` function. It accepts the initial values
of additional state properties as the input argument.

```ts
import { getInitialDataState } from '@rx-mind/data-component-store';

const initialState = getInitialDataState<MoviesState>({
  selectedId: null,
  query: '',
});
```

If the state doesn't contain additional properties, then the input argument should not be passed to `getInitialDataState`:

```ts
import { DataState, getInitialDataState } from '@rx-mind/data-component-store';

type MoviesState = DataState<Movie, string>;

const initialState = getInitialDataState<MoviesState>();
```

## Initialization

The constructor of `DataComponentStore` accepts a configuration object that contains one required and three optional
properties. Optional properties are `initialState`, `selectId` and `sortComparer` similar to the
[`EntityComponentStore` configuration](https://github.com/rx-mind/angular-plugins/tree/master/libs/entity-component-store#initialization).
Required configuration property is `baseUrl` or `dataService`.

```ts
import { DataComponentStore } from '@rx-mind/data-component-store';

@Injectable()
export class MoviesStore extends DataComponentStore<MoviesState> {
  constructor() {
    super({ initialState, selectId, sortComparer, baseUrl: '/movies' });
  }
}
```

When `baseUrl` is passed, `DataComponentStore` will use [`DefaultDataService`](#default-data-service) as the data resource.
If the resource is not in accordance with REST principles, or does not use HTTP at all,
then [a custom data service](#custom-data-service) should be provided:

```ts
import { DataComponentStore } from '@rx-mind/data-component-store';

@Injectable()
export class MoviesStore extends DataComponentStore<MoviesState> {
  constructor(moviesService: MoviesService) {
    super({ initialState, dataService: moviesService });
  }
}
```

Similar to `ComponentStore`, the state of `DataComponentStore` can be initialized lazily by calling `setState` method:

```ts
@Injectable()
export class MoviesStore extends DataComponentStore<MoviesState> {
  constructor() {
    super({ baseUrl: '/movies' });
  }
}

@Component({
  selector: 'rx-mind-movies',
  templateUrl: './movies.component.html',
  viewProviders: [MoviesStore],
})
export class MoviesComponent implements OnInit {
  constructor(private readonly moviesStore: MoviesStore) {}

  ngOnInit(): void {
    this.moviesStore.setState(initialState);
  }
}
```

Also, there is an option to provide the `DataComponentStore` configuration via `DATA_COMPONENT_STORE_CONFIG` injection token:

```ts
import {
  DataComponentStore,
  DATA_COMPONENT_STORE_CONFIG,
  DataState,
  getInitialDataState,
} from '@rx-mind/data-component-store';

type MoviesState = DataState<Movies, string>;

const initialState = getInitialDataState<MoviesState>();
const baseUrl = '/movies';

@Component({
  selector: 'rx-mind-movies',
  templateUrl: './movies.component.html',
  viewProviders: [
    { provide: DATA_COMPONENT_STORE_CONFIG, useValue: { initialState, baseUrl } },
    DataComponentStore,
  ],
})
export class MoviesComponent {
  constructor(private readonly moviesStore: DataComponentStore<MoviesState>) {}
}
```

## Data Service

`DataService` is an interface that contains common CRUD methods: `get`, `getById`, `create`, `update`, and `delete`.

- `get(params?: QueryParams): Observable<Entity[] | Record<string, any>>` - Accepts query parameters as
  an optional input argument. It can return an array of entities, but also a dictionary that contains entities
  and additional properties. This is useful f.e. for server pagination when the total count is returned along
  with an array of entities.
- `getById(id: Id): Observable<Entity>` - Returns the entity by passed id.
- `create(entity: Partial<Entity>): Observable<Entity>` - Returns created entity.
  The partial entity should be passed as an input argument when the entity id is generated on the server.
  Otherwise, the complete entity should be passed.
- `update(entityUpdate: Update<Entity, Id>): Observable<Entity>` - Accepts an object of type `Update<Entity, Id>` as
  the input argument and returns updated entity. `Update<Entity, Id>` contains two properties: id and entity changes.
- `delete(id: Id): Observable<Entity | Id | null>` - Accepts the entity id as the input argument.
  It can return deleted entity, its id or empty response.

### Default Data Service

When `baseUrl` is passed as a part of `DataComponentStore` configuration, then `DefaultDataService` will be used
as the data resource. `DefaultDataService` implements `DataService` interface according to the REST principles.

### Custom Data Service

If the resource is not in accordance with REST principles, or does not use HTTP at all, then a custom data service should be provided.

There are two ways to create the custom data service. The first is to extend `DefaultDataService` and override methods
that need to be changed:

```ts
import { DefaultDataService } from '@rx-mind/data-component-store';

@Injectable({
  providedIn: 'root',
})
export class MoviesService extends DefaultDataService<Movie, string> {
  constructor() {
    super('/movies');
  }

  get(params?: QueryParams): Observable<{ movies: Movie[]; totalCount: number }> {
    return this.http
      .get<Movie[]>(this.baseUrl, { params, observe: 'response' })
      .pipe(
        map(({ body, headers }) => ({
          movies: body as Movie[],
          totalCount: Number(headers.get('x-total-count')),
        }))
      );
  }
}
```

Another way is to implement `DataService` interface:

```ts
import { DataService } from '@rx-mind/data-component-store';

@Injectable({
  providedIn: 'root',
})
export class MoviesService implements DataService<Movie, string> {
  constructor(private readonly http: HttpClient) {}

  get(params?: QueryParams): Observable<Movie[]> {
    return this.http
      .get<{ items: Movie[] }>(`/movies`, { params })
      .pipe(map(({ items }) => items));
  }

  getById(id: string): Observable<Movie> {
    return this.http.get<Movie>(`/movies/${id}`);
  }

  create(movie: Movie): Observable<Movie> {
    return this.http.post<null>('/movies', movie).pipe(mapTo(movie));
  }

  update({ id, changes }: Update<Movie, string>): Observable<Movie> {
    return this.http.patch<null>(`/movies/${id}`, changes).pipe(mapTo({ id, ...changes } as Movie));
  }

  delete(id: string): Observable<string> {
    return this.http.delete<null>(`/movies/${id}`).pipe(mapTo(id));
  }
}
```

Then instead of `baseUrl`, pass `dataService` as a part of the `DataComponentStore` configuration:

```ts
@Injectable()
export class MoviesStore extends DataComponentStore<MoviesState> {
  constructor(moviesService: MoviesService) {
    super({ initialState, dataService: moviesService });
  }
}
```

## Selectors

`DataComponentStore` contains entity selectors: `ids$`, `entities$`, `all$`, and `total$`.
Read more about entity selectors [here](https://github.com/rx-mind/angular-plugins/tree/master/libs/entity-component-store#selectors).

Also, it contains the following selectors:

- `isLoadPending$` - Indicates whether a load request is in progress.
- `isLoadByIdPending$` - Indicates whether any load by id request is in progress.
- `isCreatePending$` - Indicates whether any create request is in progress.
- `isUpdatePending$` - Indicates whether any update request is in progress.
- `isDeletePending$` - Indicates whether any delete request is in progress.
- `isPending$` - Indicates whether any entity request is in progress.

Usage:

```ts
import { DataComponentStore, DataState, getInitialDataState } from '@rx-mind/data-component-store';

interface MoviesState extends DataState<Movie, string> {
  query: string;
}

const initialState = getInitialDataState<MoviesState>({ query: '' });

@Injectable()
export class MoviesStore extends DataComponentStore<MoviesState> {
  private readonly query$ = this.select((s) => s.query);

  readonly vm$ = this.select(
    this.all$,
    this.total$,
    this.query$,
    this.isLoadPending$,
    (movies, total, query, isLoading) => ({ movies, total, query, isLoading })
  );

  constructor(moviesService: MoviesService) {
    super({ initialState, dataService: moviesService });
  }
}
```

## Updaters

`DataComponentStore` contains entity updaters: `addOne`, `addMany`, `setOne`, `setMany`, `setAll`,
`removeOne`, `removeMany`, `removeAll`, `updateOne`, `updateMany`, `upsertOne`, `upsertMany`, `mapOne`, and `map`.
Read more about entity updaters [here](https://github.com/rx-mind/angular-plugins/tree/master/libs/entity-component-store#updaters).

## Effects

`DataComponentStore` contains `load`, `loadById`, `create`, `update`, and `delete` methods.
All of these methods are `ComponentStore` effects, and can accept plain value or Observable as the input argument.

### `load`

`load` effect is used to load entities from a data resource. It accepts a query parameters dictionary as
an optional input argument.

```ts
@Component({
  selector: 'rx-mind-movies',
  templateUrl: './movies.component.html',
  viewProviders: [MoviesStore],
})
export class MoviesComponent {
  readonly movies$ = this.moviesStore.all$;

  constructor(private readonly moviesStore: MoviesStore) {}

  onLoad(): void {
    // without query parameters
    this.moviesStore.load();
  }

  onLoadByQuery(): void {
    // with query parameters
    this.moviesStore.load({ query: 'movie' });
  }
}
```

By passing an Observable, the entities will be reloaded each time it emits a new value:

```ts
@Injectable()
export class MoviesStore extends DataComponentStore<MoviesState> {
  private readonly query$ = this.select((s) => s.query);
  private readonly loadParams$ = this.select(this.query$, (query) => ({ query }));

  constructor() {
    super({ baseUrl, initialState });

    // with query parameters as Observable
    this.load(this.loadParams$);
  }
}

@Component({
  selector: 'rx-mind-movies',
  templateUrl: './movies.component.html',
  viewProviders: [MoviesStore],
})
export class MoviesComponent {
  readonly movies$ = this.moviesStore.all$;
  readonly isLoading$ = this.moviesStore.isLoadPending$;

  constructor(private readonly moviesStore: MoviesStore) {}

  onSearch(query: string): void {
    this.moviesStore.patchState({ query });
  }
}
```

`load` effect calls `get` method from [data service](#data-service) under the hood and passes provided query parameters.
When called, it will set `isLoadPending` to `true`, and move it back to `false` when the request is complete.
If `load` is called when another load request is in progress, it will cancel the previous one and send a new request.

By default, `load` effect expects an array of entities to be returned from the data service and replaces current collection
with a new one by using [`setAll` entity updater](https://github.com/rx-mind/angular-plugins/tree/master/libs/entity-component-store#updaters).
However, the default behavior `load` effect can be changed. Read more [here](#changing-default-behavior).

### `loadById`

`loadById` effect is used to load entity by id from a data resource. It accepts the entity id as the input argument.

```ts
@Component({
  selector: 'rx-mind-movies',
  templateUrl: './movies.component.html',
  viewProviders: [MoviesStore],
})
export class MoviesComponent {
  readonly movies$ = this.moviesStore.all$;

  constructor(private readonly moviesStore: MoviesStore) {}

  onLoadById(id: string): void {
    this.moviesStore.loadById(id);
  }
}
```

Also, there is a possibility to pass Observable as an input argument.

```ts
@Injectable()
export class MoviesStore extends DataComponentStore<MoviesState> {
  private readonly activeId$ = this.activatedRoute.paramMap.pipe(map((params) => params.get('id')));

  readonly activeMovie$ = this.select(
    this.entities$,
    this.activeId$,
    (movies, activeId) => activeId && movies[activeId]
  );

  constructor(private readonly activatedRoute: ActivatedRoute) {
    super({ baseUrl, initialState });

    // with id as Observable
    this.loadById(this.activeId$);
  }
}

@Component({
  selector: 'rx-mind-movie-details',
  templateUrl: './movie-details.component.html',
  viewProviders: [MoviesStore],
})
export class MovieDetailsComponent {
  readonly movie$ = this.moviesStore.activeMovie$;
  readonly isLoading$ = this.moviesStore.isLoadByIdPending$;

  constructor(private readonly moviesStore: MoviesStore) {}
}
```

`loadById` effect calls `getById` method from [data service](#data-service) under the hood and passes provided id.
When called, it will set `isLoadByIdPending` to `true`, and move it back to `false` when the request is complete.
`loadById` effect supports parallel requests, which means that `isLoadByIdPending` will be `true` when any load by id
request is in progress.

On success, `loadById` effect will add or replace loaded entity in the collection by using
[`setOne` entity updater](https://github.com/rx-mind/angular-plugins/tree/master/libs/entity-component-store#updaters).
However, the default behavior of `loadById` effect can be changed. Read more [here](#changing-default-behavior).

### `create`

`create` effect is used to create an entity. It accepts the partial entity as the input argument.
Similar to other data effects, it is possible to pass Observable as an input argument.

```ts
@Component({
  selector: 'rx-mind-movies',
  templateUrl: './movies.component.html',
  viewProviders: [MoviesStore],
})
export class MoviesComponent {
  readonly movies$ = this.moviesStore.all$;
  readonly isCreating$ = this.moviesStore.isCreatePending$;

  constructor(private readonly moviesStore: MoviesStore) {}

  onCreate(movie: Omit<Movie, 'id'>): void {
    this.moviesStore.create(movie);
  }
}
```

`create` effect calls `create` method from [data service](#data-service) under the hood and passes provided entity.
When called, it will set `isCreatePending` to `true`, and move it back to `false` when the request is complete.
`create` effect supports parallel requests, which means that `isCreatePending` will be `true` when any create request
is in progress.

On success, `create` effect will add created entity to the collection by using
[`addOne` entity updater](https://github.com/rx-mind/angular-plugins/tree/master/libs/entity-component-store#updaters).
However, the default behavior of `create` effect can be changed. Read more [here](#changing-default-behavior).

### `update`

`update` effect is used to update an entity. It accepts the object that contains the id and entity changes as the input argument.
Similar to other data effects, it is possible to pass Observable as an input argument.

```ts
@Component({
  selector: 'rx-mind-movies',
  templateUrl: './movies.component.html',
  viewProviders: [MoviesStore],
})
export class MoviesComponent {
  readonly movies$ = this.moviesStore.all$;
  readonly isUpdating$ = this.moviesStore.isUpdatePending$;

  constructor(private readonly moviesStore: MoviesStore) {}

  onUpdate(movieUpdate: Update<Movie, string>): void {
    this.moviesStore.update(movieUpdate);
  }
}
```

`update` effect calls `update` method from [data service](#data-service) under the hood and passes provided argument.
When called, it will set `isUpdatePending` to `true`, and move it back to `false` when the request is complete.
`update` effect supports parallel requests, which means that `isUpdatePending` will be `true` when any update request
is in progress.

On success, `update` effect will update entity in the collection by using
[`updateOne` entity updater](https://github.com/rx-mind/angular-plugins/tree/master/libs/entity-component-store#updaters).
However, the default behavior of `update` effect can be changed. Read more [here](#changing-default-behavior).

### `delete`

`delete` effect is used to delete an entity. It accepts the entity id as the input argument.
Similar to other data effects, it is possible to pass Observable as an input argument.

```ts
@Component({
  selector: 'rx-mind-movies',
  templateUrl: './movies.component.html',
  viewProviders: [MoviesStore],
})
export class MoviesComponent {
  readonly movies$ = this.moviesStore.all$;
  readonly isDeleting$ = this.moviesStore.isDeletePending$;

  constructor(private readonly moviesStore: MoviesStore) {}

  onDelete(id: string): void {
    this.moviesStore.delete(id);
  }
}
```

`delete` effect calls `delete` method from [data service](#data-service) under the hood and passes provided entity id.
When called, it will set `isDeletePending` to `true`, and move it back to `false` when the request is complete.
`delete` effect supports parallel requests, which means that `isDeletePending` will be `true` when any delete request
is in progress.

On success, `delete` effect will remove entity from the collection by using
[`removeOne` entity updater](https://github.com/rx-mind/angular-plugins/tree/master/libs/entity-component-store#updaters).
However, the default behavior of `delete` effect can be changed. Read more [here](#changing-default-behavior).

### `overrideDataEffects`

The default behavior of data effects can be changed by using `overrideDataEffects` method. It exposes builder object,
that contains the following methods:

- `loadStart(callback: (params: Params) => void)` - Passed callback will be executed before `dataService.get` is called.
  It accepts query parameters that can be passed to the `load` effect as the input argument.
- `loadSuccess(callback: (response: Response) => void)` - Passed callback will be executed when `dataService.get` succeeds.
  It accepts the response returned from the `dataService.get` method as the input argument.
- `loadError(callback: (error: Error) => void)` - Passed callback will be executed when `dataService.get` fails.
  It accepts the error that is thrown by the `dataService.get` as the input argument.
- `loadByIdStart(callback: (id: Id) => void)` - Passed callback will be executed before `dataService.getById` is called.
  It accepts the id that is passed to the `loadById` effect as the input argument.
- `loadByIdSuccess(callback: (entity: Entity) => void)` - Passed callback will be executed when `dataService.getById` succeeds.
  It accepts the entity returned from the `dataService.getById` method as the input argument.
- `loadByIdError(callback: (error: Error) => void)` - Passed callback will be executed when `dataService.getById` fails.
  It accepts the error that is thrown by the `dataService.getById` as the input argument.
- `createStart(callback: (entity: Partial<Entity>) => void)` - Passed callback will be executed before `dataService.create` is called.
  It accepts the partial entity that is passed to the `create` effect as the input argument.
- `createSuccess(callback: (entity: Entity) => void)` - Passed callback will be executed when `dataService.create` succeeds.
  It accepts the entity returned from the `dataService.create` method as the input argument.
- `createError(callback: (error: Error) => void)` - Passed callback will be executed when `dataService.create` fails.
  It accepts the error that is thrown by the `dataService.create` as the input argument.
- `updateStart(callback: (entityUpdate: Update<Entity, Id>) => void)` - Passed callback will be executed before `dataService.update`
  is called. It accepts entity update object that is passed to the `update` effect as the input argument.
- `updateSuccess(callback: (entity: Entity) => void)` - Passed callback will be executed when `dataService.update` succeeds.
  It accepts the entity returned from the `dataService.update` method as the input argument.
- `updateError(callback: (error: Error) => void)` - Passed callback will be executed when `dataService.update` fails.
  It accepts the error that is thrown by the `dataService.update` as the input argument.
- `deleteStart(callback: (id: Id) => void)` - Passed callback will be executed before `dataService.delete` is called.
  It accepts the id that is passed to the `delete` effect as the input argument.
- `deleteSuccess(callback: (response: Response) => void)` - Passed callback will be executed when `dataService.delete` succeeds.
  It accepts the response returned from the `dataService.delete` method as the input argument.
- `deleteError(callback: (error: Error) => void)` - Passed callback will be executed when `dataService.delete` fails.
  It accepts the error that is thrown by the `dataService.delete` as the input argument.
- `error(callback: (error: Error) => void)` - It has a lower priority than other error handlers.
  The passed callback will be executed when an effect that does not have a defined error handler fails.
  It accepts the error that is thrown by the `dataService` method as the input argument.

> **Note:** `DataComponentStore` will automatically manage the status of pending requests, and there is no need to override that part.

#### Changing Default Behavior

As previously described, each data effect has a predefined behavior when the request succeeds.
For example, `load` effect will call `setAll` updater to replace the current collection with a new one,
returned from the `dataService.get` method. However, there are several scenarios when this is not expected behavior.

**Scenario 1: `dataService.get` method does not return an array of entities as a response.**

This is the case when server pagination is used. Then the response contains the array of entities, and the total number of entities.
To handle this scenario, use `loadSuccess` method:

```ts
interface MoviesState extends DataState<Movie, string> {
  totalCount: number;
}

const initialState = getInitialDataState<MoviesState>({ totalCount: 0 });

@Injectable()
export class MoviesStore extends DataComponentStore<MoviesState> {
  constructor() {
    super({ baseUrl: '/movies', initialState });
  }

  protected overrideDataEffects(builder: DataEffectsBuilder<Movie, string>): void {
    builder.loadSuccess<{ movies: Movie[]; totalCount: number }>(({ movies, totalCount }) => {
      this.setAll(movies, { totalCount });
    });
  }
}
```

`setAll` updater will replace the current collection with a new one, but will also patch the state with provided `totalCount`.

**Scenario 2: An array of entities returned from the `dataService.get` method should be appended to the current collection.**

This is the case when virtual scrolling is used. Similar to the previous example, `loadSuccess` method should be used:

```ts
@Injectable()
export class MoviesStore extends DataComponentStore<MoviesState> {
  protected overrideDataEffects(builder: DataEffectsBuilder<Movie, string>): void {
    builder.loadSuccess<Movie[]>((movies) => this.addMany(movies));
  }
}
```

#### Error Handling

Error handling can be done by using `overrideDataEffects` method.
You can define a common error handler or error handler for a specific effect.

Defining a common error handler:

```ts
import { HttpErrorResponse } from '@angular/common/http';

@Injectable()
export class MoviesStore extends DataComponentStore<MoviesState> {
  constructor(private readonly alertService: AlertService) {
    super({ baseUrl, initialState });
  }

  protected overrideDataEffects(builder: DataEffectsBuilder<Movie, string>): void {
    builder.error<HttpErrorResponse>((error) => this.alertService.error(error.message));
  }
}
```

Error handling for a specific effect:

```ts
@Injectable()
export class MoviesStore extends DataComponentStore<MoviesState> {
  constructor(private readonly alertService: AlertService) {
    super({ baseUrl, initialState });
  }

  protected overrideDataEffects(builder: DataEffectsBuilder<Movie, string>): void {
    builder.loadError<{ message: string }>((error) => {
      this.removeAll();
      this.alertService.error(error.message);
    });
  }
}
```

Common error handler has a lower priority than specific error handlers.

```ts
@Injectable()
export class MoviesStore extends DataComponentStore<MoviesState> {
  protected overrideDataEffects(builder: DataEffectsBuilder<Movie, string>): void {
    // executed when `loadById`, `update` or `delete` effect fails
    builder.error<HttpErrorResponse>(({ message }) => this.alertService.error(message));

    // executed when `load` effect fails
    builder.loadError<{ message: string }>((error) => {
      this.removeAll();
      this.alertService.error(error.message);
    });

    // executed when `create` effect fails
    builder.createError<{ message: string }>(({ message }) => {
      this.alertService.error('Creation Failed! ' + message);
    });
  }
}
```

## Examples

- [CRUD](https://github.com/rx-mind/angular-plugins/tree/master/apps/examples/data-cs-crud)
- [Search](https://github.com/rx-mind/angular-plugins/tree/master/apps/examples/data-cs-search)
- [Pagination](https://github.com/rx-mind/angular-plugins/tree/master/apps/examples/data-cs-pagination)

## TODO List

- Built-in optimistic creates, updates, and deletes
- Request caching

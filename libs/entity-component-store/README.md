# @rx-mind/entity-component-store

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/rx-mind/ngrx-plugins/blob/master/LICENSE)
[![NPM](https://img.shields.io/npm/v/@rx-mind/entity-component-store)](https://www.npmjs.com/package/@rx-mind/entity-component-store)
[![CI Status](https://github.com/rx-mind/ngrx-plugins/actions/workflows/ci.yml/badge.svg)](https://github.com/rx-mind/ngrx-plugins/actions/workflows/ci.yml)

**[Component Store](https://ngrx.io/guide/component-store) with [Entity](https://ngrx.io/guide/entity) Selectors and Updaters**

## Contents

- [Installation](#installation)
- [Entity State](#entity-state)
- [Initialization](#initialization)
- [Selectors](#selectors)
- [Updaters](#updaters)

## Installation

- NPM: `npm i @rx-mind/entity-component-store`
- Yarn: `yarn add @rx-mind/entity-component-store`

> **Note:** `@rx-mind/entity-component-store` has `@ngrx/component-store` as a peer dependency.

## Entity State

The state of `EntityComponentStore` is defined by extending `EntityState`:

```ts
import { EntityState } from '@rx-mind/entity-component-store';

interface ProductsState extends EntityState<Product, number> {
  selectedId: number | null;
}
```

`EntityState` accepts the entity type as the first, and the id type as the second generic argument.
However, the second argument is optional and if not provided, the id type will be `string | number`.

To create the initial state, this package provides `getInitialEntityState` function. It accepts
the initial values of additional state properties as the input argument.

```ts
import { getInitialEntityState } from '@rx-mind/entity-component-store';

const initialState = getInitialEntityState<ProductsState>({ selectedId: null });
```

If the state doesn't contain additional properties, then the input argument should not be passed to `getInitialEntityState`:

```ts
import { getInitialEntityState } from '@rx-mind/entity-component-store';

type ProductsState = EntityState<Product, number>;

const initialState = getInitialEntityState<ProductsState>();
```

## Initialization

The constructor of `EntityComponentStore` accepts a configuration object that contains three optional properties:
`initialState`, `selectId` and `sortComparer`.

```ts
import { EntityComponentStore } from '@rx-mind/entity-component-store';

@Injectable()
export class ProductsStore extends EntityComponentStore<ProductsState> {
  constructor() {
    super({ initialState, selectId, sortComparer });
  }
}
```

`selectId` should be provided when the entity identifier name is not equal to `id`:

```ts
import { SelectId } from '@rx-mind/entity-component-store';

interface Product {
  key: number;
  name: string;
  price: number;
}

const selectId: SelectId<Product, number> = (product) => product.key;
```

`sortComparer` is a function used to sort the collection.
If not provided, entity collection will be unsorted which is more performant.

```ts
import { SortComparer } from '@rx-mind/entity-component-store';

const sortComparer: SortComparer<Product> = (p1, p2) => p1.name.localeCompare(p2.name);
```

Similar to `ComponentStore`, the state of `EntityComponentStore` can be initialized lazily
by calling `setState` method:

```ts
@Injectable()
export class ProductsStore extends EntityComponentStore<ProductsState> {
  constructor(private readonly productsService: ProductsService) {
    super();
  }
}

@Component({
  selector: 'rx-mind-products',
  templateUrl: './products.component.html',
  viewProviders: [ProductsStore],
})
export class ProductsComponent implements OnInit {
  constructor(private readonly productsStore: ProductsStore) {}

  ngOnInit(): void {
    this.productsStore.setState({ entities: {}, ids: [] });
  }
}
```

Also, there is an option to provide the `EntityComponentStore` configuration via
`ENTITY_COMPONENT_STORE_CONFIG` injection token:

```ts
import {
  EntityComponentStore,
  ENTITY_COMPONENT_STORE_CONFIG,
  EntityState,
  getInitialEntityState,
} from '@rx-mind/entity-component-store';

type ProductsState = EntityState<Product, number>;

const initialState = getInitialEntityState<ProductsState>();

@Component({
  selector: 'rx-mind-products',
  templateUrl: './products.component.html',
  viewProviders: [
    { provide: ENTITY_COMPONENT_STORE_CONFIG, useValue: { initialState } },
    EntityComponentStore,
  ],
})
export class ProductsComponent {
  constructor(private readonly productsStore: EntityComponentStore<ProductsState>) {}
}
```

## Selectors

`EntityComponentStore` provides following selectors:

- `ids$` - Selects the array of entity ids.
- `entities$` - Selects the entity dictionary.
- `all$` - Selects the array of all entities.
- `total$` - Selects the total number of entities.

Usage:

```ts
@Injectable()
export class ProductsStore extends EntityComponentStore<ProductsState> {
  private readonly selectedId$ = this.select((s) => s.selectedId);

  readonly vm$ = this.select(
    this.all$,
    this.entities$,
    this.total$,
    this.selectedId$,
    (products, productDictionary, totalProducts, selectedId) => ({
      products,
      selectedProduct: selectedId !== null ? productDictionary[selectedId] : null,
      totalProducts,
    })
  );

  constructor() {
    super({ initialState });
  }
}
```

## Updaters

`EntityComponentStore` provides following updaters:

- `addOne` - Adds one entity to the collection.
- `addMany` - Adds multiple entities to the collection.
- `setOne` - Adds or replaces one entity in the collection.
- `setMany` - Adds or replaces multiple entities in the collection.
- `setAll` - Replaces current collection with the provided collection.
- `removeOne` - Removes one entity from the collection.
- `removeMany` - Removes multiple entities from the collection by ids or by predicate.
- `removeAll` - Clears entity collection.
- `updateOne` - Updates one entity in the collection. Supports partial updates.
- `updateMany` - Updates multiple entities in the collection. Supports partial updates.
- `upsertOne` - Adds or updates one entity in the collection. Supports partial updates.
- `upsertMany` - Adds or updates multiple entities in the collection. Supports partial updates.
- `mapOne` - Updates one entity in the collection by defining a map function.
- `map` - Updates multiple entities in the collection by defining a map function.

Each entity updater accepts a partial state, or a partial updater function as an optional second argument.

Usage:

```ts
@Component({
  selector: 'rx-mind-products',
  templateUrl: './products.component.html',
  viewProviders: [ProductsStore],
})
export class ProductsComponent {
  constructor(private readonly productsStore: ProductsStore) {}

  onUpdateProduct(productUpdate: Update<Product, number>): void {
    this.productsStore.updateOne(productUpdate);
  }

  onAddProduct(product: Product): void {
    this.productsStore.addOne(product, { selectedId: product.id });
  }

  onRemoveProduct(id: number): void {
    this.productsStore.removeOne(id, ({ selectedId }) => ({
      selectedId: selectedId === id ? null : selectedId,
    }));
  }
}
```

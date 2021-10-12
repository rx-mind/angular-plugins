# @rx-mind/component-store-helpers

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/rx-mind/ngrx-plugins/blob/master/LICENSE)
[![NPM](https://img.shields.io/npm/v/@rx-mind/component-store-helpers)](https://www.npmjs.com/package/@rx-mind/component-store-helpers)
[![CI Status](https://github.com/rx-mind/ngrx-plugins/actions/workflows/ci.yml/badge.svg)](https://github.com/rx-mind/ngrx-plugins/actions/workflows/ci.yml)

**[Component Store](https://ngrx.io/guide/component-store) Helpers for Better Developer Experience**

## Contents

- [Installation](#installation)
- [API](#api)
  - [`getComponentStateSelectors`](#getcomponentstateselectors)

## Installation

- NPM: `npm i @rx-mind/component-store-helpers`
- Yarn: `yarn add @rx-mind/component-store-helpers`

> **Note:** `@rx-mind/component-store-helpers` as `@ngrx/component-store` as a peer dependency.

## API

### `getComponentStateSelectors`

The `getComponentStateSelectors` function returns an object that contains state selectors for the passed `ComponentStore`.
The name of each generated selector will be equal to the name of the state property with the `$` suffix.

#### Usage Notes

```ts
import { ComponentStore } from '@ngrx/component-store';
import { getComponentStateSelectors } from '@rx-mind/component-store-helpers';

interface UsersState {
  users: User[];
  isLoading: boolean;
  selectedUserId: string | null;
}

const initialState: UsersState = {
  users: [],
  isLoading: false,
  selectedUserId: null,
};

@Injectable()
export class UsersStore extends ComponentStore<UsersState> {
  private readonly selectors = getComponentStateSelectors(this);

  readonly vm$ = this.select(
    this.selectors.users$,
    this.selectors.isLoading$,
    this.selectors.selectedUserId$,
    (users, isLoading, selectedId) => ({
      users,
      isLoading,
      selectedUser: users.find((user) => user.id === selectedId) ?? null,
    })
  );

  constructor() {
    super(initialState);
  }
}
```

[Live Demo ⚡](https://stackblitz.com/edit/get-component-state-selectors-demo?file=src/app/users.store.ts)

#### Restrictions

The `getComponentStateSelectors` function cannot be used for `ComponentStore` whose state contains optional properties.
This can be solved by using `| null` or `| undefined` for nullish state properties.

**Before:**

```ts
interface UsersState {
  users: User[];
  selectedUserId?: string;
}

const initialState: UsersState = {
  users: [],
};
```

**After:**

```ts
interface UsersState {
  users: User[];
  selectedUserId: string | null;
  // or selectedUserId: string | undefined;
}

const initialState: UsersState = {
  users: [],
  selectedUserId: null,
  // or selectedUserId: undefined,
};
```

#### Limitations

The `getComponentStateSelectors` function cannot be used for `ComponentStore` whose state is initialized lazily.

```ts
@Injectable()
export class UsersStore extends ComponentStore<UsersState> {
  // this will throw an error because the state is not initialized on `UsersStore` initialization
  readonly selectors = getComponentStateSelectors(this);

  constructor() {
    // initial state is not passed to the parent constructor
    super();
  }
}
```

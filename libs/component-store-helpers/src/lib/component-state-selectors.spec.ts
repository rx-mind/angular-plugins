import { ComponentStore } from '@ngrx/component-store';
import { TestScheduler } from 'rxjs/testing';
import { getComponentStateSelectors } from './component-state-selectors';

describe('getComponentStateSelectors', () => {
  interface User {
    id: string;
    name: string;
  }

  interface UsersState {
    users: User[];
    isLoading: boolean;
    selectedUserId: string | null;
  }

  const initialState: UsersState = {
    users: [
      { id: '1', name: 'u1' },
      { id: '2', name: 'u2' },
    ],
    isLoading: false,
    selectedUserId: null,
  };

  function setup(initialState: UsersState | undefined) {
    return {
      testScheduler: new TestScheduler((actual, expected) => expect(actual).toEqual(expected)),
      store: new ComponentStore(initialState),
    };
  }

  describe('when state is initialized', () => {
    it('should create component state selectors', () => {
      const { testScheduler, store } = setup(initialState);
      const selectors = getComponentStateSelectors(store);

      testScheduler.run(({ expectObservable }) => {
        expectObservable(selectors.users$).toBe('x', { x: initialState.users });
        expectObservable(selectors.isLoading$).toBe('x', { x: initialState.isLoading });
        expectObservable(selectors.selectedUserId$).toBe('x', { x: initialState.selectedUserId });
      });
    });
  });

  describe('when state is not initialized', () => {
    it('should throw not initialized error', () => {
      const { store } = setup(undefined);

      expect(() => getComponentStateSelectors(store)).toThrow(
        'The `getComponentStateSelectors` function cannot be used for ComponentStore whose state is initialized lazily.'
      );
    });
  });
});

import { ComponentStore } from '@ngrx/component-store';
import { Observable } from 'rxjs';

type ComponentState<Store extends ComponentStore<any>> = Store extends ComponentStore<infer State>
  ? State
  : never;

type ComponentStateKeys<Store extends ComponentStore<any>> = Array<
  keyof ComponentState<Store> & string
>;

type ComponentStateSelectors<Store extends ComponentStore<any>> = {
  [K in ComponentStateKeys<Store>[number] as `${K}$`]: Observable<ComponentState<Store>[K]>;
};

const notInitializedErrorMessage =
  'The `getComponentStateSelectors` function cannot be used for ComponentStore whose state is initialized lazily.';

export function getComponentStateSelectors<Store extends ComponentStore<any>>(
  componentStore: Store
): ComponentStateSelectors<Store> {
  let state: ComponentState<Store>;
  try {
    state = (componentStore as any).get();
  } catch {
    throw new Error(notInitializedErrorMessage);
  }

  return Object.keys(state).reduce(
    (acc, key) => ({
      ...acc,
      [`${key}$`]: componentStore.select((state) => state[key]),
    }),
    {} as ComponentStateSelectors<Store>
  );
}

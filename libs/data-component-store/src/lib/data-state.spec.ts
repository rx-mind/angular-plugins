import { getInitialDataState } from './data-state';
import { DataState } from './models';

describe('getInitialDataState', () => {
  interface Book {
    id: number;
    title: string;
  }

  interface BooksState extends DataState<Book, number> {
    filter: string;
  }

  it('should return initial data state', () => {
    const initialState = getInitialDataState<DataState<Book, number>>();
    expect(initialState).toEqual({
      entities: {},
      ids: [],
      isLoadPending: false,
      isLoadByIdPending: false,
      isCreatePending: false,
      isUpdatePending: false,
      isDeletePending: false,
    });
  });

  it('should return initial data state with passed additional state', () => {
    const initialState = getInitialDataState<BooksState>({ filter: '' });
    expect(initialState).toEqual({
      entities: {},
      ids: [],
      isLoadPending: false,
      isLoadByIdPending: false,
      isCreatePending: false,
      isUpdatePending: false,
      isDeletePending: false,
      filter: '',
    });
  });
});

import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';
import { createDefaultDataService, DefaultDataService } from './data-service';

describe('DefaultDataService', () => {
  function setup(baseUrl: string) {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        { provide: DefaultDataService, useFactory: () => createDefaultDataService(baseUrl) },
      ],
    });

    return {
      dataService: TestBed.inject(DefaultDataService),
      http: TestBed.inject(HttpClient),
      testScheduler: new TestScheduler((actual, expected) => expect(actual).toEqual(expected)),
    };
  }

  it('should create', () => {
    const { dataService } = setup('/');
    expect(dataService).toBeDefined();
  });

  describe('get', () => {
    it('should get entities without query parameters', () => {
      const baseUrl = '/books';
      const products = [{ id: 10 }];
      const { dataService, http, testScheduler } = setup(baseUrl);
      spyOn(http, 'get').and.returnValue(of(products));

      testScheduler.run(({ expectObservable }) => {
        expectObservable(dataService.get()).toBe('(x|)', { x: products });
        expect(http.get).toHaveBeenCalledWith(baseUrl, { params: undefined });
      });
    });

    it('should get entities with provided query parameters', () => {
      const baseUrl = '/products';
      const products = [{ id: 1 }, { id: 2 }];
      const params = { filter: 'product' };
      const { dataService, http, testScheduler } = setup(baseUrl + '//');
      spyOn(http, 'get').and.returnValue(of(products));

      testScheduler.run(({ expectObservable }) => {
        expectObservable(dataService.get(params)).toBe('(x|)', { x: products });
        expect(http.get).toHaveBeenCalledWith(baseUrl, { params });
      });
    });
  });

  describe('getById', () => {
    it('should get entity by id request', () => {
      const baseUrl = '/movies';
      const id = 100;
      const { dataService, http, testScheduler } = setup(baseUrl);
      spyOn(http, 'get').and.returnValue(of({ id }));

      testScheduler.run(({ expectObservable }) => {
        expectObservable(dataService.getById(id)).toBe('(x|)', { x: { id } });
        expect(http.get).toHaveBeenCalledWith(`${baseUrl}/${id}`);
      });
    });
  });

  describe('create', () => {
    it('should create entity', () => {
      const baseUrl = '/songs';
      const song = { id: 1, title: 'song' };
      const { dataService, http, testScheduler } = setup(baseUrl);
      spyOn(http, 'post').and.returnValue(of(song));

      testScheduler.run(({ expectObservable }) => {
        expectObservable(dataService.create(song)).toBe('(x|)', { x: song });
        expect(http.post).toHaveBeenCalledWith(baseUrl, song);
      });
    });
  });

  describe('update', () => {
    it('should update entity', () => {
      const baseUrl = '/guitars';
      const id = 10;
      const guitar = { name: 'stratocaster' };
      const { dataService, http, testScheduler } = setup(baseUrl);
      spyOn(http, 'put').and.returnValue(of({ ...guitar, id }));

      testScheduler.run(({ expectObservable }) => {
        expectObservable(dataService.update(id, guitar)).toBe('(x|)', { x: { ...guitar, id } });
        expect(http.put).toHaveBeenCalledWith(`${baseUrl}/${id}`, guitar);
      });
    });
  });

  describe('delete', () => {
    it('should delete entity', () => {
      const baseUrl = '/jobs';
      const id = 23;
      const { dataService, http, testScheduler } = setup(baseUrl + '/');
      spyOn(http, 'delete').and.returnValue(of(id));

      testScheduler.run(({ expectObservable }) => {
        expectObservable(dataService.delete(id)).toBe('(x|)', { x: id });
        expect(http.delete).toHaveBeenCalledWith(`${baseUrl}/${id}`);
      });
    });
  });
});

import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { QueryParams } from './models';

export interface DataService<
  Entity extends Record<string, any>,
  Id extends string | number = string | number
> {
  get(params?: QueryParams): Observable<Entity[] | Record<string, any>>;
  getById(id: Id): Observable<Entity>;
  create(entity: Partial<Entity>): Observable<Entity>;
  update(id: Id, entity: Partial<Entity>): Observable<Entity>;
  delete(id: Id): Observable<Entity | Id | void>;
}

export class DefaultDataService<
  Entity extends Record<string, any>,
  Id extends string | number = string | number
> implements DataService<Entity, Id> {
  protected readonly http = inject(HttpClient);

  constructor(protected readonly baseUrl: string) {}

  get(params?: QueryParams): Observable<Entity[] | Record<string, any>> {
    return this.http.get<Entity[] | Record<string, any>>(this.baseUrl, { params });
  }

  getById(id: Id): Observable<Entity> {
    return this.http.get<Entity>(`${this.baseUrl}/${id}`);
  }

  create(entity: Partial<Entity>): Observable<Entity> {
    return this.http.post<Entity>(this.baseUrl, entity);
  }

  update(id: Id, entity: Partial<Entity>): Observable<Entity> {
    return this.http.put<Entity>(`${this.baseUrl}/${id}`, entity);
  }

  delete(id: Id): Observable<Entity | Id | void> {
    return this.http.delete<Entity | Id | void>(`${this.baseUrl}/${id}`);
  }
}

export function createDefaultDataService<
  Entity extends Record<string, any>,
  Id extends string | number = string | number
>(baseUrl: string): DefaultDataService<Entity, Id> {
  return new DefaultDataService(baseUrl);
}

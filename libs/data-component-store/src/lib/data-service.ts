import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Update } from '@rx-mind/entity-component-store';
import { QueryParams } from './models';
import { removeTrailingSlashes } from './helpers';

export interface DataService<
  Entity extends Record<string, any>,
  Id extends string | number = string | number
> {
  get(params?: QueryParams): Observable<Entity[] | Record<string, any>>;
  getById(id: Id): Observable<Entity>;
  create(entity: Partial<Entity>): Observable<Entity>;
  update(entityUpdate: Update<Entity, Id>): Observable<Entity>;
  delete(id: Id): Observable<Entity | Id | null>;
}

export class DefaultDataService<
  Entity extends Record<string, any>,
  Id extends string | number = string | number
> implements DataService<Entity, Id> {
  protected readonly http: HttpClient;
  protected readonly baseUrl: string;

  constructor(baseUrl: string) {
    this.http = inject(HttpClient);
    this.baseUrl = removeTrailingSlashes(baseUrl);
  }

  get(params?: QueryParams): Observable<Entity[] | Record<string, any>> {
    return this.http.get<Entity[] | Record<string, any>>(this.baseUrl, { params });
  }

  getById(id: Id): Observable<Entity> {
    return this.http.get<Entity>(`${this.baseUrl}/${id}`);
  }

  create(entity: Partial<Entity>): Observable<Entity> {
    return this.http.post<Entity>(this.baseUrl, entity);
  }

  update(entityUpdate: Update<Entity, Id>): Observable<Entity> {
    return this.http.put<Entity>(`${this.baseUrl}/${entityUpdate.id}`, entityUpdate.changes);
  }

  delete(id: Id): Observable<Entity | Id | null> {
    return this.http.delete<Entity | Id | null>(`${this.baseUrl}/${id}`);
  }
}

export function createDefaultDataService<
  Entity extends Record<string, any>,
  Id extends string | number = string | number
>(baseUrl: string): DefaultDataService<Entity, Id> {
  return new DefaultDataService(baseUrl);
}

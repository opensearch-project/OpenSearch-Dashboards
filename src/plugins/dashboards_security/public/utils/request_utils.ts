/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { HttpStart, HttpHandler } from 'opensearch-dashboards/public';

export async function request<T>(requestFunc: HttpHandler, url: string, body?: object): Promise<T> {
  if (body) {
    return (await requestFunc(url, { body: JSON.stringify(body) })) as T;
  }
  return (await requestFunc(url)) as T;
}

export async function httpGet<T>(http: HttpStart, url: string): Promise<T> {
  return await request<T>(http.get, url);
}

export async function httpPost<T>(http: HttpStart, url: string, body?: object): Promise<T> {
  return await request<T>(http.post, url, body);
}

export async function httpDelete<T>(http: HttpStart, url: string): Promise<T> {
  return await request<T>(http.delete, url);
}

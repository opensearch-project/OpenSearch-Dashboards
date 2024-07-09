/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  getCreateBreadcrumbs,
  getEditBreadcrumbs,
  getListBreadcrumbs,
  getCreateOpenSearchDataSourceBreadcrumbs,
  getCreateAmazonS3DataSourceBreadcrumbs,
  getCreatePrometheusDataSourceBreadcrumbs,
} from './breadcrumbs';
import { mockDataSourceAttributesWithAuth } from '../mocks';

describe('DataSourceManagement: breadcrumbs.ts', () => {
  test('get listing breadcrumb', () => {
    const bc = getListBreadcrumbs();
    expect(bc[0].text).toBe('Data sources');
    expect(bc[0].href).toBe('/');
  });

  test('get create breadcrumb', () => {
    const bc = getCreateBreadcrumbs();
    expect(bc.length).toBe(2);
    expect(bc[1].text).toBe('Create data source');
    expect(bc[1].href).toBe('/create');
  });

  test('get edit breadcrumb', () => {
    const bc = getEditBreadcrumbs(mockDataSourceAttributesWithAuth);
    expect(bc.length).toBe(2);
    expect(bc[1].text).toBe(mockDataSourceAttributesWithAuth.title);
    expect(bc[1].href).toBe(`/${mockDataSourceAttributesWithAuth.id}`);
  });

  test('get create OpenSearch breadcrumb', () => {
    const bc = getCreateOpenSearchDataSourceBreadcrumbs();
    expect(bc.length).toBe(3);
    expect(bc[2].text).toBe('Open Search');
    expect(bc[2].href).toBe('/configure/OpenSearch');
  });

  test('get create Amazon S3 breadcrumb', () => {
    const bc = getCreateAmazonS3DataSourceBreadcrumbs();
    expect(bc.length).toBe(3);
    expect(bc[2].text).toBe('Amazon S3');
    expect(bc[2].href).toBe('/configure/AmazonS3AWSGlue');
  });

  test('get create Prometheus breadcrumb', () => {
    const bc = getCreatePrometheusDataSourceBreadcrumbs();
    expect(bc.length).toBe(3);
    expect(bc[2].text).toBe('Prometheus');
    expect(bc[2].href).toBe('/configure/Prometheus');
  });
});

/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { getEditBreadcrumbs, getListBreadcrumbs } from './breadcrumbs';
import { DataView } from '../../../data/public';

describe('breadcrumbs', () => {
  const mockDataset = {
    id: 'test-id',
    title: 'Test Title',
  } as DataView;

  describe('getListBreadcrumbs', () => {
    it('returns breadcrumbs without workspace name', () => {
      const breadcrumbs = getListBreadcrumbs();
      expect(breadcrumbs).toHaveLength(1);
      expect(breadcrumbs[0].text).toBe('Datasets');
      expect(breadcrumbs[0].href).toBe('/');
    });

    it('returns breadcrumbs with workspace name', () => {
      const breadcrumbs = getListBreadcrumbs('My Workspace');
      expect(breadcrumbs).toHaveLength(1);
      expect(breadcrumbs[0].text).toBe('Workspace datasets');
      expect(breadcrumbs[0].href).toBe('/');
    });
  });

  describe('getEditBreadcrumbs', () => {
    it('uses dataset title when no displayName exists', () => {
      const breadcrumbs = getEditBreadcrumbs(mockDataset);
      expect(breadcrumbs).toHaveLength(2);
      expect(breadcrumbs[1].text).toBe('Test Title');
      expect(breadcrumbs[1].href).toBe('/patterns/test-id');
    });

    it('uses dataset displayName when it exists', () => {
      const datasetWithDisplayName = {
        ...mockDataset,
        displayName: 'Custom Display Name',
      } as DataView;

      const breadcrumbs = getEditBreadcrumbs(datasetWithDisplayName);
      expect(breadcrumbs).toHaveLength(2);
      expect(breadcrumbs[1].text).toBe('Custom Display Name');
      expect(breadcrumbs[1].href).toBe('/patterns/test-id');
    });

    it('includes list breadcrumbs as first item', () => {
      const breadcrumbs = getEditBreadcrumbs(mockDataset);
      expect(breadcrumbs[0].text).toBe('Datasets');
      expect(breadcrumbs[0].href).toBe('/');
    });
  });
});

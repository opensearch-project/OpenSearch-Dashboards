/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ApplicationStart } from 'opensearch-dashboards/public';
import { DirectQueryLoadingStatus } from '../../../../../framework/types';
import {
  isCatalogCacheFetching,
  redirectToExplorerWithDataSrc,
  redirectToExplorerOSIdx,
  redirectToExplorerS3,
} from './associated_objects_tab_utils';
import {
  DEFAULT_DATA_SOURCE_NAME,
  DEFAULT_DATA_SOURCE_TYPE,
  DATA_SOURCE_TYPES,
} from '../../../../../framework/constants';
import { observabilityLogsID } from '../../../../../framework/utils/shared';

describe('AssociatedObjectsTab utils', () => {
  describe('isCatalogCacheFetching', () => {
    it('returns true if any status is fetching', () => {
      expect(isCatalogCacheFetching(DirectQueryLoadingStatus.RUNNING)).toBe(true);
      expect(isCatalogCacheFetching(DirectQueryLoadingStatus.WAITING)).toBe(true);
      expect(isCatalogCacheFetching(DirectQueryLoadingStatus.SCHEDULED)).toBe(true);
    });

    it('returns false if no status is fetching', () => {
      expect(isCatalogCacheFetching(DirectQueryLoadingStatus.FINISHED)).toBe(false);
      expect(isCatalogCacheFetching(DirectQueryLoadingStatus.ERROR)).toBe(false);
    });

    it('returns true if mixed statuses and at least one is fetching', () => {
      expect(
        isCatalogCacheFetching(DirectQueryLoadingStatus.FINISHED, DirectQueryLoadingStatus.RUNNING)
      ).toBe(true);
      expect(
        isCatalogCacheFetching(DirectQueryLoadingStatus.ERROR, DirectQueryLoadingStatus.WAITING)
      ).toBe(true);
    });
  });

  describe('redirectToExplorerWithDataSrc', () => {
    it('navigates to the explorer with the correct state', () => {
      const mockNavigateToApp = jest.fn();
      const application = ({ navigateToApp: mockNavigateToApp } as unknown) as ApplicationStart;

      redirectToExplorerWithDataSrc(
        'testDataSource',
        'testType',
        'testDatabase',
        'testTable',
        application
      );

      expect(mockNavigateToApp).toHaveBeenCalledWith(observabilityLogsID, {
        path: '#/explorer',
        state: {
          datasourceName: 'testDataSource',
          datasourceType: 'testType',
          queryToRun: 'source = testDataSource.testDatabase.testTable | head 10',
        },
      });
    });
  });

  describe('redirectToExplorerOSIdx', () => {
    it('navigates to the explorer with the correct state', () => {
      const mockNavigateToApp = jest.fn();
      const application = ({ navigateToApp: mockNavigateToApp } as unknown) as ApplicationStart;

      redirectToExplorerOSIdx('testIndex', application);

      expect(mockNavigateToApp).toHaveBeenCalledWith(observabilityLogsID, {
        path: '#/explorer',
        state: {
          datasourceName: DEFAULT_DATA_SOURCE_NAME,
          datasourceType: DEFAULT_DATA_SOURCE_TYPE,
          queryToRun: 'source = testIndex | head 10',
        },
      });
    });
  });

  describe('redirectToExplorerS3', () => {
    it('navigates to the explorer with the correct state', () => {
      const mockNavigateToApp = jest.fn();
      const application = ({ navigateToApp: mockNavigateToApp } as unknown) as ApplicationStart;

      redirectToExplorerS3('testDataSource', application);

      expect(mockNavigateToApp).toHaveBeenCalledWith(observabilityLogsID, {
        path: '#/explorer',
        state: {
          datasourceName: 'testDataSource',
          datasourceType: DATA_SOURCE_TYPES.S3Glue,
        },
      });
    });
  });
});

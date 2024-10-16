/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ApplicationStart } from 'opensearch-dashboards/public';
import { DirectQueryLoadingStatus } from '../../../../../framework/types';
import {
  isCatalogCacheFetching,
  redirectToDiscoverWithDataSrc,
  redirectToDiscoverOSIdx,
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

  describe('redirectToDiscoverWithDataSrc', () => {
    it('navigates to the explorer with the correct state', () => {
      const mockNavigateToApp = jest.fn();
      const application = ({ navigateToApp: mockNavigateToApp } as unknown) as ApplicationStart;

      redirectToDiscoverWithDataSrc(
        'testDataSource',
        'testMDSID',
        'testDatabase',
        'testTable',
        application
      );

      expect(mockNavigateToApp).toHaveBeenCalledWith('data-explorer', {
        path:
          "discover#?_a=(discover:(columns:!(_source),isDirty:!f,sort:!()),metadata:(view:discover))&_g=(filters:!(),refreshInterval:(pause:!t,value:0),time:(from:now-15m,to:now))&_q=(filters:!(),query:(dataset:(dataSource:(id:'testMDSID',meta:(name:testDataSource,type:CUSTOM),title:'',type:DATA_SOURCE),id:'testMDSID::testDataSource.testDatabase.testTable',title:testDataSource.testDatabase.testTable,type:S3),language:SQL,query:'SELECT%20*%20FROM%20testDataSource.testDatabase.testTable%20LIMIT%2010'))",
      });
    });
  });

  describe('redirectToDiscoverOSIdx', () => {
    it('navigates to the explorer with the correct state', () => {
      const mockNavigateToApp = jest.fn();
      const application = ({ navigateToApp: mockNavigateToApp } as unknown) as ApplicationStart;

      redirectToDiscoverOSIdx('testIndex', 'testMDSId', application);

      expect(mockNavigateToApp).toHaveBeenCalledWith('data-explorer', {
        path:
          "discover#?_a=(discover:(columns:!(_source),isDirty:!f,sort:!()),metadata:(view:discover))&_g=(filters:!(),refreshInterval:(pause:!t,value:0),time:(from:now-15m,to:now))&_q=(filters:!(),query:(dataset:(dataSource:(id:'testMDSId',title:'',type:DATA_SOURCE),id:'testMDSId::testIndex',title:testIndex,type:INDEXES),language:SQL,query:'SELECT%20*%20FROM%20testIndex%20LIMIT%2010'))",
      });
    });
  });

  describe.skip('redirectToExplorerS3', () => {
    it('navigates to the explorer with the correct state', () => {
      const mockNavigateToApp = jest.fn();
      const application = ({ navigateToApp: mockNavigateToApp } as unknown) as ApplicationStart;

      // TODO: test when redirection to discover accepts only datasource
      // redirectToExplorerS3('testDataSource', application);

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

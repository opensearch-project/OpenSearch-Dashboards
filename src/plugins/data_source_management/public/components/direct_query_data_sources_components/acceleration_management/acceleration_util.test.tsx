/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { shallow } from 'enzyme';
import { EuiButton, EuiHealth } from '@elastic/eui';
import { ApplicationStart } from 'opensearch-dashboards/public';
import { CachedAcceleration } from '../../../../framework/types';
import {
  CreateAccelerationFlyoutButton,
  AccelerationStatus,
  AccelerationHealth,
  getAccelerationName,
  getAccelerationFullPath,
  generateAccelerationOperationQuery,
  getCapitalizedStatusColumnContent,
  onDiscoverIconClick,
} from './acceleration_utils';

describe('acceleration_utils', () => {
  describe('getAccelerationName', () => {
    it('should return the correct acceleration name', () => {
      const acceleration: CachedAcceleration = {
        flintIndexName: 'flint_index',
        type: 'covering',
        database: 'default',
        table: 'test_table',
        indexName: 'actual_index',
        autoRefresh: false,
        status: 'active',
      };

      const name = getAccelerationName(acceleration);
      expect(name).toBe('actual_index');
    });
  });

  describe('getCapitalizedStatusColumnContent', () => {
    it('should return capitalized status column content', () => {
      const status = 'active';
      const result = getCapitalizedStatusColumnContent(status);
      expect(result).toBe('Active');
    });
  });

  describe('getAccelerationFullPath', () => {
    it('should return the correct acceleration full path for skipping type', () => {
      const acceleration: CachedAcceleration = {
        flintIndexName: 'flint_index',
        type: 'skipping',
        database: 'default',
        table: 'test_table',
        indexName: 'actual_index',
        autoRefresh: false,
        status: 'active',
      };

      const fullPath = getAccelerationFullPath(acceleration, 'test_data_source');
      expect(fullPath).toBe('test_data_source.default.test_table');
    });

    it('should return the correct acceleration full path for covering type', () => {
      const acceleration: CachedAcceleration = {
        flintIndexName: 'flint_index',
        type: 'covering',
        database: 'default',
        table: 'test_table',
        indexName: 'actual_index',
        autoRefresh: false,
        status: 'active',
      };

      const fullPath = getAccelerationFullPath(acceleration, 'test_data_source');
      expect(fullPath).toBe('test_data_source.default.test_table');
    });
  });

  describe('generateAccelerationOperationQuery', () => {
    it('should generate correct query for delete operation', () => {
      const acceleration: CachedAcceleration = {
        flintIndexName: 'flint_index',
        type: 'covering',
        database: 'default',
        table: 'test_table',
        indexName: 'actual_index',
        autoRefresh: false,
        status: 'active',
      };

      const query = generateAccelerationOperationQuery(acceleration, 'test_data_source', 'delete');
      expect(query).toBe('DROP INDEX actual_index ON test_data_source.default.test_table');
    });

    it('should generate correct query for vacuum operation', () => {
      const acceleration: CachedAcceleration = {
        flintIndexName: 'flint_index',
        type: 'covering',
        database: 'default',
        table: 'test_table',
        indexName: 'actual_index',
        autoRefresh: false,
        status: 'active',
      };

      const query = generateAccelerationOperationQuery(acceleration, 'test_data_source', 'vacuum');
      expect(query).toBe('VACUUM INDEX actual_index ON test_data_source.default.test_table');
    });

    it('should generate correct query for sync operation', () => {
      const acceleration: CachedAcceleration = {
        flintIndexName: 'flint_index',
        type: 'covering',
        database: 'default',
        table: 'test_table',
        indexName: 'actual_index',
        autoRefresh: false,
        status: 'active',
      };

      const query = generateAccelerationOperationQuery(acceleration, 'test_data_source', 'sync');
      expect(query).toBe('REFRESH INDEX actual_index ON test_data_source.default.test_table');
    });
  });

  describe('CreateAccelerationFlyoutButton', () => {
    it('should render correctly and handle click', () => {
      const renderCreateAccelerationFlyout = jest.fn();
      const handleRefresh = jest.fn();
      const wrapper = shallow(
        <CreateAccelerationFlyoutButton
          dataSourceName="test_data_source"
          renderCreateAccelerationFlyout={renderCreateAccelerationFlyout}
          handleRefresh={handleRefresh}
        />
      );

      wrapper.find(EuiButton).simulate('click');
      expect(renderCreateAccelerationFlyout).toHaveBeenCalledWith({
        dataSourceName: 'test_data_source',
        handleRefresh,
      });
    });
  });

  describe('AccelerationStatus', () => {
    it('should render correctly for active status', () => {
      const wrapper = shallow(<AccelerationStatus status="active" />);
      expect(wrapper.find(EuiHealth).prop('color')).toBe('success');
      expect(wrapper.find(EuiHealth).children().text()).toBe('Active');
    });

    it('should render correctly for refreshing status', () => {
      const wrapper = shallow(<AccelerationStatus status="refreshing" />);
      expect(wrapper.find(EuiHealth).prop('color')).toBe('warning');
      expect(wrapper.find(EuiHealth).children().text()).toBe('Refreshing');
    });

    it('should render correctly for deleted status', () => {
      const wrapper = shallow(<AccelerationStatus status="deleted" />);
      expect(wrapper.find(EuiHealth).prop('color')).toBe('danger');
      expect(wrapper.find(EuiHealth).children().text()).toBe('Deleted');
    });
  });

  describe('AccelerationHealth', () => {
    it('should render correctly for green health', () => {
      const wrapper = shallow(<AccelerationHealth health="green" />);
      expect(wrapper.find(EuiHealth).prop('color')).toBe('success');
      expect(wrapper.find(EuiHealth).children().text()).toBe('Green');
    });

    it('should render correctly for red health', () => {
      const wrapper = shallow(<AccelerationHealth health="red" />);
      expect(wrapper.find(EuiHealth).prop('color')).toBe('danger');
      expect(wrapper.find(EuiHealth).children().text()).toBe('Red');
    });

    it('should render correctly for yellow health', () => {
      const wrapper = shallow(<AccelerationHealth health="yellow" />);
      expect(wrapper.find(EuiHealth).prop('color')).toBe('warning');
      expect(wrapper.find(EuiHealth).children().text()).toBe('Yellow');
    });
  });

  describe('onDiscoverIconClick', () => {
    it('should redirect to explorer with data source for skipping index', () => {
      const acceleration: CachedAcceleration = {
        flintIndexName: 'flint_index',
        type: 'skipping',
        database: 'default',
        table: 'test_table',
        indexName: 'actual_index',
        autoRefresh: false,
        status: 'active',
      };

      const application = ({
        navigateToApp: jest.fn(),
      } as unknown) as ApplicationStart;

      onDiscoverIconClick(acceleration, 'test_data_source', 'testMDSId', application);
      expect(application.navigateToApp).toHaveBeenCalledWith('data-explorer', {
        path:
          "discover#?_a=(discover:(columns:!(_source),isDirty:!f,sort:!()),metadata:(view:discover))&_g=(filters:!(),refreshInterval:(pause:!t,value:0),time:(from:now-15m,to:now))&_q=(filters:!(),query:(dataset:(dataSource:(id:'testMDSId',meta:(name:test_data_source,type:CUSTOM),title:'',type:DATA_SOURCE),id:'testMDSId::test_data_source.default.test_table',title:test_data_source.default.test_table,type:S3),language:SQL,query:'SELECT%20*%20FROM%20test_data_source.default.test_table%20LIMIT%2010'))",
      });
    });

    it('should redirect to explorer with index for covering index', () => {
      const acceleration: CachedAcceleration = {
        flintIndexName: 'flint_index',
        type: 'covering',
        database: 'default',
        table: 'test_table',
        indexName: 'actual_index',
        autoRefresh: false,
        status: 'active',
      };

      const application = ({
        navigateToApp: jest.fn(),
      } as unknown) as ApplicationStart;

      onDiscoverIconClick(acceleration, 'test_data_source', 'testMDSId', application);
      expect(application.navigateToApp).toHaveBeenCalledWith('data-explorer', {
        path:
          "discover#?_a=(discover:(columns:!(_source),isDirty:!f,sort:!()),metadata:(view:discover))&_g=(filters:!(),refreshInterval:(pause:!t,value:0),time:(from:now-15m,to:now))&_q=(filters:!(),query:(dataset:(dataSource:(id:'testMDSId',title:'',type:DATA_SOURCE),id:'testMDSId::flint_index',title:flint_index,type:INDEXES),language:SQL,query:'SELECT%20*%20FROM%20flint_index%20LIMIT%2010'))",
      });
    });
  });
});

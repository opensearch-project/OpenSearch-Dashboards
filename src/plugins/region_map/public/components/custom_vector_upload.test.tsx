/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import renderer, { act } from 'react-test-renderer';
import * as React from 'react';
import { CustomVectorUpload } from './custom_vector_upload';
import * as serviceApiCalls from '../services';

describe('custom vector upload component', () => {
  const mockDataWhenPluginIsUninstalled = {
    ok: true,
    resp: [
      {
        name: 'integTest-0',
        component: 'opensearch',
        version: '2.1.0.0-SNAPSHOT',
      },
    ],
  };
  const mockDataWhenPluginIsInstalled = {
    ok: true,
    resp: [
      {
        name: 'integTest-0',
        component: 'opensearch-geospatial',
        version: '2.1.0.0-SNAPSHOT',
      },
    ],
  };
  const props = {
    vis: {
      http: '',
      notifications: '',
    },
  };

  it('renders the empty prompt if geospatial plugin is not installed', async () => {
    jest.spyOn(serviceApiCalls, 'getPlugins').mockImplementation((http) => {
      return mockDataWhenPluginIsUninstalled;
    });

    let tree;
    await act(async () => {
      tree = renderer.create(<CustomVectorUpload {...props} />);
    });
    expect(tree.toJSON().children[0].props.testId).toBe('empty-prompt-id');
    expect(tree.toJSON()).toMatchSnapshot();
  });

  it('renders the upload customer div if geospatial plugin is installed', async () => {
    jest.spyOn(serviceApiCalls, 'getPlugins').mockImplementation((http) => {
      return mockDataWhenPluginIsInstalled;
    });

    let tree;
    await act(async () => {
      tree = renderer.create(<CustomVectorUpload {...props} />);
    });
    expect(tree.toJSON().children[0].props.id).toBe('uploadCustomVectorMap');
    expect(tree.toJSON()).toMatchSnapshot();
  });
});

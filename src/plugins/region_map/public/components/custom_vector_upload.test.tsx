/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import renderer, { act, create } from 'react-test-renderer';
import * as React from 'react';
import { shallow } from 'enzyme';
import toJson from 'enzyme-to-json';
import { CustomVectorUpload } from './custom_vector_upload';
import * as serviceApiCalls from '../services';

describe('custom vector upload component', () => {
  it('renders the empty prompt if geospatial plugin is installed', async () => {
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
    const props = {
      vis: {
        http: '',
        notifications: '',
      },
    };
    jest.spyOn(serviceApiCalls, 'getServices').mockImplementation(() => {
      return {
        getPlugins: () => {
          return mockDataWhenPluginIsUninstalled;
        },
      };
    });
    let tree;
    await act(async () => {
      tree = renderer.create(<CustomVectorUpload {...props} />);
    });
    expect(tree.toJSON().children[0].props.testId).toBe('empty-prompt-id');
    expect(tree.toJSON()).toMatchSnapshot();
  });
});

/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from 'react';
import { StyleOptions } from './style_options';
import renderer, { act } from 'react-test-renderer';

describe('style_options', () => {
  it('renders the Style options comprising of style settings, color schema and border thickness', async () => {
    const props = jest.mock;
    const vis = {
      type: {
        editorConfig: {
          collections: {
            colorSchemas: [],
          },
        },
      },
    };
    const stateParams = {
      colorSchema: {},
      outlineWeight: {},
    };

    let tree;
    await act(async () => {
      tree = renderer.create(<StyleOptions stateParams={stateParams} vis={vis} {...props} />);
    });
    expect(tree.toJSON().children[0].props.id).toBe('styleSettingTitleId');
    expect(tree.toJSON()).toMatchSnapshot();
  });
});

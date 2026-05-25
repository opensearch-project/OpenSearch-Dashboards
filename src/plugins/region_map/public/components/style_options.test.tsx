/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { I18nProvider } from '@osd/i18n/react';
import { StyleOptions } from './style_options';
// @ts-expect-error TS7016 TODO(ts-error): fixme
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
      colorSchema: 'Yellow to Red',
      outlineWeight: 1,
    };

    let tree;
    await act(async () => {
      tree = renderer.create(
        <I18nProvider>
          {/* @ts-expect-error TS2740 TODO(ts-error): fixme */}
          <StyleOptions stateParams={stateParams} vis={vis} {...props} />
        </I18nProvider>
      );
    });
    // @ts-expect-error TS2532 TODO(ts-error): fixme
    expect(tree.toJSON().children[0].props.id).toBe('styleSettingTitleId');
    // @ts-expect-error TS2532 TODO(ts-error): fixme
    expect(tree.toJSON()).toMatchSnapshot();
  });
});

/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EmptyDatasetPrompt } from '.';
import { shallowWithI18nProvider } from 'test_utils/enzyme_helpers';

describe('EmptyDatasetPrompt', () => {
  it('should render normally', () => {
    const component = shallowWithI18nProvider(
      <EmptyDatasetPrompt
        canSave
        creationOptions={[{ text: 'default', onClick: () => {} }]}
        docLinksDatasetIntro={'testUrl'}
        // @ts-expect-error TS2322 TODO(ts-error): fixme
        setBreadcrumbs={() => {}}
      />
    );

    expect(component).toMatchSnapshot();
  });
});

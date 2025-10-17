/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EmptyDatasetPrompt } from '.';
import { shallowWithI18nProvider } from 'test_utils/enzyme_helpers';

describe('EmptyDatasetPrompt', () => {
  it('should render normally with creationOptions', () => {
    const component = shallowWithI18nProvider(
      <EmptyDatasetPrompt
        canSave
        creationOptions={[{ text: 'default', onClick: () => {} }]}
        docLinksDatasetIntro={'testUrl'}
      />
    );

    expect(component).toMatchSnapshot();
  });

  it('should render normally with onCreateDataset', () => {
    const mockOnCreateDataset = jest.fn();
    const component = shallowWithI18nProvider(
      <EmptyDatasetPrompt
        canSave
        onCreateDataset={mockOnCreateDataset}
        docLinksDatasetIntro={'testUrl'}
      />
    );

    expect(component).toMatchSnapshot();
  });

  it('should not render button when canSave is false', () => {
    const component = shallowWithI18nProvider(
      <EmptyDatasetPrompt
        canSave={false}
        creationOptions={[{ text: 'default', onClick: () => {} }]}
        docLinksDatasetIntro={'testUrl'}
      />
    );

    expect(component).toMatchSnapshot();
  });
});

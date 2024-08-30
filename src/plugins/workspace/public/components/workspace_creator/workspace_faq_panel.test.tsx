/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render } from '@testing-library/react';
import { WorkspaceFaqPanel } from './workspace_faq_panel';

describe('WorkspaceFaqPanel', () => {
  it('renders correctly', () => {
    const tree = render(<WorkspaceFaqPanel />);
    expect(tree.container).toMatchSnapshot();
  });
});

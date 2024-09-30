/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render } from '@testing-library/react';
import { WorkspaceTitleDisplay } from './workspace_name';
import React from 'react';
import { DEFAULT_NAV_GROUPS, WorkspaceObject } from '../../../../../core/public';

describe('<WorkspaceNameWithIcon />', () => {
  const availableUseCases = [
    {
      ...DEFAULT_NAV_GROUPS.observability,
      features: [{ id: 'discover', title: 'Discover' }],
      icon: 'wsSearch',
    },
  ];

  const workspace: WorkspaceObject = {
    id: 'foo',
    name: 'Foo',
    features: ['use-case-observability'],
  };

  test('should render normally', () => {
    const { queryByText, queryByTestId } = render(
      <WorkspaceTitleDisplay workspace={workspace} availableUseCases={availableUseCases} />
    );
    expect(queryByText('Foo')).toBeInTheDocument();
    expect(queryByTestId('foo-icon')).toBeInTheDocument();
  });
});

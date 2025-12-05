/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { render } from '@testing-library/react';
import { WorkspacePrivacyFlyout } from './workspace_privacy_flyout';

const setup = () => {
  const handleCloseMock = jest.fn();
  const renderResult = render(<WorkspacePrivacyFlyout onClose={handleCloseMock} />);
  return {
    renderResult,
    handleCloseMock,
  };
};

describe('WorkspacePrivacyFlyout', () => {
  it('should render normally', () => {
    const { renderResult } = setup();
    expect(renderResult).toMatchSnapshot();
  });
});

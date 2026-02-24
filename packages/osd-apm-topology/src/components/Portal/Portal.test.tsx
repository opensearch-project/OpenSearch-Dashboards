/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen } from '../../test-utils/vitest.utilities';
import Portal from './Portal';

jest.mock('./use-portal-container.hook', () => ({
  usePortalContainer: (_position: any, containerEl: HTMLDivElement) => {
    // Access document lazily at call time, not at module load time
    const doc = global.document;
    if (!doc.body.contains(containerEl)) {
      doc.body.appendChild(containerEl);
    }
    return containerEl;
  },
}));

describe('Portal', () => {
  it('renders children via React portal in document.body', () => {
    render(
      <Portal position={{ top: 10, left: 20 }}>
        <span>Portal Content</span>
      </Portal>
    );
    expect(screen.getByText('Portal Content')).toBeTruthy();
  });

  it('renders children outside the parent DOM tree', () => {
    const { container } = render(
      <div>
        <Portal position={{ top: 0 }}>
          <span className="portal-child">Outside</span>
        </Portal>
      </div>
    );
    // The portal child should NOT be inside the render container
    const childInContainer = container.querySelector('.portal-child');
    expect(childInContainer).toBeNull();

    // But it should exist somewhere in the document body
    expect(global.document.querySelector('.portal-child')).toBeTruthy();
  });
});

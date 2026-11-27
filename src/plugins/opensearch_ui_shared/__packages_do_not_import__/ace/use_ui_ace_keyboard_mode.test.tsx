/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render } from '@testing-library/react';
import { useUIAceKeyboardMode } from './use_ui_ace_keyboard_mode';

const Harness = ({ textarea }: { textarea: HTMLTextAreaElement }) => {
  useUIAceKeyboardMode(textarea);
  return null;
};

describe('useUIAceKeyboardMode', () => {
  let container: HTMLDivElement;
  let textarea: HTMLTextAreaElement;

  beforeEach(() => {
    container = document.createElement('div');
    textarea = document.createElement('textarea');
    container.appendChild(textarea);
    document.body.appendChild(container);
    render(<Harness textarea={textarea} />);
    textarea.focus();
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('moves focus to the overlay on plain Escape', () => {
    const overlay = container.querySelector('.osdUiAceKeyboardHint');
    expect(overlay).not.toBeNull();
    textarea.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })
    );
    expect(document.activeElement).toBe(overlay);
  });
});

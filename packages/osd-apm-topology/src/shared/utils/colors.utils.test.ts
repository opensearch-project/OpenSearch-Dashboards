/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ColorScheme } from './colors.utils';

describe('ColorScheme', () => {
  it('should have all color properties defined', () => {
    expect(ColorScheme.containerBackgroundDefault).toBeDefined();
    expect(ColorScheme.containerBackgroundBreached).toBeDefined();
    expect(ColorScheme.textDefault).toBeDefined();
    expect(ColorScheme.textSecondary).toBeDefined();
    expect(ColorScheme.linkTextDefault).toBeDefined();
    expect(ColorScheme.linkTextHover).toBeDefined();
    expect(ColorScheme.buttonBackgroundHover).toBeDefined();
    expect(ColorScheme.statusIndicatorDefault).toBeDefined();
    expect(ColorScheme.statusIndicatorBreached).toBeDefined();
    expect(ColorScheme.ok).toBeDefined();
    expect(ColorScheme.faults).toBeDefined();
    expect(ColorScheme.errors).toBeDefined();
    expect(ColorScheme.requests).toBeDefined();
    expect(ColorScheme.iconFill).toBeDefined();
    expect(ColorScheme.spinnerStroke).toBeDefined();
  });

  it('should have correct CSS variable references', () => {
    expect(ColorScheme.containerBackgroundDefault).toBe('var(--osd-color-container-default)');
    expect(ColorScheme.containerBackgroundBreached).toBe('var(--osd-color-container-breach)');
    expect(ColorScheme.textDefault).toBe('var(--osd-color-body-default)');
    expect(ColorScheme.textSecondary).toBe('var(--osd-color-body-secondary)');
    expect(ColorScheme.linkTextDefault).toBe('var(--osd-color-link-default)');
    expect(ColorScheme.linkTextHover).toBe('var(--osd-color-link-hover)');
    expect(ColorScheme.buttonBackgroundHover).toBe('var(--osd-color-button-hover)');
    expect(ColorScheme.statusIndicatorDefault).toBe('var(--osd-color-status-default)');
    expect(ColorScheme.statusIndicatorBreached).toBe('var(--osd-color-status-breached)');
    expect(ColorScheme.ok).toBe('var(--osd-color-ok)');
    expect(ColorScheme.faults).toBe('var(--osd-color-faults)');
    expect(ColorScheme.errors).toBe('var(--osd-color-errors)');
    expect(ColorScheme.requests).toBe('var(--osd-color-requests)');
    expect(ColorScheme.iconFill).toBe('var(--osd-color-icon)');
    expect(ColorScheme.spinnerStroke).toBe('var(--osd-color-spinner)');
  });
});

/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  renderPanelCopyTitle,
  isPanelCopyTitleTemplateValid,
  DEFAULT_PANEL_COPY_TITLE_TEMPLATE,
  PANEL_TITLE_TOKEN,
  DASHBOARD_TITLE_TOKEN,
} from './panel_copy_title_template';

describe('renderPanelCopyTitle', () => {
  it('substitutes {panelTitle} and {dashboardTitle}', () => {
    expect(
      renderPanelCopyTitle('{{panelTitle}} - {{dashboardTitle}}', 'Airline Carrier', 'My Clone')
    ).toBe('Airline Carrier - My Clone');
  });

  it('replaces every occurrence of a token', () => {
    expect(renderPanelCopyTitle('{{panelTitle}} {{panelTitle}}', 'X', '')).toBe('X X');
  });

  it('keeps unknown text verbatim and supports no tokens', () => {
    expect(renderPanelCopyTitle('static name', 'X', 'Y')).toBe('static name');
  });

  it('default template reproduces the "<name> (copy)" naming', () => {
    expect(renderPanelCopyTitle(DEFAULT_PANEL_COPY_TITLE_TEMPLATE, 'Airline Carrier', 'D')).toBe(
      'Airline Carrier (copy)'
    );
  });

  it('exports the documented token strings', () => {
    expect(PANEL_TITLE_TOKEN).toBe('{{panelTitle}}');
    expect(DASHBOARD_TITLE_TOKEN).toBe('{{dashboardTitle}}');
  });
});

describe('isPanelCopyTitleTemplateValid', () => {
  it('rejects empty / whitespace-only templates', () => {
    expect(isPanelCopyTitleTemplateValid('')).toBe(false);
    expect(isPanelCopyTitleTemplateValid('   ')).toBe(false);
  });

  it('rejects templates that do not include {{panelTitle}}', () => {
    expect(isPanelCopyTitleTemplateValid('{{dashboardTitle}} copy')).toBe(false);
    expect(isPanelCopyTitleTemplateValid('just text')).toBe(false);
  });

  it('accepts a template that is only {{panelTitle}} (copy keeps source title)', () => {
    expect(isPanelCopyTitleTemplateValid('{{panelTitle}}')).toBe(true);
    expect(isPanelCopyTitleTemplateValid('  {{panelTitle}}  ')).toBe(true);
  });

  it('accepts {{panelTitle}} with extra text or another token', () => {
    expect(isPanelCopyTitleTemplateValid('{{panelTitle}} (copy)')).toBe(true);
    expect(isPanelCopyTitleTemplateValid('{{panelTitle}} - {{dashboardTitle}}')).toBe(true);
    expect(isPanelCopyTitleTemplateValid(DEFAULT_PANEL_COPY_TITLE_TEMPLATE)).toBe(true);
  });
});

/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Tokens a user can put in the "Copy panels" title template. They are replaced,
 * per copied panel, with the source panel's own title and the new dashboard's
 * title respectively. Double-brace syntax matches OSD's existing user-facing
 * templates (URL field formatter {{value}}, PromQL legend {{label}}).
 */
export const PANEL_TITLE_TOKEN = '{{panelTitle}}';
export const DASHBOARD_TITLE_TOKEN = '{{dashboardTitle}}';

/** Default template: preserves the familiar "<name> (copy)" naming. */
export const DEFAULT_PANEL_COPY_TITLE_TEMPLATE = `${PANEL_TITLE_TOKEN} (copy)`;

/**
 * Render a copied panel's title from a user template, substituting every
 * occurrence of the supported tokens. Unknown text is kept verbatim.
 */
export function renderPanelCopyTitle(
  template: string,
  panelTitle: string,
  dashboardTitle: string
): string {
  return template
    .split(PANEL_TITLE_TOKEN)
    .join(panelTitle ?? '')
    .split(DASHBOARD_TITLE_TOKEN)
    .join(dashboardTitle ?? '');
}

/**
 * A template is valid when it is non-empty after trimming and references
 * {{panelTitle}}. The token requirement ties each copied title to its own source
 * panel's title; a template of just {{panelTitle}} is allowed (the copy keeps the
 * source title verbatim), since panel titles are not unique.
 */
export function isPanelCopyTitleTemplateValid(template: string): boolean {
  const trimmed = (template ?? '').trim();
  if (trimmed.length === 0) {
    return false;
  }
  if (!trimmed.includes(PANEL_TITLE_TOKEN)) {
    return false;
  }
  return true;
}

/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * DOM selectors used for keyboard shortcuts and interactions in data plugin components
 */
export const DATA_DOM_SELECTORS = {
  DATE_PICKER_START_BUTTON: '[data-test-subj="superDatePickerstartDatePopoverButton"]',
  DATE_PICKER_SHOW_DATES_BUTTON: '[data-test-subj="superDatePickerShowDatesButton"]',
  QUERY_INPUT: '[data-test-subj="queryInput"]',
  QUERY_EDITOR_INPUT: '[data-test-subj="exploreQueryPanelEditor"]',
} as const;

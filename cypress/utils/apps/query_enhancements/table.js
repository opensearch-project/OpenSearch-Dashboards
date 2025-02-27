/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Checks if a field is sortable by looking for sort button
 * @param {string} field Field name to check sortability
 * @returns {boolean} True if field has sort button, false otherwise
 * @example
 * // Check if timestamp field is sortable
 * if (isSortable('timestamp')) {
 *   // Perform sort operations
 * }
 */
export const isSortable = (field) => {
  cy.getElementByTestId(`docTableHeaderFieldSort_${field}`).should('exist');
};

/**
 * Sets the sort direction for a field in the doc table
 * @param {string} field - The field name to sort on
 * @param {'asc'|'desc'|'none'} direction - Sort direction:
 *   - 'asc': Sort ascending
 *   - 'desc': Sort descending
 *   - 'none': Remove sort
 * @example
 * // Sort timestamp ascending
 * setSort('timestamp', 'asc')
 */
export const setSort = (field, direction) => {
  cy.getElementByTestId(`docTableHeaderFieldSort_${field}`)
    .should('exist')
    .then(($btn) => {
      const getCurrentDir = () => {
        return $btn.attr('aria-label').toLowerCase();
      };

      const getActualDir = (label) => {
        if (label.includes('ascending')) return 'desc';
        if (label.includes('descending')) return 'asc';
        return 'none';
      };

      let attempts = 0;
      const maxAttempts = 2;

      const clickUntilDesired = () => {
        const currentDir = getActualDir(getCurrentDir());
        if (currentDir !== direction && attempts < maxAttempts) {
          attempts++;
          cy.getElementByTestId(`docTableHeaderFieldSort_${field}`).click();
          cy.getElementByTestId(`docTableHeaderFieldSort_${field}`)
            .should('exist')
            .then(($newBtn) => {
              if (getActualDir($newBtn.attr('aria-label').toLowerCase()) !== direction) {
                clickUntilDesired();
              }
            });
        }
      };

      clickUntilDesired();
    });
};

/**
 * Gets the current sort direction of a field
 * @param {string} field Field name to check sort direction
 * @returns {'asc'|'desc'|'none'|null} Current sort direction, or null if field not sortable
 * @example
 * // Get current sort direction of timestamp field
 * const direction = getSort('timestamp') // Returns 'asc', 'desc', 'none', or null
 */
export const getSort = (field) => {
  if (!isSortable(field)) {
    return null;
  }

  return cy
    .getElementByTestId(`docTableHeaderFieldSort_${field}`)
    .invoke('attr', 'aria-label')
    .then((label) => {
      // Convert aria-label's next state to current state
      const labelLower = label.toLowerCase();
      if (labelLower.includes('ascending')) return 'desc';
      if (labelLower.includes('descending')) return 'asc';
      return 'none';
    });
};

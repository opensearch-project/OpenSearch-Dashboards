/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

declare namespace Cypress {
  interface Chainable<Subject> {
    /**
     * Set the top nav query value
     * @example
     * cy.setTopNavQuery('products.base_price > 40')
     */
    setTopNavQuery(value: string): Chainable<any>;

    /**
     * Clicks the update button on the top nav.
     * @example
     * cy.updateTopNav()
     */
    updateTopNav(opts: Record<string, any>): Chainable<any>;
  }
}

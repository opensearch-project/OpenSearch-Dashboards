/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// --- Typed commands --

Cypress.Commands.add('getElementByTestId', (testId, options = {}) => {
  return cy.get(`[data-test-subj="${testId}"]`, options);
});

Cypress.Commands.add('getElementByTestIdLike', (testId, options = {}) => {
  return cy.get(`[data-test-subj*="${testId}"]`, options);
});

Cypress.Commands.add('getElementsByTestIds', (testIds, options = {}) => {
  const selectors = [testIds].flat(Infinity).map((testId) => `[data-test-subj="${testId}"]`);
  return cy.get(selectors.join(','), options);
});

Cypress.Commands.add(
  'findElementByTestIdLike',
  { prevSubject: true },
  (subject, partialTestId, options = {}) => {
    return cy.wrap(subject).find(`[data-test-subj*="${partialTestId}"]`, options);
  }
);

Cypress.Commands.add(
  'findElementByTestId',
  { prevSubject: true },
  (subject, testId, options = {}) => {
    return cy.wrap(subject).find(`[data-test-subj="${testId}"]`, options);
  }
);

Cypress.Commands.add('whenTestIdNotFound', (testIds, callbackFn, options = {}) => {
  const selectors = [testIds].flat(Infinity).map((testId) => `[data-test-subj="${testId}"]`);
  cy.get('body', options).then(($body) => {
    if ($body.find(selectors.join(',')).length === 0) callbackFn();
  });
});

Cypress.Commands.add('deleteWorkspace', (workspaceName) => {
  cy.wait(3000);
  cy.getElementByTestId('workspace-detail-delete-button').should('be.visible').click();
  cy.getElementByTestId('delete-workspace-modal-body').should('be.visible');
  cy.getElementByTestId('delete-workspace-modal-input').type(workspaceName);
  cy.getElementByTestId('delete-workspace-modal-confirm').click();
  cy.contains(/successfully/);
});

Cypress.Commands.add('openWorkspaceDashboard', (workspaceName) => {
  cy.getElementByTestId('workspace-select-button').should('exist').click();
  cy.getElementByTestId('workspace-menu-manage-button').should('exist').click();
  cy.get('.euiBasicTable')
    .find('tr')
    .filter((index, row) => {
      return Cypress.$(row).find('td').text().includes(workspaceName);
    })
    .find('a.euiLink')
    .click();
});

// Command to measure component performance and compare with baseline
// Exampele - cy.measureComponentPerformance({
//   page: 'discover',
//   componentTestId: 'docTable',
//   eventName: 'onLoadSavedQuery',
// });

Cypress.Commands.add('measureComponentPerformance', (opts) => {
  const { page, componentTestId, eventName, isDynamic = false } = opts;

  cy.readFile('cypress/utils/performance_baselines.json').then((baselines) => {
    const baseline = baselines[page][componentTestId][eventName];
    const fieldName = `${page}_${componentTestId}_${eventName}`;

    if (!baseline) {
      cy.log(`No baseline found for component: ${fieldName}`);
      return;
    }

    cy.window().then((win) => {
      win.performance.mark(`${fieldName}_start`);

      cy.get(`[data-test-subj="${componentTestId}"]`).as('component');

      cy.get('@component')
        .should('exist')
        .then(($el) => {
          // Check if finalRenderSelector is provided (indicating a dynamic component)
          if (isDynamic) {
            return new Cypress.Promise((resolve) => {
              const observer = new MutationObserver(() => {
                observer.disconnect();
                resolve();
              });

              observer.observe($el[0], { childList: true, subtree: true });

              // Fallback: If no changes detected in 3s, assume it's rendered
              setTimeout(() => {
                observer.disconnect();
                resolve();
              }, 3000);
            });
          }
        });

      // Now measure time
      cy.window().then((win) => {
        win.performance.mark(`${fieldName}_end`);
        win.performance.measure(
          `${fieldName}_render_time`,
          `${fieldName}_start`,
          `${fieldName}_end`
        );

        const measures = win.performance.getEntriesByName(`${fieldName}_render_time`);
        if (measures.length > 0) {
          const renderTime = measures[0].duration;
          cy.log(`Render Time: ${renderTime.toFixed(2)}ms`);

          if (renderTime > baseline.render_time) {
            cy.task('logPerformance', {
              metric: `${fieldName}_render_time`,
              value: `exceeded: ${renderTime.toFixed(2)}ms > ${baseline.render_time}ms`,
            });
          }
        } else {
          cy.log('⚠️ Render time measurement failed.');
        }
      });
    });
  });
}); 
  
Cypress.Commands.add('setAdvancedSetting', (changes) => {
  const url = `${Cypress.config().baseUrl}/api/opensearch-dashboards/settings`;

  return cy
    .request({
      method: 'POST',
      url,
      headers: {
        'content-type': 'application/json;charset=UTF-8',
        'osd-xsrf': true,
      },
      body: { changes }, // This is the key change - wrapping in changes object
      failOnStatusCode: false,
    })
    .then((response) => {
      if (response.status === 400) {
        throw new Error(`Bad request: ${response.body.message}`);
      }
      if (response.body.errors) {
        console.error(response.body.items);
        throw new Error('Setting advanced setting failed');
      }
    });
});

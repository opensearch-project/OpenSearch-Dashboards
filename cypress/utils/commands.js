/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export const ADMIN_AUTH = {
  username: Cypress.env('username'),
  password: Cypress.env('password'),
  set newUser(changedUsername) {
    this.username = changedUsername;
  },
  set newPassword(changedPassword) {
    this.password = changedPassword;
  },
};

export const CURRENT_TENANT = {
  defaultTenant: 'private',
  set newTenant(changedTenant) {
    this.defaultTenant = changedTenant;
  },
};

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
  cy.visit('/app/workspace_list');
  cy.get('.euiBasicTable')
    .find('tr')
    .filter((index, row) => {
      return Cypress.$(row).find('td').text().includes(workspaceName);
    })
    .find('a.euiLink')
    .click();
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
      body: { changes },
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

export const supressNoRequestOccurred = () => {
  cy.on('fail', (err) => {
    if (err.message.includes('No request ever occurred.')) return false;
  });
};

Cypress.Commands.overwrite('visit', (orig, url, options) => {
  if (Cypress.env('SECURITY_ENABLED')) {
    let newOptions = options;
    const waitForGetTenant = options && options.waitForGetTenant;
    if (options) {
      newOptions.auth = ADMIN_AUTH;
    } else {
      newOptions = {
        auth: ADMIN_AUTH,
      };
    }
    if (!newOptions.excludeTenant) {
      newOptions.qs = {
        ...newOptions.qs,
        security_tenant: CURRENT_TENANT.defaultTenant,
      };
    }

    if (waitForGetTenant) {
      cy.intercept('GET', '/api/v1/multitenancy/tenant*').as('getTenant');
      orig(url, newOptions);
      supressNoRequestOccurred();
      cy.wait('@getTenant');
    } else {
      orig(url, newOptions);
    }
  } else {
    orig(url, options);
  }
});

Cypress.Commands.overwrite('request', (originalFn, ...args) => {
  const defaults = {};
  if (Cypress.env('SECURITY_ENABLED')) {
    defaults.auth = ADMIN_AUTH;
  }

  let options = {};
  if (typeof args[0] === 'object' && args[0] !== null) {
    options = { ...args[0] };
  } else if (args.length === 1) {
    [options.url] = args;
  } else if (args.length === 2) {
    [options.method, options.url] = args;
  } else if (args.length === 3) {
    [options.method, options.url, options.body] = args;
  }
  console.log('Cypress request options:', { ...defaults, ...options });
  return originalFn({ ...defaults, ...options });
});

Cypress.Commands.add('login', () => {
  // much faster than log in through UI
  cy.request({
    method: 'POST',
    url: `${PATHS.BASE}/auth/login`,
    body: ADMIN_AUTH,
    headers: {
      'osd-xsrf': true,
    },
  });
});

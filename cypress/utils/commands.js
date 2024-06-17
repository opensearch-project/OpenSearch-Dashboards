/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BASE_PATH } from './constants';

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
  defaultTenant: 'global',
  set newTenant(changedTenant) {
    this.defaultTenant = changedTenant;
  },
};

export const supressNoRequestOccurred = () => {
  cy.on('fail', (err) => {
    if (err.message.includes('No request ever occurred.')) return false;
  });
};

// TODO: Add commands to ./index.d.ts for IDE discoverability

/**
 * This overwrites the default visit command to authenticate before visiting
 * webpages if SECURITY_ENABLED cypress env var is true
 */
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
      cy.intercept('GET', '/api/v1/multitenancy/tenant').as('getTenant');
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

/**
 * Overwrite request command to support authentication similar to visit.
 * The request function parameters can be url, or (method, url), or (method, url, body).
 */
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

  return originalFn({ ...defaults, ...options });
});

Cypress.Commands.add('login', () => {
  // much faster than log in through UI
  cy.request({
    method: 'POST',
    url: `${BASE_PATH}/auth/login`,
    body: ADMIN_AUTH,
    headers: {
      'osd-xsrf': true,
    },
  });
});

// This function does not delete all indices
Cypress.Commands.add('deleteAllIndices', () => {
  cy.log('Deleting all indices');
  cy.request(
    'DELETE',
    `${Cypress.env('openSearchUrl')}/index*,sample*,opensearch_dashboards*,test*,cypress*`
  );
});

Cypress.Commands.add('getIndexSettings', (index) => {
  cy.request('GET', `${Cypress.env('openSearchUrl')}/${index}/_settings`);
});

Cypress.Commands.add('updateIndexSettings', (index, settings) => {
  cy.request('PUT', `${Cypress.env('openSearchUrl')}/${index}/_settings`, settings);
});

Cypress.Commands.add('rollover', (target) => {
  cy.request('POST', `${Cypress.env('openSearchUrl')}/${target}/_rollover`);
});

// --- Typed commands --

Cypress.Commands.add('getElementByTestId', (testId, options = {}) => {
  return cy.get(`[data-test-subj="${testId}"]`, options);
});

Cypress.Commands.add('getElementsByTestIds', (testIds, options = {}) => {
  const selectors = [testIds].flat(Infinity).map((testId) => `[data-test-subj="${testId}"]`);
  return cy.get(selectors.join(','), options);
});

Cypress.Commands.add('whenTestIdNotFound', (testIds, callbackFn, options = {}) => {
  const selectors = [testIds].flat(Infinity).map((testId) => `[data-test-subj="${testId}"]`);
  cy.get('body', options).then(($body) => {
    if ($body.find(selectors.join(',')).length === 0) callbackFn();
  });
});

Cypress.Commands.add('deleteIndex', (indexName, options = {}) => {
  cy.request({
    method: 'DELETE',
    url: `${Cypress.env('openSearchUrl')}/${indexName}`,
    failOnStatusCode: false,
    ...options,
  });
});

Cypress.Commands.add('getIndices', (index = null, settings = {}) => {
  cy.request({
    method: 'GET',
    url: `${Cypress.env('openSearchUrl')}/_cat/indices/${index ? index : ''}`,
    failOnStatusCode: false,
    ...settings,
  });
});

// TODO: Impliment chunking
Cypress.Commands.add('bulkUploadDocs', (fixturePath, index) => {
  const sendBulkAPIRequest = (ndjson) => {
    const url = index
      ? `${Cypress.env('openSearchUrl')}/${index}/_bulk`
      : `${Cypress.env('openSearchUrl')}/_bulk`;
    cy.log('bulkUploadDocs')
      .request({
        method: 'POST',
        url,
        headers: {
          'content-type': 'application/json;charset=UTF-8',
          'osd-xsrf': true,
        },
        body: ndjson,
      })
      .then((response) => {
        if (response.body.errors) {
          console.error(response.body.items);
          throw new Error('Bulk upload failed');
        }
      });
  };

  cy.fixture(fixturePath, 'utf8').then((ndjson) => {
    sendBulkAPIRequest(ndjson);
  });

  cy.request({
    method: 'POST',
    url: `${Cypress.env('openSearchUrl')}/_all/_refresh`,
  });
});

Cypress.Commands.add('importSavedObjects', (fixturePath, overwrite = true) => {
  const sendImportRequest = (ndjson) => {
    const url = `${Cypress.config().baseUrl}/api/saved_objects/_import?${
      overwrite ? `overwrite=true` : ''
    }`;

    const formData = new FormData();
    formData.append('file', ndjson, 'savedObject.ndjson');

    cy.log('importSavedObject')
      .request({
        method: 'POST',
        url,
        headers: {
          'content-type': 'multipart/form-data',
          'osd-xsrf': true,
        },
        body: formData,
      })
      .then((response) => {
        if (response.body.errors) {
          console.error(response.body.items);
          throw new Error('Import failed');
        }
      });
  };

  cy.fixture(fixturePath)
    .then((file) => Cypress.Blob.binaryStringToBlob(file))
    .then((ndjson) => {
      sendImportRequest(ndjson);
    });
});

Cypress.Commands.add('deleteSavedObject', (type, id, options = {}) => {
  const url = `${Cypress.config().baseUrl}/api/saved_objects/${type}/${id}`;

  return cy.request({
    method: 'DELETE',
    url,
    headers: {
      'osd-xsrf': true,
    },
    failOnStatusCode: false,
    ...options,
  });
});

Cypress.Commands.add('deleteSavedObjectByType', (type, search) => {
  const searchParams = new URLSearchParams({
    fields: 'id',
    type,
  });

  if (search) {
    searchParams.set('search', search);
  }

  const url = `${
    Cypress.config().baseUrl
  }/api/opensearch-dashboards/management/saved_objects/_find?${searchParams.toString()}`;

  return cy.request(url).then((response) => {
    console.log('response', response);
    response.body.saved_objects.map(({ type, id }) => {
      cy.deleteSavedObject(type, id);
    });
  });
});

Cypress.Commands.add('createIndexPattern', (id, attributes, header = {}) => {
  const url = `${Cypress.config().baseUrl}/api/saved_objects/index-pattern/${id}`;

  cy.request({
    method: 'POST',
    url,
    headers: {
      'content-type': 'application/json;charset=UTF-8',
      'osd-xsrf': true,
      ...header,
    },
    body: JSON.stringify({
      attributes,
      references: [],
    }),
  });
});

Cypress.Commands.add('createDashboard', (attributes = {}, headers = {}) => {
  const url = `${Cypress.config().baseUrl}/api/saved_objects/dashboard`;

  cy.request({
    method: 'POST',
    url,
    headers: {
      'content-type': 'application/json;charset=UTF-8',
      'osd-xsrf': true,
      ...headers,
    },
    body: JSON.stringify({
      attributes,
    }),
  });
});

Cypress.Commands.add('changeDefaultTenant', (attributes, header = {}) => {
  const url = Cypress.env('openSearchUrl') + '/_plugins/_security/api/tenancy/config';

  cy.request({
    method: 'PUT',
    url,
    headers: {
      'content-type': 'application/json;charset=UTF-8',
      'osd-xsrf': true,
      ...header,
    },
    body: JSON.stringify(attributes),
  });
});

Cypress.Commands.add('deleteIndexPattern', (id, options = {}) =>
  cy.deleteSavedObject('index-pattern', id, options)
);

Cypress.Commands.add('setAdvancedSetting', (changes) => {
  const url = `${Cypress.config().baseUrl}/api/opensearch-dashboards/settings`;
  cy.log('setAdvancedSetting')
    .request({
      method: 'POST',
      url,
      qs: Cypress.env('SECURITY_ENABLED')
        ? {
            security_tenant: CURRENT_TENANT.defaultTenant,
          }
        : {},
      headers: {
        'content-type': 'application/json;charset=UTF-8',
        'osd-xsrf': true,
      },
      body: { changes },
    })
    .then((response) => {
      if (response.body.errors) {
        console.error(response.body.items);
        throw new Error('Setting advanced setting failed');
      }
    });
});

Cypress.Commands.add('drag', { prevSubject: true }, (source, targetSelector) => {
  const opts = { log: false };
  const dataTransfer = new DataTransfer();
  const DELAY = 5; // in ms
  const MAX_TRIES = 3;
  const initalRect = source.get(0).getBoundingClientRect();
  let target;
  let count = 0;
  let moved = false;

  const log = Cypress.log({
    name: 'Drag and Drop',
    displayName: 'drag',
    type: 'child',
    autoEnd: false,
    message: targetSelector,
  });

  const getHasMoved = () => {
    const currentRect = source.get(0).getBoundingClientRect();

    return !(initalRect.top === currentRect.top && initalRect.left === currentRect.left);
  };

  const dragOver = () => {
    if (count < MAX_TRIES && !moved) {
      count += 1;
      return cy
        .wrap(target, opts)
        .trigger('dragover', {
          dataTransfer,
          eventConstructor: 'DragEvent',
          ...opts,
        })
        .wait(DELAY, opts)
        .then(() => {
          moved = getHasMoved();
          return dragOver();
        });
    } else {
      return true;
    }
  };

  cy.get(targetSelector, opts)
    .then((targetEle) => {
      target = targetEle;

      return target;
    })
    .then(() => {
      return cy.wrap(source, opts).trigger('dragstart', {
        dataTransfer,
        eventConstructor: 'DragEvent',
        ...opts,
      });
    })
    .then(() => dragOver())
    .then(() => {
      return cy.wrap(target, opts).trigger('drop', {
        dataTransfer,
        eventConstructor: 'DragEvent',
        ...opts,
      });
    })
    .then(() => {
      log.end();
    });
});

// type: logs, ecommerce, flights
Cypress.Commands.add('loadSampleData', (type) => {
  cy.request({
    method: 'POST',
    headers: { 'osd-xsrf': 'opensearch-dashboards' },
    url: `${BASE_PATH}/api/sample_data/${type}`,
  });
});

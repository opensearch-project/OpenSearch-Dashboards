/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import initCommandNamespace from './command_namespace';
import { DATASOURCE_NAME } from './apps/explore/constants';
import { setDatePickerDatesAndSearchIfRelevant } from './apps/explore/shared';
import { PATHS } from './constants';

/**
 * This file houses all the commands specific to Explore. For commands that are used across the project please move it to the general commands file
 */

initCommandNamespace(cy, 'explore');

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

const forceFocusEditor = () => {
  return cy
    .get('[data-test-subj="exploreQueryPanelEditor"] .react-monaco-editor-container')
    .click({ force: true })
    .wait(200) // Give editor time to register focus
    .get('.inputarea')
    .first()
    .focus()
    .wait(200); // Wait for focus to take effect
};

const clearMonacoEditor = () => {
  return cy
    .get('[data-test-subj="exploreQueryPanelEditor"] .react-monaco-editor-container')
    .should('exist')
    .should('be.visible')
    .then(() => {
      // First ensure we have focus
      return forceFocusEditor().then(() => {
        // Try different key combinations for selection
        return cy
          .get('.inputarea')
          .first()
          .type('{ctrl}a', { force: true })
          .wait(100)
          .type('{backspace}', { force: true })
          .wait(100)
          .type('{meta}a', { force: true })
          .wait(100)
          .type('{backspace}', { force: true });
      });
    });
};

const isEditorEmpty = () => {
  return cy
    .get('[data-test-subj="exploreQueryPanelEditor"] .react-monaco-editor-container')
    .find('.view-line')
    .invoke('text')
    .then((text) => text.trim() === '');
};

cy.explore.add('clearQueryEditor', () => {
  const clearWithRetry = (attempt = 1) => {
    cy.log(`Attempt ${attempt} to clear editor`);

    return forceFocusEditor()
      .then(() => clearMonacoEditor())
      .then(() => {
        return isEditorEmpty().then((isEmpty) => {
          cy.log(`is editor empty: ${isEmpty}`);

          if (isEmpty) {
            return; // Editor is cleared, we're done
          }

          if (attempt < MAX_RETRIES) {
            cy.log(`Editor not cleared, retrying... (attempt ${attempt})`);
            cy.wait(RETRY_DELAY); // Wait before next attempt
            return clearWithRetry(attempt + 1);
          } else {
            cy.log('Failed to clear editor after all attempts');
            // Instead of throwing error, try one last time with extra waiting
            return cy.wait(2000).then(forceFocusEditor).then(clearMonacoEditor);
          }
        });
      });
  };

  return clearWithRetry();
});

cy.explore.add('setQueryEditor', (value, options = {}) => {
  const defaults = {
    submit: true,
    escape: false,
  };

  const { submit = defaults.submit, escape = defaults.escape, ...typeOptions } = options;

  Cypress.log({
    name: 'setQueryEditor',
    displayName: 'set query',
    message: value,
  });

  // On a new session, a syntax helper popover appears, which obstructs the typing within the query
  // editor. Clicking on a random element removes the popover.
  cy.getElementByTestId('headerGlobalNav').should('be.visible').click();

  // clear the editor first and then set
  cy.explore.clearQueryEditor().then(() => {
    return cy
      .get('.inputarea')
      .first()
      .should('be.visible')
      .wait(200)
      .type(escape ? `${value}{esc}` : value, {
        delay: 40,
        force: true,
        ...typeOptions, // Pass through all other options to type command
      });
  });

  if (submit) {
    cy.explore.updateTopNav({ log: false });
  }
});

cy.explore.add('setTopNavDate', (start, end, submit = true) => {
  cy.osd.ensureTopNavExists();

  // cy.wait(3000);

  const opts = { log: false };

  Cypress.log({
    name: 'setTopNavDate',
    displayName: 'set date',
    message: `Start: ${start} :: End: ${end}`,
  });

  /* Find any one of the two buttons that change/open the date picker:
   *   * if `superDatePickerShowDatesButton` is found, it will switch the mode to dates
   *      * in some versions of OUI, the switch will open the date selection dialog as well
   *   * if `superDatePickerstartDatePopoverButton` is found, it will open the date selection dialog
   */
  cy.getElementsByTestIds(
    ['superDatePickerstartDatePopoverButton', 'superDatePickerShowDatesButton'],
    opts
  )
    .should('be.visible')
    .invoke('attr', 'data-test-subj')
    .then((testId) => {
      cy.getElementByTestId(testId, opts).should('be.visible').click(opts);
    });

  /* While we surely are in the date selection mode, we don't know if the date selection dialog
   * is open or not. Looking for a tab and if it is missing, click on the dialog opener.
   */
  cy.whenTestIdNotFound('superDatePickerAbsoluteTab', () => {
    cy.getElementByTestId('superDatePickerstartDatePopoverButton', opts)
      .should('be.visible')
      .click(opts);
  });

  // Click absolute tab
  cy.getElementByTestId('superDatePickerAbsoluteTab', opts).click(opts);

  // Type absolute start date
  cy.getElementByTestId('superDatePickerAbsoluteDateInput', opts)
    .click(opts)
    .clear(opts)
    .type(start, {
      ...opts,
      delay: 0, // add a delay here, cypress sometimes fails to type all the content into the input.
    });

  // Click end date
  cy.getElementByTestId('superDatePickerendDatePopoverButton', opts).last(opts).click(opts);

  // Click absolute tab
  cy.getElementByTestId('superDatePickerAbsoluteTab', opts).last(opts).click(opts);

  // Type absolute end date
  cy.getElementByTestId('superDatePickerAbsoluteDateInput', opts)
    .last(opts)
    .click(opts)
    .clear(opts)
    .type(end, {
      ...opts,
      delay: 0, // add a delay here, cypress sometimes fails to type all the content into the input.
    });

  // Close popup
  cy.getElementByTestId('superDatePickerendDatePopoverButton', opts).click(opts);

  if (submit) {
    cy.explore.updateTopNav(opts);
  }
});

cy.explore.add('setRelativeTopNavDate', (time, timeUnit) => {
  cy.osd.ensureTopNavExists();

  // cy.wait(3000);

  const opts = { log: false };

  /* Find any one of the two buttons that change/open the date picker:
   *   * if `superDatePickerShowDatesButton` is found, it will switch the mode to dates
   *      * in some versions of OUI, the switch will open the date selection dialog as well
   *   * if `superDatePickerstartDatePopoverButton` is found, it will open the date selection dialog
   */
  cy.getElementsByTestIds(
    ['superDatePickerstartDatePopoverButton', 'superDatePickerShowDatesButton'],
    opts
  )
    .should('be.visible')
    .invoke('attr', 'data-test-subj')
    .then((testId) => {
      cy.getElementByTestId(testId, opts).should('be.visible').click(opts);
    });

  /* While we surely are in the date selection mode, we don't know if the date selection dialog
   * is open or not. Looking for a tab and if it is missing, click on the dialog opener.
   */
  cy.whenTestIdNotFound('superDatePickerAbsoluteTab', () => {
    cy.getElementByTestId('superDatePickerstartDatePopoverButton', opts)
      .should('be.visible')
      .click(opts);
  });

  // Click absolute tab
  cy.getElementByTestId('superDatePickerRelativeTab', opts).click(opts);

  cy.getElementByTestId('superDatePickerRelativeDateInputNumber').clear().type(time);
  cy.getElementByTestId('superDatePickerRelativeDateInputUnitSelector').select(timeUnit);
  cy.getElementByTestId('exploreQueryExecutionButton').click();
});

cy.explore.add('updateTopNav', (options) => {
  cy.getElementByTestId('exploreQueryExecutionButton', options).click({ force: true });
});

cy.explore.add(
  'saveQuery',
  (name, description = ' ', includeFilters = true, includeTimeFilter = false) => {
    cy.whenTestIdNotFound('saved-query-management-popover', () => {
      cy.getElementByTestId('queryPanelFooterSaveQueryButton').click();
    });
    cy.getElementByTestId('saved-query-management-save-button').click();

    cy.getElementByTestId('saveQueryFormTitle').type(name);
    cy.getElementByTestId('saveQueryFormDescription').type(description);

    if (includeFilters !== true) {
      cy.getElementByTestId('saveQueryFormIncludeFiltersOption').click();
    }

    if (includeTimeFilter !== false) {
      cy.getElementByTestId('saveQueryFormIncludeTimeFilterOption').click();
    }

    // The force is necessary as there is occasionally a popover that covers the button
    cy.getElementByTestId('savedQueryFormSaveButton').click({ force: true });
    cy.getElementByTestId('euiToastHeader').contains('was saved').should('be.visible');
  }
);

cy.explore.add(
  'updateSavedQuery',
  (name = '', saveAsNewQuery = false, includeFilters = true, includeTimeFilter = false) => {
    cy.whenTestIdNotFound('saved-query-management-popover', () => {
      cy.getElementByTestId('queryPanelFooterSaveQueryButton').click();
    });
    cy.getElementByTestId('saved-query-management-save-button').click();

    if (saveAsNewQuery) {
      cy.getElementByTestId('saveAsNewQueryCheckbox')
        .parent()
        .find('[class="euiCheckbox__label"]')
        .click();
      cy.getElementByTestId('saveQueryFormTitle').should('not.be.disabled').type(name);

      // Selecting the saveAsNewQuery element deselects the include time filter option.
      if (includeTimeFilter === true) {
        cy.getElementByTestId('saveQueryFormIncludeTimeFilterOption').click();
      }
    } else if (saveAsNewQuery === false) {
      // defaults to not selected.

      if (includeTimeFilter !== true) {
        cy.getElementByTestId('saveQueryFormIncludeTimeFilterOption').click();
      }
    }

    if (includeFilters !== true) {
      // Always defaults to selected.
      cy.getElementByTestId('saveQueryFormIncludeFiltersOption').click();
    }

    // The force is necessary as there is occasionally a popover that covers the button
    cy.getElementByTestId('savedQueryFormSaveButton').click({ force: true });
    cy.getElementByTestId('euiToastHeader').contains('was saved').should('be.visible');
    cy.osd.waitForSync();
  }
);

cy.explore.add('loadSavedQuery', (name) => {
  cy.getElementByTestId('queryPanelFooterSaveQueryButton').click();

  cy.getElementByTestId('saved-query-management-open-button').click();

  cy.getElementByTestId('euiFlyoutCloseButton').parent().contains(name).should('exist').click();
  // click button through popover
  cy.getElementByTestId('open-query-action-button').click({ force: true });
});

cy.explore.add('clearSavedQuery', () => {
  cy.whenTestIdNotFound('saved-query-management-popover', () => {
    cy.getElementByTestId('queryPanelFooterSaveQueryButton').click();
  });
  //clear save queries
  cy.getElementByTestId('saved-query-management-clear-button').click();
});

cy.explore.add('deleteSavedQuery', (name) => {
  cy.getElementByTestId('queryPanelFooterSaveQueryButton').click();

  cy.getElementByTestId('saved-query-management-open-button').click();
  cy.getElementByTestId('euiFlyoutCloseButton')
    .parent()
    .contains(name)
    .findElementByTestId('deleteSavedQueryButton')
    .click();

  cy.getElementByTestId('confirmModalConfirmButton').click();
  cy.osd.waitForSync();
});

cy.explore.add('setDataset', (dataset, dataSourceName, type) => {
  cy.intercept('GET', '**/api/assistant/agent_config*', (req) => {
    req.continue((res) => {
      if (res.statusCode === 404) {
        res.send(200, { status: 'ok', data: {} });
      }
    });
  }).as('agentConfigRequest');

  switch (type) {
    case 'INDEX_PATTERN':
      cy.explore.setIndexPatternAsDataset(dataset, dataSourceName);
      break;
    case 'INDEXES':
      cy.explore.setIndexAsDataset(dataset, dataSourceName);
      break;
    default:
      throw new Error(`setIndexPatternAsDataset encountered unknown type: ${type}`);
  }

  cy.wait(3000);
});

cy.explore.add(
  'setIndexAsDataset',
  (index, dataSourceName, language, timeFieldName = 'timestamp', finalAction = 'submit') => {
    cy.intercept('GET', '**/api/assistant/agent_config*', (req) => {
      req.continue((res) => {
        if (res.statusCode === 404) {
          res.send(200, { status: 'ok', data: {} });
        }
      });
    }).as('agentConfigRequest');

    cy.getElementByTestId('datasetSelectButton')
      .should('be.visible')
      .should('not.be.disabled')
      .click();
    cy.getElementByTestId(`datasetSelectAdvancedButton`).should('be.visible').click();
    cy.get(`[title="Indexes"]`).click();
    cy.get(`[title="${dataSourceName}"]`).click();
    cy.getElementByTestId('dataset-index-selector')
      .find('[data-test-subj="comboBoxInput"]')
      .click();
    // this element is sometimes dataSourceName masked by another element
    cy.get(`[title="${index}"]`).should('be.visible').click({ force: true });
    cy.getElementByTestId('datasetSelectorNext').should('be.visible').click();

    if (language) {
      cy.getElementByTestId('advancedSelectorLanguageSelect').should('be.visible').select(language);
    }

    cy.getElementByTestId('advancedSelectorTimeFieldSelect')
      .should('be.visible')
      .select(timeFieldName);
    if (finalAction === 'submit') {
      cy.getElementByTestId('advancedSelectorConfirmButton').should('be.visible').click();

      // verify that it has been selected
      cy.getElementByTestId('datasetSelectButton').should('contain.text', `${index}`);
    } else {
      cy.get('[type="button"]').contains('Cancel').click();
    }
    cy.wait(3000);
  }
);

cy.explore.add('setIndexPatternAsDataset', (indexPattern) => {
  cy.intercept('GET', '**/api/assistant/agent_config*', (req) => {
    req.continue((res) => {
      if (res.statusCode === 404) {
        res.send(200, { status: 'ok', data: {} });
      }
    });
  }).as('agentConfigRequest');

  cy.getElementByTestId('datasetSelectButton')
    .should('be.visible')
    .should('not.be.disabled')
    .click();
  cy.getElementByTestId(`datasetSelectOption-${indexPattern}`).should('be.visible').click();

  // verify that it has been selected
  cy.getElementByTestId('datasetSelectButton').should('contain.text', `${indexPattern}`);

  cy.wait(3000);
});

cy.explore.add(
  'setIndexPatternFromAdvancedSelector',
  (indexPattern, language, finalAction = 'submit') => {
    cy.intercept('GET', '**/api/assistant/agent_config*', (req) => {
      req.continue((res) => {
        if (res.statusCode === 404) {
          res.send(200, { status: 'ok', data: {} });
        }
      });
    }).as('agentConfigRequest');

    cy.getElementByTestId('datasetSelectButton')
      .should('be.visible')
      .should('not.be.disabled')
      .click();
    cy.getElementByTestId(`datasetSelectAdvancedButton`).should('be.visible').click();
    cy.get(`[title="Index Patterns"]`).click();

    cy.getElementByTestId('datasetExplorerWindow')
      .find(`[title="${indexPattern}"]`)
      .should('be.visible')
      .click({ force: true });
    cy.getElementByTestId('datasetSelectorNext').should('be.visible').click();

    if (language) {
      cy.getElementByTestId('advancedSelectorLanguageSelect').should('be.visible').select(language);
    }

    if (finalAction === 'submit') {
      cy.getElementByTestId('advancedSelectorConfirmButton').should('be.visible').click();

      // verify that it has been selected
      cy.getElementByTestId('datasetSelectButton').should('contain.text', `${indexPattern}`);
    } else {
      cy.get('[type="button"]').contains('Cancel').click();
    }
    cy.wait(3000);
  }
);

cy.explore.add('createVisualizationWithQuery', (query, chartType, datasetName) => {
  cy.explore.clearQueryEditor();
  cy.explore.setDataset(datasetName, DATASOURCE_NAME, 'INDEX_PATTERN');
  setDatePickerDatesAndSearchIfRelevant('PPL');
  cy.wait(2000);
  cy.explore.setQueryEditor(query);
  // Run the query
  cy.getElementByTestId('exploreQueryExecutionButton').click();
  cy.osd.waitForLoader(true);
  cy.wait(1000);
  cy.getElementByTestId('exploreVisualizationLoader').should('be.visible');

  // Ensure chart type is correct

  cy.getElementByTestId('exploreVisStylePanel')
    .should('be.visible')
    .within(() => {
      cy.getElementByTestId('exploreChartTypeSelector').should('be.visible').click();
    });

  // for pie and area, it needs manual chart type switch
  if (chartType === 'Pie' || chartType === 'Area') {
    cy.get('.euiContextMenuItem.euiSuperSelect__item')
      .contains(chartType)
      .should('be.visible')
      .click();

    // need to open again after switching chart type
    cy.getElementByTestId('exploreVisStylePanel')
      .should('be.visible')
      .within(() => {
        cy.getElementByTestId('exploreChartTypeSelector').should('be.visible').click();
      });
  }

  // Ensure chart type is correct
  cy.get('[role="option"][aria-selected="true"]')
    .should('be.visible')
    .and('contain.text', chartType);
  cy.get('body').click(0, 0);
  cy.getElementByTestId('exploreVisStylePanel').should('be.visible');
});

cy.explore.add('setupWorkspaceAndDataSourceWithTraces', (workspaceName, traceIndices) => {
  // Load trace test data
  cy.osd.setupTestData(
    PATHS.SECONDARY_ENGINE,
    traceIndices.map((index) => `cypress/fixtures/explore/traces/${index}.mapping.json`),
    traceIndices.map((index) => `cypress/fixtures/explore/traces/${index}.data.ndjson`)
  );

  // Add data source
  cy.osd.addDataSource({
    name: DATASOURCE_NAME,
    url: PATHS.SECONDARY_ENGINE,
    authType: 'no_auth',
  });

  // delete any old workspaces and potentially conflicting one
  cy.deleteWorkspaceByName(workspaceName);
  cy.osd.deleteAllOldWorkspaces();

  cy.visit('/app/home');
  cy.osd.createInitialWorkspaceWithDataSource(DATASOURCE_NAME, workspaceName);
});

cy.explore.add('cleanupWorkspaceAndDataSourceAndTraces', (workspaceName, traceIndices) => {
  cy.deleteWorkspaceByName(workspaceName);
  cy.osd.deleteDataSourceByName(DATASOURCE_NAME);
  for (const index of traceIndices) {
    cy.osd.deleteIndex(index);
  }
});

cy.explore.add(
  // Creates an index pattern within the workspace using cluster
  // Don't use * in the indexPattern it adds it by default at the end of name
  'createWorkspaceDataSets',
  (opts) => {
    const {
      workspaceName,
      indexPattern,
      timefieldName,
      indexPatternHasTimefield = true,
      dataSource,
      isEnhancement = false,
      signalType = 'logs',
      language = null, // Optional language parameter
    } = opts;

    // Step 1 - Navigate to datasets page
    cy.osd.navigateToWorkSpaceSpecificPage({
      workspaceName,
      page: 'datasets',
      isEnhancement,
    });

    // There is a bug in Neo where the header of the index pattern page has the home page's header. Happens only in cypress
    // Therefore it is unreliable to leverage the "create" button to navigate to this page
    if (Cypress.env('CYPRESS_RUNTIME_ENV') === 'neo') {
      cy.get('@WORKSPACE_ID').then((workspaceId) => {
        cy.visit(`/w/${workspaceId}/app/indexPatterns/create`);
      });
    } else {
      // Navigate to Workspace Specific IndexPattern Page
      cy.osd.navigateToWorkSpaceSpecificPage({
        workspaceName,
        page: 'datasets',
        isEnhancement,
      });

      // Adding a wait here as sometimes the button doesn't click below
      cy.wait(2000);

      // Step 2 - Click create dataset button
      cy.getElementByTestId('createDatasetButton').should('exist').should('be.visible');
      cy.getElementByTestId('createDatasetButton').click({ force: true });

      // Step 3 - Select signal type (logs or traces)
      if (signalType === 'logs') {
        cy.getElementByTestId('createLogsDataset').should('be.visible').click({ force: true });
      }

      if (signalType === 'traces') {
        cy.getElementByTestId('createTracesDataset').should('be.visible').click({ force: true });
      }
    }

    // Step 4 - Select Indexes
    cy.get(`[title="Indexes"]`).should('be.visible');
    cy.get(`[title="Indexes"]`).click();

    // Step 5 - Select data source
    cy.get(`[title="${dataSource}"]`).should('be.visible');
    cy.get(`[title="${dataSource}"]`).click();

    // Step 6 - Select index scope (Index wildcard)
    cy.getElementByTestId('index-scope-selector')
      .should('be.visible')
      .find('[data-test-subj="comboBoxInput"]')
      .click();

    cy.get(`[title="Index wildcard"]`).should('be.visible').click({ force: true });

    // Step 7 - Enter index pattern
    cy.getElementByTestId('dataset-prefix-selector')
      .should('be.visible')
      .find('[data-test-subj="comboBoxInput"]')
      .click();

    cy.getElementByTestId('dataset-prefix-selector')
      .should('be.visible')
      .find('[data-test-subj="comboBoxSearchInput"]')
      .clear()
      .type(`${indexPattern}*{enter}`);

    // Step 8 - Click Next button
    cy.getElementByTestId('datasetSelectorNext')
      .should('be.visible')
      .should('not.be.disabled')
      .click();

    // Step 9 - Select language (if provided)
    if (language) {
      cy.getElementByTestId('advancedSelectorLanguageSelect').should('be.visible').select(language);
    }

    // Step 10 - Wait for time field selector if needed
    if (indexPatternHasTimefield || timefieldName) {
      cy.getElementByTestId('advancedSelectorTimeFieldSelect').should('be.visible');
    }

    // Step 11 - Select time field
    if (indexPatternHasTimefield && !!timefieldName) {
      cy.getElementByTestId('advancedSelectorTimeFieldSelect')
        .should('be.visible')
        .select(timefieldName);
    } else if (indexPatternHasTimefield && !timefieldName) {
      cy.getElementByTestId('advancedSelectorTimeFieldSelect').select(
        "I don't want to use the time filter"
      );
    }

    // Step 12 - Set up intercept to capture dataset creation response
    cy.intercept('POST', '**/api/saved_objects/index-pattern/**').as('createDatasetInterception');

    // Step 13 - Click Confirm button
    cy.getElementByTestId('advancedSelectorConfirmButton')
      .should('be.visible')
      .should('not.be.disabled')
      .click();

    // Step 14 - Wait for dataset creation request and save ID
    cy.wait('@createDatasetInterception', { timeout: 15000 }).then((interception) => {
      // Save the created index pattern ID as an alias
      cy.wrap(interception.response.body.id).as('INDEX_PATTERN_ID');
    });

    cy.wait(3000);

    // Step 15 - Verify page title contains the index pattern
    cy.getElementByTestId('headerApplicationTitle').should('contain', indexPattern);
  }
);

/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Dashboard Sections CRUD integration tests.
 *
 * Requires OSD started with --dashboard.allowDashboardSections=true.
 *
 * Does NOT use workspaces — navigates directly to the global dashboards
 * app to avoid index-pattern setup requirements.
 */

const DASHBOARD_NAME_PREFIX = 'Cy Sections';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const navigateToDashboards = () => {
  cy.visit('/app/dashboards#/list');
  cy.getElementByTestId('newItemButton', { timeout: 30000 }).should('be.visible');
};

const createNewDashboard = () => {
  navigateToDashboards();
  cy.getElementByTestId('newItemButton').scrollIntoView().click({ force: true });
  // Wait for edit mode (save button visible)
  cy.getElementByTestId('dashboardSaveMenuItem', { timeout: 15000 }).should('be.visible');
};

const saveDashboard = (name) => {
  cy.getElementByTestId('dashboardSaveMenuItem').click();
  cy.getElementByTestId('savedObjectTitle').clear().type(name);
  cy.getElementByTestId('confirmSaveSavedObjectButton').click();
  cy.contains('was saved', { timeout: 15000 }).should('be.visible');
};

/**
 * Click the "Add" icon in the top nav to open the add-panel popover,
 * then click "Section" to add a new section.
 *
 * Requires `home:useNewHomePage=true` in the OSD config.
 * In the new top nav, "Add" (dashboardAddPanelButton) opens the
 * EuiContextMenu popover which contains both viz types AND "Section".
 * In the legacy top nav (home:useNewHomePage=false), this button opens
 * the saved-objects flyout instead — no "Section" entry.
 */
const addSection = () => {
  cy.getElementByTestId('dashboardAddPanelButton').click({ force: true });
  cy.get('.euiContextMenuPanel', { timeout: 30000 })
    .should('be.visible')
    .contains('Section')
    .click();
  cy.getElementByTestId('dashboardSectionLayout', { timeout: 10000 }).should('exist');
};

/**
 * Get the section ID from the nth section's data-test-subj.
 */
const getSectionId = (index = 0) => {
  return cy
    .get('[data-test-subj^="dashboardSection-"]')
    .eq(index)
    .invoke('attr', 'data-test-subj')
    .then((attr) => attr.replace('dashboardSection-', ''));
};

const renameSection = (sectionId, newName) => {
  cy.getElementByTestId(`dashboardSectionMenuButton-${sectionId}`).click();
  cy.getElementByTestId(`dashboardSectionRename-${sectionId}`).click();
  cy.getElementByTestId('dashboardSectionRenameInput').clear().type(newName);
  cy.getElementByTestId('dashboardSectionRenameConfirm').click();
};

const deleteSection = (sectionId) => {
  cy.getElementByTestId(`dashboardSectionMenuButton-${sectionId}`).click();
  cy.getElementByTestId(`dashboardSectionDelete-${sectionId}`).click();
  cy.get('.euiModal').find('button').contains('Delete').click();
};

const ungroupSections = (sectionId) => {
  cy.getElementByTestId(`dashboardSectionMenuButton-${sectionId}`).click();
  cy.getElementByTestId(`dashboardSectionUngroupAll-${sectionId}`).click();
  cy.get('.euiModal').find('button').contains('Ungroup').click();
};

/**
 * Clean up all dashboards created by this test suite.
 */
const cleanupTestDashboards = () => {
  cy.request({
    method: 'POST',
    url: '/api/saved_objects/_find?type=dashboard&per_page=100',
    headers: { 'osd-xsrf': 'osd-fetch' },
    failOnStatusCode: false,
  }).then((resp) => {
    if (resp.status === 200 && resp.body.saved_objects) {
      resp.body.saved_objects
        .filter(
          (so) => so.attributes.title && so.attributes.title.startsWith(DASHBOARD_NAME_PREFIX)
        )
        .forEach((so) => {
          cy.request({
            method: 'DELETE',
            url: `/api/saved_objects/dashboard/${so.id}`,
            headers: { 'osd-xsrf': 'osd-fetch' },
            failOnStatusCode: false,
          });
        });
    }
  });
};

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('Dashboard Sections', () => {
  before(() => {
    // Create a dummy index pattern so OSD doesn't redirect to the
    // "Create index pattern" page in a fresh CI environment.
    cy.request({
      method: 'POST',
      url: '/api/saved_objects/index-pattern/cypress-sections-dummy',
      headers: { 'osd-xsrf': 'osd-fetch' },
      body: {
        attributes: {
          title: 'cypress-dummy-*',
          timeFieldName: 'timestamp',
        },
      },
      failOnStatusCode: false,
    });
  });

  after(() => {
    cleanupTestDashboards();
    cy.request({
      method: 'DELETE',
      url: '/api/saved_objects/index-pattern/cypress-sections-dummy',
      headers: { 'osd-xsrf': 'osd-fetch' },
      failOnStatusCode: false,
    });
  });

  describe('Section CRUD', () => {
    it('should add a section and see it on the dashboard', () => {
      createNewDashboard();
      addSection();

      cy.get('[data-test-subj^="dashboardSectionTitle-"]')
        .first()
        .should('contain.text', 'Section 1');
    });

    it('should add multiple sections', () => {
      createNewDashboard();
      addSection();
      addSection();

      cy.get('[data-test-subj^="dashboardSection-"]').should('have.length.gte', 2);
      cy.get('[data-test-subj^="dashboardSectionTitle-"]')
        .last()
        .should('contain.text', 'Section 2');
    });

    it('should rename a section', () => {
      createNewDashboard();
      addSection();

      getSectionId(0).then((sectionId) => {
        renameSection(sectionId, 'My Custom Section');
      });

      cy.get('[data-test-subj^="dashboardSectionTitle-"]')
        .first()
        .should('contain.text', 'My Custom Section');
    });

    it('should persist sections after save and reload', () => {
      createNewDashboard();
      addSection();

      getSectionId(0).then((sectionId) => {
        renameSection(sectionId, 'Persisted Section');
      });

      const dashName = `${DASHBOARD_NAME_PREFIX} Persist ${Date.now()}`;
      saveDashboard(dashName);

      // Reload the page
      cy.reload();

      cy.getElementByTestId('dashboardSectionLayout', { timeout: 30000 }).should('exist');
      cy.get('[data-test-subj^="dashboardSectionTitle-"]')
        .first()
        .should('contain.text', 'Persisted Section');
    });

    it('should delete a section', () => {
      createNewDashboard();
      addSection();
      addSection();

      cy.get('[data-test-subj^="dashboardSection-"]').should('have.length.gte', 2);

      getSectionId(1).then((sectionId) => {
        deleteSection(sectionId);
      });

      cy.get('[data-test-subj^="dashboardSection-"]').should('have.length', 1);
    });

    it('should ungroup sections and revert to flat GridLayout', () => {
      createNewDashboard();
      addSection();
      cy.getElementByTestId('dashboardSectionLayout').should('exist');

      getSectionId(0).then((sectionId) => {
        ungroupSections(sectionId);
      });

      cy.getElementByTestId('dashboardSectionLayout').should('not.exist');
    });
  });

  describe('Section collapse/expand', () => {
    it('should collapse and expand a section', () => {
      createNewDashboard();
      addSection();

      getSectionId(0).then((sectionId) => {
        // Collapse
        cy.getElementByTestId(`dashboardSectionToggle-${sectionId}`).click();
        cy.getElementByTestId(`dashboardSectionGrid-${sectionId}`).should('not.be.visible');

        // Expand
        cy.getElementByTestId(`dashboardSectionToggle-${sectionId}`).click();
        cy.getElementByTestId(`dashboardSectionGrid-${sectionId}`).should('be.visible');
      });
    });
  });

  describe('Section persistence', () => {
    it('should preserve collapse state after save and reload', () => {
      createNewDashboard();
      addSection();

      getSectionId(0).then((sectionId) => {
        cy.getElementByTestId(`dashboardSectionToggle-${sectionId}`).click();
        cy.getElementByTestId(`dashboardSectionGrid-${sectionId}`).should('not.be.visible');

        const dashName = `${DASHBOARD_NAME_PREFIX} Collapse ${Date.now()}`;
        saveDashboard(dashName);

        cy.reload();

        cy.getElementByTestId('dashboardSectionLayout', { timeout: 30000 }).should('exist');
        cy.getElementByTestId(`dashboardSectionGrid-${sectionId}`).should('not.be.visible');
      });
    });
  });
});

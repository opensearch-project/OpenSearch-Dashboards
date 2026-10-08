/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// Requires dashboard.allowDashboardSections and home:useNewHomePage.

const DASHBOARD_NAME_PREFIX = 'Cy Sections';

const navigateToDashboards = () => {
  cy.visit('/app/dashboards#/list');
  cy.getElementByTestId('newItemButton', { timeout: 30000 }).should('be.visible');
};

const createNewDashboard = () => {
  navigateToDashboards();
  cy.getElementByTestId('newItemButton').scrollIntoView().click({ force: true });
  cy.getElementByTestId('dashboardSaveMenuItem', { timeout: 15000 }).should('be.visible');
};

const saveDashboard = (name) => {
  cy.getElementByTestId('dashboardSaveMenuItem').click();
  cy.getElementByTestId('savedObjectTitle').clear().type(name);
  cy.getElementByTestId('confirmSaveSavedObjectButton').click();
  cy.contains('was saved', { timeout: 15000 }).should('be.visible');
};

const addSection = () => {
  cy.getElementByTestId('dashboardAddPanelButton').click({ force: true });
  cy.get('.euiContextMenuPanel', { timeout: 30000 })
    .should('be.visible')
    .contains('Section')
    .click();
  cy.getElementByTestId('dashboardSectionLayout', { timeout: 10000 }).should('exist');
};

const getSectionId = (index = 0) => {
  return cy
    .get('[data-test-subj^="dashboardSection-"]')
    .eq(index)
    .invoke('attr', 'data-test-subj')
    .then((attr) => attr.replace('dashboardSection-', ''));
};

// Section actions are revealed on hover.
const hoverSection = (sectionId) => {
  cy.getElementByTestId(`dashboardSection-${sectionId}`).trigger('mouseover');
};

const renameSection = (sectionId, newName) => {
  hoverSection(sectionId);
  cy.getElementByTestId(`dashboardSectionMenuButton-${sectionId}`).click({ force: true });
  cy.getElementByTestId(`dashboardSectionRename-${sectionId}`).click();
  cy.getElementByTestId('dashboardSectionRenameInput').clear().type(newName);
  cy.getElementByTestId('dashboardSectionRenameConfirm').click();
};

const deleteSection = (sectionId) => {
  hoverSection(sectionId);
  cy.getElementByTestId(`dashboardSectionMenuButton-${sectionId}`).click({ force: true });
  cy.getElementByTestId(`dashboardSectionDelete-${sectionId}`).click();
  cy.get('.euiModal').find('button').contains('Delete').click();
};

const ungroupSections = (sectionId) => {
  hoverSection(sectionId);
  cy.getElementByTestId(`dashboardSectionMenuButton-${sectionId}`).click({ force: true });
  cy.getElementByTestId(`dashboardSectionUngroupAll-${sectionId}`).click();
  cy.get('.euiModal').find('button').contains('Ungroup').click();
};

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
        cy.getElementByTestId(`dashboardSectionToggle-${sectionId}`).click();
        cy.getElementByTestId(`dashboardSectionGrid-${sectionId}`).should('not.be.visible');

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

  describe('Discard changes reverts section layout', () => {
    // Two nav variants. The new nav (home:useNewHomePage) renders one `dashboardEditSwitch` for
    // both directions -- unchecked enters edit, checked exits -- so gate on aria-checked rather
    // than mere presence, or we may toggle the stale switch the wrong way. The legacy nav
    // renders direction-specific buttons instead: `dashboardEditMode` to enter,
    // `dashboardViewOnlyMode` to exit; neither carries aria-checked. One retrying multi-subj
    // query covers both -- the post-save redirect (/create -> /view/<id>) remounts the editor
    // and briefly empties the top nav, so the query has to retry rather than snapshot the DOM.
    const setEditMode = (enabled) => {
      cy.getElementsByTestIds(
        ['dashboardEditSwitch', enabled ? 'dashboardEditMode' : 'dashboardViewOnlyMode'],
        { timeout: 30000 }
      )
        .should('be.visible')
        .and(($el) => {
          if ($el.attr('data-test-subj') === 'dashboardEditSwitch') {
            expect($el).to.have.attr('aria-checked', String(!enabled));
          }
        })
        .click();
    };

    it('should revert a newly-added section when discarding on a flat-grid dashboard', () => {
      createNewDashboard();
      const dashName = `${DASHBOARD_NAME_PREFIX} DiscardFlat ${Date.now()}`;
      saveDashboard(dashName);

      setEditMode(true);

      addSection();
      cy.get('[data-test-subj^="dashboardSection-"]').should('have.length.gte', 1);

      setEditMode(false);
      cy.get('.euiModal').should('be.visible');
      cy.get('.euiModal').find('button').contains('Discard changes').click();

      cy.get('[data-test-subj^="dashboardSection-"]', { timeout: 15000 }).should('not.exist');
      cy.getElementByTestId('dashboardSectionLayout').should('not.exist');
    });

    it('should revert to the original section layout when discarding on a sectioned dashboard', () => {
      createNewDashboard();
      addSection();
      getSectionId(0).then((sectionId) => {
        renameSection(sectionId, 'Original');
      });
      const dashName = `${DASHBOARD_NAME_PREFIX} DiscardSections ${Date.now()}`;
      saveDashboard(dashName);

      setEditMode(true);

      addSection();
      cy.get('[data-test-subj^="dashboardSection-"]').should('have.length.gte', 2);

      setEditMode(false);
      cy.get('.euiModal').should('be.visible');
      cy.get('.euiModal').find('button').contains('Discard changes').click();

      cy.get('[data-test-subj^="dashboardSection-"]', { timeout: 15000 }).should('have.length', 1);
      cy.get('[data-test-subj^="dashboardSectionTitle-"]')
        .first()
        .should('contain.text', 'Original');
    });
  });
});

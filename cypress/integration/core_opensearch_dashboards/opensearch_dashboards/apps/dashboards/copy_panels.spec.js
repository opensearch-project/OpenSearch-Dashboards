/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DATASOURCE_NAME, INDEX_WITH_TIME_1 } from '../../../../../utils/apps/constants';
import {
  getRandomizedWorkspaceName,
  getRandomizedDatasetId,
} from '../../../../../utils/apps/explore/shared';
import {
  prepareTestSuite,
  createWorkspaceAndDatasetUsingEndpoint,
} from '../../../../../utils/helpers';

const BASE_URL = Cypress.config('baseUrl');
const INDEX_REF_NAME = 'kibanaSavedObjectMeta.searchSourceJSON.index';
const EMPTY_QUERY = { query: '', language: 'kuery' };
const SEARCH_SOURCE = {
  query: { query: 'agent: "copy-panels"', language: 'kuery' },
  filter: [
    {
      meta: {
        alias: null,
        negate: false,
        disabled: false,
        key: 'host',
        type: 'phrase',
        params: { query: 'copy-panels-host' },
      },
      query: { match_phrase: { host: 'copy-panels-host' } },
      $state: { store: 'appState' },
    },
  ],
};

const markdownViz = (title) => ({
  title,
  visState: JSON.stringify({
    title,
    type: 'markdown',
    params: { fontSize: 12, openLinksInNewTab: false, markdown: `${title} body` },
    aggs: [],
  }),
  uiStateJSON: '{}',
  description: '',
  version: 1,
  kibanaSavedObjectMeta: {
    searchSourceJSON: JSON.stringify({ query: EMPTY_QUERY, filter: [] }),
  },
});

// A count metric on the dataset, so the viz references an index-pattern.
const metricViz = (title) => ({
  title,
  visState: JSON.stringify({
    title,
    type: 'metric',
    params: {},
    aggs: [{ id: '1', enabled: true, type: 'count', schema: 'metric', params: {} }],
  }),
  uiStateJSON: '{}',
  description: '',
  version: 1,
  kibanaSavedObjectMeta: {
    searchSourceJSON: JSON.stringify({
      query: EMPTY_QUERY,
      filter: [],
      indexRefName: INDEX_REF_NAME,
    }),
  },
});

const savedSearch = (title) => ({
  title,
  description: '',
  columns: ['_source'],
  sort: [],
  version: 1,
  kibanaSavedObjectMeta: {
    searchSourceJSON: JSON.stringify({
      query: EMPTY_QUERY,
      filter: [],
      indexRefName: INDEX_REF_NAME,
    }),
  },
});

const PANELS = [
  { refName: 'panel_0', type: 'visualization' },
  { refName: 'panel_1', type: 'visualization' },
  { refName: 'panel_2', type: 'search' },
];

const dashboardAttributes = (title, panelOverrides = {}) => ({
  title,
  description: '',
  panelsJSON: JSON.stringify(
    PANELS.map(({ refName, type }, i) => ({
      version: '3.0.0',
      type,
      gridData: { x: (i % 2) * 24, y: Math.floor(i / 2) * 15, w: 24, h: 15, i: String(i + 1) },
      panelIndex: String(i + 1),
      embeddableConfig: {},
      panelRefName: refName,
      ...panelOverrides[refName],
    }))
  ),
  optionsJSON: JSON.stringify({ useMargins: true, hidePanelTitles: false }),
  version: 1,
  timeRestore: true,
  timeFrom: 'now-7d',
  timeTo: 'now',
  refreshInterval: { pause: true, value: 0 },
  kibanaSavedObjectMeta: { searchSourceJSON: JSON.stringify(SEARCH_SOURCE) },
});

const runCopyPanelsTests = () => {
  const workspaceName = getRandomizedWorkspaceName();
  const datasetId = getRandomizedDatasetId();
  const workspaceAlias = `${workspaceName}:WORKSPACE_ID`;
  const datasetAlias = `${datasetId}:DATASET_ID`;
  const sourceTitle = 'copy-panels-source';
  // panel ref name -> { id, title } of the original object
  const originals = {};
  let workspaceId;
  let indexPatternId;
  let sourceId;

  const api = (method, path, body) =>
    cy.request({
      method,
      url: `${BASE_URL}/w/${workspaceId}/api/saved_objects${path}`,
      headers: { 'osd-xsrf': true },
      body,
    });

  const getObject = (type, id) => api('GET', `/${type}/${id}`).its('body');

  const countIndexPatterns = () =>
    api('GET', '/_find?type=index-pattern&per_page=1000').its('body.total');

  // Saving navigates away before the object is indexed, so poll by exact title.
  const findDashboardByTitle = (title, attempt = 0) =>
    api('GET', '/_find?type=dashboard&per_page=1000').then(({ body }) => {
      const hit = body.saved_objects.find((o) => o.attributes.title === title);
      if (hit) return hit;
      expect(attempt, `dashboard "${title}" was saved`).to.be.lessThan(20);
      return cy.wait(1000).then(() => findDashboardByTitle(title, attempt + 1));
    });

  const panelRef = (dashboard, refName) => dashboard.references.find((r) => r.name === refName);
  const indexRefIds = (object) =>
    object.references.filter((r) => r.type === 'index-pattern').map((r) => r.id);

  const openDashboard = (id) => {
    cy.visit(`/w/${workspaceId}/app/dashboards#/view/${id}`);
    // A hash-only visit keeps the app state from the previous test, so reload.
    cy.reload();
    cy.getElementByTestId('dashboardClone', { timeout: 60000 }).should('be.visible');
    cy.get('body').then(($body) => {
      if ($body.find('[data-test-subj="manageWorkspaceTourDismiss"]').length) {
        cy.getElementByTestId('manageWorkspaceTourDismiss').click();
      }
    });
  };

  const openSourceDashboard = () => openDashboard(sourceId);

  const clone = (title, copyPanels, id = sourceId) => {
    openDashboard(id);
    cy.getElementByTestId('dashboardClone').click();
    cy.getElementByTestId('clonedDashboardTitle').clear().type(title);
    if (copyPanels) cy.getElementByTestId('cloneCopyPanelsCheckbox').check({ force: true });
    cy.getElementByTestId('cloneConfirmButton').click();
    return findDashboardByTitle(title);
  };

  const openSaveAsNewModal = (title) => {
    openSourceDashboard();
    cy.getElementByTestId('dashboardEditSwitch').click();
    cy.getElementByTestId('dashboardSaveMenuItem').click();
    cy.getElementByTestId('savedObjectTitle').clear().type(title);
  };

  const saveAsNew = (title, copyPanels) => {
    openSaveAsNewModal(title);
    cy.getElementByTestId('saveAsNewCheckbox').click();
    if (copyPanels) cy.getElementByTestId('copyPanelsOnSave').click();
    cy.getElementByTestId('confirmSaveSavedObjectButton').click();
    return findDashboardByTitle(title);
  };

  // Every panel points to a new object with the template title and the same
  // content. Copies keep the shared index-pattern, and editing a copy leaves
  // the original untouched.
  const expectIsolatedCopies = (dashboard) => {
    PANELS.forEach(({ refName, type }) => {
      const original = originals[refName];
      const ref = panelRef(dashboard, refName);
      expect(ref.type, `${refName} type`).to.equal(type);
      expect(ref.id, `${refName} is a new object`).to.not.equal(original.id);

      getObject(type, original.id).then((source) => {
        getObject(type, ref.id).then((copy) => {
          expect(copy.attributes.title).to.equal(`${original.title} (copy)`);
          expect(copy.attributes.kibanaSavedObjectMeta).to.deep.equal(
            source.attributes.kibanaSavedObjectMeta
          );
          if (type === 'visualization') {
            expect(copy.attributes.visState).to.equal(source.attributes.visState);
          }
          expect(indexRefIds(copy), `${refName} index-pattern`).to.deep.equal(indexRefIds(source));
          api('PUT', `/${type}/${ref.id}`, {
            attributes: { ...copy.attributes, description: 'edited copy' },
          });
        });
      });
      getObject(type, original.id).its('attributes.description').should('equal', '');
    });
  };

  // Run a copy action and check it did not create another index-pattern.
  const withIndexPatternCountUnchanged = (action) =>
    countIndexPatterns().then((before) =>
      action().then((result) =>
        countIndexPatterns()
          .should('equal', before)
          .then(() => result)
      )
    );

  describe('Dashboard copy panels', () => {
    before(() => {
      cy.osd.setupEnvAndGetDataSource(DATASOURCE_NAME);
      createWorkspaceAndDatasetUsingEndpoint(
        DATASOURCE_NAME,
        workspaceName,
        datasetId,
        `${INDEX_WITH_TIME_1}*`,
        'timestamp',
        'logs',
        ['use-case-observability']
      );
      cy.get(`@${workspaceAlias}`).then((id) => {
        workspaceId = id;
      });
      cy.get(`@${datasetAlias}`).then((id) => {
        indexPatternId = id;
        const indexRef = [{ name: INDEX_REF_NAME, type: 'index-pattern', id: indexPatternId }];
        const objects = {
          panel_0: { type: 'visualization', attributes: markdownViz('copy-panels-markdown') },
          panel_1: {
            type: 'visualization',
            attributes: metricViz('copy-panels-metric'),
            references: indexRef,
          },
          panel_2: {
            type: 'search',
            attributes: savedSearch('copy-panels-search'),
            references: indexRef,
          },
        };
        Object.entries(objects).forEach(([refName, { type, attributes, references = [] }]) => {
          api('POST', `/${type}`, { attributes, references }).then(({ body }) => {
            originals[refName] = { id: body.id, title: attributes.title };
          });
        });
        cy.then(() =>
          api('POST', '/dashboard', {
            attributes: dashboardAttributes(sourceTitle),
            references: PANELS.map(({ refName, type }) => ({
              name: refName,
              type,
              id: originals[refName].id,
            })),
          }).then(({ body }) => {
            sourceId = body.id;
          })
        );
      });
    });

    after(() => {
      cy.osd.cleanupWorkspaceAndDataSourceAndIndices(workspaceName);
    });

    describe('Clone', () => {
      it('copies panels when "Copy panels" is checked', () => {
        withIndexPatternCountUnchanged(() => clone('copy-panels-clone-copied', true)).then(
          expectIsolatedCopies
        );
      });

      it('shares panels when "Copy panels" is not checked', () => {
        clone('copy-panels-clone-shared', false).then((cloned) => {
          PANELS.forEach(({ refName }) => {
            expect(panelRef(cloned, refName).id).to.equal(originals[refName].id);
          });
        });
      });

      it('applies the title template to custom panel titles', () => {
        // A panel title, a title in embeddableConfig (moved to the panel title when the
        // dashboard loads), and an empty title that hides it.
        const overrides = {
          panel_0: { title: 'custom markdown' },
          panel_1: { embeddableConfig: { title: 'custom metric' } },
          panel_2: { title: '' },
        };
        // Keyed by panelIndex, so the check does not depend on panel order.
        const shownTitles = (dashboard) =>
          Object.fromEntries(
            JSON.parse(dashboard.attributes.panelsJSON).map((p) => [
              p.panelIndex,
              p.embeddableConfig?.title ?? p.title,
            ])
          );
        // Unique titles, so a retry does not hit the clone left by an earlier attempt.
        const stamp = Date.now();

        api('POST', '/dashboard', {
          attributes: dashboardAttributes(`copy-panels-custom-titles-${stamp}`, overrides),
          references: PANELS.map(({ refName, type }) => ({
            name: refName,
            type,
            id: originals[refName].id,
          })),
        }).then(({ body: { id: customSourceId } }) => {
          clone(`copy-panels-clone-custom-titles-${stamp}`, true, customSourceId).then((cloned) => {
            expect(shownTitles(cloned)).to.deep.equal({
              1: 'custom markdown (copy)',
              2: 'custom metric (copy)',
              3: '',
            });
            openDashboard(cloned.id);
            cy.get('[data-test-subj="dashboardPanelTitle"] .embPanel__titleInner').should(
              ($els) => {
                const texts = [...$els].map((el) => el.innerText.trim()).filter(Boolean);
                expect(texts.sort()).to.deep.equal([
                  'custom markdown (copy)',
                  'custom metric (copy)',
                ]);
              }
            );
          });
          getObject('dashboard', customSourceId).then((source) => {
            expect(shownTitles(source)).to.deep.equal({
              1: 'custom markdown',
              2: 'custom metric',
              3: '',
            });
          });
        });
      });
    });

    describe('Save as new', () => {
      it('only shows "Copy panels" when "Save as new dashboard" is on', () => {
        openSaveAsNewModal('copy-panels-gate');
        cy.getElementByTestId('copyPanelsOnSave').should('not.exist');
        cy.getElementByTestId('saveAsNewCheckbox').click();
        cy.getElementByTestId('copyPanelsOnSave').should('be.visible');
        cy.getElementByTestId('saveAsNewCheckbox').click();
        cy.getElementByTestId('copyPanelsOnSave').should('not.exist');
        cy.getElementByTestId('saveCancelButton').click();
        cy.getElementByTestId('dashboardEditSwitch').click();
        cy.getElementByTestId('dashboardClone').should('be.visible');
      });

      it('keeps query, filters, time and layout, and leaves the source unchanged', () => {
        getObject('dashboard', sourceId).then((sourceBefore) => {
          saveAsNew('copy-panels-save-as-shared', false).then(({ id }) => {
            getObject('dashboard', id).then((saved) => {
              const source = sourceBefore.attributes;
              const attrs = saved.attributes;
              const searchSource = JSON.parse(attrs.kibanaSavedObjectMeta.searchSourceJSON);

              expect(searchSource.query).to.deep.equal(SEARCH_SOURCE.query);
              expect(searchSource.filter).to.have.length(1);
              expect(searchSource.filter[0].query).to.deep.equal(SEARCH_SOURCE.filter[0].query);
              expect(attrs.timeRestore).to.equal(true);
              expect(attrs.timeFrom).to.equal(source.timeFrom);
              expect(attrs.timeTo).to.equal(source.timeTo);
              expect(JSON.parse(attrs.optionsJSON)).to.deep.equal(JSON.parse(source.optionsJSON));

              const gridData = (panels) => JSON.parse(panels).map((p) => p.gridData);
              expect(gridData(attrs.panelsJSON)).to.deep.equal(gridData(source.panelsJSON));
              PANELS.forEach(({ refName }) => {
                expect(panelRef(saved, refName).id).to.equal(originals[refName].id);
              });
            });
          });
          getObject('dashboard', sourceId).then((sourceAfter) => {
            expect(sourceAfter.attributes).to.deep.equal(sourceBefore.attributes);
            expect(sourceAfter.references).to.deep.equal(sourceBefore.references);
          });
        });
      });

      it('copies panels when "Copy panels" is on', () => {
        withIndexPatternCountUnchanged(() => saveAsNew('copy-panels-save-as-copied', true)).then(
          expectIsolatedCopies
        );
      });
    });
  });
};

prepareTestSuite('Dashboard Copy Panels', runCopyPanelsTests);

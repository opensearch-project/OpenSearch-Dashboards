/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import {
    WORKSPACE_NAME,
    DATASOURCE_NAME,
    INDEX_NAME,
    INDEX_PATTERN_NAME,
    START_TIME,
    END_TIME,
    INDEX_PATTERN_LANGUAGES,
    INDEX_LANGUAGES
} from '../../../../../utils/apps/constants';
import * as dataExplorer from '../../../../../integration/core-opensearch-dashboards/opensearch-dashboards/apps/query_enhancements/utils/field_display_filtering.js';
import { SECONDARY_ENGINE, BASE_PATH } from '../../../../../utils/constants';

const randomString = Math.random().toString(36).substring(7);
const workspace = `${WORKSPACE_NAME}-${randomString}`;

const clickToggleBtnByIndex = (index) => {
    let docNum = 0;
    while (docNum <= index) {
        cy.get('button[data-test-subj="docTableExpandToggleColumn"]').eq(docNum).click();
        docNum++;
    }
};

const checkViewDocumentLinksByQueryLanguage = (isIndexPattern = true, docNum = 0) => {
    const checkViewDocumentLinks = (language) => {
        cy.setQueryLanguage(language);
        cy.wait(1000);
        clickToggleBtnByIndex(docNum);
        if (!docNum) {
            if (language === 'DQL' || language === 'Lucene') {
                // make sure the element exists, is visible and is a link
                cy.contains('View surrounding documents').should('be.visible').and('have.prop', 'tagName', 'A');
                cy.contains('View single document').should('be.visible').and('have.prop', 'tagName', 'A');
            } else {
                cy.contains('View surrounding documents').should('not.exist');
                cy.contains('View single document').should('not.exist');
            }
        }
        cy.get('.osdDocViewer').should('have.length', docNum + 1).and('be.visible'); // the first one is the class CSS definition
        cy.reload(true);
    };
    if (isIndexPattern) {
        dataExplorer.selectIndexPatternDataset(INDEX_PATTERN_NAME, 'DQL');
        cy.setTopNavDate(START_TIME, END_TIME);
        INDEX_PATTERN_LANGUAGES.forEach((lang) => checkViewDocumentLinks(lang));

    } else {
        dataExplorer.selectIndexDataset(DATASOURCE_NAME, INDEX_NAME, 'PPL', 'timestamp');
        INDEX_LANGUAGES.forEach((lang) => checkViewDocumentLinks(lang));
    }
};

const openViewDocumentLinksByQueryLanguage = () => {
    INDEX_PATTERN_LANGUAGES.slice(0, 2).forEach((language, btnIndex) => {
        dataExplorer.selectIndexPatternDataset(INDEX_PATTERN_NAME, language);
        cy.setTopNavDate(START_TIME, END_TIME);
        const button = ['View surrounding documents', 'View single document'];
        const checkDataPersistence = () => {
            const testData = {
                bytes_transferred: '1,222',
                event_time: 'Dec 31, 2022 @ 04:14:42.801',
                'personal.name': 'Flora Bergstrom',
                'personal.email': 'Curtis47@yahoo.com',
            };
            Object.keys(testData).forEach((key) => {
                const value = testData[key];
                cy.getElementByTestId(`tableDocViewRow-${key}-value`).should('have.text', value);
            });
        };
        cy.setQueryLanguage(language);
        clickToggleBtnByIndex(0);
        checkDataPersistence();
        cy.contains(button[btnIndex])
            .invoke('attr', 'href')
            .then(($href) => {
                cy.visit($href);
                if (!btnIndex) clickToggleBtnByIndex(0);
                checkDataPersistence();
            });
        // prepare next iteration
        cy.navigateToWorkSpaceSpecificPage({
            url: BASE_PATH,
            workspaceName: workspace,
            page: 'discover',
            isEnhancement: true,
        });
    });
};

describe('filter for value spec', () => {
    before(() => {
        // Load test data
        cy.setupTestData(
            SECONDARY_ENGINE.url,
            ['cypress/fixtures/query_enhancements/data-logs-1/data_logs_small_time_1.mapping.json'],
            ['cypress/fixtures/query_enhancements/data-logs-1/data_logs_small_time_1.data.ndjson']
        );

        // Add data source
        cy.addDataSource({
            name: `${DATASOURCE_NAME}`,
            url: `${SECONDARY_ENGINE.url}`,
            authType: 'no_auth',
        });
        // Create workspace
        cy.deleteWorkspaceByName(`${workspace}`);
        cy.visit('/app/home');
        cy.createInitialWorkspaceWithDataSource(`${DATASOURCE_NAME}`, `${workspace}`);
        cy.wait(2000);
        cy.createWorkspaceIndexPatterns({
            url: `${BASE_PATH}`,
            workspaceName: `${workspace}`,
            indexPattern: INDEX_NAME,
            timefieldName: 'timestamp',
            indexPatternHasTimefield: true,
            dataSource: DATASOURCE_NAME,
            isEnhancement: true,
        });
        cy.navigateToWorkSpaceSpecificPage({
            url: BASE_PATH,
            workspaceName: `${workspace}`,
            page: 'discover',
            isEnhancement: true,
        });
    });

    after(() => {
        cy.deleteWorkspaceByName(`${workspace}`);
        cy.deleteDataSourceByName(`${DATASOURCE_NAME}`);
        // TODO: Modify deleteIndex to handle an array of index and remove hard code
        cy.deleteIndex(INDEX_PATTERN_NAME);
    });

    describe('discover table spec', () => {
        describe('view surrounding and single document', () => {
            it('index pattern: expanded document and check links exist', () => {
                checkViewDocumentLinksByQueryLanguage();
            });
            it('index: expanded document and check links exist', () => {
                checkViewDocumentLinksByQueryLanguage(false);
            });
            it('index pattern: click on links', () => {
                // TESTID-49
                openViewDocumentLinksByQueryLanguage();
            });
            // links only exist for index pattern languages DQL and Lucene
            // no need to create a test for indeces
        });
    });

    describe('sorting', () => {
        it('', () => {
            // TO DO
        });
    });

    describe('expand multiple document', () => {
        // single document already tested on the first spec
        it('index pattern: expand multiple documents', () => {
            checkViewDocumentLinksByQueryLanguage(true, 5);
        });
        it('index: expand multiple documents', () => {
            checkViewDocumentLinksByQueryLanguage(false, 5);
        });
    });
});

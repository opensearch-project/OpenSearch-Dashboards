/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import {
    DATASOURCE_NAME,
    INDEX_PATTERN_NAME,
    INDEX_NAME,
    START_TIME,
    END_TIME,
    WORKSPACE_NAME,
} from './constants.js';
import * as dataExplorer from './helpers.js';

const addFields = (testFields, expectedValues, pplQuery, sqlQuery, indexPattern = true) => {
    const getDocTableHeaderByIndex = (index, offset) => {
        return cy.getElementByTestId('docTableHeaderField').eq(index + offset);
    };
    const checkTableHeadersByArray = (expectedHeaders, offset = 1) => {
        for (let i = 0; i < expectedHeaders.length; i++) {
            // Get headers by index
            getDocTableHeaderByIndex(i + offset).should('have.text', expectedHeaders[i]);
        }
    };
    const checkDocTableColumnByArr = (expectedValues, columnNumber) => {
        let currentRow = 0;
        expectedValues.forEach((value) => {
            dataExplorer.getDocTableField(columnNumber, currentRow).should('have.text', value);
            currentRow++;
        });
    };

    const offset = indexPattern ? 1 : 0; // defines starting column
    if (indexPattern) {
        dataExplorer.selectIndexPatternDataset(INDEX_PATTERN_NAME, 'DQL');
        dataExplorer.setQueryEditorLanguage('DQL');
        cy.setSearchAbsoluteDateRange(START_TIME, END_TIME);
    } else {
        dataExplorer.selectIndexDataset(DATASOURCE_NAME, INDEX_NAME, 'OpenSearch SQL');
    }
    // Check default column
    getDocTableHeaderByIndex(0 + offset).should('have.text', '_source');
    // Select some fields
    testFields.forEach((field) => {
        cy.getElementByTestId('fieldToggle-' + field).click();
    });
    // Check that the default column no longer exists
    getDocTableHeaderByIndex(0 + offset).should('not.have.text', '_source');
    // Check table headers persistence between DQL and PPL
    checkTableHeadersByArray(testFields, offset);
    if (indexPattern) {
        dataExplorer.setQueryEditorLanguage('Lucene');
        checkTableHeadersByArray(testFields, offset);
    }
    dataExplorer.setQueryEditorLanguage('PPL');
    checkTableHeadersByArray(testFields, offset);
    // Remove some fields
    const firstTestField = testFields[0];
    const secondTestField = testFields[1];
    cy.getElementByTestId('fieldToggle-' + firstTestField).click();
    cy.getElementByTestId('fieldToggle-' + secondTestField).click();
    getDocTableHeaderByIndex(0 + offset).should('not.have.text', firstTestField);
    getDocTableHeaderByIndex(1 + offset).should('not.have.text', secondTestField);
    // Remove all fields
    const thirdTestField = testFields[2];
    const fourthTestField = testFields[3];
    cy.getElementByTestId('fieldToggle-' + thirdTestField).click();
    cy.getElementByTestId('fieldToggle-' + fourthTestField).click();
    getDocTableHeaderByIndex(0 + offset).should('have.text', '_source');
    getDocTableHeaderByIndex(1 + offset).should('not.exist');
    // Select some fields
    testFields.forEach((field) => {
        cy.getElementByTestId('fieldToggle-' + field).click();
    });
    // Check default column again
    getDocTableHeaderByIndex(0 + offset).should('not.have.text', '_source');
    // Check the columns match the selected fields
    checkTableHeadersByArray(testFields, offset);
    if (indexPattern) {
        // Validate default hits
        getDiscoverQueryHits().should('have.text', '9,997');
    }
    // Send PPL query
    cy.intercept('/api/enhancements/search/ppl').as('pplQuery');
    dataExplorer.sendQueryOnMultilineEditor(pplQuery);
    cy.wait('@pplQuery').then(() => {
        // Check table headers persistence after PPL query
        cy.wait(1000);
        checkTableHeadersByArray(testFields, offset);
        if (indexPattern) {
            // Check filter was correctly applied
            getDiscoverQueryHits().should('have.text', '1,040');
        }
        // Validate the first 5 rows on the _id column
        checkDocTableColumnByArr(expectedValues, 1 + offset);
    });
    // Send SQL query
    dataExplorer.setQueryEditorLanguage('OpenSearch SQL');
    cy.intercept('/api/enhancements/search/sql').as('sqlQuery');
    dataExplorer.sendQueryOnMultilineEditor(sqlQuery);
    cy.wait('@sqlQuery').then(() => {
        // Check table headers persistence after SQL query
        cy.wait(1000);
        checkTableHeadersByArray(testFields, offset);
        // Validate the first 5 rows on the _id column
        checkDocTableColumnByArr(expectedValues, 1 + offset);
    });
};

const checkFilteredFields = (indexPattern = true) => {
    const filterFields = () => {
        const expectedValues = [
            { search: '_index', assertion: 'equal' },
            { search: 'a', assertion: 'include' },
            { search: 'ag', assertion: 'include' },
            { search: 'age', assertion: 'include' },
            { search: 'non-existent field', assertion: null },
        ];
        expectedValues.forEach(({ search, assertion }) => {
            dataExplorer.checkSidebarFilterBarResults(search, assertion);
        });
    };

    if (indexPattern) {
        dataExplorer.selectIndexPatternDataset(INDEX_PATTERN_NAME, 'DQL');
        dataExplorer.setQueryEditorLanguage('DQL');
        cy.setSearchAbsoluteDateRange(START_TIME, END_TIME);
        filterFields();
        dataExplorer.setQueryEditorLanguage('Lucene');
        filterFields();
    } else {
        dataExplorer.selectIndexDataset(DATASOURCE_NAME, INDEX_NAME, 'PPL');
    }
    dataExplorer.setQueryEditorLanguage('PPL');
    filterFields();
    dataExplorer.setQueryEditorLanguage('OpenSearch SQL');
    filterFields();
};

const checkCollapseAndExpand = (indexPattern = true) => {
    const collapseAndExpand = () => {
        cy.getElementByTestId('sidebarPanel').should('be.visible');
        dataExplorer.clickSidebarCollapseBtn();
        cy.getElementByTestId('sidebarPanel').should('not.be.visible');
        dataExplorer.clickSidebarCollapseBtn(false);
        cy.getElementByTestId('sidebarPanel').should('be.visible');
    }

    if (indexPattern) {
        dataExplorer.setQueryEditorLanguage('DQL');
        collapseAndExpand();
        dataExplorer.setQueryEditorLanguage('Lucene');
        collapseAndExpand();
    }
    dataExplorer.setQueryEditorLanguage('PPL');
    collapseAndExpand();
    dataExplorer.setQueryEditorLanguage('OpenSearch SQL');
    collapseAndExpand();
    if (indexPattern) {
        dataExplorer.setQueryEditorLanguage('DQL');
        cy.getElementByTestId('sidebarPanel').should('be.visible');
    }
};

const checkCollapse = (indexPattern = true) => {
    if (indexPattern) {
        dataExplorer.selectIndexPatternDataset(INDEX_PATTERN_NAME, 'DQL');
        dataExplorer.setQueryEditorLanguage('DQL');
        dataExplorer.clickSidebarCollapseBtn();
        cy.getElementByTestId('sidebarPanel').should('not.be.visible');
        dataExplorer.setQueryEditorLanguage('Lucene');
        cy.getElementByTestId('sidebarPanel').should('not.be.visible');
    } else {
        dataExplorer.selectIndexDataset(DATASOURCE_NAME, INDEX_NAME, 'PPL');
    }
    dataExplorer.setQueryEditorLanguage('PPL');
    if (!indexPattern) {
        dataExplorer.clickSidebarCollapseBtn();
    }
    cy.getElementByTestId('sidebarPanel').should('not.be.visible');
    dataExplorer.setQueryEditorLanguage('OpenSearch SQL');
    cy.getElementByTestId('sidebarPanel').should('not.be.visible');
    if (indexPattern) {
        dataExplorer.setQueryEditorLanguage('DQL');
        cy.getElementByTestId('sidebarPanel').should('not.be.visible');
    }
};

describe('sidebar spec', () => {
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
        cy.deleteWorkspaceByName(`${WORKSPACE_NAME}`);
        miscUtils.visitPage('/app/home');
        cy.createInitialWorkspaceWithDataSource(`${DATASOURCE_NAME}`, `${WORKSPACE_NAME}`);
        cy.wait(2000);
        cy.createWorkspaceIndexPatterns({
            url: `${BASE_PATH}`,
            workspaceName: `${WORKSPACE_NAME}`,
            indexPattern: 'data_logs_small_time_1',
            timefieldName: 'timestamp',
            indexPatternHasTimefield: true,
            dataSource: DATASOURCE_NAME,
            isEnhancement: true,
        });
        cy.navigateToWorkSpaceHomePage(`${BASE_PATH}`, `${WORKSPACE_NAME}`);
    });

    after(() => {
        cy.deleteWorkspaceByName(`${WORKSPACE_NAME}`);
        cy.deleteDataSourceByName(`${DATASOURCE_NAME}`);
        // TODO: Modify deleteIndex to handle an array of index and remove hard code
        cy.deleteIndex('data_logs_small_time_1');
    });

    describe('sidebar fields', () => {
        describe('add fields', () => {
            const pplQuery = 'source = data_logs_small_time_1 | where status_code = 200';
            const sqlQuery = 'SELECT * FROM data_logs_small_time_1 WHERE status_code = 200';
            const testFields = ['service_endpoint', 'response_time', 'bytes_transferred', 'request_url'];
            const expectedTimeValues = ['0.56', '4.21', '4.13', '0.65', '3.45'];
            it('add field in index pattern', () => {
                addFields(testFields, expectedTimeValues, pplQuery, sqlQuery);
            });

            it('add field in index', () => {
                addFields(testFields, expectedTimeValues, pplQuery, sqlQuery, false);
            });

            const nestedTestFields = [
                'personal.name',
                'personal.age',
                'personal.birthdate',
                'personal.address.country',
            ];
            const expectedAgeValues = ['75', '76', '78', '73', '74'];
            it('add nested field in index pattern', () => {
                addFields(nestedTestFields, expectedAgeValues, pplQuery, sqlQuery);
            });
            it('add nested field in index', () => {
                addFields(nestedTestFields, expectedAgeValues, pplQuery, sqlQuery, false);
            });
        });

        describe('filter fields', () => {
            it('filter index pattern', () => {
                checkFilteredFields();
            });

            it('filter index', () => {
                checkFilteredFields(false);
            });
        });

        describe('side panel collapse/expand', () => {
            it('index pattern: collapse and expand', () => {
                // this test case does three things:
                // 1. checks the persistence of the sidebar state accross query languages
                // 2. checks that the default state is expanded (first iteration of collapseAndExpand())
                // 3. collapses and expands the sidebar for every language
                checkCollapseAndExpand();
            });

            it('index pattern: check collapsed state', () => {
                // this test case checks that the sidebar remains collapsed accross query languages
                checkCollapse();
            });

            it('index: collapse and expand', () => {
                checkCollapseAndExpand(false);
            });

            it('index: check collapsed state', () => {
                checkCollapse(false);
            });
        });
    });
});

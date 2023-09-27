/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { FtrProviderContext } from '../ftr_provider_context';

export function DiscoverPageProvider({ getService, getPageObjects }: FtrProviderContext) {
  const retry = getService('retry');
  const testSubjects = getService('testSubjects');
  const find = getService('find');
  const flyout = getService('flyout');
  const { header } = getPageObjects(['header']);
  const browser = getService('browser');
  const globalNav = getService('globalNav');
  const config = getService('config');
  const defaultFindTimeout = config.get('timeouts.find');
  const opensearchChart = getService('opensearchChart');
  const docTable = getService('docTable');
  const dataGridTable = getService('dataGrid');
  const comboBox = getService('comboBox');

  /*
   * This page is left unchanged since some of the other selenium tests, ex. dashboard tests, visualization tests
   * are still using some of the below helper functions.
   */
  class DiscoverPage {
    public async getChartTimespan() {
      const el = await find.byCssSelector('[data-test-subj="discoverIntervalDateRange"]');
      return await el.getVisibleText();
    }

    public async findFieldByName(name: string) {
      const fieldSearch = await testSubjects.find('fieldFilterSearchInput');
      await fieldSearch.type(name);
    }

    public async clearFieldSearchInput() {
      const fieldSearch = await testSubjects.find('fieldFilterSearchInput');
      await fieldSearch.clearValue();
    }

    public async saveSearch(searchName: string) {
      await this.clickSaveSearchButton();
      // preventing an occasional flakiness when the saved object wasn't set and the form can't be submitted
      await retry.waitFor(
        `saved search title is set to ${searchName} and save button is clickable`,
        async () => {
          const saveButton = await testSubjects.find('confirmSaveSavedObjectButton');
          await testSubjects.setValue('savedObjectTitle', searchName);
          return (await saveButton.getAttribute('disabled')) !== 'true';
        }
      );
      await testSubjects.click('confirmSaveSavedObjectButton');
      await header.waitUntilLoadingHasFinished();
      // LeeDr - this additional checking for the saved search name was an attempt
      // to cause this method to wait for the reloading of the page to complete so
      // that the next action wouldn't have to retry.  But it doesn't really solve
      // that issue.  But it does typically take about 3 retries to
      // complete with the expected searchName.
      await retry.waitFor(`saved search was persisted with name ${searchName}`, async () => {
        return (await this.getCurrentQueryName()) === searchName;
      });
    }

    public async inputSavedSearchTitle(searchName: string) {
      await testSubjects.setValue('savedObjectTitle', searchName);
    }

    public async clickConfirmSavedSearch() {
      await testSubjects.click('confirmSaveSavedObjectButton');
    }

    public async openAddFilterPanel() {
      await testSubjects.click('addFilter');
    }

    public async waitUntilSearchingHasFinished() {
      const spinner = await testSubjects.find('loadingSpinner');
      await find.waitForElementHidden(spinner, defaultFindTimeout * 10);
    }

    public async getColumnHeaders() {
      return await dataGridTable.getHeaderFields();
    }

    public async openLoadSavedSearchPanel() {
      let isOpen = await testSubjects.exists('loadSearchForm');
      if (isOpen) {
        return;
      }

      // We need this try loop here because previous actions in Discover like
      // saving a search cause reloading of the page and the "Open" menu item goes stale.
      await retry.waitFor('saved search panel is opened', async () => {
        await this.clickLoadSavedSearchButton();
        await header.waitUntilLoadingHasFinished();
        isOpen = await testSubjects.exists('loadSearchForm');
        return isOpen === true;
      });
    }

    public async closeLoadSaveSearchPanel() {
      await flyout.ensureClosed('loadSearchForm');
    }

    public async hasSavedSearch(searchName: string) {
      const searchLink = await find.byButtonText(searchName);
      return await searchLink.isDisplayed();
    }

    public async loadSavedSearch(searchName: string) {
      await this.openLoadSavedSearchPanel();
      await testSubjects.click(`savedObjectTitle${searchName.split(' ').join('-')}`);
      await header.waitUntilLoadingHasFinished();
    }

    public async clickNewSearchButton() {
      await testSubjects.click('discoverNewButton');
      await header.waitUntilLoadingHasFinished();
    }

    public async clickSaveSearchButton() {
      await testSubjects.click('discoverSaveButton');
    }

    public async clickLoadSavedSearchButton() {
      await testSubjects.moveMouseTo('discoverOpenButton');
      await testSubjects.click('discoverOpenButton');
    }

    public async clickResetSavedSearchButton() {
      await testSubjects.moveMouseTo('resetSavedSearch');
      await testSubjects.click('resetSavedSearch');
      await header.waitUntilLoadingHasFinished();
    }

    public async closeLoadSavedSearchPanel() {
      await testSubjects.click('euiFlyoutCloseButton');
    }

    public async clickHistogramBar() {
      const el = await opensearchChart.getCanvas();

      await browser.getActions().move({ x: 0, y: 20, origin: el._webElement }).click().perform();
    }

    public async brushHistogram() {
      const el = await opensearchChart.getCanvas();

      await browser.dragAndDrop(
        { location: el, offset: { x: -300, y: 20 } },
        { location: el, offset: { x: -100, y: 30 } }
      );
    }

    public async getCurrentQueryName() {
      return await globalNav.getLastBreadcrumb();
    }

    public async getChartInterval() {
      const selectedValue = await testSubjects.getAttribute('discoverIntervalSelect', 'value');
      const selectedOption = await find.byCssSelector(`option[value="${selectedValue}"]`);
      return selectedOption.getVisibleText();
    }

    public async getChartIntervalWarningIcon() {
      await header.waitUntilLoadingHasFinished();
      return await find.existsByCssSelector('.euiToolTipAnchor');
    }

    public async setChartInterval(interval: string) {
      const optionElement = await find.byCssSelector(`option[label="${interval}"]`, 5000);
      await optionElement.click();
      return await header.waitUntilLoadingHasFinished();
    }

    public async getHitCount() {
      await header.waitUntilLoadingHasFinished();
      return await testSubjects.getVisibleText('discoverQueryHits');
    }

    public async getDocHeader() {
      const table = this.dataGrid;
      const docHeader = await find.byCssSelector('thead > tr:nth-child(1)');
      return await docHeader.getVisibleText();
    }

    public async getDocTableRows() {
      await header.waitUntilLoadingHasFinished();
      const rows = await testSubjects.findAll('docTableRow');
      return rows;
    }

    public async getDocTableIndex(index: number) {
      const row = await find.byCssSelector(`tr.osdDocTable__row:nth-child(${index})`);
      return await row.getVisibleText();
    }

    public async getDocTableField(index: number) {
      const field = await find.byCssSelector(
        `tr.osdDocTable__row:nth-child(${index}) > [data-test-subj='docTableField']`
      );
      return await field.getVisibleText();
    }

    public async skipToEndOfDocTable() {
      // add the focus to the button to make it appear
      const skipButton = await testSubjects.find('discoverSkipTableButton');
      // force focus on it, to make it interactable
      skipButton.focus();
      // now click it!
      return skipButton.click();
    }

    public async getDocTableFooter() {
      return await testSubjects.find('discoverDocTableFooter');
    }

    public async clickDocSortDown() {
      await find.clickByCssSelector('.fa-sort-down');
    }

    public async clickDocSortUp() {
      await find.clickByCssSelector('.fa-sort-up');
    }

    public async getMarks() {
      const table = await docTable.getTable();
      const $ = await table.parseDomContent();
      return $('mark')
        .toArray()
        .map((mark) => $(mark).text());
    }

    public async toggleSidebarCollapse() {
      return await testSubjects.click('collapseSideBarButton');
    }

    public async getAllFieldNames() {
      const sidebar = await testSubjects.find('discover-sidebar');
      const $ = await sidebar.parseDomContent();
      return $('.dscSidebar__item[attr-field]')
        .toArray()
        .map((field) => $(field).find('span.eui-textTruncate').text());
    }

    public async getSidebarWidth() {
      const sidebar = await testSubjects.find('discover-sidebar');
      return await sidebar.getAttribute('clientWidth');
    }

    public async hasNoResults() {
      return await testSubjects.exists('discoverNoResults');
    }

    public async hasNoResultsTimepicker() {
      return await testSubjects.exists('discoverNoResultsTimefilter');
    }

    public async clickFieldListItem(field: string) {
      return await testSubjects.click(`field-${field}`);
    }

    public async clickFieldListItemDetails(field: string) {
      return await testSubjects.click(`field-${field}-showDetails`);
    }

    public async clickFieldSort(field: string) {
      return await testSubjects.click(`docTableHeaderFieldSort_${field}`);
    }

    public async clickFieldListItemToggle(field: string) {
      await testSubjects.moveMouseTo(`field-${field}`);
      await testSubjects.click(`fieldToggle-${field}`);
    }

    public async clickFieldListItemAdd(field: string) {
      // a filter check may make sense here, but it should be properly handled to make
      // it work with the _score and _source fields as well
      await this.clickFieldListItemToggle(field);
    }

    public async clickFieldListItemRemove(field: string) {
      const selectedList = await testSubjects.find('fieldList-selected');
      if (await testSubjects.descendantExists(`field-${field}`, selectedList)) {
        await this.clickFieldListItemToggle(field);
      }
    }

    public async clickFieldListItemVisualize(fieldName: string) {
      const field = await testSubjects.find(`field-${fieldName}-showDetails`);
      const isActive = await field.elementHasClass('dscSidebarItem--active');

      if (!isActive) {
        // expand the field to show the "Visualize" button
        await field.click();
      }

      await testSubjects.click(`fieldVisualize-${fieldName}`);
    }

    public async expectFieldListItemVisualize(field: string) {
      await testSubjects.existOrFail(`fieldVisualize-${field}`);
    }

    public async expectMissingFieldListItemVisualize(field: string) {
      await testSubjects.missingOrFail(`fieldVisualize-${field}`);
    }

    public async clickFieldListPlusFilter(field: string, value: string) {
      const plusFilterTestSubj = `plus-${field}-${value}`;
      if (!(await testSubjects.exists(plusFilterTestSubj))) {
        // field has to be open
        await this.clickFieldListItem(field);
      }
      // testSubjects.find doesn't handle spaces in the data-test-subj value
      await testSubjects.click(plusFilterTestSubj);
      await header.waitUntilLoadingHasFinished();
    }

    public async clickFieldListMinusFilter(field: string, value: string) {
      // this method requires the field details to be open from clickFieldListItem()
      // testSubjects.find doesn't handle spaces in the data-test-subj value
      await testSubjects.click(`minus-${field}-${value}`);
      await header.waitUntilLoadingHasFinished();
    }

    public async selectIndexPattern(indexPatternTitle: string) {
      const dataExplorerComboBoxElement = await testSubjects.find('dataExplorerDSSelect');
      await comboBox.setElement(dataExplorerComboBoxElement, indexPatternTitle);
      await header.waitUntilLoadingHasFinished();
    }

    public async removeHeaderColumn(columnName: string) {
      await dataGridTable.clickRemoveColumn(columnName);
    }

    public async openSidebarFieldFilter() {
      await testSubjects.click('toggleFieldFilterButton');
      await testSubjects.existOrFail('filterSelectionPanel');
    }

    public async closeSidebarFieldFilter() {
      await testSubjects.click('toggleFieldFilterButton');
      await testSubjects.missingOrFail('filterSelectionPanel', { allowHidden: true });
    }

    public async waitForChartLoadingComplete(renderCount: number) {
      await opensearchChart.waitForRenderingCount('discoverChart', renderCount);
    }

    public async waitForDocTableLoadingComplete() {
      await testSubjects.waitForAttributeToChange(
        'discoverDocTable',
        'data-render-complete',
        'true'
      );
    }
    public async getNrOfFetches() {
      const el = await find.byCssSelector('[data-fetch-counter]');
      const nr = await el.getAttribute('data-fetch-counter');
      return Number(nr);
    }

    /**
     * Check if Discover app is currently rendered on the screen.
     */
    public async isDiscoverAppOnScreen(): Promise<boolean> {
      const result = await find.allByCssSelector('discover-app');
      return result.length === 1;
    }

    /**
     * Wait until Discover app is rendered on the screen.
     */
    public async waitForDiscoverAppOnScreen() {
      await retry.waitFor('Discover app on screen', async () => {
        return await this.isDiscoverAppOnScreen();
      });
    }

    public async showAllFilterActions() {
      await testSubjects.click('showFilterActions');
    }

    public async clickSavedQueriesPopOver() {
      await testSubjects.click('saved-query-management-popover-button');
    }

    public async clickCurrentSavedQuery() {
      await testSubjects.click('saved-query-management-save-button');
    }

    public async setSaveQueryFormTitle(savedQueryName: string) {
      await testSubjects.setValue('saveQueryFormTitle', savedQueryName);
    }

    public async toggleIncludeFilters() {
      await testSubjects.click('saveQueryFormIncludeFiltersOption');
    }

    public async saveCurrentSavedQuery() {
      await testSubjects.click('savedQueryFormSaveButton');
    }

    public async deleteSavedQuery() {
      await testSubjects.click('delete-saved-query-TEST-button');
    }

    public async confirmDeletionOfSavedQuery() {
      await testSubjects.click('confirmModalConfirmButton');
    }

    public async clearSavedQuery() {
      await testSubjects.click('saved-query-management-clear-button');
    }

    /**
     * Retrieves data grid table values.
     *
     * This function fetches the values present in a data grid table.
     *
     * @returns {Promise<string[][]>} A promise resolving to the table values.
     */
    public async getDataGridTableValues(): Promise<string[][]> {
      return await dataGridTable.getDataGridTableValues();
    }

    /**
     * Removes sorting from a specified column in a data grid.
     *
     * This function removes sorting of column if applied in the sort field.
     *
     * @param {string} columnName - The name of the column from which sorting should be removed.
     * @returns {Promise<void>}
     */
    public async removeSort(columnName: string): Promise<void> {
      const parentDiv = await testSubjects.find(
        `euiDataGridColumnSorting-sortColumn-${columnName}`
      );

      // Within this parent div, locate the button with the specified aria-label using CSS and click it
      const cssSelector = `.euiDataGridColumnSorting__button[aria-label^="Remove from data grid sort: ${columnName}"]`;
      const buttonToRemoveSort = await parentDiv.findByCssSelector(cssSelector);
      await buttonToRemoveSort.click();
    }

    /**
     * Clicks on a list item within the table column header based on column name and title.
     *
     * This function searches for a list item via title associated with a given column name.
     * Once the item is found, its associated button is clicked.
     *
     * @param {string} columnName - The name of the column.
     * @param {string} title - The title of the list item to be clicked.
     * @returns {Promise<void>}
     * @throws Will throw an error if a clickable list item with the specified title is not found.
     */
    public async clickTableHeaderListItem(columnName: string, title: string): Promise<void> {
      // locate the ul using the columnName
      const ulElement = await testSubjects.find(`dataGridHeaderCellActionGroup-${columnName}`);
      const $ = await ulElement.parseDomContent();

      // loop through each <li> within the ul
      const liElements = $('li').toArray();
      let index = 0;

      for (const liElement of liElements) {
        const li = $(liElement);

        // Check if the li contains the isClickable class substring
        if (li.is('li[class*="euiListGroupItem-isClickable"]')) {
          const span = li.find(`span[title="${title}"]`);

          // If the span with the given title is found
          if (span.length > 0) {
            // find and click the button
            const seleniumLiElement = await ulElement.findByCssSelector(
              `li:nth-child(${index + 1}) button`
            );
            // Click on the located WebElement
            await seleniumLiElement.click();
            return;
          }
        }
        index++;
      }

      throw new Error(
        `Could not find a clickable list item for column "${columnName}" with list item "${title}".`
      );
    }
  }

  return new DiscoverPage();
}

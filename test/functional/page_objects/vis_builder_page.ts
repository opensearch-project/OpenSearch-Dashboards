/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { FtrProviderContext } from '../ftr_provider_context';

export function VisBuilderPageProvider({ getService, getPageObjects }: FtrProviderContext) {
  const testSubjects = getService('testSubjects');
  const find = getService('find');
  const browser = getService('browser');
  const comboBox = getService('comboBox');
  const { common, header } = getPageObjects(['common', 'header']);

  /**
   * This page object contains the visualization type selection, the landing page,
   * and the open/save dialog functions
   */
  class VisBuilderPage {
    index = {
      LOGSTASH_TIME_BASED: 'logstash-*',
      LOGSTASH_NON_TIME_BASED: 'logstash*',
    };

    public async navigateToCreateVisBuilder() {
      await common.navigateToApp('vis-builder');
      await header.waitUntilLoadingHasFinished();
    }

    public async getExperimentalInfo() {
      return await testSubjects.find('experimentalVisInfo');
    }

    public async findFieldByName(name: string) {
      const fieldSearch = await testSubjects.find('fieldFilterSearchInput');
      await fieldSearch.type(name);
    }

    public async getDataSourceSelector() {
      const dataSourceDropdown = await testSubjects.find('searchableDropdownValue');
      return await dataSourceDropdown.getVisibleText();
    }

    public async selectDataSource(dataSource: string) {
      await testSubjects.click('searchableDropdownValue');
      await find.clickByCssSelector(
        `[data-test-subj="searchableDropdownList"] [title="${dataSource}"]`
      );
      const dataSourceDropdown = await testSubjects.find('searchableDropdownValue');
      return await dataSourceDropdown.getVisibleText();
    }

    public async selectVisType(type: string, confirm = true) {
      const chartPicker = await testSubjects.find('chartPicker');
      await chartPicker.click();
      await testSubjects.click(`visType-${type}`);

      if (confirm) {
        await testSubjects.click('confirmModalConfirmButton');
      }

      return chartPicker.getVisibleText();
    }

    public async addField(
      dropBoxId: string,
      aggValue: string,
      fieldValue?: string,
      returnToMainPanel = true
    ) {
      await testSubjects.click(`dropBoxAddField-${dropBoxId} > dropBoxAddBtn`);
      await common.sleep(500);
      const aggComboBoxElement = await testSubjects.find('defaultEditorAggSelect');
      await comboBox.setElement(aggComboBoxElement, aggValue);
      await common.sleep(500);

      if (fieldValue) {
        const fieldComboBoxElement = await testSubjects.find('visDefaultEditorField');
        await comboBox.setElement(fieldComboBoxElement, fieldValue);
        await common.sleep(500);
      }

      if (returnToMainPanel) {
        await testSubjects.click('panelCloseBtn');
        await common.sleep(500);
      }
    }

    public async removeField(dropBoxId: string, aggNth: number) {
      await testSubjects.click(`dropBoxField-${dropBoxId}-${aggNth} > dropBoxRemoveBtn`);
      await common.sleep(500);
    }

    // TODO: Fix. Currently it is not able to locate the dropbox location correctly, even if it identifies the element correctly
    public async dragDropField(field: string, dropBoxId: string) {
      const fieldEle = await testSubjects.find(`field-${field}-showDetails`);
      const dropBoxEle = await testSubjects.find(`dropBoxAddField-${dropBoxId}`);
      await browser.dragAndDrop({ location: fieldEle }, { location: dropBoxEle });
    }

    public async clearFieldSearchInput() {
      const fieldSearch = await testSubjects.find('fieldFilterSearchInput');
      await fieldSearch.clearValue();
    }

    public async getMetric() {
      const elements = await find.allByCssSelector(
        '[data-test-subj="visualizationLoader"] .mtrVis__container'
      );
      const values = await Promise.all(
        elements.map(async (element) => {
          const text = await element.getVisibleText();
          return text;
        })
      );
      return values
        .filter((item) => item.length > 0)
        .reduce((arr: string[], item) => arr.concat(item.split('\n')), []);
    }

    public async isEmptyWorkspace() {
      const elements = await find.allByCssSelector('[data-test-subj="emptyWorkspace"]');
      return elements.length === 1;
    }
  }

  return new VisBuilderPage();
}

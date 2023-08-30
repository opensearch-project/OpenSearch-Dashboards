/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import expect from '@osd/expect';
import { FtrProviderContext } from '../../ftr_provider_context';

export default function ({ getService, getPageObjects }: FtrProviderContext) {
  const retry = getService('retry');
  const opensearchArchiver = getService('opensearchArchiver');
  const opensearchDashboardsServer = getService('opensearchDashboardsServer');
  const docTable = getService('docTable');
  const PageObjects = getPageObjects(['common', 'discover', 'header', 'timePicker']);

  describe('indexpattern with encoded id', () => {
    before(async () => {
      await opensearchArchiver.loadIfNeeded('index_pattern_with_encoded_id');
      await opensearchDashboardsServer.uiSettings.replace({
        defaultIndex: 'with-encoded-id',
        'discover:v2': false,
      });
      await PageObjects.common.navigateToApp('discover');
    });

    beforeEach(async function () {
      await PageObjects.timePicker.setDefaultAbsoluteRange();
    });

    after(async () => {
      await opensearchArchiver.unload('index_pattern_with_encoded_id');
    });

    describe('expand a document row', function () {
      const rowToInspect = 1;
      beforeEach(async function () {
        const details = await docTable.getDetailsRows();
        if (details.length) {
          await docTable.clickRowToggle({ isAnchorRow: false, rowIndex: rowToInspect - 1 });
        }
      });

      it('should expand the detail row when the toggle arrow is clicked', async function () {
        await retry.try(async function () {
          await docTable.clickRowToggle({ isAnchorRow: false, rowIndex: rowToInspect - 1 });
          const detailsEl = await docTable.getDetailsRows();
          const defaultMessageEl = await detailsEl[0].findByTestSubject('docTableRowDetailsTitle');
          expect(defaultMessageEl).to.be.ok();
        });
      });

      it('should show the detail panel actions', async function () {
        await retry.try(async function () {
          await docTable.clickRowToggle({ isAnchorRow: false, rowIndex: rowToInspect - 1 });
          const [surroundingActionEl, singleActionEl] = await docTable.getRowActions({
            isAnchorRow: false,
            rowIndex: rowToInspect - 1,
          });
          expect(surroundingActionEl).to.be.ok();
          expect(singleActionEl).to.be.ok();
        });
      });
    });
  });
}

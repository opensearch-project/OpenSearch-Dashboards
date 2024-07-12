/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ContentManagementService } from './content_management_service';

test('it should register pages', () => {
  const cms = new ContentManagementService();
  cms.registerPage({ id: 'page1' });
  cms.registerPage({ id: 'page2' });

  expect(cms.getPage('page1')).not.toBeUndefined();
  expect(cms.getPage('page2')).not.toBeUndefined();
});

test('it should throw error when register page with the same id', () => {
  const cms = new ContentManagementService();
  cms.registerPage({ id: 'page1' });
  expect(() => cms.registerPage({ id: 'page1' })).toThrowError();
});

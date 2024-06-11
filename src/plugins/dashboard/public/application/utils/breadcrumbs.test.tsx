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

import { ViewMode } from 'src/plugins/embeddable/public';
import { setBreadcrumbsForExistingDashboard, setBreadcrumbsForNewDashboard } from './breadcrumbs';

describe('breadcrumbs for ', () => {
  test('new dashboard in view mode', () => {
    const text = setBreadcrumbsForNewDashboard(ViewMode.VIEW, false);
    expect(text[1].text).toBe('New Dashboard');
  });

  test('new dashboard in edit mode without unsaved changes', () => {
    const text = setBreadcrumbsForNewDashboard(ViewMode.EDIT, false);
    expect(text[1].text).toBe('Editing New Dashboard');
  });

  test('new dashboard in edit mode with unsaved changes', () => {
    const text = setBreadcrumbsForNewDashboard(ViewMode.EDIT, true);
    expect(text[1].text).toBe('Editing New Dashboard (unsaved)');
  });

  test('existing dashboard in view mode', () => {
    const text = setBreadcrumbsForExistingDashboard('dashboard name', ViewMode.VIEW, false);
    expect(text[1].text).toBe('dashboard name');
  });

  test('existing dashboard in edit mode without unsaved changes', () => {
    const text = setBreadcrumbsForExistingDashboard('dashboard name', ViewMode.EDIT, false);
    expect(text[1].text).toBe('Editing dashboard name');
  });

  test('existing dashboard in edit mode with unsaved changes', () => {
    const text = setBreadcrumbsForExistingDashboard('dashboard name', ViewMode.EDIT, true);
    expect(text[1].text).toBe('Editing dashboard name (unsaved)');
  });
});

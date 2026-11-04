/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import _ from 'lodash';
import qs from 'query-string';
import { i18n } from '@osd/i18n';
import {
  SaveResult,
  SavedObjectSaveOpts,
  checkForDuplicateTitle,
  isErrorNonFatal,
} from '../../../../saved_objects/public';
import { url } from '../../../../opensearch_dashboards_utils/public';
import { createDashboardEditUrl } from '../../dashboard_constants';
import { DashboardAppStateContainer, DashboardServices } from '../../types';
import { SavedObjectDashboard } from '../../saved_dashboards';
import { updateSavedDashboard } from './update_saved_dashboard';
import {
  CopyDashboardPanelsResult,
  copyDashboardPanels,
  createAbortError,
} from './copy_dashboard_panels';

export interface SaveNewDashboardOptions {
  title: string;
  /** Omitted by clone: keeps the current value. */
  description?: string;
  /** Omitted by clone: keeps the current value. */
  timeRestore?: boolean;
  /** When set, copy each panel's saved object and title the copies with this template. */
  copyPanels?: { titleTemplate: string };
  saveOptions: Pick<SavedObjectSaveOpts, 'isTitleDuplicateConfirmed' | 'onTitleDuplicate'>;
  /** Aborted when the user closes the modal. */
  signal?: AbortSignal;
}

/**
 * Save the current dashboard as a new one (save as new / clone) and open it.
 * The new dashboard is built on a separate saved object, so the open dashboard
 * and its app state are never changed.
 *
 * Returns `{ id }` on success, `{ id: '' }` when the user must confirm a
 * duplicate title, `{ error }` on failure, or `{}` when the user cancelled
 * (the modal is already closed).
 */
export async function saveNewDashboard(
  options: SaveNewDashboardOptions,
  stateContainer: DashboardAppStateContainer,
  source: SavedObjectDashboard,
  services: DashboardServices
): Promise<SaveResult> {
  const { title, description, timeRestore, copyPanels, saveOptions, signal } = options;
  const { savedDashboards, savedObjects, overlays, notifications, chrome, history } = services;
  const state = stateContainer.getState();

  let copy: CopyDashboardPanelsResult | undefined;
  let copied = false;
  let id: string;
  try {
    // get() with no id makes no request and returns a blank dashboard.
    const draft = (await savedDashboards.get()) as SavedObjectDashboard;
    draft.title = title;
    // Check the title before copying, so a duplicate does not copy panels for nothing.
    await checkForDuplicateTitle(
      draft,
      Boolean(saveOptions.isTitleDuplicateConfirmed),
      saveOptions.onTitleDuplicate,
      { savedObjectsClient: savedObjects.client, overlays }
    );

    if (copyPanels) {
      copy = await copyDashboardPanels(savedObjects.client, state.panels, {
        titleTemplate: copyPanels.titleTemplate,
        dashboardTitle: title,
        signal,
        onCopied: () => (copied = true),
      });
    }
    if (signal?.aborted) throw createAbortError();

    // Keep the source's other searchSource keys (e.g. highlightAll), as the old
    // save path did. filter and query are set from app state just below.
    const { filter, query, ...otherFields } = source.searchSource.getFields();
    Object.entries(otherFields).forEach(([key, value]) =>
      draft.searchSource.setField(key as keyof typeof otherFields, value)
    );
    updateSavedDashboard(
      draft,
      {
        ...state,
        title,
        description: description ?? state.description,
        timeRestore: timeRestore ?? state.timeRestore,
        panels: copy?.panels ?? state.panels,
      },
      services.data.query.timefilter.timefilter
    );
    id = await draft.save({ confirmOverwrite: false, isTitleDuplicateConfirmed: true });
  } catch (e) {
    const error = e instanceof Error ? e : new Error(String(e));
    if (isErrorNonFatal(error)) return { id: '' }; // duplicate title: keep the modal open
    if (error.name === 'AbortError') return {};
    notifications.toasts.addDanger({
      title: i18n.translate('dashboard.dashboardWasNotSavedDangerMessage', {
        defaultMessage: `Dashboard '{dashTitle}' was not saved. Error: {errorMessage}`,
        values: { dashTitle: title, errorMessage: error.message },
      }),
      // Panel copies made before the failure are kept, not deleted.
      ...(copied && {
        text: i18n.translate('dashboard.copyPanels.copiesKeptOnFailure', {
          defaultMessage: 'Panels that were already copied are kept.',
        }),
      }),
      'data-test-subj': 'saveDashboardFailure',
    });
    // After a cancel the modal is already closed; an error would close it again.
    return signal?.aborted ? {} : { error };
  }

  // Toasts still show after a late cancel: the dashboard now exists, so the user
  // should know. Only the navigation below is skipped.
  notifications.toasts.addSuccess({
    title: i18n.translate('dashboard.dashboardWasSavedSuccessMessage', {
      defaultMessage: `Dashboard '{dashTitle}' was saved`,
      values: { dashTitle: title },
    }),
    'data-test-subj': 'saveDashboardSuccess',
  });
  if (copy?.failures.length) {
    notifications.toasts.addWarning({
      title: i18n.translate('dashboard.copyPanels.partialFailureTitle', {
        defaultMessage:
          '{count, plural, one {# panel was not copied and still uses the original} other {# panels were not copied and still use the original}}',
        values: { count: copy.failures.length },
      }),
      text: _.uniq(copy.failures).join(', '),
    });
  }
  if (signal?.aborted) return {};

  chrome.docTitle.change(title);
  // Drop `_a` so the new dashboard loads from its own saved object, not from the
  // current dashboard's app state. `_g` (time, pinned filters) is kept.
  const query = qs.parse(history.location.search, { sort: false });
  delete query._a;
  history.push({
    pathname: createDashboardEditUrl(id),
    search: qs.stringify(url.encodeQuery(query), { sort: false, encode: false }),
  });
  return { id };
}

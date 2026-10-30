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

import { createRoot } from 'react-dom/client';
import { i18n } from '@osd/i18n';
import { I18nProvider } from '@osd/i18n/react';
import { DashboardCloneModal } from './clone_modal';

export function showCloneModal(
  onClone: (
    newTitle: string,
    isTitleDuplicateConfirmed: boolean,
    onTitleDuplicate: () => void,
    copyPanels: boolean,
    titleTemplate: string,
    signal: AbortSignal
  ) => Promise<{ id?: string } | { error: Error }>,
  title: string
) {
  const container = document.createElement('div');
  const root = createRoot(container);
  const closeModal = () => {
    // Idempotent: Cancel-during-copy closes the modal synchronously, then the
    // aborted copy promise resolves and would try to close again. Guard against
    // a double removeChild (NotFoundError / unhandled rejection).
    if (!container.parentNode) {
      return;
    }
    root.unmount();
    document.body.removeChild(container);
  };

  const onCloneConfirmed = async (
    newTitle: string,
    isTitleDuplicateConfirmed: boolean,
    onTitleDuplicate: () => void,
    copyPanels: boolean,
    titleTemplate: string,
    signal: AbortSignal
  ) => {
    // Return the promise so DashboardCloneModal's `await this.props.onClone(...)`
    // keeps the Confirm button in its loading state for the ENTIRE copy + save
    // operation. Without this, a slow "Copy panels" clone could be submitted
    // again mid-flight and create a second set of copies.
    return onClone(
      newTitle,
      isTitleDuplicateConfirmed,
      onTitleDuplicate,
      copyPanels,
      titleTemplate,
      signal
    ).then((response: { id?: string } | { error: Error }) => {
      // Cancel already closed the modal; an aborted copy must not close it again.
      if ((response as { error: Error }).error?.name === 'AbortError') {
        return;
      }
      // The only time you don't want to close the modal is if it's asking you
      // to confirm a duplicate title, in which case there will be no error and no id.
      if ((response as { error: Error }).error || (response as { id?: string }).id) {
        closeModal();
      }
    });
  };
  document.body.appendChild(container);
  const element = (
    <I18nProvider>
      <DashboardCloneModal
        onClone={onCloneConfirmed}
        onClose={closeModal}
        title={i18n.translate('dashboard.topNav.showCloneModal.dashboardCopyTitle', {
          defaultMessage: '{title} Copy',
          values: { title },
        })}
      />
    </I18nProvider>
  );
  root.render(element);
}

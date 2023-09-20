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

import React from 'react';
import ReactDOM from 'react-dom';
import { I18nStart } from 'opensearch-dashboards/public';
import { SavedObjectsDuplicateModal, ShowDuplicateModalProps } from './duplicate_modal';

/**
 * Represents the result of trying to duplicate the saved object.
 * Contains `error` prop if something unexpected happened (e.g. network error).
 * Contains an `id` if persisting was successful. If `id` and
 * `error` are undefined, persisting was not successful, but the
 * modal can still recover (e.g. the name of the saved object was already taken).
 */

export function showDuplicateModal(
  showDuplicateModalProps: ShowDuplicateModalProps,
  I18nContext: I18nStart['Context']
) {
  const container = document.createElement('div');
  const closeModal = () => {
    ReactDOM.unmountComponentAtNode(container);
    document.body.removeChild(container);
  };

  const {
    http,
    workspaces,
    onDuplicate,
    duplicateMode,
    notifications,
    selectedSavedObjects,
  } = showDuplicateModalProps;

  const onDuplicateConfirmed: ShowDuplicateModalProps['onDuplicate'] = async (...args) => {
    await onDuplicate(...args);
    closeModal();
  };

  const duplicateModal = (
    <SavedObjectsDuplicateModal
      http={http}
      onClose={closeModal}
      workspaces={workspaces}
      notifications={notifications}
      duplicateMode={duplicateMode}
      onDuplicate={onDuplicateConfirmed}
      selectedSavedObjects={selectedSavedObjects}
    />
  );

  document.body.appendChild(container);

  ReactDOM.render(<I18nContext>{duplicateModal}</I18nContext>, container);
}

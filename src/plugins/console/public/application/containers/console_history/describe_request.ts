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

import { i18n } from '@osd/i18n';
import moment from 'moment';

/**
 * Label for one entry in the history list. Pure so it can be tested without
 * mounting ConsoleHistory and its three contexts.
 */
export function describeRequest(req: { endpoint: string; time: number; dataOmitted?: boolean }) {
  const endpoint = req.endpoint;
  const date = moment(req.time);

  let formattedDate = date.format('MMM D');
  if (date.diff(moment(), 'days') > -7) {
    formattedDate = date.fromNow();
  }

  // Stated here rather than as a toast on every oversized request.
  if (req.dataOmitted) {
    return i18n.translate('console.historyPage.requestWithBodyNotSavedDescription', {
      defaultMessage: '{endpoint} ({date}) - body not saved',
      values: { endpoint, date: formattedDate },
    });
  }

  return `${endpoint} (${formattedDate})`;
}

/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/*
 * Maps a failed streaming job onto the error shape the non-streaming path produces.
 *
 * The backend reports a failed job's cause under `error` on the snapshot. Consumers read specific
 * fields from it: the Traces charts recognise a missing field by
 * `message.type === 'SemanticCheckException'` and a `message.details` containing
 * "can't resolve Symbol", and name the field. Collapsing every failure into one generic message
 * hides that.
 */

import { i18n } from '@osd/i18n';
import type { PPLStreamError } from '../../../../../query_enhancements/common';
import { QueryResultStatus } from '../state_management/types';

type QueryError = NonNullable<QueryResultStatus['error']>;

const DEFAULT_STATUS_CODE = 500;

/** The structured cause the backend attaches to a FAILED snapshot. */
export const streamJobError = (error: PPLStreamError | undefined): QueryError => {
  // A job that reached FAILED without a cause is still known to have failed, so say that rather
  // than "Unknown Error". Consumers key off `type` and `details`, neither of which this invents.
  const reason =
    error?.reason ||
    i18n.translate('explore.streaming.error.jobFailed', {
      defaultMessage: 'The query failed on the server.',
    });
  return {
    statusCode: DEFAULT_STATUS_CODE,
    error: error?.type || reason,
    message: {
      details: error?.details || reason,
      reason,
      type: error?.type,
    },
    originalErrorMessage: reason,
  };
};

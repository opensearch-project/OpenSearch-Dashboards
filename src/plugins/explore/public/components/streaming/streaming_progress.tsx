/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiProgress, EuiScreenReaderOnly } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { StreamingQueryStatus } from '../../application/utils/state_management/types';
import {
  formatProgressPercent,
  getStreamingPhase,
} from '../tabs/action_bar/hits_counter/format_streaming_annotation';

const PROGRESS_LABEL = i18n.translate('explore.streaming.progressLabel', {
  defaultMessage: 'Query progress',
});

/** A live region speaks on every text change, so progress is announced in steps. */
const ANNOUNCE_STEP_PERCENT = 25;

/** A job reports 100% while its rows are still being read, before "finished". */
const MAX_RUNNING_STEP_PERCENT = 75;

export const formatStreamingAnnouncement = (streaming?: StreamingQueryStatus): string => {
  const phase = getStreamingPhase(streaming);
  const percent = formatProgressPercent(streaming?.fractionDone);

  switch (phase) {
    case 'polling': {
      const step =
        percent === undefined
          ? 0
          : Math.min(
              MAX_RUNNING_STEP_PERCENT,
              Math.floor(percent / ANNOUNCE_STEP_PERCENT) * ANNOUNCE_STEP_PERCENT
            );
      return step === 0
        ? i18n.translate('explore.streaming.announce.running', {
            defaultMessage: 'Query running',
          })
        : i18n.translate('explore.streaming.announce.runningAtPercent', {
            defaultMessage: 'Query running, {percent}% done',
            values: { percent: step },
          });
    }
    case 'completed':
      return i18n.translate('explore.streaming.announce.completed', {
        defaultMessage: 'Query finished',
      });
    case 'aborted':
      return i18n.translate('explore.streaming.announce.aborted', {
        defaultMessage: 'Query stopped',
      });
    case 'interrupted':
      return i18n.translate('explore.streaming.announce.interrupted', {
        defaultMessage: 'Query ended before it finished; results are incomplete',
      });
    default:
      return '';
  }
};

export const StreamingProgressBar = ({ streaming }: { streaming?: StreamingQueryStatus }) => {
  const known = typeof streaming?.fractionDone === 'number' && streaming.fractionDone >= 0;
  return (
    <EuiProgress
      size="xs"
      color="primary"
      position="absolute"
      aria-label={PROGRESS_LABEL}
      // An indeterminate bar renders a plain div, which assistive tech would not see at all.
      {...(known ? { value: streaming!.fractionDone, max: 1 } : { role: 'progressbar' })}
      data-test-subj="exploreQueryPanelStreamingProgress"
    />
  );
};

/** Kept mounted between runs: a live region only speaks for changes made after it is rendered. */
export const StreamingAnnouncer = ({ streaming }: { streaming?: StreamingQueryStatus }) => (
  <EuiScreenReaderOnly>
    <div role="status" aria-live="polite" data-test-subj="exploreStreamingAnnouncer">
      {formatStreamingAnnouncement(streaming)}
    </div>
  </EuiScreenReaderOnly>
);

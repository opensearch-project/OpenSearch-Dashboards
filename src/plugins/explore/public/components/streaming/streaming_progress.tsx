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

/** Steps at which progress is announced; finer would announce on almost every poll. */
const ANNOUNCE_STEP_PERCENT = 25;

/**
 * Highest step announced while running. A job reports 100% once scanning ends while its rows are
 * still being read, and "100% done" would then contradict the "finished" that follows.
 */
const MAX_RUNNING_STEP_PERCENT = 75;

/**
 * Text for the screen-reader announcer. A live region speaks whenever its text changes, so this
 * changes only at the run's start, at each progress step, and when it ends.
 */
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

/**
 * The query panel's bar for a streaming run: determinate while the engine reports a fraction,
 * indeterminate otherwise.
 */
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

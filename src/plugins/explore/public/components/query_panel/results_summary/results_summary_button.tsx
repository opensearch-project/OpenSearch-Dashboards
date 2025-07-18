/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useMemo, useCallback } from 'react';
import {
  EuiFlexGroup,
  EuiText,
  EuiIconTip,
  EuiSmallButtonIcon,
  EuiCopy,
  EuiPanel,
  EuiIcon,
  EuiButtonEmpty,
  EuiPopover,
  EuiHorizontalRule,
  EuiMarkdownFormat,
  EuiLoadingSpinner,
  EuiSpacer,
} from '@elastic/eui';
import { isEmpty } from 'lodash';
import { i18n } from '@osd/i18n';

import './results_summary.scss';

export enum FeedbackStatus {
  NONE = 'none',
  THUMB_UP = 'thumbup',
  THUMB_DOWN = 'thumbdown',
}

interface ResultsSummaryButtonProps {
  actionButtonVisible: boolean;
  feedback: FeedbackStatus;
  onFeedback: (satisfied: boolean) => void;
  summary: string;
  loading: boolean;
  onGenerateSummary: () => void;
  sampleSize: number;
  isPopoverOpen: boolean;
  setIsPopoverOpen: (state: boolean) => void;
  generateError: boolean;
}

export const ResultsSummaryButton: React.FC<ResultsSummaryButtonProps> = ({
  actionButtonVisible,
  feedback,
  onFeedback,
  summary,
  loading,
  onGenerateSummary,
  sampleSize,
  isPopoverOpen,
  setIsPopoverOpen,
  generateError,
}) => {
  const infoIconTooltip = i18n.translate('explore.resultsSummary.summary.sampletip', {
    defaultMessage: 'Summary based on first {sampleSize} records',
    values: { sampleSize },
  });

  const afterFeedbackTip = i18n.translate('explore.resultsSummary.summary.afterFeedback', {
    defaultMessage:
      'Thank you for the feedback. Try again by adjusting your question so that I have the opportunity to better assist you.',
  });

  const generateSummaryText = useMemo(() => {
    if (loading) {
      return i18n.translate('explore.resultsSummary.summary.loading', {
        defaultMessage: 'Generating...',
      });
    }
    if (isEmpty(summary)) {
      return i18n.translate('explore.resultsSummary.summary.generate', {
        defaultMessage: 'Generate Summary',
      });
    }
    return i18n.translate('explore.resultsSummary.summary.view', {
      defaultMessage: 'View Summary',
    });
  }, [loading, summary]);

  const handlePopoverButtonClick = useCallback(() => {
    if (!loading) {
      setIsPopoverOpen(!isPopoverOpen);
      if (isEmpty(summary)) {
        onGenerateSummary();
      }
    }
  }, [loading, summary, setIsPopoverOpen, isPopoverOpen, onGenerateSummary]);

  return (
    <>
      <EuiPopover
        button={
          <EuiButtonEmpty
            size="xs"
            className="exploreResultsSummary__button"
            aria-label={generateSummaryText}
            onClick={handlePopoverButtonClick}
          >
            <div className="exploreResultsSummary__buttonTextWrapper">
              {loading ? <EuiLoadingSpinner /> : <EuiIcon type="generateContent" size="s" />}
              <EuiText size="xs">{generateSummaryText}</EuiText>
            </div>
          </EuiButtonEmpty>
        }
        panelStyle={{ padding: 0 }}
        isOpen={isPopoverOpen}
        closePopover={() => setIsPopoverOpen(false)}
        ownFocus={false}
        onClick={(e) => e.stopPropagation()}
      >
        <EuiFlexGroup
          className="exploreResultsSummary__summaryContent"
          gutterSize="none"
          alignItems="center"
          justifyContent="spaceBetween"
        >
          <EuiFlexGroup alignItems="center" gutterSize="none" style={{ gap: 2 }}>
            <EuiIcon type="generateContent" />
            <EuiText size="s">
              <b>
                {i18n.translate('explore.resultsSummary.summary.panelTitle', {
                  defaultMessage: 'SUMMARY',
                })}
              </b>
            </EuiText>
            {!generateError && (
              <EuiIconTip
                type="iInCircle"
                anchorClassName="exploreResultsSummary_popover_tooltip"
                content={infoIconTooltip}
                aria-label={infoIconTooltip}
              />
            )}
          </EuiFlexGroup>
          <EuiSmallButtonIcon
            iconType="cross"
            color="text"
            onClick={() => setIsPopoverOpen(false)}
          />
        </EuiFlexGroup>

        <EuiHorizontalRule margin="none" />

        <EuiPanel
          className="exploreResultsSummary__summaryContent"
          paddingSize="s"
          hasBorder={false}
          borderRadius="none"
          hasShadow={false}
          style={{
            width: '30vw',
            maxHeight: '60vh',
            overflowY: 'auto',
            textAlign: generateError ? 'center' : 'unset',
          }}
        >
          {loading ? (
            <EuiText size="s" data-test-subj="exploreResultsSummary_summary_loading">
              {i18n.translate('explore.resultsSummary.summary.generating', {
                defaultMessage: 'Generating response...',
              })}
            </EuiText>
          ) : (
            <>
              <EuiText size="s" data-test-subj="exploreResultsSummary_summary_result">
                <EuiMarkdownFormat>{summary}</EuiMarkdownFormat>
              </EuiText>
              {actionButtonVisible && (
                <>
                  <EuiSpacer size="s" />
                  <EuiFlexGroup
                    gutterSize="none"
                    alignItems="center"
                    style={{ marginInlineStart: 4 }}
                  >
                    <EuiText size="xs">
                      {i18n.translate('explore.resultsSummary.summary.responseText', {
                        defaultMessage: 'Was this helpful?',
                      })}
                    </EuiText>
                    {feedback !== FeedbackStatus.THUMB_DOWN && (
                      <EuiSmallButtonIcon
                        aria-label="feedback thumbs up"
                        color={feedback === FeedbackStatus.THUMB_UP ? 'primary' : 'text'}
                        iconType="thumbsUp"
                        title={
                          !feedback
                            ? i18n.translate('explore.resultsSummary.summary.goodResponse', {
                                defaultMessage: `Good response`,
                              })
                            : afterFeedbackTip
                        }
                        onClick={() => onFeedback(true)}
                        data-test-subj="exploreResultsSummary_summary_buttons_thumbup"
                      />
                    )}
                    {feedback !== FeedbackStatus.THUMB_UP && (
                      <EuiSmallButtonIcon
                        aria-label="feedback thumbs down"
                        color={feedback === FeedbackStatus.THUMB_DOWN ? 'primary' : 'text'}
                        title={
                          !feedback
                            ? i18n.translate('explore.resultsSummary.summary.badResponse', {
                                defaultMessage: `Bad response`,
                              })
                            : afterFeedbackTip
                        }
                        iconType="thumbsDown"
                        onClick={() => onFeedback(false)}
                        data-test-subj="exploreResultsSummary_summary_buttons_thumbdown"
                      />
                    )}
                    <div className="exploreResultsSummary__verticalSeparator" />
                    <EuiCopy textToCopy={summary ?? ''}>
                      {(copy) => (
                        <EuiSmallButtonIcon
                          aria-label="Copy to clipboard"
                          title={i18n.translate('explore.resultsSummary.summary.copy', {
                            defaultMessage: `Copy to clipboard`,
                          })}
                          onClick={copy}
                          color="text"
                          iconType="copy"
                          data-test-subj="exploreResultsSummary_summary_buttons_copy"
                        />
                      )}
                    </EuiCopy>
                  </EuiFlexGroup>
                </>
              )}
            </>
          )}
        </EuiPanel>
      </EuiPopover>
    </>
  );
};

/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiText,
  EuiIconTip,
  EuiSmallButtonIcon,
  EuiCopy,
  EuiSmallButtonEmpty,
  EuiAccordion,
  EuiPanel,
  EuiIcon,
} from '@elastic/eui';
import React from 'react';
import { i18n } from '@osd/i18n';
import assistantMark from '../../assets/sparkle_mark.svg';

export enum FeedbackStatus {
  NONE = 'none',
  THUMB_UP = 'thumbup',
  THUMB_DOWN = 'thumbdown',
}

type AccordionState = 'closed' | 'open';

interface ResultsSummaryProps {
  accordionState: AccordionState;
  onClickAccordion: (isOpen: boolean) => void;
  actionButtonVisible: boolean;
  feedback: FeedbackStatus;
  afterFeedbackTip: string;
  onFeedback: (satisfied: boolean) => void;
  summary: string;
  canGenerateSummary: boolean;
  loading: boolean;
  onGenerateSummary: () => void;
  brandingLabel?: string;
  sampleSize: number;
  getPanelMessage: () => React.ReactNode;
}

export const ResultsSummary: React.FC<ResultsSummaryProps> = ({
  accordionState,
  onClickAccordion,
  actionButtonVisible,
  feedback,
  afterFeedbackTip,
  onFeedback,
  summary,
  canGenerateSummary,
  loading,
  onGenerateSummary,
  brandingLabel,
  sampleSize,
  getPanelMessage,
}) => {
  const infoIconTooltip = i18n.translate('explore.resultsSummary.summary.sampletip', {
    defaultMessage: 'Summary based on first {sampleSize} records',
    values: { sampleSize },
  });

  return (
    <EuiPanel
      className="resultsSummary"
      data-test-subj="resultsSummary"
      hasBorder={true}
      borderRadius="none"
      paddingSize="none"
    >
      <EuiAccordion
        id="resultsSummarySummaryAccordion"
        className="resultsSummary resultsSummary_accordion"
        forceState={accordionState}
        onToggle={onClickAccordion}
        extraAction={
          accordionState === 'open' && (
            <EuiFlexGroup
              justifyContent="spaceBetween"
              data-test-subj="resultsSummary_summary_buttons"
            >
              <EuiFlexItem>
                {actionButtonVisible && (
                  <EuiFlexGroup gutterSize="none" alignItems="center">
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
                        data-test-subj="resultsSummary_summary_buttons_thumbup"
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
                        data-test-subj="resultsSummary_summary_buttons_thumbdown"
                      />
                    )}
                    <div className="resultsSummary_divider" />
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
                          data-test-subj="resultsSummary_summary_buttons_copy"
                        />
                      )}
                    </EuiCopy>
                  </EuiFlexGroup>
                )}
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiSmallButtonEmpty
                  isDisabled={!canGenerateSummary}
                  isLoading={loading}
                  onClick={onGenerateSummary}
                  data-test-subj="resultsSummary_summary_buttons_generate"
                >
                  {i18n.translate('explore.resultsSummary.summary.generateSummary', {
                    defaultMessage: 'Generate summary',
                  })}
                </EuiSmallButtonEmpty>
              </EuiFlexItem>
            </EuiFlexGroup>
          )
        }
        buttonContent={
          <EuiFlexGroup
            gutterSize="none"
            alignItems="center"
            data-test-subj="resultsSummary_summary_accordion_button"
          >
            <EuiIcon type={assistantMark} />
            <EuiText size="s">
              <strong>
                {`${brandingLabel ?? ''} `}
                {i18n.translate('explore.resultsSummary.summary.panelTitle', {
                  defaultMessage: 'Results summary',
                })}
              </strong>
            </EuiText>
            <EuiIconTip type="iInCircle" content={infoIconTooltip} aria-label={infoIconTooltip} />
          </EuiFlexGroup>
        }
      >
        <EuiPanel color="transparent" hasBorder={false} paddingSize="s">
          {getPanelMessage()}
        </EuiPanel>
      </EuiAccordion>
    </EuiPanel>
  );
};

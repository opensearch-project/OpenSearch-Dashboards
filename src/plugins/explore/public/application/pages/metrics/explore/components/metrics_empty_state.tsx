/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiCodeBlock, EuiEmptyPrompt, EuiPanel, EuiSpacer, EuiText, EuiTitle } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import type { SourceTypeSampleQuery } from '../../../../../services/source_type_registry';
import { BUILT_IN_LANGUAGE_GUIDES } from '../../../../../services/source_type_registry/built_in_language_guides';
import './metrics_empty_state.scss';

// Prometheus's samples, for callers that don't pass a language's own.
const PROMQL_SAMPLE_QUERIES = BUILT_IN_LANGUAGE_GUIDES.PROMQL.sampleQueries ?? [];

export interface MetricsEmptyStateProps {
  title: string;
  body: string;
  /** What the active language queries, shown above `body`. */
  description?: string;
  iconType?: string;
  onSelectQuery?: (query: string) => void;
  /** Samples to show; Prometheus's PromQL samples by default. Empty hides the section. */
  sampleQueries?: SourceTypeSampleQuery[];
  /** Heading of the samples section. */
  sampleQueriesTitle?: string;
  /** Highlighting for the samples. */
  codeLanguage?: string;
}

export const MetricsEmptyState: React.FC<MetricsEmptyStateProps> = ({
  title,
  body,
  description,
  iconType = 'metricsApp',
  onSelectQuery,
  sampleQueries = PROMQL_SAMPLE_QUERIES,
  sampleQueriesTitle,
  codeLanguage = 'promql',
}) => {
  return (
    <EuiEmptyPrompt
      iconType={iconType}
      title={<h2>{title}</h2>}
      body={
        <>
          <EuiText size="s" color="subdued">
            {description && <p data-test-subj="metricsEmptyStateDescription">{description}</p>}
            <p>{body}</p>
          </EuiText>
          {sampleQueries.length > 0 && (
            <>
              <EuiSpacer size="m" />
              <EuiPanel paddingSize="m" color="subdued" hasShadow={false} hasBorder={false}>
                <EuiTitle size="xxs">
                  <h3>
                    {sampleQueriesTitle ??
                      i18n.translate('explore.metricsExplore.sampleQueriesTitle', {
                        defaultMessage: 'Sample PromQL queries',
                      })}
                  </h3>
                </EuiTitle>
                <EuiSpacer size="s" />
                {sampleQueries.map((sample) => {
                  const codeBlock = (
                    <EuiCodeBlock
                      language={codeLanguage}
                      className="metricsEmptyState__sampleCode"
                      fontSize="s"
                      paddingSize="s"
                      isCopyable
                      transparentBackground={false}
                    >
                      {sample.query}
                    </EuiCodeBlock>
                  );
                  return (
                    <div key={sample.label} style={{ textAlign: 'left' }}>
                      <EuiText size="xs">
                        <strong>{sample.label}</strong>
                      </EuiText>
                      <EuiSpacer size="xs" />
                      {onSelectQuery ? (
                        <button
                          type="button"
                          className="metricsEmptyState__sampleTrigger"
                          onClick={() => onSelectQuery(sample.query)}
                          aria-label={i18n.translate('explore.metricsExplore.useSampleQuery', {
                            defaultMessage: 'Use sample query: {label}',
                            values: { label: sample.label },
                          })}
                        >
                          {codeBlock}
                        </button>
                      ) : (
                        codeBlock
                      )}
                      <EuiSpacer size="s" />
                    </div>
                  );
                })}
              </EuiPanel>
            </>
          )}
        </>
      }
    />
  );
};

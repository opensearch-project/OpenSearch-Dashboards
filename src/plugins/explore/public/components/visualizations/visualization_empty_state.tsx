/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { Fragment } from 'react';
import {
  EuiEmptyPrompt,
  EuiLink,
  EuiPanel,
  EuiTabbedContent,
  EuiText,
  EuiSpacer,
  EuiCodeBlock,
  EuiIcon,
} from '@elastic/eui';
import { getServices } from '../../services/services';
import { getSourceTypeRegistry } from '../../services/source_type_registry';

const PPL_DOCS_URL = 'https://docs.opensearch.org/latest/search-plugins/sql/ppl/syntax/';

export interface VisualizationEmptyStateProps {
  /** The query's language. Defaults to the active query's. */
  language?: string;
  /** The query's dataset, whose source can describe the language. Defaults to the active one. */
  dataset?: { type?: string };
}

// The active query, when the caller doesn't pass one. Explore's services aren't set everywhere
// a visualization renders; then the language is unknown.
const activeQuery = (): VisualizationEmptyStateProps => {
  try {
    const query = getServices().data.query.queryString.getQuery();
    return { language: query?.language, dataset: query?.dataset };
  } catch {
    return {};
  }
};

const pplSampleQueries = () => [
  {
    key: 'faults',
    label: i18n.translate('explore.visualize.emptyState.sampleQuery.faults', {
      defaultMessage: 'Top services with faults',
    }),
    code: `| where severityNumber >= 17
| stats count() as count by serviceName
| sort -count
| head 10`,
  },
  {
    key: 'slow',
    label: i18n.translate('explore.visualize.emptyState.sampleQuery.slowOps', {
      defaultMessage: 'Top slow services',
    }),
    code: `| stats avg(durationInNanos) as duration by \`resource.attributes.service@name\`
| sort -duration
| head 10`,
  },
];

export const VisualizationEmptyState = (props: VisualizationEmptyStateProps = {}) => {
  const { language, dataset } = props.language ? props : activeQuery();

  // Samples in the query's own language: the source's (or Explore's) guide for it, else PPL's
  // on PPL and when the language isn't known. Other languages get none, rather than PPL samples
  // they can't run.
  const guide = getSourceTypeRegistry().getLanguageGuide(language, dataset);
  const isPPL = !language || language.toUpperCase() === 'PPL';
  const sampleQueries = guide.sampleQueries?.length
    ? guide.sampleQueries.map((sample) => ({
        key: sample.label,
        label: sample.label,
        code: sample.query,
      }))
    : isPPL
      ? pplSampleQueries()
      : [];
  const docsUrl = guide.docLink?.url ?? (isPPL ? PPL_DOCS_URL : undefined);

  const refLinkLabel = i18n.translate('explore.visualize.emptyState.docsLink', {
    defaultMessage: 'Reference documentations',
  });

  const tabs = [
    {
      id: 'sample',
      name: 'Sample queries',
      content: (
        <Fragment>
          <EuiSpacer size="xs" />
          {sampleQueries.map((info) => {
            return (
              <Fragment key={info.key}>
                <EuiSpacer size="xs" />
                <EuiText textAlign="left" size="s">
                  {info.label}
                </EuiText>
                <EuiSpacer size="xs" />
                <EuiCodeBlock fontSize="s" paddingSize="s" isCopyable>
                  {info.code}
                </EuiCodeBlock>
              </Fragment>
            );
          })}
          {docsUrl && (
            <>
              <EuiSpacer size="s" />
              <EuiText size="s">
                <EuiLink href={docsUrl} target="_blank">
                  {refLinkLabel}
                </EuiLink>
              </EuiText>
            </>
          )}
        </Fragment>
      ),
    },
  ];

  return (
    <>
      <EuiSpacer size="m" />
      <EuiEmptyPrompt
        icon={<EuiIcon type="visualizeApp" size="xl" />}
        style={{ padding: 0 }}
        title={
          <h3>
            {i18n.translate('explore.visualize.emptyState.title', {
              defaultMessage: 'Select a visualization type and fields to get started',
            })}
          </h3>
        }
        body={
          sampleQueries.length > 0 ? (
            <EuiPanel>
              <EuiTabbedContent
                tabs={tabs}
                initialSelectedTab={tabs[0]}
                size="s"
                autoFocus="selected"
                style={{ textAlign: 'start' }}
              />
            </EuiPanel>
          ) : undefined
        }
      />
    </>
  );
};

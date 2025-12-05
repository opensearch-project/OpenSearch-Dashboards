/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import React, { Fragment } from 'react';
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

export const VisualizationEmptyState = () => {
  const sampleQueries = [
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
          <EuiSpacer size="s" />
          <EuiText size="s">
            <EuiLink
              href="https://docs.opensearch.org/latest/search-plugins/sql/ppl/syntax/"
              target="_blank"
            >
              {refLinkLabel}
            </EuiLink>
          </EuiText>
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
          <EuiPanel>
            <EuiTabbedContent
              tabs={tabs}
              initialSelectedTab={tabs[0]}
              size="s"
              autoFocus="selected"
              style={{ textAlign: 'start' }}
            />
          </EuiPanel>
        }
      />
    </>
  );
};

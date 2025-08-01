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
      label: i18n.translate('explore.visualize.emptyState.sampleQuery.faults', {
        defaultMessage: 'Top services with faults',
      }),
      code: `FILTER \`attributes.http.response.status_code\` >= 500
| STATS count(*) as \`count\` by attributes.aws.local.service as service
| SORT count DESC
| LIMIT 5
| DISPLAY count,service`,
    },
    {
      label: i18n.translate('explore.visualize.emptyState.sampleQuery.slowOps', {
        defaultMessage: 'Top slow operations',
      }),
      code: `STATS pct(durationNano, 99) as \`p99\` by attributes.aws.local.operation
| SORT p99 DESC
| LIMIT 5
| DISPLAY p99,attributes.aws.local.operation`,
    },
    {
      label: i18n.translate('explore.visualize.emptyState.sampleQuery.slowDb', {
        defaultMessage: 'Top slow database statements',
      }),
      code: `STATS pct(durationNano, 99) as \`p99\` by attributes.db.statement
| SORT p99 DESC
| LIMIT 5
| DISPLAY p99,attributes.db.statement`,
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
              <>
                <EuiSpacer size="xs" />
                <EuiText textAlign="left" size="s">
                  {info.label}
                </EuiText>
                <EuiSpacer size="xs" />
                <EuiCodeBlock fontSize="s" paddingSize="s" isCopyable>
                  {info.code}
                </EuiCodeBlock>
              </>
            );
          })}
          <EuiSpacer size="s" />
          <EuiText size="s">
            <EuiLink href="https://opensearch.org/" target="_blank">
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

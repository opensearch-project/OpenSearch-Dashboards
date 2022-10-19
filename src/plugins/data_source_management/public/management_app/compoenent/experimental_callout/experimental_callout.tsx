/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiCallOut, EuiLink, EuiSpacer } from '@elastic/eui';
import { DocLinksStart } from 'opensearch-dashboards/public';
import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';

export const ExperimentalCallout = ({ docLinks }: { docLinks: DocLinksStart }) => {
  return (
    <>
      <EuiCallOut
        title={i18n.translate('dataSourcesManagement.experimentalFeatureCallout.title', {
          defaultMessage: 'Experimental Feature',
        })}
        iconType="iInCircle"
        data-test-subj="data-source-experimental-call"
      >
        <p>
          {
            <FormattedMessage
              id="dataSourcesManagement.experimentalFeatureCallout.description"
              defaultMessage="This feature is experimental and should not be used in a production environment. Any index patterns, visualization, and observability panels will be impacted if the feature is deactivated. For more information see "
            />
          }
          <EuiLink href={docLinks.links.noDocumentation.indexPatterns.introduction} target="_blank">
            {
              <FormattedMessage
                id="dataSourcesManagement.experimentalFeatureCallout.documentationText"
                defaultMessage="Data Source Documentation"
              />
            }
          </EuiLink>
          {
            <FormattedMessage
              id="dataSourcesManagement.experimentalFeatureCallout.feedbackText"
              defaultMessage="To leave feedback, visit "
            />
          }
          <EuiLink href={docLinks.links.noDocumentation.openSearchForum} target="_blank">
            {
              <FormattedMessage
                id="dataSourcesManagement.experimentalFeatureCallout.openForumText"
                defaultMessage="forum.opensearch.org"
              />
            }
          </EuiLink>
        </p>
      </EuiCallOut>
      <EuiSpacer size="m" />
    </>
  );
};

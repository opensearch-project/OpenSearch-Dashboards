/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiCard, EuiFlexGroup, EuiFlexItem, EuiText, EuiTextColor } from '@elastic/eui';
import React from 'react';
import { ApplicationStart, IBasePath } from 'opensearch-dashboards/public';
import { FormattedMessage } from '@osd/i18n/react';
import { formatUrlWithWorkspaceId } from '../../../../../core/public/utils';
import { GetStartCard } from './types';

export interface WorkspaceOverviewCardProps {
  card: GetStartCard;
  workspaceId: string;
  basePath: IBasePath;
  application: ApplicationStart;
}

export const WorkspaceOverviewCard = ({
  card,
  application,
  workspaceId,
  basePath,
}: WorkspaceOverviewCardProps) => {
  return (
    <EuiCard
      data-test-subj={card.featureName}
      layout="vertical"
      textAlign="left"
      title={
        <EuiText size="s">
          <p>{card.featureDescription}</p>
        </EuiText>
      }
      description={''}
      footer={
        <EuiFlexGroup justifyContent="flexStart">
          <EuiFlexItem grow={false}>
            <EuiTextColor color="subdued">
              <EuiText size="s">
                <FormattedMessage
                  id="workspace.overview.getStartCard.footer"
                  defaultMessage="with {featureName}"
                  values={{
                    featureName: card.featureName,
                  }}
                />
              </EuiText>
            </EuiTextColor>
          </EuiFlexItem>
        </EuiFlexGroup>
      }
      onClick={() => {
        let url = card.link;
        if (!url && card.id) {
          url = application.getUrlForApp(card.id);
        }

        if (workspaceId && url) {
          application.navigateToUrl(formatUrlWithWorkspaceId(url, workspaceId, basePath));
        }
      }}
    />
  );
};

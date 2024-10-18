/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { i18n } from '@osd/i18n';
import {
  EuiPanel,
  EuiFlexGroup,
  EuiFlexItem,
  EuiIcon,
  EuiText,
  EuiSmallButton,
  EuiSpacer,
  EuiTitle,
  EuiButtonEmpty,
} from '@elastic/eui';

interface NoIndexPatternsPanelProps {
  onOpenDataSelector: () => void;
}

export const NoIndexPatternsPanel: React.FC<NoIndexPatternsPanelProps> = ({
  onOpenDataSelector,
}) => (
  <EuiFlexGroup
    justifyContent="center"
    alignItems="center"
    gutterSize="none"
    className="dataUI-centerPanel"
  >
    <EuiFlexItem grow={false}>
      <EuiPanel paddingSize="l">
        <EuiFlexGroup direction="column" alignItems="center" gutterSize="m">
          <EuiFlexItem>
            <EuiIcon type="visBarVertical" size="xl" color="subdued" />
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiTitle size="m">
              <h2>
                {i18n.translate('data.noIndexPatterns.selectDataTitle', {
                  defaultMessage: 'Select data',
                })}
              </h2>
            </EuiTitle>
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiText textAlign="center" color="subdued" size="xs">
              {i18n.translate('data.noIndexPatterns.selectDataDescription', {
                defaultMessage:
                  'Select an available data source and choose a query language to use for running queries. You can use the data dropdown or use the enhanced data selector to select data.',
              })}
            </EuiText>
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiSmallButton fill onClick={onOpenDataSelector}>
              {i18n.translate('data.noIndexPatterns.openDataSelectorButton', {
                defaultMessage: 'Open data selector',
              })}
            </EuiSmallButton>
          </EuiFlexItem>
          <EuiSpacer size="s" />
          <EuiFlexItem>
            <EuiTitle size="xs">
              <h4>
                {i18n.translate('data.noIndexPatterns.learnMoreAboutQueryLanguages', {
                  defaultMessage: 'Learn more about query languages',
                })}
              </h4>
            </EuiTitle>
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiFlexGroup justifyContent="center" gutterSize="s" wrap>
              <EuiFlexItem grow={false}>
                <EuiButtonEmpty
                  href="https://opensearch.org/docs/latest/search-plugins/sql/ppl/syntax/"
                  target="_blank"
                  size="xs"
                  iconType="popout"
                  iconSide="right"
                  iconGap="s"
                >
                  <EuiText size="xs">
                    {i18n.translate('data.noIndexPatterns.pplDocumentation', {
                      defaultMessage: 'PPL documentation',
                    })}
                  </EuiText>
                </EuiButtonEmpty>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiButtonEmpty
                  href="https://opensearch.org/docs/latest/search-plugins/sql/sql/basic/"
                  target="_blank"
                  size="xs"
                  iconType="popout"
                  iconSide="right"
                  iconGap="s"
                >
                  <EuiText size="xs">
                    {i18n.translate('data.noIndexPatterns.sqlDocumentation', {
                      defaultMessage: 'SQL documentation',
                    })}
                  </EuiText>
                </EuiButtonEmpty>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiButtonEmpty
                  href="https://opensearch.org/docs/latest/query-dsl/full-text/query-string/"
                  target="_blank"
                  size="xs"
                  iconType="popout"
                  iconSide="right"
                  iconGap="s"
                >
                  <EuiText size="xs">
                    {i18n.translate('data.noIndexPatterns.luceneDocumentation', {
                      defaultMessage: 'Lucene documentation',
                    })}
                  </EuiText>
                </EuiButtonEmpty>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiButtonEmpty
                  href="https://opensearch.org/docs/latest/query-dsl/full-text/query-string/"
                  target="_blank"
                  size="xs"
                  iconType="popout"
                  iconSide="right"
                  iconGap="s"
                >
                  <EuiText size="xs">
                    {i18n.translate('data.noIndexPatterns.dqlDocumentation', {
                      defaultMessage: 'DQL documentation',
                    })}
                  </EuiText>
                </EuiButtonEmpty>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiPanel>
    </EuiFlexItem>
  </EuiFlexGroup>
);

/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './no_index_patterns.scss';
import React from 'react';
import { i18n } from '@osd/i18n';
import {
  EuiPanel,
  EuiFlexGroup,
  EuiFlexItem,
  EuiIcon,
  EuiText,
  EuiTitle,
  EuiButtonEmpty,
} from '@elastic/eui';
import { getServices } from '../../../opensearch_dashboards_services';
import { useFlavorId } from '../../../../../../helpers/use_flavor_id';
import { ExploreFlavor } from '../../../../../../../common';

export const DiscoverNoIndexPatterns: React.FC = () => {
  const languageService = getServices().data.query.queryString.getLanguageService();
  const registeredLanguages = languageService.getLanguages();
  const flavorId = useFlavorId();

  return (
    <EuiFlexGroup
      justifyContent="center"
      alignItems="center"
      gutterSize="none"
      className="discoverNoIndexPatterns-centerPanel"
      data-test-subj="discoverNoIndexPatterns"
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
                  {i18n.translate('explore.discover.noIndexPatterns.selectDataTitle', {
                    defaultMessage: 'Select data',
                  })}
                </h2>
              </EuiTitle>
            </EuiFlexItem>
            <EuiFlexItem>
              <EuiText textAlign="center" color="subdued" size="xs">
                {flavorId === ExploreFlavor.Metrics
                  ? i18n.translate('explore.discover.noIndexPatterns.selectPrometheusDescription', {
                      defaultMessage: 'Select a Prometheus data source to run queries in PromQL.',
                    })
                  : i18n.translate('explore.discover.noIndexPatterns.selectDataDescription', {
                      defaultMessage:
                        'Select an available data source and choose a query language to use for running queries. You can use the data dropdown or use the enhanced data selector to select data.',
                    })}
              </EuiText>
            </EuiFlexItem>
            <EuiFlexItem>
              <EuiTitle size="xs">
                <h4>
                  {i18n.translate('explore.discover.noIndexPatterns.learnMoreAboutQueryLanguages', {
                    defaultMessage: 'Learn more about query languages',
                  })}
                </h4>
              </EuiTitle>
            </EuiFlexItem>
            <EuiFlexItem>
              <EuiFlexGroup justifyContent="center" gutterSize="s" wrap>
                {registeredLanguages.map(
                  (language) =>
                    language.docLink && (
                      <EuiFlexItem grow={false} key={language.id}>
                        <EuiButtonEmpty
                          href={language.docLink.url}
                          target="_blank"
                          size="xs"
                          iconType="popout"
                          iconSide="right"
                          iconGap="s"
                        >
                          <EuiText size="xs">{language.docLink.title}</EuiText>
                        </EuiButtonEmpty>
                      </EuiFlexItem>
                    )
                )}
              </EuiFlexGroup>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiPanel>
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};

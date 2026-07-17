/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './no_index_patterns.scss';
import React, { useEffect, useState } from 'react';
import { i18n } from '@osd/i18n';
import {
  EuiPanel,
  EuiFlexGroup,
  EuiFlexItem,
  EuiIcon,
  EuiText,
  EuiTitle,
  EuiButton,
  EuiButtonEmpty,
} from '@elastic/eui';
import { AdvancedSelector } from '../../../../../../../../data/public';
import { DEFAULT_DATA, Query } from '../../../../../../../../data/common';
import { toMountPoint } from '../../../../../../../../opensearch_dashboards_react/public';
import { getServices } from '../../../opensearch_dashboards_services';
import {
  LOGS_DRILLDOWN_APP_ID,
  EXPLORE_DEFAULT_LANGUAGE,
  ExploreFlavor,
} from '../../../../../../../common';
import { getCurrentFlavor } from '../../../../../../helpers/get_flavor_from_app_id';

// Only these query-language docs are surfaced here: PPL always, SQL only when SQL support is enabled.
// (DQL/Lucene/PromQL links are intentionally omitted.) Repointed at the current docs site.
const PPL_DOC_URL = 'https://docs.opensearch.org/latest/sql-and-ppl/ppl/index/';
const SQL_DOC_URL = 'https://docs.opensearch.org/latest/sql-and-ppl/sql/index/';

export const DiscoverNoIndexPatterns: React.FC = () => {
  const services = getServices();
  const { sqlSupportEnabled, logsDrilldownEnabled } = services;

  // This empty state is shared by the Logs AND Traces flavors. Resolve the current flavor once on
  // mount so we only surface the "Logs drilldown" action on the Logs page (drilldown is a logs-only
  // canvas — it makes no sense from Traces). `getCurrentFlavor` is async, hence the state.
  const [flavor, setFlavor] = useState<ExploreFlavor | null>(null);
  useEffect(() => {
    let cancelled = false;
    getCurrentFlavor(services).then((f) => {
      if (!cancelled) setFlavor(f);
    });
    return () => {
      cancelled = true;
    };
  }, [services]);

  // Curated doc links: PPL (always) + SQL (only when SQL support is on), replacing the full
  // language list so onboarding users aren't shown languages that don't apply here.
  const docLinks = [
    {
      id: 'PPL',
      title: i18n.translate('explore.discover.noIndexPatterns.pplDocLink', {
        defaultMessage: 'PPL documentation',
      }),
      url: PPL_DOC_URL,
    },
    ...(sqlSupportEnabled
      ? [
          {
            id: 'SQL',
            title: i18n.translate('explore.discover.noIndexPatterns.sqlDocLink', {
              defaultMessage: 'SQL documentation',
            }),
            url: SQL_DOC_URL,
          },
        ]
      : []),
  ];

  // Secondary action: open the shared dataset-creation modal in place (like the dataset dropdown's
  // "Create dataset"). On save, set it as the active query so this empty state is replaced by results.
  const openCreateDataset = async () => {
    const datasetService = services.data.query.queryString.getDatasetService();
    // This empty state is shared by the Logs AND Traces flavors — create the dataset for whichever
    // flavor we're on (traces on the traces page, logs on the logs page), mirroring the on-page
    // dataset dropdown which uses `signalType={flavorId}`. Falls back to logs if the flavor is
    // unknown. `ExploreFlavor` values match CORE_SIGNAL_TYPES ('logs'/'traces'/'metrics').
    const createFlavor = flavor ?? (await getCurrentFlavor(services)) ?? ExploreFlavor.Logs;
    // Holder so the modal's own callbacks can close it (the ref is set right after openModal).
    const modalHolder: { close: () => void } = { close: () => {} };
    const element = React.createElement(AdvancedSelector, {
      services: services as any,
      useConfiguratorV2: true,
      alwaysShowDatasetFields: true,
      signalType: createFlavor,
      // Match the on-page dataset dropdown's "Create dataset" modal exactly (same supportedTypes +
      // showNonTimeFieldDatasets) so the same advanced selector opens, not a different type picker.
      supportedTypes: services.supportedTypes || [
        DEFAULT_DATA.SET_TYPES.INDEX,
        DEFAULT_DATA.SET_TYPES.INDEX_PATTERN,
      ],
      showNonTimeFieldDatasets: false,
      onCancel: () => modalHolder.close(),
      onSelect: async (query: Partial<Query>, saveDataset?: boolean) => {
        modalHolder.close();
        if (!query?.dataset) return;
        try {
          if (saveDataset) {
            await datasetService.saveDataset(query.dataset, services, createFlavor);
            services.data.dataViews.clearCache();
          } else {
            await datasetService.cacheDataset(query.dataset, services, false, createFlavor);
          }
          const initialQuery = services.data.query.queryString.getInitialQueryByDataset({
            ...query.dataset,
            language: query.dataset.language || EXPLORE_DEFAULT_LANGUAGE,
          });
          services.data.query.queryString.setQuery(initialQuery);
        } catch (error) {
          services.notifications?.toasts.addError(error as Error, {
            title: i18n.translate('explore.discover.noIndexPatterns.createDatasetError', {
              defaultMessage: 'Error creating dataset',
            }),
          });
        }
      },
    });
    const modal = services.overlays.openModal(toMountPoint(element), {
      maxWidth: false,
      className: 'datasetSelect__advancedModal',
    });
    modalHolder.close = () => modal.close();
  };

  // Logs drilldown is a logs-only onboarding canvas, so only offer it on the Logs flavor (this empty
  // state is shared with Traces) and when the feature is enabled.
  const showLogsDrilldown = logsDrilldownEnabled && flavor === ExploreFlavor.Logs;

  // Description points at the on-screen CTAs. When Logs drilldown is available we surface both ways
  // to create a dataset (guided canvas vs. the enhanced selector); otherwise just the selector.
  const selectDataDescription = showLogsDrilldown
    ? i18n.translate('explore.discover.noIndexPatterns.selectDataDescriptionWithDrilldown', {
        defaultMessage:
          'Get started by creating a dataset — explore your indexes with the guided Explore logs experience, or pick your data with the Create dataset button. You can also select data from the dropdown above.',
      })
    : i18n.translate('explore.discover.noIndexPatterns.selectDataDescription', {
        defaultMessage:
          'Get started by creating a dataset with the Create dataset button, then choose a query language to run your queries. You can also select data from the dropdown above.',
      });

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
                {selectDataDescription}
              </EuiText>
            </EuiFlexItem>
            {/* Primary CTAs row: Create dataset (+ guided Logs drilldown on the Logs flavor). */}
            <EuiFlexItem>
              <EuiFlexGroup justifyContent="center" gutterSize="s" responsive={false}>
                <EuiFlexItem grow={false}>
                  <EuiButton
                    size="s"
                    onClick={openCreateDataset}
                    data-test-subj="discoverNoIndexPatternsCreateDataset"
                  >
                    {i18n.translate('explore.discover.noIndexPatterns.createDataset', {
                      defaultMessage: 'Create dataset',
                    })}
                  </EuiButton>
                </EuiFlexItem>
                {showLogsDrilldown && (
                  <EuiFlexItem grow={false}>
                    <EuiButton
                      fill
                      size="s"
                      iconType="inspect"
                      onClick={() =>
                        services.core.application.navigateToApp(LOGS_DRILLDOWN_APP_ID, {
                          path: '#/',
                        })
                      }
                      data-test-subj="discoverNoIndexPatternsLogsDrilldown"
                    >
                      {i18n.translate('explore.discover.noIndexPatterns.logsDrilldown', {
                        defaultMessage: 'Explore logs',
                      })}
                    </EuiButton>
                  </EuiFlexItem>
                )}
              </EuiFlexGroup>
            </EuiFlexItem>
            {/* Docs row (last): the "Learn more" label sits inline (not bold) with the doc links. */}
            <EuiFlexItem>
              <EuiFlexGroup
                justifyContent="center"
                alignItems="center"
                gutterSize="xs"
                wrap
                responsive={false}
              >
                <EuiFlexItem grow={false}>
                  <EuiText size="xs" color="subdued">
                    {i18n.translate(
                      'explore.discover.noIndexPatterns.learnMoreAboutQueryLanguages',
                      {
                        defaultMessage: 'Learn more about query languages',
                      }
                    )}
                  </EuiText>
                </EuiFlexItem>
                {docLinks.map((doc) => (
                  <EuiFlexItem grow={false} key={doc.id}>
                    <EuiButtonEmpty
                      href={doc.url}
                      target="_blank"
                      size="xs"
                      iconType="popout"
                      iconSide="right"
                      iconGap="s"
                      data-test-subj={`discoverNoIndexPatternsDoc-${doc.id}`}
                    >
                      <EuiText size="xs">{doc.title}</EuiText>
                    </EuiButtonEmpty>
                  </EuiFlexItem>
                ))}
              </EuiFlexGroup>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiPanel>
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};

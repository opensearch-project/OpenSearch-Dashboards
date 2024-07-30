/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';

import './discover_chart_container.scss';
import React, { useMemo, useState } from 'react';
import {
  EuiButtonIcon,
  EuiCompressedSwitch,
  EuiContextMenu,
  EuiPanel,
  EuiPopover,
} from '@elastic/eui';
import { DiscoverViewServices } from '../../../build_services';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { useDiscoverContext } from '../context';
import { SearchData } from '../utils/use_search';
import { DiscoverChart } from '../../components/chart/chart';
import { QUERY_ENHANCEMENT_ENABLED_SETTING } from '../../../../common';
import { getNewDiscoverSetting, setNewDiscoverSetting } from '../../components/utils/local_storage';

export const DiscoverChartContainer = ({ hits, bucketInterval, chartData }: SearchData) => {
  const { services } = useOpenSearchDashboards<DiscoverViewServices>();
  const { uiSettings, data, core, storage } = services;
  const { indexPattern, savedSearch } = useDiscoverContext();
  const isEnhancementsEnabled = uiSettings.get(QUERY_ENHANCEMENT_ENABLED_SETTING);
  const [isOptionsOpen, setOptionsOpen] = useState(false);
  const [useLegacy, setUseLegacy] = useState(!getNewDiscoverSetting(storage));

  const isTimeBased = useMemo(() => (indexPattern ? indexPattern.isTimeBased() : false), [
    indexPattern,
  ]);

  if (!hits) return null;

  const discoverOptions = (
    <EuiPopover
      button={
        <EuiButtonIcon
          data-test-subj="discoverOptionsButton"
          aria-label={i18n.translate('discover.canvas.discoverOptionsButtonLabel', {
            defaultMessage: 'Options for discover',
          })}
          size="s"
          iconType="gear"
          onClick={() => setOptionsOpen(!isOptionsOpen)}
        />
      }
      closePopover={() => setOptionsOpen(false)}
      isOpen={isOptionsOpen}
      panelPaddingSize="none"
    >
      <EuiContextMenu
        initialPanelId={0}
        size="s"
        panels={[
          {
            id: 0,
            title: 'Options',
            content: (
              <EuiPanel>
                <EuiCompressedSwitch
                  label="Enable legacy Discover"
                  checked={useLegacy}
                  data-test-subj="discoverOptionsLegacySwitch"
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setUseLegacy(checked);
                    setNewDiscoverSetting(!checked, storage);
                    window.location.reload();
                  }}
                />
              </EuiPanel>
            ),
          },
        ]}
      />
    </EuiPopover>
  );

  return (
    <DiscoverChart
      bucketInterval={bucketInterval}
      chartData={chartData}
      config={uiSettings}
      data={data}
      hits={hits}
      resetQuery={() => {
        core.application.navigateToApp('discover', { path: `#/view/${savedSearch?.id}` });
      }}
      services={services}
      showResetButton={!!savedSearch && !!savedSearch.id}
      isTimeBased={isTimeBased}
      isEnhancementsEnabled={isEnhancementsEnabled}
      discoverOptions={discoverOptions}
    />
  );
};

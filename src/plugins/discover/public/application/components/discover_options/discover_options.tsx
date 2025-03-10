/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  EuiButtonIcon,
  EuiCompressedSwitch,
  EuiContextMenu,
  EuiPanel,
  EuiPopover,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { getNewDiscoverSetting, setNewDiscoverSetting } from '../utils/local_storage';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { DiscoverViewServices } from '../../../build_services';

/**
 * deprecated - we will no longer support this option. Only legacyDiscoverTable will be supported
 */
export const DiscoverOptions = () => {
  const { services } = useOpenSearchDashboards<DiscoverViewServices>();
  const { storage } = services;
  const [isOptionsOpen, setOptionsOpen] = useState(false);
  const [useLegacy, setUseLegacy] = useState(!getNewDiscoverSetting(storage));

  return (
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
};

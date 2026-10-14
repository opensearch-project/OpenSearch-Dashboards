/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useState } from 'react';
import { i18n } from '@osd/i18n';
import { useSelector } from 'react-redux';
import { EuiButtonEmpty, EuiContextMenuItem, EuiContextMenuPanel, EuiPopover } from '@elastic/eui';
import { ExploreFlavor } from '../../../../common';
import {
  getSourceTypeRegistry,
  SourceTypeDefinition,
} from '../../../services/source_type_registry';
import { selectDataset } from '../../utils/state_management/selectors';
import { useSwitchSourceType } from '../../hooks';

/**
 * The Metrics page's source type switch (e.g. Prometheus and a plugin-registered source), next to the
 * dataset picker so it is there in both the Explore and Query modes. Shown only when a source
 * other than the built-in one is registered for Metrics. Picking a source opens its default
 * dataset; its own picker (or the Prometheus connection picker) then refines it.
 */
export const MetricsSourceTypeSelect: React.FC = () => {
  const activeDataset = useSelector(selectDataset);
  const [isOpen, setOpen] = useState(false);
  const switchSourceType = useSwitchSourceType(ExploreFlavor.Metrics);

  const registry = getSourceTypeRegistry();
  const sourceTypes = registry.getAll(ExploreFlavor.Metrics);
  const active = registry.getForDataset(activeDataset);

  const switchTo = useCallback(
    async (sourceType: SourceTypeDefinition) => {
      setOpen(false);
      if (sourceType.id !== active.id) await switchSourceType(sourceType);
    },
    [active.id, switchSourceType]
  );

  if (sourceTypes.length < 2) return null;

  return (
    <EuiPopover
      isOpen={isOpen}
      closePopover={() => setOpen(false)}
      panelPaddingSize="none"
      anchorPosition="downLeft"
      button={
        <EuiButtonEmpty
          size="xs"
          iconType="arrowDown"
          iconSide="right"
          onClick={() => setOpen((open) => !open)}
          data-test-subj="metricsSourceTypeSelect"
          aria-label={i18n.translate('explore.metricsSourceType.ariaLabel', {
            defaultMessage: 'Source type',
          })}
        >
          {registry.getLabel(active, ExploreFlavor.Metrics)}
        </EuiButtonEmpty>
      }
    >
      <EuiContextMenuPanel
        size="s"
        title={i18n.translate('explore.metricsSourceType.title', {
          defaultMessage: 'Source type',
        })}
        items={sourceTypes.map((sourceType) => (
          <EuiContextMenuItem
            key={sourceType.id}
            icon={sourceType.id === active.id ? 'check' : 'empty'}
            onClick={() => switchTo(sourceType)}
            data-test-subj={`metricsSourceType-${sourceType.id}`}
          >
            {registry.getLabel(sourceType, ExploreFlavor.Metrics)}
          </EuiContextMenuItem>
        ))}
      />
    </EuiPopover>
  );
};

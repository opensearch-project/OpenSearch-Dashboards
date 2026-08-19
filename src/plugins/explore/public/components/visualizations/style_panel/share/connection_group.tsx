/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { EuiFormRow, EuiButtonGroup } from '@elastic/eui';
import { DisableMode, ConnectNullValuesOption, DisconnectValuesOption } from '../../types';
import { DebouncedFieldText } from '../utils';

// Duration used when a gap threshold is switched on before the user types one.
export const DEFAULT_GAP_THRESHOLD = '1h';

const connectNullValuesOptions = [
  {
    id: DisableMode.Never,
    label: i18n.translate('explore.stylePanel.connection.connectNullValues.never', {
      defaultMessage: 'Never',
    }),
  },
  {
    id: DisableMode.Always,
    label: i18n.translate('explore.stylePanel.connection.connectNullValues.always', {
      defaultMessage: 'Always',
    }),
  },
  {
    id: DisableMode.Threshold,
    label: i18n.translate('explore.stylePanel.connection.connectNullValues.threshold', {
      defaultMessage: 'Threshold',
    }),
  },
];

const disconnectValuesOptions = [
  {
    id: DisableMode.Never,
    label: i18n.translate('explore.stylePanel.disconnection.disconnectValues.never', {
      defaultMessage: 'Never',
    }),
  },
  {
    id: DisableMode.Threshold,
    label: i18n.translate('explore.stylePanel.disconnection.disconnectValues.threshold', {
      defaultMessage: 'Threshold',
    }),
  },
];

interface Props {
  connectMode: DisableMode;
  disconnectMode: DisableMode;
  connectNullValues?: ConnectNullValuesOption;
  disconnectValues?: DisconnectValuesOption;
  onConnectNullValuesChange: (connectNullValues: ConnectNullValuesOption) => void;
  onDisconnectValuesChange: (disconnectValues: DisconnectValuesOption) => void;
  testsubj?: string;
}

export const ConnectionGroup = ({
  connectMode,
  disconnectMode,
  disconnectValues,
  connectNullValues,
  onDisconnectValuesChange,
  onConnectNullValuesChange,
  testsubj = 'area',
}: Props) => {
  return (
    <>
      {' '}
      <EuiFormRow
        label={i18n.translate('explore.stylePanel.area.disconnectValues', {
          defaultMessage: 'Disconnect values',
        })}
      >
        <EuiButtonGroup
          legend={i18n.translate('explore.stylePanel.area.disconnectValues.options', {
            defaultMessage: 'Disconnect values options',
          })}
          isDisabled={connectMode !== DisableMode.Never}
          options={disconnectValuesOptions.map((option) => ({
            ...option,
            'data-test-subj': `${testsubj}DisconnectValues-${option.id}`,
          }))}
          idSelected={disconnectMode}
          onChange={(id) =>
            onDisconnectValuesChange({
              threshold: disconnectValues?.threshold ?? DEFAULT_GAP_THRESHOLD,
              disableMode: id as DisableMode,
            })
          }
          buttonSize="compressed"
          isFullWidth
          data-test-subj={`${testsubj}DisconnectValuesButtonGroup`}
        />
      </EuiFormRow>
      {disconnectMode === DisableMode.Threshold && (
        <EuiFormRow
          label={i18n.translate('explore.stylePanel.area.disconnectValues.thresholdLabel', {
            defaultMessage: 'Disconnect threshold',
          })}
          helpText={i18n.translate('explore.stylePanel.area.disconnectValues.thresholdHelp', {
            defaultMessage: 'Break the area when points sit further apart than this.',
          })}
        >
          <DebouncedFieldText
            value={disconnectValues?.threshold ?? DEFAULT_GAP_THRESHOLD}
            onChange={(threshold) =>
              onDisconnectValuesChange({
                disableMode: disconnectMode,
                threshold,
              })
            }
            placeholder={DEFAULT_GAP_THRESHOLD}
            data-test-subj={`${testsubj}DisconnectValuesThreshold`}
          />
        </EuiFormRow>
      )}
      <EuiFormRow
        label={i18n.translate('explore.stylePanel.area.connectNullValues', {
          defaultMessage: 'Connect null values',
        })}
      >
        <EuiButtonGroup
          legend={i18n.translate('explore.stylePanel.area.connectNullValues.options', {
            defaultMessage: 'Connect null values options',
          })}
          isDisabled={disconnectMode !== DisableMode.Never}
          options={connectNullValuesOptions.map((option) => ({
            ...option,
            'data-test-subj': `${testsubj}ConnectNullValues-${option.id}`,
          }))}
          idSelected={connectMode}
          onChange={(id) =>
            onConnectNullValuesChange({
              threshold: connectNullValues?.threshold ?? DEFAULT_GAP_THRESHOLD,
              connectMode: id as DisableMode,
            })
          }
          buttonSize="compressed"
          isFullWidth
          data-test-subj={`${testsubj}ConnectNullValuesButtonGroup`}
        />
      </EuiFormRow>
      {connectMode === DisableMode.Threshold && (
        <EuiFormRow
          label={i18n.translate('explore.stylePanel.area.connectNullValues.thresholdLabel', {
            defaultMessage: 'Connect threshold',
          })}
          helpText={i18n.translate('explore.stylePanel.area.connectNullValues.thresholdHelp', {
            defaultMessage: 'Bridge gaps shorter than this, e.g. 5m or 1h.',
          })}
        >
          <DebouncedFieldText
            value={connectNullValues?.threshold ?? DEFAULT_GAP_THRESHOLD}
            onChange={(threshold) =>
              onConnectNullValuesChange({
                connectMode,
                threshold,
              })
            }
            placeholder={DEFAULT_GAP_THRESHOLD}
            data-test-subj={`${testsubj}ConnectNullValuesThreshold`}
          />
        </EuiFormRow>
      )}
    </>
  );
};

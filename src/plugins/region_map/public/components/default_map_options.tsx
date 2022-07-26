/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useMemo } from 'react';
import { EuiPanel, EuiSpacer, EuiTitle, EuiFlexItem, EuiFlexGroup } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';
import { VisOptionsProps } from 'src/plugins/vis_default_editor/public';
import { FileLayerField, VectorLayer, IServiceSettings } from '../../../maps_legacy/public';
import { SelectOption, SwitchOption } from '../../../charts/public';
import { RegionMapVisParams } from '../../../maps_legacy/public';

const mapLayerForOption = ({ layerId, name }: VectorLayer) => ({
  text: name,
  value: layerId,
});

const mapFieldForOption = ({ description, name }: FileLayerField) => ({
  text: description,
  value: name,
});

export type DefaultMapOptionsProps = {
  getServiceSettings: () => Promise<IServiceSettings>;
} & VisOptionsProps<RegionMapVisParams>;

function DefaultMapOptions(props: DefaultMapOptionsProps) {
  const { getServiceSettings, stateParams, vis, setValue } = props;

  const vectorLayers = vis.type.editorConfig.collections.vectorLayers;
  const vectorLayerOptions = useMemo(() => vectorLayers.map(mapLayerForOption), [vectorLayers]);

  const fieldOptions = useMemo(
    () =>
      ((stateParams.selectedLayer && stateParams.selectedLayer.fields) || []).map(
        mapFieldForOption
      ),
    [stateParams.selectedLayer]
  );

  const setEmsHotLink = useCallback(
    async (layer: VectorLayer) => {
      const serviceSettings = await getServiceSettings();
      const emsHotLink = await serviceSettings.getEMSHotLink(layer);
      setValue('emsHotLink', emsHotLink);
    },
    [setValue, getServiceSettings]
  );

  const setLayer = useCallback(
    async (paramName: 'selectedLayer', value: VectorLayer['layerId']) => {
      const newLayer = vectorLayers.find(({ layerId }: VectorLayer) => layerId === value);

      if (newLayer) {
        setValue(paramName, newLayer);
        setValue('selectedJoinField', newLayer.fields[0]);
        setEmsHotLink(newLayer);
      }
    },
    [vectorLayers, setEmsHotLink, setValue]
  );

  const setField = useCallback(
    (paramName: 'selectedJoinField', value: FileLayerField['name']) => {
      if (stateParams.selectedLayer) {
        setValue(
          paramName,
          stateParams.selectedLayer.fields.find((f) => f.name === value)
        );
      }
    },
    [setValue, stateParams.selectedLayer]
  );

  return (
    <EuiPanel paddingSize="s">
      <EuiTitle size="xs">
        <h2>
          <FormattedMessage
            id="regionMap.visParams.layerSettingsTitle"
            defaultMessage="Layer settings"
          />
        </h2>
      </EuiTitle>
      <EuiSpacer size="m" />
      <EuiFlexGroup id="defaultMapSelection" direction="column">
        <EuiFlexItem grow={false}>
          <SelectOption
            id="regionMapOptionsSelectLayer"
            label={i18n.translate('regionMap.visParams.vectorMapLabel', {
              defaultMessage: 'Vector map',
            })}
            options={vectorLayerOptions}
            paramName="selectedLayer"
            value={stateParams.selectedLayer && stateParams.selectedLayer.layerId}
            setValue={setLayer}
          />
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <SelectOption
            id="regionMapOptionsSelectJoinField"
            label={i18n.translate('regionMap.visParams.joinFieldLabel', {
              defaultMessage: 'Join field',
            })}
            options={fieldOptions}
            paramName="selectedJoinField"
            value={stateParams.selectedJoinField && stateParams.selectedJoinField.name}
            setValue={setField}
          />
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiSpacer size="m" />
      <SwitchOption
        label={i18n.translate('regionMap.visParams.displayWarningsLabel', {
          defaultMessage: 'Display warnings',
        })}
        tooltip={i18n.translate('regionMap.visParams.switchWarningsTipText', {
          defaultMessage:
            'Turns on/off warnings. When turned on, warning will be shown for each term that cannot be matched to a shape in the vector layer based on the join field. When turned off, these warnings will be turned off.',
        })}
        paramName="isDisplayWarning"
        value={stateParams.isDisplayWarning}
        setValue={setValue}
      />

      <SwitchOption
        label={i18n.translate('regionMap.visParams.showAllShapesLabel', {
          defaultMessage: 'Show all shapes',
        })}
        tooltip={i18n.translate('regionMap.visParams.turnOffShowingAllShapesTipText', {
          defaultMessage:
            'Turning this off only shows the shapes that were matched with a corresponding term.',
        })}
        paramName="showAllShapes"
        value={stateParams.showAllShapes}
        setValue={setValue}
      />
    </EuiPanel>
  );
}

export { DefaultMapOptions };

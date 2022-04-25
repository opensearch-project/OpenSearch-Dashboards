/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useMemo, useState } from 'react';
import {
  EuiPanel,
  EuiSpacer,
  EuiText,
  EuiTitle,
  EuiCheckableCard,
  EuiFlexItem,
  EuiFlexGroup,
  EuiTextColor,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';
import { VisOptionsProps } from 'src/plugins/vis_default_editor/public';
import { FileLayerField, VectorLayer, IServiceSettings } from '../../../maps_legacy/public';
import { NumberInputOption, SelectOption, SwitchOption } from '../../../charts/public';
import { RegionMapVisParams, WmsOptions } from '../../../maps_legacy/public';
import { Services, getServices } from '../services';

const mapLayerForOption = ({ layerId, name }: VectorLayer) => ({
  text: name,
  value: layerId,
});

const mapFieldForOption = ({ description, name }: FileLayerField) => ({
  text: description,
  value: name,
});

const mapCustomJoinFieldForOption = ({ description, name }: FileLayerField) => ({
  label: name,
  text: description,
  value: name,
});

export type MapChoiceOptionsProps = {
  getServiceSettings: () => Promise<IServiceSettings>;
} & VisOptionsProps<RegionMapVisParams>;

function MapChoiceOptions(props) {
  const { getServiceSettings, stateParams, vis, setValue } = props;
  const services = getServices(props.vis.http);

  const vectorLayers = vis.type.editorConfig.collections.vectorLayers;
  const customVectorLayers = vis.type.editorConfig.collections.customVectorLayers;
  const vectorLayerOptions = useMemo(() => vectorLayers.map(mapLayerForOption), [vectorLayers]);
  const customVectorLayerOptions = useMemo(() => customVectorLayers.map(mapLayerForOption), [
    customVectorLayers,
  ]);

  const [radio, setRadio] = useState('default');

  const fieldOptions = useMemo(
    () =>
      ((stateParams.selectedLayer && stateParams.selectedLayer.fields) || []).map(
        mapFieldForOption
      ),
    [stateParams.selectedLayer]
  );

  const customFieldOptions = useMemo(
    () =>
      ((stateParams.selectedCustomLayer && stateParams.selectedCustomLayer.fields) || []).map(
        mapCustomJoinFieldForOption
      ),
    [stateParams.selectedCustomLayer]
  );

  const setLayerChosenByUser = useCallback(
    async (layerType) => {
      const serviceSettings = await getServiceSettings();
      setValue('layerChosenByUser', layerType);
    },
    [setValue, getServiceSettings]
  );

  const selectDefaultVectorMap = useCallback(() => {
    setRadio('default');
    setLayerChosenByUser('default');
    document.getElementById('customMapSelection').style.display = 'none';
    document.getElementById('defaultMapSelection').style.display = 'block';
  }, [setRadio, setLayerChosenByUser]);

  const selectCustomVectorMap = useCallback(() => {
    setRadio('custom');
    setLayerChosenByUser('custom');
    document.getElementById('defaultMapSelection').style.display = 'none';
    document.getElementById('customMapSelection').style.display = 'block';
  }, [setRadio, setLayerChosenByUser]);

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

  const setCustomLayer = useCallback(
    async (paramName: 'selectedCustomLayer', value: VectorLayer['layerId']) => {
      const newLayer = customVectorLayers.find(({ layerId }: VectorLayer) => layerId === value);

      if (newLayer) {
        setValue(paramName, newLayer);
        setValue('selectedJoinField', newLayer.fields[0]);
      }
    },
    [customVectorLayers, setValue]
  );

  const setCustomJoinField = useCallback(
    async (paramName: 'selectedCustomJoinField', value) => {
      if (stateParams.selectedCustomLayer) {
        setValue(
          paramName,
          stateParams.selectedCustomLayer.fields.find((f) => f.name === value)
        );
      }
    },
    [setValue, stateParams.selectedCustomLayer]
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

  // const [selectedOptions, setSelected] = useState([customFieldOptions[0]]);

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

      <EuiText size="xs">
        <strong>
          <EuiTextColor color="default">Choose a vector map layer</EuiTextColor>
        </strong>
      </EuiText>
      <EuiSpacer size="s" />
      <EuiFlexGroup style={{ fontSize: '13px' }}>
        <EuiFlexItem>
          <EuiCheckableCard
            id="defaultVectorMap"
            label="Default vector map"
            name="defaultVectorMap"
            value="default"
            checked={radio === 'default'}
            onChange={() => selectDefaultVectorMap()}
          />
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiCheckableCard
            id="customVectorMap"
            label="Custom vector map"
            name="customVectorMap"
            value="custom"
            checked={radio === 'custom'}
            onChange={() => selectCustomVectorMap()}
          />
        </EuiFlexItem>
      </EuiFlexGroup>
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

      <EuiFlexGroup id="customMapSelection" direction="column" style={{ display: 'none' }}>
        <EuiFlexItem grow={false}>
          <SelectOption
            id="regionMapOptionsCustomSelectLayer"
            label="Vector map"
            options={customVectorLayerOptions}
            paramName="selectedCustomLayer"
            value={stateParams.selectedCustomLayer && stateParams.selectedCustomLayer.layerId}
            setValue={setCustomLayer}
          />
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <SelectOption
            id="regionMapOptionsCustomSelectJoinField"
            label="Join field"
            options={customFieldOptions}
            paramName="selectedCustomJoinField"
            value={stateParams.selectedCustomJoinField && stateParams.selectedCustomJoinField.name}
            setValue={setCustomJoinField}
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

export { MapChoiceOptions };

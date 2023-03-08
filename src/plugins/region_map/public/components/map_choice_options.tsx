/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './map_choice_options.scss';
import React, { useCallback, useMemo } from 'react';
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
import { SelectOption, SwitchOption } from '../../../charts/public';
import { RegionMapVisParams } from '../../../maps_legacy/public';
import { DEFAULT_MAP_CHOICE, CUSTOM_MAP_CHOICE } from '../../common';

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

function MapChoiceOptions(props: MapChoiceOptionsProps) {
  const { getServiceSettings, stateParams, vis, setValue } = props;
  const vectorLayers = vis.type.editorConfig.collections.vectorLayers;
  const customVectorLayers = vis.type.editorConfig.collections.customVectorLayers;
  const vectorLayerOptions = useMemo(() => vectorLayers.map(mapLayerForOption), [vectorLayers]);
  const customVectorLayerOptions = useMemo(() => customVectorLayers.map(mapLayerForOption), [
    customVectorLayers,
  ]);

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

  const selectDefaultVectorMap = () => {
    setValue('layerChosenByUser', DEFAULT_MAP_CHOICE);
  };

  const selectCustomVectorMap = () => {
    setValue('layerChosenByUser', CUSTOM_MAP_CHOICE);
  };

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
      <EuiFlexGroup className="mapChoiceGroup">
        <EuiFlexItem>
          <EuiCheckableCard
            id="defaultVectorMap"
            data-test-subj="defaultVectorMap"
            label="Default vector map"
            name="defaultVectorMap"
            value="default"
            checked={DEFAULT_MAP_CHOICE === stateParams.layerChosenByUser}
            onChange={selectDefaultVectorMap}
          />
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiCheckableCard
            id="customVectorMap"
            data-test-subj="customVectorMap"
            label="Custom vector map"
            name="customVectorMap"
            value="custom"
            checked={CUSTOM_MAP_CHOICE === stateParams.layerChosenByUser}
            onChange={selectCustomVectorMap}
          />
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiSpacer size="m" />

      {DEFAULT_MAP_CHOICE === stateParams.layerChosenByUser ? (
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
      ) : (
        <EuiFlexGroup id="customMapSelection" direction="column">
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
              value={
                stateParams.selectedCustomJoinField && stateParams.selectedCustomJoinField.name
              }
              setValue={setCustomJoinField}
            />
          </EuiFlexItem>
        </EuiFlexGroup>
      )}

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

/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import React, { useCallback, useMemo, useState } from 'react';
import {
  EuiIcon,
  EuiLink,
  EuiPanel,
  EuiSpacer,
  EuiText,
  EuiTitle,
  EuiCheckableCard,
  EuiFlexItem,
  EuiFlexGroup,
  EuiTextColor,
  EuiComboBox,
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

export type RegionMapOptionsProps = {
  getServiceSettings: () => Promise<IServiceSettings>;
} & VisOptionsProps<RegionMapVisParams>;

function RegionMapOptions(props: RegionMapOptionsProps) {
  const { getServiceSettings, stateParams, vis, setValue } = props;
  const services = getServices(props.vis.http);

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

  const [radio, setRadio] = useState('default');
  const [selectedOptions, setSelected] = useState([]);
  const [isInvalid, setInvalid] = useState(false);

  const isValid = (value) => {
    // Only allow letters. No spaces, numbers, or special characters.
    return value.match(/^[a-zA-Z]+$/) !== null;
  };

  const onCreateOption = (searchValue) => {
    if (!isValid(searchValue)) {
      // Return false to explicitly reject the user's input.
      return false;
    }

    const newOption = {
      label: searchValue,
    };

    // Select the option.
    setSelected([...selectedOptions, newOption]);
  };

  const onSearchChange = (searchValue) => {
    if (!searchValue) {
      setInvalid(false);

      return;
    }

    setInvalid(!isValid(searchValue));
  };

  const onChange = (selectedOption) => {
    setSelected(selectedOption);
    setInvalid(false);
  };

  const setLayerChosenByUser = useCallback(
    async (layerType) => {
      const serviceSettings = await getServiceSettings();
      // const emsHotLink = await serviceSettings.getEMSHotLink(layer);

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

  return (
    <>
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
        <EuiSpacer size="m" />

        <EuiFlexGroup>
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
              label="Uploaded custom map"
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
            <EuiText size="xs">
              <strong>
                <EuiTextColor color="default">Join field</EuiTextColor>
              </strong>
            </EuiText>
            <EuiSpacer size="s" />
            <EuiComboBox
              noSuggestions
              placeholder="Enter a single field to join"
              singleSelection={{ asPlainText: true }}
              selectedOptions={selectedOptions}
              onCreateOption={onCreateOption}
              onChange={onChange}
              onSearchChange={onSearchChange}
              isInvalid={isInvalid}
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

      <EuiSpacer size="s" />

      <EuiPanel paddingSize="s">
        <EuiTitle size="xs">
          <h2>
            <FormattedMessage
              id="regionMap.visParams.styleSettingsLabel"
              defaultMessage="Style settings"
            />
          </h2>
        </EuiTitle>
        <EuiSpacer size="s" />

        <SelectOption
          label={i18n.translate('regionMap.visParams.colorSchemaLabel', {
            defaultMessage: 'Color schema',
          })}
          options={vis.type.editorConfig.collections.colorSchemas}
          paramName="colorSchema"
          value={stateParams.colorSchema}
          setValue={setValue}
        />

        <NumberInputOption
          label={i18n.translate('regionMap.visParams.outlineWeightLabel', {
            defaultMessage: 'Border thickness',
          })}
          min={0}
          paramName="outlineWeight"
          value={stateParams.outlineWeight}
          setValue={setValue}
        />
      </EuiPanel>

      <EuiSpacer size="s" />

      <WmsOptions {...props} />
    </>
  );
}

export { RegionMapOptions };

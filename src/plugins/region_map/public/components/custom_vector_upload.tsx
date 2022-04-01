/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, Fragment } from 'react';
import axios from 'axios';
import {
  EuiButton,
  EuiFilePicker,
  EuiText,
  EuiSpacer,
  EuiCard,
  EuiFieldText,
  EuiSelect,
  EuiTextColor,
  EuiFormRow,
} from '@elastic/eui';
import { Services, getServices } from '../services';

export type CustomVectorUploadProps = {
  getServiceSettings: () => Promise<IServiceSettings>;
} & VisOptionsProps<RegionMapVisParams>;

function CustomVectorUpload(props: CustomVectorUploadProps) {
  const services = getServices(props.vis.http);
  const notifications = props.vis.notifications;
  const [large, setLarge] = useState(true);

  const INDEX_NAME_SUFFIX = '-map';
  const INDEX_NAME_UPPERCASE_CHECK = /[A-Z]+/;
  const INDEX_NAME_SPECIAL_CHARACTERS_CHECK = /[`!@#$%^&*()\=\[\]{};':"\\|,.<>\/?~]/;
  const INDEX_NAME_NOT_BEGINS_WITH_CHECK = /^[-+_.]/;
  const INDEX_NAME_BEGINS_WITH_CHECK = /^[a-z]/;
  const INDEX_NAME_NOT_ENDS_WITH_CHECK = /.*-map$/;

  // File size that can be uploaded: 250 MB
  const MAX_FILE_SIZE_IN_BYTES = 26214400;
  const MAX_LENGTH_OF_INDEX_NAME = 250;

  const options = [
    { value: 'geo_shape', text: 'Geo shape' },
    { value: 'geo_point', text: 'Geo point' },
  ];

  const [value, setValue] = useState('');
  const [isLoading, setLoading] = useState(false);
  const onSelectChange = (e) => {
    setSelectValue(e.target.value);
  };

  const [selectValue, setSelectValue] = useState('');

  const onTextChange = (e) => {
    setValue(e.target.value);
  };

  const onChange = (files) => {
    if (files[0]) {
      validateFileSize(files);
    }
  };

  const fetchElementByName = (elementName) => {
    return document.getElementsByName(elementName)[0];
  };

  const validateIndexName = (typedIndexName, isIndexNameWithSuffix) => {
    let error = '';
    const errorIndexNameDiv = fetchElementByName('errorIndexName');

    // check for presence of index name entered by the user
    if (!typedIndexName) {
      error = 'Required';
    } else {
      // check for restriction on length of the index name
      if (MAX_LENGTH_OF_INDEX_NAME < typedIndexName.length) {
        error += ' Map name should be less than 250 characters.';
      }

      // check for restriction on the usage of upper case characters in the index name
      if (INDEX_NAME_UPPERCASE_CHECK.test(typedIndexName)) {
        error += ' Upper case letters are not allowed.';
      }

      // check for restriction on the usage of special characters in the index name
      if (INDEX_NAME_SPECIAL_CHARACTERS_CHECK.test(typedIndexName)) {
        error += ' Special characters are not allowed.';
      }

      // check for restriction on the usage of characters at the beginning in the index name
      if (
        INDEX_NAME_NOT_BEGINS_WITH_CHECK.test(typedIndexName) ||
        !INDEX_NAME_BEGINS_WITH_CHECK.test(typedIndexName)
      ) {
        error += " Map name can't start with + , _ , - or . It should start with a-z.";
      }

      // check for restriction on the usage of -map in map name if entered by the user
      if (!isIndexNameWithSuffix && INDEX_NAME_NOT_ENDS_WITH_CHECK.test(typedIndexName)) {
        error += " Map name can't end with -map";
      }
    }

    if (error) {
      errorIndexNameDiv.textContent = error;
      return false;
    } else {
      errorIndexNameDiv.textContent = '';
      return true;
    }
  };

  const validateFileSize = async (files) => {
    // check if the file size is permitted
    if (MAX_FILE_SIZE_IN_BYTES < files[0].size) {
      notifications.toasts.addWarning('File size should be less than 25 MB.');
      return false;
    }
    return true;
  };

  const clearUserInput = () => {
    fetchElementByName('customIndex').value = '';
  };

  const handleSubmit = async () => {
    // show import button as loading
    setLoading(true);
    const newIndexName = fetchElementByName('customIndex').value + INDEX_NAME_SUFFIX;

    // if index name is valid, validate the file size and upload the geojson data
    const isValidIndexName = validateIndexName(newIndexName, true);
    const files = document.querySelector('.euiFilePicker__input').files;
    let fileData;
    if (isValidIndexName) {
      if (files[0] && validateFileSize(files)) {
        const [file] = files;
        if (file) {
          fileData = await new Response(file).text();
        }
        await handleUploadGeojson(newIndexName, fileData);
      }
    }

    // removes loading symbol from import button
    setLoading(false);
    clearUserInput();
  };

  const checkIfIndexExists = async (indexName) => {
    try {
      const result = await services.getIndex(indexName);
      return result.ok;
    } catch (e) {
      return false;
    }
  };

  const uploadGeojson = async (indexName, fileData) => {
    const bodyData = {
      index: indexName,
      field: 'location',
      type: fetchElementByName('selectGeoShape').value,
      data: [JSON.parse(fileData)],
    };
    const result = await services.postGeojson(JSON.stringify(bodyData));
    if (result.ok) {
      notifications.toasts.addSuccess('Successfully added ' + indexName + ' custom map.');
    } else {
      notifications.toasts.addDanger('Error connecting to geospatial plugin.');
    }
  };

  const handleUploadGeojson = async (indexName, fileData) => {
    const indexExists = await checkIfIndexExists(indexName);
    if (!indexExists) {
      await uploadGeojson(indexName, fileData);
    } else {
      notifications.toasts.addWarning('Map name ' + indexName + ' already exists.');
    }
  };

  return (
    <div>
      <EuiCard textAlign="left" title="" description="" aria-label="import-vector-map-card">
        <EuiSpacer size="s" aria-label="medium-spacer" />

        <EuiText size="s" aria-label="upload-map-text">
          Upload map
        </EuiText>
        <EuiSpacer size="m" aria-label="medium-spacer" />

        <EuiFormRow aria-label="form-row-for-file-picker">
          <EuiFilePicker
            id="filePicker"
            initialPromptText="Select or drag and drop a json file"
            onChange={(files) => {
              onChange(files);
            }}
            display={large ? 'large' : 'default'}
            accept=".json,.geojson"
            required={true}
            aria-label="geojson-file-picker"
          />
        </EuiFormRow>
        <EuiSpacer size="m" aria-label="medium-spacer" />

        <EuiText size="xs" color="subdued" aria-label="geojson-file-format-text">
          <span>
            Formats accepted: .json, .geojson
            <br />
            Max size: 25 MB
            <br />
            Coordinates must be in EPSG:4326 coordinate reference system.
          </span>
        </EuiText>
        <EuiSpacer size="m" aria-label="medium-spacer" />

        <EuiText size="s" aria-label="map-name-prefix-text">
          Map name prefix
        </EuiText>
        <EuiSpacer size="m" aria-label="medium-spacer" />

        <EuiFieldText
          placeholder="Enter a valid map name prefix"
          value={value}
          onChange={(e) => onTextChange(e)}
          onBlur={(e) => validateIndexName(e?.target?.value, false)}
          id="customIndex"
          name="customIndex"
          required={true}
          label="Map name"
          aria-label="map-name-text-field"
        />
        <EuiSpacer size="m" aria-label="medium-spacer" />

        <EuiText size="xs" color="subdued" aria-label="map-name-guidelines-text">
          Map name guidleines:
          <ul>
            <li> Map name prefix must contain 1-250 characters. </li>
            <li> Map name prefix must start with a-z.</li>
            <li> Valid characters are a-z, 0-9, - and _ .</li>
            <li>
              {' '}
              The final map name will be the entered prefix here followed by -map as the suffix.{' '}
            </li>
          </ul>
        </EuiText>
        <EuiText size="xs" aria-label="map-name-error-text">
          <EuiTextColor color="danger" aria-label="map-name-error-text-color">
            <p name="errorIndexName" />
          </EuiTextColor>
        </EuiText>
        <EuiSpacer size="m" aria-label="medium-spacer" />

        <EuiText size="s" aria-label="geodata-type-text">
          Select a geo datatype
        </EuiText>
        <EuiSpacer size="m" aria-label="medium-spacer" />

        <EuiSelect
          id="selectGeoShape"
          name="selectGeoShape"
          options={options}
          value={selectValue}
          onChange={(e) => onSelectChange(e)}
          required={true}
          aria-label="geo-datatype-selector"
        />
        <EuiSpacer size="m" aria-label="medium-spacer" />

        <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%', padding: 0 }}>
          <EuiButton
            id="submitButton"
            type="submit"
            fill
            onClick={handleSubmit}
            isLoading={isLoading}
            aria-label="import-file-button"
          >
            Import file
          </EuiButton>
        </div>
      </EuiCard>
    </div>
  );
}

export { CustomVectorUpload };

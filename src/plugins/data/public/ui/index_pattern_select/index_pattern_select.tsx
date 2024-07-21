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

import _ from 'lodash';
import React, { Component } from 'react';

import { Required } from '@osd/utility-types';
import { EuiCompressedComboBox, EuiComboBoxProps } from '@elastic/eui';

import { SavedObjectsClientContract, SimpleSavedObject } from 'src/core/public';
import { getTitle } from '../../../common/index_patterns/lib';
import {
  getDataSourceReference,
  concatDataSourceWithIndexPattern,
} from '../../../common/index_patterns/utils';

export type IndexPatternSelectProps = Required<
  Omit<EuiComboBoxProps<any>, 'isLoading' | 'onSearchChange' | 'options' | 'selectedOptions'>,
  'onChange' | 'placeholder'
> & {
  indexPatternId: string;
  fieldTypes?: string[];
  onNoIndexPatterns?: () => void;
  savedObjectsClient: SavedObjectsClientContract;
};

interface IndexPatternSelectState {
  isLoading: boolean;
  options: [];
  selectedIndexPattern: { value: string; label: string } | undefined;
  searchValue: string | undefined;
  dataSourceIdToTitle: Map<string, string>;
}

const getIndexPatterns = async (
  client: SavedObjectsClientContract,
  search: string,
  fields: string[]
) => {
  const resp = await client.find({
    type: 'index-pattern',
    fields,
    search: `${search}*`,
    searchFields: ['title'],
    perPage: 100,
  });
  return resp.savedObjects;
};

// Needed for React.lazy
// eslint-disable-next-line import/no-default-export
export default class IndexPatternSelect extends Component<IndexPatternSelectProps> {
  private isMounted: boolean = false;
  state: IndexPatternSelectState;

  constructor(props: IndexPatternSelectProps) {
    super(props);

    this.state = {
      isLoading: false,
      dataSourceIdToTitle: new Map(),
      options: [],
      selectedIndexPattern: undefined,
      searchValue: undefined,
    };
  }

  componentWillUnmount() {
    this.isMounted = false;
    this.debouncedFetch.cancel();
  }

  componentDidMount() {
    this.isMounted = true;
    this.fetchOptions();
    this.fetchSelectedIndexPattern(this.props.indexPatternId);
  }

  UNSAFE_componentWillReceiveProps(nextProps: IndexPatternSelectProps) {
    if (nextProps.indexPatternId !== this.props.indexPatternId) {
      this.fetchSelectedIndexPattern(nextProps.indexPatternId);
    }
  }

  fetchSelectedIndexPattern = async (indexPatternId: string) => {
    if (!indexPatternId) {
      this.setState({
        selectedIndexPattern: undefined,
      });
      return;
    }

    let indexPatternTitle;
    try {
      indexPatternTitle = await getTitle(
        this.props.savedObjectsClient,
        indexPatternId,
        this.state.dataSourceIdToTitle
      );
    } catch (err) {
      // index pattern no longer exists
      return;
    }

    if (!this.isMounted) {
      return;
    }

    this.setState({
      selectedIndexPattern: {
        value: indexPatternId,
        label: indexPatternTitle,
      },
    });
  };

  debouncedFetch = _.debounce(async (searchValue: string) => {
    const { fieldTypes, onNoIndexPatterns, savedObjectsClient } = this.props;

    const savedObjectFields = ['title'];
    if (fieldTypes) {
      savedObjectFields.push('fields');
    }
    let savedObjects = await getIndexPatterns(savedObjectsClient, searchValue, savedObjectFields);

    if (fieldTypes) {
      savedObjects = savedObjects.filter((savedObject: SimpleSavedObject<any>) => {
        try {
          const indexPatternFields = JSON.parse(savedObject.attributes.fields as any);
          return indexPatternFields.some((field: any) => {
            return fieldTypes?.includes(field.type);
          });
        } catch (err) {
          // Unable to parse fields JSON, invalid index pattern
          return false;
        }
      });
    }

    if (!this.isMounted) {
      return;
    }

    // We need this check to handle the case where search results come back in a different
    // order than they were sent out. Only load results for the most recent search.
    if (searchValue === this.state.searchValue) {
      const dataSourcesToFetch: Array<{ type: string; id: string }> = [];
      const dataSourceIdSet = new Set();
      savedObjects.map((indexPatternSavedObject: SimpleSavedObject<any>) => {
        const dataSourceReference = getDataSourceReference(indexPatternSavedObject.references);
        if (
          dataSourceReference &&
          !this.state.dataSourceIdToTitle.has(dataSourceReference.id) &&
          !dataSourceIdSet.has(dataSourceReference.id)
        ) {
          dataSourceIdSet.add(dataSourceReference.id);
          dataSourcesToFetch.push({ type: 'data-source', id: dataSourceReference.id });
        }
      });

      const dataSourceIdToTitleToUpdate = new Map();

      if (dataSourcesToFetch.length > 0) {
        const resp = await savedObjectsClient.bulkGet(dataSourcesToFetch);
        resp.savedObjects.map((dataSourceSavedObject: SimpleSavedObject<any>) => {
          dataSourceIdToTitleToUpdate.set(
            dataSourceSavedObject.id,
            dataSourceSavedObject.attributes.title
          );
        });
      }

      const options = savedObjects.map((indexPatternSavedObject: SimpleSavedObject<any>) => {
        const dataSourceReference = getDataSourceReference(indexPatternSavedObject.references);
        if (dataSourceReference) {
          const dataSourceTitle =
            this.state.dataSourceIdToTitle.get(dataSourceReference.id) ||
            dataSourceIdToTitleToUpdate.get(dataSourceReference.id) ||
            dataSourceReference.id;
          return {
            label: `${concatDataSourceWithIndexPattern(
              dataSourceTitle,
              indexPatternSavedObject.attributes.title
            )}`,
            value: indexPatternSavedObject.id,
          };
        }
        return {
          label: indexPatternSavedObject.attributes.title,
          value: indexPatternSavedObject.id,
        };
      });

      if (dataSourceIdToTitleToUpdate.size > 0) {
        const mergedDataSourceIdToTitle = new Map();
        this.state.dataSourceIdToTitle.forEach((k, v) => {
          mergedDataSourceIdToTitle.set(k, v);
        });
        dataSourceIdToTitleToUpdate.forEach((k, v) => {
          mergedDataSourceIdToTitle.set(k, v);
        });
        this.setState({
          dataSourceIdToTitle: mergedDataSourceIdToTitle,
          isLoading: false,
          options,
        });
      } else {
        this.setState({
          isLoading: false,
          options,
        });
      }

      if (onNoIndexPatterns && searchValue === '' && options.length === 0) {
        onNoIndexPatterns();
      }
    }
  }, 300);

  fetchOptions = (searchValue = '') => {
    this.setState(
      {
        isLoading: true,
        searchValue,
      },
      this.debouncedFetch.bind(null, searchValue)
    );
  };

  onChange = (selectedOptions: any) => {
    this.props.onChange(_.get(selectedOptions, '0.value'));
  };

  render() {
    const {
      fieldTypes,
      onChange,
      indexPatternId,
      placeholder,
      onNoIndexPatterns,
      savedObjectsClient,
      ...rest
    } = this.props;

    return (
      <EuiCompressedComboBox
        {...rest}
        placeholder={placeholder}
        singleSelection={true}
        isLoading={this.state.isLoading}
        onSearchChange={this.fetchOptions}
        options={this.state.options}
        selectedOptions={this.state.selectedIndexPattern ? [this.state.selectedIndexPattern] : []}
        onChange={this.onChange}
      />
    );
  }
}

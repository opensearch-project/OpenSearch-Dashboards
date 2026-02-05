/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { Component } from 'react';
import { EuiSpacer } from '@elastic/eui';
import {
  getSupportedScriptingLanguages,
  getDeprecatedScriptingLanguages,
} from '../../../scripting_languages';

import { Table, Header, CallOuts, DeleteScritpedFieldConfirmationModal } from './components';
import { ScriptedFieldItem } from './types';

import { DataView, DataPublicPluginStart } from '../../../../../../plugins/data/public';

interface ScriptedFieldsTableProps {
  dataset: DataView;
  fieldFilter?: string;
  scriptedFieldLanguageFilter?: string;
  helpers: {
    redirectToRoute: Function;
    getRouteHref?: Function;
  };
  onRemoveField?: () => void;
  painlessDocLink: string;
  // @ts-expect-error TS2339 TODO(ts-error): fixme
  saveDataset: DataPublicPluginStart['datasets']['updateSavedObject'];
  useUpdatedUX: boolean;
}

interface ScriptedFieldsTableState {
  deprecatedLangsInUse: string[];
  fieldToDelete: ScriptedFieldItem | undefined;
  isDeleteConfirmationModalVisible: boolean;
  fields: ScriptedFieldItem[];
}

export class ScriptedFieldsTable extends Component<
  ScriptedFieldsTableProps,
  ScriptedFieldsTableState
> {
  constructor(props: ScriptedFieldsTableProps) {
    super(props);

    this.state = {
      deprecatedLangsInUse: [],
      fieldToDelete: undefined,
      isDeleteConfirmationModalVisible: false,
      fields: [],
    };
  }

  UNSAFE_componentWillMount() {
    this.fetchFields();
  }

  fetchFields = async () => {
    const fields = await (this.props.dataset.getScriptedFields() as ScriptedFieldItem[]);

    const deprecatedLangsInUse = [];
    const deprecatedLangs = getDeprecatedScriptingLanguages();
    const supportedLangs = getSupportedScriptingLanguages();

    for (const field of fields) {
      const lang: string = field.lang;
      if (deprecatedLangs.includes(lang) || !supportedLangs.includes(lang)) {
        deprecatedLangsInUse.push(lang);
      }
    }

    this.setState({
      fields,
      deprecatedLangsInUse,
    });
  };

  getFilteredItems = () => {
    const { fields } = this.state;
    const { fieldFilter, scriptedFieldLanguageFilter } = this.props;

    let languageFilteredFields = fields;

    if (scriptedFieldLanguageFilter) {
      languageFilteredFields = fields.filter(
        (field) => field.lang === this.props.scriptedFieldLanguageFilter
      );
    }

    let filteredFields = languageFilteredFields;

    if (fieldFilter) {
      const normalizedFieldFilter = fieldFilter.toLowerCase();

      filteredFields = languageFilteredFields.filter((field) =>
        field.name.toLowerCase().includes(normalizedFieldFilter)
      );
    }

    return filteredFields;
  };

  startDeleteField = (field: ScriptedFieldItem) => {
    this.setState({ fieldToDelete: field, isDeleteConfirmationModalVisible: true });
  };

  hideDeleteConfirmationModal = () => {
    this.setState({ fieldToDelete: undefined, isDeleteConfirmationModalVisible: false });
  };

  deleteField = () => {
    const { dataset, onRemoveField, saveDataset } = this.props;
    const { fieldToDelete } = this.state;

    dataset.removeScriptedField(fieldToDelete!.name);
    saveDataset(dataset);

    if (onRemoveField) {
      onRemoveField();
    }

    this.fetchFields();
    this.hideDeleteConfirmationModal();
  };

  render() {
    const { dataset, painlessDocLink, useUpdatedUX } = this.props;
    const { fieldToDelete, deprecatedLangsInUse } = this.state;

    const items = this.getFilteredItems();

    return (
      <>
        <Header datasetId={dataset.id || ''} useUpdatedUX={useUpdatedUX} />

        <CallOuts deprecatedLangsInUse={deprecatedLangsInUse} painlessDocLink={painlessDocLink} />

        <EuiSpacer size="l" />

        <Table
          dataset={dataset}
          items={items}
          editField={(field) => this.props.helpers.redirectToRoute(field)}
          deleteField={this.startDeleteField}
        />

        {fieldToDelete && (
          <DeleteScritpedFieldConfirmationModal
            deleteField={this.deleteField}
            field={fieldToDelete}
            hideDeleteConfirmationModal={this.hideDeleteConfirmationModal}
          />
        )}
      </>
    );
  }
}

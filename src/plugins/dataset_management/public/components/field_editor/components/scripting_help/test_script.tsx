/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import './test_script.scss';

import React, { Component, Fragment } from 'react';

import {
  EuiSmallButton,
  EuiCodeBlock,
  EuiCompressedComboBox,
  EuiCompressedFormRow,
  EuiText,
  EuiSpacer,
  EuiTitle,
  EuiCallOut,
  EuiComboBoxOptionOption,
} from '@elastic/eui';
import { FormattedMessage } from '@osd/i18n/react';
import { i18n } from '@osd/i18n';

import { opensearchQuery, DataView, Query } from '../../../../../../data/public';
import { context as contextType } from '../../../../../../opensearch_dashboards_react/public';
import { DatasetManagmentContextValue } from '../../../../types';
import { ExecuteScript } from '../../types';

interface TestScriptProps {
  dataset: DataView;
  lang: string;
  name?: string;
  script?: string;
  executeScript: ExecuteScript;
}

interface AdditionalField {
  value: string;
  label: string;
}

interface TestScriptState {
  isLoading: boolean;
  additionalFields: AdditionalField[];
  previewData?: Record<string, any>;
}

export class TestScript extends Component<TestScriptProps, TestScriptState> {
  static contextType = contextType;

  // @ts-expect-error TS2612 TODO(ts-error): fixme
  public readonly context!: DatasetManagmentContextValue;

  defaultProps = {
    name: 'myScriptedField',
  };

  state = {
    isLoading: false,
    additionalFields: [],
    previewData: undefined,
  };

  componentDidMount() {
    if (this.props.script) {
      this.previewScript();
    }
  }

  previewScript = async (searchContext?: { query?: Query | undefined }) => {
    const { dataset, name, script, executeScript } = this.props;

    if (!script || script.length === 0) {
      return;
    }

    this.setState({
      isLoading: true,
    });

    let query;
    if (searchContext) {
      const opensearchQueryConfigs = opensearchQuery.getOpenSearchQueryConfig(
        this.context.services.uiSettings
      );
      query = opensearchQuery.buildOpenSearchQuery(
        this.props.dataset,
        searchContext.query || [],
        [],
        opensearchQueryConfigs
      );
    }

    const scriptResponse = await executeScript({
      name: name as string,
      script,
      indexPatternTitle: dataset.title,
      query,
      additionalFields: this.state.additionalFields.map((option: AdditionalField) => option.value),
      http: this.context.services.http,
      dataSourceId: dataset.dataSourceRef?.id,
    });

    if (scriptResponse.status !== 200) {
      this.setState({
        isLoading: false,
        previewData: scriptResponse,
      });
      return;
    }

    this.setState({
      isLoading: false,
      previewData: scriptResponse.hits?.hits.map((hit: any) => ({
        _id: hit._id,
        ...hit._source,
        ...hit.fields,
      })),
    });
  };

  onAdditionalFieldsChange = (selectedOptions: AdditionalField[]) => {
    this.setState({
      additionalFields: selectedOptions,
    });
  };

  renderPreview(previewData: { error: any } | undefined) {
    if (!previewData) {
      return null;
    }

    if (previewData.error) {
      return (
        <EuiCallOut
          title={i18n.translate('datasetManagement.testScript.errorMessage', {
            defaultMessage: `There's an error in your script`,
          })}
          color="danger"
          iconType="cross"
        >
          <EuiCodeBlock
            language="json"
            className="scriptPreviewCodeBlock"
            data-test-subj="scriptedFieldPreview"
          >
            {JSON.stringify(previewData.error, null, ' ')}
          </EuiCodeBlock>
        </EuiCallOut>
      );
    }

    return (
      <Fragment>
        <EuiTitle size="xs">
          <p>
            <FormattedMessage
              id="datasetManagement.testScript.resultsLabel"
              defaultMessage="First 10 results"
            />
          </p>
        </EuiTitle>
        <EuiSpacer size="s" />
        <EuiCodeBlock
          language="json"
          className="scriptPreviewCodeBlock"
          data-test-subj="scriptedFieldPreview"
        >
          {JSON.stringify(previewData, null, ' ')}
        </EuiCodeBlock>
      </Fragment>
    );
  }

  renderToolbar() {
    const fieldsByTypeMap = new Map();
    const fields: EuiComboBoxOptionOption[] = [];

    this.props.dataset.fields
      .getAll()
      .filter((field) => {
        const isMultiField = field.subType && field.subType.multi;
        return !field.name.startsWith('_') && !isMultiField && !field.scripted;
      })
      .forEach((field) => {
        if (fieldsByTypeMap.has(field.type)) {
          const fieldsList = fieldsByTypeMap.get(field.type);
          fieldsList.push(field.name);
          fieldsByTypeMap.set(field.type, fieldsList);
        } else {
          fieldsByTypeMap.set(field.type, [field.name]);
        }
      });

    fieldsByTypeMap.forEach((fieldsList, fieldType) => {
      fields.push({
        label: fieldType,
        options: fieldsList.sort().map((fieldName: string) => {
          return { value: fieldName, label: fieldName };
        }),
      });
    });

    fields.sort((a, b) => {
      if (a.label < b.label) return -1;
      if (a.label > b.label) return 1;
      return 0;
    });

    return (
      <Fragment>
        <EuiCompressedFormRow
          label={i18n.translate('datasetManagement.testScript.fieldsLabel', {
            defaultMessage: 'Additional fields',
          })}
          fullWidth
        >
          <EuiCompressedComboBox
            placeholder={i18n.translate('datasetManagement.testScript.fieldsPlaceholder', {
              defaultMessage: 'Select...',
            })}
            options={fields}
            selectedOptions={this.state.additionalFields}
            onChange={(selected) => this.onAdditionalFieldsChange(selected as AdditionalField[])}
            data-test-subj="additionalFieldsSelect"
            fullWidth
          />
        </EuiCompressedFormRow>

        <div className="testScript__searchBar">
          <this.context.services.data.ui.SearchBar
            appName={'datasetManagement'}
            showFilterBar={false}
            showDatePicker={false}
            showQueryInput={true}
            query={this.context.services.data.query.queryString.getDefaultQuery()}
            onQuerySubmit={this.previewScript}
            indexPatterns={[this.props.dataset]}
            customSubmitButton={
              <EuiSmallButton
                disabled={this.props.script ? false : true}
                isLoading={this.state.isLoading}
                data-test-subj="runScriptButton"
              >
                <FormattedMessage
                  id="datasetManagement.testScript.submitButtonLabel"
                  defaultMessage="Run script"
                />
              </EuiSmallButton>
            }
          />
        </div>
      </Fragment>
    );
  }

  render() {
    return (
      <Fragment>
        <EuiSpacer />
        <EuiText>
          <h3>
            <FormattedMessage
              id="datasetManagement.testScript.resultsTitle"
              defaultMessage="Preview results"
            />
          </h3>
          <p>
            <FormattedMessage
              id="datasetManagement.testScript.instructions"
              defaultMessage="Run your script to preview the first 10 results. You can also select some additional
              fields to include in your results to gain more context or add a query to filter on
              specific documents."
            />
          </p>
        </EuiText>
        <EuiSpacer />
        {this.renderToolbar()}
        <EuiSpacer />
        {this.renderPreview(this.state.previewData)}
      </Fragment>
    );
  }
}

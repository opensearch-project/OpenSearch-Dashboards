/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiCallOut,
  EuiCheckableCard,
  EuiComboBox,
  EuiFieldText,
  EuiForm,
  EuiFormRow,
  EuiSelect,
  EuiSpacer,
  EuiText,
  EuiTitle,
} from '@elastic/eui';
import React, { useState, useEffect } from 'react';
import { HttpStart } from 'opensearch-dashboards/public';
import { CONSOLE_PROXY, DATACONNECTIONS_BASE } from '../../../../framework/utils/shared';
import { IntegrationConfigProps, IntegrationSetupInputs } from './setup_integration';
import { IntegrationConfig } from '../../../../framework/types';

const INTEGRATION_CONNECTION_DATA_SOURCE_TYPES: Map<
  string,
  {
    title: string;
    lower: string;
    help: string;
  }
> = new Map([
  [
    's3',
    {
      title: 'Data Source',
      lower: 'data_source',
      help: 'Select a data source to pull the data from.',
    },
  ],
  [
    'index',
    {
      title: 'Index',
      lower: 'index',
      help: 'Select an index to pull the data from.',
    },
  ],
]);

const integrationConnectionSelectorItems = [
  {
    value: 's3',
    text: 'S3 Connection',
  },
  {
    value: 'index',
    text: 'OpenSearch Index',
  },
];

const suggestDataSources = async (
  type: string,
  http: HttpStart
): Promise<Array<{ label: string }>> => {
  try {
    if (type === 'index') {
      const result = await http.post(CONSOLE_PROXY, {
        body: '{}',
        query: {
          path: '_data_stream/ss4o_*',
          method: 'GET',
        },
      });
      return (
        result.data_streams?.map((item: { name: string }) => {
          return { label: item.name };
        }) ?? []
      );
    } else if (type === 's3') {
      const result = (await http.get(DATACONNECTIONS_BASE)) as Array<{
        name: string;
        connector: string;
      }>;
      return (
        result
          ?.filter((item) => item.connector === 'S3GLUE')
          .map((item) => {
            return { label: item.name };
          }) ?? []
      );
    } else {
      // eslint-disable-next-line no-console
      console.error(`Unknown connection type: ${type}`);
      return [];
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err.message);
    return [];
  }
};

export function SetupWorkflowSelector({
  integration,
  useWorkflows,
  toggleWorkflow,
}: {
  integration: IntegrationConfig;
  useWorkflows: Map<string, boolean>;
  toggleWorkflow: (name: string) => void;
}) {
  if (!integration.workflows) {
    return null;
  }

  const cards = integration.workflows.map((workflow) => {
    return (
      <EuiCheckableCard
        id={`workflow-checkbox-${workflow.name}`}
        key={workflow.name}
        label={workflow.label}
        checkableType="checkbox"
        value={workflow.name}
        checked={useWorkflows.get(workflow.name)}
        onChange={() => toggleWorkflow(workflow.name)}
      >
        {workflow.description}
      </EuiCheckableCard>
    );
  });

  return cards;
}

export function IntegrationDetailsInputs({
  config,
  updateConfig,
  integration,
}: {
  config: IntegrationSetupInputs;
  updateConfig: (updates: Partial<IntegrationSetupInputs>) => void;
  integration: IntegrationConfig;
}) {
  return (
    <EuiFormRow
      label="Display Name"
      error={['Must be at least 1 character.']}
      isInvalid={config.displayName.length === 0}
    >
      <EuiFieldText
        value={config.displayName}
        onChange={(event) => updateConfig({ displayName: event.target.value })}
        placeholder={`${integration.name} Integration`}
        isInvalid={config.displayName.length === 0}
        data-test-subj="new-instance-name"
      />
    </EuiFormRow>
  );
}

export function IntegrationConnectionInputs({
  config,
  updateConfig,
  integration,
  lockConnectionType,
  http,
}: {
  config: IntegrationSetupInputs;
  updateConfig: (updates: Partial<IntegrationSetupInputs>) => void;
  integration: IntegrationConfig;
  lockConnectionType?: boolean;
  http: HttpStart;
}) {
  const connectionType = INTEGRATION_CONNECTION_DATA_SOURCE_TYPES.get(config.connectionType)!;

  const [dataSourceSuggestions, setDataSourceSuggestions] = useState(
    [] as Array<{ label: string }>
  );
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(true);

  useEffect(() => {
    const updateDataSources = async () => {
      const data = await suggestDataSources(config.connectionType, http);
      setDataSourceSuggestions(data);
      setIsSuggestionsLoading(false);
    };

    setIsSuggestionsLoading(true);
    updateDataSources();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.connectionType]);

  return (
    <>
      <EuiFormRow
        label="Connection Type"
        helpText="Select the type of connection to use for queries."
      >
        <EuiSelect
          options={integrationConnectionSelectorItems.filter((item) => {
            if (item.value === 's3') {
              return integration.assets.some((asset) => asset.type === 'query');
            } else if (item.value === 'index') {
              return integration.assets.some((asset) => asset.type === 'savedObjectBundle');
            } else {
              return false;
            }
          })}
          value={config.connectionType}
          onChange={(event) =>
            updateConfig({ connectionType: event.target.value, connectionDataSource: '' })
          }
          disabled={lockConnectionType}
        />
      </EuiFormRow>
      <EuiFormRow label={connectionType.title} helpText={connectionType.help}>
        <EuiComboBox
          options={dataSourceSuggestions}
          isLoading={isSuggestionsLoading}
          onChange={(selected) => {
            if (selected.length === 0) {
              updateConfig({ connectionDataSource: '' });
            } else {
              updateConfig({ connectionDataSource: selected[0].label });
            }
          }}
          selectedOptions={[{ label: config.connectionDataSource }]}
          singleSelection={{ asPlainText: true }}
          onCreateOption={(searchValue) => {
            const normalizedSearchValue = searchValue.trim();
            if (!normalizedSearchValue) {
              return;
            }
            const newOption = { label: normalizedSearchValue };
            setDataSourceSuggestions((ds) => ds.concat([newOption]));
            updateConfig({ connectionDataSource: newOption.label });
          }}
          customOptionText={`Select {searchValue} as your ${connectionType.lower}`}
          data-test-subj="data-source-name"
          isDisabled={lockConnectionType}
        />
      </EuiFormRow>
    </>
  );
}

export function IntegrationQueryInputs({
  config,
  updateConfig,
  integration,
}: {
  config: IntegrationSetupInputs;
  updateConfig: (updates: Partial<IntegrationSetupInputs>) => void;
  integration: IntegrationConfig;
}) {
  const [isBucketBlurred, setIsBucketBlurred] = useState(false);
  const [isCheckpointBlurred, setIsCheckpointBlurred] = useState(false);

  return (
    <>
      <EuiFormRow
        label="Spark Table Name"
        helpText="Select a table name to associate with your data."
        error={['Must be at least 1 character.']}
        isInvalid={config.connectionTableName.length === 0}
      >
        <EuiFieldText
          placeholder={integration.name}
          value={config.connectionTableName}
          onChange={(evt) => {
            updateConfig({ connectionTableName: evt.target.value });
          }}
          isInvalid={config.connectionTableName.length === 0}
        />
      </EuiFormRow>
      <EuiFormRow
        label="S3 Data Location"
        isInvalid={isBucketBlurred && !config.connectionLocation.startsWith('s3://')}
        error={["Must be a URL starting with 's3://'."]}
      >
        <EuiFieldText
          value={config.connectionLocation}
          onChange={(event) => updateConfig({ connectionLocation: event.target.value })}
          placeholder="s3://"
          isInvalid={isBucketBlurred && !config.connectionLocation.startsWith('s3://')}
          onBlur={() => {
            setIsBucketBlurred(true);
          }}
        />
      </EuiFormRow>
      <EuiFormRow
        label="S3 Checkpoint Location"
        helpText={
          'The Checkpoint location must be a unique directory and not the same as the Data ' +
          'location. It will be used for caching intermediary results.'
        }
        isInvalid={isCheckpointBlurred && !config.checkpointLocation.startsWith('s3://')}
        error={["Must be a URL starting with 's3://'."]}
      >
        <EuiFieldText
          value={config.checkpointLocation}
          onChange={(event) => updateConfig({ checkpointLocation: event.target.value })}
          placeholder="s3://"
          isInvalid={isCheckpointBlurred && !config.checkpointLocation.startsWith('s3://')}
          onBlur={() => {
            setIsCheckpointBlurred(true);
          }}
        />
      </EuiFormRow>
    </>
  );
}

export function IntegrationWorkflowsInputs({
  updateConfig,
  integration,
}: {
  updateConfig: (updates: Partial<IntegrationSetupInputs>) => void;
  integration: IntegrationConfig;
}) {
  const [useWorkflows, setUseWorkflows] = useState(new Map<string, boolean>());
  const toggleWorkflow = (name: string) => {
    setUseWorkflows((currentWorkflows) => {
      const newWorkflows = new Map(currentWorkflows);
      newWorkflows.set(name, !newWorkflows.get(name));
      return newWorkflows;
    });
  };

  useEffect(() => {
    if (integration.workflows) {
      setUseWorkflows(new Map(integration.workflows.map((w) => [w.name, w.enabled_by_default])));
    }
  }, [integration.workflows]);

  useEffect(() => {
    updateConfig({
      enabledWorkflows: [...useWorkflows.entries()].filter((w) => w[1]).map((w) => w[0]),
    });
    // If we add the updateConfig dep here, rendering crashes with "Maximum update depth exceeded"
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useWorkflows]);

  return (
    <EuiFormRow
      isInvalid={![...useWorkflows.values()].includes(true)}
      error={['Must select at least one workflow.']}
    >
      <SetupWorkflowSelector
        integration={integration}
        useWorkflows={useWorkflows}
        toggleWorkflow={toggleWorkflow}
      />
    </EuiFormRow>
  );
}

export function SetupIntegrationFormInputs({
  config,
  updateConfig,
  integration,
  setupCallout,
  lockConnectionType,
  http,
}: IntegrationConfigProps) {
  return (
    <EuiForm>
      <EuiTitle>
        <h1>Set Up Integration</h1>
      </EuiTitle>
      <EuiSpacer />
      {setupCallout.show ? (
        <EuiCallOut title={setupCallout.title} color="danger">
          <p>{setupCallout.text}</p>
        </EuiCallOut>
      ) : null}
      <EuiSpacer />
      <EuiText>
        <h3>Integration Details</h3>
      </EuiText>
      <EuiSpacer />
      <IntegrationDetailsInputs
        config={config}
        updateConfig={updateConfig}
        integration={integration}
      />
      <EuiSpacer />
      <EuiText>
        <h3>Integration Connection</h3>
      </EuiText>
      <EuiSpacer />
      <IntegrationConnectionInputs
        config={config}
        updateConfig={updateConfig}
        integration={integration}
        lockConnectionType={lockConnectionType}
        http={http}
      />
      {config.connectionType === 's3' ? (
        <>
          <EuiSpacer />
          <EuiText>
            <h3>Query Fields</h3>
          </EuiText>
          <EuiFormRow>
            <EuiText grow={false} size="xs">
              <p>
                To set up the integration, we need to know some information about how to process
                your data.
              </p>
            </EuiText>
          </EuiFormRow>
          <EuiSpacer />
          <IntegrationQueryInputs
            config={config}
            updateConfig={updateConfig}
            integration={integration}
          />
          {integration.workflows ? (
            <>
              <EuiSpacer />
              <EuiText>
                <h3>Integration Resources</h3>
              </EuiText>
              <EuiFormRow>
                <EuiText grow={false} size="xs">
                  <p>
                    This integration offers different kinds of resources compatible with your data
                    source. These can include dashboards, visualizations, indexes, and queries.
                    Select at least one of the following options.
                  </p>
                </EuiText>
              </EuiFormRow>
              <EuiSpacer />
              <IntegrationWorkflowsInputs updateConfig={updateConfig} integration={integration} />
            </>
          ) : null}
          {/* Bottom bar will overlap content if there isn't some space at the end */}
          <EuiSpacer />
          <EuiSpacer />
        </>
      ) : null}
    </EuiForm>
  );
}

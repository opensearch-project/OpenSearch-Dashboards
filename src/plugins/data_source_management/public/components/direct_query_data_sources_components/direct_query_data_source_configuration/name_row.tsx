/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiText, EuiCompressedFormRow, EuiCompressedFieldText } from '@elastic/eui';
import React, { useEffect, useState } from 'react';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { DataSourceManagementContext } from '../../../types';

interface ConfigureNameProps {
  currentName: string;
  currentError: string;
  setErrorForForm: React.Dispatch<React.SetStateAction<string>>;
  setNameForRequest: React.Dispatch<React.SetStateAction<string>>;
}

export const NameRow: React.FC<ConfigureNameProps> = ({
  setNameForRequest,
  currentName,
  currentError,
  setErrorForForm,
}) => {
  const { http } = useOpenSearchDashboards<DataSourceManagementContext>().services;

  const [name, setName] = useState<string>(currentName);
  const [existingNames, setExistingNames] = useState<string[]>([]);

  useEffect(() => {
    const fetchDataSources = async () => {
      try {
        const response = await http.post('/api/ppl/search', {
          headers: {
            'Content-Type': 'application/json',
            'kbn-xsrf': 'true',
          },
          body: JSON.stringify({
            query: 'show datasources',
            format: 'jdbc',
          }),
        });
        const dataconnections = await response.json();
        setExistingNames(dataconnections.jsonData.map((x) => x.DATASOURCE_NAME));
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error fetching data sources:', error);
      }
    };

    fetchDataSources();
  }, [http]);

  const onBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '') {
      setErrorForForm('Name is a required parameter.');
    } else if (existingNames.includes(value)) {
      setErrorForForm('Name must be unique across data sources.');
    } else {
      setErrorForForm('');
    }

    setNameForRequest(value);
  };

  return (
    <EuiCompressedFormRow
      label="Data source name"
      isInvalid={currentError.length !== 0}
      error={currentError}
      helpText="Connection name that OpenSearch Dashboards references. This name should be descriptive and concise."
    >
      <EuiCompressedFieldText
        data-test-subj="direct_query-data-source-name"
        id="data-source-name"
        placeholder="Title"
        value={name}
        onChange={(e) => {
          setName(e.target.value);
        }}
        onBlur={onBlur}
        isInvalid={currentError.length !== 0}
      />
    </EuiCompressedFormRow>
  );
};

import React from 'react';
import {
  EuiButton,
  EuiForm,
  EuiFormRow,
  EuiFilePicker,
  EuiSelect,
  EuiComboBox,
  EuiSpacer,
  EuiText,
  EuiLoadingSpinner,
  EuiIconTip,
} from '@elastic/eui';

interface UploadFormComponentProps {
  indexName: string;
  setIndexName: (indexName: string) => void;
  delimiter: string;
  setDelimiter: (delimiter: string) => void;
  clusters: string[];
  cluster: string;
  setCluster: (cluster: string) => void;
  file: File | null;
  handleFileChange: (files: FileList | null) => void;
  handleSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  message: React.ReactNode;
  indexOptions: Array<{ label: string }>;
}

export const UploadFormComponent = ({
  indexName,
  setIndexName,
  delimiter,
  setDelimiter,
  clusters,
  cluster,
  setCluster,
  file,
  handleFileChange,
  handleSubmit,
  isLoading,
  message,
  indexOptions,
}: UploadFormComponentProps) => {
  return (
    <EuiForm component="form" onSubmit={handleSubmit}>
      <EuiFormRow label="Index Name">
        <EuiComboBox
          placeholder="Enter index name"
          singleSelection={{ asPlainText: true }}
          options={indexOptions}
          selectedOptions={indexName ? [{ label: indexName }] : []}
          onChange={(selected) => setIndexName(selected.length ? selected[0].label : '')}
          onCreateOption={(createdOption) => setIndexName(createdOption)}
        />
      </EuiFormRow>

      <EuiFormRow
        label={
          <>
            Delimiter{' '}
            <EuiIconTip
              content="Select the delimiter used in your CSV file. Common delimiters include comma, tab, semicolon, and pipe."
              position="right"
            />
          </>
        }
      >
        <EuiSelect
          options={[
            { value: ',', text: 'Comma (,)' },
            { value: '\t', text: 'Tab (\\t)' },
            { value: ';', text: 'Semicolon (;)' },
            { value: '|', text: 'Pipe (|)' },
          ]}
          value={delimiter}
          onChange={(e) => setDelimiter(e.target.value)}
          required
        />
      </EuiFormRow>

      {clusters.length > 0 && (
        <EuiFormRow label="Cluster">
          <EuiSelect
            options={clusters.map((clu) => ({ value: clu, text: clu }))}
            value={cluster}
            onChange={(e) => setCluster(e.target.value)}
            required
          />
        </EuiFormRow>
      )}

      <EuiFormRow label="File">
        <EuiFilePicker
          onChange={handleFileChange}
          initialPromptText="Select or drag and drop a CSV, JSON, or NDJSON file"
          accept=".csv,.json,.ndjson"
          required
        />
      </EuiFormRow>

      <EuiSpacer />

      <EuiButton type="submit" fill isLoading={isLoading} disabled={!file || !indexName}>
        Upload and Index
      </EuiButton>

      {isLoading && <EuiLoadingSpinner size="l" />}

      {message && (
        <>
          <EuiSpacer />
          <EuiText>{message}</EuiText>
        </>
      )}
    </EuiForm>
  );
};

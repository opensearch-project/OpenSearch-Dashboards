import React, { useState, useEffect } from 'react';
import { EuiFlexGroup, EuiFlexItem, EuiLink } from '@elastic/eui';
import { HttpStart, NotificationsStart } from '../../../../core/public';
import { UploadFormComponent } from './upload_form_component';
import { PreviewComponent } from './preview_component';

interface UploadFormProps {
  http: HttpStart;
  notifications: NotificationsStart;
}

export const UploadForm = ({ http, notifications }: UploadFormProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [indexName, setIndexName] = useState('');
  const [delimiter, setDelimiter] = useState(',');
  const [cluster, setCluster] = useState('');
  const [clusters, setClusters] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<React.ReactNode>('');
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [fieldMappings, setFieldMappings] = useState<{ [key: string]: string }>({});
  const [indexOptions, setIndexOptions] = useState<Array<{ label: string }>>([]);
  const [visibleRows, setVisibleRows] = useState(10);

  const handleSuccess = (msg: string) => {
    notifications.toasts.addSuccess('Successfully indexed documents');
    setMessage(
      <>
        {msg}{' '}
        <EuiLink href={http.basePath.prepend('/app/dev_tools#/console')} target="_blank">
          Go to Console
        </EuiLink>
      </>
    );
  };

  useEffect(() => {
    // Fetch available clusters
    const fetchClusters = async () => {
      const response = await http.get('/api/data_importer/clusters');
      setClusters(response.clusters);
      setCluster(response.clusters[0]);
    };
    fetchClusters();

    // Fetch existing indices
    const fetchIndices = async () => {
      try {
        const response = await http.get('/api/data_importer/indices');
        setIndexOptions(response.indices.map((index: string) => ({ label: index })));
      } catch (error) {
        // Error logging
      }
    };
    fetchIndices();
  }, [http]);

  const handleFileChange = (files: FileList | null) => {
    setFile(files?.[0] || null);
    if (!files?.[0]) {
      setMessage(''); // Clear the message when the file is removed
    }
    if (files?.[0]) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const fileContent = e.target?.result as string;
        if (files[0].name.endsWith('.csv')) {
          const data = parseCSV(fileContent);
          setPreviewData(data);
          detectSchema(data);
        } else if (files[0].name.endsWith('.json')) {
          const data = JSON.parse(fileContent);
          setPreviewData(data);
          detectSchema(data);
        } else if (files[0].name.endsWith('.ndjson')) {
          const data = fileContent
            .split('\n')
            .filter(Boolean)
            .map((line) => JSON.parse(line));
          setPreviewData(data);
          detectSchema(data);
        }
      };
      reader.readAsText(files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // if (!file || !indexName) { // Removed cluster from the condition
    //   setMessage('Please select a file and provide an index name');
    //   return;
    // }

    setIsLoading(true);
    setMessage('');

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const fileContent = event.target?.result as string;
        let documents;

        if (file?.name.endsWith('.csv')) {
          documents = parseCSV(fileContent);
        } else if (file?.name.endsWith('.json')) {
          documents = JSON.parse(fileContent);
        } else if (file?.name.endsWith('.ndjson')) {
          documents = fileContent
            .split('\n')
            .filter(Boolean)
            .map((line) => JSON.parse(line));
        } else {
          setMessage('Unsupported file format. Please upload a CSV, JSON, or NDJSON file.');
          setIsLoading(false);
          return;
        }

        const response = await http.post('/api/data_importer/upload', {
          body: JSON.stringify({
            documents,
            indexName: indexName.toLowerCase(),
            fieldMappings,
          }),
        });

        if (response.errors) {
          setMessage(
            `Indexed ${response.documentsCount} out of ${response.totalDocuments} documents. ` +
              `Failed: ${response.failedDocuments}. Check console for details.`
          );
          notifications.toasts.addDanger(
            'Failed to index some documents. Check console for details.'
          );
        } else {
          handleSuccess(`Successfully indexed ${response.documentsCount} documents`);
        }
      };

      if (file) {
        reader.readAsText(file);
      }
    } catch (error: any) {
      setMessage(`Error: ${error.message || 'Unknown error occurred'}`);
      notifications.toasts.addDanger(`Error: ${error.message || 'Unknown error occurred'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const parseCSV = (csvContent: string): any[] => {
    const lines = csvContent.split('\n');
    const headers = lines[0].split(delimiter);
    return lines.slice(1).map((line) => {
      const values = line.split(delimiter);
      return headers.reduce((obj, header, index) => {
        obj[header] = values[index];
        return obj;
      }, {} as any);
    });
  };

  const detectSchema = (data: any[]) => {
    const schema: { [key: string]: string } = {};
    if (data.length > 0) {
      Object.keys(data[0]).forEach((key) => {
        schema[key] = typeof data[0][key];
      });
    }
    setFieldMappings(schema);
  };

  const loadMoreRows = () => {
    setVisibleRows((prev) => prev + 10);
  };

  return (
    <>
      <EuiFlexGroup style={{ height: 'calc(100vh - 220px)' }}>
        <EuiFlexItem grow={1} style={{ overflowY: 'auto', maxWidth: '400px' }}>
          <UploadFormComponent
            indexName={indexName}
            setIndexName={setIndexName}
            delimiter={delimiter}
            setDelimiter={setDelimiter}
            clusters={clusters}
            cluster={cluster}
            setCluster={setCluster}
            file={file}
            handleFileChange={handleFileChange}
            handleSubmit={handleSubmit}
            isLoading={isLoading}
            message={message}
            indexOptions={indexOptions}
          />
        </EuiFlexItem>

        <EuiFlexItem grow={2} style={{ overflowY: 'auto' }}>
          <PreviewComponent
            previewData={previewData}
            visibleRows={visibleRows}
            loadMoreRows={loadMoreRows}
          />
        </EuiFlexItem>
      </EuiFlexGroup>
    </>
  );
};

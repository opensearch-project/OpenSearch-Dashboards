/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiFilePicker } from '@elastic/eui';
import React from 'react';

export interface ImportFileContentBodyProps {
  enabledFileTypes: string[];
  onFileUpdate: (file?: File) => void;
  maxFileSizeBytes?: number;
}

export const ImportFileContentBody = ({
  enabledFileTypes,
  onFileUpdate,
  maxFileSizeBytes,
}: ImportFileContentBodyProps) => {
  const acceptedFileExtensions = enabledFileTypes.map((fileType) => `.${fileType}`).join(', ');

  const onFileChange = async (files: FileList | null) => {
    if (files && files.length > 0) {
      const selectedFile = files[0];

      // Read file immediately to detach it from the input element
      // This prevents ERR_UPLOAD_FILE_CHANGED errors if re-renders happen during the upload
      try {
        const arrayBuffer = await selectedFile.arrayBuffer();
        const detachedFile = new File([arrayBuffer], selectedFile.name, {
          type: selectedFile.type,
          lastModified: selectedFile.lastModified,
        });
        onFileUpdate(detachedFile);
      } catch (error) {
        // fallback to empty handle
        onFileUpdate(selectedFile);
      }
    }
  };

  return (
    <EuiFilePicker
      id="data-importer-file-picker"
      fullWidth={true}
      display={'large'}
      accept={acceptedFileExtensions}
      onChange={onFileChange}
      initialPromptText={`Select or drag and drop a ${acceptedFileExtensions} file`}
    />
  );
};

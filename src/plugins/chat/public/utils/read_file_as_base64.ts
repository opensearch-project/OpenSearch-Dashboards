/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export interface FileAttachment {
  filename: string;
  mimeType: string;
  base64: string;
  size: number;
}

/**
 * Read a File as base64-encoded data using FileReader.
 * Returns the raw base64 string (without the data URI prefix).
 */
export function readFileAsBase64(file: File): Promise<FileAttachment> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const dataUrl = reader.result as string;
      // Strip the "data:<mime>;base64," prefix
      const base64 = dataUrl.split(',')[1] || '';
      resolve({
        filename: file.name,
        mimeType: file.type || 'application/octet-stream',
        base64,
        size: file.size,
      });
    };

    reader.onerror = () => {
      reject(new Error(`Failed to read file: ${file.name}`));
    };

    reader.readAsDataURL(file);
  });
}

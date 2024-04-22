/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export function extractSavedVisBuilderId(path: string) {
  const editIndex = path.indexOf('/edit/');
  if (editIndex === -1) {
    return '';
  }

  // Extract the path starting from '/edit/'
  const pathFromEdit = path.substring(editIndex);

  // Split the path and take the first two segments ('edit' and the ID)
  const segments = pathFromEdit.split('/').filter(Boolean);
  if (segments.length >= 2) {
    return `${segments[1]}`;
  }

  return ''; // no saved id
}

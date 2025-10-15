/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export const getColumnIdFromFieldName = (fieldName: string) => {
  return fieldName.replaceAll('.', '_');
};

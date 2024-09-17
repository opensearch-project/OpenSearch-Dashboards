/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedObjectAttributes } from 'src/core/types';

export const DATA_CONNECTION_SAVED_OBJECT_TYPE = 'data-connection';

/**
 * Represents the attributes of a data connection saved object.
 * @property connectionId: The name of the data connection.
 * @property type: The type of the data connection based on enum DataConnectionType
 * @property meta: Additional metadata associated with the data connection.
 */
export interface DataConnectionSavedObjectAttributes extends SavedObjectAttributes {
  connectionId: string;
  type: DataConnectionType;
  meta?: string;
}

export enum DataConnectionType {
  CloudWatch = 'AWS CloudWatch',
  SecurityLake = 'AWS Security Lake',
  NA = 'None',
}

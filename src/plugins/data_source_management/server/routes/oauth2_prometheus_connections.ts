/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Logger } from '../../../../../src/core/server';

/**
 * OAuth2 Prometheus connection helpers
 * This module contains OAuth2-specific logic for Prometheus data sources
 * Isolated to reduce OSS merge conflicts
 */

/** Marks a data-connection saved object as carrying OAuth2 configuration. */
const OAUTH2_ENABLED_PROPERTY = 'prometheus.oauth2.enabled';

/** Grants access to every data source, matching the security plugin's reserved role. */
const ALL_ACCESS_ROLE = 'all_access';

/** Shape the data connections routes return for an OAuth2 Prometheus connection. */
export interface OAuth2PrometheusConnection {
  name: string;
  connector: string;
  dataSourceType: string;
  allowedRoles: string[];
  properties: Record<string, string>;
  status: string;
  savedObjectId: string;
}

const isOAuth2Connection = (savedObject: any): boolean => {
  const properties = savedObject?.attributes?.properties;
  return !!properties && properties[OAUTH2_ENABLED_PROPERTY] === 'true';
};

const toConnection = (savedObject: any, fallbackName?: string): OAuth2PrometheusConnection => {
  const attributes = savedObject.attributes as any;
  return {
    name: attributes.connectionId || fallbackName,
    // Upper-cased to match what the backend reports. Consumers key off that casing -
    // getDirectQueryConnections filters on `connector !== 'PROMETHEUS'` and
    // DatasourceTypeToDisplayName is keyed by 'PROMETHEUS' - so a lower case value would slip
    // through the filter, render with a blank type, and displace the backend row in the
    // name-based dedupe. Normalising on read avoids migrating existing saved objects.
    connector: (attributes.connector || 'prometheus').toUpperCase(),
    dataSourceType: attributes.dataSourceType || 'prometheus',
    allowedRoles: attributes.allowedRoles || [],
    properties: attributes.properties,
    status: 'ACTIVE',
    savedObjectId: savedObject.id,
  };
};

/**
 * Reads the calling user's roles from the security plugin.
 *
 * Returns null only when the security plugin is not installed, in which case there is no
 * authorization to enforce and the SQL backend skips it too
 * (`DataSourceUserAuthorizationHelperImpl`). Any other failure - a 503, a timeout, a 403 -
 * rethrows, because treating it as "no security" would hand every connection's uri, tokenUrl
 * and role list to a caller whose roles we could not establish.
 */
const getCallerRoles = async (context: any, logger: Logger): Promise<string[] | null> => {
  try {
    const { body } = await context.core.opensearch.client.asCurrentUser.transport.request({
      method: 'GET',
      path: '/_plugins/_security/authinfo',
    });
    return [...(body?.roles ?? []), ...(body?.backend_roles ?? [])];
  } catch (error) {
    const statusCode = (error as any)?.statusCode ?? (error as any)?.meta?.statusCode;
    if (statusCode === 404 || statusCode === 400) {
      logger.debug('Security plugin not installed, skipping allowedRoles filtering');
      return null;
    }
    logger.warn(
      `Unable to determine caller roles, withholding OAuth2 connections: ${
        error instanceof Error ? error.message : 'unknown error'
      }`
    );
    throw error;
  }
};

/**
 * Mirrors DataSourceUserAuthorizationHelperImpl.authorizeDataSource: the caller needs a role
 * listed in allowedRoles, or the all_access role. Note that an empty allowedRoles therefore
 * grants access to all_access holders only - the same connection is already hidden from the
 * backend listing on that basis, so applying it here keeps the merged list consistent.
 */
const isAuthorized = (
  connection: OAuth2PrometheusConnection,
  callerRoles: string[] | null
): boolean => {
  if (callerRoles === null) {
    return true;
  }
  if (callerRoles.includes(ALL_ACCESS_ROLE)) {
    return true;
  }
  return connection.allowedRoles.some((role) => callerRoles.includes(role));
};

/**
 * Lists the OAuth2 Prometheus connections the caller is allowed to see.
 *
 * Kept here rather than inline in the route so the upstream handler bodies carry a single
 * guarded call and do not conflict on future oss/main merges.
 */
export async function listOAuth2PrometheusConnections(
  context: any,
  logger: Logger
): Promise<OAuth2PrometheusConnection[]> {
  try {
    const savedObjects = await context.core.savedObjects.client.find({
      type: 'data-connection',
      perPage: 10000, // Set high limit to avoid silent truncation of data sources
    });

    const connections = savedObjects.saved_objects
      .filter(isOAuth2Connection)
      .map((obj: any) => toConnection(obj));

    if (connections.length === 0) {
      return connections;
    }

    const callerRoles = await getCallerRoles(context, logger);
    return connections.filter((connection: OAuth2PrometheusConnection) =>
      isAuthorized(connection, callerRoles)
    );
  } catch (savedObjectError) {
    // Covers both the saved-objects lookup and the roles lookup. Returning an empty list means
    // an unresolved authorization check withholds the connections rather than exposing them.
    logger.debug(`Unable to list OAuth2 Prometheus connections: ${savedObjectError.message}`);
    return [];
  }
}

/**
 * Finds a single OAuth2 Prometheus connection by exact name, or undefined when there is no
 * OAuth2 connection with that name or the caller is not allowed to see it.
 */
export async function findOAuth2PrometheusConnection(
  context: any,
  name: string,
  logger: Logger
): Promise<OAuth2PrometheusConnection | undefined> {
  try {
    const savedObjects = await context.core.savedObjects.client.find({
      type: 'data-connection',
      search: name,
      searchFields: ['connectionId'],
      perPage: 10000, // Set high limit to avoid silent truncation
    });

    // `search` is a fuzzy match, so narrow to the exact connectionId before using a hit.
    const exactMatch = savedObjects.saved_objects.find(
      (obj: any) => (obj.attributes as any).connectionId === name
    );

    if (!exactMatch || !isOAuth2Connection(exactMatch)) {
      return undefined;
    }

    const connection = toConnection(exactMatch, name);
    const callerRoles = await getCallerRoles(context, logger);
    if (!isAuthorized(connection, callerRoles)) {
      logger.debug('Caller is not allowed to access the requested OAuth2 Prometheus connection');
      return undefined;
    }

    logger.debug('Found OAuth2 Prometheus data source in saved objects');
    return connection;
  } catch (savedObjectError) {
    // Covers both lookups: if the caller's roles could not be established the connection is
    // withheld and the request falls through to the backend, which enforces its own check.
    logger.debug(
      `No OAuth2 data source returned from saved objects, trying backend: ${savedObjectError.message}`
    );
    return undefined;
  }
}

/**
 * Frontend form properties for Prometheus data sources
 */
interface PrometheusFormProperties {
  'prometheus.uri'?: string;
  'prometheus.auth.type'?: string;
  authMethod?: string;
  // OAuth2 frontend form fields
  'prometheus.auth.client_id'?: string;
  'prometheus.auth.client_secret'?: string;
  'prometheus.auth.token_url'?: string;
  'prometheus.auth.scopes'?: string;
  'prometheus.auth.audience'?: string;
  'prometheus.auth.grant_type'?: string;
  // Allow additional properties for extensibility
  [key: string]: string | undefined;
}

/**
 * Backend Prometheus properties after mapping
 */
interface PrometheusBackendProperties {
  'prometheus.uri'?: string;
  'prometheus.auth.type'?: string;
  authMethod?: string;
  // OAuth2 backend mapped fields
  'prometheus.oauth2.clientId'?: string;
  'prometheus.oauth2.clientSecret'?: string;
  'prometheus.oauth2.tokenUrl'?: string;
  'prometheus.oauth2.scopes'?: string;
  'prometheus.oauth2.audience'?: string;
  'prometheus.oauth2.grantType'?: string;
  'prometheus.oauth2.enabled'?: string;
  // Allow additional properties for extensibility
  [key: string]: string | undefined;
}

/**
 * Raised when the submitted Prometheus form cannot be mapped. Carries a 400 so the route's
 * error handler reports a bad request rather than an internal error - these are all things
 * the caller got wrong, not server faults.
 */
function badRequest(message: string): Error {
  const error = new Error(message) as Error & { statusCode: number };
  error.statusCode = 400;
  return error;
}

/**
 * Maps frontend form fields to backend Prometheus property names
 */
export function mapPrometheusProperties(
  properties: PrometheusFormProperties,
  logger: Logger
): PrometheusBackendProperties {
  if (!properties) {
    throw badRequest('Properties object is required for Prometheus mapping');
  }

  const authType = properties['prometheus.auth.type'] || properties.authMethod;
  const mappedProperties = { ...properties };

  if (authType === 'oauth2') {
    // Handle both old bare property names and new prefixed property names
    const clientId = properties['prometheus.auth.client_id'];
    const clientSecret = properties['prometheus.auth.client_secret'];
    const tokenUrl = properties['prometheus.auth.token_url'];
    const scopes = properties['prometheus.auth.scopes'];
    const audience = properties['prometheus.auth.audience'];
    const grantType = properties['prometheus.auth.grant_type'];

    if (clientId) {
      mappedProperties['prometheus.oauth2.clientId'] = clientId;
    }
    if (clientSecret) {
      mappedProperties['prometheus.oauth2.clientSecret'] = clientSecret;
    }
    if (tokenUrl) {
      mappedProperties['prometheus.oauth2.tokenUrl'] = tokenUrl;
    }
    if (scopes) {
      mappedProperties['prometheus.oauth2.scopes'] = scopes;
    }
    if (audience) {
      mappedProperties['prometheus.oauth2.audience'] = audience;
    }
    if (grantType) {
      mappedProperties['prometheus.oauth2.grantType'] = grantType;
    }

    // Validate required OAuth2 fields before enabling
    if (!clientId || !clientSecret || !tokenUrl) {
      throw badRequest('OAuth2 requires clientId, clientSecret, and tokenUrl to be provided');
    }

    mappedProperties['prometheus.oauth2.enabled'] = 'true';
    mappedProperties['prometheus.auth.type'] = 'oauth2';

    // Remove original frontend credential fields for security
    delete mappedProperties['prometheus.auth.client_id'];
    delete mappedProperties['prometheus.auth.client_secret'];
    delete mappedProperties['prometheus.auth.token_url'];
    delete mappedProperties['prometheus.auth.scopes'];
    delete mappedProperties['prometheus.auth.audience'];
    delete mappedProperties['prometheus.auth.grant_type'];

    // authMethod is how the wizard names the choice; the connector property set has no such
    // key. This object is posted verbatim as `properties` to ppl.createDataSource, so leaving
    // it in risks a backend that validates the property set rejecting the create.
    delete mappedProperties.authMethod;

    logger.debug('OAuth2 configuration mapped to properties');
  }

  return mappedProperties;
}

/**
 * Checks if a data source is an OAuth2 Prometheus data source
 */
export function isOAuth2Prometheus(
  connector: string,
  properties: any,
  mappedProperties: any
): boolean {
  return (
    connector === 'prometheus' &&
    (properties?.authMethod === 'oauth2' ||
      properties?.['prometheus.auth.type'] === 'oauth2' ||
      mappedProperties?.['prometheus.oauth2.enabled'] === 'true')
  );
}

/**
 * Creates OAuth2 Prometheus data source in backend with error handling
 */
export async function createOAuth2PrometheusDataSource(
  client: any,
  requestBody: any,
  mappedProperties: any,
  logger: Logger
): Promise<any> {
  try {
    // Create the data source in the backend with accesstoken auth (OAuth2 tokens will be injected)
    const dataConnectionsresponse = await client('ppl.createDataSource', {
      body: {
        name: requestBody.name,
        connector: requestBody.connector,
        allowedRoles: requestBody.allowedRoles,
        properties: mappedProperties, // This includes the mapped OAuth2 properties with accesstoken auth
      },
    });

    logger.info('OAuth2 Prometheus data source created in backend successfully');
    // Remove sensitive data logging - backend response may contain metadata that should not be logged
    logger.debug('OAuth2 data source creation completed');

    return dataConnectionsresponse;
  } catch (backendError) {
    logger.error(
      `Backend creation failed for OAuth2 data source: ${backendError.message} ` +
        `(statusCode: ${backendError.statusCode})`
    );

    // Preserve original error properties instead of creating new Error
    const preservedError = new Error(
      `Backend storage failed for OAuth2 data source: ${backendError.message}`
    ) as any;
    preservedError.statusCode = backendError.statusCode;
    preservedError.body = backendError.body;
    preservedError.response = backendError.response;

    throw preservedError;
  }
}

/**
 * Creates saved object for OAuth2 configuration storage
 */
export async function createOAuth2SavedObject(
  savedObjectsClient: any,
  requestBody: any,
  mappedProperties: any,
  logger: Logger
): Promise<any> {
  try {
    // Remove sensitive credential fields from saved object properties
    const sanitizedProperties = { ...mappedProperties };
    delete sanitizedProperties['prometheus.oauth2.clientSecret'];
    delete sanitizedProperties['prometheus.oauth2.clientId']; // Also sensitive
    // Also remove any remaining frontend credential fields that might have leaked through
    delete sanitizedProperties['prometheus.auth.client_secret'];
    delete sanitizedProperties['prometheus.auth.client_id'];

    const savedObject = await savedObjectsClient.create('data-connection', {
      connectionId: requestBody.name,
      type: 'Prometheus', // DataConnectionType.Prometheus
      dataSourceType: 'prometheus', // Add dataSourceType for backend compatibility
      properties: sanitizedProperties,
      connector: requestBody.connector,
      allowedRoles: requestBody.allowedRoles,
    });

    logger.info('OAuth2 Prometheus saved object created successfully');

    return savedObject;
  } catch (savedObjectError) {
    logger.error(`Failed to create OAuth2 saved object: ${savedObjectError.message}`);
    throw new Error(
      `OAuth2 data source creation failed: Unable to create saved object for data source management. ${savedObjectError.message}`
    );
  }
}

/**
 * Handles rollback of backend creation when saved object creation fails
 */
export async function rollbackBackendCreation(
  client: any,
  dataSourceName: string,
  logger: Logger
): Promise<{ success: boolean; error?: Error }> {
  try {
    logger.warn('Rolling back backend data source creation due to saved object failure');
    await client('ppl.deleteDataConnection', {
      dataconnection: dataSourceName,
    });
    logger.info('Backend rollback completed successfully');
    return { success: true };
  } catch (rollbackError) {
    const error = rollbackError instanceof Error ? rollbackError : new Error(String(rollbackError));
    logger.error(`Failed to rollback backend creation: ${error.message}`);
    return { success: false, error };
  }
}

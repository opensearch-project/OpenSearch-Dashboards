/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiComboBoxOptionOption } from '@elastic/eui';

export enum DirectQueryLoadingStatus {
  SUCCESS = 'success',
  FAILED = 'failed',
  RUNNING = 'running',
  SUBMITTED = 'submitted',
  SCHEDULED = 'scheduled',
  CANCELLED = 'cancelled',
  WAITING = 'waiting',
  INITIAL = 'initial',
  FRESH = 'fresh',
}

export interface DirectQueryRequest {
  query: string;
  lang: string;
  datasource: string;
  sessionId?: string;
}

export type AccelerationStatus = 'ACTIVE' | 'INACTIVE';

export interface PermissionsConfigurationProps {
  roles: Role[];
  selectedRoles: Role[];
  setSelectedRoles: React.Dispatch<React.SetStateAction<Role[]>>;
  layout: 'horizontal' | 'vertical';
  hasSecurityAccess: boolean;
}

export interface TableColumn {
  name: string;
  dataType: string;
}

export interface Acceleration {
  name: string;
  status: AccelerationStatus;
  type: string;
  database: string;
  table: string;
  destination: string;
  dateCreated: number;
  dateUpdated: number;
  index: string;
  sql: string;
}

export interface AssociatedObject {
  tableName: string;
  datasource: string;
  id: string;
  name: string;
  database: string;
  type: AssociatedObjectIndexType;
  accelerations: CachedAcceleration[] | AssociatedObject;
  columns?: CachedColumn[];
}

export type Role = EuiComboBoxOptionOption;

export type DatasourceType = 'S3GLUE' | 'PROMETHEUS';

export interface S3GlueProperties {
  'glue.indexstore.opensearch.uri': string;
  'glue.indexstore.opensearch.region': string;
}

export interface PrometheusProperties {
  'prometheus.uri': string;
}

export type DatasourceStatus = 'ACTIVE' | 'DISABLED';

export interface DatasourceDetails {
  allowedRoles: string[];
  name: string;
  connector: DatasourceType;
  description: string;
  properties: S3GlueProperties | PrometheusProperties;
  status: DatasourceStatus;
}

interface AsyncApiDataResponse {
  status: string;
  schema?: Array<{ name: string; type: string }>;
  datarows?: any;
  total?: number;
  size?: number;
  error?: string;
}

export interface AsyncApiResponse {
  data: {
    ok: boolean;
    resp: AsyncApiDataResponse;
  };
}

export type PollingCallback = (statusObj: AsyncApiResponse) => void;

export type AssociatedObjectIndexType = AccelerationIndexType | 'table';

export type AccelerationIndexType = 'skipping' | 'covering' | 'materialized';

export type LoadCacheType = 'databases' | 'tables' | 'accelerations' | 'tableColumns';

export enum CachedDataSourceStatus {
  Updated = 'Updated',
  Failed = 'Failed',
  Empty = 'Empty',
}

export interface CachedColumn {
  fieldName: string;
  dataType: string;
}

export interface CachedTable {
  name: string;
  columns?: CachedColumn[];
}

export interface CachedDatabase {
  name: string;
  tables: CachedTable[];
  lastUpdated: string; // date string in UTC format
  status: CachedDataSourceStatus;
}

export interface CachedDataSource {
  name: string;
  lastUpdated: string; // date string in UTC format
  status: CachedDataSourceStatus;
  databases: CachedDatabase[];
  dataSourceMDSId?: string;
}

export interface DataSourceCacheData {
  version: string;
  dataSources: CachedDataSource[];
}

export interface CachedAcceleration {
  flintIndexName: string;
  type: AccelerationIndexType;
  database: string;
  table: string;
  indexName: string;
  autoRefresh: boolean;
  status: string;
}

export interface CachedAccelerationByDataSource {
  name: string;
  accelerations: CachedAcceleration[];
  lastUpdated: string; // date string in UTC format
  status: CachedDataSourceStatus;
  dataSourceMDSId?: string;
}

export interface AccelerationsCacheData {
  version: string;
  dataSources: CachedAccelerationByDataSource[];
}

export interface PollingSuccessResult {
  schema: Array<{ name: string; type: string }>;
  datarows: Array<Array<string | number | boolean>>;
}

export type AsyncPollingResult = PollingSuccessResult | null;

export type AggregationFunctionType = 'count' | 'sum' | 'avg' | 'max' | 'min' | 'window.start';

export interface MaterializedViewColumn {
  id: string;
  functionName: AggregationFunctionType;
  functionParam?: string;
  fieldAlias?: string;
}

export type SkippingIndexAccMethodType = 'PARTITION' | 'VALUE_SET' | 'MIN_MAX' | 'BLOOM_FILTER';

export interface SkippingIndexRowType {
  id: string;
  fieldName: string;
  dataType: string;
  accelerationMethod: SkippingIndexAccMethodType;
}

export interface DataTableFieldsType {
  id: string;
  fieldName: string;
  dataType: string;
}

export interface RefreshIntervalType {
  refreshWindow: number;
  refreshInterval: string;
}

export interface WatermarkDelayType {
  delayWindow: number;
  delayInterval: string;
}

export interface GroupByTumbleType {
  timeField: string;
  tumbleWindow: number;
  tumbleInterval: string;
}

export interface MaterializedViewQueryType {
  columnsValues: MaterializedViewColumn[];
  groupByTumbleValue: GroupByTumbleType;
}

export interface FormErrorsType {
  dataSourceError: string[];
  databaseError: string[];
  dataTableError: string[];
  skippingIndexError: string[];
  coveringIndexError: string[];
  materializedViewError: string[];
  indexNameError: string[];
  primaryShardsError: string[];
  replicaShardsError: string[];
  refreshIntervalError: string[];
  checkpointLocationError: string[];
  watermarkDelayError: string[];
}

export type AccelerationRefreshType = 'autoInterval' | 'manual' | 'manualIncrement';

export interface CreateAccelerationForm {
  dataSource: string;
  database: string;
  dataTable: string;
  dataTableFields: DataTableFieldsType[];
  accelerationIndexType: AccelerationIndexType;
  skippingIndexQueryData: SkippingIndexRowType[];
  coveringIndexQueryData: string[];
  materializedViewQueryData: MaterializedViewQueryType;
  accelerationIndexName: string;
  primaryShardsCount: number;
  replicaShardsCount: number;
  refreshType: AccelerationRefreshType;
  checkpointLocation: string | undefined;
  watermarkDelay: WatermarkDelayType;
  refreshIntervalOptions: RefreshIntervalType;
  formErrors: FormErrorsType;
}

export interface LoadCachehookOutput {
  loadStatus: DirectQueryLoadingStatus;
  startLoading: (params: StartLoadingParams) => void;
  stopLoading: () => void;
}

export interface StartLoadingParams {
  dataSourceName: string;
  dataSourceMDSId?: string;
  databaseName?: string;
  tableName?: string;
}

export interface RenderAccelerationFlyoutParams {
  dataSourceName: string;
  dataSourceMDSId?: string;
  databaseName?: string;
  tableName?: string;
  handleRefresh?: () => void;
}

export interface RenderAssociatedObjectsDetailsFlyoutParams {
  tableDetail: AssociatedObject;
  dataSourceName: string;
  handleRefresh?: () => void;
  dataSourceMDSId?: string;
}

export interface RenderAccelerationDetailsFlyoutParams {
  acceleration: CachedAcceleration;
  dataSourceName: string;
  handleRefresh?: () => void;
  dataSourceMDSId?: string;
}

// Integration types

export interface StaticAsset {
  annotation?: string;
  path: string;
}

export interface IntegrationWorkflow {
  name: string;
  label: string;
  description: string;
  enabled_by_default: boolean;
}

export interface IntegrationStatics {
  logo?: StaticAsset;
  gallery?: StaticAsset[];
  darkModeLogo?: StaticAsset;
  darkModeGallery?: StaticAsset[];
}

export interface IntegrationComponent {
  name: string;
  version: string;
}

export type SupportedAssetType = 'savedObjectBundle' | 'query';

export interface IntegrationAsset {
  name: string;
  version: string;
  extension: string;
  type: SupportedAssetType;
  workflows?: string[];
}

export interface IntegrationConfig {
  name: string;
  version: string;
  displayName?: string;
  license: string;
  type: string;
  labels?: string[];
  author?: string;
  description?: string;
  sourceUrl?: string;
  workflows?: IntegrationWorkflow[];
  statics?: IntegrationStatics;
  components: IntegrationComponent[];
  assets: IntegrationAsset[];
  sampleData?: {
    path: string;
  };
}

export interface AvailableIntegrationsList {
  hits: IntegrationConfig[];
}

export interface AssetReference {
  assetType: string;
  assetId: string;
  isDefaultAsset: boolean;
  description: string;
  status?: string;
}

export interface IntegrationInstanceResult extends IntegrationInstance {
  id: string;
  status: string;
}

export interface IntegrationInstance {
  name: string;
  templateName: string;
  dataSource: string;
  creationDate: string;
  assets: AssetReference[];
}

export interface AvailableIntegrationsList {
  hits: IntegrationConfig[];
}

export interface IntegrationInstancesSearchResult {
  hits: IntegrationInstanceResult[];
}

export type ParsedIntegrationAsset =
  | { type: 'savedObjectBundle'; workflows?: string[]; data: object[] }
  | { type: 'query'; workflows?: string[]; query: string; language: string };

export type Result<T, E = Error> =
  | { ok: true; value: T; error?: undefined }
  | { ok: false; error: E; value?: undefined };

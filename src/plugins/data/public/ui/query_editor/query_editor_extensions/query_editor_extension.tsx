/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiErrorBoundary } from '@elastic/eui';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { Observable } from 'rxjs';
import { DataStructureMeta, Query } from '../../../../common';
import { ResultStatus } from '../../../query/query_string/language_service/lib';

interface QueryEditorExtensionProps {
  config: QueryEditorExtensionConfig;
  dependencies: QueryEditorExtensionDependencies;
  componentContainer: Element;
  bannerContainer: Element;
  bottomPanelContainer: Element;
  queryControlsContainer: Element;
}

export interface QueryEditorExtensionDependencies {
  /**
   * Currently selected query language.
   */
  language: string;
  /**
   * Change the selected query language.
   */
  onSelectLanguage: (language: string) => void;
  /**
   * Whether the query editor is collapsed.
   */
  isCollapsed: boolean;
  /**
   * Set whether the query editor is collapsed.
   */
  setIsCollapsed: (isCollapsed: boolean) => void;
  /**
   * Currently set Query
   */
  query: Query;
  /**
   * Fetch status for the currently running query
   */
  fetchStatus?: ResultStatus;
}

export interface QueryEditorExtensionConfig {
  /**
   * The id for the query editor extension.
   */
  id: string;
  /**
   * Lower order indicates higher position on UI.
   */
  order: number;
  /**
   * A function that determines if the query editor extension is enabled and should be rendered on UI.
   * @returns whether the extension is enabled.
   */
  isEnabled$: (dependencies: QueryEditorExtensionDependencies) => Observable<boolean>;
  /**
   * @returns DataStructureMeta for a given data source id.
   */
  getDataStructureMeta?: (
    dataSourceId: string | undefined
  ) => Promise<DataStructureMeta | undefined>;
  /**
   * A function that returns the query editor extension component. The component
   * will be displayed on top of the query editor in the search bar.
   * @param dependencies - The dependencies required for the extension.
   * @returns The component the query editor extension.
   */
  getComponent?: (dependencies: QueryEditorExtensionDependencies) => React.ReactElement | null;
  /**
   * A function that returns the query editor extension banner. The banner is a
   * component that will be displayed on top of the search bar.
   * @param dependencies - The dependencies required for the extension.
   * @returns The component the query editor extension.
   */
  getBanner?: (dependencies: QueryEditorExtensionDependencies) => React.ReactElement | null;

  getSearchBarButton?: (
    dependencies: QueryEditorExtensionDependencies
  ) => React.ReactElement | null;
  /**
   * Returns the footer element that is rendered at the bottom of the query editor.
   * @param dependencies - The dependencies required for the extension.
   * @returns The component the query editor extension.
   */
  getBottomPanel?: (dependencies: QueryEditorExtensionDependencies) => React.ReactElement | null;
}
const QueryEditorExtensionPortal: React.FC<{ container: Element }> = (props) => {
  if (!props.children) return null;

  return ReactDOM.createPortal(
    <EuiErrorBoundary>{props.children}</EuiErrorBoundary>,
    props.container
  );
};

export const QueryEditorExtension: React.FC<QueryEditorExtensionProps> = (props) => {
  const [isEnabled, setIsEnabled] = useState(false);
  const isMounted = useRef(false);

  const banner = useMemo(() => props.config.getBanner?.(props.dependencies), [
    props.config,
    props.dependencies,
  ]);

  const component = useMemo(() => props.config.getComponent?.(props.dependencies), [
    props.config,
    props.dependencies,
  ]);

  const queryControlButtons = useMemo(() => props.config.getSearchBarButton?.(props.dependencies), [
    props.config,
    props.dependencies,
  ]);

  const bottomPanel = useMemo(() => props.config.getBottomPanel?.(props.dependencies), [
    props.config,
    props.dependencies,
  ]);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    const subscription = props.config.isEnabled$(props.dependencies).subscribe((enabled) => {
      if (isMounted.current) setIsEnabled(enabled);
    });
    return () => subscription.unsubscribe();
  }, [props.dependencies, props.config]);

  if (!isEnabled) return null;

  return (
    <>
      <QueryEditorExtensionPortal container={props.bannerContainer}>
        {banner}
      </QueryEditorExtensionPortal>
      <QueryEditorExtensionPortal container={props.componentContainer}>
        {component}
      </QueryEditorExtensionPortal>
      <QueryEditorExtensionPortal container={props.queryControlsContainer}>
        {queryControlButtons}
      </QueryEditorExtensionPortal>
      <QueryEditorExtensionPortal container={props.bottomPanelContainer}>
        {bottomPanel}
      </QueryEditorExtensionPortal>
    </>
  );
};

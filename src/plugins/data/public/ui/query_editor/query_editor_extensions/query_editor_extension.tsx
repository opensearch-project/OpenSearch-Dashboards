/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiErrorBoundary } from '@elastic/eui';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { Observable } from 'rxjs';
import { IIndexPattern } from '../../../../common';
import { DataSource } from '../../../data_sources/datasource';

interface QueryEditorExtensionProps {
  config: QueryEditorExtensionConfig;
  dependencies: QueryEditorExtensionDependencies;
  componentContainer: Element;
  bannerContainer: Element;
}

export interface QueryEditorExtensionDependencies {
  /**
   * Currently selected index patterns.
   */
  indexPatterns?: Array<IIndexPattern | string>;
  /**
   * Currently selected data source.
   */
  dataSource?: DataSource;
  /**
   * Currently selected query language.
   */
  language: string;
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

  getFooter?: (dependencies: QueryEditorExtensionDependencies) => React.ReactElement | null;
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

  const footer = useMemo(() => props.config.getFooter?.(props.dependencies), [
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

  console.log('isEnabled', isEnabled);
  console.log('props.config', props.config);
  console.log('banner', props.bannerContainer, banner);
  console.log('component', props.componentContainer, component);
  if (!isEnabled) return null;

  return (
    <>
      <QueryEditorExtensionPortal container={props.bannerContainer}>
        {banner}
      </QueryEditorExtensionPortal>
      <QueryEditorExtensionPortal container={props.componentContainer}>
        {component}
      </QueryEditorExtensionPortal>
    </>
  );
};

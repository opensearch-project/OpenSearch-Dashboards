/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiErrorBoundary } from '@elastic/eui';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { IIndexPattern } from '../../../common';
import { DataSource } from '../../data_sources/datasource';

interface SearchBarExtensionProps {
  config: SearchBarExtensionConfig;
  dependencies: SearchBarExtensionDependencies;
  componentContainer: Element;
  bannerContainer: Element;
}

export interface SearchBarExtensionDependencies {
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

export interface SearchBarExtensionConfig {
  /**
   * The id for the search bar extension.
   */
  id: string;
  /**
   * Lower order indicates higher position on UI.
   */
  order: number;
  /**
   * A function that determines if the search bar extension is enabled and should be rendered on UI.
   * @returns whether the extension is enabled.
   */
  isEnabled: (dependencies: SearchBarExtensionDependencies) => Promise<boolean>;
  /**
   * A function that returns the search bar extension component. The component
   * will be displayed on top of the query editor in the search bar.
   * @param dependencies - The dependencies required for the extension.
   * @returns The component the search bar extension.
   */
  getComponent?: (dependencies: SearchBarExtensionDependencies) => React.ReactElement | null;
  /**
   * A function that returns the search bar extension banner. The banner is a
   * component that will be displayed on top of the search bar.
   * @param dependencies - The dependencies required for the extension.
   * @returns The component the search bar extension.
   */
  getBanner?: (dependencies: SearchBarExtensionDependencies) => React.ReactElement | null;
}

const SearchBarExtensionPortal: React.FC<{ container: Element }> = (props) => {
  if (!props.children) return null;

  return ReactDOM.createPortal(
    <EuiErrorBoundary>{props.children}</EuiErrorBoundary>,
    props.container
  );
};

export const SearchBarExtension: React.FC<SearchBarExtensionProps> = (props) => {
  const [isEnabled, setIsEnabled] = useState(false);
  const isMounted = useRef(true);

  const banner = useMemo(() => props.config.getBanner?.(props.dependencies), [
    props.config,
    props.dependencies,
  ]);

  const component = useMemo(() => props.config.getComponent?.(props.dependencies), [
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
    props.config.isEnabled(props.dependencies).then((enabled) => {
      if (isMounted.current) setIsEnabled(enabled);
    });
  }, [props.dependencies, props.config]);

  if (!isEnabled) return null;

  return (
    <>
      <SearchBarExtensionPortal container={props.bannerContainer}>
        {banner}
      </SearchBarExtensionPortal>
      <SearchBarExtensionPortal container={props.componentContainer}>
        {component}
      </SearchBarExtensionPortal>
    </>
  );
};

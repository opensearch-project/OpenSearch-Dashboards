/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useCallback, useState } from 'react';
import {
  EuiButtonIcon,
  EuiFlexGroup,
  EuiFlexItem,
  EuiOverlayMask,
  EuiPanel,
  EuiSpacer,
  EuiText,
} from '@elastic/eui';
import { CoreStart } from 'opensearch-dashboards/public';
import { MainApp } from './application';
import { DevToolApp } from './dev_tool';
import { DevToolsSetupDependencies } from './plugin';
import './dev_tools_icon.scss';

export function DevToolsIcon({
  core,
  appId,
  devTools,
  deps,
  title,
}: {
  core: CoreStart;
  appId: string;
  devTools: readonly DevToolApp[];
  deps: DevToolsSetupDependencies;
  title: string;
}) {
  const [modalVisibile, setModalVisible] = useState(false);
  const elementRef = useRef<HTMLDivElement | null>(null);
  const setMountPoint = useCallback((renderFn) => {
    renderFn(elementRef.current);
    return () => {};
  }, []);

  return (
    <>
      <EuiButtonIcon
        aria-label="go-to-dev-tools"
        iconType="consoleApp"
        onClick={() => {
          setModalVisible(true);
        }}
      />
      {modalVisibile ? (
        /**
         * We can not use OuiModal component here because OuiModal uses OuiOverlayMask as its parent node
         * but overlay mask has a default padding bottom that prevent the modal from covering the whole page.
         */
        <EuiOverlayMask className="devToolsOverlayMask" headerZindexLocation="below">
          <div style={{ width: '100vw', height: '100vh', maxWidth: '100vw' }}>
            <EuiButtonIcon
              iconType="cross"
              onClick={() => setModalVisible(false)}
              className="euiModal__closeIcon"
              color="text"
            />
            <EuiPanel className="eui-fullHeight">
              <EuiFlexGroup direction="column" className="eui-fullHeight">
                <EuiFlexItem grow={false}>
                  <EuiSpacer />
                  <EuiFlexGroup justifyContent="spaceBetween">
                    <EuiFlexItem grow={1}>
                      <EuiText size="s">
                        <h2>{title}</h2>
                      </EuiText>
                    </EuiFlexItem>
                    <EuiFlexItem grow={false}>
                      <div ref={(element) => (elementRef.current = element)} />
                    </EuiFlexItem>
                  </EuiFlexGroup>
                </EuiFlexItem>
                <EuiFlexItem className="devAppWrapper">
                  <MainApp
                    devTools={devTools}
                    savedObjects={core.savedObjects}
                    notifications={core.notifications}
                    dataSourceEnabled={!!deps.dataSource}
                    dataSourceManagement={deps.dataSourceManagement}
                    useUpdatedUX
                    setMenuMountPoint={setMountPoint}
                  />
                </EuiFlexItem>
              </EuiFlexGroup>
            </EuiPanel>
          </div>
        </EuiOverlayMask>
      ) : null}
    </>
  );
}

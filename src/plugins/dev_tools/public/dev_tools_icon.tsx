/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useCallback, useState, useEffect } from 'react';
import {
  EuiButtonIcon,
  EuiFlexGroup,
  EuiFlexItem,
  EuiOverlayMask,
  EuiPanel,
  EuiSmallButton,
  EuiSpacer,
  EuiText,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { CoreStart } from 'opensearch-dashboards/public';
import { MemoryRouter } from 'react-router-dom';
import { MainApp } from './application';
import { DevToolApp } from './dev_tool';
import { DevToolsSetupDependencies } from './plugin';
import './dev_tools_icon.scss';

export function DevToolsIcon({
  core,
  devTools,
  deps,
  title,
}: {
  core: CoreStart;
  devTools: readonly DevToolApp[];
  deps: DevToolsSetupDependencies;
  title: string;
}) {
  const [modalVisible, setModalVisible] = useState(false);
  const elementRef = useRef<HTMLDivElement | null>(null);
  const setMountPoint = useCallback((renderFn) => {
    renderFn(elementRef.current);
    return () => {};
  }, []);

  useEffect(() => {
    if (modalVisible) {
      document.body.classList.add('noScrollByDevTools');
    } else {
      document.body.classList.remove('noScrollByDevTools');
    }

    return () => {
      document.body.classList.remove('noScrollByDevTools');
    };
  }, [modalVisible]);

  return (
    <>
      <EuiButtonIcon
        aria-label="go-to-dev-tools"
        iconType="consoleApp"
        onClick={() => {
          setModalVisible(true);
        }}
      />
      {modalVisible ? (
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
            <EuiPanel
              className="eui-fullHeight"
              paddingSize="none"
              hasBorder={false}
              hasShadow={false}
            >
              <EuiFlexGroup direction="column" className="eui-fullHeight devToolsModalContent">
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
                    RouterComponent={MemoryRouter}
                  />
                  <EuiSpacer size="s" />
                  <EuiSmallButton
                    iconType="cross"
                    iconGap="s"
                    fullWidth={false}
                    onClick={() => setModalVisible(false)}
                    className="devToolsCloseButton"
                    minWidth="unset"
                  >
                    {i18n.translate('dev_tools.modal.close.label', {
                      defaultMessage: 'Close',
                    })}
                  </EuiSmallButton>
                </EuiFlexItem>
              </EuiFlexGroup>
            </EuiPanel>
          </div>
        </EuiOverlayMask>
      ) : null}
    </>
  );
}

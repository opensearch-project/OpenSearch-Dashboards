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
  EuiToolTip,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { CoreStart } from 'opensearch-dashboards/public';
import { MemoryRouter } from 'react-router-dom';
import { MainApp } from './application';
import { DevToolApp } from './dev_tool';
import { DEVTOOL_OPEN_ACTION, DevToolsSetupDependencies, devToolsTrigger } from './plugin';
import './dev_tools_icon.scss';
import { createAction } from '../../ui_actions/public';

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

  const [devToolTab, setDevToolTab] = useState('');

  const createOpenDevToolAction = createAction<typeof DEVTOOL_OPEN_ACTION>({
    type: DEVTOOL_OPEN_ACTION,
    getDisplayName: () => 'Open DevTools',
    execute: async ({ defaultRoute }) => {
      setModalVisible(true);
      setDevToolTab(defaultRoute);
    },
  });

  deps.uiActions.addTriggerAction(devToolsTrigger.id, createOpenDevToolAction);

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

  const closeModalVisible = () => {
    setModalVisible(false);
  };

  return (
    <>
      <EuiToolTip
        content={i18n.translate('devTools.icon.nav.title', {
          defaultMessage: 'Developer tools',
        })}
      >
        <EuiButtonIcon
          aria-label="go-to-dev-tools"
          iconType="consoleApp"
          data-test-subj="openDevToolsModal"
          onClick={() => {
            setModalVisible(true);
          }}
          color="text"
        />
      </EuiToolTip>
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
              aria-label="close modal"
            />
            <EuiPanel
              className="eui-fullHeight"
              paddingSize="none"
              hasBorder={false}
              hasShadow={false}
            >
              <EuiFlexGroup direction="column" className="eui-fullHeight devToolsModalContent">
                <EuiFlexItem grow={false}>
                  <EuiSpacer size="m" />
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
                    defaultRoute={devToolTab}
                    onManageDataSource={closeModalVisible}
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
                    {i18n.translate('devTools.modal.close.label', {
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

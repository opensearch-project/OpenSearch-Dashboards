/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useRef, useCallback, useState, useEffect, useMemo } from 'react';
import {
  EuiButtonIcon,
  EuiFlexGroup,
  EuiFlexItem,
  EuiOverlayMask,
  EuiPanel,
  EuiPopover,
  EuiPopoverTitle,
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
  useRailPopover = false,
}: {
  core: CoreStart;
  devTools: readonly DevToolApp[];
  deps: DevToolsSetupDependencies;
  title: string;
  /**
   * When true (the collapsed icon-side-nav rail footer), show the rail-style
   * hover popover that connects flush to the rail. When false (the expanded
   * footer and the classic nav), show a plain tooltip instead.
   */
  useRailPopover?: boolean;
}) {
  const [modalVisible, setModalVisible] = useState(false);
  const [devToolTab, setDevToolTab] = useState('');
  const [sidecarPaddingRight, setSidecarPaddingRight] = useState('0px');
  // Hover popover (matches the icon side nav's title-only popover instead of a
  // plain EUI tooltip, so the dev-tools footer icon reads consistently with the
  // rest of the rail).
  const [isLabelOpen, setIsLabelOpen] = useState(false);
  const labelCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const openLabel = useCallback(() => {
    if (labelCloseTimer.current) clearTimeout(labelCloseTimer.current);
    setIsLabelOpen(true);
  }, []);
  const scheduleCloseLabel = useCallback(() => {
    if (labelCloseTimer.current) clearTimeout(labelCloseTimer.current);
    labelCloseTimer.current = setTimeout(() => setIsLabelOpen(false), 150);
  }, []);
  useEffect(() => () => labelCloseTimer.current && clearTimeout(labelCloseTimer.current), []);

  const devToolsLabel = i18n.translate('devTools.icon.nav.title', {
    defaultMessage: 'Developer tools',
  });

  useEffect(() => {
    const subscription = core.overlays.sidecar.getSidecarConfig$().subscribe((config) => {
      setSidecarPaddingRight(
        config?.dockedMode === 'right' && !config.isHidden ? `${config.paddingSize}px` : '0px'
      );
    });
    return () => subscription.unsubscribe();
  }, [core.overlays.sidecar]);

  // Use refs to avoid closure issues
  const modalVisibleRef = useRef(modalVisible);
  const setModalVisibleRef = useRef(setModalVisible);

  // Update refs when state changes
  modalVisibleRef.current = modalVisible;
  setModalVisibleRef.current = setModalVisible;

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
  // @ts-expect-error TS7006 TODO(ts-error): fixme
  const setMountPoint = useCallback((renderFn) => {
    renderFn(elementRef.current);
    return () => {};
  }, []);

  const closeModal = useCallback(() => {
    setModalVisibleRef.current(false);
  }, []);

  useEffect(() => {
    if (modalVisible) {
      document.body.classList.add('noScrollByDevTools');

      // Register ESC shortcut only when modal is open
      if (core.keyboardShortcut) {
        core.keyboardShortcut.register({
          id: 'close_dev_tools_modal',
          pluginId: 'dev_tools',
          name: i18n.translate('devTools.keyboardShortcut.closeModal.name', {
            defaultMessage: 'Close dev tools modal',
          }),
          category: i18n.translate('devTools.keyboardShortcut.category.navigation', {
            defaultMessage: 'Navigation',
          }),
          keys: 'escape',
          execute: closeModal,
        });
      }
    } else {
      document.body.classList.remove('noScrollByDevTools');
    }

    return () => {
      document.body.classList.remove('noScrollByDevTools');

      // Unregister ESC shortcut when modal closes or component unmounts
      if (core.keyboardShortcut) {
        core.keyboardShortcut.unregister({
          id: 'close_dev_tools_modal',
          pluginId: 'dev_tools',
        });
      }
    };
  }, [modalVisible, core.keyboardShortcut, closeModal]);

  const closeModalVisible = useCallback(() => {
    setModalVisible(false);
  }, []);

  const memoizedMainApp = useMemo(
    () => (
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
    ),
    [
      devTools,
      core.savedObjects,
      core.notifications,
      deps.dataSource,
      deps.dataSourceManagement,
      setMountPoint,
      devToolTab,
      closeModalVisible,
    ]
  );

  const devToolsButton = (
    <EuiButtonIcon
      aria-label={devToolsLabel}
      iconType="consoleApp"
      data-test-subj="openDevToolsModal"
      onClick={() => {
        setIsLabelOpen(false);
        setModalVisible(true);
      }}
      color="text"
    />
  );

  return (
    <>
      {useRailPopover ? (
        <EuiPopover
          anchorPosition="rightUp"
          hasArrow={false}
          offset={0}
          ownFocus={false}
          initialFocus={false}
          panelPaddingSize="none"
          panelClassName="obsNavPopover-panel obsNavPopover-panel--rail"
          display="block"
          isOpen={isLabelOpen}
          closePopover={() => setIsLabelOpen(false)}
          button={
            // Match the collapsed nav icon's anchor geometry: a full-rail-width
            // (48px) centered wrapper so EUI's rightUp popover anchors from the
            // rail's right edge — exactly like the nav leaf icons. This lets the
            // shared `obsNavPopover-panel--rail` calibration land the panel flush
            // and connected (same as Topology Map), instead of floating detached.
            <span
              className={`devToolsNavAnchor${isLabelOpen ? ' devToolsNavAnchor--open' : ''}`}
              onMouseEnter={openLabel}
              onMouseLeave={scheduleCloseLabel}
            >
              {devToolsButton}
            </span>
          }
          panelProps={{ onMouseEnter: openLabel, onMouseLeave: scheduleCloseLabel }}
        >
          <div
            className="obsNavPopover obsNavPopover--titleOnly"
            data-test-subj="devToolsNavPopover"
          >
            <EuiPopoverTitle paddingSize="s">{devToolsLabel}</EuiPopoverTitle>
          </div>
        </EuiPopover>
      ) : (
        // Expanded footer + classic nav: a plain tooltip reads correctly here;
        // the rail-flush popover is only for the collapsed icon rail.
        <EuiToolTip content={devToolsLabel} position="right">
          {devToolsButton}
        </EuiToolTip>
      )}
      {modalVisible ? (
        /**
         * We can not use OuiModal component here because OuiModal uses OuiOverlayMask as its parent node
         * but overlay mask has a default padding bottom that prevent the modal from covering the whole page.
         */
        <EuiOverlayMask className="devToolsOverlayMask" headerZindexLocation="below">
          <div
            style={{
              width: '100vw',
              height: '100vh',
              maxWidth: '100vw',
              marginRight: sidecarPaddingRight,
              position: 'relative',
            }}
          >
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
                  {memoizedMainApp}
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

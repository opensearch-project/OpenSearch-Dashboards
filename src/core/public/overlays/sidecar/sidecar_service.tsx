/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
/* eslint-disable max-classes-per-file */

import React from 'react';
import { render, unmountComponentAtNode } from 'react-dom';
import { BehaviorSubject, Observable, ReplaySubject, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { I18nStart } from '../../i18n';
import { MountPoint } from '../../types';
import { OverlayRef } from '../types';
import { Sidecar } from './components/sidecar';
/**
 * A SidecarRef is a reference to an opened sidecar panel. It offers methods to
 * close the sidecar panel again. If you open a sidecar panel you should make
 * sure you call `close()` when it should be closed.
 * Since a sidecar could also be closed by a user or from another sidecar being
 * opened, you must bind to the `onClose` Promise on the Sidecar instance.
 * The Promise will resolve whenever the sidecar was closed at which point you
 * should discard the SidecarRef.
 *
 * @public
 */
class SidecarRef implements OverlayRef {
  /**
   * An Promise that will resolve once this sidecar is closed.
   *
   * Sidecars can close from user interaction, calling `close()` on the sidecar
   * reference or another call to `open()` replacing your sidecar.
   */
  public readonly onClose: Promise<void>;

  private closeSubject = new Subject<void>();

  constructor() {
    this.onClose = this.closeSubject.toPromise();
  }

  /**
   * Closes the referenced sidecar if it's still open which in turn will
   * resolve the `onClose` Promise. If the sidecar had already been
   * closed this method does nothing.
   */
  public close(): Promise<void> {
    if (!this.closeSubject.closed) {
      this.closeSubject.next();
      this.closeSubject.complete();
    }
    return this.onClose;
  }
}

/**
 * APIs to open and manage sidecar.
 *
 * @public
 */
export interface OverlaySidecarStart {
  /**
   * Opens a sidecar panel with the given mount point inside. You can use
   * `close()` on the returned SidecarRef to close the sidecar.
   *
   * @param mount {@link MountPoint} - Mounts the children inside a sidecar panel
   * @param options {@link OverlaySidecarOpenOptions} - options for the sidecar
   * @return {@link SidecarRef} A reference to the opened sidecar panel.
   */
  open(mount: MountPoint, options: OverlaySidecarOpenOptions): SidecarRef;

  /**
   * Override the default support config
   * @param config The updated support config
   */
  setSidecarConfig(config: Partial<ISidecarConfig>): void;

  /**
   * Get an observable of the current locked state of the nav drawer.
   */
  getSidecarConfig$(): Observable<ISidecarConfig | undefined>;

  /**
   * Hide side car.
   */
  hide: () => void;

  /**
   * Show side car.
   */
  show: () => void;
}

/**
 * @public
 */
export interface OverlaySidecarOpenOptions {
  className?: string;
  'data-test-subj'?: string;
  config: ISidecarConfig;
}

interface StartDeps {
  i18n: I18nStart;
  targetDomElement: Element | null;
}

export enum SIDECAR_DOCKED_MODE {
  LEFT = 'left',
  RIGHT = 'right',
  TAKEOVER = 'takeover',
}
export interface ISidecarConfig {
  // takeover mode will docked to bottom
  dockedMode: SIDECAR_DOCKED_MODE;
  paddingSize: number;
  isHidden?: boolean;
}

/** @internal */
export class SidecarService {
  private activeSidecar: SidecarRef | null = null;
  private targetDomElement: Element | null = null;
  private readonly stop$ = new ReplaySubject(1);

  public start({ i18n, targetDomElement }: StartDeps): OverlaySidecarStart {
    this.targetDomElement = targetDomElement;
    const sidecarConfig$ = new BehaviorSubject<ISidecarConfig | undefined>(undefined);
    const getSidecarConfig$ = () => sidecarConfig$.pipe(takeUntil(this.stop$));

    const setSidecarConfig = (config: Partial<ISidecarConfig>) => {
      if (
        sidecarConfig$.value ||
        // init
        (!sidecarConfig$.value && config.dockedMode && config.paddingSize)
      ) {
        sidecarConfig$.next({ ...sidecarConfig$.value, ...config } as ISidecarConfig);
      }
    };

    return {
      getSidecarConfig$,
      setSidecarConfig,
      open: (mount: MountPoint, options: OverlaySidecarOpenOptions): SidecarRef => {
        // If there is an active flyout session close it before opening a new one.
        if (this.activeSidecar) {
          setSidecarConfig({ paddingSize: 0 });
          this.activeSidecar.close();
          this.cleanupDom();
        }

        const sidecar = new SidecarRef();
        setSidecarConfig(options.config);

        // If a sidecar gets closed through it's SidecarRef, remove it from the dom
        sidecar.onClose.then(() => {
          if (this.activeSidecar === sidecar) {
            this.cleanupDom();
          }
        });

        this.activeSidecar = sidecar;

        render(
          <Sidecar
            sidecarConfig$={sidecarConfig$}
            setSidecarConfig={setSidecarConfig}
            options={options}
            i18n={i18n}
            mount={mount}
          />,
          this.targetDomElement
        );

        return sidecar;
      },
      hide: () => {
        setSidecarConfig({ isHidden: true });
      },
      show: () => {
        setSidecarConfig({ isHidden: false });
      },
    };
  }

  /**
   * When using React.render to re-render content into a target DOM element, it replaces
   * the content without invoking unmountComponentAtNode on any components within the target
   * or their children. To avoid potential subtle bugs in child components that rely on
   * unmounting for cleanup behavior, this function ensures proper cleanup of the DOM.
   */
  private cleanupDom(): void {
    if (this.targetDomElement != null) {
      unmountComponentAtNode(this.targetDomElement);
      this.targetDomElement.innerHTML = '';
    }
    this.activeSidecar = null;
  }
}

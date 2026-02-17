/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject, Observable } from 'rxjs';

/**
 * Chat screenshot button configuration
 */
export interface ChatScreenshotButton {
  /**
   * Button label/title
   */
  title: string;
  /**
   * Button icon type
   */
  iconType: string;
  /**
   * Whether the button is enabled
   */
  enabled?: boolean;
}

/**
 * Chat screenshot service interface
 */
export interface ChatScreenshotServiceInterface {
  /**
   * Check if screenshot feature is enabled
   */
  isEnabled(): boolean;

  /**
   * Get screenshot feature enabled observable
   */
  getEnabled$(): Observable<boolean>;

  /**
   * Set screenshot feature enabled state
   */
  setEnabled(enabled: boolean): void;

  /**
   * Set the DOM element to capture
   */
  setPageContainerElement(element: HTMLElement | undefined): void;

  /**
   * Get the current page container element
   */
  getPageContainerElement(): HTMLElement | undefined;

  /**
   * Set custom screenshot button configuration
   */
  setScreenshotButton(button: ChatScreenshotButton): void;

  /**
   * Get current screenshot button configuration
   */
  getScreenshotButton(): ChatScreenshotButton;

  /**
   * Get screenshot button observable
   */
  getScreenshotButton$(): Observable<ChatScreenshotButton>;

  /**
   * Configure screenshot feature with enabled state and optional button customization
   */
  configure(config: { enabled: boolean; title?: string; iconType?: string }): void;
}

/**
 * Chat screenshot service implementation
 */
export class ChatScreenshotService implements ChatScreenshotServiceInterface {
  private enabled$ = new BehaviorSubject<boolean>(false);
  private pageContainerElement?: HTMLElement;
  private screenshotButton$ = new BehaviorSubject<ChatScreenshotButton>({
    title: 'Add dashboard screenshot',
    iconType: 'image',
    enabled: true,
  });

  constructor() {}

  public isEnabled(): boolean {
    return this.enabled$.getValue();
  }

  public getEnabled$(): Observable<boolean> {
    return this.enabled$.asObservable();
  }

  public setEnabled(enabled: boolean): void {
    this.enabled$.next(enabled);
  }

  public setPageContainerElement(element: HTMLElement | undefined): void {
    this.pageContainerElement = element;
  }

  public getPageContainerElement(): HTMLElement | undefined {
    return this.pageContainerElement;
  }

  public setScreenshotButton(button: ChatScreenshotButton): void {
    this.screenshotButton$.next({
      ...this.screenshotButton$.getValue(),
      ...button,
    });
  }

  public getScreenshotButton(): ChatScreenshotButton {
    return this.screenshotButton$.getValue();
  }

  public getScreenshotButton$(): Observable<ChatScreenshotButton> {
    return this.screenshotButton$.asObservable();
  }

  public configure(config: { enabled: boolean; title?: string; iconType?: string }): void {
    // Update enabled state
    this.enabled$.next(config.enabled);

    // Update button configuration if title or iconType provided
    if (config.title !== undefined || config.iconType !== undefined) {
      const currentButton = this.screenshotButton$.getValue();
      this.screenshotButton$.next({
        ...currentButton,
        ...(config.title !== undefined && { title: config.title }),
        ...(config.iconType !== undefined && { iconType: config.iconType }),
      });
    }
  }

  public stop(): void {
    this.pageContainerElement = undefined;
    this.enabled$.complete();
    this.screenshotButton$.complete();
  }
}

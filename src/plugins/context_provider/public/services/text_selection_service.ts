/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint-disable no-console */

import { BehaviorSubject, Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { TextSelectionContext } from '../types';

export interface TextSelectionEvent {
  type: 'selection' | 'clear';
  context?: TextSelectionContext;
}

/**
 * Service for monitoring text selection events across the entire application
 * Captures selected text and context metadata for use as dynamic context
 */
export class TextSelectionService {
  private static readonly DEBOUNCE_TIME = 500; // Wait 500ms after selection stops changing
  private static readonly MIN_SELECTION_LENGTH = 3; // Minimum characters to consider

  private selectionSubject$ = new BehaviorSubject<TextSelectionEvent>({ type: 'clear' });
  private currentSelection: TextSelectionContext | null = null;
  private isInitialized = false;

  public start(): void {
    if (this.isInitialized) {
      console.warn('⚠️ TextSelectionService: Already initialized');
      return;
    }

    console.log('🎯 TextSelectionService: Starting text selection monitoring');
    this.setupSelectionListeners();
    this.isInitialized = true;
  }

  public stop(): void {
    if (!this.isInitialized) {
      return;
    }

    console.log('🛑 TextSelectionService: Stopping text selection monitoring');
    this.removeSelectionListeners();
    this.isInitialized = false;
    this.currentSelection = null;
    this.selectionSubject$.next({ type: 'clear' });
  }

  /**
   * Get current text selection context
   */
  public getCurrentSelection(): TextSelectionContext | null {
    return this.currentSelection;
  }

  /**
   * Observable stream of text selection events
   */
  public getSelectionEvents$(): Observable<TextSelectionEvent> {
    return this.selectionSubject$.asObservable().pipe(
      debounceTime(TextSelectionService.DEBOUNCE_TIME),
      distinctUntilChanged((prev, curr) => {
        // Only emit if selection actually changed
        if (prev.type !== curr.type) return false;
        if (prev.type === 'clear' && curr.type === 'clear') return true;
        if (prev.type === 'selection' && curr.type === 'selection') {
          return prev.context?.selectedText === curr.context?.selectedText;
        }
        return false;
      })
    );
  }

  private setupSelectionListeners(): void {
    // Listen for mouseup events to detect text selection
    document.addEventListener('mouseup', this.handleSelectionChange, true);
    // Listen for keyup events to detect keyboard-based selection
    document.addEventListener('keyup', this.handleSelectionChange, true);
    // Listen for selection change events (more reliable in some browsers)
    document.addEventListener('selectionchange', this.handleSelectionChange, true);
  }

  private removeSelectionListeners(): void {
    document.removeEventListener('mouseup', this.handleSelectionChange, true);
    document.removeEventListener('keyup', this.handleSelectionChange, true);
    document.removeEventListener('selectionchange', this.handleSelectionChange, true);
  }

  private handleSelectionChange = (): void => {
    try {
      const selection = window.getSelection();

      if (!selection || selection.rangeCount === 0) {
        this.clearSelection();
        return;
      }

      const range = selection.getRangeAt(0);
      const selectedText = selection.toString().trim();

      // Clear selection if text is too short or empty
      if (!selectedText || selectedText.length < TextSelectionService.MIN_SELECTION_LENGTH) {
        this.clearSelection();
        return;
      }

      // Skip if selection hasn't changed
      if (this.currentSelection && this.currentSelection.selectedText === selectedText) {
        return;
      }

      const selectionContext = this.createSelectionContext(selectedText, range, selection);
      this.currentSelection = selectionContext;

      console.log('📝 TextSelectionService: Text selected:', {
        text: selectedText.substring(0, 100) + (selectedText.length > 100 ? '...' : ''),
        length: selectedText.length,
        context: selectionContext.contextMetadata,
      });

      this.selectionSubject$.next({
        type: 'selection',
        context: selectionContext,
      });
    } catch (error) {
      console.error('❌ TextSelectionService: Error handling selection change:', error);
      this.clearSelection();
    }
  };

  private clearSelection(): void {
    if (this.currentSelection) {
      console.log('🧹 TextSelectionService: Selection cleared');
      this.currentSelection = null;
      this.selectionSubject$.next({ type: 'clear' });
    }
  }

  private createSelectionContext(
    selectedText: string,
    range: Range,
    selection: Selection
  ): TextSelectionContext {
    // Get context about the element containing the selection
    const startContainer = range.startContainer;
    const parentElement =
      startContainer.nodeType === Node.TEXT_NODE
        ? startContainer.parentElement
        : (startContainer as Element);

    // Extract current app ID from URL
    const currentAppId = window.location.pathname.split('/app/')[1]?.split('/')[0];

    // Create selection range info
    const selectionRange = {
      startOffset: range.startOffset,
      endOffset: range.endOffset,
      startContainer: this.getNodeDescription(range.startContainer),
      endContainer: this.getNodeDescription(range.endContainer),
    };

    // Create context metadata
    const contextMetadata = {
      appId: currentAppId,
      url: window.location.href,
      pathname: window.location.pathname,
      elementTagName: parentElement?.tagName?.toLowerCase(),
      elementClass: parentElement?.className || undefined,
      elementId: parentElement?.id || undefined,
      elementTextContent: parentElement?.textContent?.substring(0, 200) || undefined,
    };

    return {
      selectedText,
      selectionRange,
      contextMetadata,
      timestamp: Date.now(),
    };
  }

  private getNodeDescription(node: Node): string {
    if (node.nodeType === Node.TEXT_NODE) {
      const parent = node.parentElement;
      return `TEXT_NODE in ${parent?.tagName?.toLowerCase() || 'unknown'}${
        parent?.className ? '.' + parent.className : ''
      }`;
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as Element;
      return `${element.tagName?.toLowerCase() || 'unknown'}${
        element.className ? '.' + element.className : ''
      }`;
    }
    return `NODE_TYPE_${node.nodeType}`;
  }
}

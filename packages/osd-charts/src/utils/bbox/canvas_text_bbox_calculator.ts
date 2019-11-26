import { BBox, BBoxCalculator, DEFAULT_EMPTY_BBOX } from './bbox_calculator';

export class CanvasTextBBoxCalculator implements BBoxCalculator {
  private attachedRoot: HTMLElement;
  private offscreenCanvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D | null;

  constructor(rootElement?: HTMLElement) {
    this.offscreenCanvas = document.createElement('canvas');
    this.offscreenCanvas.style.position = 'absolute';
    this.offscreenCanvas.style.top = '-99999px';
    this.offscreenCanvas.style.left = '-99999px';
    this.context = this.offscreenCanvas.getContext('2d');
    this.attachedRoot = rootElement || document.documentElement;
    this.attachedRoot.appendChild(this.offscreenCanvas);
  }
  compute(text: string, padding: number, fontSize = 16, fontFamily = 'Arial', lineHeight = 1, fontWeight = 400): BBox {
    if (!this.context) {
      return DEFAULT_EMPTY_BBOX;
    }
    // Padding should be at least one to avoid browser measureText inconsistencies
    if (padding < 1) {
      padding = 1;
    }
    this.context.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
    const measure = this.context.measureText(text);

    return {
      width: measure.width + padding,
      height: fontSize * lineHeight,
    };
  }
  destroy(): void {
    this.attachedRoot.removeChild(this.offscreenCanvas);
  }
}

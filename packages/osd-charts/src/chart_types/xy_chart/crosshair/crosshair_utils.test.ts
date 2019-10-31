import { getFinalTooltipPosition } from './crosshair_utils';

describe('Tooltip position', () => {
  const container = {
    width: 100,
    height: 100,
    top: 10,
    left: 10,
  };
  const tooltip = {
    width: 40,
    height: 30,
    top: 0,
    left: 0,
  };
  describe('horizontal rotated chart', () => {
    it('can position the tooltip on the top left corner', () => {
      const position = getFinalTooltipPosition(
        container,
        tooltip,
        {
          isRotatedHorizontal: true,
          vPosition: {
            bandHeight: 0,
            bandTop: 0,
          },
          hPosition: {
            bandWidth: 0,
            bandLeft: 10,
          },
        },
        5,
      );
      expect(position.left).toBe('25px');
      expect(position.top).toBe('10px');
    });
    it('can position the tooltip on the bottom left corner', () => {
      const position = getFinalTooltipPosition(
        container,
        tooltip,
        {
          isRotatedHorizontal: true,
          vPosition: {
            bandHeight: 0,
            bandTop: 90,
          },
          hPosition: {
            bandWidth: 0,
            bandLeft: 10,
          },
        },
        5,
      );
      expect(position.left).toBe('25px');
      expect(position.top).toBe('80px');
    });
    it('can position the tooltip on the top right corner', () => {
      const position = getFinalTooltipPosition(
        container,
        tooltip,
        {
          isRotatedHorizontal: true,
          vPosition: {
            bandHeight: 0,
            bandTop: 0,
          },
          hPosition: {
            bandWidth: 0,
            bandLeft: 100,
          },
        },
        5,
      );
      expect(position.left).toBe('65px');
      expect(position.top).toBe('10px');
    });
    it('can position the tooltip on the bottom right corner', () => {
      const position = getFinalTooltipPosition(
        container,
        tooltip,
        {
          isRotatedHorizontal: true,
          vPosition: {
            bandHeight: 0,
            bandTop: 90,
          },
          hPosition: {
            bandWidth: 0,
            bandLeft: 100,
          },
        },
        5,
      );
      expect(position.left).toBe('65px');
      expect(position.top).toBe('80px');
    });
  });
  describe('vertical rotated chart', () => {
    it('can position the tooltip on the top left corner', () => {
      const position = getFinalTooltipPosition(
        container,
        tooltip,
        {
          isRotatedHorizontal: false,
          vPosition: {
            bandHeight: 0,
            bandTop: 0,
          },
          hPosition: {
            bandWidth: 0,
            bandLeft: 10,
          },
        },
        5,
      );
      expect(position.left).toBe('20px');
      expect(position.top).toBe('15px');
    });
    it('can position the tooltip on the bottom left corner', () => {
      const position = getFinalTooltipPosition(
        container,
        tooltip,
        {
          isRotatedHorizontal: false,
          vPosition: {
            bandHeight: 0,
            bandTop: 90,
          },
          hPosition: {
            bandWidth: 0,
            bandLeft: 10,
          },
        },
        5,
      );
      expect(position.left).toBe('20px');
      expect(position.top).toBe('65px');
    });
    it('can position the tooltip on the top right corner', () => {
      const position = getFinalTooltipPosition(
        container,
        tooltip,
        {
          isRotatedHorizontal: false,
          vPosition: {
            bandHeight: 0,
            bandTop: 0,
          },
          hPosition: {
            bandWidth: 0,
            bandLeft: 100,
          },
        },
        5,
      );
      expect(position.left).toBe('70px');
      expect(position.top).toBe('15px');
    });
    it('can position the tooltip on the bottom right corner', () => {
      const position = getFinalTooltipPosition(
        container,
        tooltip,
        {
          isRotatedHorizontal: false,
          vPosition: {
            bandHeight: 0,
            bandTop: 90,
          },
          hPosition: {
            bandWidth: 0,
            bandLeft: 100,
          },
        },
        5,
      );
      expect(position.left).toBe('70px');
      expect(position.top).toBe('65px');
    });
  });
});

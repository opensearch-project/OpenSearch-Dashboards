import { getFinalTooltipPosition } from '../../../components/tooltip/utils';

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
          isRotated: false,
          y1: 0,
          y0: 0,
          x0: 10,
          x1: 10,
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
          isRotated: false,
          y0: 90,
          y1: 90,
          x0: 10,
          x1: 10,
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
          isRotated: false,
          y0: 0,
          y1: 0,
          x0: 100,
          x1: 100,
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
          isRotated: false,
          y0: 90,
          y1: 90,
          x0: 100,
          x1: 100,
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
          isRotated: true,
          y0: 0,
          y1: 0,
          x1: 10,
          x0: 10,
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
          isRotated: true,
          y0: 90,
          y1: 90,
          x1: 10,
          x0: 10,
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
          isRotated: true,
          y0: 0,
          y1: 0,
          x1: 100,
          x0: 100,
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
          isRotated: true,
          y0: 90,
          y1: 90,
          x1: 100,
          x0: 100,
        },
        5,
      );
      expect(position.left).toBe('70px');
      expect(position.top).toBe('65px');
    });
  });
});

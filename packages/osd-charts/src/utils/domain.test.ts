import { AccessorFn } from './accessor';
import {
  computeContinuousDataDomain,
  computeDomainExtent,
  computeOrdinalDataDomain,
  computeStackedContinuousDomain,
} from './domain';

describe('utils/domain', () => {
  test('should return [0] domain if no data', () => {
    const data: any[] = [];
    const accessor: AccessorFn = (datum: any) => datum.x;
    const isSorted = true;
    const removeNull = true;

    const ordinalDataDomain = computeOrdinalDataDomain(data, accessor, isSorted, removeNull);

    expect(ordinalDataDomain).toEqual([0]);
  });

  test('should compute ordinal data domain: sort & remove nulls', () => {
    const data = [{ x: 'd' }, { x: 'a' }, { x: null }, { x: 'b' }];
    const accessor: AccessorFn = (datum: any) => datum.x;
    const isSorted = true;
    const removeNull = true;

    const ordinalDataDomain = computeOrdinalDataDomain(data, accessor, isSorted, removeNull);

    const expectedOrdinalDomain = ['a', 'b', 'd'];

    expect(ordinalDataDomain).toEqual(expectedOrdinalDomain);
  });

  test('should compute ordinal data domain: unsorted and remove nulls', () => {
    const data = [{ x: 'd' }, { x: 'a' }, { x: null }, { x: 'b' }];
    const accessor: AccessorFn = (datum: any) => datum.x;
    const isSorted = false;
    const removeNull = true;

    const ordinalDataDomain = computeOrdinalDataDomain(data, accessor, isSorted, removeNull);

    const expectedOrdinalDomain = ['d', 'a', 'b'];

    expect(ordinalDataDomain).toEqual(expectedOrdinalDomain);
  });

  test('should compute ordinal data domain: sorted and keep nulls', () => {
    const data = [{ x: 'd' }, { x: 'a' }, { x: null }, { x: 'b' }];
    const accessor: AccessorFn = (datum: any) => datum.x;
    const isSorted = true;
    const removeNull = false;

    const ordinalDataDomain = computeOrdinalDataDomain(data, accessor, isSorted, removeNull);

    const expectedOrdinalDomain = ['a', 'b', 'd', null];

    expect(ordinalDataDomain).toEqual(expectedOrdinalDomain);
  });

  test('should compute ordinal data domain: unsorted and keep nulls', () => {
    const data = [{ x: 'd' }, { x: 'a' }, { x: null }, { x: 'b' }];
    const accessor: AccessorFn = (datum: any) => datum.x;
    const isSorted = false;
    const removeNull = false;

    const ordinalDataDomain = computeOrdinalDataDomain(data, accessor, isSorted, removeNull);

    const expectedOrdinalDomain = ['d', 'a', null, 'b'];

    expect(ordinalDataDomain).toEqual(expectedOrdinalDomain);
  });

  test('should compute continuous data domain: data scaled to extent', () => {
    const data = [{ x: 12 }, { x: 6 }, { x: 8 }];
    const accessor = (datum: any) => datum.x;
    const scaleToExtent = true;

    const continuousDataDomain = computeContinuousDataDomain(data, accessor, scaleToExtent);

    const expectedContinuousDomain = [6, 12];

    expect(continuousDataDomain).toEqual(expectedContinuousDomain);
  });

  test('should compute continuous data domain: data not scaled to extent', () => {
    const data = [{ x: 12 }, { x: 6 }, { x: 8 }];
    const accessor = (datum: any) => datum.x;

    const continuousDataDomain = computeContinuousDataDomain(data, accessor);

    const expectedContinuousDomain = [0, 12];

    expect(continuousDataDomain).toEqual(expectedContinuousDomain);
  });

  test('should compute continuous data domain: empty data not scaled to extent', () => {
    const data: any[] = [];
    const accessor = (datum: any) => datum.x;

    const continuousDataDomain = computeContinuousDataDomain(data, accessor);

    const expectedContinuousDomain = [0, 0];

    expect(continuousDataDomain).toEqual(expectedContinuousDomain);
  });

  test('should compute stacked data domain: data scaled to extent', () => {
    const data = [
      { y: 12, x: 'a' },
      { y: 6, x: 'b' },
      { y: 8, x: 'a' },
    ];
    const yAccessor: AccessorFn = (datum: any) => datum.y;
    const xAccessor: AccessorFn = (datum: any) => datum.x;
    const scaleToExtent = true;

    const stackedDataDomain = computeStackedContinuousDomain(data, xAccessor, yAccessor, scaleToExtent);

    const expectedStackedDomain = [6, 20];

    expect(stackedDataDomain).toEqual(expectedStackedDomain);
  });

  test('should compute stacked data domain: data not scaled to extent', () => {
    const data = [
      { y: 12, x: 'a' },
      { y: 6, x: 'b' },
      { y: 8, x: 'a' },
    ];
    const yAccessor: AccessorFn = (datum: any) => datum.y;
    const xAccessor: AccessorFn = (datum: any) => datum.x;

    const stackedDataDomain = computeStackedContinuousDomain(data, xAccessor, yAccessor);

    const expectedStackedDomain = [0, 20];

    expect(stackedDataDomain).toEqual(expectedStackedDomain);
  });

  describe('scaleToExtent', () => {
    describe('true', () => {
      it('should find domain when start & end are positive', () => {
        expect(computeDomainExtent([5, 10], true)).toEqual([5, 10]);
      });
      it('should find domain when start & end are negative', () => {
        expect(computeDomainExtent([-15, -10], true)).toEqual([-15, -10]);
      });
      it('should find domain when start is negative, end is positive', () => {
        expect(computeDomainExtent([-15, 10], true)).toEqual([-15, 10]);
      });
    });
    describe('false', () => {
      it('should find domain when start & end are positive', () => {
        expect(computeDomainExtent([5, 10], false)).toEqual([0, 10]);
      });
      it('should find domain when start & end are negative', () => {
        expect(computeDomainExtent([-15, -10], false)).toEqual([-15, 0]);
      });
      it('should find domain when start is negative, end is positive', () => {
        expect(computeDomainExtent([-15, 10], false)).toEqual([-15, 10]);
      });
    });
  });

  describe('fitToExtent', () => {
    it('should not effect domain when scaleToExtent is true', () => {
      expect(computeDomainExtent([5, 10], true)).toEqual([5, 10]);
    });

    describe('baseline far from zero', () => {
      it('should get domain from positive domain', () => {
        expect(computeDomainExtent([10, 70], false, true)).toEqual([5, 75]);
      });
      it('should get domain from positive & negative domain', () => {
        expect(computeDomainExtent([-30, 30], false, true)).toEqual([-35, 35]);
      });
      it('should get domain from negative domain', () => {
        expect(computeDomainExtent([-70, -10], false, true)).toEqual([-75, -5]);
      });
    });

    describe('baseline near zero', () => {
      it('should set min baseline as 0 if original domain is less than zero', () => {
        expect(computeDomainExtent([5, 65], false, true)).toEqual([0, 70]);
      });
      it('should set max baseline as 0 if original domain is less than zero', () => {
        expect(computeDomainExtent([-65, -5], false, true)).toEqual([-70, 0]);
      });
    });
  });
});

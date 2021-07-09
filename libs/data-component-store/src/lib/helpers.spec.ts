import { capitalize, removeTrailingSlashes } from './helpers';

describe('helpers', () => {
  describe('capitalize', () => {
    it('should capitalize the text', () => {
      expect(capitalize('rxMind')).toEqual('RxMind');
    });

    it('should return an empty string when the text is an empty string', () => {
      expect(capitalize('')).toEqual('');
    });
  });

  describe('removeTrailingSlashes', () => {
    it('should remove trailing slash from passed url', () => {
      expect(removeTrailingSlashes('/rx-mind/')).toBe('/rx-mind');
    });

    it('should remove trailing slashes from passed url', () => {
      expect(removeTrailingSlashes('/rx-mind///')).toBe('/rx-mind');
    });

    it('should return passed url if it does not contain trailing slashes', () => {
      expect(removeTrailingSlashes('/rx-mind')).toBe('/rx-mind');
    });
  });
});

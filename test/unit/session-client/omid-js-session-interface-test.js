goog.module('omid.test.sessionClient.OmidJsSessionInterface');

const OmidJsSessionInterface = goog.require('omid.sessionClient.OmidJsSessionInterface');
const VastProperties = goog.require('omid.common.VastProperties');
const {ErrorType, MediaEventType, VideoPosition} = goog.require('omid.common.constants');

/** @private {?OmidJsSessionInterface} */
let omidJsSessionInterface;

/** @private {?Window} */
let mockScope;

/** @private {?} */
let mockInterface;

describe('OmidJsSessionInterface', () => {
  describe('isSupported', () => {
    it('returns false when the interface root is not present', () => {
      const mockScopeWithoutInterfaceRoot = /** @type {!Window} */ ({});
      omidJsSessionInterface =
          new OmidJsSessionInterface(mockScopeWithoutInterfaceRoot);
      expect(omidJsSessionInterface.isSupported()).toBe(false);
    });
    it('returns true when the interface root is present', () => {
      const mockScopeWithInterfaceRoot = /** @type {!Window} */ ({
        'omidSessionInterface': {},
      });
      omidJsSessionInterface =
          new OmidJsSessionInterface(mockScopeWithInterfaceRoot);
      expect(omidJsSessionInterface.isSupported()).toBe(true);
    });
  });
  describe('sendMessage', () => {
    beforeEach(() => {
      const mockMediaEvents = {};
      for (const mediaEventType in MediaEventType) {
        const mediaEventName = MediaEventType[mediaEventType];
        mockMediaEvents[mediaEventName] = jasmine.createSpy(mediaEventName);
      }
      mockInterface = {
        'registerSessionObserver': jasmine.createSpy('registerSessionObserver'),
        'reportError': jasmine.createSpy('reportError'),
        'adEvents': {
          'impressionOccurred': jasmine.createSpy('impressionOccurred'),
        },
        'mediaEvents': mockMediaEvents,
      };
      mockScope = /** @type {!Window} */ ({
        'omidSessionInterface': mockInterface,
      });
      omidJsSessionInterface = new OmidJsSessionInterface(mockScope);
    });
    it(`uses registerSessionObserver's callback as an argument`, () => {
      const callback = (...args) => {};
      omidJsSessionInterface.sendMessage(
          'registerSessionObserver', callback, []);
      expect(mockInterface['registerSessionObserver']).toHaveBeenCalledWith(
          callback);
    });
    it('maps sessionError to reportError', () => {
      omidJsSessionInterface.sendMessage('sessionError', null,
          [ErrorType.VIDEO, 'Could not load video.']);
      expect(mockInterface['reportError']).toHaveBeenCalledWith(
          ErrorType.VIDEO, 'Could not load video.');
    });
    it('routes mediaEvents to the mediaEvents node', () => {
      const vastProperties = new VastProperties(
        /* isSkippable= */false, /* skipOffset= */ 0, /* isAutoPlay= */ false,
        VideoPosition.PREROLL);
      omidJsSessionInterface.sendMessage('loaded', null, [vastProperties]);
      expect(mockInterface['mediaEvents']['loaded'])
          .toHaveBeenCalledWith(vastProperties);
    });
    it('routes adEvents to the adEvents node', () => {
      omidJsSessionInterface.sendMessage('impressionOccurred', null, []);
      expect(mockInterface['adEvents']['impressionOccurred'])
          .toHaveBeenCalled();
    });
    it('throws for an unrecognized message', () => {
      const sendUnknownMessage = () => {
        omidJsSessionInterface.sendMessage('unknownMessage', null, []);
      };
      expect(sendUnknownMessage).toThrow();
    });
  });
});

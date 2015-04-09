/// <reference path="bower_components/DefinitelyTyped/jasmine/jasmine.d.ts" />
/// <reference path="exceptionless.ts" />

module Exceptionless {
  describe('ExceptionlessClient', function () {
    it('disable the client with null api key', function () {
      var client = new ExceptionlessClient(null);
      expect(client.config).not.toBe(null);
      expect(client.config.apiKey).toBe(null);
      expect(client.config.enabled).toBe(false);
    });

    it('should set the api key and enabled to true', function () {
      var client = new ExceptionlessClient('LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw');
      expect(client.config).not.toBe(null);
      expect(client.config.apiKey).toBe('LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw');
      expect(client.config.enabled).toBe(true);
    });

    it('apply client configuration', function () {
      var client = new ExceptionlessClient(null);
      expect(client.config).not.toBe(null);
      expect(client.config.apiKey).toBe(null);
      expect(client.config.enabled).toBe(false);

      client.config.setApiKey('LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw');
      expect(client.config.apiKey).toBe('LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw');
      expect(client.config.enabled).toBe(true);
    });
  });

  describe('EventQueue', function () {
    it('should enqueue event', function () {
      var config = new Configuration('LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw');
    });

    it('should process queue', function () {
      var config = new Configuration('LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw');
    });

    it('should suspend processing', function () {
      var config = new Configuration('LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw');
    });
  });

  describe('SubmissionClient', function () {
    it('should submit events', function () {
      var config = new Configuration('LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw');
    });

    it('should submit user description', function () {
      var config = new Configuration('LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw');
    });

    it('should get project settings', function () {
      var config = new Configuration('LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw');
    });
  });

  describe('Storage', function () {
  it('should save events', function () {
    var config = new Configuration('LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw');
  });

  it('should get saved events', function () {
    var config = new Configuration('LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw');
  });

  it('should clear all events', function () {
    var config = new Configuration('LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw');
  });
});
}

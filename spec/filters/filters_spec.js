/*globals describe, it, expect, beforeEach, inject */
describe('insider', function () {
  beforeEach(function () {
    module('insider');
  });

  it('has a gravatar filter', inject(function ($filter) {
    expect($filter('gravatar')).not.toBeNull();
  }));

  describe('gravatarFilter', function () {
    beforeEach(function () {
      module('insider.filters');
    });

    it('should return a gravatar url', inject(function(gravatarFilter) {
      expect(gravatarFilter('cjavilla@gmail.com'))
        .toEqual("http://www.gravatar.com/avatar/8d86681ad6ec3a97871c60e3f2e51c0e");
    }));
  });
});

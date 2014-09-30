/*globals angular */

var app = angular.module('insider');
angular.module('insider.filters', [])
.filter('gravatar', function () {
  return function (email) {
    return "http://www.gravatar.com/avatar/" + md5(email);
  };
});

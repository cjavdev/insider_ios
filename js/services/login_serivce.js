/*globals angular, _ */
angular.module('insider.services')
  .factory('LoginService', function(loc, $http) {
    function url() {
      return loc.apiBase + '/api/v2/session';
    }

    return {
      login: function (userParams) {
        return $http.post(url(), userParams);
      }
    };
  });

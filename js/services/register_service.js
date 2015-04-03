/*globals angular, _ */
angular.module('insider.services')
  .factory('RegisterService', function(loc, $http) {
    function url() {
      return loc.apiBase + '/api/v2/users';
    }

    return {
      register: function (userParams) {
        userParams.platform = 'ios';
        return $http.post(url(), userParams);
      }
    };
  });

/*globals angular, _ */
angular.module('insider.services')
  .factory('SettingsService', function($q, $http, AuthService, loc) {
    function url() {
      return loc.apiBase + '/api/v1/setting';
    }

    var set = function (key, value) {
      var params = {};
      params[key] = value;

      var deferred = $q.defer();
      $http.put(url(), params).then(function (resp) {
        AuthService.saveUser(resp.data.user);
        deferred.resolve(resp.data);
      }, function (resp) {
        deferred.reject(resp.data);
      });

      return deferred.promise;
    };

    var toggleSetting = function (key) {
      var start = AuthService.currentUser()[key];
      return set(key, !start);
    };

    return {
      set: set,
      toggleSetting: toggleSetting
    };
  });

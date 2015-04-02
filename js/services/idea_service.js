/*globals angular, _ */
angular.module('insider.services')
  .factory('BuyIdeaService', function(loc, $q, $http) {
    function url(id) {
      if(id) {
        return loc.apiBase + '/api/v2/buys/' + id + '.json';
      }
      return loc.apiBase + '/api/v2/buys.json';
    }

    return {
      findAll: function () {
        var deferred = $q.defer();
        $http.get(url(), { cache: true })
          .then(function (resp) {
            deferred.resolve(resp.data);
          }, function (resp) {
            deferred.reject(resp.data);
          });
        return deferred.promise;
      },

      findById: function (id) {
        var deferred = $q.defer();
        $http.get(url(id), { cache: true })
          .then(function (resp) {
            deferred.resolve(resp.data);
          }, function (resp) {
            deferred.reject(resp.data);
          });
        return deferred.promise;
      },

      findTodays: function () {
        var deferred = $q.defer();
        $http.get(url(), { params: { 'today': true }, cache: true })
          .then(function (resp) {
            deferred.resolve(resp.data);
          });
        return deferred.promise;
      }
    };
  });

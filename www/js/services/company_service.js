/*globals angular, _ */
angular.module('insider.services')
  .factory('CompanyService', function(loc, $q, $http) {
    function url(id) {
     if(id) {
        return loc.apiBase + '/api/v1/companies/' + id + '.json';
      }
      return loc.apiBase + '/api/v1/companies.json';
    }

    return {
      findById: function (id) {
        var deferred = $q.defer();
        $http.get(url(id)).then(function (resp) {
          deferred.resolve(resp.data);
        }, function (resp) {
          deferred.reject(resp.data);
        });
        return deferred.promise;
      },
    };
  });


/*globals angular, _ */

var app = angular.module('insider');
angular.module('insider.services', [])
  .factory('BuyIdeaService', function($q, $http) {
    var ideas = [
      { id: 1, ticker: 'AAPL', market_cap: '500B', holdings_change: 43 },
      { id: 2, ticker: 'GOOG', market_cap: '600B', holdings_change: 43 }
    ];

    function url(id) {
      if(id) {
        return app.config.apiBase + '/api/v1/buys/' + id + '.json';
      }
      return app.config.apiBase + '/api/v1/buys.json';
    }

    return {
      findAll: function () {
        var deferred = $q.defer();
        $http.get(url()).then(function (resp) {
          deferred.resolve(resp.data);
        }, function (resp) {
          deferred.reject(resp.data);
        });
        return deferred.promise;
      },

      findById: function (id) {
        var deferred = $q.defer();
        $http.get(url(id)).then(function (resp) {
          deferred.resolve(resp.data);
        }, function (resp) {
          deferred.reject(resp.data);
        });
        return deferred.promise;
      },

      findTodays: function () {
        var deferred = $q.defer();
        $http.get(url(), { params: { 'today': true } }).then(function (resp) {
          deferred.resolve(resp.data);
        });
        return deferred.promise;
      },

      findCurrent: function () {
        var deferred = $q.defer();
        deferred.resolve(ideas);
        return deferred.promise;
      },
    };
  });

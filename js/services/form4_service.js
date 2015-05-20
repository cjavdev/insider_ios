/*globals angular, _ */
angular.module('insider.services')
  .factory('Form4Service', function(loc, $q, $http) {
    function url(id) {
     if(id) {
        return loc.apiBase + '/api/v1/form4s/' + id + '.json';
      }
      return loc.apiBase + '/api/v1/form4s.json';
    }

    function uri(id) {
     if(id) {
        return loc.apiBase + '/api/v2/form4s/' + id + '.json';
      }
      return loc.apiBase + '/api/v2/form4s.json';
    }

    return {
      findById: function (id) {
        var deferred = $q.defer();
        $http.get(url(id)).then(function (resp) {
          var filing = resp.data;
          var doc = JSON.parse(resp.data.filing);
          filing.nonDerivativeTransactions = doc.transactions;
          filing.derivativeTransactions = doc.derivative_transactions;
          deferred.resolve(filing);
        }, function (resp) {
          deferred.reject(resp.data);
        });
        return deferred.promise;
      },

      allToday: function (offset) {
        var deferred = $q.defer();
        var seen = {};
        $http.get(uri() + "?today=true&offset=" + offset).then(function (resp) {
          var pureResult = [];
          resp.data.forEach(function (filing) {
            var key = filing.insider_name + filing.company_id + filing.insider_id;
            if(!seen[key]) {
              pureResult.push(filing);
              seen[key] = true;
            }
          });

          deferred.resolve(pureResult);
        }, function (resp) {
          deferred.reject(resp.data);
        });
        return deferred.promise;
      }
    };
  });

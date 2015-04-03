/*globals angular, _ */
angular.module('insider.services')
  .factory('SubscribeService', function(loc, $http, $storekit) {
    function url() {
      return loc.apiBase + '/api/v2/subscriptions';
    }

    return {
      subscribe: function (product) {
        $storekit.purchase(product.id);
        return $http.post(url(), {
          product_name: product.id,
          price: product.price
        });
      }
    };
  });

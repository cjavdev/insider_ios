/*globals angular, window, document */
angular.module('insider.controllers', [])
  .controller('AppCtrl', function($timeout, $ionicLoading, $q, $scope, $ionicModal, $rootScope, $storekit) {
    $storekit
      .watchPurchases()
      .then(function() {
        // Not currently used
      }, function(error) {
        // An error occured. Show a message to the user
      }, function(purchase) {
        if (purchase.productId === 'com.insiderai.ios.insideralerts1') {
          if (purchase.type === 'purchase') {
            console.log('purchased!');
            // Your product was purchased
          } else if (purchase.type === 'restore') {
            // Your product was restored
            console.log('restored!');
          }
          console.log(purchase.transactionId);
          console.log(purchase.productId);
          console.log(purchase.transactionReceipt);
        }
      });


    $scope.retryWithPromise = function(promise, args, maxTries, context, deferred) {
      deferred = deferred || $q.defer();
      context = context || null;

      $scope.loading = true;
      $ionicLoading.show({
        template: "<i class='ion-loading-d'></i>"
      });

      promise.apply(context, args)
        .then(function(d) {
          $scope.loading = false;
          $ionicLoading.hide();
          return deferred.resolve(d);
        }, function(err) {
          if (maxTries === -1 || err.status == 401 || err.status == 403) {
            $ionicLoading.hide();
            $scope.loading = false;
            return deferred.reject(err);
          } else {
            $timeout(function() {
              $scope.retryWithPromise(promise, args, maxTries - 1, context, deferred);
            }, 2000);
          }
        });
      return deferred.promise;
    };

    $scope.retryWithPromisePullToRefresh = function(promise, args, maxTries, context, deferred) {
      deferred = deferred || $q.defer();
      context = context || null;

      $scope.loading = true;
      promise.apply(context, args)
        .then(function(d) {
          $scope.loading = false;
          $scope.$broadcast('scroll.refreshComplete');
          return deferred.resolve(d);
        }, function(err) {
          if (maxTries === -1 || err.status == 401 || err.status == 403) {
            $scope.$broadcast('scroll.refreshComplete');
            $scope.loading = false;
            return deferred.reject(err);
          } else {
            $timeout(function() {
              $scope.retryWithPromise(promise, args, maxTries - 1, context, deferred);
            }, 2000);
          }
        });
      return deferred.promise;
    };
  });

/*globals angular, window */
 angular.module('insider.controllers')
  .controller('BuysCtrl', function ($state, $scope, BuyIdeaService, $ionicLoading) {
    $scope.fetchAttempts = 0;

    $scope.refresh = function () {
      $scope.loading = true;
      $ionicLoading.show({
        template: "<i class='ion-loading-d'></i>"
      });
      BuyIdeaService.findAll().then(function (trades) {
        $scope.trades = trades;
        $scope.loading = false;
        $ionicLoading.hide();
      }, function () {
        if($scope.fetchAttempts < 3) {
          console.log('trying to fetch all again in 2 seconds');
          setTimeout(function () {
            $scope.refresh();
          }, 2000);
          $scope.fetchAttempts++;
        } else {
          console.log('giving up...');
          $scope.trades = [];
          $ionicLoading.hide();
        }
      });
    };
    $scope.refresh();

    $scope.showTrade = function (id) {
      $state.go('app.trade', {
        id: id
      });
    };

    $scope.$on('authchange', function () {
      $scope.refresh();
    });
  });

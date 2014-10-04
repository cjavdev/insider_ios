/*globals angular, window */
 angular.module('insider.controllers')
  .controller('BuysCtrl', function ($state, $scope, BuyIdeaService) {
    $scope.refresh = function () {
      $scope.retryWithPromise(BuyIdeaService.findAll, [], 3, this)
        .then(function (trades) {
          console.log(trades);
          $scope.trades = trades;
        }, function () {
          // TODO: show no trades found thing
          console.log("sad face");
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

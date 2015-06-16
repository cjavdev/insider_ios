/*globals angular, window, document */
angular.module('insider.controllers')
  .controller('TradeCtrl', function ($scope, $stateParams, BuyIdeaService) {
    if(typeof analytics !== undefined) { analytics.trackView("Trade Controller"); }
    $scope.navigateTo = function (url) {
      window.open(url, '_blank', 'location=yes');
    };

    $scope.refresh = function () {
      $scope.retryWithPromise(BuyIdeaService.findById, [$stateParams.id], 3, this)
        .then(function (trade) {
          $scope.trade = trade;
        }, function () {
          console.log("sad face");
        });
    };
    $scope.refresh();
  });

/*globals angular, window */
angular.module('insider.controllers')
  .controller('InsiderCtrl', function ($scope, $stateParams, InsiderService) {
    $scope.refresh = function () {
      $scope.retryWithPromise(InsiderService.findById, [$stateParams.id], 3, this)
        .then(function (insiderData) {
          $scope.insider = insiderData;
        }, function () {
          console.log("sad face");
        });
    };

    $scope.refresh();
  });

angular.module('insider.controllers')
  .controller('SubscribeCtrl', function ($state, $scope, $location, SubscribeService) {
    $scope.user = {};
    $scope.errorMessage = "";

    $scope.doSubscribe = function () {
      $scope.errorMessage = '';
      console.log('Subscribing');
      SubscribeService.subscribe($scope.products[0]).then(function () {
        $location.path("/");
      }, function (resp) {
        $scope.errorMessage = resp.data.message;
      });
    };
  });

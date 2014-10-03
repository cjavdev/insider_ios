/*globals angular, window */
angular.module('insider.controllers')
  .controller('InsiderCtrl', function ($scope, $stateParams, InsiderService) {
    InsiderService.findById($stateParams.id).then(function (data) {
      $scope.insider = data;
    }, function () {
      console.log("no insider found :(");
    });
  });

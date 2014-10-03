/*globals angular, window */
angular.module('insider.controllers')
  .controller('CompanyCtrl', function ($scope, $stateParams, CompanyService) {
    $scope.showTrades = true;
    CompanyService.findById($stateParams.id).then(function (data) {
      $scope.company = data;
    }, function () {
      console.log("no company found :(");
    });
  });

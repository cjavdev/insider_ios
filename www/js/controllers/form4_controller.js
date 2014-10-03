/*globals angular, window */
angular.module('insider.controllers')
  .controller('Form4Ctrl', function ($scope, $stateParams, Form4Service) {
    Form4Service.findById($stateParams.id).then(function (data) {
      $scope.form4 = data;
    }, function () {
      console.log("no form4 found :(");
    });
  });

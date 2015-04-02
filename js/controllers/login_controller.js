angular.module('insider.controllers')
  .controller('LoginCtrl', function ($state, $scope, $location, LoginService) {
    $scope.user = {};
    $scope.errorMessage = "";
    $scope.doLogin = function () {
      $scope.errorMessage = '';
      LoginService.login($scope.user).then(function () {
        $location.path("/");
      }, function (resp) {
        $scope.errorMessage = resp.data.message;
      });
    };
  });

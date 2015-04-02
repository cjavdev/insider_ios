angular.module('insider.controllers')
  .controller('LoginCtrl', function ($state, $scope, $window, LoginService) {
    $scope.user = {};
    $scope.errorMessage = "";
    $scope.doLogin = function () {
      $scope.errorMessage = '';
      LoginService.login($scope.user).then(function () {
        $window.history.back();
      }, function (resp) {
        $scope.errorMessage = resp.data.message;
      });
    };
  });

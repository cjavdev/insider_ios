angular.module('insider.controllers')
  .controller('LoginCtrl', function ($state, $scope, LoginService) {
    $scope.user = {};
    $scope.errorMessage = "";
    $scope.doLogin = function () {
      $scope.errorMessage = '';
      LoginService.login($scope.user).then(function () {
        console.log('hide login');
      }, function (resp) {
        $scope.errorMessage = resp.data.message;
      });
    };
  });

angular.module('insider.controllers')
  .controller('LoginCtrl', function ($state, $scope, $location, $window, LoginService) {
    $scope.user = {
      email: $window.localStorage.email
    };
    $scope.errorMessage = "";
    $scope.doLogin = function () {
      $scope.errorMessage = '';
      LoginService.login($scope.user).then(function () {
        $window.localStorage.email = $scope.user.email;
        $location.path("/");
      }, function (resp) {
        $scope.errorMessage = resp.data.message;
      });
    };
  });

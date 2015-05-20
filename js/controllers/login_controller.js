angular.module('insider.controllers')
  .controller('LoginCtrl', function ($state, $scope, $rootScope, $location, $window, LoginService) {
    $scope.user = {
      email: $window.localStorage.email,
      password: $window.localStorage.password,
      device: { platform: 'ios', token: $rootScope.deviceToken }
    };
    var tries = 0;
    $scope.errorMessage = "";
    $scope.doLogin = function () {
      $scope.errorMessage = '';
      LoginService.login($scope.user).then(function () {
        $window.localStorage.email = $scope.user.email;
        $window.localStorage.password = $scope.user.password;
        $location.path("/");
        tries++;
      }, function (resp) {
        if(tries > 0) {
          $scope.errorMessage = resp.data.message;
        }
        tries++;
      });
    };
    $scope.doLogin();
  });

angular.module('insider.controllers')
  .controller('LoginCtrl', function ($state, $scope, LoginService) {
    $scope.doLogin = function () {
      console.log('logging in');
    };
  });

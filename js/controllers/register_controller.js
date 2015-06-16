angular.module('insider.controllers')
  .controller('RegisterCtrl', function ($state, $scope, $rootScope, $location, RegisterService) {
    if(typeof analytics !== undefined) { analytics.trackView("Register Controller"); }
    $scope.user = { device_token: $rootScope.deviceToken };
    $scope.errorMessage = '';
    $scope.doRegister = function () {
      $scope.errorMessage = '';
      RegisterService.register($scope.user).then(function () {
        $location.path("/");
      }, function (resp) {
        var errors = resp.data.errors.join(", ");
        console.log(errors);
        $scope.errorMessage = errors;
      });
    };
  });

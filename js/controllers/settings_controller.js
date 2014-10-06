/*globals angular */
angular.module('insider.controllers')
  .controller('SettingsCtrl', function ($timeout, $scope, AuthService, SettingsService) {
    $scope.user = AuthService.currentUser();

    $scope.toggleSetting = function (key) {
      SettingsService.toggleSetting(key)
        .then(function () {
          $timeout(function () {
            $scope.$apply();
          }, 100);
        }, function () {
          console.log("somethign went wrong when setting: " + key);
        });
    };

    $scope.$on('authchange', function () {
      if($scope.loggedIn()) {
        $scope.user = AuthService.currentUser();
        $scope.$apply();
      } else {
        $scope.login();
      }
    });
  });

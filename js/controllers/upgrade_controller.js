/*globals angular, window, document */
 angular.module('insider.controllers')
  .controller('UpgradeCtrl', function ($scope, $ionicModal, $ionicPopup, $rootScope, AuthService) {
    $scope.userData = {};

    $ionicModal.fromTemplateUrl('templates/register.html', {
      scope: $scope
    }).then(function (modal) {
      $scope.registerModal = modal;
    });

    $scope.closeRegister = function () {
      $scope.registerModal.hide();
    };

    $scope.register = function () {
      $scope.registerModal.show();
      document.getElementById('user-email').focus();
    };

    $scope.doRegister = function () {
      AuthService.doRegister($scope.userData, $rootScope.deviceToken)
        .then(function () {
          $rootScope.$broadcast('authchange');
          $scope.closeRegister();
          window.storekit.purchase("com.insiderai.ios.basic1", 1);
        }, function (data) {
          if (data.message) {
            window.alert(data.message);
          } else {
            window.alert("Something went wrong with your login. Try again.");
          }
        });
    };

    $scope.upgrade = function () {
      $scope.register();
    };
    return;
  });

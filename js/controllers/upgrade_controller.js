/*globals angular, window, document */
angular.module('insider.controllers')
  .controller('UpgradeCtrl', function ($scope, $ionicModal, $ionicPopup, $rootScope, $storekit, AuthService) {
    $scope.userData = {};

    $ionicModal.fromTemplateUrl('templates/register.html', {
      scope: $scope
    }).then(function (modal) {
      $scope.registerModal = modal;
    });

    $scope.closeRegister = function () {
      $scope.registerModal.hide();
    };
    $storekit.watchPurchases()
        .then(function (purchase) {
          if (purchase.productId === 'com.insiderai.ios.basic1') {
            if (purchase.type === 'purchase') {
              console.log('purchased!');
              // Your product was purchased
            } else if (purchase.type === 'restore') {
              console.log('restored!');
              // Your product was restored
            }
            console.log("transactionId:" + purchase.transactionId);
            console.log("productId:" + purchase.productId);
            console.log("type:" + purchase.type);
            console.log("transactionReceipt:" + purchase.transactionReceipt);
          }
        });

    $scope.register = function () {
      $storekit.purchase("com.insiderai.ios.basic1");
      console.log('restored');

      //  $scope.registerModal.show();
      document.getElementById('user-email').focus();
    };

    $scope.doRegister = function () {
      AuthService.doRegister($scope.userData, $rootScope.deviceToken)
        .then(function () {
          $rootScope.$broadcast('authchange');
          $scope.closeRegister();
          $storekit.purchase("com.insiderai.ios.basic1", 1);
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

/*globals angular, window */
 angular.module('insider.controllers')
  .controller('UpgradeCtrl', function ($scope) {
    $scope.upgrade = function () {
       console.log("upgrading stuff");
       window.storekit.purchase("com.insiderai.ios.basic1", 1);
    };
    return;
  });

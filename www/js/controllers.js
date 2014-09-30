/*globals angular, window */

var app = angular.module('insider');
angular.module('insider.controllers', [])
  .controller('AppCtrl', function ($scope, $ionicModal, $http, $rootScope) {
    // Form data for the login modal
    $scope.loginData = {};

    // Create the login modal that we will use later
    $ionicModal.fromTemplateUrl('templates/login.html', {
      scope: $scope
    }).then(function (modal) {
      $scope.modal = modal;
    });

    // Triggered in the login modal to close it
    $scope.closeLogin = function () {
      $scope.modal.hide();
    };

    // Open the login modal
    $scope.login = function () {
      $scope.modal.show();
    };

    $scope.logout = function () {
      $scope.doLogout();
    };

    $scope.loggedIn = function () {
      var token = window.localStorage.getItem('auth_token');
      if (token !== null) {
        $http.defaults.headers.common['Auth-Token-X'] = token;
      }
      return token !== null;
    };

    // Perform the login action when the user submits the login form
    $scope.doLogin = function () {
      var params = {
        user: $scope.loginData
      };
      params.device = {
        platform: 'ios',
        token: $rootScope.deviceToken
      };

      $http.post(app.config.apiBase + '/api/v1/users/sign_in.json', params).
      success(function (data) {
        window.localStorage.setItem('auth_token', data.auth_token);
        $http.defaults.headers.common['Auth-Token-X'] = data.auth_token;
        $rootScope.$broadcast('authchange');
        $scope.closeLogin();
      }).
      error(function (data) {
        console.log(data);
        window.alert(data);
      });
    };
    // Perform the login action when the user submits the login form
    $scope.doLogout = function () {
      $http.delete(app.config.apiBase + '/api/v1/users/sign_out.json').
        success(function () {
          $rootScope.$broadcast('authchange');
        });

      $http.defaults.headers.common['Auth-Token-X'] = undefined;
      window.localStorage.removeItem('auth_token');
    };
  })
  .controller('TodaysBuysCtrl', function ($state, $scope, BuyIdeaService, $ionicLoading) {
    $scope.trades = [];
    $scope.fetchAttempts = 0;
    $scope.refresh = function () {
      $scope.loading = true;
      $ionicLoading.show({
        template: "<i class='ion-loading-d'></i>"
      });

      BuyIdeaService.findTodays().then(function (trades) {
        $scope.trades = trades;
        $scope.loading = false;
        $ionicLoading.hide();
      }, function () {
        if($scope.fetchAttempts < 3) {
          console.log('trying to fetch today again in 2 seconds', $scope.fetchAttempts);
          setTimeout(function () {
            $scope.refresh();
          }, 2000);
          $scope.fetchAttempts++;
        } else {
          console.log('giving up...');
          $scope.trades = [];
          $ionicLoading.hide();
        }
      });
    };
    $scope.refresh();

    $scope.showTrade = function (id) {
      $state.go('app.trade', {
        tradeId: id
      });
    };

    $scope.$on('authchange', function () {
      $scope.refresh();
    });
  })
  .controller('BuysCtrl', function ($state, $scope, BuyIdeaService, $ionicLoading) {
    $scope.fetchAttempts = 0;

    $scope.refresh = function () {
      $scope.loading = true;
      $ionicLoading.show({
        template: "<i class='ion-loading-d'></i>"
      });
      BuyIdeaService.findAll().then(function (trades) {
        $scope.trades = trades;
        $scope.loading = false;
        $ionicLoading.hide();
      }, function () {
        if($scope.fetchAttempts < 3) {
          console.log('trying to fetch all again in 2 seconds');
          setTimeout(function () {
            $scope.refresh();
          }, 2000);
          $scope.fetchAttempts++;
        } else {
          console.log('giving up...');
          $scope.trades = [];
          $ionicLoading.hide();
        }
      });
    };
    $scope.refresh();

    $scope.showTrade = function (id) {
      $state.go('app.trade', {
        tradeId: id
      });
    };

    $scope.$on('authchange', function () {
      $scope.refresh();
    });
  })
  .controller('TradeCtrl', function ($scope, $stateParams, BuyIdeaService) {
    $scope.navigateTo = function (url) {
      var ref = window.open(url, '_blank', 'location=yes');
    };
    BuyIdeaService.findById($stateParams.tradeId).then(function (trade) {
      $scope.trade = trade;
    }, function (data) {
      console.log(data.message);
    });
  });

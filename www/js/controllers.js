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
        window.alert(data.message);
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
  .controller('TodaysBuysCtrl', function ($state, $scope, BuyIdeaService) {
    $scope.trades = [];

    function loadRemote() {
      BuyIdeaService.findTodays().then(function (trades) {
        $scope.trades = trades;
      });
    }
    loadRemote();

    $scope.showTrade = function (id) {
      $state.go('app.trade', {
        tradeId: id
      });
    };

    $scope.$on('authchange', function () {
      loadRemote();
    });
  })
  .controller('BuysCtrl', function ($state, $scope, BuyIdeaService) {
    function loadRemote() {
      BuyIdeaService.findAll().then(function (trades) {
        $scope.trades = trades;
      });
    }
    loadRemote();

    $scope.showTrade = function (id) {
      $state.go('app.trade', {
        tradeId: id
      });
    };

    $scope.$on('authchange', function () {
      loadRemote();
    });
  })
  .controller('TradeCtrl', function ($scope, $stateParams, BuyIdeaService) {
    $scope.direction = "bought";
    BuyIdeaService.findById($stateParams.tradeId).then(function (trade) {
      $scope.trade = trade;
    });
  });

/*globals angular */
angular.module('insider.controllers', [])
.controller('AppCtrl', function($scope, $ionicModal, $timeout, $http) {
  // Form data for the login modal
  $scope.loginData = {};

  // Create the login modal that we will use later
  $ionicModal.fromTemplateUrl('templates/login.html', {
    scope: $scope
  }).then(function(modal) {
    $scope.modal = modal;
  });

  // Triggered in the login modal to close it
  $scope.closeLogin = function() {
    $scope.modal.hide();
  };

  // Open the login modal
  $scope.login = function() {
    $scope.modal.show();
  };

  // Perform the login action when the user submits the login form
  $scope.doLogin = function () {
    var params = { user: $scope.loginData };
    params.device = { platform: 'ios', token: '1234' }; // TODO: get the device token

    $http.post(app.config.apiBase + '/api/v1/users/sign_in.json', params).
      success(function (data) {
        $http.defaults.headers.common['Auth-Token-X'] = data.auth_token;
        $scope.closeLogin();
      }).
      error(function (data) {
        console.log(data);
      });
  };
})
.controller('TodaysBuysCtrl', function($scope, $http, ideasService) {
  $scope.trades = [];
  function loadRemoteData() {
    ideasService.getIdeas().then(function (trades) {
      console.log(trades);
      $scope.trades = trades;
    });
  }
  loadRemoteData();
})
.controller('BuysCtrl', function($scope) {
  $scope.trades = [
    { ticker: 'AAPL', id: 1, market_cap: '500B', holdings_change: '40%' },
    { ticker: 'GOOG', id: 2, market_cap: '400B', holdings_change: '30%' },
    { ticker: 'FB', id: 3, market_cap: '27B', holdings_change: '35%' },
    { ticker: 'BABA', id: 4, market_cap: '1M', holdings_change: '10%' },
    { ticker: 'GE', id: 5, market_cap: '900M', holdings_change: '10%' },
    { ticker: 'WM', id: 6, market_cap: '500M', holdings_change: '10%' }
  ];
})
.controller('TradeCtrl', function($scope, $stateParams) {});

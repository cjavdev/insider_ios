angular.module('starter.controllers', [])

.controller('AppCtrl', function($scope, $ionicModal, $timeout) {
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
  $scope.doLogin = function() {
    console.log('Doing login', $scope.loginData);

    // Simulate a login delay. Remove this and replace with your login
    // code if using a login system
    $timeout(function() {
      $scope.closeLogin();
    }, 1000);
  };
})
.controller('PlaylistsCtrl', function($scope) {
  $scope.playlists = [
    { title: 'Reggae', id: 1 },
    { title: 'Chill', id: 2 },
    { title: 'Dubstep', id: 3 },
    { title: 'Indie', id: 4 },
    { title: 'Rap', id: 5 },
    { title: 'Cowbell', id: 6 }
  ];
})
.controller('TodaysBuysCtrl', function($scope) {
  $scope.trades = $http({ url: "http://localhost:3000/api/v1/buys" })
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
.controller('TradeCtrl', function($scope, $stateParams) {})

.controller('PlaylistCtrl', function($scope, $stateParams) {
});

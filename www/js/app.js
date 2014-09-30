/*global window, cordova, angular */

var app = angular.module('insider', ['ionic', 'insider.controllers', 'insider.services', 'ngCordova']);
app.config.apiBase = 'http://localhost:3000';
//app.config.apiBase = 'https://insiderai.com';
app.run(function ($http, $ionicPlatform, $cordovaPush, $rootScope) {
  var token = window.localStorage.getItem('auth_token');
  if (token !== null) {
    $http.defaults.headers.common['Auth-Token-X'] = token;
  }
  $http.get(app.config.apiBase + '/api/v1/sessions/validate.json')
  .then(function (resp) {
    console.log(resp.data.message);
  }, function (resp) {
    window.localStorage.removeItem('auth_token');
    delete $http.defaults.headers.common['Auth-Token-X'];
    console.log(resp.data.message);
  });

  $ionicPlatform.ready(function () {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if (window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if (window.StatusBar) {
      // org.apache.cordova.statusbar required
      window.StatusBar.styleLightContent();
    }

    var iosConfig = {
      "badge":"true",
      "sound":"true",
      "alert":"true",
      "ecb":"onNotificationAPN"
    };

    $cordovaPush.register(iosConfig).then(function(result) {
      $rootScope.deviceToken = result;
    }, function(err) {
      console.log("not able to send push", err);
    });
  // $cordovaPush.unregister(options).then(function(result) {
  //   alert("unregister");
  //   alert(result);
  //   alert(arguments);
  //     // Success!
  // }, function(err) {
  //   alert("error");
  //   alert(err);
  //     // An error occured. Show a message to the user
  // });
  //
  // // iOS only
  // $cordovaPush.setBadgeNumber(2).then(function(result) {
  //   alert("set badge to 2!");
  //   alert(result);
  //   alert(arguments);
  //     // Success!
  // }, function(err) {
  //   alert("error");
  //   alert(err);
  //     // An error occured. Show a message to the user
  // });

  });
});

app.config(function ($stateProvider, $urlRouterProvider) {
  $stateProvider
    .state('app', {
      url: '/app',
      abstract: true,
      templateUrl: 'templates/menu.html',
      controller: 'AppCtrl'
    })
    .state('app.buys', {
      url: '/buys',
      views: {
        'menuContent': {
          templateUrl: 'templates/buys.html',
          controller: 'BuysCtrl'
        }
      }
    })
    .state('app.today', {
      url: '/today',
      views: {
        'menuContent': {
          templateUrl: 'templates/today.html',
          controller: 'TodaysBuysCtrl'
        }
      }
    })
    .state('app.trade', {
      url: '/trades/:tradeId',
      views: {
        'menuContent': {
          templateUrl: 'templates/trade.html',
          controller: 'TradeCtrl'
        }
      }
    });
  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/app/buys');
});

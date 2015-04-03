/*global window, cordova, angular */
var app = angular.module('insider', [
    'ionic',
    'insider.services',
    'insider.controllers',
    'ngCordova',
    'ngStorekit'
  ])
  .constant('loc', {
    // apiBase: 'http://localhost:3002'
    apiBase: 'https://insiderai.com'
  })
  .config(function($stateProvider, $urlRouterProvider) {
    $stateProvider
      .state('register', {
        url: '/register',
        templateUrl: 'templates/register.html',
        controller: 'RegisterCtrl'
      })
      .state('subscribe', {
        url: '/subscribe',
        templateUrl: 'templates/subscribe.html',
        controller: 'SubscribeCtrl'
      })
      .state('login', {
        url: '/login',
        templateUrl: 'templates/login.html',
        controller: 'LoginCtrl'
      })
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
        url: '/trades/:id',
        views: {
          'menuContent': {
            templateUrl: 'templates/trade.html',
            controller: 'TradeCtrl'
          }
        }
      })
      .state('app.insider', {
        url: '/insiders/:id',
        views: {
          'menuContent': {
            templateUrl: 'templates/insider.html',
            controller: 'InsiderCtrl'
          }
        }
      })
      .state('app.form4', {
        url: '/form4s/:id',
        views: {
          'menuContent': {
            templateUrl: 'templates/form4.html',
            controller: 'Form4Ctrl'
          }
        }
      })
      .state('app.company', {
        url: '/companies/:id',
        views: {
          'menuContent': {
            templateUrl: 'templates/company.html',
            controller: 'CompanyCtrl'
          }
        }
      })
      .state('app.search', {
        url: '/search',
        views: {
          'menuContent': {
            templateUrl: 'templates/search.html',
            controller: 'SearchCtrl'
          }
        }
      })
      .state('app.disclaimer', {
        url: '/disclaimer',
        views: {
          'menuContent': {
            templateUrl: 'templates/disclaimer.html',
            controller: 'DisclaimerCtrl'
          }
        }
      });
    // if none of the above states are matched, use this as the fallback
    $urlRouterProvider.otherwise('/app/buys');
  })
  .config(['$httpProvider', function($httpProvider) {
    $httpProvider.defaults.withCredentials = true;
    $httpProvider.interceptors.push('authHttpResponseInterceptor');
  }])
  .run(function($state, $ionicPlatform, $cordovaPush, $rootScope, $storekit) {
    $ionicPlatform.ready(function() {
      $storekit
        .setLogging(true)
        .load(['com.insiderai.ios.insideralerts1'])
        .then(function(products) {
          $rootScope.products = products;
          console.log(products);
          console.log('products loaded');
        })
        .catch(function() {
          $rootScope.products = [];
          console.log('product load error', arguments);
        });

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
        "badge": "true",
        "sound": "true",
        "alert": "true",
        "ecb": "onNotificationAPN"
      };

      if (window.cordova) {
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

        window.onNotificationAPN = function(e) {
          console.log('on notification:', e);
          if (e.alert) {
            $state.go('app.trade', {
              id: e.idea_id
            });
          }

          if (e.sound) {
            var snd = new Media(e.sound);
            snd.play();
          }

          if (e.badge) {
            $cordovaPush.setBadgeNumber(e.badge).then(function(result) {
              console.log(result);
            }, function(err) {
              console.log(err);
            });
          }
        };
      }
    });
  });

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
      .state('app.feedback', {
        url: '/feedback',
        views: {
          'menuContent': {
            templateUrl: 'templates/feedback.html',
            controller: 'FeedbackCtrl'
          }
        }
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

angular.module('insider.services', [])
  .factory('authHttpResponseInterceptor', ['$q', '$location',
    function ($q, $location) {
      return {
        responseError: function (rejection) {
          if (rejection.status === 401) {
            $location.path('/login');
            return $q.reject(rejection);
          }
          if (rejection.status === 403) {
            $location.path('/subscribe');
            return $q.reject(rejection);
          }
          return $q.reject(rejection);
        }
      };
    }
  ]);

/*globals angular, _ */
angular.module('insider.services')
  .factory('CompanyService', function(loc, $q, $http) {
    function url(id) {
     if(id) {
        return loc.apiBase + '/api/v1/companies/' + id + '.json';
      }
      return loc.apiBase + '/api/v1/companies.json';
    }

    return {
      findById: function (id) {
        var deferred = $q.defer();
        $http.get(url(id)).then(function (resp) {
          deferred.resolve(resp.data);
        }, function (resp) {
          deferred.reject(resp.data);
        });
        return deferred.promise;
      },
    };
  });


/*globals angular, _ */
angular.module('insider.services')
  .factory('FeedbackService', function(loc, $http) {
    function url() {
      return loc.apiBase + '/api/v2/feedbacks';
    }

    return {
      submitFeedback: function (feedbackParams) {
        return $http.post(url(), feedbackParams);
      }
    };
  });

/*globals angular, _ */
angular.module('insider.services')
  .factory('Form4Service', function(loc, $q, $http) {
    function url(id) {
     if(id) {
        return loc.apiBase + '/api/v1/form4s/' + id + '.json';
      }
      return loc.apiBase + '/api/v1/form4s.json';
    }

    return {
      findById: function (id) {
        var deferred = $q.defer();
        $http.get(url(id)).then(function (resp) {
          var filing = resp.data;
          var doc = JSON.parse(resp.data.filing);
          filing.nonDerivativeTransactions = doc.transactions;
          filing.derivativeTransactions = doc.derivative_transactions;
          deferred.resolve(filing);
        }, function (resp) {
          deferred.reject(resp.data);
        });
        return deferred.promise;
      },
    };
  });

/*globals angular, _ */
angular.module('insider.services')
  .factory('BuyIdeaService', function(loc, $q, $http) {
    function url(id) {
      if(id) {
        return loc.apiBase + '/api/v2/buys/' + id + '.json';
      }
      return loc.apiBase + '/api/v2/buys.json';
    }

    return {
      findAll: function () {
        var deferred = $q.defer();
        $http.get(url(), { cache: true })
          .then(function (resp) {
            deferred.resolve(resp.data);
          }, function (resp) {
            deferred.reject(resp.data);
          });
        return deferred.promise;
      },

      findById: function (id) {
        var deferred = $q.defer();
        $http.get(url(id), { cache: true })
          .then(function (resp) {
            deferred.resolve(resp.data);
          }, function (resp) {
            deferred.reject(resp.data);
          });
        return deferred.promise;
      },

      findTodays: function () {
        var deferred = $q.defer();
        $http.get(url(), { params: { 'today': true }, cache: true })
          .then(function (resp) {
            deferred.resolve(resp.data);
          });
        return deferred.promise;
      }
    };
  });

/*globals angular, _ */
angular.module('insider.services')
  .factory('InsiderService', function(loc, $q, $http) {
    function url(id) {
     if(id) {
        return loc.apiBase + '/api/v1/insiders/' + id + '.json';
      }
      return loc.apiBase + '/api/v1/insiders.json';
    }

    return {
      findById: function (id) {
        var deferred = $q.defer();
        $http.get(url(id)).then(function (resp) {
          deferred.resolve(resp.data);
        }, function (resp) {
          deferred.reject(resp.data);
        });
        return deferred.promise;
      },
    };
  });

/*globals angular, _ */
angular.module('insider.services')
  .factory('LoginService', function(loc, $http) {
    function url() {
      return loc.apiBase + '/api/v2/session';
    }

    return {
      login: function (userParams) {
        return $http.post(url(), userParams);
      }
    };
  });

/*globals angular, _ */
angular.module('insider.services')
  .factory('RegisterService', function(loc, $http) {
    function url() {
      return loc.apiBase + '/api/v2/users';
    }

    return {
      register: function (userParams) {
        userParams.platform = 'ios';
        return $http.post(url(), userParams);
      }
    };
  });

/*globals angular, _ */
angular.module('insider.services')
  .factory('SearchService', function(loc, $http) {
    function url(q) {
      return loc.apiBase + '/api/v1/search?q=' + q;
    }

    return {
      search: function (keyword) {
        return $http.get(url(keyword), { cache: true });
      }
    };
  });

/*globals angular, _ */
angular.module('insider.services')
  .factory('SubscribeService', function(loc, $http, $storekit) {
    function url() {
      return loc.apiBase + '/api/v2/subscriptions';
    }

    return {
      subscribe: function (product) {
        $storekit.purchase(product.id);
        return $http.post(url(), {
          product_name: product.id,
          price: product.price
        });
      }
    };
  });

/*globals angular, window, document */
angular.module('insider.controllers', [])
  .controller('AppCtrl', function($timeout, $ionicLoading, $q, $scope, $ionicModal, $rootScope, $storekit) {
    $storekit
      .watchPurchases()
      .then(function() {
        // Not currently used
      }, function(error) {
        // An error occured. Show a message to the user
      }, function(purchase) {
        if (purchase.productId === 'com.insiderai.ios.insideralerts1') {
          if (purchase.type === 'purchase') {
            console.log('purchased!');
            // Your product was purchased
          } else if (purchase.type === 'restore') {
            // Your product was restored
            console.log('restored!');
          }
          console.log(purchase.transactionId);
          console.log(purchase.productId);
          console.log(purchase.transactionReceipt);
        }
      });


    $scope.retryWithPromise = function(promise, args, maxTries, context, deferred) {
      deferred = deferred || $q.defer();
      context = context || null;

      $scope.loading = true;
      $ionicLoading.show({
        template: "<i class='ion-loading-d'></i>"
      });

      promise.apply(context, args)
        .then(function(d) {
          $scope.loading = false;
          $ionicLoading.hide();
          return deferred.resolve(d);
        }, function(err) {
          if (maxTries === -1 || err.status == 401 || err.status == 403) {
            $ionicLoading.hide();
            $scope.loading = false;
            return deferred.reject(err);
          } else {
            $timeout(function() {
              $scope.retryWithPromise(promise, args, maxTries - 1, context, deferred);
            }, 2000);
          }
        });
      return deferred.promise;
    };

    $scope.retryWithPromisePullToRefresh = function(promise, args, maxTries, context, deferred) {
      deferred = deferred || $q.defer();
      context = context || null;

      $scope.loading = true;
      promise.apply(context, args)
        .then(function(d) {
          $scope.loading = false;
          $scope.$broadcast('scroll.refreshComplete');
          return deferred.resolve(d);
        }, function(err) {
          if (maxTries === -1 || err.status == 401 || err.status == 403) {
            $scope.$broadcast('scroll.refreshComplete');
            $scope.loading = false;
            return deferred.reject(err);
          } else {
            $timeout(function() {
              $scope.retryWithPromise(promise, args, maxTries - 1, context, deferred);
            }, 2000);
          }
        });
      return deferred.promise;
    };
  });

/*globals angular, window */
 angular.module('insider.controllers')
  .controller('BuysCtrl', function ($cacheFactory, $state, $scope, loc, BuyIdeaService) {
    var loadRemote = function () {
      $scope.retryWithPromisePullToRefresh(BuyIdeaService.findAll, [], 3, this)
        .then(function (trades) {
          $scope.trades = trades;
        }, function () {
          // TODO: show no trades found thing
          $scope.trades = [];
        });
    };
    loadRemote();

    $scope.refresh = function () {
      var cache = $cacheFactory.get('$http');
      cache.remove(loc.apiBase + '/api/v2/buys.json');
      loadRemote();
    };

    $scope.showTrade = function (id) {
      $state.go('app.trade', {
        id: id
      });
    };

    $scope.$on('authchange', function () {
      $scope.refresh();
    });
  });

/*globals angular, window */
angular.module('insider.controllers')
  .controller('CompanyCtrl', function ($state, $scope, $stateParams, CompanyService) {
    $scope.showTrades = true;

    $scope.refresh = function () {
      $scope.retryWithPromise(CompanyService.findById, [$stateParams.id], 3, this)
        .then(function (companyData) {
          $scope.company = companyData;
        }, function () {
          console.log("sad face");
        });
    };

    $scope.refresh();

    $scope.goToInsider = function (insider) {
      $state.go('app.insider', {
        id: insider.id
      });
    };

    $scope.goToForm4 = function (form4) {
      $state.go('app.form4', {
        id: form4.id
      });
    };
  });

/*globals angular, window */
 angular.module('insider.controllers')
  .controller('DisclaimerCtrl', function () {
    return;
  });

/*globals angular, window */
 angular.module('insider.controllers')
  .controller('FeedbackCtrl', function ($scope, $location, FeedbackService) {
    $scope.feedback = {};

    $scope.submitFeedback = function () {
      FeedbackService.submitFeedback($scope.feedback);
      $location.path("/");
    };

    return;
  });

/*globals angular, window */
angular.module('insider.controllers')
  .controller('Form4Ctrl', function ($scope, $stateParams, Form4Service) {
    $scope.refresh = function () {
      $scope.retryWithPromise(Form4Service.findById, [$stateParams.id], 3, this)
        .then(function (form4Data) {
          $scope.form4 = form4Data;
        }, function () {
          console.log("sad face");
        });
    };

    $scope.navigateTo = function (url) {
      window.open(url, '_blank', 'location=yes');
    };

    $scope.refresh();
  });

/*globals angular, window */
angular.module('insider.controllers')
  .controller('InsiderCtrl', function ($state, $scope, $stateParams, InsiderService) {
    $scope.showTrades = true;

    $scope.refresh = function () {
      $scope.retryWithPromise(InsiderService.findById, [$stateParams.id], 3, this)
        .then(function (insiderData) {
          $scope.insider = insiderData;
        }, function () {
          console.log("sad face");
        });
    };

    $scope.refresh();

    $scope.goToCompany = function (company) {
      $state.go('app.company', {
        id: company.id
      });
    };
    $scope.goToForm4 = function (form4) {
      $state.go('app.form4', {
        id: form4.id
      });
    };
  });

angular.module('insider.controllers')
  .controller('LoginCtrl', function ($state, $scope, $location, LoginService) {
    $scope.user = {};
    $scope.errorMessage = "";
    $scope.doLogin = function () {
      $scope.errorMessage = '';
      LoginService.login($scope.user).then(function () {
        $location.path("/");
      }, function (resp) {
        $scope.errorMessage = resp.data.message;
      });
    };
  });

angular.module('insider.controllers')
  .controller('RegisterCtrl', function ($state, $scope, $rootScope, $location, RegisterService) {
    $scope.user = { device_token: $rootScope.deviceToken };
    $scope.errorMessage = '';
    $scope.doRegister = function () {
      $scope.errorMessage = '';
      RegisterService.register($scope.user).then(function () {
        $location.path("/");
      }, function (resp) {
        var errors = resp.data.errors.join(", ");
        console.log(errors);
        $scope.errorMessage = errors;
      });
    };
  });

/*globals angular, window */
angular.module('insider.controllers')
  .controller('SearchCtrl', function ($state, $scope, SearchService) {
    $scope.keyword = "";
    $scope.results = [];
    $scope.search = function () {
      SearchService.search($scope.keyword).then(function (resp) {
        $scope.results = resp.data;
      });
    };

    $scope.openResult = function (result) {
      var where = (result[1] === 'Insider') ? 'app.insider' : 'app.company';
      $state.go(where, {
        id: result[0]
      });
    };
    $scope.search();
  });

angular.module('insider.controllers')
  .controller('SubscribeCtrl', function ($state, $scope, $location, SubscribeService) {
    $scope.user = {};
    $scope.errorMessage = "";

    $scope.doSubscribe = function () {
      $scope.errorMessage = '';
      console.log('Subscribing');
      SubscribeService.subscribe($scope.products[0]).then(function () {
        $location.path("/");
      }, function (resp) {
        $scope.errorMessage = resp.data.message;
      });
    };
  });

/*globals angular, window */
angular.module('insider.controllers')
 .controller('TodaysBuysCtrl', function ($cacheFactory, $state, $scope, loc, BuyIdeaService) {
    $scope.trades = [];

    var loadRemote = function () {
      $scope.retryWithPromisePullToRefresh(BuyIdeaService.findTodays, [], 3, this)
        .then(function (trades) {
          $scope.trades = trades;
        }, function () {
          console.log("sad face");
        });
    };
    loadRemote();

    $scope.refresh = function () {
      var cache = $cacheFactory.get('$http');
      cache.remove(loc.apiBase + '/api/v2/buys.json?today=true');
      loadRemote();
    };

    $scope.showTrade = function (id) {
      $state.go('app.trade', {
        id: id
      });
    };

    $scope.$on('authchange', function () {
      $scope.refresh();
    });
  });


/*globals angular, window, document */
angular.module('insider.controllers')
  .controller('TradeCtrl', function ($scope, $stateParams, BuyIdeaService) {
    $scope.navigateTo = function (url) {
      window.open(url, '_blank', 'location=yes');
    };

    $scope.refresh = function () {
      $scope.retryWithPromise(BuyIdeaService.findById, [$stateParams.id], 3, this)
        .then(function (trade) {
          $scope.trade = trade;
        }, function () {
          console.log("sad face");
        });
    };
    $scope.refresh();
  });

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImF1dGhfaHR0cF9yZXBvbnNlX2ludGVyY2VwdG9yLmpzIiwiY29tcGFueV9zZXJ2aWNlLmpzIiwiZmVlZGJhY2tfc2VydmljZS5qcyIsImZvcm00X3NlcnZpY2UuanMiLCJpZGVhX3NlcnZpY2UuanMiLCJpbnNpZGVyX3NlcnZpY2UuanMiLCJsb2dpbl9zZXJpdmNlLmpzIiwicmVnaXN0ZXJfc2VydmljZS5qcyIsInNlYXJjaF9zZXJpdmNlLmpzIiwic3Vic2NyaWJlX3NlcnZpY2UuanMiLCJhcHBfY29udHJvbGxlci5qcyIsImJ1eXNfY29udHJvbGxlci5qcyIsImNvbXBhbnlfY29udHJvbGxlci5qcyIsImRpc2NsYWltZXJfY29udHJvbGxlci5qcyIsImZlZWRiYWNrX2NvbnRyb2xsZXIuanMiLCJmb3JtNF9jb250cm9sbGVyLmpzIiwiaW5zaWRlcl9jb250cm9sbGVyLmpzIiwibG9naW5fY29udHJvbGxlci5qcyIsInJlZ2lzdGVyX2NvbnRyb2xsZXIuanMiLCJzZWFyY2hfY29udHJvbGxlci5qcyIsInN1YnNjcmliZV9jb250cm9sbGVyLmpzIiwidG9kYXlzX2J1eXNfY29udHJvbGxlci5qcyIsInRyYWRlX2NvbnRyb2xsZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3ZNQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2xCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDM0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN0QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNiQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDN0VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDOUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM1QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2xCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDaENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJhbGwuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKmdsb2JhbCB3aW5kb3csIGNvcmRvdmEsIGFuZ3VsYXIgKi9cbnZhciBhcHAgPSBhbmd1bGFyLm1vZHVsZSgnaW5zaWRlcicsIFtcbiAgICAnaW9uaWMnLFxuICAgICdpbnNpZGVyLnNlcnZpY2VzJyxcbiAgICAnaW5zaWRlci5jb250cm9sbGVycycsXG4gICAgJ25nQ29yZG92YScsXG4gICAgJ25nU3RvcmVraXQnXG4gIF0pXG4gIC5jb25zdGFudCgnbG9jJywge1xuICAgIC8vIGFwaUJhc2U6ICdodHRwOi8vbG9jYWxob3N0OjMwMDInXG4gICAgYXBpQmFzZTogJ2h0dHBzOi8vaW5zaWRlcmFpLmNvbSdcbiAgfSlcbiAgLmNvbmZpZyhmdW5jdGlvbigkc3RhdGVQcm92aWRlciwgJHVybFJvdXRlclByb3ZpZGVyKSB7XG4gICAgJHN0YXRlUHJvdmlkZXJcbiAgICAgIC5zdGF0ZSgncmVnaXN0ZXInLCB7XG4gICAgICAgIHVybDogJy9yZWdpc3RlcicsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAndGVtcGxhdGVzL3JlZ2lzdGVyLmh0bWwnLFxuICAgICAgICBjb250cm9sbGVyOiAnUmVnaXN0ZXJDdHJsJ1xuICAgICAgfSlcbiAgICAgIC5zdGF0ZSgnc3Vic2NyaWJlJywge1xuICAgICAgICB1cmw6ICcvc3Vic2NyaWJlJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICd0ZW1wbGF0ZXMvc3Vic2NyaWJlLmh0bWwnLFxuICAgICAgICBjb250cm9sbGVyOiAnU3Vic2NyaWJlQ3RybCdcbiAgICAgIH0pXG4gICAgICAuc3RhdGUoJ2xvZ2luJywge1xuICAgICAgICB1cmw6ICcvbG9naW4nLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ3RlbXBsYXRlcy9sb2dpbi5odG1sJyxcbiAgICAgICAgY29udHJvbGxlcjogJ0xvZ2luQ3RybCdcbiAgICAgIH0pXG4gICAgICAuc3RhdGUoJ2FwcCcsIHtcbiAgICAgICAgdXJsOiAnL2FwcCcsXG4gICAgICAgIGFic3RyYWN0OiB0cnVlLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ3RlbXBsYXRlcy9tZW51Lmh0bWwnLFxuICAgICAgICBjb250cm9sbGVyOiAnQXBwQ3RybCdcbiAgICAgIH0pXG4gICAgICAuc3RhdGUoJ2FwcC5mZWVkYmFjaycsIHtcbiAgICAgICAgdXJsOiAnL2ZlZWRiYWNrJyxcbiAgICAgICAgdmlld3M6IHtcbiAgICAgICAgICAnbWVudUNvbnRlbnQnOiB7XG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogJ3RlbXBsYXRlcy9mZWVkYmFjay5odG1sJyxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdGZWVkYmFja0N0cmwnXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KVxuICAgICAgLnN0YXRlKCdhcHAuYnV5cycsIHtcbiAgICAgICAgdXJsOiAnL2J1eXMnLFxuICAgICAgICB2aWV3czoge1xuICAgICAgICAgICdtZW51Q29udGVudCc6IHtcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAndGVtcGxhdGVzL2J1eXMuaHRtbCcsXG4gICAgICAgICAgICBjb250cm9sbGVyOiAnQnV5c0N0cmwnXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KVxuICAgICAgLnN0YXRlKCdhcHAudG9kYXknLCB7XG4gICAgICAgIHVybDogJy90b2RheScsXG4gICAgICAgIHZpZXdzOiB7XG4gICAgICAgICAgJ21lbnVDb250ZW50Jzoge1xuICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICd0ZW1wbGF0ZXMvdG9kYXkuaHRtbCcsXG4gICAgICAgICAgICBjb250cm9sbGVyOiAnVG9kYXlzQnV5c0N0cmwnXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KVxuICAgICAgLnN0YXRlKCdhcHAudHJhZGUnLCB7XG4gICAgICAgIHVybDogJy90cmFkZXMvOmlkJyxcbiAgICAgICAgdmlld3M6IHtcbiAgICAgICAgICAnbWVudUNvbnRlbnQnOiB7XG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogJ3RlbXBsYXRlcy90cmFkZS5odG1sJyxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdUcmFkZUN0cmwnXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KVxuICAgICAgLnN0YXRlKCdhcHAuaW5zaWRlcicsIHtcbiAgICAgICAgdXJsOiAnL2luc2lkZXJzLzppZCcsXG4gICAgICAgIHZpZXdzOiB7XG4gICAgICAgICAgJ21lbnVDb250ZW50Jzoge1xuICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICd0ZW1wbGF0ZXMvaW5zaWRlci5odG1sJyxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdJbnNpZGVyQ3RybCdcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgICAuc3RhdGUoJ2FwcC5mb3JtNCcsIHtcbiAgICAgICAgdXJsOiAnL2Zvcm00cy86aWQnLFxuICAgICAgICB2aWV3czoge1xuICAgICAgICAgICdtZW51Q29udGVudCc6IHtcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAndGVtcGxhdGVzL2Zvcm00Lmh0bWwnLFxuICAgICAgICAgICAgY29udHJvbGxlcjogJ0Zvcm00Q3RybCdcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgICAuc3RhdGUoJ2FwcC5jb21wYW55Jywge1xuICAgICAgICB1cmw6ICcvY29tcGFuaWVzLzppZCcsXG4gICAgICAgIHZpZXdzOiB7XG4gICAgICAgICAgJ21lbnVDb250ZW50Jzoge1xuICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICd0ZW1wbGF0ZXMvY29tcGFueS5odG1sJyxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdDb21wYW55Q3RybCdcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgICAuc3RhdGUoJ2FwcC5zZWFyY2gnLCB7XG4gICAgICAgIHVybDogJy9zZWFyY2gnLFxuICAgICAgICB2aWV3czoge1xuICAgICAgICAgICdtZW51Q29udGVudCc6IHtcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAndGVtcGxhdGVzL3NlYXJjaC5odG1sJyxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdTZWFyY2hDdHJsJ1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSlcbiAgICAgIC5zdGF0ZSgnYXBwLmRpc2NsYWltZXInLCB7XG4gICAgICAgIHVybDogJy9kaXNjbGFpbWVyJyxcbiAgICAgICAgdmlld3M6IHtcbiAgICAgICAgICAnbWVudUNvbnRlbnQnOiB7XG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogJ3RlbXBsYXRlcy9kaXNjbGFpbWVyLmh0bWwnLFxuICAgICAgICAgICAgY29udHJvbGxlcjogJ0Rpc2NsYWltZXJDdHJsJ1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgLy8gaWYgbm9uZSBvZiB0aGUgYWJvdmUgc3RhdGVzIGFyZSBtYXRjaGVkLCB1c2UgdGhpcyBhcyB0aGUgZmFsbGJhY2tcbiAgICAkdXJsUm91dGVyUHJvdmlkZXIub3RoZXJ3aXNlKCcvYXBwL2J1eXMnKTtcbiAgfSlcbiAgLmNvbmZpZyhbJyRodHRwUHJvdmlkZXInLCBmdW5jdGlvbigkaHR0cFByb3ZpZGVyKSB7XG4gICAgJGh0dHBQcm92aWRlci5kZWZhdWx0cy53aXRoQ3JlZGVudGlhbHMgPSB0cnVlO1xuICAgICRodHRwUHJvdmlkZXIuaW50ZXJjZXB0b3JzLnB1c2goJ2F1dGhIdHRwUmVzcG9uc2VJbnRlcmNlcHRvcicpO1xuICB9XSlcbiAgLnJ1bihmdW5jdGlvbigkc3RhdGUsICRpb25pY1BsYXRmb3JtLCAkY29yZG92YVB1c2gsICRyb290U2NvcGUsICRzdG9yZWtpdCkge1xuICAgICRpb25pY1BsYXRmb3JtLnJlYWR5KGZ1bmN0aW9uKCkge1xuICAgICAgJHN0b3Jla2l0XG4gICAgICAgIC5zZXRMb2dnaW5nKHRydWUpXG4gICAgICAgIC5sb2FkKFsnY29tLmluc2lkZXJhaS5pb3MuaW5zaWRlcmFsZXJ0czEnXSlcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24ocHJvZHVjdHMpIHtcbiAgICAgICAgICAkcm9vdFNjb3BlLnByb2R1Y3RzID0gcHJvZHVjdHM7XG4gICAgICAgICAgY29uc29sZS5sb2cocHJvZHVjdHMpO1xuICAgICAgICAgIGNvbnNvbGUubG9nKCdwcm9kdWN0cyBsb2FkZWQnKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICRyb290U2NvcGUucHJvZHVjdHMgPSBbXTtcbiAgICAgICAgICBjb25zb2xlLmxvZygncHJvZHVjdCBsb2FkIGVycm9yJywgYXJndW1lbnRzKTtcbiAgICAgICAgfSk7XG5cbiAgICAgIC8vIEhpZGUgdGhlIGFjY2Vzc29yeSBiYXIgYnkgZGVmYXVsdCAocmVtb3ZlIHRoaXMgdG8gc2hvdyB0aGUgYWNjZXNzb3J5IGJhciBhYm92ZSB0aGUga2V5Ym9hcmRcbiAgICAgIC8vIGZvciBmb3JtIGlucHV0cylcbiAgICAgIGlmICh3aW5kb3cuY29yZG92YSAmJiB3aW5kb3cuY29yZG92YS5wbHVnaW5zLktleWJvYXJkKSB7XG4gICAgICAgIGNvcmRvdmEucGx1Z2lucy5LZXlib2FyZC5oaWRlS2V5Ym9hcmRBY2Nlc3NvcnlCYXIodHJ1ZSk7XG4gICAgICB9XG5cbiAgICAgIGlmICh3aW5kb3cuU3RhdHVzQmFyKSB7XG4gICAgICAgIC8vIG9yZy5hcGFjaGUuY29yZG92YS5zdGF0dXNiYXIgcmVxdWlyZWRcbiAgICAgICAgd2luZG93LlN0YXR1c0Jhci5zdHlsZUxpZ2h0Q29udGVudCgpO1xuICAgICAgfVxuXG4gICAgICB2YXIgaW9zQ29uZmlnID0ge1xuICAgICAgICBcImJhZGdlXCI6IFwidHJ1ZVwiLFxuICAgICAgICBcInNvdW5kXCI6IFwidHJ1ZVwiLFxuICAgICAgICBcImFsZXJ0XCI6IFwidHJ1ZVwiLFxuICAgICAgICBcImVjYlwiOiBcIm9uTm90aWZpY2F0aW9uQVBOXCJcbiAgICAgIH07XG5cbiAgICAgIGlmICh3aW5kb3cuY29yZG92YSkge1xuICAgICAgICAkY29yZG92YVB1c2gucmVnaXN0ZXIoaW9zQ29uZmlnKS50aGVuKGZ1bmN0aW9uKHJlc3VsdCkge1xuICAgICAgICAgICRyb290U2NvcGUuZGV2aWNlVG9rZW4gPSByZXN1bHQ7XG4gICAgICAgIH0sIGZ1bmN0aW9uKGVycikge1xuICAgICAgICAgIGNvbnNvbGUubG9nKFwibm90IGFibGUgdG8gc2VuZCBwdXNoXCIsIGVycik7XG4gICAgICAgIH0pO1xuICAgICAgICAvLyAkY29yZG92YVB1c2gudW5yZWdpc3RlcihvcHRpb25zKS50aGVuKGZ1bmN0aW9uKHJlc3VsdCkge1xuICAgICAgICAvLyAgIGFsZXJ0KFwidW5yZWdpc3RlclwiKTtcbiAgICAgICAgLy8gICBhbGVydChyZXN1bHQpO1xuICAgICAgICAvLyAgIGFsZXJ0KGFyZ3VtZW50cyk7XG4gICAgICAgIC8vICAgICAvLyBTdWNjZXNzIVxuICAgICAgICAvLyB9LCBmdW5jdGlvbihlcnIpIHtcbiAgICAgICAgLy8gICBhbGVydChcImVycm9yXCIpO1xuICAgICAgICAvLyAgIGFsZXJ0KGVycik7XG4gICAgICAgIC8vICAgICAvLyBBbiBlcnJvciBvY2N1cmVkLiBTaG93IGEgbWVzc2FnZSB0byB0aGUgdXNlclxuICAgICAgICAvLyB9KTtcbiAgICAgICAgLy9cbiAgICAgICAgLy8gLy8gaU9TIG9ubHlcblxuICAgICAgICB3aW5kb3cub25Ob3RpZmljYXRpb25BUE4gPSBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coJ29uIG5vdGlmaWNhdGlvbjonLCBlKTtcbiAgICAgICAgICBpZiAoZS5hbGVydCkge1xuICAgICAgICAgICAgJHN0YXRlLmdvKCdhcHAudHJhZGUnLCB7XG4gICAgICAgICAgICAgIGlkOiBlLmlkZWFfaWRcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChlLnNvdW5kKSB7XG4gICAgICAgICAgICB2YXIgc25kID0gbmV3IE1lZGlhKGUuc291bmQpO1xuICAgICAgICAgICAgc25kLnBsYXkoKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoZS5iYWRnZSkge1xuICAgICAgICAgICAgJGNvcmRvdmFQdXNoLnNldEJhZGdlTnVtYmVyKGUuYmFkZ2UpLnRoZW4oZnVuY3Rpb24ocmVzdWx0KSB7XG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKHJlc3VsdCk7XG4gICAgICAgICAgICB9LCBmdW5jdGlvbihlcnIpIHtcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coZXJyKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfSk7XG4iLCJhbmd1bGFyLm1vZHVsZSgnaW5zaWRlci5zZXJ2aWNlcycsIFtdKVxuICAuZmFjdG9yeSgnYXV0aEh0dHBSZXNwb25zZUludGVyY2VwdG9yJywgWyckcScsICckbG9jYXRpb24nLFxuICAgIGZ1bmN0aW9uICgkcSwgJGxvY2F0aW9uKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICByZXNwb25zZUVycm9yOiBmdW5jdGlvbiAocmVqZWN0aW9uKSB7XG4gICAgICAgICAgaWYgKHJlamVjdGlvbi5zdGF0dXMgPT09IDQwMSkge1xuICAgICAgICAgICAgJGxvY2F0aW9uLnBhdGgoJy9sb2dpbicpO1xuICAgICAgICAgICAgcmV0dXJuICRxLnJlamVjdChyZWplY3Rpb24pO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAocmVqZWN0aW9uLnN0YXR1cyA9PT0gNDAzKSB7XG4gICAgICAgICAgICAkbG9jYXRpb24ucGF0aCgnL3N1YnNjcmliZScpO1xuICAgICAgICAgICAgcmV0dXJuICRxLnJlamVjdChyZWplY3Rpb24pO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gJHEucmVqZWN0KHJlamVjdGlvbik7XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgfVxuICBdKTtcbiIsIi8qZ2xvYmFscyBhbmd1bGFyLCBfICovXG5hbmd1bGFyLm1vZHVsZSgnaW5zaWRlci5zZXJ2aWNlcycpXG4gIC5mYWN0b3J5KCdDb21wYW55U2VydmljZScsIGZ1bmN0aW9uKGxvYywgJHEsICRodHRwKSB7XG4gICAgZnVuY3Rpb24gdXJsKGlkKSB7XG4gICAgIGlmKGlkKSB7XG4gICAgICAgIHJldHVybiBsb2MuYXBpQmFzZSArICcvYXBpL3YxL2NvbXBhbmllcy8nICsgaWQgKyAnLmpzb24nO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGxvYy5hcGlCYXNlICsgJy9hcGkvdjEvY29tcGFuaWVzLmpzb24nO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICBmaW5kQnlJZDogZnVuY3Rpb24gKGlkKSB7XG4gICAgICAgIHZhciBkZWZlcnJlZCA9ICRxLmRlZmVyKCk7XG4gICAgICAgICRodHRwLmdldCh1cmwoaWQpKS50aGVuKGZ1bmN0aW9uIChyZXNwKSB7XG4gICAgICAgICAgZGVmZXJyZWQucmVzb2x2ZShyZXNwLmRhdGEpO1xuICAgICAgICB9LCBmdW5jdGlvbiAocmVzcCkge1xuICAgICAgICAgIGRlZmVycmVkLnJlamVjdChyZXNwLmRhdGEpO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG4gICAgICB9LFxuICAgIH07XG4gIH0pO1xuXG4iLCIvKmdsb2JhbHMgYW5ndWxhciwgXyAqL1xuYW5ndWxhci5tb2R1bGUoJ2luc2lkZXIuc2VydmljZXMnKVxuICAuZmFjdG9yeSgnRmVlZGJhY2tTZXJ2aWNlJywgZnVuY3Rpb24obG9jLCAkaHR0cCkge1xuICAgIGZ1bmN0aW9uIHVybCgpIHtcbiAgICAgIHJldHVybiBsb2MuYXBpQmFzZSArICcvYXBpL3YyL2ZlZWRiYWNrcyc7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIHN1Ym1pdEZlZWRiYWNrOiBmdW5jdGlvbiAoZmVlZGJhY2tQYXJhbXMpIHtcbiAgICAgICAgcmV0dXJuICRodHRwLnBvc3QodXJsKCksIGZlZWRiYWNrUGFyYW1zKTtcbiAgICAgIH1cbiAgICB9O1xuICB9KTtcbiIsIi8qZ2xvYmFscyBhbmd1bGFyLCBfICovXG5hbmd1bGFyLm1vZHVsZSgnaW5zaWRlci5zZXJ2aWNlcycpXG4gIC5mYWN0b3J5KCdGb3JtNFNlcnZpY2UnLCBmdW5jdGlvbihsb2MsICRxLCAkaHR0cCkge1xuICAgIGZ1bmN0aW9uIHVybChpZCkge1xuICAgICBpZihpZCkge1xuICAgICAgICByZXR1cm4gbG9jLmFwaUJhc2UgKyAnL2FwaS92MS9mb3JtNHMvJyArIGlkICsgJy5qc29uJztcbiAgICAgIH1cbiAgICAgIHJldHVybiBsb2MuYXBpQmFzZSArICcvYXBpL3YxL2Zvcm00cy5qc29uJztcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgZmluZEJ5SWQ6IGZ1bmN0aW9uIChpZCkge1xuICAgICAgICB2YXIgZGVmZXJyZWQgPSAkcS5kZWZlcigpO1xuICAgICAgICAkaHR0cC5nZXQodXJsKGlkKSkudGhlbihmdW5jdGlvbiAocmVzcCkge1xuICAgICAgICAgIHZhciBmaWxpbmcgPSByZXNwLmRhdGE7XG4gICAgICAgICAgdmFyIGRvYyA9IEpTT04ucGFyc2UocmVzcC5kYXRhLmZpbGluZyk7XG4gICAgICAgICAgZmlsaW5nLm5vbkRlcml2YXRpdmVUcmFuc2FjdGlvbnMgPSBkb2MudHJhbnNhY3Rpb25zO1xuICAgICAgICAgIGZpbGluZy5kZXJpdmF0aXZlVHJhbnNhY3Rpb25zID0gZG9jLmRlcml2YXRpdmVfdHJhbnNhY3Rpb25zO1xuICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUoZmlsaW5nKTtcbiAgICAgICAgfSwgZnVuY3Rpb24gKHJlc3ApIHtcbiAgICAgICAgICBkZWZlcnJlZC5yZWplY3QocmVzcC5kYXRhKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xuICAgICAgfSxcbiAgICB9O1xuICB9KTtcbiIsIi8qZ2xvYmFscyBhbmd1bGFyLCBfICovXG5hbmd1bGFyLm1vZHVsZSgnaW5zaWRlci5zZXJ2aWNlcycpXG4gIC5mYWN0b3J5KCdCdXlJZGVhU2VydmljZScsIGZ1bmN0aW9uKGxvYywgJHEsICRodHRwKSB7XG4gICAgZnVuY3Rpb24gdXJsKGlkKSB7XG4gICAgICBpZihpZCkge1xuICAgICAgICByZXR1cm4gbG9jLmFwaUJhc2UgKyAnL2FwaS92Mi9idXlzLycgKyBpZCArICcuanNvbic7XG4gICAgICB9XG4gICAgICByZXR1cm4gbG9jLmFwaUJhc2UgKyAnL2FwaS92Mi9idXlzLmpzb24nO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICBmaW5kQWxsOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBkZWZlcnJlZCA9ICRxLmRlZmVyKCk7XG4gICAgICAgICRodHRwLmdldCh1cmwoKSwgeyBjYWNoZTogdHJ1ZSB9KVxuICAgICAgICAgIC50aGVuKGZ1bmN0aW9uIChyZXNwKSB7XG4gICAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKHJlc3AuZGF0YSk7XG4gICAgICAgICAgfSwgZnVuY3Rpb24gKHJlc3ApIHtcbiAgICAgICAgICAgIGRlZmVycmVkLnJlamVjdChyZXNwLmRhdGEpO1xuICAgICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbiAgICAgIH0sXG5cbiAgICAgIGZpbmRCeUlkOiBmdW5jdGlvbiAoaWQpIHtcbiAgICAgICAgdmFyIGRlZmVycmVkID0gJHEuZGVmZXIoKTtcbiAgICAgICAgJGh0dHAuZ2V0KHVybChpZCksIHsgY2FjaGU6IHRydWUgfSlcbiAgICAgICAgICAudGhlbihmdW5jdGlvbiAocmVzcCkge1xuICAgICAgICAgICAgZGVmZXJyZWQucmVzb2x2ZShyZXNwLmRhdGEpO1xuICAgICAgICAgIH0sIGZ1bmN0aW9uIChyZXNwKSB7XG4gICAgICAgICAgICBkZWZlcnJlZC5yZWplY3QocmVzcC5kYXRhKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG4gICAgICB9LFxuXG4gICAgICBmaW5kVG9kYXlzOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBkZWZlcnJlZCA9ICRxLmRlZmVyKCk7XG4gICAgICAgICRodHRwLmdldCh1cmwoKSwgeyBwYXJhbXM6IHsgJ3RvZGF5JzogdHJ1ZSB9LCBjYWNoZTogdHJ1ZSB9KVxuICAgICAgICAgIC50aGVuKGZ1bmN0aW9uIChyZXNwKSB7XG4gICAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKHJlc3AuZGF0YSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xuICAgICAgfVxuICAgIH07XG4gIH0pO1xuIiwiLypnbG9iYWxzIGFuZ3VsYXIsIF8gKi9cbmFuZ3VsYXIubW9kdWxlKCdpbnNpZGVyLnNlcnZpY2VzJylcbiAgLmZhY3RvcnkoJ0luc2lkZXJTZXJ2aWNlJywgZnVuY3Rpb24obG9jLCAkcSwgJGh0dHApIHtcbiAgICBmdW5jdGlvbiB1cmwoaWQpIHtcbiAgICAgaWYoaWQpIHtcbiAgICAgICAgcmV0dXJuIGxvYy5hcGlCYXNlICsgJy9hcGkvdjEvaW5zaWRlcnMvJyArIGlkICsgJy5qc29uJztcbiAgICAgIH1cbiAgICAgIHJldHVybiBsb2MuYXBpQmFzZSArICcvYXBpL3YxL2luc2lkZXJzLmpzb24nO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICBmaW5kQnlJZDogZnVuY3Rpb24gKGlkKSB7XG4gICAgICAgIHZhciBkZWZlcnJlZCA9ICRxLmRlZmVyKCk7XG4gICAgICAgICRodHRwLmdldCh1cmwoaWQpKS50aGVuKGZ1bmN0aW9uIChyZXNwKSB7XG4gICAgICAgICAgZGVmZXJyZWQucmVzb2x2ZShyZXNwLmRhdGEpO1xuICAgICAgICB9LCBmdW5jdGlvbiAocmVzcCkge1xuICAgICAgICAgIGRlZmVycmVkLnJlamVjdChyZXNwLmRhdGEpO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG4gICAgICB9LFxuICAgIH07XG4gIH0pO1xuIiwiLypnbG9iYWxzIGFuZ3VsYXIsIF8gKi9cbmFuZ3VsYXIubW9kdWxlKCdpbnNpZGVyLnNlcnZpY2VzJylcbiAgLmZhY3RvcnkoJ0xvZ2luU2VydmljZScsIGZ1bmN0aW9uKGxvYywgJGh0dHApIHtcbiAgICBmdW5jdGlvbiB1cmwoKSB7XG4gICAgICByZXR1cm4gbG9jLmFwaUJhc2UgKyAnL2FwaS92Mi9zZXNzaW9uJztcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgbG9naW46IGZ1bmN0aW9uICh1c2VyUGFyYW1zKSB7XG4gICAgICAgIHJldHVybiAkaHR0cC5wb3N0KHVybCgpLCB1c2VyUGFyYW1zKTtcbiAgICAgIH1cbiAgICB9O1xuICB9KTtcbiIsIi8qZ2xvYmFscyBhbmd1bGFyLCBfICovXG5hbmd1bGFyLm1vZHVsZSgnaW5zaWRlci5zZXJ2aWNlcycpXG4gIC5mYWN0b3J5KCdSZWdpc3RlclNlcnZpY2UnLCBmdW5jdGlvbihsb2MsICRodHRwKSB7XG4gICAgZnVuY3Rpb24gdXJsKCkge1xuICAgICAgcmV0dXJuIGxvYy5hcGlCYXNlICsgJy9hcGkvdjIvdXNlcnMnO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICByZWdpc3RlcjogZnVuY3Rpb24gKHVzZXJQYXJhbXMpIHtcbiAgICAgICAgdXNlclBhcmFtcy5wbGF0Zm9ybSA9ICdpb3MnO1xuICAgICAgICByZXR1cm4gJGh0dHAucG9zdCh1cmwoKSwgdXNlclBhcmFtcyk7XG4gICAgICB9XG4gICAgfTtcbiAgfSk7XG4iLCIvKmdsb2JhbHMgYW5ndWxhciwgXyAqL1xuYW5ndWxhci5tb2R1bGUoJ2luc2lkZXIuc2VydmljZXMnKVxuICAuZmFjdG9yeSgnU2VhcmNoU2VydmljZScsIGZ1bmN0aW9uKGxvYywgJGh0dHApIHtcbiAgICBmdW5jdGlvbiB1cmwocSkge1xuICAgICAgcmV0dXJuIGxvYy5hcGlCYXNlICsgJy9hcGkvdjEvc2VhcmNoP3E9JyArIHE7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIHNlYXJjaDogZnVuY3Rpb24gKGtleXdvcmQpIHtcbiAgICAgICAgcmV0dXJuICRodHRwLmdldCh1cmwoa2V5d29yZCksIHsgY2FjaGU6IHRydWUgfSk7XG4gICAgICB9XG4gICAgfTtcbiAgfSk7XG4iLCIvKmdsb2JhbHMgYW5ndWxhciwgXyAqL1xuYW5ndWxhci5tb2R1bGUoJ2luc2lkZXIuc2VydmljZXMnKVxuICAuZmFjdG9yeSgnU3Vic2NyaWJlU2VydmljZScsIGZ1bmN0aW9uKGxvYywgJGh0dHAsICRzdG9yZWtpdCkge1xuICAgIGZ1bmN0aW9uIHVybCgpIHtcbiAgICAgIHJldHVybiBsb2MuYXBpQmFzZSArICcvYXBpL3YyL3N1YnNjcmlwdGlvbnMnO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICBzdWJzY3JpYmU6IGZ1bmN0aW9uIChwcm9kdWN0KSB7XG4gICAgICAgICRzdG9yZWtpdC5wdXJjaGFzZShwcm9kdWN0LmlkKTtcbiAgICAgICAgcmV0dXJuICRodHRwLnBvc3QodXJsKCksIHtcbiAgICAgICAgICBwcm9kdWN0X25hbWU6IHByb2R1Y3QuaWQsXG4gICAgICAgICAgcHJpY2U6IHByb2R1Y3QucHJpY2VcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfTtcbiAgfSk7XG4iLCIvKmdsb2JhbHMgYW5ndWxhciwgd2luZG93LCBkb2N1bWVudCAqL1xuYW5ndWxhci5tb2R1bGUoJ2luc2lkZXIuY29udHJvbGxlcnMnLCBbXSlcbiAgLmNvbnRyb2xsZXIoJ0FwcEN0cmwnLCBmdW5jdGlvbigkdGltZW91dCwgJGlvbmljTG9hZGluZywgJHEsICRzY29wZSwgJGlvbmljTW9kYWwsICRyb290U2NvcGUsICRzdG9yZWtpdCkge1xuICAgICRzdG9yZWtpdFxuICAgICAgLndhdGNoUHVyY2hhc2VzKClcbiAgICAgIC50aGVuKGZ1bmN0aW9uKCkge1xuICAgICAgICAvLyBOb3QgY3VycmVudGx5IHVzZWRcbiAgICAgIH0sIGZ1bmN0aW9uKGVycm9yKSB7XG4gICAgICAgIC8vIEFuIGVycm9yIG9jY3VyZWQuIFNob3cgYSBtZXNzYWdlIHRvIHRoZSB1c2VyXG4gICAgICB9LCBmdW5jdGlvbihwdXJjaGFzZSkge1xuICAgICAgICBpZiAocHVyY2hhc2UucHJvZHVjdElkID09PSAnY29tLmluc2lkZXJhaS5pb3MuaW5zaWRlcmFsZXJ0czEnKSB7XG4gICAgICAgICAgaWYgKHB1cmNoYXNlLnR5cGUgPT09ICdwdXJjaGFzZScpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdwdXJjaGFzZWQhJyk7XG4gICAgICAgICAgICAvLyBZb3VyIHByb2R1Y3Qgd2FzIHB1cmNoYXNlZFxuICAgICAgICAgIH0gZWxzZSBpZiAocHVyY2hhc2UudHlwZSA9PT0gJ3Jlc3RvcmUnKSB7XG4gICAgICAgICAgICAvLyBZb3VyIHByb2R1Y3Qgd2FzIHJlc3RvcmVkXG4gICAgICAgICAgICBjb25zb2xlLmxvZygncmVzdG9yZWQhJyk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGNvbnNvbGUubG9nKHB1cmNoYXNlLnRyYW5zYWN0aW9uSWQpO1xuICAgICAgICAgIGNvbnNvbGUubG9nKHB1cmNoYXNlLnByb2R1Y3RJZCk7XG4gICAgICAgICAgY29uc29sZS5sb2cocHVyY2hhc2UudHJhbnNhY3Rpb25SZWNlaXB0KTtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cblxuICAgICRzY29wZS5yZXRyeVdpdGhQcm9taXNlID0gZnVuY3Rpb24ocHJvbWlzZSwgYXJncywgbWF4VHJpZXMsIGNvbnRleHQsIGRlZmVycmVkKSB7XG4gICAgICBkZWZlcnJlZCA9IGRlZmVycmVkIHx8ICRxLmRlZmVyKCk7XG4gICAgICBjb250ZXh0ID0gY29udGV4dCB8fCBudWxsO1xuXG4gICAgICAkc2NvcGUubG9hZGluZyA9IHRydWU7XG4gICAgICAkaW9uaWNMb2FkaW5nLnNob3coe1xuICAgICAgICB0ZW1wbGF0ZTogXCI8aSBjbGFzcz0naW9uLWxvYWRpbmctZCc+PC9pPlwiXG4gICAgICB9KTtcblxuICAgICAgcHJvbWlzZS5hcHBseShjb250ZXh0LCBhcmdzKVxuICAgICAgICAudGhlbihmdW5jdGlvbihkKSB7XG4gICAgICAgICAgJHNjb3BlLmxvYWRpbmcgPSBmYWxzZTtcbiAgICAgICAgICAkaW9uaWNMb2FkaW5nLmhpZGUoKTtcbiAgICAgICAgICByZXR1cm4gZGVmZXJyZWQucmVzb2x2ZShkKTtcbiAgICAgICAgfSwgZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgICAgaWYgKG1heFRyaWVzID09PSAtMSB8fCBlcnIuc3RhdHVzID09IDQwMSB8fCBlcnIuc3RhdHVzID09IDQwMykge1xuICAgICAgICAgICAgJGlvbmljTG9hZGluZy5oaWRlKCk7XG4gICAgICAgICAgICAkc2NvcGUubG9hZGluZyA9IGZhbHNlO1xuICAgICAgICAgICAgcmV0dXJuIGRlZmVycmVkLnJlamVjdChlcnIpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAkdGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgJHNjb3BlLnJldHJ5V2l0aFByb21pc2UocHJvbWlzZSwgYXJncywgbWF4VHJpZXMgLSAxLCBjb250ZXh0LCBkZWZlcnJlZCk7XG4gICAgICAgICAgICB9LCAyMDAwKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG4gICAgfTtcblxuICAgICRzY29wZS5yZXRyeVdpdGhQcm9taXNlUHVsbFRvUmVmcmVzaCA9IGZ1bmN0aW9uKHByb21pc2UsIGFyZ3MsIG1heFRyaWVzLCBjb250ZXh0LCBkZWZlcnJlZCkge1xuICAgICAgZGVmZXJyZWQgPSBkZWZlcnJlZCB8fCAkcS5kZWZlcigpO1xuICAgICAgY29udGV4dCA9IGNvbnRleHQgfHwgbnVsbDtcblxuICAgICAgJHNjb3BlLmxvYWRpbmcgPSB0cnVlO1xuICAgICAgcHJvbWlzZS5hcHBseShjb250ZXh0LCBhcmdzKVxuICAgICAgICAudGhlbihmdW5jdGlvbihkKSB7XG4gICAgICAgICAgJHNjb3BlLmxvYWRpbmcgPSBmYWxzZTtcbiAgICAgICAgICAkc2NvcGUuJGJyb2FkY2FzdCgnc2Nyb2xsLnJlZnJlc2hDb21wbGV0ZScpO1xuICAgICAgICAgIHJldHVybiBkZWZlcnJlZC5yZXNvbHZlKGQpO1xuICAgICAgICB9LCBmdW5jdGlvbihlcnIpIHtcbiAgICAgICAgICBpZiAobWF4VHJpZXMgPT09IC0xIHx8IGVyci5zdGF0dXMgPT0gNDAxIHx8IGVyci5zdGF0dXMgPT0gNDAzKSB7XG4gICAgICAgICAgICAkc2NvcGUuJGJyb2FkY2FzdCgnc2Nyb2xsLnJlZnJlc2hDb21wbGV0ZScpO1xuICAgICAgICAgICAgJHNjb3BlLmxvYWRpbmcgPSBmYWxzZTtcbiAgICAgICAgICAgIHJldHVybiBkZWZlcnJlZC5yZWplY3QoZXJyKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgJHRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICRzY29wZS5yZXRyeVdpdGhQcm9taXNlKHByb21pc2UsIGFyZ3MsIG1heFRyaWVzIC0gMSwgY29udGV4dCwgZGVmZXJyZWQpO1xuICAgICAgICAgICAgfSwgMjAwMCk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xuICAgIH07XG4gIH0pO1xuIiwiLypnbG9iYWxzIGFuZ3VsYXIsIHdpbmRvdyAqL1xuIGFuZ3VsYXIubW9kdWxlKCdpbnNpZGVyLmNvbnRyb2xsZXJzJylcbiAgLmNvbnRyb2xsZXIoJ0J1eXNDdHJsJywgZnVuY3Rpb24gKCRjYWNoZUZhY3RvcnksICRzdGF0ZSwgJHNjb3BlLCBsb2MsIEJ1eUlkZWFTZXJ2aWNlKSB7XG4gICAgdmFyIGxvYWRSZW1vdGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAkc2NvcGUucmV0cnlXaXRoUHJvbWlzZVB1bGxUb1JlZnJlc2goQnV5SWRlYVNlcnZpY2UuZmluZEFsbCwgW10sIDMsIHRoaXMpXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uICh0cmFkZXMpIHtcbiAgICAgICAgICAkc2NvcGUudHJhZGVzID0gdHJhZGVzO1xuICAgICAgICB9LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgLy8gVE9ETzogc2hvdyBubyB0cmFkZXMgZm91bmQgdGhpbmdcbiAgICAgICAgICAkc2NvcGUudHJhZGVzID0gW107XG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgbG9hZFJlbW90ZSgpO1xuXG4gICAgJHNjb3BlLnJlZnJlc2ggPSBmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgY2FjaGUgPSAkY2FjaGVGYWN0b3J5LmdldCgnJGh0dHAnKTtcbiAgICAgIGNhY2hlLnJlbW92ZShsb2MuYXBpQmFzZSArICcvYXBpL3YyL2J1eXMuanNvbicpO1xuICAgICAgbG9hZFJlbW90ZSgpO1xuICAgIH07XG5cbiAgICAkc2NvcGUuc2hvd1RyYWRlID0gZnVuY3Rpb24gKGlkKSB7XG4gICAgICAkc3RhdGUuZ28oJ2FwcC50cmFkZScsIHtcbiAgICAgICAgaWQ6IGlkXG4gICAgICB9KTtcbiAgICB9O1xuXG4gICAgJHNjb3BlLiRvbignYXV0aGNoYW5nZScsIGZ1bmN0aW9uICgpIHtcbiAgICAgICRzY29wZS5yZWZyZXNoKCk7XG4gICAgfSk7XG4gIH0pO1xuIiwiLypnbG9iYWxzIGFuZ3VsYXIsIHdpbmRvdyAqL1xuYW5ndWxhci5tb2R1bGUoJ2luc2lkZXIuY29udHJvbGxlcnMnKVxuICAuY29udHJvbGxlcignQ29tcGFueUN0cmwnLCBmdW5jdGlvbiAoJHN0YXRlLCAkc2NvcGUsICRzdGF0ZVBhcmFtcywgQ29tcGFueVNlcnZpY2UpIHtcbiAgICAkc2NvcGUuc2hvd1RyYWRlcyA9IHRydWU7XG5cbiAgICAkc2NvcGUucmVmcmVzaCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICRzY29wZS5yZXRyeVdpdGhQcm9taXNlKENvbXBhbnlTZXJ2aWNlLmZpbmRCeUlkLCBbJHN0YXRlUGFyYW1zLmlkXSwgMywgdGhpcylcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24gKGNvbXBhbnlEYXRhKSB7XG4gICAgICAgICAgJHNjb3BlLmNvbXBhbnkgPSBjb21wYW55RGF0YTtcbiAgICAgICAgfSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgIGNvbnNvbGUubG9nKFwic2FkIGZhY2VcIik7XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICAkc2NvcGUucmVmcmVzaCgpO1xuXG4gICAgJHNjb3BlLmdvVG9JbnNpZGVyID0gZnVuY3Rpb24gKGluc2lkZXIpIHtcbiAgICAgICRzdGF0ZS5nbygnYXBwLmluc2lkZXInLCB7XG4gICAgICAgIGlkOiBpbnNpZGVyLmlkXG4gICAgICB9KTtcbiAgICB9O1xuXG4gICAgJHNjb3BlLmdvVG9Gb3JtNCA9IGZ1bmN0aW9uIChmb3JtNCkge1xuICAgICAgJHN0YXRlLmdvKCdhcHAuZm9ybTQnLCB7XG4gICAgICAgIGlkOiBmb3JtNC5pZFxuICAgICAgfSk7XG4gICAgfTtcbiAgfSk7XG4iLCIvKmdsb2JhbHMgYW5ndWxhciwgd2luZG93ICovXG4gYW5ndWxhci5tb2R1bGUoJ2luc2lkZXIuY29udHJvbGxlcnMnKVxuICAuY29udHJvbGxlcignRGlzY2xhaW1lckN0cmwnLCBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuO1xuICB9KTtcbiIsIi8qZ2xvYmFscyBhbmd1bGFyLCB3aW5kb3cgKi9cbiBhbmd1bGFyLm1vZHVsZSgnaW5zaWRlci5jb250cm9sbGVycycpXG4gIC5jb250cm9sbGVyKCdGZWVkYmFja0N0cmwnLCBmdW5jdGlvbiAoJHNjb3BlLCAkbG9jYXRpb24sIEZlZWRiYWNrU2VydmljZSkge1xuICAgICRzY29wZS5mZWVkYmFjayA9IHt9O1xuXG4gICAgJHNjb3BlLnN1Ym1pdEZlZWRiYWNrID0gZnVuY3Rpb24gKCkge1xuICAgICAgRmVlZGJhY2tTZXJ2aWNlLnN1Ym1pdEZlZWRiYWNrKCRzY29wZS5mZWVkYmFjayk7XG4gICAgICAkbG9jYXRpb24ucGF0aChcIi9cIik7XG4gICAgfTtcblxuICAgIHJldHVybjtcbiAgfSk7XG4iLCIvKmdsb2JhbHMgYW5ndWxhciwgd2luZG93ICovXG5hbmd1bGFyLm1vZHVsZSgnaW5zaWRlci5jb250cm9sbGVycycpXG4gIC5jb250cm9sbGVyKCdGb3JtNEN0cmwnLCBmdW5jdGlvbiAoJHNjb3BlLCAkc3RhdGVQYXJhbXMsIEZvcm00U2VydmljZSkge1xuICAgICRzY29wZS5yZWZyZXNoID0gZnVuY3Rpb24gKCkge1xuICAgICAgJHNjb3BlLnJldHJ5V2l0aFByb21pc2UoRm9ybTRTZXJ2aWNlLmZpbmRCeUlkLCBbJHN0YXRlUGFyYW1zLmlkXSwgMywgdGhpcylcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24gKGZvcm00RGF0YSkge1xuICAgICAgICAgICRzY29wZS5mb3JtNCA9IGZvcm00RGF0YTtcbiAgICAgICAgfSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgIGNvbnNvbGUubG9nKFwic2FkIGZhY2VcIik7XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICAkc2NvcGUubmF2aWdhdGVUbyA9IGZ1bmN0aW9uICh1cmwpIHtcbiAgICAgIHdpbmRvdy5vcGVuKHVybCwgJ19ibGFuaycsICdsb2NhdGlvbj15ZXMnKTtcbiAgICB9O1xuXG4gICAgJHNjb3BlLnJlZnJlc2goKTtcbiAgfSk7XG4iLCIvKmdsb2JhbHMgYW5ndWxhciwgd2luZG93ICovXG5hbmd1bGFyLm1vZHVsZSgnaW5zaWRlci5jb250cm9sbGVycycpXG4gIC5jb250cm9sbGVyKCdJbnNpZGVyQ3RybCcsIGZ1bmN0aW9uICgkc3RhdGUsICRzY29wZSwgJHN0YXRlUGFyYW1zLCBJbnNpZGVyU2VydmljZSkge1xuICAgICRzY29wZS5zaG93VHJhZGVzID0gdHJ1ZTtcblxuICAgICRzY29wZS5yZWZyZXNoID0gZnVuY3Rpb24gKCkge1xuICAgICAgJHNjb3BlLnJldHJ5V2l0aFByb21pc2UoSW5zaWRlclNlcnZpY2UuZmluZEJ5SWQsIFskc3RhdGVQYXJhbXMuaWRdLCAzLCB0aGlzKVxuICAgICAgICAudGhlbihmdW5jdGlvbiAoaW5zaWRlckRhdGEpIHtcbiAgICAgICAgICAkc2NvcGUuaW5zaWRlciA9IGluc2lkZXJEYXRhO1xuICAgICAgICB9LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coXCJzYWQgZmFjZVwiKTtcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgICRzY29wZS5yZWZyZXNoKCk7XG5cbiAgICAkc2NvcGUuZ29Ub0NvbXBhbnkgPSBmdW5jdGlvbiAoY29tcGFueSkge1xuICAgICAgJHN0YXRlLmdvKCdhcHAuY29tcGFueScsIHtcbiAgICAgICAgaWQ6IGNvbXBhbnkuaWRcbiAgICAgIH0pO1xuICAgIH07XG4gICAgJHNjb3BlLmdvVG9Gb3JtNCA9IGZ1bmN0aW9uIChmb3JtNCkge1xuICAgICAgJHN0YXRlLmdvKCdhcHAuZm9ybTQnLCB7XG4gICAgICAgIGlkOiBmb3JtNC5pZFxuICAgICAgfSk7XG4gICAgfTtcbiAgfSk7XG4iLCJhbmd1bGFyLm1vZHVsZSgnaW5zaWRlci5jb250cm9sbGVycycpXG4gIC5jb250cm9sbGVyKCdMb2dpbkN0cmwnLCBmdW5jdGlvbiAoJHN0YXRlLCAkc2NvcGUsICRsb2NhdGlvbiwgTG9naW5TZXJ2aWNlKSB7XG4gICAgJHNjb3BlLnVzZXIgPSB7fTtcbiAgICAkc2NvcGUuZXJyb3JNZXNzYWdlID0gXCJcIjtcbiAgICAkc2NvcGUuZG9Mb2dpbiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICRzY29wZS5lcnJvck1lc3NhZ2UgPSAnJztcbiAgICAgIExvZ2luU2VydmljZS5sb2dpbigkc2NvcGUudXNlcikudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICRsb2NhdGlvbi5wYXRoKFwiL1wiKTtcbiAgICAgIH0sIGZ1bmN0aW9uIChyZXNwKSB7XG4gICAgICAgICRzY29wZS5lcnJvck1lc3NhZ2UgPSByZXNwLmRhdGEubWVzc2FnZTtcbiAgICAgIH0pO1xuICAgIH07XG4gIH0pO1xuIiwiYW5ndWxhci5tb2R1bGUoJ2luc2lkZXIuY29udHJvbGxlcnMnKVxuICAuY29udHJvbGxlcignUmVnaXN0ZXJDdHJsJywgZnVuY3Rpb24gKCRzdGF0ZSwgJHNjb3BlLCAkcm9vdFNjb3BlLCAkbG9jYXRpb24sIFJlZ2lzdGVyU2VydmljZSkge1xuICAgICRzY29wZS51c2VyID0geyBkZXZpY2VfdG9rZW46ICRyb290U2NvcGUuZGV2aWNlVG9rZW4gfTtcbiAgICAkc2NvcGUuZXJyb3JNZXNzYWdlID0gJyc7XG4gICAgJHNjb3BlLmRvUmVnaXN0ZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAkc2NvcGUuZXJyb3JNZXNzYWdlID0gJyc7XG4gICAgICBSZWdpc3RlclNlcnZpY2UucmVnaXN0ZXIoJHNjb3BlLnVzZXIpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAkbG9jYXRpb24ucGF0aChcIi9cIik7XG4gICAgICB9LCBmdW5jdGlvbiAocmVzcCkge1xuICAgICAgICB2YXIgZXJyb3JzID0gcmVzcC5kYXRhLmVycm9ycy5qb2luKFwiLCBcIik7XG4gICAgICAgIGNvbnNvbGUubG9nKGVycm9ycyk7XG4gICAgICAgICRzY29wZS5lcnJvck1lc3NhZ2UgPSBlcnJvcnM7XG4gICAgICB9KTtcbiAgICB9O1xuICB9KTtcbiIsIi8qZ2xvYmFscyBhbmd1bGFyLCB3aW5kb3cgKi9cbmFuZ3VsYXIubW9kdWxlKCdpbnNpZGVyLmNvbnRyb2xsZXJzJylcbiAgLmNvbnRyb2xsZXIoJ1NlYXJjaEN0cmwnLCBmdW5jdGlvbiAoJHN0YXRlLCAkc2NvcGUsIFNlYXJjaFNlcnZpY2UpIHtcbiAgICAkc2NvcGUua2V5d29yZCA9IFwiXCI7XG4gICAgJHNjb3BlLnJlc3VsdHMgPSBbXTtcbiAgICAkc2NvcGUuc2VhcmNoID0gZnVuY3Rpb24gKCkge1xuICAgICAgU2VhcmNoU2VydmljZS5zZWFyY2goJHNjb3BlLmtleXdvcmQpLnRoZW4oZnVuY3Rpb24gKHJlc3ApIHtcbiAgICAgICAgJHNjb3BlLnJlc3VsdHMgPSByZXNwLmRhdGE7XG4gICAgICB9KTtcbiAgICB9O1xuXG4gICAgJHNjb3BlLm9wZW5SZXN1bHQgPSBmdW5jdGlvbiAocmVzdWx0KSB7XG4gICAgICB2YXIgd2hlcmUgPSAocmVzdWx0WzFdID09PSAnSW5zaWRlcicpID8gJ2FwcC5pbnNpZGVyJyA6ICdhcHAuY29tcGFueSc7XG4gICAgICAkc3RhdGUuZ28od2hlcmUsIHtcbiAgICAgICAgaWQ6IHJlc3VsdFswXVxuICAgICAgfSk7XG4gICAgfTtcbiAgICAkc2NvcGUuc2VhcmNoKCk7XG4gIH0pO1xuIiwiYW5ndWxhci5tb2R1bGUoJ2luc2lkZXIuY29udHJvbGxlcnMnKVxuICAuY29udHJvbGxlcignU3Vic2NyaWJlQ3RybCcsIGZ1bmN0aW9uICgkc3RhdGUsICRzY29wZSwgJGxvY2F0aW9uLCBTdWJzY3JpYmVTZXJ2aWNlKSB7XG4gICAgJHNjb3BlLnVzZXIgPSB7fTtcbiAgICAkc2NvcGUuZXJyb3JNZXNzYWdlID0gXCJcIjtcblxuICAgICRzY29wZS5kb1N1YnNjcmliZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICRzY29wZS5lcnJvck1lc3NhZ2UgPSAnJztcbiAgICAgIGNvbnNvbGUubG9nKCdTdWJzY3JpYmluZycpO1xuICAgICAgU3Vic2NyaWJlU2VydmljZS5zdWJzY3JpYmUoJHNjb3BlLnByb2R1Y3RzWzBdKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgJGxvY2F0aW9uLnBhdGgoXCIvXCIpO1xuICAgICAgfSwgZnVuY3Rpb24gKHJlc3ApIHtcbiAgICAgICAgJHNjb3BlLmVycm9yTWVzc2FnZSA9IHJlc3AuZGF0YS5tZXNzYWdlO1xuICAgICAgfSk7XG4gICAgfTtcbiAgfSk7XG4iLCIvKmdsb2JhbHMgYW5ndWxhciwgd2luZG93ICovXG5hbmd1bGFyLm1vZHVsZSgnaW5zaWRlci5jb250cm9sbGVycycpXG4gLmNvbnRyb2xsZXIoJ1RvZGF5c0J1eXNDdHJsJywgZnVuY3Rpb24gKCRjYWNoZUZhY3RvcnksICRzdGF0ZSwgJHNjb3BlLCBsb2MsIEJ1eUlkZWFTZXJ2aWNlKSB7XG4gICAgJHNjb3BlLnRyYWRlcyA9IFtdO1xuXG4gICAgdmFyIGxvYWRSZW1vdGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAkc2NvcGUucmV0cnlXaXRoUHJvbWlzZVB1bGxUb1JlZnJlc2goQnV5SWRlYVNlcnZpY2UuZmluZFRvZGF5cywgW10sIDMsIHRoaXMpXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uICh0cmFkZXMpIHtcbiAgICAgICAgICAkc2NvcGUudHJhZGVzID0gdHJhZGVzO1xuICAgICAgICB9LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coXCJzYWQgZmFjZVwiKTtcbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICBsb2FkUmVtb3RlKCk7XG5cbiAgICAkc2NvcGUucmVmcmVzaCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciBjYWNoZSA9ICRjYWNoZUZhY3RvcnkuZ2V0KCckaHR0cCcpO1xuICAgICAgY2FjaGUucmVtb3ZlKGxvYy5hcGlCYXNlICsgJy9hcGkvdjIvYnV5cy5qc29uP3RvZGF5PXRydWUnKTtcbiAgICAgIGxvYWRSZW1vdGUoKTtcbiAgICB9O1xuXG4gICAgJHNjb3BlLnNob3dUcmFkZSA9IGZ1bmN0aW9uIChpZCkge1xuICAgICAgJHN0YXRlLmdvKCdhcHAudHJhZGUnLCB7XG4gICAgICAgIGlkOiBpZFxuICAgICAgfSk7XG4gICAgfTtcblxuICAgICRzY29wZS4kb24oJ2F1dGhjaGFuZ2UnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAkc2NvcGUucmVmcmVzaCgpO1xuICAgIH0pO1xuICB9KTtcblxuIiwiLypnbG9iYWxzIGFuZ3VsYXIsIHdpbmRvdywgZG9jdW1lbnQgKi9cbmFuZ3VsYXIubW9kdWxlKCdpbnNpZGVyLmNvbnRyb2xsZXJzJylcbiAgLmNvbnRyb2xsZXIoJ1RyYWRlQ3RybCcsIGZ1bmN0aW9uICgkc2NvcGUsICRzdGF0ZVBhcmFtcywgQnV5SWRlYVNlcnZpY2UpIHtcbiAgICAkc2NvcGUubmF2aWdhdGVUbyA9IGZ1bmN0aW9uICh1cmwpIHtcbiAgICAgIHdpbmRvdy5vcGVuKHVybCwgJ19ibGFuaycsICdsb2NhdGlvbj15ZXMnKTtcbiAgICB9O1xuXG4gICAgJHNjb3BlLnJlZnJlc2ggPSBmdW5jdGlvbiAoKSB7XG4gICAgICAkc2NvcGUucmV0cnlXaXRoUHJvbWlzZShCdXlJZGVhU2VydmljZS5maW5kQnlJZCwgWyRzdGF0ZVBhcmFtcy5pZF0sIDMsIHRoaXMpXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uICh0cmFkZSkge1xuICAgICAgICAgICRzY29wZS50cmFkZSA9IHRyYWRlO1xuICAgICAgICB9LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coXCJzYWQgZmFjZVwiKTtcbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICAkc2NvcGUucmVmcmVzaCgpO1xuICB9KTtcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
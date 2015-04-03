/*global window, cordova, angular */
var app = angular.module('insider', [
    'ionic',
    'insider.services',
    'insider.controllers',
    'ngCordova',
    'ngStorekit'
  ])
  .constant('loc', {
    apiBase: 'http://localhost:3002'
    // apiBase: 'https://insiderai.com'
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
        .load(['com.insiderai.ios.1yr'])
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
        if (purchase.productId === 'com.insiderai.ios.yr') {
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
  .controller('LoginCtrl', function ($state, $scope, $location, $window, LoginService) {
    $scope.user = {
      email: $window.localStorage.email
    };
    $scope.errorMessage = "";
    $scope.doLogin = function () {
      $scope.errorMessage = '';
      LoginService.login($scope.user).then(function () {
        $window.localStorage.email = $scope.user.email;
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImF1dGhfaHR0cF9yZXBvbnNlX2ludGVyY2VwdG9yLmpzIiwiY29tcGFueV9zZXJ2aWNlLmpzIiwiZmVlZGJhY2tfc2VydmljZS5qcyIsImZvcm00X3NlcnZpY2UuanMiLCJpZGVhX3NlcnZpY2UuanMiLCJpbnNpZGVyX3NlcnZpY2UuanMiLCJsb2dpbl9zZXJpdmNlLmpzIiwicmVnaXN0ZXJfc2VydmljZS5qcyIsInNlYXJjaF9zZXJpdmNlLmpzIiwic3Vic2NyaWJlX3NlcnZpY2UuanMiLCJhcHBfY29udHJvbGxlci5qcyIsImJ1eXNfY29udHJvbGxlci5qcyIsImNvbXBhbnlfY29udHJvbGxlci5qcyIsImRpc2NsYWltZXJfY29udHJvbGxlci5qcyIsImZlZWRiYWNrX2NvbnRyb2xsZXIuanMiLCJmb3JtNF9jb250cm9sbGVyLmpzIiwiaW5zaWRlcl9jb250cm9sbGVyLmpzIiwibG9naW5fY29udHJvbGxlci5qcyIsInJlZ2lzdGVyX2NvbnRyb2xsZXIuanMiLCJzZWFyY2hfY29udHJvbGxlci5qcyIsInN1YnNjcmliZV9jb250cm9sbGVyLmpzIiwidG9kYXlzX2J1eXNfY29udHJvbGxlci5qcyIsInRyYWRlX2NvbnRyb2xsZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3ZNQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2xCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDM0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN0QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNiQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDN0VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDOUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM1QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2xCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ25CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiYWxsLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLypnbG9iYWwgd2luZG93LCBjb3Jkb3ZhLCBhbmd1bGFyICovXG52YXIgYXBwID0gYW5ndWxhci5tb2R1bGUoJ2luc2lkZXInLCBbXG4gICAgJ2lvbmljJyxcbiAgICAnaW5zaWRlci5zZXJ2aWNlcycsXG4gICAgJ2luc2lkZXIuY29udHJvbGxlcnMnLFxuICAgICduZ0NvcmRvdmEnLFxuICAgICduZ1N0b3Jla2l0J1xuICBdKVxuICAuY29uc3RhbnQoJ2xvYycsIHtcbiAgICBhcGlCYXNlOiAnaHR0cDovL2xvY2FsaG9zdDozMDAyJ1xuICAgIC8vIGFwaUJhc2U6ICdodHRwczovL2luc2lkZXJhaS5jb20nXG4gIH0pXG4gIC5jb25maWcoZnVuY3Rpb24oJHN0YXRlUHJvdmlkZXIsICR1cmxSb3V0ZXJQcm92aWRlcikge1xuICAgICRzdGF0ZVByb3ZpZGVyXG4gICAgICAuc3RhdGUoJ3JlZ2lzdGVyJywge1xuICAgICAgICB1cmw6ICcvcmVnaXN0ZXInLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ3RlbXBsYXRlcy9yZWdpc3Rlci5odG1sJyxcbiAgICAgICAgY29udHJvbGxlcjogJ1JlZ2lzdGVyQ3RybCdcbiAgICAgIH0pXG4gICAgICAuc3RhdGUoJ3N1YnNjcmliZScsIHtcbiAgICAgICAgdXJsOiAnL3N1YnNjcmliZScsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAndGVtcGxhdGVzL3N1YnNjcmliZS5odG1sJyxcbiAgICAgICAgY29udHJvbGxlcjogJ1N1YnNjcmliZUN0cmwnXG4gICAgICB9KVxuICAgICAgLnN0YXRlKCdsb2dpbicsIHtcbiAgICAgICAgdXJsOiAnL2xvZ2luJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICd0ZW1wbGF0ZXMvbG9naW4uaHRtbCcsXG4gICAgICAgIGNvbnRyb2xsZXI6ICdMb2dpbkN0cmwnXG4gICAgICB9KVxuICAgICAgLnN0YXRlKCdhcHAnLCB7XG4gICAgICAgIHVybDogJy9hcHAnLFxuICAgICAgICBhYnN0cmFjdDogdHJ1ZSxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICd0ZW1wbGF0ZXMvbWVudS5odG1sJyxcbiAgICAgICAgY29udHJvbGxlcjogJ0FwcEN0cmwnXG4gICAgICB9KVxuICAgICAgLnN0YXRlKCdhcHAuZmVlZGJhY2snLCB7XG4gICAgICAgIHVybDogJy9mZWVkYmFjaycsXG4gICAgICAgIHZpZXdzOiB7XG4gICAgICAgICAgJ21lbnVDb250ZW50Jzoge1xuICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICd0ZW1wbGF0ZXMvZmVlZGJhY2suaHRtbCcsXG4gICAgICAgICAgICBjb250cm9sbGVyOiAnRmVlZGJhY2tDdHJsJ1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSlcbiAgICAgIC5zdGF0ZSgnYXBwLmJ1eXMnLCB7XG4gICAgICAgIHVybDogJy9idXlzJyxcbiAgICAgICAgdmlld3M6IHtcbiAgICAgICAgICAnbWVudUNvbnRlbnQnOiB7XG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogJ3RlbXBsYXRlcy9idXlzLmh0bWwnLFxuICAgICAgICAgICAgY29udHJvbGxlcjogJ0J1eXNDdHJsJ1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSlcbiAgICAgIC5zdGF0ZSgnYXBwLnRvZGF5Jywge1xuICAgICAgICB1cmw6ICcvdG9kYXknLFxuICAgICAgICB2aWV3czoge1xuICAgICAgICAgICdtZW51Q29udGVudCc6IHtcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAndGVtcGxhdGVzL3RvZGF5Lmh0bWwnLFxuICAgICAgICAgICAgY29udHJvbGxlcjogJ1RvZGF5c0J1eXNDdHJsJ1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSlcbiAgICAgIC5zdGF0ZSgnYXBwLnRyYWRlJywge1xuICAgICAgICB1cmw6ICcvdHJhZGVzLzppZCcsXG4gICAgICAgIHZpZXdzOiB7XG4gICAgICAgICAgJ21lbnVDb250ZW50Jzoge1xuICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICd0ZW1wbGF0ZXMvdHJhZGUuaHRtbCcsXG4gICAgICAgICAgICBjb250cm9sbGVyOiAnVHJhZGVDdHJsJ1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSlcbiAgICAgIC5zdGF0ZSgnYXBwLmluc2lkZXInLCB7XG4gICAgICAgIHVybDogJy9pbnNpZGVycy86aWQnLFxuICAgICAgICB2aWV3czoge1xuICAgICAgICAgICdtZW51Q29udGVudCc6IHtcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAndGVtcGxhdGVzL2luc2lkZXIuaHRtbCcsXG4gICAgICAgICAgICBjb250cm9sbGVyOiAnSW5zaWRlckN0cmwnXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KVxuICAgICAgLnN0YXRlKCdhcHAuZm9ybTQnLCB7XG4gICAgICAgIHVybDogJy9mb3JtNHMvOmlkJyxcbiAgICAgICAgdmlld3M6IHtcbiAgICAgICAgICAnbWVudUNvbnRlbnQnOiB7XG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogJ3RlbXBsYXRlcy9mb3JtNC5odG1sJyxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdGb3JtNEN0cmwnXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KVxuICAgICAgLnN0YXRlKCdhcHAuY29tcGFueScsIHtcbiAgICAgICAgdXJsOiAnL2NvbXBhbmllcy86aWQnLFxuICAgICAgICB2aWV3czoge1xuICAgICAgICAgICdtZW51Q29udGVudCc6IHtcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAndGVtcGxhdGVzL2NvbXBhbnkuaHRtbCcsXG4gICAgICAgICAgICBjb250cm9sbGVyOiAnQ29tcGFueUN0cmwnXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KVxuICAgICAgLnN0YXRlKCdhcHAuc2VhcmNoJywge1xuICAgICAgICB1cmw6ICcvc2VhcmNoJyxcbiAgICAgICAgdmlld3M6IHtcbiAgICAgICAgICAnbWVudUNvbnRlbnQnOiB7XG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogJ3RlbXBsYXRlcy9zZWFyY2guaHRtbCcsXG4gICAgICAgICAgICBjb250cm9sbGVyOiAnU2VhcmNoQ3RybCdcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgICAuc3RhdGUoJ2FwcC5kaXNjbGFpbWVyJywge1xuICAgICAgICB1cmw6ICcvZGlzY2xhaW1lcicsXG4gICAgICAgIHZpZXdzOiB7XG4gICAgICAgICAgJ21lbnVDb250ZW50Jzoge1xuICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICd0ZW1wbGF0ZXMvZGlzY2xhaW1lci5odG1sJyxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdEaXNjbGFpbWVyQ3RybCdcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIC8vIGlmIG5vbmUgb2YgdGhlIGFib3ZlIHN0YXRlcyBhcmUgbWF0Y2hlZCwgdXNlIHRoaXMgYXMgdGhlIGZhbGxiYWNrXG4gICAgJHVybFJvdXRlclByb3ZpZGVyLm90aGVyd2lzZSgnL2FwcC9idXlzJyk7XG4gIH0pXG4gIC5jb25maWcoWyckaHR0cFByb3ZpZGVyJywgZnVuY3Rpb24oJGh0dHBQcm92aWRlcikge1xuICAgICRodHRwUHJvdmlkZXIuZGVmYXVsdHMud2l0aENyZWRlbnRpYWxzID0gdHJ1ZTtcbiAgICAkaHR0cFByb3ZpZGVyLmludGVyY2VwdG9ycy5wdXNoKCdhdXRoSHR0cFJlc3BvbnNlSW50ZXJjZXB0b3InKTtcbiAgfV0pXG4gIC5ydW4oZnVuY3Rpb24oJHN0YXRlLCAkaW9uaWNQbGF0Zm9ybSwgJGNvcmRvdmFQdXNoLCAkcm9vdFNjb3BlLCAkc3RvcmVraXQpIHtcbiAgICAkaW9uaWNQbGF0Zm9ybS5yZWFkeShmdW5jdGlvbigpIHtcbiAgICAgICRzdG9yZWtpdFxuICAgICAgICAuc2V0TG9nZ2luZyh0cnVlKVxuICAgICAgICAubG9hZChbJ2NvbS5pbnNpZGVyYWkuaW9zLjF5ciddKVxuICAgICAgICAudGhlbihmdW5jdGlvbihwcm9kdWN0cykge1xuICAgICAgICAgICRyb290U2NvcGUucHJvZHVjdHMgPSBwcm9kdWN0cztcbiAgICAgICAgICBjb25zb2xlLmxvZyhwcm9kdWN0cyk7XG4gICAgICAgICAgY29uc29sZS5sb2coJ3Byb2R1Y3RzIGxvYWRlZCcpO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZnVuY3Rpb24oKSB7XG4gICAgICAgICAgJHJvb3RTY29wZS5wcm9kdWN0cyA9IFtdO1xuICAgICAgICAgIGNvbnNvbGUubG9nKCdwcm9kdWN0IGxvYWQgZXJyb3InLCBhcmd1bWVudHMpO1xuICAgICAgICB9KTtcblxuICAgICAgLy8gSGlkZSB0aGUgYWNjZXNzb3J5IGJhciBieSBkZWZhdWx0IChyZW1vdmUgdGhpcyB0byBzaG93IHRoZSBhY2Nlc3NvcnkgYmFyIGFib3ZlIHRoZSBrZXlib2FyZFxuICAgICAgLy8gZm9yIGZvcm0gaW5wdXRzKVxuICAgICAgaWYgKHdpbmRvdy5jb3Jkb3ZhICYmIHdpbmRvdy5jb3Jkb3ZhLnBsdWdpbnMuS2V5Ym9hcmQpIHtcbiAgICAgICAgY29yZG92YS5wbHVnaW5zLktleWJvYXJkLmhpZGVLZXlib2FyZEFjY2Vzc29yeUJhcih0cnVlKTtcbiAgICAgIH1cblxuICAgICAgaWYgKHdpbmRvdy5TdGF0dXNCYXIpIHtcbiAgICAgICAgLy8gb3JnLmFwYWNoZS5jb3Jkb3ZhLnN0YXR1c2JhciByZXF1aXJlZFxuICAgICAgICB3aW5kb3cuU3RhdHVzQmFyLnN0eWxlTGlnaHRDb250ZW50KCk7XG4gICAgICB9XG5cbiAgICAgIHZhciBpb3NDb25maWcgPSB7XG4gICAgICAgIFwiYmFkZ2VcIjogXCJ0cnVlXCIsXG4gICAgICAgIFwic291bmRcIjogXCJ0cnVlXCIsXG4gICAgICAgIFwiYWxlcnRcIjogXCJ0cnVlXCIsXG4gICAgICAgIFwiZWNiXCI6IFwib25Ob3RpZmljYXRpb25BUE5cIlxuICAgICAgfTtcblxuICAgICAgaWYgKHdpbmRvdy5jb3Jkb3ZhKSB7XG4gICAgICAgICRjb3Jkb3ZhUHVzaC5yZWdpc3Rlcihpb3NDb25maWcpLnRoZW4oZnVuY3Rpb24ocmVzdWx0KSB7XG4gICAgICAgICAgJHJvb3RTY29wZS5kZXZpY2VUb2tlbiA9IHJlc3VsdDtcbiAgICAgICAgfSwgZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coXCJub3QgYWJsZSB0byBzZW5kIHB1c2hcIiwgZXJyKTtcbiAgICAgICAgfSk7XG4gICAgICAgIC8vICRjb3Jkb3ZhUHVzaC51bnJlZ2lzdGVyKG9wdGlvbnMpLnRoZW4oZnVuY3Rpb24ocmVzdWx0KSB7XG4gICAgICAgIC8vICAgYWxlcnQoXCJ1bnJlZ2lzdGVyXCIpO1xuICAgICAgICAvLyAgIGFsZXJ0KHJlc3VsdCk7XG4gICAgICAgIC8vICAgYWxlcnQoYXJndW1lbnRzKTtcbiAgICAgICAgLy8gICAgIC8vIFN1Y2Nlc3MhXG4gICAgICAgIC8vIH0sIGZ1bmN0aW9uKGVycikge1xuICAgICAgICAvLyAgIGFsZXJ0KFwiZXJyb3JcIik7XG4gICAgICAgIC8vICAgYWxlcnQoZXJyKTtcbiAgICAgICAgLy8gICAgIC8vIEFuIGVycm9yIG9jY3VyZWQuIFNob3cgYSBtZXNzYWdlIHRvIHRoZSB1c2VyXG4gICAgICAgIC8vIH0pO1xuICAgICAgICAvL1xuICAgICAgICAvLyAvLyBpT1Mgb25seVxuXG4gICAgICAgIHdpbmRvdy5vbk5vdGlmaWNhdGlvbkFQTiA9IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICBjb25zb2xlLmxvZygnb24gbm90aWZpY2F0aW9uOicsIGUpO1xuICAgICAgICAgIGlmIChlLmFsZXJ0KSB7XG4gICAgICAgICAgICAkc3RhdGUuZ28oJ2FwcC50cmFkZScsIHtcbiAgICAgICAgICAgICAgaWQ6IGUuaWRlYV9pZFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKGUuc291bmQpIHtcbiAgICAgICAgICAgIHZhciBzbmQgPSBuZXcgTWVkaWEoZS5zb3VuZCk7XG4gICAgICAgICAgICBzbmQucGxheSgpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChlLmJhZGdlKSB7XG4gICAgICAgICAgICAkY29yZG92YVB1c2guc2V0QmFkZ2VOdW1iZXIoZS5iYWRnZSkudGhlbihmdW5jdGlvbihyZXN1bHQpIHtcbiAgICAgICAgICAgICAgY29uc29sZS5sb2cocmVzdWx0KTtcbiAgICAgICAgICAgIH0sIGZ1bmN0aW9uKGVycikge1xuICAgICAgICAgICAgICBjb25zb2xlLmxvZyhlcnIpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgfVxuICAgIH0pO1xuICB9KTtcbiIsImFuZ3VsYXIubW9kdWxlKCdpbnNpZGVyLnNlcnZpY2VzJywgW10pXG4gIC5mYWN0b3J5KCdhdXRoSHR0cFJlc3BvbnNlSW50ZXJjZXB0b3InLCBbJyRxJywgJyRsb2NhdGlvbicsXG4gICAgZnVuY3Rpb24gKCRxLCAkbG9jYXRpb24pIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHJlc3BvbnNlRXJyb3I6IGZ1bmN0aW9uIChyZWplY3Rpb24pIHtcbiAgICAgICAgICBpZiAocmVqZWN0aW9uLnN0YXR1cyA9PT0gNDAxKSB7XG4gICAgICAgICAgICAkbG9jYXRpb24ucGF0aCgnL2xvZ2luJyk7XG4gICAgICAgICAgICByZXR1cm4gJHEucmVqZWN0KHJlamVjdGlvbik7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChyZWplY3Rpb24uc3RhdHVzID09PSA0MDMpIHtcbiAgICAgICAgICAgICRsb2NhdGlvbi5wYXRoKCcvc3Vic2NyaWJlJyk7XG4gICAgICAgICAgICByZXR1cm4gJHEucmVqZWN0KHJlamVjdGlvbik7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiAkcS5yZWplY3QocmVqZWN0aW9uKTtcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICB9XG4gIF0pO1xuIiwiLypnbG9iYWxzIGFuZ3VsYXIsIF8gKi9cbmFuZ3VsYXIubW9kdWxlKCdpbnNpZGVyLnNlcnZpY2VzJylcbiAgLmZhY3RvcnkoJ0NvbXBhbnlTZXJ2aWNlJywgZnVuY3Rpb24obG9jLCAkcSwgJGh0dHApIHtcbiAgICBmdW5jdGlvbiB1cmwoaWQpIHtcbiAgICAgaWYoaWQpIHtcbiAgICAgICAgcmV0dXJuIGxvYy5hcGlCYXNlICsgJy9hcGkvdjEvY29tcGFuaWVzLycgKyBpZCArICcuanNvbic7XG4gICAgICB9XG4gICAgICByZXR1cm4gbG9jLmFwaUJhc2UgKyAnL2FwaS92MS9jb21wYW5pZXMuanNvbic7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIGZpbmRCeUlkOiBmdW5jdGlvbiAoaWQpIHtcbiAgICAgICAgdmFyIGRlZmVycmVkID0gJHEuZGVmZXIoKTtcbiAgICAgICAgJGh0dHAuZ2V0KHVybChpZCkpLnRoZW4oZnVuY3Rpb24gKHJlc3ApIHtcbiAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKHJlc3AuZGF0YSk7XG4gICAgICAgIH0sIGZ1bmN0aW9uIChyZXNwKSB7XG4gICAgICAgICAgZGVmZXJyZWQucmVqZWN0KHJlc3AuZGF0YSk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbiAgICAgIH0sXG4gICAgfTtcbiAgfSk7XG5cbiIsIi8qZ2xvYmFscyBhbmd1bGFyLCBfICovXG5hbmd1bGFyLm1vZHVsZSgnaW5zaWRlci5zZXJ2aWNlcycpXG4gIC5mYWN0b3J5KCdGZWVkYmFja1NlcnZpY2UnLCBmdW5jdGlvbihsb2MsICRodHRwKSB7XG4gICAgZnVuY3Rpb24gdXJsKCkge1xuICAgICAgcmV0dXJuIGxvYy5hcGlCYXNlICsgJy9hcGkvdjIvZmVlZGJhY2tzJztcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgc3VibWl0RmVlZGJhY2s6IGZ1bmN0aW9uIChmZWVkYmFja1BhcmFtcykge1xuICAgICAgICByZXR1cm4gJGh0dHAucG9zdCh1cmwoKSwgZmVlZGJhY2tQYXJhbXMpO1xuICAgICAgfVxuICAgIH07XG4gIH0pO1xuIiwiLypnbG9iYWxzIGFuZ3VsYXIsIF8gKi9cbmFuZ3VsYXIubW9kdWxlKCdpbnNpZGVyLnNlcnZpY2VzJylcbiAgLmZhY3RvcnkoJ0Zvcm00U2VydmljZScsIGZ1bmN0aW9uKGxvYywgJHEsICRodHRwKSB7XG4gICAgZnVuY3Rpb24gdXJsKGlkKSB7XG4gICAgIGlmKGlkKSB7XG4gICAgICAgIHJldHVybiBsb2MuYXBpQmFzZSArICcvYXBpL3YxL2Zvcm00cy8nICsgaWQgKyAnLmpzb24nO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGxvYy5hcGlCYXNlICsgJy9hcGkvdjEvZm9ybTRzLmpzb24nO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICBmaW5kQnlJZDogZnVuY3Rpb24gKGlkKSB7XG4gICAgICAgIHZhciBkZWZlcnJlZCA9ICRxLmRlZmVyKCk7XG4gICAgICAgICRodHRwLmdldCh1cmwoaWQpKS50aGVuKGZ1bmN0aW9uIChyZXNwKSB7XG4gICAgICAgICAgdmFyIGZpbGluZyA9IHJlc3AuZGF0YTtcbiAgICAgICAgICB2YXIgZG9jID0gSlNPTi5wYXJzZShyZXNwLmRhdGEuZmlsaW5nKTtcbiAgICAgICAgICBmaWxpbmcubm9uRGVyaXZhdGl2ZVRyYW5zYWN0aW9ucyA9IGRvYy50cmFuc2FjdGlvbnM7XG4gICAgICAgICAgZmlsaW5nLmRlcml2YXRpdmVUcmFuc2FjdGlvbnMgPSBkb2MuZGVyaXZhdGl2ZV90cmFuc2FjdGlvbnM7XG4gICAgICAgICAgZGVmZXJyZWQucmVzb2x2ZShmaWxpbmcpO1xuICAgICAgICB9LCBmdW5jdGlvbiAocmVzcCkge1xuICAgICAgICAgIGRlZmVycmVkLnJlamVjdChyZXNwLmRhdGEpO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG4gICAgICB9LFxuICAgIH07XG4gIH0pO1xuIiwiLypnbG9iYWxzIGFuZ3VsYXIsIF8gKi9cbmFuZ3VsYXIubW9kdWxlKCdpbnNpZGVyLnNlcnZpY2VzJylcbiAgLmZhY3RvcnkoJ0J1eUlkZWFTZXJ2aWNlJywgZnVuY3Rpb24obG9jLCAkcSwgJGh0dHApIHtcbiAgICBmdW5jdGlvbiB1cmwoaWQpIHtcbiAgICAgIGlmKGlkKSB7XG4gICAgICAgIHJldHVybiBsb2MuYXBpQmFzZSArICcvYXBpL3YyL2J1eXMvJyArIGlkICsgJy5qc29uJztcbiAgICAgIH1cbiAgICAgIHJldHVybiBsb2MuYXBpQmFzZSArICcvYXBpL3YyL2J1eXMuanNvbic7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIGZpbmRBbGw6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGRlZmVycmVkID0gJHEuZGVmZXIoKTtcbiAgICAgICAgJGh0dHAuZ2V0KHVybCgpLCB7IGNhY2hlOiB0cnVlIH0pXG4gICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKHJlc3ApIHtcbiAgICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUocmVzcC5kYXRhKTtcbiAgICAgICAgICB9LCBmdW5jdGlvbiAocmVzcCkge1xuICAgICAgICAgICAgZGVmZXJyZWQucmVqZWN0KHJlc3AuZGF0YSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xuICAgICAgfSxcblxuICAgICAgZmluZEJ5SWQ6IGZ1bmN0aW9uIChpZCkge1xuICAgICAgICB2YXIgZGVmZXJyZWQgPSAkcS5kZWZlcigpO1xuICAgICAgICAkaHR0cC5nZXQodXJsKGlkKSwgeyBjYWNoZTogdHJ1ZSB9KVxuICAgICAgICAgIC50aGVuKGZ1bmN0aW9uIChyZXNwKSB7XG4gICAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKHJlc3AuZGF0YSk7XG4gICAgICAgICAgfSwgZnVuY3Rpb24gKHJlc3ApIHtcbiAgICAgICAgICAgIGRlZmVycmVkLnJlamVjdChyZXNwLmRhdGEpO1xuICAgICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbiAgICAgIH0sXG5cbiAgICAgIGZpbmRUb2RheXM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGRlZmVycmVkID0gJHEuZGVmZXIoKTtcbiAgICAgICAgJGh0dHAuZ2V0KHVybCgpLCB7IHBhcmFtczogeyAndG9kYXknOiB0cnVlIH0sIGNhY2hlOiB0cnVlIH0pXG4gICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKHJlc3ApIHtcbiAgICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUocmVzcC5kYXRhKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG4gICAgICB9XG4gICAgfTtcbiAgfSk7XG4iLCIvKmdsb2JhbHMgYW5ndWxhciwgXyAqL1xuYW5ndWxhci5tb2R1bGUoJ2luc2lkZXIuc2VydmljZXMnKVxuICAuZmFjdG9yeSgnSW5zaWRlclNlcnZpY2UnLCBmdW5jdGlvbihsb2MsICRxLCAkaHR0cCkge1xuICAgIGZ1bmN0aW9uIHVybChpZCkge1xuICAgICBpZihpZCkge1xuICAgICAgICByZXR1cm4gbG9jLmFwaUJhc2UgKyAnL2FwaS92MS9pbnNpZGVycy8nICsgaWQgKyAnLmpzb24nO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGxvYy5hcGlCYXNlICsgJy9hcGkvdjEvaW5zaWRlcnMuanNvbic7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIGZpbmRCeUlkOiBmdW5jdGlvbiAoaWQpIHtcbiAgICAgICAgdmFyIGRlZmVycmVkID0gJHEuZGVmZXIoKTtcbiAgICAgICAgJGh0dHAuZ2V0KHVybChpZCkpLnRoZW4oZnVuY3Rpb24gKHJlc3ApIHtcbiAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKHJlc3AuZGF0YSk7XG4gICAgICAgIH0sIGZ1bmN0aW9uIChyZXNwKSB7XG4gICAgICAgICAgZGVmZXJyZWQucmVqZWN0KHJlc3AuZGF0YSk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbiAgICAgIH0sXG4gICAgfTtcbiAgfSk7XG4iLCIvKmdsb2JhbHMgYW5ndWxhciwgXyAqL1xuYW5ndWxhci5tb2R1bGUoJ2luc2lkZXIuc2VydmljZXMnKVxuICAuZmFjdG9yeSgnTG9naW5TZXJ2aWNlJywgZnVuY3Rpb24obG9jLCAkaHR0cCkge1xuICAgIGZ1bmN0aW9uIHVybCgpIHtcbiAgICAgIHJldHVybiBsb2MuYXBpQmFzZSArICcvYXBpL3YyL3Nlc3Npb24nO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICBsb2dpbjogZnVuY3Rpb24gKHVzZXJQYXJhbXMpIHtcbiAgICAgICAgcmV0dXJuICRodHRwLnBvc3QodXJsKCksIHVzZXJQYXJhbXMpO1xuICAgICAgfVxuICAgIH07XG4gIH0pO1xuIiwiLypnbG9iYWxzIGFuZ3VsYXIsIF8gKi9cbmFuZ3VsYXIubW9kdWxlKCdpbnNpZGVyLnNlcnZpY2VzJylcbiAgLmZhY3RvcnkoJ1JlZ2lzdGVyU2VydmljZScsIGZ1bmN0aW9uKGxvYywgJGh0dHApIHtcbiAgICBmdW5jdGlvbiB1cmwoKSB7XG4gICAgICByZXR1cm4gbG9jLmFwaUJhc2UgKyAnL2FwaS92Mi91c2Vycyc7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIHJlZ2lzdGVyOiBmdW5jdGlvbiAodXNlclBhcmFtcykge1xuICAgICAgICB1c2VyUGFyYW1zLnBsYXRmb3JtID0gJ2lvcyc7XG4gICAgICAgIHJldHVybiAkaHR0cC5wb3N0KHVybCgpLCB1c2VyUGFyYW1zKTtcbiAgICAgIH1cbiAgICB9O1xuICB9KTtcbiIsIi8qZ2xvYmFscyBhbmd1bGFyLCBfICovXG5hbmd1bGFyLm1vZHVsZSgnaW5zaWRlci5zZXJ2aWNlcycpXG4gIC5mYWN0b3J5KCdTZWFyY2hTZXJ2aWNlJywgZnVuY3Rpb24obG9jLCAkaHR0cCkge1xuICAgIGZ1bmN0aW9uIHVybChxKSB7XG4gICAgICByZXR1cm4gbG9jLmFwaUJhc2UgKyAnL2FwaS92MS9zZWFyY2g/cT0nICsgcTtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgc2VhcmNoOiBmdW5jdGlvbiAoa2V5d29yZCkge1xuICAgICAgICByZXR1cm4gJGh0dHAuZ2V0KHVybChrZXl3b3JkKSwgeyBjYWNoZTogdHJ1ZSB9KTtcbiAgICAgIH1cbiAgICB9O1xuICB9KTtcbiIsIi8qZ2xvYmFscyBhbmd1bGFyLCBfICovXG5hbmd1bGFyLm1vZHVsZSgnaW5zaWRlci5zZXJ2aWNlcycpXG4gIC5mYWN0b3J5KCdTdWJzY3JpYmVTZXJ2aWNlJywgZnVuY3Rpb24obG9jLCAkaHR0cCwgJHN0b3Jla2l0KSB7XG4gICAgZnVuY3Rpb24gdXJsKCkge1xuICAgICAgcmV0dXJuIGxvYy5hcGlCYXNlICsgJy9hcGkvdjIvc3Vic2NyaXB0aW9ucyc7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIHN1YnNjcmliZTogZnVuY3Rpb24gKHByb2R1Y3QpIHtcbiAgICAgICAgJHN0b3Jla2l0LnB1cmNoYXNlKHByb2R1Y3QuaWQpO1xuICAgICAgICByZXR1cm4gJGh0dHAucG9zdCh1cmwoKSwge1xuICAgICAgICAgIHByb2R1Y3RfbmFtZTogcHJvZHVjdC5pZCxcbiAgICAgICAgICBwcmljZTogcHJvZHVjdC5wcmljZVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9O1xuICB9KTtcbiIsIi8qZ2xvYmFscyBhbmd1bGFyLCB3aW5kb3csIGRvY3VtZW50ICovXG5hbmd1bGFyLm1vZHVsZSgnaW5zaWRlci5jb250cm9sbGVycycsIFtdKVxuICAuY29udHJvbGxlcignQXBwQ3RybCcsIGZ1bmN0aW9uKCR0aW1lb3V0LCAkaW9uaWNMb2FkaW5nLCAkcSwgJHNjb3BlLCAkaW9uaWNNb2RhbCwgJHJvb3RTY29wZSwgJHN0b3Jla2l0KSB7XG4gICAgJHN0b3Jla2l0XG4gICAgICAud2F0Y2hQdXJjaGFzZXMoKVxuICAgICAgLnRoZW4oZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vIE5vdCBjdXJyZW50bHkgdXNlZFxuICAgICAgfSwgZnVuY3Rpb24oZXJyb3IpIHtcbiAgICAgICAgLy8gQW4gZXJyb3Igb2NjdXJlZC4gU2hvdyBhIG1lc3NhZ2UgdG8gdGhlIHVzZXJcbiAgICAgIH0sIGZ1bmN0aW9uKHB1cmNoYXNlKSB7XG4gICAgICAgIGlmIChwdXJjaGFzZS5wcm9kdWN0SWQgPT09ICdjb20uaW5zaWRlcmFpLmlvcy55cicpIHtcbiAgICAgICAgICBpZiAocHVyY2hhc2UudHlwZSA9PT0gJ3B1cmNoYXNlJykge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ3B1cmNoYXNlZCEnKTtcbiAgICAgICAgICAgIC8vIFlvdXIgcHJvZHVjdCB3YXMgcHVyY2hhc2VkXG4gICAgICAgICAgfSBlbHNlIGlmIChwdXJjaGFzZS50eXBlID09PSAncmVzdG9yZScpIHtcbiAgICAgICAgICAgIC8vIFlvdXIgcHJvZHVjdCB3YXMgcmVzdG9yZWRcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdyZXN0b3JlZCEnKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgY29uc29sZS5sb2cocHVyY2hhc2UudHJhbnNhY3Rpb25JZCk7XG4gICAgICAgICAgY29uc29sZS5sb2cocHVyY2hhc2UucHJvZHVjdElkKTtcbiAgICAgICAgICBjb25zb2xlLmxvZyhwdXJjaGFzZS50cmFuc2FjdGlvblJlY2VpcHQpO1xuICAgICAgICB9XG4gICAgICB9KTtcblxuXG4gICAgJHNjb3BlLnJldHJ5V2l0aFByb21pc2UgPSBmdW5jdGlvbihwcm9taXNlLCBhcmdzLCBtYXhUcmllcywgY29udGV4dCwgZGVmZXJyZWQpIHtcbiAgICAgIGRlZmVycmVkID0gZGVmZXJyZWQgfHwgJHEuZGVmZXIoKTtcbiAgICAgIGNvbnRleHQgPSBjb250ZXh0IHx8IG51bGw7XG5cbiAgICAgICRzY29wZS5sb2FkaW5nID0gdHJ1ZTtcbiAgICAgICRpb25pY0xvYWRpbmcuc2hvdyh7XG4gICAgICAgIHRlbXBsYXRlOiBcIjxpIGNsYXNzPSdpb24tbG9hZGluZy1kJz48L2k+XCJcbiAgICAgIH0pO1xuXG4gICAgICBwcm9taXNlLmFwcGx5KGNvbnRleHQsIGFyZ3MpXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgICAkc2NvcGUubG9hZGluZyA9IGZhbHNlO1xuICAgICAgICAgICRpb25pY0xvYWRpbmcuaGlkZSgpO1xuICAgICAgICAgIHJldHVybiBkZWZlcnJlZC5yZXNvbHZlKGQpO1xuICAgICAgICB9LCBmdW5jdGlvbihlcnIpIHtcbiAgICAgICAgICBpZiAobWF4VHJpZXMgPT09IC0xIHx8IGVyci5zdGF0dXMgPT0gNDAxIHx8IGVyci5zdGF0dXMgPT0gNDAzKSB7XG4gICAgICAgICAgICAkaW9uaWNMb2FkaW5nLmhpZGUoKTtcbiAgICAgICAgICAgICRzY29wZS5sb2FkaW5nID0gZmFsc2U7XG4gICAgICAgICAgICByZXR1cm4gZGVmZXJyZWQucmVqZWN0KGVycik7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICR0aW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAkc2NvcGUucmV0cnlXaXRoUHJvbWlzZShwcm9taXNlLCBhcmdzLCBtYXhUcmllcyAtIDEsIGNvbnRleHQsIGRlZmVycmVkKTtcbiAgICAgICAgICAgIH0sIDIwMDApO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbiAgICB9O1xuXG4gICAgJHNjb3BlLnJldHJ5V2l0aFByb21pc2VQdWxsVG9SZWZyZXNoID0gZnVuY3Rpb24ocHJvbWlzZSwgYXJncywgbWF4VHJpZXMsIGNvbnRleHQsIGRlZmVycmVkKSB7XG4gICAgICBkZWZlcnJlZCA9IGRlZmVycmVkIHx8ICRxLmRlZmVyKCk7XG4gICAgICBjb250ZXh0ID0gY29udGV4dCB8fCBudWxsO1xuXG4gICAgICAkc2NvcGUubG9hZGluZyA9IHRydWU7XG4gICAgICBwcm9taXNlLmFwcGx5KGNvbnRleHQsIGFyZ3MpXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgICAkc2NvcGUubG9hZGluZyA9IGZhbHNlO1xuICAgICAgICAgICRzY29wZS4kYnJvYWRjYXN0KCdzY3JvbGwucmVmcmVzaENvbXBsZXRlJyk7XG4gICAgICAgICAgcmV0dXJuIGRlZmVycmVkLnJlc29sdmUoZCk7XG4gICAgICAgIH0sIGZ1bmN0aW9uKGVycikge1xuICAgICAgICAgIGlmIChtYXhUcmllcyA9PT0gLTEgfHwgZXJyLnN0YXR1cyA9PSA0MDEgfHwgZXJyLnN0YXR1cyA9PSA0MDMpIHtcbiAgICAgICAgICAgICRzY29wZS4kYnJvYWRjYXN0KCdzY3JvbGwucmVmcmVzaENvbXBsZXRlJyk7XG4gICAgICAgICAgICAkc2NvcGUubG9hZGluZyA9IGZhbHNlO1xuICAgICAgICAgICAgcmV0dXJuIGRlZmVycmVkLnJlamVjdChlcnIpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAkdGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgJHNjb3BlLnJldHJ5V2l0aFByb21pc2UocHJvbWlzZSwgYXJncywgbWF4VHJpZXMgLSAxLCBjb250ZXh0LCBkZWZlcnJlZCk7XG4gICAgICAgICAgICB9LCAyMDAwKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG4gICAgfTtcbiAgfSk7XG4iLCIvKmdsb2JhbHMgYW5ndWxhciwgd2luZG93ICovXG4gYW5ndWxhci5tb2R1bGUoJ2luc2lkZXIuY29udHJvbGxlcnMnKVxuICAuY29udHJvbGxlcignQnV5c0N0cmwnLCBmdW5jdGlvbiAoJGNhY2hlRmFjdG9yeSwgJHN0YXRlLCAkc2NvcGUsIGxvYywgQnV5SWRlYVNlcnZpY2UpIHtcbiAgICB2YXIgbG9hZFJlbW90ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICRzY29wZS5yZXRyeVdpdGhQcm9taXNlUHVsbFRvUmVmcmVzaChCdXlJZGVhU2VydmljZS5maW5kQWxsLCBbXSwgMywgdGhpcylcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24gKHRyYWRlcykge1xuICAgICAgICAgICRzY29wZS50cmFkZXMgPSB0cmFkZXM7XG4gICAgICAgIH0sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAvLyBUT0RPOiBzaG93IG5vIHRyYWRlcyBmb3VuZCB0aGluZ1xuICAgICAgICAgICRzY29wZS50cmFkZXMgPSBbXTtcbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICBsb2FkUmVtb3RlKCk7XG5cbiAgICAkc2NvcGUucmVmcmVzaCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciBjYWNoZSA9ICRjYWNoZUZhY3RvcnkuZ2V0KCckaHR0cCcpO1xuICAgICAgY2FjaGUucmVtb3ZlKGxvYy5hcGlCYXNlICsgJy9hcGkvdjIvYnV5cy5qc29uJyk7XG4gICAgICBsb2FkUmVtb3RlKCk7XG4gICAgfTtcblxuICAgICRzY29wZS5zaG93VHJhZGUgPSBmdW5jdGlvbiAoaWQpIHtcbiAgICAgICRzdGF0ZS5nbygnYXBwLnRyYWRlJywge1xuICAgICAgICBpZDogaWRcbiAgICAgIH0pO1xuICAgIH07XG5cbiAgICAkc2NvcGUuJG9uKCdhdXRoY2hhbmdlJywgZnVuY3Rpb24gKCkge1xuICAgICAgJHNjb3BlLnJlZnJlc2goKTtcbiAgICB9KTtcbiAgfSk7XG4iLCIvKmdsb2JhbHMgYW5ndWxhciwgd2luZG93ICovXG5hbmd1bGFyLm1vZHVsZSgnaW5zaWRlci5jb250cm9sbGVycycpXG4gIC5jb250cm9sbGVyKCdDb21wYW55Q3RybCcsIGZ1bmN0aW9uICgkc3RhdGUsICRzY29wZSwgJHN0YXRlUGFyYW1zLCBDb21wYW55U2VydmljZSkge1xuICAgICRzY29wZS5zaG93VHJhZGVzID0gdHJ1ZTtcblxuICAgICRzY29wZS5yZWZyZXNoID0gZnVuY3Rpb24gKCkge1xuICAgICAgJHNjb3BlLnJldHJ5V2l0aFByb21pc2UoQ29tcGFueVNlcnZpY2UuZmluZEJ5SWQsIFskc3RhdGVQYXJhbXMuaWRdLCAzLCB0aGlzKVxuICAgICAgICAudGhlbihmdW5jdGlvbiAoY29tcGFueURhdGEpIHtcbiAgICAgICAgICAkc2NvcGUuY29tcGFueSA9IGNvbXBhbnlEYXRhO1xuICAgICAgICB9LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coXCJzYWQgZmFjZVwiKTtcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgICRzY29wZS5yZWZyZXNoKCk7XG5cbiAgICAkc2NvcGUuZ29Ub0luc2lkZXIgPSBmdW5jdGlvbiAoaW5zaWRlcikge1xuICAgICAgJHN0YXRlLmdvKCdhcHAuaW5zaWRlcicsIHtcbiAgICAgICAgaWQ6IGluc2lkZXIuaWRcbiAgICAgIH0pO1xuICAgIH07XG5cbiAgICAkc2NvcGUuZ29Ub0Zvcm00ID0gZnVuY3Rpb24gKGZvcm00KSB7XG4gICAgICAkc3RhdGUuZ28oJ2FwcC5mb3JtNCcsIHtcbiAgICAgICAgaWQ6IGZvcm00LmlkXG4gICAgICB9KTtcbiAgICB9O1xuICB9KTtcbiIsIi8qZ2xvYmFscyBhbmd1bGFyLCB3aW5kb3cgKi9cbiBhbmd1bGFyLm1vZHVsZSgnaW5zaWRlci5jb250cm9sbGVycycpXG4gIC5jb250cm9sbGVyKCdEaXNjbGFpbWVyQ3RybCcsIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm47XG4gIH0pO1xuIiwiLypnbG9iYWxzIGFuZ3VsYXIsIHdpbmRvdyAqL1xuIGFuZ3VsYXIubW9kdWxlKCdpbnNpZGVyLmNvbnRyb2xsZXJzJylcbiAgLmNvbnRyb2xsZXIoJ0ZlZWRiYWNrQ3RybCcsIGZ1bmN0aW9uICgkc2NvcGUsICRsb2NhdGlvbiwgRmVlZGJhY2tTZXJ2aWNlKSB7XG4gICAgJHNjb3BlLmZlZWRiYWNrID0ge307XG5cbiAgICAkc2NvcGUuc3VibWl0RmVlZGJhY2sgPSBmdW5jdGlvbiAoKSB7XG4gICAgICBGZWVkYmFja1NlcnZpY2Uuc3VibWl0RmVlZGJhY2soJHNjb3BlLmZlZWRiYWNrKTtcbiAgICAgICRsb2NhdGlvbi5wYXRoKFwiL1wiKTtcbiAgICB9O1xuXG4gICAgcmV0dXJuO1xuICB9KTtcbiIsIi8qZ2xvYmFscyBhbmd1bGFyLCB3aW5kb3cgKi9cbmFuZ3VsYXIubW9kdWxlKCdpbnNpZGVyLmNvbnRyb2xsZXJzJylcbiAgLmNvbnRyb2xsZXIoJ0Zvcm00Q3RybCcsIGZ1bmN0aW9uICgkc2NvcGUsICRzdGF0ZVBhcmFtcywgRm9ybTRTZXJ2aWNlKSB7XG4gICAgJHNjb3BlLnJlZnJlc2ggPSBmdW5jdGlvbiAoKSB7XG4gICAgICAkc2NvcGUucmV0cnlXaXRoUHJvbWlzZShGb3JtNFNlcnZpY2UuZmluZEJ5SWQsIFskc3RhdGVQYXJhbXMuaWRdLCAzLCB0aGlzKVxuICAgICAgICAudGhlbihmdW5jdGlvbiAoZm9ybTREYXRhKSB7XG4gICAgICAgICAgJHNjb3BlLmZvcm00ID0gZm9ybTREYXRhO1xuICAgICAgICB9LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coXCJzYWQgZmFjZVwiKTtcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgICRzY29wZS5uYXZpZ2F0ZVRvID0gZnVuY3Rpb24gKHVybCkge1xuICAgICAgd2luZG93Lm9wZW4odXJsLCAnX2JsYW5rJywgJ2xvY2F0aW9uPXllcycpO1xuICAgIH07XG5cbiAgICAkc2NvcGUucmVmcmVzaCgpO1xuICB9KTtcbiIsIi8qZ2xvYmFscyBhbmd1bGFyLCB3aW5kb3cgKi9cbmFuZ3VsYXIubW9kdWxlKCdpbnNpZGVyLmNvbnRyb2xsZXJzJylcbiAgLmNvbnRyb2xsZXIoJ0luc2lkZXJDdHJsJywgZnVuY3Rpb24gKCRzdGF0ZSwgJHNjb3BlLCAkc3RhdGVQYXJhbXMsIEluc2lkZXJTZXJ2aWNlKSB7XG4gICAgJHNjb3BlLnNob3dUcmFkZXMgPSB0cnVlO1xuXG4gICAgJHNjb3BlLnJlZnJlc2ggPSBmdW5jdGlvbiAoKSB7XG4gICAgICAkc2NvcGUucmV0cnlXaXRoUHJvbWlzZShJbnNpZGVyU2VydmljZS5maW5kQnlJZCwgWyRzdGF0ZVBhcmFtcy5pZF0sIDMsIHRoaXMpXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uIChpbnNpZGVyRGF0YSkge1xuICAgICAgICAgICRzY29wZS5pbnNpZGVyID0gaW5zaWRlckRhdGE7XG4gICAgICAgIH0sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBjb25zb2xlLmxvZyhcInNhZCBmYWNlXCIpO1xuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgJHNjb3BlLnJlZnJlc2goKTtcblxuICAgICRzY29wZS5nb1RvQ29tcGFueSA9IGZ1bmN0aW9uIChjb21wYW55KSB7XG4gICAgICAkc3RhdGUuZ28oJ2FwcC5jb21wYW55Jywge1xuICAgICAgICBpZDogY29tcGFueS5pZFxuICAgICAgfSk7XG4gICAgfTtcbiAgICAkc2NvcGUuZ29Ub0Zvcm00ID0gZnVuY3Rpb24gKGZvcm00KSB7XG4gICAgICAkc3RhdGUuZ28oJ2FwcC5mb3JtNCcsIHtcbiAgICAgICAgaWQ6IGZvcm00LmlkXG4gICAgICB9KTtcbiAgICB9O1xuICB9KTtcbiIsImFuZ3VsYXIubW9kdWxlKCdpbnNpZGVyLmNvbnRyb2xsZXJzJylcbiAgLmNvbnRyb2xsZXIoJ0xvZ2luQ3RybCcsIGZ1bmN0aW9uICgkc3RhdGUsICRzY29wZSwgJGxvY2F0aW9uLCAkd2luZG93LCBMb2dpblNlcnZpY2UpIHtcbiAgICAkc2NvcGUudXNlciA9IHtcbiAgICAgIGVtYWlsOiAkd2luZG93LmxvY2FsU3RvcmFnZS5lbWFpbFxuICAgIH07XG4gICAgJHNjb3BlLmVycm9yTWVzc2FnZSA9IFwiXCI7XG4gICAgJHNjb3BlLmRvTG9naW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAkc2NvcGUuZXJyb3JNZXNzYWdlID0gJyc7XG4gICAgICBMb2dpblNlcnZpY2UubG9naW4oJHNjb3BlLnVzZXIpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAkd2luZG93LmxvY2FsU3RvcmFnZS5lbWFpbCA9ICRzY29wZS51c2VyLmVtYWlsO1xuICAgICAgICAkbG9jYXRpb24ucGF0aChcIi9cIik7XG4gICAgICB9LCBmdW5jdGlvbiAocmVzcCkge1xuICAgICAgICAkc2NvcGUuZXJyb3JNZXNzYWdlID0gcmVzcC5kYXRhLm1lc3NhZ2U7XG4gICAgICB9KTtcbiAgICB9O1xuICB9KTtcbiIsImFuZ3VsYXIubW9kdWxlKCdpbnNpZGVyLmNvbnRyb2xsZXJzJylcbiAgLmNvbnRyb2xsZXIoJ1JlZ2lzdGVyQ3RybCcsIGZ1bmN0aW9uICgkc3RhdGUsICRzY29wZSwgJHJvb3RTY29wZSwgJGxvY2F0aW9uLCBSZWdpc3RlclNlcnZpY2UpIHtcbiAgICAkc2NvcGUudXNlciA9IHsgZGV2aWNlX3Rva2VuOiAkcm9vdFNjb3BlLmRldmljZVRva2VuIH07XG4gICAgJHNjb3BlLmVycm9yTWVzc2FnZSA9ICcnO1xuICAgICRzY29wZS5kb1JlZ2lzdGVyID0gZnVuY3Rpb24gKCkge1xuICAgICAgJHNjb3BlLmVycm9yTWVzc2FnZSA9ICcnO1xuICAgICAgUmVnaXN0ZXJTZXJ2aWNlLnJlZ2lzdGVyKCRzY29wZS51c2VyKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgJGxvY2F0aW9uLnBhdGgoXCIvXCIpO1xuICAgICAgfSwgZnVuY3Rpb24gKHJlc3ApIHtcbiAgICAgICAgdmFyIGVycm9ycyA9IHJlc3AuZGF0YS5lcnJvcnMuam9pbihcIiwgXCIpO1xuICAgICAgICBjb25zb2xlLmxvZyhlcnJvcnMpO1xuICAgICAgICAkc2NvcGUuZXJyb3JNZXNzYWdlID0gZXJyb3JzO1xuICAgICAgfSk7XG4gICAgfTtcbiAgfSk7XG4iLCIvKmdsb2JhbHMgYW5ndWxhciwgd2luZG93ICovXG5hbmd1bGFyLm1vZHVsZSgnaW5zaWRlci5jb250cm9sbGVycycpXG4gIC5jb250cm9sbGVyKCdTZWFyY2hDdHJsJywgZnVuY3Rpb24gKCRzdGF0ZSwgJHNjb3BlLCBTZWFyY2hTZXJ2aWNlKSB7XG4gICAgJHNjb3BlLmtleXdvcmQgPSBcIlwiO1xuICAgICRzY29wZS5yZXN1bHRzID0gW107XG4gICAgJHNjb3BlLnNlYXJjaCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIFNlYXJjaFNlcnZpY2Uuc2VhcmNoKCRzY29wZS5rZXl3b3JkKS50aGVuKGZ1bmN0aW9uIChyZXNwKSB7XG4gICAgICAgICRzY29wZS5yZXN1bHRzID0gcmVzcC5kYXRhO1xuICAgICAgfSk7XG4gICAgfTtcblxuICAgICRzY29wZS5vcGVuUmVzdWx0ID0gZnVuY3Rpb24gKHJlc3VsdCkge1xuICAgICAgdmFyIHdoZXJlID0gKHJlc3VsdFsxXSA9PT0gJ0luc2lkZXInKSA/ICdhcHAuaW5zaWRlcicgOiAnYXBwLmNvbXBhbnknO1xuICAgICAgJHN0YXRlLmdvKHdoZXJlLCB7XG4gICAgICAgIGlkOiByZXN1bHRbMF1cbiAgICAgIH0pO1xuICAgIH07XG4gICAgJHNjb3BlLnNlYXJjaCgpO1xuICB9KTtcbiIsImFuZ3VsYXIubW9kdWxlKCdpbnNpZGVyLmNvbnRyb2xsZXJzJylcbiAgLmNvbnRyb2xsZXIoJ1N1YnNjcmliZUN0cmwnLCBmdW5jdGlvbiAoJHN0YXRlLCAkc2NvcGUsICRsb2NhdGlvbiwgU3Vic2NyaWJlU2VydmljZSkge1xuICAgICRzY29wZS51c2VyID0ge307XG4gICAgJHNjb3BlLmVycm9yTWVzc2FnZSA9IFwiXCI7XG5cbiAgICAkc2NvcGUuZG9TdWJzY3JpYmUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAkc2NvcGUuZXJyb3JNZXNzYWdlID0gJyc7XG4gICAgICBjb25zb2xlLmxvZygnU3Vic2NyaWJpbmcnKTtcbiAgICAgIFN1YnNjcmliZVNlcnZpY2Uuc3Vic2NyaWJlKCRzY29wZS5wcm9kdWN0c1swXSkudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICRsb2NhdGlvbi5wYXRoKFwiL1wiKTtcbiAgICAgIH0sIGZ1bmN0aW9uIChyZXNwKSB7XG4gICAgICAgICRzY29wZS5lcnJvck1lc3NhZ2UgPSByZXNwLmRhdGEubWVzc2FnZTtcbiAgICAgIH0pO1xuICAgIH07XG4gIH0pO1xuIiwiLypnbG9iYWxzIGFuZ3VsYXIsIHdpbmRvdyAqL1xuYW5ndWxhci5tb2R1bGUoJ2luc2lkZXIuY29udHJvbGxlcnMnKVxuIC5jb250cm9sbGVyKCdUb2RheXNCdXlzQ3RybCcsIGZ1bmN0aW9uICgkY2FjaGVGYWN0b3J5LCAkc3RhdGUsICRzY29wZSwgbG9jLCBCdXlJZGVhU2VydmljZSkge1xuICAgICRzY29wZS50cmFkZXMgPSBbXTtcblxuICAgIHZhciBsb2FkUmVtb3RlID0gZnVuY3Rpb24gKCkge1xuICAgICAgJHNjb3BlLnJldHJ5V2l0aFByb21pc2VQdWxsVG9SZWZyZXNoKEJ1eUlkZWFTZXJ2aWNlLmZpbmRUb2RheXMsIFtdLCAzLCB0aGlzKVxuICAgICAgICAudGhlbihmdW5jdGlvbiAodHJhZGVzKSB7XG4gICAgICAgICAgJHNjb3BlLnRyYWRlcyA9IHRyYWRlcztcbiAgICAgICAgfSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgIGNvbnNvbGUubG9nKFwic2FkIGZhY2VcIik7XG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgbG9hZFJlbW90ZSgpO1xuXG4gICAgJHNjb3BlLnJlZnJlc2ggPSBmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgY2FjaGUgPSAkY2FjaGVGYWN0b3J5LmdldCgnJGh0dHAnKTtcbiAgICAgIGNhY2hlLnJlbW92ZShsb2MuYXBpQmFzZSArICcvYXBpL3YyL2J1eXMuanNvbj90b2RheT10cnVlJyk7XG4gICAgICBsb2FkUmVtb3RlKCk7XG4gICAgfTtcblxuICAgICRzY29wZS5zaG93VHJhZGUgPSBmdW5jdGlvbiAoaWQpIHtcbiAgICAgICRzdGF0ZS5nbygnYXBwLnRyYWRlJywge1xuICAgICAgICBpZDogaWRcbiAgICAgIH0pO1xuICAgIH07XG5cbiAgICAkc2NvcGUuJG9uKCdhdXRoY2hhbmdlJywgZnVuY3Rpb24gKCkge1xuICAgICAgJHNjb3BlLnJlZnJlc2goKTtcbiAgICB9KTtcbiAgfSk7XG5cbiIsIi8qZ2xvYmFscyBhbmd1bGFyLCB3aW5kb3csIGRvY3VtZW50ICovXG5hbmd1bGFyLm1vZHVsZSgnaW5zaWRlci5jb250cm9sbGVycycpXG4gIC5jb250cm9sbGVyKCdUcmFkZUN0cmwnLCBmdW5jdGlvbiAoJHNjb3BlLCAkc3RhdGVQYXJhbXMsIEJ1eUlkZWFTZXJ2aWNlKSB7XG4gICAgJHNjb3BlLm5hdmlnYXRlVG8gPSBmdW5jdGlvbiAodXJsKSB7XG4gICAgICB3aW5kb3cub3Blbih1cmwsICdfYmxhbmsnLCAnbG9jYXRpb249eWVzJyk7XG4gICAgfTtcblxuICAgICRzY29wZS5yZWZyZXNoID0gZnVuY3Rpb24gKCkge1xuICAgICAgJHNjb3BlLnJldHJ5V2l0aFByb21pc2UoQnV5SWRlYVNlcnZpY2UuZmluZEJ5SWQsIFskc3RhdGVQYXJhbXMuaWRdLCAzLCB0aGlzKVxuICAgICAgICAudGhlbihmdW5jdGlvbiAodHJhZGUpIHtcbiAgICAgICAgICAkc2NvcGUudHJhZGUgPSB0cmFkZTtcbiAgICAgICAgfSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgIGNvbnNvbGUubG9nKFwic2FkIGZhY2VcIik7XG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgJHNjb3BlLnJlZnJlc2goKTtcbiAgfSk7XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
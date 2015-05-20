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
      .state('app.form4s', {
        url: '/form4s',
        views: {
          'menuContent': {
            templateUrl: 'templates/form4s.html',
            controller: 'Form4sCtrl'
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
      console.log('platform ready');
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

      console.log('window.cordova?:' + window.cordova);
      if (window.cordova) {
        console.log('trying cordova push registration');
        $cordovaPush.register(iosConfig).then(function(result) {
          console.log('DEVICE TOKEN:' + result);
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

    function uri(id) {
     if(id) {
        return loc.apiBase + '/api/v2/form4s/' + id + '.json';
      }
      return loc.apiBase + '/api/v2/form4s.json';
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

      allToday: function (offset) {
        var deferred = $q.defer();
        var seen = {};
        $http.get(uri() + "?today=true&offset=" + offset).then(function (resp) {
          var pureResult = [];
          resp.data.forEach(function (filing) {
            var key = filing.insider_name + filing.company_id + filing.insider_id;
            if(!seen[key]) {
              pureResult.push(filing);
              seen[key] = true;
            }
          });

          deferred.resolve(pureResult);
        }, function (resp) {
          deferred.reject(resp.data);
        });
        return deferred.promise;
      }
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
        console.log(userParams);
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
  .controller('Form4sCtrl', function ($cacheFactory, $state, $scope, loc, Form4Service) {
    this.offset = 0;
    var _form4s = [];
    var loadRemote = function (offset) {
      $scope.retryWithPromisePullToRefresh(Form4Service.allToday, [offset], 3, this)
        .then(function (form4s) {
          _form4s = _.uniq(_form4s.concat(form4s), 'id');
          $scope.form4s = _form4s;
          $scope.$broadcast('scroll.infiniteScrollComplete');
        }, function () {
          // TODO: show no trades found thing
          $scope.form4s = [];
        });
    };

    $scope.fetchMore = function () {
      if(_form4s.length > 1) {
        this.offset += 20;
      }
      console.log(this.offset);
      loadRemote(this.offset);
    }.bind(this);

    $scope.refresh = function () {
      var cache = $cacheFactory.get('$http');
      cache.remove(loc.apiBase + '/api/v2/form4s.json?today=true');
      loadRemote();
    };

    $scope.$on('$stateChangeSuccess', function() {
      $scope.fetchMore();
    });

    $scope.$on('authchange', function () {
      $scope.refresh();
    });
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
  .controller('LoginCtrl', function ($state, $scope, $rootScope, $location, $window, LoginService) {
    $scope.user = {
      email: $window.localStorage.email,
      device: { platform: 'ios', token: $rootScope.deviceToken }
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImF1dGhfaHR0cF9yZXBvbnNlX2ludGVyY2VwdG9yLmpzIiwiY29tcGFueV9zZXJ2aWNlLmpzIiwiZmVlZGJhY2tfc2VydmljZS5qcyIsImZvcm00X3NlcnZpY2UuanMiLCJpZGVhX3NlcnZpY2UuanMiLCJpbnNpZGVyX3NlcnZpY2UuanMiLCJsb2dpbl9zZXJpdmNlLmpzIiwicmVnaXN0ZXJfc2VydmljZS5qcyIsInNlYXJjaF9zZXJpdmNlLmpzIiwic3Vic2NyaWJlX3NlcnZpY2UuanMiLCJhcHBfY29udHJvbGxlci5qcyIsImJ1eXNfY29udHJvbGxlci5qcyIsImNvbXBhbnlfY29udHJvbGxlci5qcyIsImRpc2NsYWltZXJfY29udHJvbGxlci5qcyIsImZlZWRiYWNrX2NvbnRyb2xsZXIuanMiLCJmb3JtNF9jb250cm9sbGVyLmpzIiwiZm9ybTRzX2NvbnRyb2xsZXIuanMiLCJpbnNpZGVyX2NvbnRyb2xsZXIuanMiLCJsb2dpbl9jb250cm9sbGVyLmpzIiwicmVnaXN0ZXJfY29udHJvbGxlci5qcyIsInNlYXJjaF9jb250cm9sbGVyLmpzIiwic3Vic2NyaWJlX2NvbnRyb2xsZXIuanMiLCJ0b2RheXNfYnV5c19jb250cm9sbGVyLmpzIiwidHJhZGVfY29udHJvbGxlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNwTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNsQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNiQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNyREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzNDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDdEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNiQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDN0VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDOUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM1QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2xCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3ZDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDaENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJhbGwuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKmdsb2JhbCB3aW5kb3csIGNvcmRvdmEsIGFuZ3VsYXIgKi9cbnZhciBhcHAgPSBhbmd1bGFyLm1vZHVsZSgnaW5zaWRlcicsIFtcbiAgICAnaW9uaWMnLFxuICAgICdpbnNpZGVyLnNlcnZpY2VzJyxcbiAgICAnaW5zaWRlci5jb250cm9sbGVycycsXG4gICAgJ25nQ29yZG92YScsXG4gICAgJ25nU3RvcmVraXQnXG4gIF0pXG4gIC5jb25zdGFudCgnbG9jJywge1xuICAgIC8vIGFwaUJhc2U6ICdodHRwOi8vbG9jYWxob3N0OjMwMDInXG4gICAgYXBpQmFzZTogJ2h0dHBzOi8vaW5zaWRlcmFpLmNvbSdcbiAgfSlcbiAgLmNvbmZpZyhmdW5jdGlvbigkc3RhdGVQcm92aWRlciwgJHVybFJvdXRlclByb3ZpZGVyKSB7XG4gICAgJHN0YXRlUHJvdmlkZXJcbiAgICAgIC5zdGF0ZSgncmVnaXN0ZXInLCB7XG4gICAgICAgIHVybDogJy9yZWdpc3RlcicsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAndGVtcGxhdGVzL3JlZ2lzdGVyLmh0bWwnLFxuICAgICAgICBjb250cm9sbGVyOiAnUmVnaXN0ZXJDdHJsJ1xuICAgICAgfSlcbiAgICAgIC5zdGF0ZSgnc3Vic2NyaWJlJywge1xuICAgICAgICB1cmw6ICcvc3Vic2NyaWJlJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICd0ZW1wbGF0ZXMvc3Vic2NyaWJlLmh0bWwnLFxuICAgICAgICBjb250cm9sbGVyOiAnU3Vic2NyaWJlQ3RybCdcbiAgICAgIH0pXG4gICAgICAuc3RhdGUoJ2xvZ2luJywge1xuICAgICAgICB1cmw6ICcvbG9naW4nLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ3RlbXBsYXRlcy9sb2dpbi5odG1sJyxcbiAgICAgICAgY29udHJvbGxlcjogJ0xvZ2luQ3RybCdcbiAgICAgIH0pXG4gICAgICAuc3RhdGUoJ2FwcCcsIHtcbiAgICAgICAgdXJsOiAnL2FwcCcsXG4gICAgICAgIGFic3RyYWN0OiB0cnVlLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ3RlbXBsYXRlcy9tZW51Lmh0bWwnLFxuICAgICAgICBjb250cm9sbGVyOiAnQXBwQ3RybCdcbiAgICAgIH0pXG4gICAgICAuc3RhdGUoJ2FwcC5mZWVkYmFjaycsIHtcbiAgICAgICAgdXJsOiAnL2ZlZWRiYWNrJyxcbiAgICAgICAgdmlld3M6IHtcbiAgICAgICAgICAnbWVudUNvbnRlbnQnOiB7XG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogJ3RlbXBsYXRlcy9mZWVkYmFjay5odG1sJyxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdGZWVkYmFja0N0cmwnXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KVxuICAgICAgLnN0YXRlKCdhcHAuYnV5cycsIHtcbiAgICAgICAgdXJsOiAnL2J1eXMnLFxuICAgICAgICB2aWV3czoge1xuICAgICAgICAgICdtZW51Q29udGVudCc6IHtcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAndGVtcGxhdGVzL2J1eXMuaHRtbCcsXG4gICAgICAgICAgICBjb250cm9sbGVyOiAnQnV5c0N0cmwnXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KVxuICAgICAgLnN0YXRlKCdhcHAuZm9ybTRzJywge1xuICAgICAgICB1cmw6ICcvZm9ybTRzJyxcbiAgICAgICAgdmlld3M6IHtcbiAgICAgICAgICAnbWVudUNvbnRlbnQnOiB7XG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogJ3RlbXBsYXRlcy9mb3JtNHMuaHRtbCcsXG4gICAgICAgICAgICBjb250cm9sbGVyOiAnRm9ybTRzQ3RybCdcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgICAuc3RhdGUoJ2FwcC50b2RheScsIHtcbiAgICAgICAgdXJsOiAnL3RvZGF5JyxcbiAgICAgICAgdmlld3M6IHtcbiAgICAgICAgICAnbWVudUNvbnRlbnQnOiB7XG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogJ3RlbXBsYXRlcy90b2RheS5odG1sJyxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdUb2RheXNCdXlzQ3RybCdcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgICAuc3RhdGUoJ2FwcC50cmFkZScsIHtcbiAgICAgICAgdXJsOiAnL3RyYWRlcy86aWQnLFxuICAgICAgICB2aWV3czoge1xuICAgICAgICAgICdtZW51Q29udGVudCc6IHtcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAndGVtcGxhdGVzL3RyYWRlLmh0bWwnLFxuICAgICAgICAgICAgY29udHJvbGxlcjogJ1RyYWRlQ3RybCdcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgICAuc3RhdGUoJ2FwcC5pbnNpZGVyJywge1xuICAgICAgICB1cmw6ICcvaW5zaWRlcnMvOmlkJyxcbiAgICAgICAgdmlld3M6IHtcbiAgICAgICAgICAnbWVudUNvbnRlbnQnOiB7XG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogJ3RlbXBsYXRlcy9pbnNpZGVyLmh0bWwnLFxuICAgICAgICAgICAgY29udHJvbGxlcjogJ0luc2lkZXJDdHJsJ1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSlcbiAgICAgIC5zdGF0ZSgnYXBwLmZvcm00Jywge1xuICAgICAgICB1cmw6ICcvZm9ybTRzLzppZCcsXG4gICAgICAgIHZpZXdzOiB7XG4gICAgICAgICAgJ21lbnVDb250ZW50Jzoge1xuICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICd0ZW1wbGF0ZXMvZm9ybTQuaHRtbCcsXG4gICAgICAgICAgICBjb250cm9sbGVyOiAnRm9ybTRDdHJsJ1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSlcbiAgICAgIC5zdGF0ZSgnYXBwLmNvbXBhbnknLCB7XG4gICAgICAgIHVybDogJy9jb21wYW5pZXMvOmlkJyxcbiAgICAgICAgdmlld3M6IHtcbiAgICAgICAgICAnbWVudUNvbnRlbnQnOiB7XG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogJ3RlbXBsYXRlcy9jb21wYW55Lmh0bWwnLFxuICAgICAgICAgICAgY29udHJvbGxlcjogJ0NvbXBhbnlDdHJsJ1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSlcbiAgICAgIC5zdGF0ZSgnYXBwLnNlYXJjaCcsIHtcbiAgICAgICAgdXJsOiAnL3NlYXJjaCcsXG4gICAgICAgIHZpZXdzOiB7XG4gICAgICAgICAgJ21lbnVDb250ZW50Jzoge1xuICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICd0ZW1wbGF0ZXMvc2VhcmNoLmh0bWwnLFxuICAgICAgICAgICAgY29udHJvbGxlcjogJ1NlYXJjaEN0cmwnXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KVxuICAgICAgLnN0YXRlKCdhcHAuZGlzY2xhaW1lcicsIHtcbiAgICAgICAgdXJsOiAnL2Rpc2NsYWltZXInLFxuICAgICAgICB2aWV3czoge1xuICAgICAgICAgICdtZW51Q29udGVudCc6IHtcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAndGVtcGxhdGVzL2Rpc2NsYWltZXIuaHRtbCcsXG4gICAgICAgICAgICBjb250cm9sbGVyOiAnRGlzY2xhaW1lckN0cmwnXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAvLyBpZiBub25lIG9mIHRoZSBhYm92ZSBzdGF0ZXMgYXJlIG1hdGNoZWQsIHVzZSB0aGlzIGFzIHRoZSBmYWxsYmFja1xuICAgICR1cmxSb3V0ZXJQcm92aWRlci5vdGhlcndpc2UoJy9hcHAvYnV5cycpO1xuICB9KVxuICAuY29uZmlnKFsnJGh0dHBQcm92aWRlcicsIGZ1bmN0aW9uKCRodHRwUHJvdmlkZXIpIHtcbiAgICAkaHR0cFByb3ZpZGVyLmRlZmF1bHRzLndpdGhDcmVkZW50aWFscyA9IHRydWU7XG4gICAgJGh0dHBQcm92aWRlci5pbnRlcmNlcHRvcnMucHVzaCgnYXV0aEh0dHBSZXNwb25zZUludGVyY2VwdG9yJyk7XG4gIH1dKVxuICAucnVuKGZ1bmN0aW9uKCRzdGF0ZSwgJGlvbmljUGxhdGZvcm0sICRjb3Jkb3ZhUHVzaCwgJHJvb3RTY29wZSwgJHN0b3Jla2l0KSB7XG4gICAgJGlvbmljUGxhdGZvcm0ucmVhZHkoZnVuY3Rpb24oKSB7XG4gICAgICBjb25zb2xlLmxvZygncGxhdGZvcm0gcmVhZHknKTtcbiAgICAgICRzdG9yZWtpdFxuICAgICAgICAuc2V0TG9nZ2luZyh0cnVlKVxuICAgICAgICAubG9hZChbJ2NvbS5pbnNpZGVyYWkuaW9zLjF5ciddKVxuICAgICAgICAudGhlbihmdW5jdGlvbihwcm9kdWN0cykge1xuICAgICAgICAgICRyb290U2NvcGUucHJvZHVjdHMgPSBwcm9kdWN0cztcbiAgICAgICAgICBjb25zb2xlLmxvZyhwcm9kdWN0cyk7XG4gICAgICAgICAgY29uc29sZS5sb2coJ3Byb2R1Y3RzIGxvYWRlZCcpO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZnVuY3Rpb24oKSB7XG4gICAgICAgICAgJHJvb3RTY29wZS5wcm9kdWN0cyA9IFtdO1xuICAgICAgICAgIGNvbnNvbGUubG9nKCdwcm9kdWN0IGxvYWQgZXJyb3InLCBhcmd1bWVudHMpO1xuICAgICAgICB9KTtcblxuICAgICAgLy8gSGlkZSB0aGUgYWNjZXNzb3J5IGJhciBieSBkZWZhdWx0IChyZW1vdmUgdGhpcyB0byBzaG93IHRoZSBhY2Nlc3NvcnkgYmFyIGFib3ZlIHRoZSBrZXlib2FyZFxuICAgICAgLy8gZm9yIGZvcm0gaW5wdXRzKVxuICAgICAgaWYgKHdpbmRvdy5jb3Jkb3ZhICYmIHdpbmRvdy5jb3Jkb3ZhLnBsdWdpbnMuS2V5Ym9hcmQpIHtcbiAgICAgICAgY29yZG92YS5wbHVnaW5zLktleWJvYXJkLmhpZGVLZXlib2FyZEFjY2Vzc29yeUJhcih0cnVlKTtcbiAgICAgIH1cblxuICAgICAgaWYgKHdpbmRvdy5TdGF0dXNCYXIpIHtcbiAgICAgICAgLy8gb3JnLmFwYWNoZS5jb3Jkb3ZhLnN0YXR1c2JhciByZXF1aXJlZFxuICAgICAgICB3aW5kb3cuU3RhdHVzQmFyLnN0eWxlTGlnaHRDb250ZW50KCk7XG4gICAgICB9XG5cbiAgICAgIHZhciBpb3NDb25maWcgPSB7XG4gICAgICAgIFwiYmFkZ2VcIjogXCJ0cnVlXCIsXG4gICAgICAgIFwic291bmRcIjogXCJ0cnVlXCIsXG4gICAgICAgIFwiYWxlcnRcIjogXCJ0cnVlXCIsXG4gICAgICAgIFwiZWNiXCI6IFwib25Ob3RpZmljYXRpb25BUE5cIlxuICAgICAgfTtcblxuICAgICAgY29uc29sZS5sb2coJ3dpbmRvdy5jb3Jkb3ZhPzonICsgd2luZG93LmNvcmRvdmEpO1xuICAgICAgaWYgKHdpbmRvdy5jb3Jkb3ZhKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCd0cnlpbmcgY29yZG92YSBwdXNoIHJlZ2lzdHJhdGlvbicpO1xuICAgICAgICAkY29yZG92YVB1c2gucmVnaXN0ZXIoaW9zQ29uZmlnKS50aGVuKGZ1bmN0aW9uKHJlc3VsdCkge1xuICAgICAgICAgIGNvbnNvbGUubG9nKCdERVZJQ0UgVE9LRU46JyArIHJlc3VsdCk7XG4gICAgICAgICAgJHJvb3RTY29wZS5kZXZpY2VUb2tlbiA9IHJlc3VsdDtcbiAgICAgICAgfSwgZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coXCJub3QgYWJsZSB0byBzZW5kIHB1c2hcIiwgZXJyKTtcbiAgICAgICAgfSk7XG4gICAgICAgIC8vICRjb3Jkb3ZhUHVzaC51bnJlZ2lzdGVyKG9wdGlvbnMpLnRoZW4oZnVuY3Rpb24ocmVzdWx0KSB7XG4gICAgICAgIC8vICAgYWxlcnQoXCJ1bnJlZ2lzdGVyXCIpO1xuICAgICAgICAvLyAgIGFsZXJ0KHJlc3VsdCk7XG4gICAgICAgIC8vICAgYWxlcnQoYXJndW1lbnRzKTtcbiAgICAgICAgLy8gICAgIC8vIFN1Y2Nlc3MhXG4gICAgICAgIC8vIH0sIGZ1bmN0aW9uKGVycikge1xuICAgICAgICAvLyAgIGFsZXJ0KFwiZXJyb3JcIik7XG4gICAgICAgIC8vICAgYWxlcnQoZXJyKTtcbiAgICAgICAgLy8gICAgIC8vIEFuIGVycm9yIG9jY3VyZWQuIFNob3cgYSBtZXNzYWdlIHRvIHRoZSB1c2VyXG4gICAgICAgIC8vIH0pO1xuICAgICAgICAvL1xuICAgICAgICAvLyAvLyBpT1Mgb25seVxuXG4gICAgICAgIHdpbmRvdy5vbk5vdGlmaWNhdGlvbkFQTiA9IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICBjb25zb2xlLmxvZygnb24gbm90aWZpY2F0aW9uOicsIGUpO1xuICAgICAgICAgIGlmIChlLmFsZXJ0KSB7XG4gICAgICAgICAgICAkc3RhdGUuZ28oJ2FwcC50cmFkZScsIHtcbiAgICAgICAgICAgICAgaWQ6IGUuaWRlYV9pZFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKGUuc291bmQpIHtcbiAgICAgICAgICAgIHZhciBzbmQgPSBuZXcgTWVkaWEoZS5zb3VuZCk7XG4gICAgICAgICAgICBzbmQucGxheSgpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChlLmJhZGdlKSB7XG4gICAgICAgICAgICAkY29yZG92YVB1c2guc2V0QmFkZ2VOdW1iZXIoZS5iYWRnZSkudGhlbihmdW5jdGlvbihyZXN1bHQpIHtcbiAgICAgICAgICAgICAgY29uc29sZS5sb2cocmVzdWx0KTtcbiAgICAgICAgICAgIH0sIGZ1bmN0aW9uKGVycikge1xuICAgICAgICAgICAgICBjb25zb2xlLmxvZyhlcnIpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgfVxuICAgIH0pO1xuICB9KTtcbiIsImFuZ3VsYXIubW9kdWxlKCdpbnNpZGVyLnNlcnZpY2VzJywgW10pXG4gIC5mYWN0b3J5KCdhdXRoSHR0cFJlc3BvbnNlSW50ZXJjZXB0b3InLCBbJyRxJywgJyRsb2NhdGlvbicsXG4gICAgZnVuY3Rpb24gKCRxLCAkbG9jYXRpb24pIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHJlc3BvbnNlRXJyb3I6IGZ1bmN0aW9uIChyZWplY3Rpb24pIHtcbiAgICAgICAgICBpZiAocmVqZWN0aW9uLnN0YXR1cyA9PT0gNDAxKSB7XG4gICAgICAgICAgICAkbG9jYXRpb24ucGF0aCgnL2xvZ2luJyk7XG4gICAgICAgICAgICByZXR1cm4gJHEucmVqZWN0KHJlamVjdGlvbik7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChyZWplY3Rpb24uc3RhdHVzID09PSA0MDMpIHtcbiAgICAgICAgICAgICRsb2NhdGlvbi5wYXRoKCcvc3Vic2NyaWJlJyk7XG4gICAgICAgICAgICByZXR1cm4gJHEucmVqZWN0KHJlamVjdGlvbik7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiAkcS5yZWplY3QocmVqZWN0aW9uKTtcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICB9XG4gIF0pO1xuIiwiLypnbG9iYWxzIGFuZ3VsYXIsIF8gKi9cbmFuZ3VsYXIubW9kdWxlKCdpbnNpZGVyLnNlcnZpY2VzJylcbiAgLmZhY3RvcnkoJ0NvbXBhbnlTZXJ2aWNlJywgZnVuY3Rpb24obG9jLCAkcSwgJGh0dHApIHtcbiAgICBmdW5jdGlvbiB1cmwoaWQpIHtcbiAgICAgaWYoaWQpIHtcbiAgICAgICAgcmV0dXJuIGxvYy5hcGlCYXNlICsgJy9hcGkvdjEvY29tcGFuaWVzLycgKyBpZCArICcuanNvbic7XG4gICAgICB9XG4gICAgICByZXR1cm4gbG9jLmFwaUJhc2UgKyAnL2FwaS92MS9jb21wYW5pZXMuanNvbic7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIGZpbmRCeUlkOiBmdW5jdGlvbiAoaWQpIHtcbiAgICAgICAgdmFyIGRlZmVycmVkID0gJHEuZGVmZXIoKTtcbiAgICAgICAgJGh0dHAuZ2V0KHVybChpZCkpLnRoZW4oZnVuY3Rpb24gKHJlc3ApIHtcbiAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKHJlc3AuZGF0YSk7XG4gICAgICAgIH0sIGZ1bmN0aW9uIChyZXNwKSB7XG4gICAgICAgICAgZGVmZXJyZWQucmVqZWN0KHJlc3AuZGF0YSk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbiAgICAgIH0sXG4gICAgfTtcbiAgfSk7XG5cbiIsIi8qZ2xvYmFscyBhbmd1bGFyLCBfICovXG5hbmd1bGFyLm1vZHVsZSgnaW5zaWRlci5zZXJ2aWNlcycpXG4gIC5mYWN0b3J5KCdGZWVkYmFja1NlcnZpY2UnLCBmdW5jdGlvbihsb2MsICRodHRwKSB7XG4gICAgZnVuY3Rpb24gdXJsKCkge1xuICAgICAgcmV0dXJuIGxvYy5hcGlCYXNlICsgJy9hcGkvdjIvZmVlZGJhY2tzJztcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgc3VibWl0RmVlZGJhY2s6IGZ1bmN0aW9uIChmZWVkYmFja1BhcmFtcykge1xuICAgICAgICByZXR1cm4gJGh0dHAucG9zdCh1cmwoKSwgZmVlZGJhY2tQYXJhbXMpO1xuICAgICAgfVxuICAgIH07XG4gIH0pO1xuIiwiLypnbG9iYWxzIGFuZ3VsYXIsIF8gKi9cbmFuZ3VsYXIubW9kdWxlKCdpbnNpZGVyLnNlcnZpY2VzJylcbiAgLmZhY3RvcnkoJ0Zvcm00U2VydmljZScsIGZ1bmN0aW9uKGxvYywgJHEsICRodHRwKSB7XG4gICAgZnVuY3Rpb24gdXJsKGlkKSB7XG4gICAgIGlmKGlkKSB7XG4gICAgICAgIHJldHVybiBsb2MuYXBpQmFzZSArICcvYXBpL3YxL2Zvcm00cy8nICsgaWQgKyAnLmpzb24nO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGxvYy5hcGlCYXNlICsgJy9hcGkvdjEvZm9ybTRzLmpzb24nO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHVyaShpZCkge1xuICAgICBpZihpZCkge1xuICAgICAgICByZXR1cm4gbG9jLmFwaUJhc2UgKyAnL2FwaS92Mi9mb3JtNHMvJyArIGlkICsgJy5qc29uJztcbiAgICAgIH1cbiAgICAgIHJldHVybiBsb2MuYXBpQmFzZSArICcvYXBpL3YyL2Zvcm00cy5qc29uJztcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgZmluZEJ5SWQ6IGZ1bmN0aW9uIChpZCkge1xuICAgICAgICB2YXIgZGVmZXJyZWQgPSAkcS5kZWZlcigpO1xuICAgICAgICAkaHR0cC5nZXQodXJsKGlkKSkudGhlbihmdW5jdGlvbiAocmVzcCkge1xuICAgICAgICAgIHZhciBmaWxpbmcgPSByZXNwLmRhdGE7XG4gICAgICAgICAgdmFyIGRvYyA9IEpTT04ucGFyc2UocmVzcC5kYXRhLmZpbGluZyk7XG4gICAgICAgICAgZmlsaW5nLm5vbkRlcml2YXRpdmVUcmFuc2FjdGlvbnMgPSBkb2MudHJhbnNhY3Rpb25zO1xuICAgICAgICAgIGZpbGluZy5kZXJpdmF0aXZlVHJhbnNhY3Rpb25zID0gZG9jLmRlcml2YXRpdmVfdHJhbnNhY3Rpb25zO1xuICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUoZmlsaW5nKTtcbiAgICAgICAgfSwgZnVuY3Rpb24gKHJlc3ApIHtcbiAgICAgICAgICBkZWZlcnJlZC5yZWplY3QocmVzcC5kYXRhKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xuICAgICAgfSxcblxuICAgICAgYWxsVG9kYXk6IGZ1bmN0aW9uIChvZmZzZXQpIHtcbiAgICAgICAgdmFyIGRlZmVycmVkID0gJHEuZGVmZXIoKTtcbiAgICAgICAgdmFyIHNlZW4gPSB7fTtcbiAgICAgICAgJGh0dHAuZ2V0KHVyaSgpICsgXCI/dG9kYXk9dHJ1ZSZvZmZzZXQ9XCIgKyBvZmZzZXQpLnRoZW4oZnVuY3Rpb24gKHJlc3ApIHtcbiAgICAgICAgICB2YXIgcHVyZVJlc3VsdCA9IFtdO1xuICAgICAgICAgIHJlc3AuZGF0YS5mb3JFYWNoKGZ1bmN0aW9uIChmaWxpbmcpIHtcbiAgICAgICAgICAgIHZhciBrZXkgPSBmaWxpbmcuaW5zaWRlcl9uYW1lICsgZmlsaW5nLmNvbXBhbnlfaWQgKyBmaWxpbmcuaW5zaWRlcl9pZDtcbiAgICAgICAgICAgIGlmKCFzZWVuW2tleV0pIHtcbiAgICAgICAgICAgICAgcHVyZVJlc3VsdC5wdXNoKGZpbGluZyk7XG4gICAgICAgICAgICAgIHNlZW5ba2V5XSA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKHB1cmVSZXN1bHQpO1xuICAgICAgICB9LCBmdW5jdGlvbiAocmVzcCkge1xuICAgICAgICAgIGRlZmVycmVkLnJlamVjdChyZXNwLmRhdGEpO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG4gICAgICB9XG4gICAgfTtcbiAgfSk7XG4iLCIvKmdsb2JhbHMgYW5ndWxhciwgXyAqL1xuYW5ndWxhci5tb2R1bGUoJ2luc2lkZXIuc2VydmljZXMnKVxuICAuZmFjdG9yeSgnQnV5SWRlYVNlcnZpY2UnLCBmdW5jdGlvbihsb2MsICRxLCAkaHR0cCkge1xuICAgIGZ1bmN0aW9uIHVybChpZCkge1xuICAgICAgaWYoaWQpIHtcbiAgICAgICAgcmV0dXJuIGxvYy5hcGlCYXNlICsgJy9hcGkvdjIvYnV5cy8nICsgaWQgKyAnLmpzb24nO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGxvYy5hcGlCYXNlICsgJy9hcGkvdjIvYnV5cy5qc29uJztcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgZmluZEFsbDogZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgZGVmZXJyZWQgPSAkcS5kZWZlcigpO1xuICAgICAgICAkaHR0cC5nZXQodXJsKCksIHsgY2FjaGU6IHRydWUgfSlcbiAgICAgICAgICAudGhlbihmdW5jdGlvbiAocmVzcCkge1xuICAgICAgICAgICAgZGVmZXJyZWQucmVzb2x2ZShyZXNwLmRhdGEpO1xuICAgICAgICAgIH0sIGZ1bmN0aW9uIChyZXNwKSB7XG4gICAgICAgICAgICBkZWZlcnJlZC5yZWplY3QocmVzcC5kYXRhKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG4gICAgICB9LFxuXG4gICAgICBmaW5kQnlJZDogZnVuY3Rpb24gKGlkKSB7XG4gICAgICAgIHZhciBkZWZlcnJlZCA9ICRxLmRlZmVyKCk7XG4gICAgICAgICRodHRwLmdldCh1cmwoaWQpLCB7IGNhY2hlOiB0cnVlIH0pXG4gICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKHJlc3ApIHtcbiAgICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUocmVzcC5kYXRhKTtcbiAgICAgICAgICB9LCBmdW5jdGlvbiAocmVzcCkge1xuICAgICAgICAgICAgZGVmZXJyZWQucmVqZWN0KHJlc3AuZGF0YSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xuICAgICAgfSxcblxuICAgICAgZmluZFRvZGF5czogZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgZGVmZXJyZWQgPSAkcS5kZWZlcigpO1xuICAgICAgICAkaHR0cC5nZXQodXJsKCksIHsgcGFyYW1zOiB7ICd0b2RheSc6IHRydWUgfSwgY2FjaGU6IHRydWUgfSlcbiAgICAgICAgICAudGhlbihmdW5jdGlvbiAocmVzcCkge1xuICAgICAgICAgICAgZGVmZXJyZWQucmVzb2x2ZShyZXNwLmRhdGEpO1xuICAgICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbiAgICAgIH1cbiAgICB9O1xuICB9KTtcbiIsIi8qZ2xvYmFscyBhbmd1bGFyLCBfICovXG5hbmd1bGFyLm1vZHVsZSgnaW5zaWRlci5zZXJ2aWNlcycpXG4gIC5mYWN0b3J5KCdJbnNpZGVyU2VydmljZScsIGZ1bmN0aW9uKGxvYywgJHEsICRodHRwKSB7XG4gICAgZnVuY3Rpb24gdXJsKGlkKSB7XG4gICAgIGlmKGlkKSB7XG4gICAgICAgIHJldHVybiBsb2MuYXBpQmFzZSArICcvYXBpL3YxL2luc2lkZXJzLycgKyBpZCArICcuanNvbic7XG4gICAgICB9XG4gICAgICByZXR1cm4gbG9jLmFwaUJhc2UgKyAnL2FwaS92MS9pbnNpZGVycy5qc29uJztcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgZmluZEJ5SWQ6IGZ1bmN0aW9uIChpZCkge1xuICAgICAgICB2YXIgZGVmZXJyZWQgPSAkcS5kZWZlcigpO1xuICAgICAgICAkaHR0cC5nZXQodXJsKGlkKSkudGhlbihmdW5jdGlvbiAocmVzcCkge1xuICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUocmVzcC5kYXRhKTtcbiAgICAgICAgfSwgZnVuY3Rpb24gKHJlc3ApIHtcbiAgICAgICAgICBkZWZlcnJlZC5yZWplY3QocmVzcC5kYXRhKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xuICAgICAgfSxcbiAgICB9O1xuICB9KTtcbiIsIi8qZ2xvYmFscyBhbmd1bGFyLCBfICovXG5hbmd1bGFyLm1vZHVsZSgnaW5zaWRlci5zZXJ2aWNlcycpXG4gIC5mYWN0b3J5KCdMb2dpblNlcnZpY2UnLCBmdW5jdGlvbihsb2MsICRodHRwKSB7XG4gICAgZnVuY3Rpb24gdXJsKCkge1xuICAgICAgcmV0dXJuIGxvYy5hcGlCYXNlICsgJy9hcGkvdjIvc2Vzc2lvbic7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIGxvZ2luOiBmdW5jdGlvbiAodXNlclBhcmFtcykge1xuICAgICAgICBjb25zb2xlLmxvZyh1c2VyUGFyYW1zKTtcbiAgICAgICAgcmV0dXJuICRodHRwLnBvc3QodXJsKCksIHVzZXJQYXJhbXMpO1xuICAgICAgfVxuICAgIH07XG4gIH0pO1xuIiwiLypnbG9iYWxzIGFuZ3VsYXIsIF8gKi9cbmFuZ3VsYXIubW9kdWxlKCdpbnNpZGVyLnNlcnZpY2VzJylcbiAgLmZhY3RvcnkoJ1JlZ2lzdGVyU2VydmljZScsIGZ1bmN0aW9uKGxvYywgJGh0dHApIHtcbiAgICBmdW5jdGlvbiB1cmwoKSB7XG4gICAgICByZXR1cm4gbG9jLmFwaUJhc2UgKyAnL2FwaS92Mi91c2Vycyc7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIHJlZ2lzdGVyOiBmdW5jdGlvbiAodXNlclBhcmFtcykge1xuICAgICAgICB1c2VyUGFyYW1zLnBsYXRmb3JtID0gJ2lvcyc7XG4gICAgICAgIHJldHVybiAkaHR0cC5wb3N0KHVybCgpLCB1c2VyUGFyYW1zKTtcbiAgICAgIH1cbiAgICB9O1xuICB9KTtcbiIsIi8qZ2xvYmFscyBhbmd1bGFyLCBfICovXG5hbmd1bGFyLm1vZHVsZSgnaW5zaWRlci5zZXJ2aWNlcycpXG4gIC5mYWN0b3J5KCdTZWFyY2hTZXJ2aWNlJywgZnVuY3Rpb24obG9jLCAkaHR0cCkge1xuICAgIGZ1bmN0aW9uIHVybChxKSB7XG4gICAgICByZXR1cm4gbG9jLmFwaUJhc2UgKyAnL2FwaS92MS9zZWFyY2g/cT0nICsgcTtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgc2VhcmNoOiBmdW5jdGlvbiAoa2V5d29yZCkge1xuICAgICAgICByZXR1cm4gJGh0dHAuZ2V0KHVybChrZXl3b3JkKSwgeyBjYWNoZTogdHJ1ZSB9KTtcbiAgICAgIH1cbiAgICB9O1xuICB9KTtcbiIsIi8qZ2xvYmFscyBhbmd1bGFyLCBfICovXG5hbmd1bGFyLm1vZHVsZSgnaW5zaWRlci5zZXJ2aWNlcycpXG4gIC5mYWN0b3J5KCdTdWJzY3JpYmVTZXJ2aWNlJywgZnVuY3Rpb24obG9jLCAkaHR0cCwgJHN0b3Jla2l0KSB7XG4gICAgZnVuY3Rpb24gdXJsKCkge1xuICAgICAgcmV0dXJuIGxvYy5hcGlCYXNlICsgJy9hcGkvdjIvc3Vic2NyaXB0aW9ucyc7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIHN1YnNjcmliZTogZnVuY3Rpb24gKHByb2R1Y3QpIHtcbiAgICAgICAgJHN0b3Jla2l0LnB1cmNoYXNlKHByb2R1Y3QuaWQpO1xuICAgICAgICByZXR1cm4gJGh0dHAucG9zdCh1cmwoKSwge1xuICAgICAgICAgIHByb2R1Y3RfbmFtZTogcHJvZHVjdC5pZCxcbiAgICAgICAgICBwcmljZTogcHJvZHVjdC5wcmljZVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9O1xuICB9KTtcbiIsIi8qZ2xvYmFscyBhbmd1bGFyLCB3aW5kb3csIGRvY3VtZW50ICovXG5hbmd1bGFyLm1vZHVsZSgnaW5zaWRlci5jb250cm9sbGVycycsIFtdKVxuICAuY29udHJvbGxlcignQXBwQ3RybCcsIGZ1bmN0aW9uKCR0aW1lb3V0LCAkaW9uaWNMb2FkaW5nLCAkcSwgJHNjb3BlLCAkaW9uaWNNb2RhbCwgJHJvb3RTY29wZSwgJHN0b3Jla2l0KSB7XG4gICAgJHN0b3Jla2l0XG4gICAgICAud2F0Y2hQdXJjaGFzZXMoKVxuICAgICAgLnRoZW4oZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vIE5vdCBjdXJyZW50bHkgdXNlZFxuICAgICAgfSwgZnVuY3Rpb24oZXJyb3IpIHtcbiAgICAgICAgLy8gQW4gZXJyb3Igb2NjdXJlZC4gU2hvdyBhIG1lc3NhZ2UgdG8gdGhlIHVzZXJcbiAgICAgIH0sIGZ1bmN0aW9uKHB1cmNoYXNlKSB7XG4gICAgICAgIGlmIChwdXJjaGFzZS5wcm9kdWN0SWQgPT09ICdjb20uaW5zaWRlcmFpLmlvcy55cicpIHtcbiAgICAgICAgICBpZiAocHVyY2hhc2UudHlwZSA9PT0gJ3B1cmNoYXNlJykge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ3B1cmNoYXNlZCEnKTtcbiAgICAgICAgICAgIC8vIFlvdXIgcHJvZHVjdCB3YXMgcHVyY2hhc2VkXG4gICAgICAgICAgfSBlbHNlIGlmIChwdXJjaGFzZS50eXBlID09PSAncmVzdG9yZScpIHtcbiAgICAgICAgICAgIC8vIFlvdXIgcHJvZHVjdCB3YXMgcmVzdG9yZWRcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdyZXN0b3JlZCEnKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgY29uc29sZS5sb2cocHVyY2hhc2UudHJhbnNhY3Rpb25JZCk7XG4gICAgICAgICAgY29uc29sZS5sb2cocHVyY2hhc2UucHJvZHVjdElkKTtcbiAgICAgICAgICBjb25zb2xlLmxvZyhwdXJjaGFzZS50cmFuc2FjdGlvblJlY2VpcHQpO1xuICAgICAgICB9XG4gICAgICB9KTtcblxuXG4gICAgJHNjb3BlLnJldHJ5V2l0aFByb21pc2UgPSBmdW5jdGlvbihwcm9taXNlLCBhcmdzLCBtYXhUcmllcywgY29udGV4dCwgZGVmZXJyZWQpIHtcbiAgICAgIGRlZmVycmVkID0gZGVmZXJyZWQgfHwgJHEuZGVmZXIoKTtcbiAgICAgIGNvbnRleHQgPSBjb250ZXh0IHx8IG51bGw7XG5cbiAgICAgICRzY29wZS5sb2FkaW5nID0gdHJ1ZTtcbiAgICAgICRpb25pY0xvYWRpbmcuc2hvdyh7XG4gICAgICAgIHRlbXBsYXRlOiBcIjxpIGNsYXNzPSdpb24tbG9hZGluZy1kJz48L2k+XCJcbiAgICAgIH0pO1xuXG4gICAgICBwcm9taXNlLmFwcGx5KGNvbnRleHQsIGFyZ3MpXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgICAkc2NvcGUubG9hZGluZyA9IGZhbHNlO1xuICAgICAgICAgICRpb25pY0xvYWRpbmcuaGlkZSgpO1xuICAgICAgICAgIHJldHVybiBkZWZlcnJlZC5yZXNvbHZlKGQpO1xuICAgICAgICB9LCBmdW5jdGlvbihlcnIpIHtcbiAgICAgICAgICBpZiAobWF4VHJpZXMgPT09IC0xIHx8IGVyci5zdGF0dXMgPT0gNDAxIHx8IGVyci5zdGF0dXMgPT0gNDAzKSB7XG4gICAgICAgICAgICAkaW9uaWNMb2FkaW5nLmhpZGUoKTtcbiAgICAgICAgICAgICRzY29wZS5sb2FkaW5nID0gZmFsc2U7XG4gICAgICAgICAgICByZXR1cm4gZGVmZXJyZWQucmVqZWN0KGVycik7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICR0aW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAkc2NvcGUucmV0cnlXaXRoUHJvbWlzZShwcm9taXNlLCBhcmdzLCBtYXhUcmllcyAtIDEsIGNvbnRleHQsIGRlZmVycmVkKTtcbiAgICAgICAgICAgIH0sIDIwMDApO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbiAgICB9O1xuXG4gICAgJHNjb3BlLnJldHJ5V2l0aFByb21pc2VQdWxsVG9SZWZyZXNoID0gZnVuY3Rpb24ocHJvbWlzZSwgYXJncywgbWF4VHJpZXMsIGNvbnRleHQsIGRlZmVycmVkKSB7XG4gICAgICBkZWZlcnJlZCA9IGRlZmVycmVkIHx8ICRxLmRlZmVyKCk7XG4gICAgICBjb250ZXh0ID0gY29udGV4dCB8fCBudWxsO1xuXG4gICAgICAkc2NvcGUubG9hZGluZyA9IHRydWU7XG4gICAgICBwcm9taXNlLmFwcGx5KGNvbnRleHQsIGFyZ3MpXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgICAkc2NvcGUubG9hZGluZyA9IGZhbHNlO1xuICAgICAgICAgICRzY29wZS4kYnJvYWRjYXN0KCdzY3JvbGwucmVmcmVzaENvbXBsZXRlJyk7XG4gICAgICAgICAgcmV0dXJuIGRlZmVycmVkLnJlc29sdmUoZCk7XG4gICAgICAgIH0sIGZ1bmN0aW9uKGVycikge1xuICAgICAgICAgIGlmIChtYXhUcmllcyA9PT0gLTEgfHwgZXJyLnN0YXR1cyA9PSA0MDEgfHwgZXJyLnN0YXR1cyA9PSA0MDMpIHtcbiAgICAgICAgICAgICRzY29wZS4kYnJvYWRjYXN0KCdzY3JvbGwucmVmcmVzaENvbXBsZXRlJyk7XG4gICAgICAgICAgICAkc2NvcGUubG9hZGluZyA9IGZhbHNlO1xuICAgICAgICAgICAgcmV0dXJuIGRlZmVycmVkLnJlamVjdChlcnIpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAkdGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgJHNjb3BlLnJldHJ5V2l0aFByb21pc2UocHJvbWlzZSwgYXJncywgbWF4VHJpZXMgLSAxLCBjb250ZXh0LCBkZWZlcnJlZCk7XG4gICAgICAgICAgICB9LCAyMDAwKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG4gICAgfTtcbiAgfSk7XG4iLCIvKmdsb2JhbHMgYW5ndWxhciwgd2luZG93ICovXG4gYW5ndWxhci5tb2R1bGUoJ2luc2lkZXIuY29udHJvbGxlcnMnKVxuICAuY29udHJvbGxlcignQnV5c0N0cmwnLCBmdW5jdGlvbiAoJGNhY2hlRmFjdG9yeSwgJHN0YXRlLCAkc2NvcGUsIGxvYywgQnV5SWRlYVNlcnZpY2UpIHtcbiAgICB2YXIgbG9hZFJlbW90ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICRzY29wZS5yZXRyeVdpdGhQcm9taXNlUHVsbFRvUmVmcmVzaChCdXlJZGVhU2VydmljZS5maW5kQWxsLCBbXSwgMywgdGhpcylcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24gKHRyYWRlcykge1xuICAgICAgICAgICRzY29wZS50cmFkZXMgPSB0cmFkZXM7XG4gICAgICAgIH0sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAvLyBUT0RPOiBzaG93IG5vIHRyYWRlcyBmb3VuZCB0aGluZ1xuICAgICAgICAgICRzY29wZS50cmFkZXMgPSBbXTtcbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICBsb2FkUmVtb3RlKCk7XG5cbiAgICAkc2NvcGUucmVmcmVzaCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciBjYWNoZSA9ICRjYWNoZUZhY3RvcnkuZ2V0KCckaHR0cCcpO1xuICAgICAgY2FjaGUucmVtb3ZlKGxvYy5hcGlCYXNlICsgJy9hcGkvdjIvYnV5cy5qc29uJyk7XG4gICAgICBsb2FkUmVtb3RlKCk7XG4gICAgfTtcblxuICAgICRzY29wZS5zaG93VHJhZGUgPSBmdW5jdGlvbiAoaWQpIHtcbiAgICAgICRzdGF0ZS5nbygnYXBwLnRyYWRlJywge1xuICAgICAgICBpZDogaWRcbiAgICAgIH0pO1xuICAgIH07XG5cbiAgICAkc2NvcGUuJG9uKCdhdXRoY2hhbmdlJywgZnVuY3Rpb24gKCkge1xuICAgICAgJHNjb3BlLnJlZnJlc2goKTtcbiAgICB9KTtcbiAgfSk7XG4iLCIvKmdsb2JhbHMgYW5ndWxhciwgd2luZG93ICovXG5hbmd1bGFyLm1vZHVsZSgnaW5zaWRlci5jb250cm9sbGVycycpXG4gIC5jb250cm9sbGVyKCdDb21wYW55Q3RybCcsIGZ1bmN0aW9uICgkc3RhdGUsICRzY29wZSwgJHN0YXRlUGFyYW1zLCBDb21wYW55U2VydmljZSkge1xuICAgICRzY29wZS5zaG93VHJhZGVzID0gdHJ1ZTtcblxuICAgICRzY29wZS5yZWZyZXNoID0gZnVuY3Rpb24gKCkge1xuICAgICAgJHNjb3BlLnJldHJ5V2l0aFByb21pc2UoQ29tcGFueVNlcnZpY2UuZmluZEJ5SWQsIFskc3RhdGVQYXJhbXMuaWRdLCAzLCB0aGlzKVxuICAgICAgICAudGhlbihmdW5jdGlvbiAoY29tcGFueURhdGEpIHtcbiAgICAgICAgICAkc2NvcGUuY29tcGFueSA9IGNvbXBhbnlEYXRhO1xuICAgICAgICB9LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coXCJzYWQgZmFjZVwiKTtcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgICRzY29wZS5yZWZyZXNoKCk7XG5cbiAgICAkc2NvcGUuZ29Ub0luc2lkZXIgPSBmdW5jdGlvbiAoaW5zaWRlcikge1xuICAgICAgJHN0YXRlLmdvKCdhcHAuaW5zaWRlcicsIHtcbiAgICAgICAgaWQ6IGluc2lkZXIuaWRcbiAgICAgIH0pO1xuICAgIH07XG5cbiAgICAkc2NvcGUuZ29Ub0Zvcm00ID0gZnVuY3Rpb24gKGZvcm00KSB7XG4gICAgICAkc3RhdGUuZ28oJ2FwcC5mb3JtNCcsIHtcbiAgICAgICAgaWQ6IGZvcm00LmlkXG4gICAgICB9KTtcbiAgICB9O1xuICB9KTtcbiIsIi8qZ2xvYmFscyBhbmd1bGFyLCB3aW5kb3cgKi9cbiBhbmd1bGFyLm1vZHVsZSgnaW5zaWRlci5jb250cm9sbGVycycpXG4gIC5jb250cm9sbGVyKCdEaXNjbGFpbWVyQ3RybCcsIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm47XG4gIH0pO1xuIiwiLypnbG9iYWxzIGFuZ3VsYXIsIHdpbmRvdyAqL1xuIGFuZ3VsYXIubW9kdWxlKCdpbnNpZGVyLmNvbnRyb2xsZXJzJylcbiAgLmNvbnRyb2xsZXIoJ0ZlZWRiYWNrQ3RybCcsIGZ1bmN0aW9uICgkc2NvcGUsICRsb2NhdGlvbiwgRmVlZGJhY2tTZXJ2aWNlKSB7XG4gICAgJHNjb3BlLmZlZWRiYWNrID0ge307XG5cbiAgICAkc2NvcGUuc3VibWl0RmVlZGJhY2sgPSBmdW5jdGlvbiAoKSB7XG4gICAgICBGZWVkYmFja1NlcnZpY2Uuc3VibWl0RmVlZGJhY2soJHNjb3BlLmZlZWRiYWNrKTtcbiAgICAgICRsb2NhdGlvbi5wYXRoKFwiL1wiKTtcbiAgICB9O1xuXG4gICAgcmV0dXJuO1xuICB9KTtcbiIsIi8qZ2xvYmFscyBhbmd1bGFyLCB3aW5kb3cgKi9cbmFuZ3VsYXIubW9kdWxlKCdpbnNpZGVyLmNvbnRyb2xsZXJzJylcbiAgLmNvbnRyb2xsZXIoJ0Zvcm00Q3RybCcsIGZ1bmN0aW9uICgkc2NvcGUsICRzdGF0ZVBhcmFtcywgRm9ybTRTZXJ2aWNlKSB7XG4gICAgJHNjb3BlLnJlZnJlc2ggPSBmdW5jdGlvbiAoKSB7XG4gICAgICAkc2NvcGUucmV0cnlXaXRoUHJvbWlzZShGb3JtNFNlcnZpY2UuZmluZEJ5SWQsIFskc3RhdGVQYXJhbXMuaWRdLCAzLCB0aGlzKVxuICAgICAgICAudGhlbihmdW5jdGlvbiAoZm9ybTREYXRhKSB7XG4gICAgICAgICAgJHNjb3BlLmZvcm00ID0gZm9ybTREYXRhO1xuICAgICAgICB9LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coXCJzYWQgZmFjZVwiKTtcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgICRzY29wZS5uYXZpZ2F0ZVRvID0gZnVuY3Rpb24gKHVybCkge1xuICAgICAgd2luZG93Lm9wZW4odXJsLCAnX2JsYW5rJywgJ2xvY2F0aW9uPXllcycpO1xuICAgIH07XG5cbiAgICAkc2NvcGUucmVmcmVzaCgpO1xuICB9KTtcbiIsIi8qZ2xvYmFscyBhbmd1bGFyLCB3aW5kb3cgKi9cbiBhbmd1bGFyLm1vZHVsZSgnaW5zaWRlci5jb250cm9sbGVycycpXG4gIC5jb250cm9sbGVyKCdGb3JtNHNDdHJsJywgZnVuY3Rpb24gKCRjYWNoZUZhY3RvcnksICRzdGF0ZSwgJHNjb3BlLCBsb2MsIEZvcm00U2VydmljZSkge1xuICAgIHRoaXMub2Zmc2V0ID0gMDtcbiAgICB2YXIgX2Zvcm00cyA9IFtdO1xuICAgIHZhciBsb2FkUmVtb3RlID0gZnVuY3Rpb24gKG9mZnNldCkge1xuICAgICAgJHNjb3BlLnJldHJ5V2l0aFByb21pc2VQdWxsVG9SZWZyZXNoKEZvcm00U2VydmljZS5hbGxUb2RheSwgW29mZnNldF0sIDMsIHRoaXMpXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uIChmb3JtNHMpIHtcbiAgICAgICAgICBfZm9ybTRzID0gXy51bmlxKF9mb3JtNHMuY29uY2F0KGZvcm00cyksICdpZCcpO1xuICAgICAgICAgICRzY29wZS5mb3JtNHMgPSBfZm9ybTRzO1xuICAgICAgICAgICRzY29wZS4kYnJvYWRjYXN0KCdzY3JvbGwuaW5maW5pdGVTY3JvbGxDb21wbGV0ZScpO1xuICAgICAgICB9LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgLy8gVE9ETzogc2hvdyBubyB0cmFkZXMgZm91bmQgdGhpbmdcbiAgICAgICAgICAkc2NvcGUuZm9ybTRzID0gW107XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICAkc2NvcGUuZmV0Y2hNb3JlID0gZnVuY3Rpb24gKCkge1xuICAgICAgaWYoX2Zvcm00cy5sZW5ndGggPiAxKSB7XG4gICAgICAgIHRoaXMub2Zmc2V0ICs9IDIwO1xuICAgICAgfVxuICAgICAgY29uc29sZS5sb2codGhpcy5vZmZzZXQpO1xuICAgICAgbG9hZFJlbW90ZSh0aGlzLm9mZnNldCk7XG4gICAgfS5iaW5kKHRoaXMpO1xuXG4gICAgJHNjb3BlLnJlZnJlc2ggPSBmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgY2FjaGUgPSAkY2FjaGVGYWN0b3J5LmdldCgnJGh0dHAnKTtcbiAgICAgIGNhY2hlLnJlbW92ZShsb2MuYXBpQmFzZSArICcvYXBpL3YyL2Zvcm00cy5qc29uP3RvZGF5PXRydWUnKTtcbiAgICAgIGxvYWRSZW1vdGUoKTtcbiAgICB9O1xuXG4gICAgJHNjb3BlLiRvbignJHN0YXRlQ2hhbmdlU3VjY2VzcycsIGZ1bmN0aW9uKCkge1xuICAgICAgJHNjb3BlLmZldGNoTW9yZSgpO1xuICAgIH0pO1xuXG4gICAgJHNjb3BlLiRvbignYXV0aGNoYW5nZScsIGZ1bmN0aW9uICgpIHtcbiAgICAgICRzY29wZS5yZWZyZXNoKCk7XG4gICAgfSk7XG4gIH0pO1xuIiwiLypnbG9iYWxzIGFuZ3VsYXIsIHdpbmRvdyAqL1xuYW5ndWxhci5tb2R1bGUoJ2luc2lkZXIuY29udHJvbGxlcnMnKVxuICAuY29udHJvbGxlcignSW5zaWRlckN0cmwnLCBmdW5jdGlvbiAoJHN0YXRlLCAkc2NvcGUsICRzdGF0ZVBhcmFtcywgSW5zaWRlclNlcnZpY2UpIHtcbiAgICAkc2NvcGUuc2hvd1RyYWRlcyA9IHRydWU7XG5cbiAgICAkc2NvcGUucmVmcmVzaCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICRzY29wZS5yZXRyeVdpdGhQcm9taXNlKEluc2lkZXJTZXJ2aWNlLmZpbmRCeUlkLCBbJHN0YXRlUGFyYW1zLmlkXSwgMywgdGhpcylcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24gKGluc2lkZXJEYXRhKSB7XG4gICAgICAgICAgJHNjb3BlLmluc2lkZXIgPSBpbnNpZGVyRGF0YTtcbiAgICAgICAgfSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgIGNvbnNvbGUubG9nKFwic2FkIGZhY2VcIik7XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICAkc2NvcGUucmVmcmVzaCgpO1xuXG4gICAgJHNjb3BlLmdvVG9Db21wYW55ID0gZnVuY3Rpb24gKGNvbXBhbnkpIHtcbiAgICAgICRzdGF0ZS5nbygnYXBwLmNvbXBhbnknLCB7XG4gICAgICAgIGlkOiBjb21wYW55LmlkXG4gICAgICB9KTtcbiAgICB9O1xuICAgICRzY29wZS5nb1RvRm9ybTQgPSBmdW5jdGlvbiAoZm9ybTQpIHtcbiAgICAgICRzdGF0ZS5nbygnYXBwLmZvcm00Jywge1xuICAgICAgICBpZDogZm9ybTQuaWRcbiAgICAgIH0pO1xuICAgIH07XG4gIH0pO1xuIiwiYW5ndWxhci5tb2R1bGUoJ2luc2lkZXIuY29udHJvbGxlcnMnKVxuICAuY29udHJvbGxlcignTG9naW5DdHJsJywgZnVuY3Rpb24gKCRzdGF0ZSwgJHNjb3BlLCAkcm9vdFNjb3BlLCAkbG9jYXRpb24sICR3aW5kb3csIExvZ2luU2VydmljZSkge1xuICAgICRzY29wZS51c2VyID0ge1xuICAgICAgZW1haWw6ICR3aW5kb3cubG9jYWxTdG9yYWdlLmVtYWlsLFxuICAgICAgZGV2aWNlOiB7IHBsYXRmb3JtOiAnaW9zJywgdG9rZW46ICRyb290U2NvcGUuZGV2aWNlVG9rZW4gfVxuICAgIH07XG4gICAgJHNjb3BlLmVycm9yTWVzc2FnZSA9IFwiXCI7XG4gICAgJHNjb3BlLmRvTG9naW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAkc2NvcGUuZXJyb3JNZXNzYWdlID0gJyc7XG4gICAgICBMb2dpblNlcnZpY2UubG9naW4oJHNjb3BlLnVzZXIpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAkd2luZG93LmxvY2FsU3RvcmFnZS5lbWFpbCA9ICRzY29wZS51c2VyLmVtYWlsO1xuICAgICAgICAkbG9jYXRpb24ucGF0aChcIi9cIik7XG4gICAgICB9LCBmdW5jdGlvbiAocmVzcCkge1xuICAgICAgICAkc2NvcGUuZXJyb3JNZXNzYWdlID0gcmVzcC5kYXRhLm1lc3NhZ2U7XG4gICAgICB9KTtcbiAgICB9O1xuICB9KTtcbiIsImFuZ3VsYXIubW9kdWxlKCdpbnNpZGVyLmNvbnRyb2xsZXJzJylcbiAgLmNvbnRyb2xsZXIoJ1JlZ2lzdGVyQ3RybCcsIGZ1bmN0aW9uICgkc3RhdGUsICRzY29wZSwgJHJvb3RTY29wZSwgJGxvY2F0aW9uLCBSZWdpc3RlclNlcnZpY2UpIHtcbiAgICAkc2NvcGUudXNlciA9IHsgZGV2aWNlX3Rva2VuOiAkcm9vdFNjb3BlLmRldmljZVRva2VuIH07XG4gICAgJHNjb3BlLmVycm9yTWVzc2FnZSA9ICcnO1xuICAgICRzY29wZS5kb1JlZ2lzdGVyID0gZnVuY3Rpb24gKCkge1xuICAgICAgJHNjb3BlLmVycm9yTWVzc2FnZSA9ICcnO1xuICAgICAgUmVnaXN0ZXJTZXJ2aWNlLnJlZ2lzdGVyKCRzY29wZS51c2VyKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgJGxvY2F0aW9uLnBhdGgoXCIvXCIpO1xuICAgICAgfSwgZnVuY3Rpb24gKHJlc3ApIHtcbiAgICAgICAgdmFyIGVycm9ycyA9IHJlc3AuZGF0YS5lcnJvcnMuam9pbihcIiwgXCIpO1xuICAgICAgICBjb25zb2xlLmxvZyhlcnJvcnMpO1xuICAgICAgICAkc2NvcGUuZXJyb3JNZXNzYWdlID0gZXJyb3JzO1xuICAgICAgfSk7XG4gICAgfTtcbiAgfSk7XG4iLCIvKmdsb2JhbHMgYW5ndWxhciwgd2luZG93ICovXG5hbmd1bGFyLm1vZHVsZSgnaW5zaWRlci5jb250cm9sbGVycycpXG4gIC5jb250cm9sbGVyKCdTZWFyY2hDdHJsJywgZnVuY3Rpb24gKCRzdGF0ZSwgJHNjb3BlLCBTZWFyY2hTZXJ2aWNlKSB7XG4gICAgJHNjb3BlLmtleXdvcmQgPSBcIlwiO1xuICAgICRzY29wZS5yZXN1bHRzID0gW107XG4gICAgJHNjb3BlLnNlYXJjaCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIFNlYXJjaFNlcnZpY2Uuc2VhcmNoKCRzY29wZS5rZXl3b3JkKS50aGVuKGZ1bmN0aW9uIChyZXNwKSB7XG4gICAgICAgICRzY29wZS5yZXN1bHRzID0gcmVzcC5kYXRhO1xuICAgICAgfSk7XG4gICAgfTtcblxuICAgICRzY29wZS5vcGVuUmVzdWx0ID0gZnVuY3Rpb24gKHJlc3VsdCkge1xuICAgICAgdmFyIHdoZXJlID0gKHJlc3VsdFsxXSA9PT0gJ0luc2lkZXInKSA/ICdhcHAuaW5zaWRlcicgOiAnYXBwLmNvbXBhbnknO1xuICAgICAgJHN0YXRlLmdvKHdoZXJlLCB7XG4gICAgICAgIGlkOiByZXN1bHRbMF1cbiAgICAgIH0pO1xuICAgIH07XG4gICAgJHNjb3BlLnNlYXJjaCgpO1xuICB9KTtcbiIsImFuZ3VsYXIubW9kdWxlKCdpbnNpZGVyLmNvbnRyb2xsZXJzJylcbiAgLmNvbnRyb2xsZXIoJ1N1YnNjcmliZUN0cmwnLCBmdW5jdGlvbiAoJHN0YXRlLCAkc2NvcGUsICRsb2NhdGlvbiwgU3Vic2NyaWJlU2VydmljZSkge1xuICAgICRzY29wZS51c2VyID0ge307XG4gICAgJHNjb3BlLmVycm9yTWVzc2FnZSA9IFwiXCI7XG5cbiAgICAkc2NvcGUuZG9TdWJzY3JpYmUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAkc2NvcGUuZXJyb3JNZXNzYWdlID0gJyc7XG4gICAgICBjb25zb2xlLmxvZygnU3Vic2NyaWJpbmcnKTtcbiAgICAgIFN1YnNjcmliZVNlcnZpY2Uuc3Vic2NyaWJlKCRzY29wZS5wcm9kdWN0c1swXSkudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICRsb2NhdGlvbi5wYXRoKFwiL1wiKTtcbiAgICAgIH0sIGZ1bmN0aW9uIChyZXNwKSB7XG4gICAgICAgICRzY29wZS5lcnJvck1lc3NhZ2UgPSByZXNwLmRhdGEubWVzc2FnZTtcbiAgICAgIH0pO1xuICAgIH07XG4gIH0pO1xuIiwiLypnbG9iYWxzIGFuZ3VsYXIsIHdpbmRvdyAqL1xuYW5ndWxhci5tb2R1bGUoJ2luc2lkZXIuY29udHJvbGxlcnMnKVxuIC5jb250cm9sbGVyKCdUb2RheXNCdXlzQ3RybCcsIGZ1bmN0aW9uICgkY2FjaGVGYWN0b3J5LCAkc3RhdGUsICRzY29wZSwgbG9jLCBCdXlJZGVhU2VydmljZSkge1xuICAgICRzY29wZS50cmFkZXMgPSBbXTtcblxuICAgIHZhciBsb2FkUmVtb3RlID0gZnVuY3Rpb24gKCkge1xuICAgICAgJHNjb3BlLnJldHJ5V2l0aFByb21pc2VQdWxsVG9SZWZyZXNoKEJ1eUlkZWFTZXJ2aWNlLmZpbmRUb2RheXMsIFtdLCAzLCB0aGlzKVxuICAgICAgICAudGhlbihmdW5jdGlvbiAodHJhZGVzKSB7XG4gICAgICAgICAgJHNjb3BlLnRyYWRlcyA9IHRyYWRlcztcbiAgICAgICAgfSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgIGNvbnNvbGUubG9nKFwic2FkIGZhY2VcIik7XG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgbG9hZFJlbW90ZSgpO1xuXG4gICAgJHNjb3BlLnJlZnJlc2ggPSBmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgY2FjaGUgPSAkY2FjaGVGYWN0b3J5LmdldCgnJGh0dHAnKTtcbiAgICAgIGNhY2hlLnJlbW92ZShsb2MuYXBpQmFzZSArICcvYXBpL3YyL2J1eXMuanNvbj90b2RheT10cnVlJyk7XG4gICAgICBsb2FkUmVtb3RlKCk7XG4gICAgfTtcblxuICAgICRzY29wZS5zaG93VHJhZGUgPSBmdW5jdGlvbiAoaWQpIHtcbiAgICAgICRzdGF0ZS5nbygnYXBwLnRyYWRlJywge1xuICAgICAgICBpZDogaWRcbiAgICAgIH0pO1xuICAgIH07XG5cbiAgICAkc2NvcGUuJG9uKCdhdXRoY2hhbmdlJywgZnVuY3Rpb24gKCkge1xuICAgICAgJHNjb3BlLnJlZnJlc2goKTtcbiAgICB9KTtcbiAgfSk7XG5cbiIsIi8qZ2xvYmFscyBhbmd1bGFyLCB3aW5kb3csIGRvY3VtZW50ICovXG5hbmd1bGFyLm1vZHVsZSgnaW5zaWRlci5jb250cm9sbGVycycpXG4gIC5jb250cm9sbGVyKCdUcmFkZUN0cmwnLCBmdW5jdGlvbiAoJHNjb3BlLCAkc3RhdGVQYXJhbXMsIEJ1eUlkZWFTZXJ2aWNlKSB7XG4gICAgJHNjb3BlLm5hdmlnYXRlVG8gPSBmdW5jdGlvbiAodXJsKSB7XG4gICAgICB3aW5kb3cub3Blbih1cmwsICdfYmxhbmsnLCAnbG9jYXRpb249eWVzJyk7XG4gICAgfTtcblxuICAgICRzY29wZS5yZWZyZXNoID0gZnVuY3Rpb24gKCkge1xuICAgICAgJHNjb3BlLnJldHJ5V2l0aFByb21pc2UoQnV5SWRlYVNlcnZpY2UuZmluZEJ5SWQsIFskc3RhdGVQYXJhbXMuaWRdLCAzLCB0aGlzKVxuICAgICAgICAudGhlbihmdW5jdGlvbiAodHJhZGUpIHtcbiAgICAgICAgICAkc2NvcGUudHJhZGUgPSB0cmFkZTtcbiAgICAgICAgfSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgIGNvbnNvbGUubG9nKFwic2FkIGZhY2VcIik7XG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgJHNjb3BlLnJlZnJlc2goKTtcbiAgfSk7XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
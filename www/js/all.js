/*global window, cordova, angular */
var app = angular.module('insider', [
    'ionic',
    'insider.services',
    'insider.controllers',
    'insider.filters',
    'ngCordova'
  ])
  .constant('loc', {
    //apiBase: 'http://localhost:3000'
    apiBase: 'https://insiderai.com'
  })
  .config(function ($stateProvider, $urlRouterProvider) {
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
      .state('app.upgrade', {
        url: '/upgrade',
        views: {
          'menuContent': {
            templateUrl: 'templates/upgrade.html',
            controller: 'UpgradeCtrl'
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
      })
      .state('app.settings', {
        url: '/settings',
        views: {
          'menuContent': {
            templateUrl: 'templates/settings.html',
            controller: 'SettingsCtrl'
          }
        }
      });
    // if none of the above states are matched, use this as the fallback
    $urlRouterProvider.otherwise('/app/buys');
  })
  .run(function ($state, $ionicPlatform, $cordovaPush, $rootScope, AuthService) {
    AuthService.validateUser();

    $ionicPlatform.ready(function () {
      // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
      // for form inputs)
      if (window.cordova && window.cordova.plugins.Keyboard) {
        cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      }

      if (window.cordova && window.storekit) {
        window.storekit.init({
          debug: true,
          ready: function () {
            window.storekit.load(["com.insiderai.ios.basic1"], function (products, invalidIds) {
              console.log("In-app purchases are ready to go");
            });
          },
          purchase: function (transactionId, productId, receipt) {
            if (productId === 'com.insiderai.ios.basic1') {
              console.log("Purchased product id 1");
            }
          },
          restore: function (transactionId, productId, transactionReceipt) {
            if (productId === 'com.insiderai.ios.basic1') {
              console.log("Restored product id 1 purchase")
              // in this case need to set the currentUser to something... not sure what yet
            }
          },
          error: function (errorCode, errorMessage) {
            console.log("ERROR: " + errorMessage);
          }
        });
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
        $cordovaPush.register(iosConfig).then(function (result) {
          $rootScope.deviceToken = result;
        }, function (err) {
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

        window.onNotificationAPN = function (e) {
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
            $cordovaPush.setBadgeNumber(e.badge).then(function (result) {
              console.log(result);
            }, function (err) {
              console.log(err);
            });
          }
        };
      }
    });
  });

/*globals angular, md5 */
angular.module('insider.filters', [])
  .filter('gravatar', function () {
    return function (email) {
      return "http://www.gravatar.com/avatar/" + md5(email);
    };
  });

/*globals window, angular, _ */
angular.module('insider.services', [])
  .factory('AuthService', function (loc, $q, $http) {
    var user = null;

    var readStoredUser = function () {
      var storedUser = window.localStorage.getItem('user');
      try {
        if (storedUser) {
          user = JSON.parse(storedUser);
          $http.defaults.headers.common['Auth-Token-X'] = user.auth_token;
        }
      } catch (ignore) { /* fail silently*/ }
    };

    readStoredUser();

    var currentUser = function () {
      if (!user) {
        user = readStoredUser();
      }
      return user;
    };

    var saveUser = function (userToSave) {
      user = userToSave;
      window.localStorage.setItem('user', JSON.stringify(user));
      $http.defaults.headers.common['Auth-Token-X'] = user.auth_token;
    };

    var clearUser = function () {
      window.localStorage.removeItem('user');
      $http.defaults.headers.common['Auth-Token-X'] = undefined;
      user = null;
    };

    var loggedIn = function () {
      return !!currentUser();
    };

    var doLogin = function (userParams, deviceToken) {
      var params = {
        user: userParams,
        device: {
          platform: 'ios',
          token: deviceToken
        }
      };

      var deferred = $q.defer();

      $http.post(loc.apiBase + '/api/v1/users/sign_in.json', params)
        .then(function (resp) {
          saveUser(resp.data.user);
          deferred.resolve(resp.data);
        }, function (data) {
          deferred.reject(data);
        });

      return deferred.promise;
    };

    var doLogout = function () {
      clearUser();
      return $http.delete(loc.apiBase + '/api/v1/users/sign_out.json');
    };

    var validateUser = function () {
      $http.get(loc.apiBase + '/api/v1/sessions/validate.json')
        .then(function (resp) {
          saveUser(resp.data.user);
        }, function () {
          clearUser();
        });
    };

    return {
      doLogin: doLogin,
      doLogout: doLogout,
      loggedIn: loggedIn,
      currentUser: currentUser,
      validateUser: validateUser,
      saveUser: saveUser
    };
  });

/*globals angular, _ */
angular.module('insider.services')
  .factory('CommentService', function(loc, $q, $http) {
    function url(id, type) {
      if(id) {
        return loc.apiBase + '/api/v1/comments/' + id + '/' + type + '.json';
      }
      return loc.apiBase + '/api/v1/comments.json';
    }

    return {
      addComment: function (params) {
        var deferred = $q.defer();
        $http.post(url(), params).then(function (resp) {
          deferred.resolve(resp.data);
        }, function (data) {
          deferred.reject(data);
        });
        return deferred.promise;
      },

      removeComment: function (id, type) {
        return $http.delete(url(id, type));
      }
    };
  });

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
        return loc.apiBase + '/api/v1/buys/' + id + '.json';
      }
      return loc.apiBase + '/api/v1/buys.json';
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
  .factory('SettingsService', function($q, $http, AuthService, loc) {
    function url() {
      return loc.apiBase + '/api/v1/setting';
    }

    var set = function (key, value) {
      var params = {};
      params[key] = value;

      var deferred = $q.defer();
      $http.put(url(), params).then(function (resp) {
        AuthService.saveUser(resp.data.user);
        deferred.resolve(resp.data);
      }, function (resp) {
        deferred.reject(resp.data);
      });

      return deferred.promise;
    };

    var toggleSetting = function (key) {
      var start = AuthService.currentUser()[key];
      return set(key, !start);
    };

    return {
      set: set,
      toggleSetting: toggleSetting
    };
  });

/*globals angular, window, document */
angular.module('insider.controllers', [])
  .controller('AppCtrl', function ($timeout, $ionicLoading, $q, $scope, $ionicModal, $rootScope, AuthService) {
    $scope.loginData = {};

    $ionicModal.fromTemplateUrl('templates/login.html', {
      scope: $scope
    }).then(function (modal) {
      $scope.modal = modal;
    });

    $scope.closeLogin = function () {
      $scope.modal.hide();
    };

    $scope.login = function () {
      $scope.modal.show();
      //$timeout(function () {
        document.getElementById('user-email').focus();
      //}, 0);
    };

    $scope.logout = function () {
      AuthService.doLogout().then(function () {
        $rootScope.$broadcast("authchange");
      });
    };

    $scope.loggedIn = function () {
      return AuthService.loggedIn();
    };

    $scope.doLogin = function () {
      AuthService.doLogin($scope.loginData, $rootScope.deviceToken)
        .then(function () {
          $rootScope.$broadcast('authchange');
          $scope.closeLogin();
        }, function (data) {
          if (data.message) {
            window.alert(data.message);
          } else {
            window.alert("Something went wrong with your login. Try again.");
          }
        });
    };

    $scope.retryWithPromise = function (promise, args, maxTries, context, deferred) {
      deferred = deferred || $q.defer();
      context = context || null;

      $scope.loading = true;
      $ionicLoading.show({
        template: "<i class='ion-loading-d'></i>"
      });

      promise.apply(context, args)
        .then(function (d) {
          $scope.loading = false;
          $ionicLoading.hide();
          return deferred.resolve(d);
        }, function (err) {
          if (maxTries === -1) {
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

    $scope.retryWithPromisePullToRefresh = function (promise, args, maxTries, context, deferred) {
      deferred = deferred || $q.defer();
      context = context || null;

      $scope.loading = true;
      promise.apply(context, args)
        .then(function (d) {
          $scope.loading = false;
          $scope.$broadcast('scroll.refreshComplete');
          return deferred.resolve(d);
        }, function (err) {
          if (maxTries === -1) {
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
      cache.remove(loc.apiBase + '/api/v1/buys.json');
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

/*globals angular */
angular.module('insider.controllers')
  .controller('SettingsCtrl', function ($timeout, $scope, AuthService, SettingsService) {
    $scope.user = AuthService.currentUser();

    $scope.toggleSetting = function (key) {
      SettingsService.toggleSetting(key)
        .then(function () {
          $timeout(function () {
            $scope.$apply();
          }, 100);
        }, function () {
          console.log("somethign went wrong when setting: " + key);
        });
    };

    $scope.$on('authchange', function () {
      if($scope.loggedIn()) {
        $scope.user = AuthService.currentUser();
        $scope.$apply();
      } else {
        $scope.login();
      }
    });
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
      cache.remove(loc.apiBase + '/api/v1/buys.json?today=true');
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

/*globals angular, window */
 angular.module('insider.controllers')
  .controller('UpgradeCtrl', function ($scope) {
    $scope.upgrade = function () {
       console.log("upgrading stuff");
       window.storekit.purchase("com.insiderai.ios.basic1", 1);
    };
    return;
  });

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImZpbHRlcnMuanMiLCJhdXRoX3NlcnZpY2UuanMiLCJjb21tZW50X3Nlcml2Y2UuanMiLCJjb21wYW55X3NlcnZpY2UuanMiLCJmb3JtNF9zZXJ2aWNlLmpzIiwiaWRlYV9zZXJ2aWNlLmpzIiwiaW5zaWRlcl9zZXJ2aWNlLmpzIiwic2VhcmNoX3Nlcml2Y2UuanMiLCJzZXR0aW5nc19zZXJ2aWNlLmpzIiwiYXBwX2NvbnRyb2xsZXIuanMiLCJidXlzX2NvbnRyb2xsZXIuanMiLCJjb21wYW55X2NvbnRyb2xsZXIuanMiLCJkaXNjbGFpbWVyX2NvbnRyb2xsZXIuanMiLCJmb3JtNF9jb250cm9sbGVyLmpzIiwiaW5zaWRlcl9jb250cm9sbGVyLmpzIiwic2VhcmNoX2NvbnRyb2xsZXIuanMiLCJzZXR0aW5nc19jb250cm9sbGVyLmpzIiwidG9kYXlzX2J1eXNfY29udHJvbGxlci5qcyIsInRyYWRlX2NvbnRyb2xsZXIuanMiLCJ1cGdyYWRlX2NvbnRyb2xsZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDM01BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDckZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDMUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMzQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3RCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDaENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2xHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzlCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDNUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDM0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNuQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNoQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImFsbC5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qZ2xvYmFsIHdpbmRvdywgY29yZG92YSwgYW5ndWxhciAqL1xudmFyIGFwcCA9IGFuZ3VsYXIubW9kdWxlKCdpbnNpZGVyJywgW1xuICAgICdpb25pYycsXG4gICAgJ2luc2lkZXIuc2VydmljZXMnLFxuICAgICdpbnNpZGVyLmNvbnRyb2xsZXJzJyxcbiAgICAnaW5zaWRlci5maWx0ZXJzJyxcbiAgICAnbmdDb3Jkb3ZhJ1xuICBdKVxuICAuY29uc3RhbnQoJ2xvYycsIHtcbiAgICAvL2FwaUJhc2U6ICdodHRwOi8vbG9jYWxob3N0OjMwMDAnXG4gICAgYXBpQmFzZTogJ2h0dHBzOi8vaW5zaWRlcmFpLmNvbSdcbiAgfSlcbiAgLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIsICR1cmxSb3V0ZXJQcm92aWRlcikge1xuICAgICRzdGF0ZVByb3ZpZGVyXG4gICAgICAuc3RhdGUoJ2FwcCcsIHtcbiAgICAgICAgdXJsOiAnL2FwcCcsXG4gICAgICAgIGFic3RyYWN0OiB0cnVlLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ3RlbXBsYXRlcy9tZW51Lmh0bWwnLFxuICAgICAgICBjb250cm9sbGVyOiAnQXBwQ3RybCdcbiAgICAgIH0pXG4gICAgICAuc3RhdGUoJ2FwcC5idXlzJywge1xuICAgICAgICB1cmw6ICcvYnV5cycsXG4gICAgICAgIHZpZXdzOiB7XG4gICAgICAgICAgJ21lbnVDb250ZW50Jzoge1xuICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICd0ZW1wbGF0ZXMvYnV5cy5odG1sJyxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdCdXlzQ3RybCdcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgICAuc3RhdGUoJ2FwcC50b2RheScsIHtcbiAgICAgICAgdXJsOiAnL3RvZGF5JyxcbiAgICAgICAgdmlld3M6IHtcbiAgICAgICAgICAnbWVudUNvbnRlbnQnOiB7XG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogJ3RlbXBsYXRlcy90b2RheS5odG1sJyxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdUb2RheXNCdXlzQ3RybCdcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgICAuc3RhdGUoJ2FwcC50cmFkZScsIHtcbiAgICAgICAgdXJsOiAnL3RyYWRlcy86aWQnLFxuICAgICAgICB2aWV3czoge1xuICAgICAgICAgICdtZW51Q29udGVudCc6IHtcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAndGVtcGxhdGVzL3RyYWRlLmh0bWwnLFxuICAgICAgICAgICAgY29udHJvbGxlcjogJ1RyYWRlQ3RybCdcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgICAuc3RhdGUoJ2FwcC5pbnNpZGVyJywge1xuICAgICAgICB1cmw6ICcvaW5zaWRlcnMvOmlkJyxcbiAgICAgICAgdmlld3M6IHtcbiAgICAgICAgICAnbWVudUNvbnRlbnQnOiB7XG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogJ3RlbXBsYXRlcy9pbnNpZGVyLmh0bWwnLFxuICAgICAgICAgICAgY29udHJvbGxlcjogJ0luc2lkZXJDdHJsJ1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSlcbiAgICAgIC5zdGF0ZSgnYXBwLmZvcm00Jywge1xuICAgICAgICB1cmw6ICcvZm9ybTRzLzppZCcsXG4gICAgICAgIHZpZXdzOiB7XG4gICAgICAgICAgJ21lbnVDb250ZW50Jzoge1xuICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICd0ZW1wbGF0ZXMvZm9ybTQuaHRtbCcsXG4gICAgICAgICAgICBjb250cm9sbGVyOiAnRm9ybTRDdHJsJ1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSlcbiAgICAgIC5zdGF0ZSgnYXBwLmNvbXBhbnknLCB7XG4gICAgICAgIHVybDogJy9jb21wYW5pZXMvOmlkJyxcbiAgICAgICAgdmlld3M6IHtcbiAgICAgICAgICAnbWVudUNvbnRlbnQnOiB7XG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogJ3RlbXBsYXRlcy9jb21wYW55Lmh0bWwnLFxuICAgICAgICAgICAgY29udHJvbGxlcjogJ0NvbXBhbnlDdHJsJ1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSlcbiAgICAgIC5zdGF0ZSgnYXBwLnNlYXJjaCcsIHtcbiAgICAgICAgdXJsOiAnL3NlYXJjaCcsXG4gICAgICAgIHZpZXdzOiB7XG4gICAgICAgICAgJ21lbnVDb250ZW50Jzoge1xuICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICd0ZW1wbGF0ZXMvc2VhcmNoLmh0bWwnLFxuICAgICAgICAgICAgY29udHJvbGxlcjogJ1NlYXJjaEN0cmwnXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KVxuICAgICAgLnN0YXRlKCdhcHAudXBncmFkZScsIHtcbiAgICAgICAgdXJsOiAnL3VwZ3JhZGUnLFxuICAgICAgICB2aWV3czoge1xuICAgICAgICAgICdtZW51Q29udGVudCc6IHtcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAndGVtcGxhdGVzL3VwZ3JhZGUuaHRtbCcsXG4gICAgICAgICAgICBjb250cm9sbGVyOiAnVXBncmFkZUN0cmwnXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KVxuICAgICAgLnN0YXRlKCdhcHAuZGlzY2xhaW1lcicsIHtcbiAgICAgICAgdXJsOiAnL2Rpc2NsYWltZXInLFxuICAgICAgICB2aWV3czoge1xuICAgICAgICAgICdtZW51Q29udGVudCc6IHtcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAndGVtcGxhdGVzL2Rpc2NsYWltZXIuaHRtbCcsXG4gICAgICAgICAgICBjb250cm9sbGVyOiAnRGlzY2xhaW1lckN0cmwnXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KVxuICAgICAgLnN0YXRlKCdhcHAuc2V0dGluZ3MnLCB7XG4gICAgICAgIHVybDogJy9zZXR0aW5ncycsXG4gICAgICAgIHZpZXdzOiB7XG4gICAgICAgICAgJ21lbnVDb250ZW50Jzoge1xuICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICd0ZW1wbGF0ZXMvc2V0dGluZ3MuaHRtbCcsXG4gICAgICAgICAgICBjb250cm9sbGVyOiAnU2V0dGluZ3NDdHJsJ1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgLy8gaWYgbm9uZSBvZiB0aGUgYWJvdmUgc3RhdGVzIGFyZSBtYXRjaGVkLCB1c2UgdGhpcyBhcyB0aGUgZmFsbGJhY2tcbiAgICAkdXJsUm91dGVyUHJvdmlkZXIub3RoZXJ3aXNlKCcvYXBwL2J1eXMnKTtcbiAgfSlcbiAgLnJ1bihmdW5jdGlvbiAoJHN0YXRlLCAkaW9uaWNQbGF0Zm9ybSwgJGNvcmRvdmFQdXNoLCAkcm9vdFNjb3BlLCBBdXRoU2VydmljZSkge1xuICAgIEF1dGhTZXJ2aWNlLnZhbGlkYXRlVXNlcigpO1xuXG4gICAgJGlvbmljUGxhdGZvcm0ucmVhZHkoZnVuY3Rpb24gKCkge1xuICAgICAgLy8gSGlkZSB0aGUgYWNjZXNzb3J5IGJhciBieSBkZWZhdWx0IChyZW1vdmUgdGhpcyB0byBzaG93IHRoZSBhY2Nlc3NvcnkgYmFyIGFib3ZlIHRoZSBrZXlib2FyZFxuICAgICAgLy8gZm9yIGZvcm0gaW5wdXRzKVxuICAgICAgaWYgKHdpbmRvdy5jb3Jkb3ZhICYmIHdpbmRvdy5jb3Jkb3ZhLnBsdWdpbnMuS2V5Ym9hcmQpIHtcbiAgICAgICAgY29yZG92YS5wbHVnaW5zLktleWJvYXJkLmhpZGVLZXlib2FyZEFjY2Vzc29yeUJhcih0cnVlKTtcbiAgICAgIH1cblxuICAgICAgaWYgKHdpbmRvdy5jb3Jkb3ZhICYmIHdpbmRvdy5zdG9yZWtpdCkge1xuICAgICAgICB3aW5kb3cuc3RvcmVraXQuaW5pdCh7XG4gICAgICAgICAgZGVidWc6IHRydWUsXG4gICAgICAgICAgcmVhZHk6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHdpbmRvdy5zdG9yZWtpdC5sb2FkKFtcImNvbS5pbnNpZGVyYWkuaW9zLmJhc2ljMVwiXSwgZnVuY3Rpb24gKHByb2R1Y3RzLCBpbnZhbGlkSWRzKSB7XG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiSW4tYXBwIHB1cmNoYXNlcyBhcmUgcmVhZHkgdG8gZ29cIik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9LFxuICAgICAgICAgIHB1cmNoYXNlOiBmdW5jdGlvbiAodHJhbnNhY3Rpb25JZCwgcHJvZHVjdElkLCByZWNlaXB0KSB7XG4gICAgICAgICAgICBpZiAocHJvZHVjdElkID09PSAnY29tLmluc2lkZXJhaS5pb3MuYmFzaWMxJykge1xuICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlB1cmNoYXNlZCBwcm9kdWN0IGlkIDFcIik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSxcbiAgICAgICAgICByZXN0b3JlOiBmdW5jdGlvbiAodHJhbnNhY3Rpb25JZCwgcHJvZHVjdElkLCB0cmFuc2FjdGlvblJlY2VpcHQpIHtcbiAgICAgICAgICAgIGlmIChwcm9kdWN0SWQgPT09ICdjb20uaW5zaWRlcmFpLmlvcy5iYXNpYzEnKSB7XG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiUmVzdG9yZWQgcHJvZHVjdCBpZCAxIHB1cmNoYXNlXCIpXG4gICAgICAgICAgICAgIC8vIGluIHRoaXMgY2FzZSBuZWVkIHRvIHNldCB0aGUgY3VycmVudFVzZXIgdG8gc29tZXRoaW5nLi4uIG5vdCBzdXJlIHdoYXQgeWV0XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSxcbiAgICAgICAgICBlcnJvcjogZnVuY3Rpb24gKGVycm9yQ29kZSwgZXJyb3JNZXNzYWdlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIkVSUk9SOiBcIiArIGVycm9yTWVzc2FnZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgaWYgKHdpbmRvdy5TdGF0dXNCYXIpIHtcbiAgICAgICAgLy8gb3JnLmFwYWNoZS5jb3Jkb3ZhLnN0YXR1c2JhciByZXF1aXJlZFxuICAgICAgICB3aW5kb3cuU3RhdHVzQmFyLnN0eWxlTGlnaHRDb250ZW50KCk7XG4gICAgICB9XG5cbiAgICAgIHZhciBpb3NDb25maWcgPSB7XG4gICAgICAgIFwiYmFkZ2VcIjogXCJ0cnVlXCIsXG4gICAgICAgIFwic291bmRcIjogXCJ0cnVlXCIsXG4gICAgICAgIFwiYWxlcnRcIjogXCJ0cnVlXCIsXG4gICAgICAgIFwiZWNiXCI6IFwib25Ob3RpZmljYXRpb25BUE5cIlxuICAgICAgfTtcblxuICAgICAgaWYgKHdpbmRvdy5jb3Jkb3ZhKSB7XG4gICAgICAgICRjb3Jkb3ZhUHVzaC5yZWdpc3Rlcihpb3NDb25maWcpLnRoZW4oZnVuY3Rpb24gKHJlc3VsdCkge1xuICAgICAgICAgICRyb290U2NvcGUuZGV2aWNlVG9rZW4gPSByZXN1bHQ7XG4gICAgICAgIH0sIGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICBjb25zb2xlLmxvZyhcIm5vdCBhYmxlIHRvIHNlbmQgcHVzaFwiLCBlcnIpO1xuICAgICAgICB9KTtcbiAgICAgICAgLy8gJGNvcmRvdmFQdXNoLnVucmVnaXN0ZXIob3B0aW9ucykudGhlbihmdW5jdGlvbihyZXN1bHQpIHtcbiAgICAgICAgLy8gICBhbGVydChcInVucmVnaXN0ZXJcIik7XG4gICAgICAgIC8vICAgYWxlcnQocmVzdWx0KTtcbiAgICAgICAgLy8gICBhbGVydChhcmd1bWVudHMpO1xuICAgICAgICAvLyAgICAgLy8gU3VjY2VzcyFcbiAgICAgICAgLy8gfSwgZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgIC8vICAgYWxlcnQoXCJlcnJvclwiKTtcbiAgICAgICAgLy8gICBhbGVydChlcnIpO1xuICAgICAgICAvLyAgICAgLy8gQW4gZXJyb3Igb2NjdXJlZC4gU2hvdyBhIG1lc3NhZ2UgdG8gdGhlIHVzZXJcbiAgICAgICAgLy8gfSk7XG4gICAgICAgIC8vXG4gICAgICAgIC8vIC8vIGlPUyBvbmx5XG5cbiAgICAgICAgd2luZG93Lm9uTm90aWZpY2F0aW9uQVBOID0gZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICBjb25zb2xlLmxvZygnb24gbm90aWZpY2F0aW9uOicsIGUpO1xuICAgICAgICAgIGlmIChlLmFsZXJ0KSB7XG4gICAgICAgICAgICAkc3RhdGUuZ28oJ2FwcC50cmFkZScsIHtcbiAgICAgICAgICAgICAgaWQ6IGUuaWRlYV9pZFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKGUuc291bmQpIHtcbiAgICAgICAgICAgIHZhciBzbmQgPSBuZXcgTWVkaWEoZS5zb3VuZCk7XG4gICAgICAgICAgICBzbmQucGxheSgpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChlLmJhZGdlKSB7XG4gICAgICAgICAgICAkY29yZG92YVB1c2guc2V0QmFkZ2VOdW1iZXIoZS5iYWRnZSkudGhlbihmdW5jdGlvbiAocmVzdWx0KSB7XG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKHJlc3VsdCk7XG4gICAgICAgICAgICB9LCBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKGVycik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICB9XG4gICAgfSk7XG4gIH0pO1xuIiwiLypnbG9iYWxzIGFuZ3VsYXIsIG1kNSAqL1xuYW5ndWxhci5tb2R1bGUoJ2luc2lkZXIuZmlsdGVycycsIFtdKVxuICAuZmlsdGVyKCdncmF2YXRhcicsIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKGVtYWlsKSB7XG4gICAgICByZXR1cm4gXCJodHRwOi8vd3d3LmdyYXZhdGFyLmNvbS9hdmF0YXIvXCIgKyBtZDUoZW1haWwpO1xuICAgIH07XG4gIH0pO1xuIiwiLypnbG9iYWxzIHdpbmRvdywgYW5ndWxhciwgXyAqL1xuYW5ndWxhci5tb2R1bGUoJ2luc2lkZXIuc2VydmljZXMnLCBbXSlcbiAgLmZhY3RvcnkoJ0F1dGhTZXJ2aWNlJywgZnVuY3Rpb24gKGxvYywgJHEsICRodHRwKSB7XG4gICAgdmFyIHVzZXIgPSBudWxsO1xuXG4gICAgdmFyIHJlYWRTdG9yZWRVc2VyID0gZnVuY3Rpb24gKCkge1xuICAgICAgdmFyIHN0b3JlZFVzZXIgPSB3aW5kb3cubG9jYWxTdG9yYWdlLmdldEl0ZW0oJ3VzZXInKTtcbiAgICAgIHRyeSB7XG4gICAgICAgIGlmIChzdG9yZWRVc2VyKSB7XG4gICAgICAgICAgdXNlciA9IEpTT04ucGFyc2Uoc3RvcmVkVXNlcik7XG4gICAgICAgICAgJGh0dHAuZGVmYXVsdHMuaGVhZGVycy5jb21tb25bJ0F1dGgtVG9rZW4tWCddID0gdXNlci5hdXRoX3Rva2VuO1xuICAgICAgICB9XG4gICAgICB9IGNhdGNoIChpZ25vcmUpIHsgLyogZmFpbCBzaWxlbnRseSovIH1cbiAgICB9O1xuXG4gICAgcmVhZFN0b3JlZFVzZXIoKTtcblxuICAgIHZhciBjdXJyZW50VXNlciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIGlmICghdXNlcikge1xuICAgICAgICB1c2VyID0gcmVhZFN0b3JlZFVzZXIoKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB1c2VyO1xuICAgIH07XG5cbiAgICB2YXIgc2F2ZVVzZXIgPSBmdW5jdGlvbiAodXNlclRvU2F2ZSkge1xuICAgICAgdXNlciA9IHVzZXJUb1NhdmU7XG4gICAgICB3aW5kb3cubG9jYWxTdG9yYWdlLnNldEl0ZW0oJ3VzZXInLCBKU09OLnN0cmluZ2lmeSh1c2VyKSk7XG4gICAgICAkaHR0cC5kZWZhdWx0cy5oZWFkZXJzLmNvbW1vblsnQXV0aC1Ub2tlbi1YJ10gPSB1c2VyLmF1dGhfdG9rZW47XG4gICAgfTtcblxuICAgIHZhciBjbGVhclVzZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICB3aW5kb3cubG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oJ3VzZXInKTtcbiAgICAgICRodHRwLmRlZmF1bHRzLmhlYWRlcnMuY29tbW9uWydBdXRoLVRva2VuLVgnXSA9IHVuZGVmaW5lZDtcbiAgICAgIHVzZXIgPSBudWxsO1xuICAgIH07XG5cbiAgICB2YXIgbG9nZ2VkSW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4gISFjdXJyZW50VXNlcigpO1xuICAgIH07XG5cbiAgICB2YXIgZG9Mb2dpbiA9IGZ1bmN0aW9uICh1c2VyUGFyYW1zLCBkZXZpY2VUb2tlbikge1xuICAgICAgdmFyIHBhcmFtcyA9IHtcbiAgICAgICAgdXNlcjogdXNlclBhcmFtcyxcbiAgICAgICAgZGV2aWNlOiB7XG4gICAgICAgICAgcGxhdGZvcm06ICdpb3MnLFxuICAgICAgICAgIHRva2VuOiBkZXZpY2VUb2tlblxuICAgICAgICB9XG4gICAgICB9O1xuXG4gICAgICB2YXIgZGVmZXJyZWQgPSAkcS5kZWZlcigpO1xuXG4gICAgICAkaHR0cC5wb3N0KGxvYy5hcGlCYXNlICsgJy9hcGkvdjEvdXNlcnMvc2lnbl9pbi5qc29uJywgcGFyYW1zKVxuICAgICAgICAudGhlbihmdW5jdGlvbiAocmVzcCkge1xuICAgICAgICAgIHNhdmVVc2VyKHJlc3AuZGF0YS51c2VyKTtcbiAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKHJlc3AuZGF0YSk7XG4gICAgICAgIH0sIGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICAgICAgZGVmZXJyZWQucmVqZWN0KGRhdGEpO1xuICAgICAgICB9KTtcblxuICAgICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG4gICAgfTtcblxuICAgIHZhciBkb0xvZ291dCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIGNsZWFyVXNlcigpO1xuICAgICAgcmV0dXJuICRodHRwLmRlbGV0ZShsb2MuYXBpQmFzZSArICcvYXBpL3YxL3VzZXJzL3NpZ25fb3V0Lmpzb24nKTtcbiAgICB9O1xuXG4gICAgdmFyIHZhbGlkYXRlVXNlciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICRodHRwLmdldChsb2MuYXBpQmFzZSArICcvYXBpL3YxL3Nlc3Npb25zL3ZhbGlkYXRlLmpzb24nKVxuICAgICAgICAudGhlbihmdW5jdGlvbiAocmVzcCkge1xuICAgICAgICAgIHNhdmVVc2VyKHJlc3AuZGF0YS51c2VyKTtcbiAgICAgICAgfSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgIGNsZWFyVXNlcigpO1xuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIGRvTG9naW46IGRvTG9naW4sXG4gICAgICBkb0xvZ291dDogZG9Mb2dvdXQsXG4gICAgICBsb2dnZWRJbjogbG9nZ2VkSW4sXG4gICAgICBjdXJyZW50VXNlcjogY3VycmVudFVzZXIsXG4gICAgICB2YWxpZGF0ZVVzZXI6IHZhbGlkYXRlVXNlcixcbiAgICAgIHNhdmVVc2VyOiBzYXZlVXNlclxuICAgIH07XG4gIH0pO1xuIiwiLypnbG9iYWxzIGFuZ3VsYXIsIF8gKi9cbmFuZ3VsYXIubW9kdWxlKCdpbnNpZGVyLnNlcnZpY2VzJylcbiAgLmZhY3RvcnkoJ0NvbW1lbnRTZXJ2aWNlJywgZnVuY3Rpb24obG9jLCAkcSwgJGh0dHApIHtcbiAgICBmdW5jdGlvbiB1cmwoaWQsIHR5cGUpIHtcbiAgICAgIGlmKGlkKSB7XG4gICAgICAgIHJldHVybiBsb2MuYXBpQmFzZSArICcvYXBpL3YxL2NvbW1lbnRzLycgKyBpZCArICcvJyArIHR5cGUgKyAnLmpzb24nO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGxvYy5hcGlCYXNlICsgJy9hcGkvdjEvY29tbWVudHMuanNvbic7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIGFkZENvbW1lbnQ6IGZ1bmN0aW9uIChwYXJhbXMpIHtcbiAgICAgICAgdmFyIGRlZmVycmVkID0gJHEuZGVmZXIoKTtcbiAgICAgICAgJGh0dHAucG9zdCh1cmwoKSwgcGFyYW1zKS50aGVuKGZ1bmN0aW9uIChyZXNwKSB7XG4gICAgICAgICAgZGVmZXJyZWQucmVzb2x2ZShyZXNwLmRhdGEpO1xuICAgICAgICB9LCBmdW5jdGlvbiAoZGF0YSkge1xuICAgICAgICAgIGRlZmVycmVkLnJlamVjdChkYXRhKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xuICAgICAgfSxcblxuICAgICAgcmVtb3ZlQ29tbWVudDogZnVuY3Rpb24gKGlkLCB0eXBlKSB7XG4gICAgICAgIHJldHVybiAkaHR0cC5kZWxldGUodXJsKGlkLCB0eXBlKSk7XG4gICAgICB9XG4gICAgfTtcbiAgfSk7XG4iLCIvKmdsb2JhbHMgYW5ndWxhciwgXyAqL1xuYW5ndWxhci5tb2R1bGUoJ2luc2lkZXIuc2VydmljZXMnKVxuICAuZmFjdG9yeSgnQ29tcGFueVNlcnZpY2UnLCBmdW5jdGlvbihsb2MsICRxLCAkaHR0cCkge1xuICAgIGZ1bmN0aW9uIHVybChpZCkge1xuICAgICBpZihpZCkge1xuICAgICAgICByZXR1cm4gbG9jLmFwaUJhc2UgKyAnL2FwaS92MS9jb21wYW5pZXMvJyArIGlkICsgJy5qc29uJztcbiAgICAgIH1cbiAgICAgIHJldHVybiBsb2MuYXBpQmFzZSArICcvYXBpL3YxL2NvbXBhbmllcy5qc29uJztcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgZmluZEJ5SWQ6IGZ1bmN0aW9uIChpZCkge1xuICAgICAgICB2YXIgZGVmZXJyZWQgPSAkcS5kZWZlcigpO1xuICAgICAgICAkaHR0cC5nZXQodXJsKGlkKSkudGhlbihmdW5jdGlvbiAocmVzcCkge1xuICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUocmVzcC5kYXRhKTtcbiAgICAgICAgfSwgZnVuY3Rpb24gKHJlc3ApIHtcbiAgICAgICAgICBkZWZlcnJlZC5yZWplY3QocmVzcC5kYXRhKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xuICAgICAgfSxcbiAgICB9O1xuICB9KTtcblxuIiwiLypnbG9iYWxzIGFuZ3VsYXIsIF8gKi9cbmFuZ3VsYXIubW9kdWxlKCdpbnNpZGVyLnNlcnZpY2VzJylcbiAgLmZhY3RvcnkoJ0Zvcm00U2VydmljZScsIGZ1bmN0aW9uKGxvYywgJHEsICRodHRwKSB7XG4gICAgZnVuY3Rpb24gdXJsKGlkKSB7XG4gICAgIGlmKGlkKSB7XG4gICAgICAgIHJldHVybiBsb2MuYXBpQmFzZSArICcvYXBpL3YxL2Zvcm00cy8nICsgaWQgKyAnLmpzb24nO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGxvYy5hcGlCYXNlICsgJy9hcGkvdjEvZm9ybTRzLmpzb24nO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICBmaW5kQnlJZDogZnVuY3Rpb24gKGlkKSB7XG4gICAgICAgIHZhciBkZWZlcnJlZCA9ICRxLmRlZmVyKCk7XG4gICAgICAgICRodHRwLmdldCh1cmwoaWQpKS50aGVuKGZ1bmN0aW9uIChyZXNwKSB7XG4gICAgICAgICAgdmFyIGZpbGluZyA9IHJlc3AuZGF0YTtcbiAgICAgICAgICB2YXIgZG9jID0gSlNPTi5wYXJzZShyZXNwLmRhdGEuZmlsaW5nKTtcbiAgICAgICAgICBmaWxpbmcubm9uRGVyaXZhdGl2ZVRyYW5zYWN0aW9ucyA9IGRvYy50cmFuc2FjdGlvbnM7XG4gICAgICAgICAgZmlsaW5nLmRlcml2YXRpdmVUcmFuc2FjdGlvbnMgPSBkb2MuZGVyaXZhdGl2ZV90cmFuc2FjdGlvbnM7XG4gICAgICAgICAgZGVmZXJyZWQucmVzb2x2ZShmaWxpbmcpO1xuICAgICAgICB9LCBmdW5jdGlvbiAocmVzcCkge1xuICAgICAgICAgIGRlZmVycmVkLnJlamVjdChyZXNwLmRhdGEpO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG4gICAgICB9LFxuICAgIH07XG4gIH0pO1xuIiwiLypnbG9iYWxzIGFuZ3VsYXIsIF8gKi9cbmFuZ3VsYXIubW9kdWxlKCdpbnNpZGVyLnNlcnZpY2VzJylcbiAgLmZhY3RvcnkoJ0J1eUlkZWFTZXJ2aWNlJywgZnVuY3Rpb24obG9jLCAkcSwgJGh0dHApIHtcbiAgICBmdW5jdGlvbiB1cmwoaWQpIHtcbiAgICAgIGlmKGlkKSB7XG4gICAgICAgIHJldHVybiBsb2MuYXBpQmFzZSArICcvYXBpL3YxL2J1eXMvJyArIGlkICsgJy5qc29uJztcbiAgICAgIH1cbiAgICAgIHJldHVybiBsb2MuYXBpQmFzZSArICcvYXBpL3YxL2J1eXMuanNvbic7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIGZpbmRBbGw6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGRlZmVycmVkID0gJHEuZGVmZXIoKTtcbiAgICAgICAgJGh0dHAuZ2V0KHVybCgpLCB7IGNhY2hlOiB0cnVlIH0pXG4gICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKHJlc3ApIHtcbiAgICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUocmVzcC5kYXRhKTtcbiAgICAgICAgICB9LCBmdW5jdGlvbiAocmVzcCkge1xuICAgICAgICAgICAgZGVmZXJyZWQucmVqZWN0KHJlc3AuZGF0YSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xuICAgICAgfSxcblxuICAgICAgZmluZEJ5SWQ6IGZ1bmN0aW9uIChpZCkge1xuICAgICAgICB2YXIgZGVmZXJyZWQgPSAkcS5kZWZlcigpO1xuICAgICAgICAkaHR0cC5nZXQodXJsKGlkKSwgeyBjYWNoZTogdHJ1ZSB9KVxuICAgICAgICAgIC50aGVuKGZ1bmN0aW9uIChyZXNwKSB7XG4gICAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKHJlc3AuZGF0YSk7XG4gICAgICAgICAgfSwgZnVuY3Rpb24gKHJlc3ApIHtcbiAgICAgICAgICAgIGRlZmVycmVkLnJlamVjdChyZXNwLmRhdGEpO1xuICAgICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbiAgICAgIH0sXG5cbiAgICAgIGZpbmRUb2RheXM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGRlZmVycmVkID0gJHEuZGVmZXIoKTtcbiAgICAgICAgJGh0dHAuZ2V0KHVybCgpLCB7IHBhcmFtczogeyAndG9kYXknOiB0cnVlIH0sIGNhY2hlOiB0cnVlIH0pXG4gICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKHJlc3ApIHtcbiAgICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUocmVzcC5kYXRhKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG4gICAgICB9XG4gICAgfTtcbiAgfSk7XG4iLCIvKmdsb2JhbHMgYW5ndWxhciwgXyAqL1xuYW5ndWxhci5tb2R1bGUoJ2luc2lkZXIuc2VydmljZXMnKVxuICAuZmFjdG9yeSgnSW5zaWRlclNlcnZpY2UnLCBmdW5jdGlvbihsb2MsICRxLCAkaHR0cCkge1xuICAgIGZ1bmN0aW9uIHVybChpZCkge1xuICAgICBpZihpZCkge1xuICAgICAgICByZXR1cm4gbG9jLmFwaUJhc2UgKyAnL2FwaS92MS9pbnNpZGVycy8nICsgaWQgKyAnLmpzb24nO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGxvYy5hcGlCYXNlICsgJy9hcGkvdjEvaW5zaWRlcnMuanNvbic7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIGZpbmRCeUlkOiBmdW5jdGlvbiAoaWQpIHtcbiAgICAgICAgdmFyIGRlZmVycmVkID0gJHEuZGVmZXIoKTtcbiAgICAgICAgJGh0dHAuZ2V0KHVybChpZCkpLnRoZW4oZnVuY3Rpb24gKHJlc3ApIHtcbiAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKHJlc3AuZGF0YSk7XG4gICAgICAgIH0sIGZ1bmN0aW9uIChyZXNwKSB7XG4gICAgICAgICAgZGVmZXJyZWQucmVqZWN0KHJlc3AuZGF0YSk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbiAgICAgIH0sXG4gICAgfTtcbiAgfSk7XG4iLCIvKmdsb2JhbHMgYW5ndWxhciwgXyAqL1xuYW5ndWxhci5tb2R1bGUoJ2luc2lkZXIuc2VydmljZXMnKVxuICAuZmFjdG9yeSgnU2VhcmNoU2VydmljZScsIGZ1bmN0aW9uKGxvYywgJGh0dHApIHtcbiAgICBmdW5jdGlvbiB1cmwocSkge1xuICAgICAgcmV0dXJuIGxvYy5hcGlCYXNlICsgJy9hcGkvdjEvc2VhcmNoP3E9JyArIHE7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIHNlYXJjaDogZnVuY3Rpb24gKGtleXdvcmQpIHtcbiAgICAgICAgcmV0dXJuICRodHRwLmdldCh1cmwoa2V5d29yZCksIHsgY2FjaGU6IHRydWUgfSk7XG4gICAgICB9XG4gICAgfTtcbiAgfSk7XG4iLCIvKmdsb2JhbHMgYW5ndWxhciwgXyAqL1xuYW5ndWxhci5tb2R1bGUoJ2luc2lkZXIuc2VydmljZXMnKVxuICAuZmFjdG9yeSgnU2V0dGluZ3NTZXJ2aWNlJywgZnVuY3Rpb24oJHEsICRodHRwLCBBdXRoU2VydmljZSwgbG9jKSB7XG4gICAgZnVuY3Rpb24gdXJsKCkge1xuICAgICAgcmV0dXJuIGxvYy5hcGlCYXNlICsgJy9hcGkvdjEvc2V0dGluZyc7XG4gICAgfVxuXG4gICAgdmFyIHNldCA9IGZ1bmN0aW9uIChrZXksIHZhbHVlKSB7XG4gICAgICB2YXIgcGFyYW1zID0ge307XG4gICAgICBwYXJhbXNba2V5XSA9IHZhbHVlO1xuXG4gICAgICB2YXIgZGVmZXJyZWQgPSAkcS5kZWZlcigpO1xuICAgICAgJGh0dHAucHV0KHVybCgpLCBwYXJhbXMpLnRoZW4oZnVuY3Rpb24gKHJlc3ApIHtcbiAgICAgICAgQXV0aFNlcnZpY2Uuc2F2ZVVzZXIocmVzcC5kYXRhLnVzZXIpO1xuICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKHJlc3AuZGF0YSk7XG4gICAgICB9LCBmdW5jdGlvbiAocmVzcCkge1xuICAgICAgICBkZWZlcnJlZC5yZWplY3QocmVzcC5kYXRhKTtcbiAgICAgIH0pO1xuXG4gICAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbiAgICB9O1xuXG4gICAgdmFyIHRvZ2dsZVNldHRpbmcgPSBmdW5jdGlvbiAoa2V5KSB7XG4gICAgICB2YXIgc3RhcnQgPSBBdXRoU2VydmljZS5jdXJyZW50VXNlcigpW2tleV07XG4gICAgICByZXR1cm4gc2V0KGtleSwgIXN0YXJ0KTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIHNldDogc2V0LFxuICAgICAgdG9nZ2xlU2V0dGluZzogdG9nZ2xlU2V0dGluZ1xuICAgIH07XG4gIH0pO1xuIiwiLypnbG9iYWxzIGFuZ3VsYXIsIHdpbmRvdywgZG9jdW1lbnQgKi9cbmFuZ3VsYXIubW9kdWxlKCdpbnNpZGVyLmNvbnRyb2xsZXJzJywgW10pXG4gIC5jb250cm9sbGVyKCdBcHBDdHJsJywgZnVuY3Rpb24gKCR0aW1lb3V0LCAkaW9uaWNMb2FkaW5nLCAkcSwgJHNjb3BlLCAkaW9uaWNNb2RhbCwgJHJvb3RTY29wZSwgQXV0aFNlcnZpY2UpIHtcbiAgICAkc2NvcGUubG9naW5EYXRhID0ge307XG5cbiAgICAkaW9uaWNNb2RhbC5mcm9tVGVtcGxhdGVVcmwoJ3RlbXBsYXRlcy9sb2dpbi5odG1sJywge1xuICAgICAgc2NvcGU6ICRzY29wZVxuICAgIH0pLnRoZW4oZnVuY3Rpb24gKG1vZGFsKSB7XG4gICAgICAkc2NvcGUubW9kYWwgPSBtb2RhbDtcbiAgICB9KTtcblxuICAgICRzY29wZS5jbG9zZUxvZ2luID0gZnVuY3Rpb24gKCkge1xuICAgICAgJHNjb3BlLm1vZGFsLmhpZGUoKTtcbiAgICB9O1xuXG4gICAgJHNjb3BlLmxvZ2luID0gZnVuY3Rpb24gKCkge1xuICAgICAgJHNjb3BlLm1vZGFsLnNob3coKTtcbiAgICAgIC8vJHRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndXNlci1lbWFpbCcpLmZvY3VzKCk7XG4gICAgICAvL30sIDApO1xuICAgIH07XG5cbiAgICAkc2NvcGUubG9nb3V0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgQXV0aFNlcnZpY2UuZG9Mb2dvdXQoKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KFwiYXV0aGNoYW5nZVwiKTtcbiAgICAgIH0pO1xuICAgIH07XG5cbiAgICAkc2NvcGUubG9nZ2VkSW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4gQXV0aFNlcnZpY2UubG9nZ2VkSW4oKTtcbiAgICB9O1xuXG4gICAgJHNjb3BlLmRvTG9naW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgICBBdXRoU2VydmljZS5kb0xvZ2luKCRzY29wZS5sb2dpbkRhdGEsICRyb290U2NvcGUuZGV2aWNlVG9rZW4pXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoJ2F1dGhjaGFuZ2UnKTtcbiAgICAgICAgICAkc2NvcGUuY2xvc2VMb2dpbigpO1xuICAgICAgICB9LCBmdW5jdGlvbiAoZGF0YSkge1xuICAgICAgICAgIGlmIChkYXRhLm1lc3NhZ2UpIHtcbiAgICAgICAgICAgIHdpbmRvdy5hbGVydChkYXRhLm1lc3NhZ2UpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB3aW5kb3cuYWxlcnQoXCJTb21ldGhpbmcgd2VudCB3cm9uZyB3aXRoIHlvdXIgbG9naW4uIFRyeSBhZ2Fpbi5cIik7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgJHNjb3BlLnJldHJ5V2l0aFByb21pc2UgPSBmdW5jdGlvbiAocHJvbWlzZSwgYXJncywgbWF4VHJpZXMsIGNvbnRleHQsIGRlZmVycmVkKSB7XG4gICAgICBkZWZlcnJlZCA9IGRlZmVycmVkIHx8ICRxLmRlZmVyKCk7XG4gICAgICBjb250ZXh0ID0gY29udGV4dCB8fCBudWxsO1xuXG4gICAgICAkc2NvcGUubG9hZGluZyA9IHRydWU7XG4gICAgICAkaW9uaWNMb2FkaW5nLnNob3coe1xuICAgICAgICB0ZW1wbGF0ZTogXCI8aSBjbGFzcz0naW9uLWxvYWRpbmctZCc+PC9pPlwiXG4gICAgICB9KTtcblxuICAgICAgcHJvbWlzZS5hcHBseShjb250ZXh0LCBhcmdzKVxuICAgICAgICAudGhlbihmdW5jdGlvbiAoZCkge1xuICAgICAgICAgICRzY29wZS5sb2FkaW5nID0gZmFsc2U7XG4gICAgICAgICAgJGlvbmljTG9hZGluZy5oaWRlKCk7XG4gICAgICAgICAgcmV0dXJuIGRlZmVycmVkLnJlc29sdmUoZCk7XG4gICAgICAgIH0sIGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICBpZiAobWF4VHJpZXMgPT09IC0xKSB7XG4gICAgICAgICAgICAkaW9uaWNMb2FkaW5nLmhpZGUoKTtcbiAgICAgICAgICAgICRzY29wZS5sb2FkaW5nID0gZmFsc2U7XG4gICAgICAgICAgICByZXR1cm4gZGVmZXJyZWQucmVqZWN0KGVycik7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICR0aW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAkc2NvcGUucmV0cnlXaXRoUHJvbWlzZShwcm9taXNlLCBhcmdzLCBtYXhUcmllcyAtIDEsIGNvbnRleHQsIGRlZmVycmVkKTtcbiAgICAgICAgICAgIH0sIDIwMDApO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbiAgICB9O1xuXG4gICAgJHNjb3BlLnJldHJ5V2l0aFByb21pc2VQdWxsVG9SZWZyZXNoID0gZnVuY3Rpb24gKHByb21pc2UsIGFyZ3MsIG1heFRyaWVzLCBjb250ZXh0LCBkZWZlcnJlZCkge1xuICAgICAgZGVmZXJyZWQgPSBkZWZlcnJlZCB8fCAkcS5kZWZlcigpO1xuICAgICAgY29udGV4dCA9IGNvbnRleHQgfHwgbnVsbDtcblxuICAgICAgJHNjb3BlLmxvYWRpbmcgPSB0cnVlO1xuICAgICAgcHJvbWlzZS5hcHBseShjb250ZXh0LCBhcmdzKVxuICAgICAgICAudGhlbihmdW5jdGlvbiAoZCkge1xuICAgICAgICAgICRzY29wZS5sb2FkaW5nID0gZmFsc2U7XG4gICAgICAgICAgJHNjb3BlLiRicm9hZGNhc3QoJ3Njcm9sbC5yZWZyZXNoQ29tcGxldGUnKTtcbiAgICAgICAgICByZXR1cm4gZGVmZXJyZWQucmVzb2x2ZShkKTtcbiAgICAgICAgfSwgZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgIGlmIChtYXhUcmllcyA9PT0gLTEpIHtcbiAgICAgICAgICAgICRzY29wZS4kYnJvYWRjYXN0KCdzY3JvbGwucmVmcmVzaENvbXBsZXRlJyk7XG4gICAgICAgICAgICAkc2NvcGUubG9hZGluZyA9IGZhbHNlO1xuICAgICAgICAgICAgcmV0dXJuIGRlZmVycmVkLnJlamVjdChlcnIpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAkdGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgJHNjb3BlLnJldHJ5V2l0aFByb21pc2UocHJvbWlzZSwgYXJncywgbWF4VHJpZXMgLSAxLCBjb250ZXh0LCBkZWZlcnJlZCk7XG4gICAgICAgICAgICB9LCAyMDAwKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG4gICAgfTtcbiAgfSk7XG4iLCIvKmdsb2JhbHMgYW5ndWxhciwgd2luZG93ICovXG4gYW5ndWxhci5tb2R1bGUoJ2luc2lkZXIuY29udHJvbGxlcnMnKVxuICAuY29udHJvbGxlcignQnV5c0N0cmwnLCBmdW5jdGlvbiAoJGNhY2hlRmFjdG9yeSwgJHN0YXRlLCAkc2NvcGUsIGxvYywgQnV5SWRlYVNlcnZpY2UpIHtcbiAgICB2YXIgbG9hZFJlbW90ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICRzY29wZS5yZXRyeVdpdGhQcm9taXNlUHVsbFRvUmVmcmVzaChCdXlJZGVhU2VydmljZS5maW5kQWxsLCBbXSwgMywgdGhpcylcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24gKHRyYWRlcykge1xuICAgICAgICAgICRzY29wZS50cmFkZXMgPSB0cmFkZXM7XG4gICAgICAgIH0sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAvLyBUT0RPOiBzaG93IG5vIHRyYWRlcyBmb3VuZCB0aGluZ1xuICAgICAgICAgICRzY29wZS50cmFkZXMgPSBbXTtcbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICBsb2FkUmVtb3RlKCk7XG5cbiAgICAkc2NvcGUucmVmcmVzaCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciBjYWNoZSA9ICRjYWNoZUZhY3RvcnkuZ2V0KCckaHR0cCcpO1xuICAgICAgY2FjaGUucmVtb3ZlKGxvYy5hcGlCYXNlICsgJy9hcGkvdjEvYnV5cy5qc29uJyk7XG4gICAgICBsb2FkUmVtb3RlKCk7XG4gICAgfTtcblxuICAgICRzY29wZS5zaG93VHJhZGUgPSBmdW5jdGlvbiAoaWQpIHtcbiAgICAgICRzdGF0ZS5nbygnYXBwLnRyYWRlJywge1xuICAgICAgICBpZDogaWRcbiAgICAgIH0pO1xuICAgIH07XG5cbiAgICAkc2NvcGUuJG9uKCdhdXRoY2hhbmdlJywgZnVuY3Rpb24gKCkge1xuICAgICAgJHNjb3BlLnJlZnJlc2goKTtcbiAgICB9KTtcbiAgfSk7XG4iLCIvKmdsb2JhbHMgYW5ndWxhciwgd2luZG93ICovXG5hbmd1bGFyLm1vZHVsZSgnaW5zaWRlci5jb250cm9sbGVycycpXG4gIC5jb250cm9sbGVyKCdDb21wYW55Q3RybCcsIGZ1bmN0aW9uICgkc3RhdGUsICRzY29wZSwgJHN0YXRlUGFyYW1zLCBDb21wYW55U2VydmljZSkge1xuICAgICRzY29wZS5zaG93VHJhZGVzID0gdHJ1ZTtcblxuICAgICRzY29wZS5yZWZyZXNoID0gZnVuY3Rpb24gKCkge1xuICAgICAgJHNjb3BlLnJldHJ5V2l0aFByb21pc2UoQ29tcGFueVNlcnZpY2UuZmluZEJ5SWQsIFskc3RhdGVQYXJhbXMuaWRdLCAzLCB0aGlzKVxuICAgICAgICAudGhlbihmdW5jdGlvbiAoY29tcGFueURhdGEpIHtcbiAgICAgICAgICAkc2NvcGUuY29tcGFueSA9IGNvbXBhbnlEYXRhO1xuICAgICAgICB9LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coXCJzYWQgZmFjZVwiKTtcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgICRzY29wZS5yZWZyZXNoKCk7XG5cbiAgICAkc2NvcGUuZ29Ub0luc2lkZXIgPSBmdW5jdGlvbiAoaW5zaWRlcikge1xuICAgICAgJHN0YXRlLmdvKCdhcHAuaW5zaWRlcicsIHtcbiAgICAgICAgaWQ6IGluc2lkZXIuaWRcbiAgICAgIH0pO1xuICAgIH07XG5cbiAgICAkc2NvcGUuZ29Ub0Zvcm00ID0gZnVuY3Rpb24gKGZvcm00KSB7XG4gICAgICAkc3RhdGUuZ28oJ2FwcC5mb3JtNCcsIHtcbiAgICAgICAgaWQ6IGZvcm00LmlkXG4gICAgICB9KTtcbiAgICB9O1xuICB9KTtcbiIsIi8qZ2xvYmFscyBhbmd1bGFyLCB3aW5kb3cgKi9cbiBhbmd1bGFyLm1vZHVsZSgnaW5zaWRlci5jb250cm9sbGVycycpXG4gIC5jb250cm9sbGVyKCdEaXNjbGFpbWVyQ3RybCcsIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm47XG4gIH0pO1xuIiwiLypnbG9iYWxzIGFuZ3VsYXIsIHdpbmRvdyAqL1xuYW5ndWxhci5tb2R1bGUoJ2luc2lkZXIuY29udHJvbGxlcnMnKVxuICAuY29udHJvbGxlcignRm9ybTRDdHJsJywgZnVuY3Rpb24gKCRzY29wZSwgJHN0YXRlUGFyYW1zLCBGb3JtNFNlcnZpY2UpIHtcbiAgICAkc2NvcGUucmVmcmVzaCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICRzY29wZS5yZXRyeVdpdGhQcm9taXNlKEZvcm00U2VydmljZS5maW5kQnlJZCwgWyRzdGF0ZVBhcmFtcy5pZF0sIDMsIHRoaXMpXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uIChmb3JtNERhdGEpIHtcbiAgICAgICAgICAkc2NvcGUuZm9ybTQgPSBmb3JtNERhdGE7XG4gICAgICAgIH0sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBjb25zb2xlLmxvZyhcInNhZCBmYWNlXCIpO1xuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgJHNjb3BlLm5hdmlnYXRlVG8gPSBmdW5jdGlvbiAodXJsKSB7XG4gICAgICB3aW5kb3cub3Blbih1cmwsICdfYmxhbmsnLCAnbG9jYXRpb249eWVzJyk7XG4gICAgfTtcblxuICAgICRzY29wZS5yZWZyZXNoKCk7XG4gIH0pO1xuIiwiLypnbG9iYWxzIGFuZ3VsYXIsIHdpbmRvdyAqL1xuYW5ndWxhci5tb2R1bGUoJ2luc2lkZXIuY29udHJvbGxlcnMnKVxuICAuY29udHJvbGxlcignSW5zaWRlckN0cmwnLCBmdW5jdGlvbiAoJHN0YXRlLCAkc2NvcGUsICRzdGF0ZVBhcmFtcywgSW5zaWRlclNlcnZpY2UpIHtcbiAgICAkc2NvcGUuc2hvd1RyYWRlcyA9IHRydWU7XG5cbiAgICAkc2NvcGUucmVmcmVzaCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICRzY29wZS5yZXRyeVdpdGhQcm9taXNlKEluc2lkZXJTZXJ2aWNlLmZpbmRCeUlkLCBbJHN0YXRlUGFyYW1zLmlkXSwgMywgdGhpcylcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24gKGluc2lkZXJEYXRhKSB7XG4gICAgICAgICAgJHNjb3BlLmluc2lkZXIgPSBpbnNpZGVyRGF0YTtcbiAgICAgICAgfSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgIGNvbnNvbGUubG9nKFwic2FkIGZhY2VcIik7XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICAkc2NvcGUucmVmcmVzaCgpO1xuXG4gICAgJHNjb3BlLmdvVG9Db21wYW55ID0gZnVuY3Rpb24gKGNvbXBhbnkpIHtcbiAgICAgICRzdGF0ZS5nbygnYXBwLmNvbXBhbnknLCB7XG4gICAgICAgIGlkOiBjb21wYW55LmlkXG4gICAgICB9KTtcbiAgICB9O1xuICAgICRzY29wZS5nb1RvRm9ybTQgPSBmdW5jdGlvbiAoZm9ybTQpIHtcbiAgICAgICRzdGF0ZS5nbygnYXBwLmZvcm00Jywge1xuICAgICAgICBpZDogZm9ybTQuaWRcbiAgICAgIH0pO1xuICAgIH07XG4gIH0pO1xuIiwiLypnbG9iYWxzIGFuZ3VsYXIsIHdpbmRvdyAqL1xuYW5ndWxhci5tb2R1bGUoJ2luc2lkZXIuY29udHJvbGxlcnMnKVxuICAuY29udHJvbGxlcignU2VhcmNoQ3RybCcsIGZ1bmN0aW9uICgkc3RhdGUsICRzY29wZSwgU2VhcmNoU2VydmljZSkge1xuICAgICRzY29wZS5rZXl3b3JkID0gXCJcIjtcbiAgICAkc2NvcGUucmVzdWx0cyA9IFtdO1xuICAgICRzY29wZS5zZWFyY2ggPSBmdW5jdGlvbiAoKSB7XG4gICAgICBTZWFyY2hTZXJ2aWNlLnNlYXJjaCgkc2NvcGUua2V5d29yZCkudGhlbihmdW5jdGlvbiAocmVzcCkge1xuICAgICAgICAkc2NvcGUucmVzdWx0cyA9IHJlc3AuZGF0YTtcbiAgICAgIH0pO1xuICAgIH07XG5cbiAgICAkc2NvcGUub3BlblJlc3VsdCA9IGZ1bmN0aW9uIChyZXN1bHQpIHtcbiAgICAgIHZhciB3aGVyZSA9IChyZXN1bHRbMV0gPT09ICdJbnNpZGVyJykgPyAnYXBwLmluc2lkZXInIDogJ2FwcC5jb21wYW55JztcbiAgICAgICRzdGF0ZS5nbyh3aGVyZSwge1xuICAgICAgICBpZDogcmVzdWx0WzBdXG4gICAgICB9KTtcbiAgICB9O1xuICAgICRzY29wZS5zZWFyY2goKTtcbiAgfSk7XG4iLCIvKmdsb2JhbHMgYW5ndWxhciAqL1xuYW5ndWxhci5tb2R1bGUoJ2luc2lkZXIuY29udHJvbGxlcnMnKVxuICAuY29udHJvbGxlcignU2V0dGluZ3NDdHJsJywgZnVuY3Rpb24gKCR0aW1lb3V0LCAkc2NvcGUsIEF1dGhTZXJ2aWNlLCBTZXR0aW5nc1NlcnZpY2UpIHtcbiAgICAkc2NvcGUudXNlciA9IEF1dGhTZXJ2aWNlLmN1cnJlbnRVc2VyKCk7XG5cbiAgICAkc2NvcGUudG9nZ2xlU2V0dGluZyA9IGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgIFNldHRpbmdzU2VydmljZS50b2dnbGVTZXR0aW5nKGtleSlcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICR0aW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICRzY29wZS4kYXBwbHkoKTtcbiAgICAgICAgICB9LCAxMDApO1xuICAgICAgICB9LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coXCJzb21ldGhpZ24gd2VudCB3cm9uZyB3aGVuIHNldHRpbmc6IFwiICsga2V5KTtcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgICRzY29wZS4kb24oJ2F1dGhjaGFuZ2UnLCBmdW5jdGlvbiAoKSB7XG4gICAgICBpZigkc2NvcGUubG9nZ2VkSW4oKSkge1xuICAgICAgICAkc2NvcGUudXNlciA9IEF1dGhTZXJ2aWNlLmN1cnJlbnRVc2VyKCk7XG4gICAgICAgICRzY29wZS4kYXBwbHkoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgICRzY29wZS5sb2dpbigpO1xuICAgICAgfVxuICAgIH0pO1xuICB9KTtcbiIsIi8qZ2xvYmFscyBhbmd1bGFyLCB3aW5kb3cgKi9cbmFuZ3VsYXIubW9kdWxlKCdpbnNpZGVyLmNvbnRyb2xsZXJzJylcbiAuY29udHJvbGxlcignVG9kYXlzQnV5c0N0cmwnLCBmdW5jdGlvbiAoJGNhY2hlRmFjdG9yeSwgJHN0YXRlLCAkc2NvcGUsIGxvYywgQnV5SWRlYVNlcnZpY2UpIHtcbiAgICAkc2NvcGUudHJhZGVzID0gW107XG5cbiAgICB2YXIgbG9hZFJlbW90ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICRzY29wZS5yZXRyeVdpdGhQcm9taXNlUHVsbFRvUmVmcmVzaChCdXlJZGVhU2VydmljZS5maW5kVG9kYXlzLCBbXSwgMywgdGhpcylcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24gKHRyYWRlcykge1xuICAgICAgICAgICRzY29wZS50cmFkZXMgPSB0cmFkZXM7XG4gICAgICAgIH0sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBjb25zb2xlLmxvZyhcInNhZCBmYWNlXCIpO1xuICAgICAgICB9KTtcbiAgICB9O1xuICAgIGxvYWRSZW1vdGUoKTtcblxuICAgICRzY29wZS5yZWZyZXNoID0gZnVuY3Rpb24gKCkge1xuICAgICAgdmFyIGNhY2hlID0gJGNhY2hlRmFjdG9yeS5nZXQoJyRodHRwJyk7XG4gICAgICBjYWNoZS5yZW1vdmUobG9jLmFwaUJhc2UgKyAnL2FwaS92MS9idXlzLmpzb24/dG9kYXk9dHJ1ZScpO1xuICAgICAgbG9hZFJlbW90ZSgpO1xuICAgIH07XG5cbiAgICAkc2NvcGUuc2hvd1RyYWRlID0gZnVuY3Rpb24gKGlkKSB7XG4gICAgICAkc3RhdGUuZ28oJ2FwcC50cmFkZScsIHtcbiAgICAgICAgaWQ6IGlkXG4gICAgICB9KTtcbiAgICB9O1xuXG4gICAgJHNjb3BlLiRvbignYXV0aGNoYW5nZScsIGZ1bmN0aW9uICgpIHtcbiAgICAgICRzY29wZS5yZWZyZXNoKCk7XG4gICAgfSk7XG4gIH0pO1xuXG4iLCIvKmdsb2JhbHMgYW5ndWxhciwgd2luZG93LCBkb2N1bWVudCAqL1xuYW5ndWxhci5tb2R1bGUoJ2luc2lkZXIuY29udHJvbGxlcnMnKVxuICAuY29udHJvbGxlcignVHJhZGVDdHJsJywgZnVuY3Rpb24gKCRzY29wZSwgJHN0YXRlUGFyYW1zLCBCdXlJZGVhU2VydmljZSkge1xuICAgICRzY29wZS5uYXZpZ2F0ZVRvID0gZnVuY3Rpb24gKHVybCkge1xuICAgICAgd2luZG93Lm9wZW4odXJsLCAnX2JsYW5rJywgJ2xvY2F0aW9uPXllcycpO1xuICAgIH07XG5cbiAgICAkc2NvcGUucmVmcmVzaCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICRzY29wZS5yZXRyeVdpdGhQcm9taXNlKEJ1eUlkZWFTZXJ2aWNlLmZpbmRCeUlkLCBbJHN0YXRlUGFyYW1zLmlkXSwgMywgdGhpcylcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24gKHRyYWRlKSB7XG4gICAgICAgICAgJHNjb3BlLnRyYWRlID0gdHJhZGU7XG4gICAgICAgIH0sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBjb25zb2xlLmxvZyhcInNhZCBmYWNlXCIpO1xuICAgICAgICB9KTtcbiAgICB9O1xuICAgICRzY29wZS5yZWZyZXNoKCk7XG4gIH0pO1xuIiwiLypnbG9iYWxzIGFuZ3VsYXIsIHdpbmRvdyAqL1xuIGFuZ3VsYXIubW9kdWxlKCdpbnNpZGVyLmNvbnRyb2xsZXJzJylcbiAgLmNvbnRyb2xsZXIoJ1VwZ3JhZGVDdHJsJywgZnVuY3Rpb24gKCRzY29wZSkge1xuICAgICRzY29wZS51cGdyYWRlID0gZnVuY3Rpb24gKCkge1xuICAgICAgIGNvbnNvbGUubG9nKFwidXBncmFkaW5nIHN0dWZmXCIpO1xuICAgICAgIHdpbmRvdy5zdG9yZWtpdC5wdXJjaGFzZShcImNvbS5pbnNpZGVyYWkuaW9zLmJhc2ljMVwiLCAxKTtcbiAgICB9O1xuICAgIHJldHVybjtcbiAgfSk7XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
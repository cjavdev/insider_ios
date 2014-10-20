/*global window, cordova, angular */
var app = angular.module('insider', [
    'ionic',
    'insider.services',
    'insider.controllers',
    'insider.filters',
    'ngCordova'
  ])
  .constant('loc', {
    apiBase: 'http://localhost:3000'
    //apiBase: 'https://insiderai.com'
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
              // also need to do something about currentUser here
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

    var sendUser = function (userParams, deviceToken, url) {
      var params = {
        user: userParams,
        device: {
          platform: 'ios',
          token: deviceToken
        }
      };

      var deferred = $q.defer();

      $http.post(url, params)
        .then(function (resp) {
          saveUser(resp.data.user);
          deferred.resolve(resp.data);
        }, function (data) {
          deferred.reject(data);
        });

      return deferred.promise;
    };

    var doRegister = function (userParams, deviceToken) {
      var url = loc.apiBase + '/api/v1/users.json';
      return sendUser(userParams, deviceToken, url);
    };

    var doLogin = function (userParams, deviceToken) {
      var url = loc.apiBase + '/api/v1/users/sign_in.json';
      return sendUser(userParams, deviceToken, url);
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
      doRegister: doRegister,
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
      document.getElementById('user-email').focus();
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

/*globals angular, window, document */
 angular.module('insider.controllers')
  .controller('UpgradeCtrl', function ($scope, $ionicModal, $ionicPopup, $rootScope, AuthService) {
    $scope.userData = {};

    $ionicModal.fromTemplateUrl('templates/register.html', {
      scope: $scope
    }).then(function (modal) {
      $scope.registerModal = modal;
    });

    $scope.closeRegister = function () {
      $scope.registerModal.hide();
    };

    $scope.register = function () {
      $scope.registerModal.show();
      document.getElementById('user-email').focus();
    };

    $scope.doRegister = function () {
      AuthService.doRegister($scope.userData, $rootScope.deviceToken)
        .then(function () {
          $rootScope.$broadcast('authchange');
          $scope.closeRegister();
          window.storekit.purchase("com.insiderai.ios.basic1", 1);
        }, function (data) {
          if (data.message) {
            window.alert(data.message);
          } else {
            window.alert("Something went wrong with your login. Try again.");
          }
        });
    };

    $scope.upgrade = function () {
      $scope.register();
    };
    return;
  });

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImZpbHRlcnMuanMiLCJhdXRoX3NlcnZpY2UuanMiLCJjb21tZW50X3Nlcml2Y2UuanMiLCJjb21wYW55X3NlcnZpY2UuanMiLCJmb3JtNF9zZXJ2aWNlLmpzIiwiaWRlYV9zZXJ2aWNlLmpzIiwiaW5zaWRlcl9zZXJ2aWNlLmpzIiwic2VhcmNoX3Nlcml2Y2UuanMiLCJzZXR0aW5nc19zZXJ2aWNlLmpzIiwiYXBwX2NvbnRyb2xsZXIuanMiLCJidXlzX2NvbnRyb2xsZXIuanMiLCJjb21wYW55X2NvbnRyb2xsZXIuanMiLCJkaXNjbGFpbWVyX2NvbnRyb2xsZXIuanMiLCJmb3JtNF9jb250cm9sbGVyLmpzIiwiaW5zaWRlcl9jb250cm9sbGVyLmpzIiwic2VhcmNoX2NvbnRyb2xsZXIuanMiLCJzZXR0aW5nc19jb250cm9sbGVyLmpzIiwidG9kYXlzX2J1eXNfY29udHJvbGxlci5qcyIsInRyYWRlX2NvbnRyb2xsZXIuanMiLCJ1cGdyYWRlX2NvbnRyb2xsZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM1TUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDaEdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDMUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMzQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3RCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDaENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDaEdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDOUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM1QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNsQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMzQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ25CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDekJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJhbGwuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKmdsb2JhbCB3aW5kb3csIGNvcmRvdmEsIGFuZ3VsYXIgKi9cbnZhciBhcHAgPSBhbmd1bGFyLm1vZHVsZSgnaW5zaWRlcicsIFtcbiAgICAnaW9uaWMnLFxuICAgICdpbnNpZGVyLnNlcnZpY2VzJyxcbiAgICAnaW5zaWRlci5jb250cm9sbGVycycsXG4gICAgJ2luc2lkZXIuZmlsdGVycycsXG4gICAgJ25nQ29yZG92YSdcbiAgXSlcbiAgLmNvbnN0YW50KCdsb2MnLCB7XG4gICAgYXBpQmFzZTogJ2h0dHA6Ly9sb2NhbGhvc3Q6MzAwMCdcbiAgICAvL2FwaUJhc2U6ICdodHRwczovL2luc2lkZXJhaS5jb20nXG4gIH0pXG4gIC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyLCAkdXJsUm91dGVyUHJvdmlkZXIpIHtcbiAgICAkc3RhdGVQcm92aWRlclxuICAgICAgLnN0YXRlKCdhcHAnLCB7XG4gICAgICAgIHVybDogJy9hcHAnLFxuICAgICAgICBhYnN0cmFjdDogdHJ1ZSxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICd0ZW1wbGF0ZXMvbWVudS5odG1sJyxcbiAgICAgICAgY29udHJvbGxlcjogJ0FwcEN0cmwnXG4gICAgICB9KVxuICAgICAgLnN0YXRlKCdhcHAuYnV5cycsIHtcbiAgICAgICAgdXJsOiAnL2J1eXMnLFxuICAgICAgICB2aWV3czoge1xuICAgICAgICAgICdtZW51Q29udGVudCc6IHtcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAndGVtcGxhdGVzL2J1eXMuaHRtbCcsXG4gICAgICAgICAgICBjb250cm9sbGVyOiAnQnV5c0N0cmwnXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KVxuICAgICAgLnN0YXRlKCdhcHAudG9kYXknLCB7XG4gICAgICAgIHVybDogJy90b2RheScsXG4gICAgICAgIHZpZXdzOiB7XG4gICAgICAgICAgJ21lbnVDb250ZW50Jzoge1xuICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICd0ZW1wbGF0ZXMvdG9kYXkuaHRtbCcsXG4gICAgICAgICAgICBjb250cm9sbGVyOiAnVG9kYXlzQnV5c0N0cmwnXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KVxuICAgICAgLnN0YXRlKCdhcHAudHJhZGUnLCB7XG4gICAgICAgIHVybDogJy90cmFkZXMvOmlkJyxcbiAgICAgICAgdmlld3M6IHtcbiAgICAgICAgICAnbWVudUNvbnRlbnQnOiB7XG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogJ3RlbXBsYXRlcy90cmFkZS5odG1sJyxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdUcmFkZUN0cmwnXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KVxuICAgICAgLnN0YXRlKCdhcHAuaW5zaWRlcicsIHtcbiAgICAgICAgdXJsOiAnL2luc2lkZXJzLzppZCcsXG4gICAgICAgIHZpZXdzOiB7XG4gICAgICAgICAgJ21lbnVDb250ZW50Jzoge1xuICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICd0ZW1wbGF0ZXMvaW5zaWRlci5odG1sJyxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdJbnNpZGVyQ3RybCdcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgICAuc3RhdGUoJ2FwcC5mb3JtNCcsIHtcbiAgICAgICAgdXJsOiAnL2Zvcm00cy86aWQnLFxuICAgICAgICB2aWV3czoge1xuICAgICAgICAgICdtZW51Q29udGVudCc6IHtcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAndGVtcGxhdGVzL2Zvcm00Lmh0bWwnLFxuICAgICAgICAgICAgY29udHJvbGxlcjogJ0Zvcm00Q3RybCdcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgICAuc3RhdGUoJ2FwcC5jb21wYW55Jywge1xuICAgICAgICB1cmw6ICcvY29tcGFuaWVzLzppZCcsXG4gICAgICAgIHZpZXdzOiB7XG4gICAgICAgICAgJ21lbnVDb250ZW50Jzoge1xuICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICd0ZW1wbGF0ZXMvY29tcGFueS5odG1sJyxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdDb21wYW55Q3RybCdcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgICAuc3RhdGUoJ2FwcC5zZWFyY2gnLCB7XG4gICAgICAgIHVybDogJy9zZWFyY2gnLFxuICAgICAgICB2aWV3czoge1xuICAgICAgICAgICdtZW51Q29udGVudCc6IHtcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAndGVtcGxhdGVzL3NlYXJjaC5odG1sJyxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdTZWFyY2hDdHJsJ1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSlcbiAgICAgIC5zdGF0ZSgnYXBwLnVwZ3JhZGUnLCB7XG4gICAgICAgIHVybDogJy91cGdyYWRlJyxcbiAgICAgICAgdmlld3M6IHtcbiAgICAgICAgICAnbWVudUNvbnRlbnQnOiB7XG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogJ3RlbXBsYXRlcy91cGdyYWRlLmh0bWwnLFxuICAgICAgICAgICAgY29udHJvbGxlcjogJ1VwZ3JhZGVDdHJsJ1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSlcbiAgICAgIC5zdGF0ZSgnYXBwLmRpc2NsYWltZXInLCB7XG4gICAgICAgIHVybDogJy9kaXNjbGFpbWVyJyxcbiAgICAgICAgdmlld3M6IHtcbiAgICAgICAgICAnbWVudUNvbnRlbnQnOiB7XG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogJ3RlbXBsYXRlcy9kaXNjbGFpbWVyLmh0bWwnLFxuICAgICAgICAgICAgY29udHJvbGxlcjogJ0Rpc2NsYWltZXJDdHJsJ1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSlcbiAgICAgIC5zdGF0ZSgnYXBwLnNldHRpbmdzJywge1xuICAgICAgICB1cmw6ICcvc2V0dGluZ3MnLFxuICAgICAgICB2aWV3czoge1xuICAgICAgICAgICdtZW51Q29udGVudCc6IHtcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAndGVtcGxhdGVzL3NldHRpbmdzLmh0bWwnLFxuICAgICAgICAgICAgY29udHJvbGxlcjogJ1NldHRpbmdzQ3RybCdcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIC8vIGlmIG5vbmUgb2YgdGhlIGFib3ZlIHN0YXRlcyBhcmUgbWF0Y2hlZCwgdXNlIHRoaXMgYXMgdGhlIGZhbGxiYWNrXG4gICAgJHVybFJvdXRlclByb3ZpZGVyLm90aGVyd2lzZSgnL2FwcC9idXlzJyk7XG4gIH0pXG4gIC5ydW4oZnVuY3Rpb24gKCRzdGF0ZSwgJGlvbmljUGxhdGZvcm0sICRjb3Jkb3ZhUHVzaCwgJHJvb3RTY29wZSwgQXV0aFNlcnZpY2UpIHtcbiAgICBBdXRoU2VydmljZS52YWxpZGF0ZVVzZXIoKTtcblxuICAgICRpb25pY1BsYXRmb3JtLnJlYWR5KGZ1bmN0aW9uICgpIHtcbiAgICAgIC8vIEhpZGUgdGhlIGFjY2Vzc29yeSBiYXIgYnkgZGVmYXVsdCAocmVtb3ZlIHRoaXMgdG8gc2hvdyB0aGUgYWNjZXNzb3J5IGJhciBhYm92ZSB0aGUga2V5Ym9hcmRcbiAgICAgIC8vIGZvciBmb3JtIGlucHV0cylcbiAgICAgIGlmICh3aW5kb3cuY29yZG92YSAmJiB3aW5kb3cuY29yZG92YS5wbHVnaW5zLktleWJvYXJkKSB7XG4gICAgICAgIGNvcmRvdmEucGx1Z2lucy5LZXlib2FyZC5oaWRlS2V5Ym9hcmRBY2Nlc3NvcnlCYXIodHJ1ZSk7XG4gICAgICB9XG5cbiAgICAgIGlmICh3aW5kb3cuY29yZG92YSAmJiB3aW5kb3cuc3RvcmVraXQpIHtcbiAgICAgICAgd2luZG93LnN0b3Jla2l0LmluaXQoe1xuICAgICAgICAgIGRlYnVnOiB0cnVlLFxuICAgICAgICAgIHJlYWR5OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB3aW5kb3cuc3RvcmVraXQubG9hZChbXCJjb20uaW5zaWRlcmFpLmlvcy5iYXNpYzFcIl0sIGZ1bmN0aW9uIChwcm9kdWN0cywgaW52YWxpZElkcykge1xuICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIkluLWFwcCBwdXJjaGFzZXMgYXJlIHJlYWR5IHRvIGdvXCIpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSxcbiAgICAgICAgICBwdXJjaGFzZTogZnVuY3Rpb24gKHRyYW5zYWN0aW9uSWQsIHByb2R1Y3RJZCwgcmVjZWlwdCkge1xuICAgICAgICAgICAgaWYgKHByb2R1Y3RJZCA9PT0gJ2NvbS5pbnNpZGVyYWkuaW9zLmJhc2ljMScpIHtcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJQdXJjaGFzZWQgcHJvZHVjdCBpZCAxXCIpO1xuICAgICAgICAgICAgICAvLyBhbHNvIG5lZWQgdG8gZG8gc29tZXRoaW5nIGFib3V0IGN1cnJlbnRVc2VyIGhlcmVcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9LFxuICAgICAgICAgIHJlc3RvcmU6IGZ1bmN0aW9uICh0cmFuc2FjdGlvbklkLCBwcm9kdWN0SWQsIHRyYW5zYWN0aW9uUmVjZWlwdCkge1xuICAgICAgICAgICAgaWYgKHByb2R1Y3RJZCA9PT0gJ2NvbS5pbnNpZGVyYWkuaW9zLmJhc2ljMScpIHtcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJSZXN0b3JlZCBwcm9kdWN0IGlkIDEgcHVyY2hhc2VcIilcbiAgICAgICAgICAgICAgLy8gaW4gdGhpcyBjYXNlIG5lZWQgdG8gc2V0IHRoZSBjdXJyZW50VXNlciB0byBzb21ldGhpbmcuLi4gbm90IHN1cmUgd2hhdCB5ZXRcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9LFxuICAgICAgICAgIGVycm9yOiBmdW5jdGlvbiAoZXJyb3JDb2RlLCBlcnJvck1lc3NhZ2UpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiRVJST1I6IFwiICsgZXJyb3JNZXNzYWdlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICBpZiAod2luZG93LlN0YXR1c0Jhcikge1xuICAgICAgICAvLyBvcmcuYXBhY2hlLmNvcmRvdmEuc3RhdHVzYmFyIHJlcXVpcmVkXG4gICAgICAgIHdpbmRvdy5TdGF0dXNCYXIuc3R5bGVMaWdodENvbnRlbnQoKTtcbiAgICAgIH1cblxuICAgICAgdmFyIGlvc0NvbmZpZyA9IHtcbiAgICAgICAgXCJiYWRnZVwiOiBcInRydWVcIixcbiAgICAgICAgXCJzb3VuZFwiOiBcInRydWVcIixcbiAgICAgICAgXCJhbGVydFwiOiBcInRydWVcIixcbiAgICAgICAgXCJlY2JcIjogXCJvbk5vdGlmaWNhdGlvbkFQTlwiXG4gICAgICB9O1xuXG4gICAgICBpZiAod2luZG93LmNvcmRvdmEpIHtcbiAgICAgICAgJGNvcmRvdmFQdXNoLnJlZ2lzdGVyKGlvc0NvbmZpZykudGhlbihmdW5jdGlvbiAocmVzdWx0KSB7XG4gICAgICAgICAgJHJvb3RTY29wZS5kZXZpY2VUb2tlbiA9IHJlc3VsdDtcbiAgICAgICAgfSwgZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgIGNvbnNvbGUubG9nKFwibm90IGFibGUgdG8gc2VuZCBwdXNoXCIsIGVycik7XG4gICAgICAgIH0pO1xuICAgICAgICAvLyAkY29yZG92YVB1c2gudW5yZWdpc3RlcihvcHRpb25zKS50aGVuKGZ1bmN0aW9uKHJlc3VsdCkge1xuICAgICAgICAvLyAgIGFsZXJ0KFwidW5yZWdpc3RlclwiKTtcbiAgICAgICAgLy8gICBhbGVydChyZXN1bHQpO1xuICAgICAgICAvLyAgIGFsZXJ0KGFyZ3VtZW50cyk7XG4gICAgICAgIC8vICAgICAvLyBTdWNjZXNzIVxuICAgICAgICAvLyB9LCBmdW5jdGlvbihlcnIpIHtcbiAgICAgICAgLy8gICBhbGVydChcImVycm9yXCIpO1xuICAgICAgICAvLyAgIGFsZXJ0KGVycik7XG4gICAgICAgIC8vICAgICAvLyBBbiBlcnJvciBvY2N1cmVkLiBTaG93IGEgbWVzc2FnZSB0byB0aGUgdXNlclxuICAgICAgICAvLyB9KTtcbiAgICAgICAgLy9cbiAgICAgICAgLy8gLy8gaU9TIG9ubHlcblxuICAgICAgICB3aW5kb3cub25Ob3RpZmljYXRpb25BUE4gPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgIGNvbnNvbGUubG9nKCdvbiBub3RpZmljYXRpb246JywgZSk7XG4gICAgICAgICAgaWYgKGUuYWxlcnQpIHtcbiAgICAgICAgICAgICRzdGF0ZS5nbygnYXBwLnRyYWRlJywge1xuICAgICAgICAgICAgICBpZDogZS5pZGVhX2lkXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoZS5zb3VuZCkge1xuICAgICAgICAgICAgdmFyIHNuZCA9IG5ldyBNZWRpYShlLnNvdW5kKTtcbiAgICAgICAgICAgIHNuZC5wbGF5KCk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKGUuYmFkZ2UpIHtcbiAgICAgICAgICAgICRjb3Jkb3ZhUHVzaC5zZXRCYWRnZU51bWJlcihlLmJhZGdlKS50aGVuKGZ1bmN0aW9uIChyZXN1bHQpIHtcbiAgICAgICAgICAgICAgY29uc29sZS5sb2cocmVzdWx0KTtcbiAgICAgICAgICAgIH0sIGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coZXJyKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfSk7XG4iLCIvKmdsb2JhbHMgYW5ndWxhciwgbWQ1ICovXG5hbmd1bGFyLm1vZHVsZSgnaW5zaWRlci5maWx0ZXJzJywgW10pXG4gIC5maWx0ZXIoJ2dyYXZhdGFyJywgZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBmdW5jdGlvbiAoZW1haWwpIHtcbiAgICAgIHJldHVybiBcImh0dHA6Ly93d3cuZ3JhdmF0YXIuY29tL2F2YXRhci9cIiArIG1kNShlbWFpbCk7XG4gICAgfTtcbiAgfSk7XG4iLCIvKmdsb2JhbHMgd2luZG93LCBhbmd1bGFyLCBfICovXG5hbmd1bGFyLm1vZHVsZSgnaW5zaWRlci5zZXJ2aWNlcycsIFtdKVxuICAuZmFjdG9yeSgnQXV0aFNlcnZpY2UnLCBmdW5jdGlvbiAobG9jLCAkcSwgJGh0dHApIHtcbiAgICB2YXIgdXNlciA9IG51bGw7XG5cbiAgICB2YXIgcmVhZFN0b3JlZFVzZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgc3RvcmVkVXNlciA9IHdpbmRvdy5sb2NhbFN0b3JhZ2UuZ2V0SXRlbSgndXNlcicpO1xuICAgICAgdHJ5IHtcbiAgICAgICAgaWYgKHN0b3JlZFVzZXIpIHtcbiAgICAgICAgICB1c2VyID0gSlNPTi5wYXJzZShzdG9yZWRVc2VyKTtcbiAgICAgICAgICAkaHR0cC5kZWZhdWx0cy5oZWFkZXJzLmNvbW1vblsnQXV0aC1Ub2tlbi1YJ10gPSB1c2VyLmF1dGhfdG9rZW47XG4gICAgICAgIH1cbiAgICAgIH0gY2F0Y2ggKGlnbm9yZSkgeyAvKiBmYWlsIHNpbGVudGx5Ki8gfVxuICAgIH07XG5cbiAgICByZWFkU3RvcmVkVXNlcigpO1xuXG4gICAgdmFyIGN1cnJlbnRVc2VyID0gZnVuY3Rpb24gKCkge1xuICAgICAgaWYgKCF1c2VyKSB7XG4gICAgICAgIHVzZXIgPSByZWFkU3RvcmVkVXNlcigpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHVzZXI7XG4gICAgfTtcblxuICAgIHZhciBzYXZlVXNlciA9IGZ1bmN0aW9uICh1c2VyVG9TYXZlKSB7XG4gICAgICB1c2VyID0gdXNlclRvU2F2ZTtcbiAgICAgIHdpbmRvdy5sb2NhbFN0b3JhZ2Uuc2V0SXRlbSgndXNlcicsIEpTT04uc3RyaW5naWZ5KHVzZXIpKTtcbiAgICAgICRodHRwLmRlZmF1bHRzLmhlYWRlcnMuY29tbW9uWydBdXRoLVRva2VuLVgnXSA9IHVzZXIuYXV0aF90b2tlbjtcbiAgICB9O1xuXG4gICAgdmFyIGNsZWFyVXNlciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIHdpbmRvdy5sb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbSgndXNlcicpO1xuICAgICAgJGh0dHAuZGVmYXVsdHMuaGVhZGVycy5jb21tb25bJ0F1dGgtVG9rZW4tWCddID0gdW5kZWZpbmVkO1xuICAgICAgdXNlciA9IG51bGw7XG4gICAgfTtcblxuICAgIHZhciBsb2dnZWRJbiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiAhIWN1cnJlbnRVc2VyKCk7XG4gICAgfTtcblxuICAgIHZhciBzZW5kVXNlciA9IGZ1bmN0aW9uICh1c2VyUGFyYW1zLCBkZXZpY2VUb2tlbiwgdXJsKSB7XG4gICAgICB2YXIgcGFyYW1zID0ge1xuICAgICAgICB1c2VyOiB1c2VyUGFyYW1zLFxuICAgICAgICBkZXZpY2U6IHtcbiAgICAgICAgICBwbGF0Zm9ybTogJ2lvcycsXG4gICAgICAgICAgdG9rZW46IGRldmljZVRva2VuXG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIHZhciBkZWZlcnJlZCA9ICRxLmRlZmVyKCk7XG5cbiAgICAgICRodHRwLnBvc3QodXJsLCBwYXJhbXMpXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uIChyZXNwKSB7XG4gICAgICAgICAgc2F2ZVVzZXIocmVzcC5kYXRhLnVzZXIpO1xuICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUocmVzcC5kYXRhKTtcbiAgICAgICAgfSwgZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgICAgICBkZWZlcnJlZC5yZWplY3QoZGF0YSk7XG4gICAgICAgIH0pO1xuXG4gICAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbiAgICB9O1xuXG4gICAgdmFyIGRvUmVnaXN0ZXIgPSBmdW5jdGlvbiAodXNlclBhcmFtcywgZGV2aWNlVG9rZW4pIHtcbiAgICAgIHZhciB1cmwgPSBsb2MuYXBpQmFzZSArICcvYXBpL3YxL3VzZXJzLmpzb24nO1xuICAgICAgcmV0dXJuIHNlbmRVc2VyKHVzZXJQYXJhbXMsIGRldmljZVRva2VuLCB1cmwpO1xuICAgIH07XG5cbiAgICB2YXIgZG9Mb2dpbiA9IGZ1bmN0aW9uICh1c2VyUGFyYW1zLCBkZXZpY2VUb2tlbikge1xuICAgICAgdmFyIHVybCA9IGxvYy5hcGlCYXNlICsgJy9hcGkvdjEvdXNlcnMvc2lnbl9pbi5qc29uJztcbiAgICAgIHJldHVybiBzZW5kVXNlcih1c2VyUGFyYW1zLCBkZXZpY2VUb2tlbiwgdXJsKTtcbiAgICB9O1xuXG4gICAgdmFyIGRvTG9nb3V0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgY2xlYXJVc2VyKCk7XG4gICAgICByZXR1cm4gJGh0dHAuZGVsZXRlKGxvYy5hcGlCYXNlICsgJy9hcGkvdjEvdXNlcnMvc2lnbl9vdXQuanNvbicpO1xuICAgIH07XG5cbiAgICB2YXIgdmFsaWRhdGVVc2VyID0gZnVuY3Rpb24gKCkge1xuICAgICAgJGh0dHAuZ2V0KGxvYy5hcGlCYXNlICsgJy9hcGkvdjEvc2Vzc2lvbnMvdmFsaWRhdGUuanNvbicpXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uIChyZXNwKSB7XG4gICAgICAgICAgc2F2ZVVzZXIocmVzcC5kYXRhLnVzZXIpO1xuICAgICAgICB9LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgY2xlYXJVc2VyKCk7XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICByZXR1cm4ge1xuICAgICAgZG9Mb2dpbjogZG9Mb2dpbixcbiAgICAgIGRvTG9nb3V0OiBkb0xvZ291dCxcbiAgICAgIGRvUmVnaXN0ZXI6IGRvUmVnaXN0ZXIsXG4gICAgICBsb2dnZWRJbjogbG9nZ2VkSW4sXG4gICAgICBjdXJyZW50VXNlcjogY3VycmVudFVzZXIsXG4gICAgICB2YWxpZGF0ZVVzZXI6IHZhbGlkYXRlVXNlcixcbiAgICAgIHNhdmVVc2VyOiBzYXZlVXNlclxuICAgIH07XG4gIH0pO1xuIiwiLypnbG9iYWxzIGFuZ3VsYXIsIF8gKi9cbmFuZ3VsYXIubW9kdWxlKCdpbnNpZGVyLnNlcnZpY2VzJylcbiAgLmZhY3RvcnkoJ0NvbW1lbnRTZXJ2aWNlJywgZnVuY3Rpb24obG9jLCAkcSwgJGh0dHApIHtcbiAgICBmdW5jdGlvbiB1cmwoaWQsIHR5cGUpIHtcbiAgICAgIGlmKGlkKSB7XG4gICAgICAgIHJldHVybiBsb2MuYXBpQmFzZSArICcvYXBpL3YxL2NvbW1lbnRzLycgKyBpZCArICcvJyArIHR5cGUgKyAnLmpzb24nO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGxvYy5hcGlCYXNlICsgJy9hcGkvdjEvY29tbWVudHMuanNvbic7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIGFkZENvbW1lbnQ6IGZ1bmN0aW9uIChwYXJhbXMpIHtcbiAgICAgICAgdmFyIGRlZmVycmVkID0gJHEuZGVmZXIoKTtcbiAgICAgICAgJGh0dHAucG9zdCh1cmwoKSwgcGFyYW1zKS50aGVuKGZ1bmN0aW9uIChyZXNwKSB7XG4gICAgICAgICAgZGVmZXJyZWQucmVzb2x2ZShyZXNwLmRhdGEpO1xuICAgICAgICB9LCBmdW5jdGlvbiAoZGF0YSkge1xuICAgICAgICAgIGRlZmVycmVkLnJlamVjdChkYXRhKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xuICAgICAgfSxcblxuICAgICAgcmVtb3ZlQ29tbWVudDogZnVuY3Rpb24gKGlkLCB0eXBlKSB7XG4gICAgICAgIHJldHVybiAkaHR0cC5kZWxldGUodXJsKGlkLCB0eXBlKSk7XG4gICAgICB9XG4gICAgfTtcbiAgfSk7XG4iLCIvKmdsb2JhbHMgYW5ndWxhciwgXyAqL1xuYW5ndWxhci5tb2R1bGUoJ2luc2lkZXIuc2VydmljZXMnKVxuICAuZmFjdG9yeSgnQ29tcGFueVNlcnZpY2UnLCBmdW5jdGlvbihsb2MsICRxLCAkaHR0cCkge1xuICAgIGZ1bmN0aW9uIHVybChpZCkge1xuICAgICBpZihpZCkge1xuICAgICAgICByZXR1cm4gbG9jLmFwaUJhc2UgKyAnL2FwaS92MS9jb21wYW5pZXMvJyArIGlkICsgJy5qc29uJztcbiAgICAgIH1cbiAgICAgIHJldHVybiBsb2MuYXBpQmFzZSArICcvYXBpL3YxL2NvbXBhbmllcy5qc29uJztcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgZmluZEJ5SWQ6IGZ1bmN0aW9uIChpZCkge1xuICAgICAgICB2YXIgZGVmZXJyZWQgPSAkcS5kZWZlcigpO1xuICAgICAgICAkaHR0cC5nZXQodXJsKGlkKSkudGhlbihmdW5jdGlvbiAocmVzcCkge1xuICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUocmVzcC5kYXRhKTtcbiAgICAgICAgfSwgZnVuY3Rpb24gKHJlc3ApIHtcbiAgICAgICAgICBkZWZlcnJlZC5yZWplY3QocmVzcC5kYXRhKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xuICAgICAgfSxcbiAgICB9O1xuICB9KTtcblxuIiwiLypnbG9iYWxzIGFuZ3VsYXIsIF8gKi9cbmFuZ3VsYXIubW9kdWxlKCdpbnNpZGVyLnNlcnZpY2VzJylcbiAgLmZhY3RvcnkoJ0Zvcm00U2VydmljZScsIGZ1bmN0aW9uKGxvYywgJHEsICRodHRwKSB7XG4gICAgZnVuY3Rpb24gdXJsKGlkKSB7XG4gICAgIGlmKGlkKSB7XG4gICAgICAgIHJldHVybiBsb2MuYXBpQmFzZSArICcvYXBpL3YxL2Zvcm00cy8nICsgaWQgKyAnLmpzb24nO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGxvYy5hcGlCYXNlICsgJy9hcGkvdjEvZm9ybTRzLmpzb24nO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICBmaW5kQnlJZDogZnVuY3Rpb24gKGlkKSB7XG4gICAgICAgIHZhciBkZWZlcnJlZCA9ICRxLmRlZmVyKCk7XG4gICAgICAgICRodHRwLmdldCh1cmwoaWQpKS50aGVuKGZ1bmN0aW9uIChyZXNwKSB7XG4gICAgICAgICAgdmFyIGZpbGluZyA9IHJlc3AuZGF0YTtcbiAgICAgICAgICB2YXIgZG9jID0gSlNPTi5wYXJzZShyZXNwLmRhdGEuZmlsaW5nKTtcbiAgICAgICAgICBmaWxpbmcubm9uRGVyaXZhdGl2ZVRyYW5zYWN0aW9ucyA9IGRvYy50cmFuc2FjdGlvbnM7XG4gICAgICAgICAgZmlsaW5nLmRlcml2YXRpdmVUcmFuc2FjdGlvbnMgPSBkb2MuZGVyaXZhdGl2ZV90cmFuc2FjdGlvbnM7XG4gICAgICAgICAgZGVmZXJyZWQucmVzb2x2ZShmaWxpbmcpO1xuICAgICAgICB9LCBmdW5jdGlvbiAocmVzcCkge1xuICAgICAgICAgIGRlZmVycmVkLnJlamVjdChyZXNwLmRhdGEpO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG4gICAgICB9LFxuICAgIH07XG4gIH0pO1xuIiwiLypnbG9iYWxzIGFuZ3VsYXIsIF8gKi9cbmFuZ3VsYXIubW9kdWxlKCdpbnNpZGVyLnNlcnZpY2VzJylcbiAgLmZhY3RvcnkoJ0J1eUlkZWFTZXJ2aWNlJywgZnVuY3Rpb24obG9jLCAkcSwgJGh0dHApIHtcbiAgICBmdW5jdGlvbiB1cmwoaWQpIHtcbiAgICAgIGlmKGlkKSB7XG4gICAgICAgIHJldHVybiBsb2MuYXBpQmFzZSArICcvYXBpL3YxL2J1eXMvJyArIGlkICsgJy5qc29uJztcbiAgICAgIH1cbiAgICAgIHJldHVybiBsb2MuYXBpQmFzZSArICcvYXBpL3YxL2J1eXMuanNvbic7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIGZpbmRBbGw6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGRlZmVycmVkID0gJHEuZGVmZXIoKTtcbiAgICAgICAgJGh0dHAuZ2V0KHVybCgpLCB7IGNhY2hlOiB0cnVlIH0pXG4gICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKHJlc3ApIHtcbiAgICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUocmVzcC5kYXRhKTtcbiAgICAgICAgICB9LCBmdW5jdGlvbiAocmVzcCkge1xuICAgICAgICAgICAgZGVmZXJyZWQucmVqZWN0KHJlc3AuZGF0YSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xuICAgICAgfSxcblxuICAgICAgZmluZEJ5SWQ6IGZ1bmN0aW9uIChpZCkge1xuICAgICAgICB2YXIgZGVmZXJyZWQgPSAkcS5kZWZlcigpO1xuICAgICAgICAkaHR0cC5nZXQodXJsKGlkKSwgeyBjYWNoZTogdHJ1ZSB9KVxuICAgICAgICAgIC50aGVuKGZ1bmN0aW9uIChyZXNwKSB7XG4gICAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKHJlc3AuZGF0YSk7XG4gICAgICAgICAgfSwgZnVuY3Rpb24gKHJlc3ApIHtcbiAgICAgICAgICAgIGRlZmVycmVkLnJlamVjdChyZXNwLmRhdGEpO1xuICAgICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbiAgICAgIH0sXG5cbiAgICAgIGZpbmRUb2RheXM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGRlZmVycmVkID0gJHEuZGVmZXIoKTtcbiAgICAgICAgJGh0dHAuZ2V0KHVybCgpLCB7IHBhcmFtczogeyAndG9kYXknOiB0cnVlIH0sIGNhY2hlOiB0cnVlIH0pXG4gICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKHJlc3ApIHtcbiAgICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUocmVzcC5kYXRhKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG4gICAgICB9XG4gICAgfTtcbiAgfSk7XG4iLCIvKmdsb2JhbHMgYW5ndWxhciwgXyAqL1xuYW5ndWxhci5tb2R1bGUoJ2luc2lkZXIuc2VydmljZXMnKVxuICAuZmFjdG9yeSgnSW5zaWRlclNlcnZpY2UnLCBmdW5jdGlvbihsb2MsICRxLCAkaHR0cCkge1xuICAgIGZ1bmN0aW9uIHVybChpZCkge1xuICAgICBpZihpZCkge1xuICAgICAgICByZXR1cm4gbG9jLmFwaUJhc2UgKyAnL2FwaS92MS9pbnNpZGVycy8nICsgaWQgKyAnLmpzb24nO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGxvYy5hcGlCYXNlICsgJy9hcGkvdjEvaW5zaWRlcnMuanNvbic7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIGZpbmRCeUlkOiBmdW5jdGlvbiAoaWQpIHtcbiAgICAgICAgdmFyIGRlZmVycmVkID0gJHEuZGVmZXIoKTtcbiAgICAgICAgJGh0dHAuZ2V0KHVybChpZCkpLnRoZW4oZnVuY3Rpb24gKHJlc3ApIHtcbiAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKHJlc3AuZGF0YSk7XG4gICAgICAgIH0sIGZ1bmN0aW9uIChyZXNwKSB7XG4gICAgICAgICAgZGVmZXJyZWQucmVqZWN0KHJlc3AuZGF0YSk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbiAgICAgIH0sXG4gICAgfTtcbiAgfSk7XG4iLCIvKmdsb2JhbHMgYW5ndWxhciwgXyAqL1xuYW5ndWxhci5tb2R1bGUoJ2luc2lkZXIuc2VydmljZXMnKVxuICAuZmFjdG9yeSgnU2VhcmNoU2VydmljZScsIGZ1bmN0aW9uKGxvYywgJGh0dHApIHtcbiAgICBmdW5jdGlvbiB1cmwocSkge1xuICAgICAgcmV0dXJuIGxvYy5hcGlCYXNlICsgJy9hcGkvdjEvc2VhcmNoP3E9JyArIHE7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIHNlYXJjaDogZnVuY3Rpb24gKGtleXdvcmQpIHtcbiAgICAgICAgcmV0dXJuICRodHRwLmdldCh1cmwoa2V5d29yZCksIHsgY2FjaGU6IHRydWUgfSk7XG4gICAgICB9XG4gICAgfTtcbiAgfSk7XG4iLCIvKmdsb2JhbHMgYW5ndWxhciwgXyAqL1xuYW5ndWxhci5tb2R1bGUoJ2luc2lkZXIuc2VydmljZXMnKVxuICAuZmFjdG9yeSgnU2V0dGluZ3NTZXJ2aWNlJywgZnVuY3Rpb24oJHEsICRodHRwLCBBdXRoU2VydmljZSwgbG9jKSB7XG4gICAgZnVuY3Rpb24gdXJsKCkge1xuICAgICAgcmV0dXJuIGxvYy5hcGlCYXNlICsgJy9hcGkvdjEvc2V0dGluZyc7XG4gICAgfVxuXG4gICAgdmFyIHNldCA9IGZ1bmN0aW9uIChrZXksIHZhbHVlKSB7XG4gICAgICB2YXIgcGFyYW1zID0ge307XG4gICAgICBwYXJhbXNba2V5XSA9IHZhbHVlO1xuXG4gICAgICB2YXIgZGVmZXJyZWQgPSAkcS5kZWZlcigpO1xuICAgICAgJGh0dHAucHV0KHVybCgpLCBwYXJhbXMpLnRoZW4oZnVuY3Rpb24gKHJlc3ApIHtcbiAgICAgICAgQXV0aFNlcnZpY2Uuc2F2ZVVzZXIocmVzcC5kYXRhLnVzZXIpO1xuICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKHJlc3AuZGF0YSk7XG4gICAgICB9LCBmdW5jdGlvbiAocmVzcCkge1xuICAgICAgICBkZWZlcnJlZC5yZWplY3QocmVzcC5kYXRhKTtcbiAgICAgIH0pO1xuXG4gICAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbiAgICB9O1xuXG4gICAgdmFyIHRvZ2dsZVNldHRpbmcgPSBmdW5jdGlvbiAoa2V5KSB7XG4gICAgICB2YXIgc3RhcnQgPSBBdXRoU2VydmljZS5jdXJyZW50VXNlcigpW2tleV07XG4gICAgICByZXR1cm4gc2V0KGtleSwgIXN0YXJ0KTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIHNldDogc2V0LFxuICAgICAgdG9nZ2xlU2V0dGluZzogdG9nZ2xlU2V0dGluZ1xuICAgIH07XG4gIH0pO1xuIiwiLypnbG9iYWxzIGFuZ3VsYXIsIHdpbmRvdywgZG9jdW1lbnQgKi9cbmFuZ3VsYXIubW9kdWxlKCdpbnNpZGVyLmNvbnRyb2xsZXJzJywgW10pXG4gIC5jb250cm9sbGVyKCdBcHBDdHJsJywgZnVuY3Rpb24gKCR0aW1lb3V0LCAkaW9uaWNMb2FkaW5nLCAkcSwgJHNjb3BlLCAkaW9uaWNNb2RhbCwgJHJvb3RTY29wZSwgQXV0aFNlcnZpY2UpIHtcbiAgICAkc2NvcGUubG9naW5EYXRhID0ge307XG5cbiAgICAkaW9uaWNNb2RhbC5mcm9tVGVtcGxhdGVVcmwoJ3RlbXBsYXRlcy9sb2dpbi5odG1sJywge1xuICAgICAgc2NvcGU6ICRzY29wZVxuICAgIH0pLnRoZW4oZnVuY3Rpb24gKG1vZGFsKSB7XG4gICAgICAkc2NvcGUubW9kYWwgPSBtb2RhbDtcbiAgICB9KTtcblxuICAgICRzY29wZS5jbG9zZUxvZ2luID0gZnVuY3Rpb24gKCkge1xuICAgICAgJHNjb3BlLm1vZGFsLmhpZGUoKTtcbiAgICB9O1xuXG4gICAgJHNjb3BlLmxvZ2luID0gZnVuY3Rpb24gKCkge1xuICAgICAgJHNjb3BlLm1vZGFsLnNob3coKTtcbiAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd1c2VyLWVtYWlsJykuZm9jdXMoKTtcbiAgICB9O1xuXG4gICAgJHNjb3BlLmxvZ291dCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIEF1dGhTZXJ2aWNlLmRvTG9nb3V0KCkudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdChcImF1dGhjaGFuZ2VcIik7XG4gICAgICB9KTtcbiAgICB9O1xuXG4gICAgJHNjb3BlLmxvZ2dlZEluID0gZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuIEF1dGhTZXJ2aWNlLmxvZ2dlZEluKCk7XG4gICAgfTtcblxuICAgICRzY29wZS5kb0xvZ2luID0gZnVuY3Rpb24gKCkge1xuICAgICAgQXV0aFNlcnZpY2UuZG9Mb2dpbigkc2NvcGUubG9naW5EYXRhLCAkcm9vdFNjb3BlLmRldmljZVRva2VuKVxuICAgICAgICAudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KCdhdXRoY2hhbmdlJyk7XG4gICAgICAgICAgJHNjb3BlLmNsb3NlTG9naW4oKTtcbiAgICAgICAgfSwgZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgICAgICBpZiAoZGF0YS5tZXNzYWdlKSB7XG4gICAgICAgICAgICB3aW5kb3cuYWxlcnQoZGF0YS5tZXNzYWdlKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgd2luZG93LmFsZXJ0KFwiU29tZXRoaW5nIHdlbnQgd3Jvbmcgd2l0aCB5b3VyIGxvZ2luLiBUcnkgYWdhaW4uXCIpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgICRzY29wZS5yZXRyeVdpdGhQcm9taXNlID0gZnVuY3Rpb24gKHByb21pc2UsIGFyZ3MsIG1heFRyaWVzLCBjb250ZXh0LCBkZWZlcnJlZCkge1xuICAgICAgZGVmZXJyZWQgPSBkZWZlcnJlZCB8fCAkcS5kZWZlcigpO1xuICAgICAgY29udGV4dCA9IGNvbnRleHQgfHwgbnVsbDtcblxuICAgICAgJHNjb3BlLmxvYWRpbmcgPSB0cnVlO1xuICAgICAgJGlvbmljTG9hZGluZy5zaG93KHtcbiAgICAgICAgdGVtcGxhdGU6IFwiPGkgY2xhc3M9J2lvbi1sb2FkaW5nLWQnPjwvaT5cIlxuICAgICAgfSk7XG5cbiAgICAgIHByb21pc2UuYXBwbHkoY29udGV4dCwgYXJncylcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgICAkc2NvcGUubG9hZGluZyA9IGZhbHNlO1xuICAgICAgICAgICRpb25pY0xvYWRpbmcuaGlkZSgpO1xuICAgICAgICAgIHJldHVybiBkZWZlcnJlZC5yZXNvbHZlKGQpO1xuICAgICAgICB9LCBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgaWYgKG1heFRyaWVzID09PSAtMSkge1xuICAgICAgICAgICAgJGlvbmljTG9hZGluZy5oaWRlKCk7XG4gICAgICAgICAgICAkc2NvcGUubG9hZGluZyA9IGZhbHNlO1xuICAgICAgICAgICAgcmV0dXJuIGRlZmVycmVkLnJlamVjdChlcnIpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAkdGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgJHNjb3BlLnJldHJ5V2l0aFByb21pc2UocHJvbWlzZSwgYXJncywgbWF4VHJpZXMgLSAxLCBjb250ZXh0LCBkZWZlcnJlZCk7XG4gICAgICAgICAgICB9LCAyMDAwKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG4gICAgfTtcblxuICAgICRzY29wZS5yZXRyeVdpdGhQcm9taXNlUHVsbFRvUmVmcmVzaCA9IGZ1bmN0aW9uIChwcm9taXNlLCBhcmdzLCBtYXhUcmllcywgY29udGV4dCwgZGVmZXJyZWQpIHtcbiAgICAgIGRlZmVycmVkID0gZGVmZXJyZWQgfHwgJHEuZGVmZXIoKTtcbiAgICAgIGNvbnRleHQgPSBjb250ZXh0IHx8IG51bGw7XG5cbiAgICAgICRzY29wZS5sb2FkaW5nID0gdHJ1ZTtcbiAgICAgIHByb21pc2UuYXBwbHkoY29udGV4dCwgYXJncylcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgICAkc2NvcGUubG9hZGluZyA9IGZhbHNlO1xuICAgICAgICAgICRzY29wZS4kYnJvYWRjYXN0KCdzY3JvbGwucmVmcmVzaENvbXBsZXRlJyk7XG4gICAgICAgICAgcmV0dXJuIGRlZmVycmVkLnJlc29sdmUoZCk7XG4gICAgICAgIH0sIGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICBpZiAobWF4VHJpZXMgPT09IC0xKSB7XG4gICAgICAgICAgICAkc2NvcGUuJGJyb2FkY2FzdCgnc2Nyb2xsLnJlZnJlc2hDb21wbGV0ZScpO1xuICAgICAgICAgICAgJHNjb3BlLmxvYWRpbmcgPSBmYWxzZTtcbiAgICAgICAgICAgIHJldHVybiBkZWZlcnJlZC5yZWplY3QoZXJyKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgJHRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICRzY29wZS5yZXRyeVdpdGhQcm9taXNlKHByb21pc2UsIGFyZ3MsIG1heFRyaWVzIC0gMSwgY29udGV4dCwgZGVmZXJyZWQpO1xuICAgICAgICAgICAgfSwgMjAwMCk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xuICAgIH07XG4gIH0pO1xuIiwiLypnbG9iYWxzIGFuZ3VsYXIsIHdpbmRvdyAqL1xuIGFuZ3VsYXIubW9kdWxlKCdpbnNpZGVyLmNvbnRyb2xsZXJzJylcbiAgLmNvbnRyb2xsZXIoJ0J1eXNDdHJsJywgZnVuY3Rpb24gKCRjYWNoZUZhY3RvcnksICRzdGF0ZSwgJHNjb3BlLCBsb2MsIEJ1eUlkZWFTZXJ2aWNlKSB7XG4gICAgdmFyIGxvYWRSZW1vdGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAkc2NvcGUucmV0cnlXaXRoUHJvbWlzZVB1bGxUb1JlZnJlc2goQnV5SWRlYVNlcnZpY2UuZmluZEFsbCwgW10sIDMsIHRoaXMpXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uICh0cmFkZXMpIHtcbiAgICAgICAgICAkc2NvcGUudHJhZGVzID0gdHJhZGVzO1xuICAgICAgICB9LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgLy8gVE9ETzogc2hvdyBubyB0cmFkZXMgZm91bmQgdGhpbmdcbiAgICAgICAgICAkc2NvcGUudHJhZGVzID0gW107XG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgbG9hZFJlbW90ZSgpO1xuXG4gICAgJHNjb3BlLnJlZnJlc2ggPSBmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgY2FjaGUgPSAkY2FjaGVGYWN0b3J5LmdldCgnJGh0dHAnKTtcbiAgICAgIGNhY2hlLnJlbW92ZShsb2MuYXBpQmFzZSArICcvYXBpL3YxL2J1eXMuanNvbicpO1xuICAgICAgbG9hZFJlbW90ZSgpO1xuICAgIH07XG5cbiAgICAkc2NvcGUuc2hvd1RyYWRlID0gZnVuY3Rpb24gKGlkKSB7XG4gICAgICAkc3RhdGUuZ28oJ2FwcC50cmFkZScsIHtcbiAgICAgICAgaWQ6IGlkXG4gICAgICB9KTtcbiAgICB9O1xuXG4gICAgJHNjb3BlLiRvbignYXV0aGNoYW5nZScsIGZ1bmN0aW9uICgpIHtcbiAgICAgICRzY29wZS5yZWZyZXNoKCk7XG4gICAgfSk7XG4gIH0pO1xuIiwiLypnbG9iYWxzIGFuZ3VsYXIsIHdpbmRvdyAqL1xuYW5ndWxhci5tb2R1bGUoJ2luc2lkZXIuY29udHJvbGxlcnMnKVxuICAuY29udHJvbGxlcignQ29tcGFueUN0cmwnLCBmdW5jdGlvbiAoJHN0YXRlLCAkc2NvcGUsICRzdGF0ZVBhcmFtcywgQ29tcGFueVNlcnZpY2UpIHtcbiAgICAkc2NvcGUuc2hvd1RyYWRlcyA9IHRydWU7XG5cbiAgICAkc2NvcGUucmVmcmVzaCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICRzY29wZS5yZXRyeVdpdGhQcm9taXNlKENvbXBhbnlTZXJ2aWNlLmZpbmRCeUlkLCBbJHN0YXRlUGFyYW1zLmlkXSwgMywgdGhpcylcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24gKGNvbXBhbnlEYXRhKSB7XG4gICAgICAgICAgJHNjb3BlLmNvbXBhbnkgPSBjb21wYW55RGF0YTtcbiAgICAgICAgfSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgIGNvbnNvbGUubG9nKFwic2FkIGZhY2VcIik7XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICAkc2NvcGUucmVmcmVzaCgpO1xuXG4gICAgJHNjb3BlLmdvVG9JbnNpZGVyID0gZnVuY3Rpb24gKGluc2lkZXIpIHtcbiAgICAgICRzdGF0ZS5nbygnYXBwLmluc2lkZXInLCB7XG4gICAgICAgIGlkOiBpbnNpZGVyLmlkXG4gICAgICB9KTtcbiAgICB9O1xuXG4gICAgJHNjb3BlLmdvVG9Gb3JtNCA9IGZ1bmN0aW9uIChmb3JtNCkge1xuICAgICAgJHN0YXRlLmdvKCdhcHAuZm9ybTQnLCB7XG4gICAgICAgIGlkOiBmb3JtNC5pZFxuICAgICAgfSk7XG4gICAgfTtcbiAgfSk7XG4iLCIvKmdsb2JhbHMgYW5ndWxhciwgd2luZG93ICovXG4gYW5ndWxhci5tb2R1bGUoJ2luc2lkZXIuY29udHJvbGxlcnMnKVxuICAuY29udHJvbGxlcignRGlzY2xhaW1lckN0cmwnLCBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuO1xuICB9KTtcbiIsIi8qZ2xvYmFscyBhbmd1bGFyLCB3aW5kb3cgKi9cbmFuZ3VsYXIubW9kdWxlKCdpbnNpZGVyLmNvbnRyb2xsZXJzJylcbiAgLmNvbnRyb2xsZXIoJ0Zvcm00Q3RybCcsIGZ1bmN0aW9uICgkc2NvcGUsICRzdGF0ZVBhcmFtcywgRm9ybTRTZXJ2aWNlKSB7XG4gICAgJHNjb3BlLnJlZnJlc2ggPSBmdW5jdGlvbiAoKSB7XG4gICAgICAkc2NvcGUucmV0cnlXaXRoUHJvbWlzZShGb3JtNFNlcnZpY2UuZmluZEJ5SWQsIFskc3RhdGVQYXJhbXMuaWRdLCAzLCB0aGlzKVxuICAgICAgICAudGhlbihmdW5jdGlvbiAoZm9ybTREYXRhKSB7XG4gICAgICAgICAgJHNjb3BlLmZvcm00ID0gZm9ybTREYXRhO1xuICAgICAgICB9LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coXCJzYWQgZmFjZVwiKTtcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgICRzY29wZS5uYXZpZ2F0ZVRvID0gZnVuY3Rpb24gKHVybCkge1xuICAgICAgd2luZG93Lm9wZW4odXJsLCAnX2JsYW5rJywgJ2xvY2F0aW9uPXllcycpO1xuICAgIH07XG5cbiAgICAkc2NvcGUucmVmcmVzaCgpO1xuICB9KTtcbiIsIi8qZ2xvYmFscyBhbmd1bGFyLCB3aW5kb3cgKi9cbmFuZ3VsYXIubW9kdWxlKCdpbnNpZGVyLmNvbnRyb2xsZXJzJylcbiAgLmNvbnRyb2xsZXIoJ0luc2lkZXJDdHJsJywgZnVuY3Rpb24gKCRzdGF0ZSwgJHNjb3BlLCAkc3RhdGVQYXJhbXMsIEluc2lkZXJTZXJ2aWNlKSB7XG4gICAgJHNjb3BlLnNob3dUcmFkZXMgPSB0cnVlO1xuXG4gICAgJHNjb3BlLnJlZnJlc2ggPSBmdW5jdGlvbiAoKSB7XG4gICAgICAkc2NvcGUucmV0cnlXaXRoUHJvbWlzZShJbnNpZGVyU2VydmljZS5maW5kQnlJZCwgWyRzdGF0ZVBhcmFtcy5pZF0sIDMsIHRoaXMpXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uIChpbnNpZGVyRGF0YSkge1xuICAgICAgICAgICRzY29wZS5pbnNpZGVyID0gaW5zaWRlckRhdGE7XG4gICAgICAgIH0sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBjb25zb2xlLmxvZyhcInNhZCBmYWNlXCIpO1xuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgJHNjb3BlLnJlZnJlc2goKTtcblxuICAgICRzY29wZS5nb1RvQ29tcGFueSA9IGZ1bmN0aW9uIChjb21wYW55KSB7XG4gICAgICAkc3RhdGUuZ28oJ2FwcC5jb21wYW55Jywge1xuICAgICAgICBpZDogY29tcGFueS5pZFxuICAgICAgfSk7XG4gICAgfTtcbiAgICAkc2NvcGUuZ29Ub0Zvcm00ID0gZnVuY3Rpb24gKGZvcm00KSB7XG4gICAgICAkc3RhdGUuZ28oJ2FwcC5mb3JtNCcsIHtcbiAgICAgICAgaWQ6IGZvcm00LmlkXG4gICAgICB9KTtcbiAgICB9O1xuICB9KTtcbiIsIi8qZ2xvYmFscyBhbmd1bGFyLCB3aW5kb3cgKi9cbmFuZ3VsYXIubW9kdWxlKCdpbnNpZGVyLmNvbnRyb2xsZXJzJylcbiAgLmNvbnRyb2xsZXIoJ1NlYXJjaEN0cmwnLCBmdW5jdGlvbiAoJHN0YXRlLCAkc2NvcGUsIFNlYXJjaFNlcnZpY2UpIHtcbiAgICAkc2NvcGUua2V5d29yZCA9IFwiXCI7XG4gICAgJHNjb3BlLnJlc3VsdHMgPSBbXTtcbiAgICAkc2NvcGUuc2VhcmNoID0gZnVuY3Rpb24gKCkge1xuICAgICAgU2VhcmNoU2VydmljZS5zZWFyY2goJHNjb3BlLmtleXdvcmQpLnRoZW4oZnVuY3Rpb24gKHJlc3ApIHtcbiAgICAgICAgJHNjb3BlLnJlc3VsdHMgPSByZXNwLmRhdGE7XG4gICAgICB9KTtcbiAgICB9O1xuXG4gICAgJHNjb3BlLm9wZW5SZXN1bHQgPSBmdW5jdGlvbiAocmVzdWx0KSB7XG4gICAgICB2YXIgd2hlcmUgPSAocmVzdWx0WzFdID09PSAnSW5zaWRlcicpID8gJ2FwcC5pbnNpZGVyJyA6ICdhcHAuY29tcGFueSc7XG4gICAgICAkc3RhdGUuZ28od2hlcmUsIHtcbiAgICAgICAgaWQ6IHJlc3VsdFswXVxuICAgICAgfSk7XG4gICAgfTtcbiAgICAkc2NvcGUuc2VhcmNoKCk7XG4gIH0pO1xuIiwiLypnbG9iYWxzIGFuZ3VsYXIgKi9cbmFuZ3VsYXIubW9kdWxlKCdpbnNpZGVyLmNvbnRyb2xsZXJzJylcbiAgLmNvbnRyb2xsZXIoJ1NldHRpbmdzQ3RybCcsIGZ1bmN0aW9uICgkdGltZW91dCwgJHNjb3BlLCBBdXRoU2VydmljZSwgU2V0dGluZ3NTZXJ2aWNlKSB7XG4gICAgJHNjb3BlLnVzZXIgPSBBdXRoU2VydmljZS5jdXJyZW50VXNlcigpO1xuXG4gICAgJHNjb3BlLnRvZ2dsZVNldHRpbmcgPSBmdW5jdGlvbiAoa2V5KSB7XG4gICAgICBTZXR0aW5nc1NlcnZpY2UudG9nZ2xlU2V0dGluZyhrZXkpXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAkdGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkc2NvcGUuJGFwcGx5KCk7XG4gICAgICAgICAgfSwgMTAwKTtcbiAgICAgICAgfSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgIGNvbnNvbGUubG9nKFwic29tZXRoaWduIHdlbnQgd3Jvbmcgd2hlbiBzZXR0aW5nOiBcIiArIGtleSk7XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICAkc2NvcGUuJG9uKCdhdXRoY2hhbmdlJywgZnVuY3Rpb24gKCkge1xuICAgICAgaWYoJHNjb3BlLmxvZ2dlZEluKCkpIHtcbiAgICAgICAgJHNjb3BlLnVzZXIgPSBBdXRoU2VydmljZS5jdXJyZW50VXNlcigpO1xuICAgICAgICAkc2NvcGUuJGFwcGx5KCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAkc2NvcGUubG9naW4oKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfSk7XG4iLCIvKmdsb2JhbHMgYW5ndWxhciwgd2luZG93ICovXG5hbmd1bGFyLm1vZHVsZSgnaW5zaWRlci5jb250cm9sbGVycycpXG4gLmNvbnRyb2xsZXIoJ1RvZGF5c0J1eXNDdHJsJywgZnVuY3Rpb24gKCRjYWNoZUZhY3RvcnksICRzdGF0ZSwgJHNjb3BlLCBsb2MsIEJ1eUlkZWFTZXJ2aWNlKSB7XG4gICAgJHNjb3BlLnRyYWRlcyA9IFtdO1xuXG4gICAgdmFyIGxvYWRSZW1vdGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAkc2NvcGUucmV0cnlXaXRoUHJvbWlzZVB1bGxUb1JlZnJlc2goQnV5SWRlYVNlcnZpY2UuZmluZFRvZGF5cywgW10sIDMsIHRoaXMpXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uICh0cmFkZXMpIHtcbiAgICAgICAgICAkc2NvcGUudHJhZGVzID0gdHJhZGVzO1xuICAgICAgICB9LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coXCJzYWQgZmFjZVwiKTtcbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICBsb2FkUmVtb3RlKCk7XG5cbiAgICAkc2NvcGUucmVmcmVzaCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciBjYWNoZSA9ICRjYWNoZUZhY3RvcnkuZ2V0KCckaHR0cCcpO1xuICAgICAgY2FjaGUucmVtb3ZlKGxvYy5hcGlCYXNlICsgJy9hcGkvdjEvYnV5cy5qc29uP3RvZGF5PXRydWUnKTtcbiAgICAgIGxvYWRSZW1vdGUoKTtcbiAgICB9O1xuXG4gICAgJHNjb3BlLnNob3dUcmFkZSA9IGZ1bmN0aW9uIChpZCkge1xuICAgICAgJHN0YXRlLmdvKCdhcHAudHJhZGUnLCB7XG4gICAgICAgIGlkOiBpZFxuICAgICAgfSk7XG4gICAgfTtcblxuICAgICRzY29wZS4kb24oJ2F1dGhjaGFuZ2UnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAkc2NvcGUucmVmcmVzaCgpO1xuICAgIH0pO1xuICB9KTtcblxuIiwiLypnbG9iYWxzIGFuZ3VsYXIsIHdpbmRvdywgZG9jdW1lbnQgKi9cbmFuZ3VsYXIubW9kdWxlKCdpbnNpZGVyLmNvbnRyb2xsZXJzJylcbiAgLmNvbnRyb2xsZXIoJ1RyYWRlQ3RybCcsIGZ1bmN0aW9uICgkc2NvcGUsICRzdGF0ZVBhcmFtcywgQnV5SWRlYVNlcnZpY2UpIHtcbiAgICAkc2NvcGUubmF2aWdhdGVUbyA9IGZ1bmN0aW9uICh1cmwpIHtcbiAgICAgIHdpbmRvdy5vcGVuKHVybCwgJ19ibGFuaycsICdsb2NhdGlvbj15ZXMnKTtcbiAgICB9O1xuXG4gICAgJHNjb3BlLnJlZnJlc2ggPSBmdW5jdGlvbiAoKSB7XG4gICAgICAkc2NvcGUucmV0cnlXaXRoUHJvbWlzZShCdXlJZGVhU2VydmljZS5maW5kQnlJZCwgWyRzdGF0ZVBhcmFtcy5pZF0sIDMsIHRoaXMpXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uICh0cmFkZSkge1xuICAgICAgICAgICRzY29wZS50cmFkZSA9IHRyYWRlO1xuICAgICAgICB9LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coXCJzYWQgZmFjZVwiKTtcbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICAkc2NvcGUucmVmcmVzaCgpO1xuICB9KTtcbiIsIi8qZ2xvYmFscyBhbmd1bGFyLCB3aW5kb3csIGRvY3VtZW50ICovXG4gYW5ndWxhci5tb2R1bGUoJ2luc2lkZXIuY29udHJvbGxlcnMnKVxuICAuY29udHJvbGxlcignVXBncmFkZUN0cmwnLCBmdW5jdGlvbiAoJHNjb3BlLCAkaW9uaWNNb2RhbCwgJGlvbmljUG9wdXAsICRyb290U2NvcGUsIEF1dGhTZXJ2aWNlKSB7XG4gICAgJHNjb3BlLnVzZXJEYXRhID0ge307XG5cbiAgICAkaW9uaWNNb2RhbC5mcm9tVGVtcGxhdGVVcmwoJ3RlbXBsYXRlcy9yZWdpc3Rlci5odG1sJywge1xuICAgICAgc2NvcGU6ICRzY29wZVxuICAgIH0pLnRoZW4oZnVuY3Rpb24gKG1vZGFsKSB7XG4gICAgICAkc2NvcGUucmVnaXN0ZXJNb2RhbCA9IG1vZGFsO1xuICAgIH0pO1xuXG4gICAgJHNjb3BlLmNsb3NlUmVnaXN0ZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAkc2NvcGUucmVnaXN0ZXJNb2RhbC5oaWRlKCk7XG4gICAgfTtcblxuICAgICRzY29wZS5yZWdpc3RlciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICRzY29wZS5yZWdpc3Rlck1vZGFsLnNob3coKTtcbiAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd1c2VyLWVtYWlsJykuZm9jdXMoKTtcbiAgICB9O1xuXG4gICAgJHNjb3BlLmRvUmVnaXN0ZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICBBdXRoU2VydmljZS5kb1JlZ2lzdGVyKCRzY29wZS51c2VyRGF0YSwgJHJvb3RTY29wZS5kZXZpY2VUb2tlbilcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdCgnYXV0aGNoYW5nZScpO1xuICAgICAgICAgICRzY29wZS5jbG9zZVJlZ2lzdGVyKCk7XG4gICAgICAgICAgd2luZG93LnN0b3Jla2l0LnB1cmNoYXNlKFwiY29tLmluc2lkZXJhaS5pb3MuYmFzaWMxXCIsIDEpO1xuICAgICAgICB9LCBmdW5jdGlvbiAoZGF0YSkge1xuICAgICAgICAgIGlmIChkYXRhLm1lc3NhZ2UpIHtcbiAgICAgICAgICAgIHdpbmRvdy5hbGVydChkYXRhLm1lc3NhZ2UpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB3aW5kb3cuYWxlcnQoXCJTb21ldGhpbmcgd2VudCB3cm9uZyB3aXRoIHlvdXIgbG9naW4uIFRyeSBhZ2Fpbi5cIik7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgJHNjb3BlLnVwZ3JhZGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAkc2NvcGUucmVnaXN0ZXIoKTtcbiAgICB9O1xuICAgIHJldHVybjtcbiAgfSk7XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
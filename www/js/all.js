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
    function url(id) {
      if(id) {
        return loc.apiBase + '/api/v1/comments/' + id + '.json';
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

      removeComment: function (id) {
        return $http.delete(url(id));
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
        $http.get(url()).then(function (resp) {
          deferred.resolve(resp.data);
        }, function (resp) {
          deferred.reject(resp.data);
        });
        return deferred.promise;
      },

      findById: function (id) {
        var deferred = $q.defer();
        $http.get(url(id)).then(function (resp) {
          deferred.resolve(resp.data);
        }, function (resp) {
          deferred.reject(resp.data);
        });
        return deferred.promise;
      },

      findTodays: function () {
        var deferred = $q.defer();
        $http.get(url(), { params: { 'today': true } }).then(function (resp) {
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
        return $http.get(url(keyword));
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

/*globals angular, window */
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
  });

/*globals angular, window */
 angular.module('insider.controllers')
  .controller('BuysCtrl', function ($state, $scope, BuyIdeaService) {
    $scope.refresh = function () {
      $scope.retryWithPromise(BuyIdeaService.findAll, [], 3, this)
        .then(function (trades) {
          $scope.trades = trades;
        }, function () {
          // TODO: show no trades found thing
          $scope.trades = [];
        });
    };

    $scope.refresh();

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
 .controller('TodaysBuysCtrl', function ($state, $scope, BuyIdeaService) {
    $scope.trades = [];

    $scope.refresh = function () {
      $scope.retryWithPromise(BuyIdeaService.findTodays, [], 3, this)
        .then(function (trades) {
          $scope.trades = trades;
        }, function () {
          console.log("sad face");
        });
    };

    $scope.refresh();

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
  .controller('TradeCtrl', function ($timeout, $ionicPopup, $scope, $stateParams, BuyIdeaService, CommentService, AuthService) {
    $scope.commentData = {};
    $scope.showCommentBox = false;

    $scope.navigateTo = function (url) {
      window.open(url, '_blank', 'location=yes');
    };

    $scope.focusOnCommentBody = function () {
      $timeout(function () {
        document.getElementById('comment-body').focus();
      }, 150);
    };

    $scope.fetchAttempts = 0;
    $scope.refresh = function () {
      $scope.retryWithPromise(BuyIdeaService.findById, [$stateParams.id], 3, this)
        .then(function (trade) {
          $scope.trade = trade;
        }, function () {
          console.log("sad face");
        });
    };

    $scope.refresh();

    $scope.userIsAuthorOf = function (comment) {
      return comment.author_email === AuthService.currentUser().email;
    };

    $scope.addComment = function () {
      $scope.commentData.idea_id = $scope.trade.id;
      CommentService.addComment($scope.commentData).then(function (comment) {
        $scope.trade.comments.unshift(comment);
        $scope.commentData = {};
      }, function (data) {
        if (data.status === 401) {
          $scope.showCommentBox = true;
          $scope.login();
        }
      });
    };

    $scope.removeComment = function (comment) {
      if (!$scope.userIsAuthorOf(comment)) {
        return;
      }
      var myPopup = $ionicPopup.show({
        template: '',
        title: 'Are you sure you want to delete your comment?',
        subTitle: '',
        scope: $scope,
        buttons: [{
          text: 'Cancel'
        }, {
          text: '<b>Delete</b>',
          type: 'button-assertive',
          onTap: function () {
            CommentService.removeComment(comment.id).then(function () {
              var commentIndex = $scope.trade.comments.indexOf(comment);
              $scope.trade.comments.splice(commentIndex, 1);
              myPopup.close();
            });
            return "test";
          }
        }, ]
      });
      $timeout(function () {
        myPopup.close(); //close the popup after 3 seconds for some reason
      }, 3000);
    };
  });

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImZpbHRlcnMuanMiLCJhdXRoX3NlcnZpY2UuanMiLCJjb21tZW50X3Nlcml2Y2UuanMiLCJjb21wYW55X3NlcnZpY2UuanMiLCJmb3JtNF9zZXJ2aWNlLmpzIiwiaWRlYV9zZXJ2aWNlLmpzIiwiaW5zaWRlcl9zZXJ2aWNlLmpzIiwic2VhcmNoX3Nlcml2Y2UuanMiLCJzZXR0aW5nc19zZXJ2aWNlLmpzIiwiYXBwX2NvbnRyb2xsZXIuanMiLCJidXlzX2NvbnRyb2xsZXIuanMiLCJjb21wYW55X2NvbnRyb2xsZXIuanMiLCJmb3JtNF9jb250cm9sbGVyLmpzIiwiaW5zaWRlcl9jb250cm9sbGVyLmpzIiwic2VhcmNoX2NvbnRyb2xsZXIuanMiLCJzZXR0aW5nc19jb250cm9sbGVyLmpzIiwidG9kYXlzX2J1eXNfY29udHJvbGxlci5qcyIsInRyYWRlX2NvbnRyb2xsZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMvSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNyRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDMUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMxQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDdEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNiQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNoQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDdkVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN6QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzVCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2xCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN6QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMzQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImFsbC5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qZ2xvYmFsIHdpbmRvdywgY29yZG92YSwgYW5ndWxhciAqL1xudmFyIGFwcCA9IGFuZ3VsYXIubW9kdWxlKCdpbnNpZGVyJywgW1xuICAgICdpb25pYycsXG4gICAgJ2luc2lkZXIuc2VydmljZXMnLFxuICAgICdpbnNpZGVyLmNvbnRyb2xsZXJzJyxcbiAgICAnaW5zaWRlci5maWx0ZXJzJyxcbiAgICAnbmdDb3Jkb3ZhJ1xuICBdKVxuICAuY29uc3RhbnQoJ2xvYycsIHtcbiAgICAvL2FwaUJhc2U6ICdodHRwOi8vbG9jYWxob3N0OjMwMDAnXG4gICAgYXBpQmFzZTogJ2h0dHBzOi8vaW5zaWRlcmFpLmNvbSdcbiAgfSlcbiAgLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIsICR1cmxSb3V0ZXJQcm92aWRlcikge1xuICAgICRzdGF0ZVByb3ZpZGVyXG4gICAgICAuc3RhdGUoJ2FwcCcsIHtcbiAgICAgICAgdXJsOiAnL2FwcCcsXG4gICAgICAgIGFic3RyYWN0OiB0cnVlLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ3RlbXBsYXRlcy9tZW51Lmh0bWwnLFxuICAgICAgICBjb250cm9sbGVyOiAnQXBwQ3RybCdcbiAgICAgIH0pXG4gICAgICAuc3RhdGUoJ2FwcC5idXlzJywge1xuICAgICAgICB1cmw6ICcvYnV5cycsXG4gICAgICAgIHZpZXdzOiB7XG4gICAgICAgICAgJ21lbnVDb250ZW50Jzoge1xuICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICd0ZW1wbGF0ZXMvYnV5cy5odG1sJyxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdCdXlzQ3RybCdcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgICAuc3RhdGUoJ2FwcC50b2RheScsIHtcbiAgICAgICAgdXJsOiAnL3RvZGF5JyxcbiAgICAgICAgdmlld3M6IHtcbiAgICAgICAgICAnbWVudUNvbnRlbnQnOiB7XG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogJ3RlbXBsYXRlcy90b2RheS5odG1sJyxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdUb2RheXNCdXlzQ3RybCdcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgICAuc3RhdGUoJ2FwcC50cmFkZScsIHtcbiAgICAgICAgdXJsOiAnL3RyYWRlcy86aWQnLFxuICAgICAgICB2aWV3czoge1xuICAgICAgICAgICdtZW51Q29udGVudCc6IHtcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAndGVtcGxhdGVzL3RyYWRlLmh0bWwnLFxuICAgICAgICAgICAgY29udHJvbGxlcjogJ1RyYWRlQ3RybCdcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgICAuc3RhdGUoJ2FwcC5pbnNpZGVyJywge1xuICAgICAgICB1cmw6ICcvaW5zaWRlcnMvOmlkJyxcbiAgICAgICAgdmlld3M6IHtcbiAgICAgICAgICAnbWVudUNvbnRlbnQnOiB7XG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogJ3RlbXBsYXRlcy9pbnNpZGVyLmh0bWwnLFxuICAgICAgICAgICAgY29udHJvbGxlcjogJ0luc2lkZXJDdHJsJ1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSlcbiAgICAgIC5zdGF0ZSgnYXBwLmZvcm00Jywge1xuICAgICAgICB1cmw6ICcvZm9ybTRzLzppZCcsXG4gICAgICAgIHZpZXdzOiB7XG4gICAgICAgICAgJ21lbnVDb250ZW50Jzoge1xuICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICd0ZW1wbGF0ZXMvZm9ybTQuaHRtbCcsXG4gICAgICAgICAgICBjb250cm9sbGVyOiAnRm9ybTRDdHJsJ1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSlcbiAgICAgIC5zdGF0ZSgnYXBwLmNvbXBhbnknLCB7XG4gICAgICAgIHVybDogJy9jb21wYW5pZXMvOmlkJyxcbiAgICAgICAgdmlld3M6IHtcbiAgICAgICAgICAnbWVudUNvbnRlbnQnOiB7XG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogJ3RlbXBsYXRlcy9jb21wYW55Lmh0bWwnLFxuICAgICAgICAgICAgY29udHJvbGxlcjogJ0NvbXBhbnlDdHJsJ1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSlcbiAgICAgIC5zdGF0ZSgnYXBwLnNlYXJjaCcsIHtcbiAgICAgICAgdXJsOiAnL3NlYXJjaCcsXG4gICAgICAgIHZpZXdzOiB7XG4gICAgICAgICAgJ21lbnVDb250ZW50Jzoge1xuICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICd0ZW1wbGF0ZXMvc2VhcmNoLmh0bWwnLFxuICAgICAgICAgICAgY29udHJvbGxlcjogJ1NlYXJjaEN0cmwnXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KVxuICAgICAgLnN0YXRlKCdhcHAuc2V0dGluZ3MnLCB7XG4gICAgICAgIHVybDogJy9zZXR0aW5ncycsXG4gICAgICAgIHZpZXdzOiB7XG4gICAgICAgICAgJ21lbnVDb250ZW50Jzoge1xuICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICd0ZW1wbGF0ZXMvc2V0dGluZ3MuaHRtbCcsXG4gICAgICAgICAgICBjb250cm9sbGVyOiAnU2V0dGluZ3NDdHJsJ1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgLy8gaWYgbm9uZSBvZiB0aGUgYWJvdmUgc3RhdGVzIGFyZSBtYXRjaGVkLCB1c2UgdGhpcyBhcyB0aGUgZmFsbGJhY2tcbiAgICAkdXJsUm91dGVyUHJvdmlkZXIub3RoZXJ3aXNlKCcvYXBwL2J1eXMnKTtcbiAgfSlcbiAgLnJ1bihmdW5jdGlvbiAoJHN0YXRlLCAkaW9uaWNQbGF0Zm9ybSwgJGNvcmRvdmFQdXNoLCAkcm9vdFNjb3BlLCBBdXRoU2VydmljZSkge1xuICAgIEF1dGhTZXJ2aWNlLnZhbGlkYXRlVXNlcigpO1xuXG4gICAgJGlvbmljUGxhdGZvcm0ucmVhZHkoZnVuY3Rpb24gKCkge1xuICAgICAgLy8gSGlkZSB0aGUgYWNjZXNzb3J5IGJhciBieSBkZWZhdWx0IChyZW1vdmUgdGhpcyB0byBzaG93IHRoZSBhY2Nlc3NvcnkgYmFyIGFib3ZlIHRoZSBrZXlib2FyZFxuICAgICAgLy8gZm9yIGZvcm0gaW5wdXRzKVxuICAgICAgaWYgKHdpbmRvdy5jb3Jkb3ZhICYmIHdpbmRvdy5jb3Jkb3ZhLnBsdWdpbnMuS2V5Ym9hcmQpIHtcbiAgICAgICAgY29yZG92YS5wbHVnaW5zLktleWJvYXJkLmhpZGVLZXlib2FyZEFjY2Vzc29yeUJhcih0cnVlKTtcbiAgICAgIH1cbiAgICAgIGlmICh3aW5kb3cuU3RhdHVzQmFyKSB7XG4gICAgICAgIC8vIG9yZy5hcGFjaGUuY29yZG92YS5zdGF0dXNiYXIgcmVxdWlyZWRcbiAgICAgICAgd2luZG93LlN0YXR1c0Jhci5zdHlsZUxpZ2h0Q29udGVudCgpO1xuICAgICAgfVxuXG4gICAgICB2YXIgaW9zQ29uZmlnID0ge1xuICAgICAgICBcImJhZGdlXCI6IFwidHJ1ZVwiLFxuICAgICAgICBcInNvdW5kXCI6IFwidHJ1ZVwiLFxuICAgICAgICBcImFsZXJ0XCI6IFwidHJ1ZVwiLFxuICAgICAgICBcImVjYlwiOiBcIm9uTm90aWZpY2F0aW9uQVBOXCJcbiAgICAgIH07XG5cbiAgICAgIGlmICh3aW5kb3cuY29yZG92YSkge1xuICAgICAgICAkY29yZG92YVB1c2gucmVnaXN0ZXIoaW9zQ29uZmlnKS50aGVuKGZ1bmN0aW9uIChyZXN1bHQpIHtcbiAgICAgICAgICAkcm9vdFNjb3BlLmRldmljZVRva2VuID0gcmVzdWx0O1xuICAgICAgICB9LCBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coXCJub3QgYWJsZSB0byBzZW5kIHB1c2hcIiwgZXJyKTtcbiAgICAgICAgfSk7XG4gICAgICAgIC8vICRjb3Jkb3ZhUHVzaC51bnJlZ2lzdGVyKG9wdGlvbnMpLnRoZW4oZnVuY3Rpb24ocmVzdWx0KSB7XG4gICAgICAgIC8vICAgYWxlcnQoXCJ1bnJlZ2lzdGVyXCIpO1xuICAgICAgICAvLyAgIGFsZXJ0KHJlc3VsdCk7XG4gICAgICAgIC8vICAgYWxlcnQoYXJndW1lbnRzKTtcbiAgICAgICAgLy8gICAgIC8vIFN1Y2Nlc3MhXG4gICAgICAgIC8vIH0sIGZ1bmN0aW9uKGVycikge1xuICAgICAgICAvLyAgIGFsZXJ0KFwiZXJyb3JcIik7XG4gICAgICAgIC8vICAgYWxlcnQoZXJyKTtcbiAgICAgICAgLy8gICAgIC8vIEFuIGVycm9yIG9jY3VyZWQuIFNob3cgYSBtZXNzYWdlIHRvIHRoZSB1c2VyXG4gICAgICAgIC8vIH0pO1xuICAgICAgICAvL1xuICAgICAgICAvLyAvLyBpT1Mgb25seVxuXG4gICAgICAgIHdpbmRvdy5vbk5vdGlmaWNhdGlvbkFQTiA9IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICBjb25zb2xlLmxvZygnb24gbm90aWZpY2F0aW9uOicsIGUpO1xuICAgICAgICAgIGlmIChlLmFsZXJ0KSB7XG4gICAgICAgICAgICAkc3RhdGUuZ28oJ2FwcC50cmFkZScsIHtcbiAgICAgICAgICAgICAgaWQ6IGUuaWRlYV9pZFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKGUuc291bmQpIHtcbiAgICAgICAgICAgIHZhciBzbmQgPSBuZXcgTWVkaWEoZS5zb3VuZCk7XG4gICAgICAgICAgICBzbmQucGxheSgpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChlLmJhZGdlKSB7XG4gICAgICAgICAgICAkY29yZG92YVB1c2guc2V0QmFkZ2VOdW1iZXIoZS5iYWRnZSkudGhlbihmdW5jdGlvbiAocmVzdWx0KSB7XG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKHJlc3VsdCk7XG4gICAgICAgICAgICB9LCBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKGVycik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICB9XG4gICAgfSk7XG4gIH0pO1xuIiwiLypnbG9iYWxzIGFuZ3VsYXIsIG1kNSAqL1xuYW5ndWxhci5tb2R1bGUoJ2luc2lkZXIuZmlsdGVycycsIFtdKVxuICAuZmlsdGVyKCdncmF2YXRhcicsIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKGVtYWlsKSB7XG4gICAgICByZXR1cm4gXCJodHRwOi8vd3d3LmdyYXZhdGFyLmNvbS9hdmF0YXIvXCIgKyBtZDUoZW1haWwpO1xuICAgIH07XG4gIH0pO1xuIiwiLypnbG9iYWxzIHdpbmRvdywgYW5ndWxhciwgXyAqL1xuYW5ndWxhci5tb2R1bGUoJ2luc2lkZXIuc2VydmljZXMnLCBbXSlcbiAgLmZhY3RvcnkoJ0F1dGhTZXJ2aWNlJywgZnVuY3Rpb24gKGxvYywgJHEsICRodHRwKSB7XG4gICAgdmFyIHVzZXIgPSBudWxsO1xuXG4gICAgdmFyIHJlYWRTdG9yZWRVc2VyID0gZnVuY3Rpb24gKCkge1xuICAgICAgdmFyIHN0b3JlZFVzZXIgPSB3aW5kb3cubG9jYWxTdG9yYWdlLmdldEl0ZW0oJ3VzZXInKTtcbiAgICAgIHRyeSB7XG4gICAgICAgIGlmIChzdG9yZWRVc2VyKSB7XG4gICAgICAgICAgdXNlciA9IEpTT04ucGFyc2Uoc3RvcmVkVXNlcik7XG4gICAgICAgICAgJGh0dHAuZGVmYXVsdHMuaGVhZGVycy5jb21tb25bJ0F1dGgtVG9rZW4tWCddID0gdXNlci5hdXRoX3Rva2VuO1xuICAgICAgICB9XG4gICAgICB9IGNhdGNoIChpZ25vcmUpIHsgLyogZmFpbCBzaWxlbnRseSovIH1cbiAgICB9O1xuXG4gICAgcmVhZFN0b3JlZFVzZXIoKTtcblxuICAgIHZhciBjdXJyZW50VXNlciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIGlmICghdXNlcikge1xuICAgICAgICB1c2VyID0gcmVhZFN0b3JlZFVzZXIoKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB1c2VyO1xuICAgIH07XG5cbiAgICB2YXIgc2F2ZVVzZXIgPSBmdW5jdGlvbiAodXNlclRvU2F2ZSkge1xuICAgICAgdXNlciA9IHVzZXJUb1NhdmU7XG4gICAgICB3aW5kb3cubG9jYWxTdG9yYWdlLnNldEl0ZW0oJ3VzZXInLCBKU09OLnN0cmluZ2lmeSh1c2VyKSk7XG4gICAgICAkaHR0cC5kZWZhdWx0cy5oZWFkZXJzLmNvbW1vblsnQXV0aC1Ub2tlbi1YJ10gPSB1c2VyLmF1dGhfdG9rZW47XG4gICAgfTtcblxuICAgIHZhciBjbGVhclVzZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICB3aW5kb3cubG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oJ3VzZXInKTtcbiAgICAgICRodHRwLmRlZmF1bHRzLmhlYWRlcnMuY29tbW9uWydBdXRoLVRva2VuLVgnXSA9IHVuZGVmaW5lZDtcbiAgICAgIHVzZXIgPSBudWxsO1xuICAgIH07XG5cbiAgICB2YXIgbG9nZ2VkSW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4gISFjdXJyZW50VXNlcigpO1xuICAgIH07XG5cbiAgICB2YXIgZG9Mb2dpbiA9IGZ1bmN0aW9uICh1c2VyUGFyYW1zLCBkZXZpY2VUb2tlbikge1xuICAgICAgdmFyIHBhcmFtcyA9IHtcbiAgICAgICAgdXNlcjogdXNlclBhcmFtcyxcbiAgICAgICAgZGV2aWNlOiB7XG4gICAgICAgICAgcGxhdGZvcm06ICdpb3MnLFxuICAgICAgICAgIHRva2VuOiBkZXZpY2VUb2tlblxuICAgICAgICB9XG4gICAgICB9O1xuXG4gICAgICB2YXIgZGVmZXJyZWQgPSAkcS5kZWZlcigpO1xuXG4gICAgICAkaHR0cC5wb3N0KGxvYy5hcGlCYXNlICsgJy9hcGkvdjEvdXNlcnMvc2lnbl9pbi5qc29uJywgcGFyYW1zKVxuICAgICAgICAudGhlbihmdW5jdGlvbiAocmVzcCkge1xuICAgICAgICAgIHNhdmVVc2VyKHJlc3AuZGF0YS51c2VyKTtcbiAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKHJlc3AuZGF0YSk7XG4gICAgICAgIH0sIGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICAgICAgZGVmZXJyZWQucmVqZWN0KGRhdGEpO1xuICAgICAgICB9KTtcblxuICAgICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG4gICAgfTtcblxuICAgIHZhciBkb0xvZ291dCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIGNsZWFyVXNlcigpO1xuICAgICAgcmV0dXJuICRodHRwLmRlbGV0ZShsb2MuYXBpQmFzZSArICcvYXBpL3YxL3VzZXJzL3NpZ25fb3V0Lmpzb24nKTtcbiAgICB9O1xuXG4gICAgdmFyIHZhbGlkYXRlVXNlciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICRodHRwLmdldChsb2MuYXBpQmFzZSArICcvYXBpL3YxL3Nlc3Npb25zL3ZhbGlkYXRlLmpzb24nKVxuICAgICAgICAudGhlbihmdW5jdGlvbiAocmVzcCkge1xuICAgICAgICAgIHNhdmVVc2VyKHJlc3AuZGF0YS51c2VyKTtcbiAgICAgICAgfSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgIGNsZWFyVXNlcigpO1xuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIGRvTG9naW46IGRvTG9naW4sXG4gICAgICBkb0xvZ291dDogZG9Mb2dvdXQsXG4gICAgICBsb2dnZWRJbjogbG9nZ2VkSW4sXG4gICAgICBjdXJyZW50VXNlcjogY3VycmVudFVzZXIsXG4gICAgICB2YWxpZGF0ZVVzZXI6IHZhbGlkYXRlVXNlcixcbiAgICAgIHNhdmVVc2VyOiBzYXZlVXNlclxuICAgIH07XG4gIH0pO1xuIiwiLypnbG9iYWxzIGFuZ3VsYXIsIF8gKi9cbmFuZ3VsYXIubW9kdWxlKCdpbnNpZGVyLnNlcnZpY2VzJylcbiAgLmZhY3RvcnkoJ0NvbW1lbnRTZXJ2aWNlJywgZnVuY3Rpb24obG9jLCAkcSwgJGh0dHApIHtcbiAgICBmdW5jdGlvbiB1cmwoaWQpIHtcbiAgICAgIGlmKGlkKSB7XG4gICAgICAgIHJldHVybiBsb2MuYXBpQmFzZSArICcvYXBpL3YxL2NvbW1lbnRzLycgKyBpZCArICcuanNvbic7XG4gICAgICB9XG4gICAgICByZXR1cm4gbG9jLmFwaUJhc2UgKyAnL2FwaS92MS9jb21tZW50cy5qc29uJztcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgYWRkQ29tbWVudDogZnVuY3Rpb24gKHBhcmFtcykge1xuICAgICAgICB2YXIgZGVmZXJyZWQgPSAkcS5kZWZlcigpO1xuICAgICAgICAkaHR0cC5wb3N0KHVybCgpLCBwYXJhbXMpLnRoZW4oZnVuY3Rpb24gKHJlc3ApIHtcbiAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKHJlc3AuZGF0YSk7XG4gICAgICAgIH0sIGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICAgICAgZGVmZXJyZWQucmVqZWN0KGRhdGEpO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG4gICAgICB9LFxuXG4gICAgICByZW1vdmVDb21tZW50OiBmdW5jdGlvbiAoaWQpIHtcbiAgICAgICAgcmV0dXJuICRodHRwLmRlbGV0ZSh1cmwoaWQpKTtcbiAgICAgIH1cbiAgICB9O1xuICB9KTtcbiIsIi8qZ2xvYmFscyBhbmd1bGFyLCBfICovXG5hbmd1bGFyLm1vZHVsZSgnaW5zaWRlci5zZXJ2aWNlcycpXG4gIC5mYWN0b3J5KCdDb21wYW55U2VydmljZScsIGZ1bmN0aW9uKGxvYywgJHEsICRodHRwKSB7XG4gICAgZnVuY3Rpb24gdXJsKGlkKSB7XG4gICAgIGlmKGlkKSB7XG4gICAgICAgIHJldHVybiBsb2MuYXBpQmFzZSArICcvYXBpL3YxL2NvbXBhbmllcy8nICsgaWQgKyAnLmpzb24nO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGxvYy5hcGlCYXNlICsgJy9hcGkvdjEvY29tcGFuaWVzLmpzb24nO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICBmaW5kQnlJZDogZnVuY3Rpb24gKGlkKSB7XG4gICAgICAgIHZhciBkZWZlcnJlZCA9ICRxLmRlZmVyKCk7XG4gICAgICAgICRodHRwLmdldCh1cmwoaWQpKS50aGVuKGZ1bmN0aW9uIChyZXNwKSB7XG4gICAgICAgICAgZGVmZXJyZWQucmVzb2x2ZShyZXNwLmRhdGEpO1xuICAgICAgICB9LCBmdW5jdGlvbiAocmVzcCkge1xuICAgICAgICAgIGRlZmVycmVkLnJlamVjdChyZXNwLmRhdGEpO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG4gICAgICB9LFxuICAgIH07XG4gIH0pO1xuXG4iLCIvKmdsb2JhbHMgYW5ndWxhciwgXyAqL1xuYW5ndWxhci5tb2R1bGUoJ2luc2lkZXIuc2VydmljZXMnKVxuICAuZmFjdG9yeSgnRm9ybTRTZXJ2aWNlJywgZnVuY3Rpb24obG9jLCAkcSwgJGh0dHApIHtcbiAgICBmdW5jdGlvbiB1cmwoaWQpIHtcbiAgICAgaWYoaWQpIHtcbiAgICAgICAgcmV0dXJuIGxvYy5hcGlCYXNlICsgJy9hcGkvdjEvZm9ybTRzLycgKyBpZCArICcuanNvbic7XG4gICAgICB9XG4gICAgICByZXR1cm4gbG9jLmFwaUJhc2UgKyAnL2FwaS92MS9mb3JtNHMuanNvbic7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIGZpbmRCeUlkOiBmdW5jdGlvbiAoaWQpIHtcbiAgICAgICAgdmFyIGRlZmVycmVkID0gJHEuZGVmZXIoKTtcbiAgICAgICAgJGh0dHAuZ2V0KHVybChpZCkpLnRoZW4oZnVuY3Rpb24gKHJlc3ApIHtcbiAgICAgICAgICB2YXIgZmlsaW5nID0gcmVzcC5kYXRhO1xuICAgICAgICAgIHZhciBkb2MgPSBKU09OLnBhcnNlKHJlc3AuZGF0YS5maWxpbmcpO1xuICAgICAgICAgIGZpbGluZy5ub25EZXJpdmF0aXZlVHJhbnNhY3Rpb25zID0gZG9jLnRyYW5zYWN0aW9ucztcbiAgICAgICAgICBmaWxpbmcuZGVyaXZhdGl2ZVRyYW5zYWN0aW9ucyA9IGRvYy5kZXJpdmF0aXZlX3RyYW5zYWN0aW9ucztcbiAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKGZpbGluZyk7XG4gICAgICAgIH0sIGZ1bmN0aW9uIChyZXNwKSB7XG4gICAgICAgICAgZGVmZXJyZWQucmVqZWN0KHJlc3AuZGF0YSk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbiAgICAgIH0sXG4gICAgfTtcbiAgfSk7XG4iLCIvKmdsb2JhbHMgYW5ndWxhciwgXyAqL1xuYW5ndWxhci5tb2R1bGUoJ2luc2lkZXIuc2VydmljZXMnKVxuICAuZmFjdG9yeSgnQnV5SWRlYVNlcnZpY2UnLCBmdW5jdGlvbihsb2MsICRxLCAkaHR0cCkge1xuICAgIGZ1bmN0aW9uIHVybChpZCkge1xuICAgICAgaWYoaWQpIHtcbiAgICAgICAgcmV0dXJuIGxvYy5hcGlCYXNlICsgJy9hcGkvdjEvYnV5cy8nICsgaWQgKyAnLmpzb24nO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGxvYy5hcGlCYXNlICsgJy9hcGkvdjEvYnV5cy5qc29uJztcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgZmluZEFsbDogZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgZGVmZXJyZWQgPSAkcS5kZWZlcigpO1xuICAgICAgICAkaHR0cC5nZXQodXJsKCkpLnRoZW4oZnVuY3Rpb24gKHJlc3ApIHtcbiAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKHJlc3AuZGF0YSk7XG4gICAgICAgIH0sIGZ1bmN0aW9uIChyZXNwKSB7XG4gICAgICAgICAgZGVmZXJyZWQucmVqZWN0KHJlc3AuZGF0YSk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbiAgICAgIH0sXG5cbiAgICAgIGZpbmRCeUlkOiBmdW5jdGlvbiAoaWQpIHtcbiAgICAgICAgdmFyIGRlZmVycmVkID0gJHEuZGVmZXIoKTtcbiAgICAgICAgJGh0dHAuZ2V0KHVybChpZCkpLnRoZW4oZnVuY3Rpb24gKHJlc3ApIHtcbiAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKHJlc3AuZGF0YSk7XG4gICAgICAgIH0sIGZ1bmN0aW9uIChyZXNwKSB7XG4gICAgICAgICAgZGVmZXJyZWQucmVqZWN0KHJlc3AuZGF0YSk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbiAgICAgIH0sXG5cbiAgICAgIGZpbmRUb2RheXM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGRlZmVycmVkID0gJHEuZGVmZXIoKTtcbiAgICAgICAgJGh0dHAuZ2V0KHVybCgpLCB7IHBhcmFtczogeyAndG9kYXknOiB0cnVlIH0gfSkudGhlbihmdW5jdGlvbiAocmVzcCkge1xuICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUocmVzcC5kYXRhKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xuICAgICAgfVxuICAgIH07XG4gIH0pO1xuIiwiLypnbG9iYWxzIGFuZ3VsYXIsIF8gKi9cbmFuZ3VsYXIubW9kdWxlKCdpbnNpZGVyLnNlcnZpY2VzJylcbiAgLmZhY3RvcnkoJ0luc2lkZXJTZXJ2aWNlJywgZnVuY3Rpb24obG9jLCAkcSwgJGh0dHApIHtcbiAgICBmdW5jdGlvbiB1cmwoaWQpIHtcbiAgICAgaWYoaWQpIHtcbiAgICAgICAgcmV0dXJuIGxvYy5hcGlCYXNlICsgJy9hcGkvdjEvaW5zaWRlcnMvJyArIGlkICsgJy5qc29uJztcbiAgICAgIH1cbiAgICAgIHJldHVybiBsb2MuYXBpQmFzZSArICcvYXBpL3YxL2luc2lkZXJzLmpzb24nO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICBmaW5kQnlJZDogZnVuY3Rpb24gKGlkKSB7XG4gICAgICAgIHZhciBkZWZlcnJlZCA9ICRxLmRlZmVyKCk7XG4gICAgICAgICRodHRwLmdldCh1cmwoaWQpKS50aGVuKGZ1bmN0aW9uIChyZXNwKSB7XG4gICAgICAgICAgZGVmZXJyZWQucmVzb2x2ZShyZXNwLmRhdGEpO1xuICAgICAgICB9LCBmdW5jdGlvbiAocmVzcCkge1xuICAgICAgICAgIGRlZmVycmVkLnJlamVjdChyZXNwLmRhdGEpO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG4gICAgICB9LFxuICAgIH07XG4gIH0pO1xuIiwiLypnbG9iYWxzIGFuZ3VsYXIsIF8gKi9cbmFuZ3VsYXIubW9kdWxlKCdpbnNpZGVyLnNlcnZpY2VzJylcbiAgLmZhY3RvcnkoJ1NlYXJjaFNlcnZpY2UnLCBmdW5jdGlvbihsb2MsICRodHRwKSB7XG4gICAgZnVuY3Rpb24gdXJsKHEpIHtcbiAgICAgIHJldHVybiBsb2MuYXBpQmFzZSArICcvYXBpL3YxL3NlYXJjaD9xPScgKyBxO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICBzZWFyY2g6IGZ1bmN0aW9uIChrZXl3b3JkKSB7XG4gICAgICAgIHJldHVybiAkaHR0cC5nZXQodXJsKGtleXdvcmQpKTtcbiAgICAgIH1cbiAgICB9O1xuICB9KTtcbiIsIi8qZ2xvYmFscyBhbmd1bGFyLCBfICovXG5hbmd1bGFyLm1vZHVsZSgnaW5zaWRlci5zZXJ2aWNlcycpXG4gIC5mYWN0b3J5KCdTZXR0aW5nc1NlcnZpY2UnLCBmdW5jdGlvbigkcSwgJGh0dHAsIEF1dGhTZXJ2aWNlLCBsb2MpIHtcbiAgICBmdW5jdGlvbiB1cmwoKSB7XG4gICAgICByZXR1cm4gbG9jLmFwaUJhc2UgKyAnL2FwaS92MS9zZXR0aW5nJztcbiAgICB9XG5cbiAgICB2YXIgc2V0ID0gZnVuY3Rpb24gKGtleSwgdmFsdWUpIHtcbiAgICAgIHZhciBwYXJhbXMgPSB7fTtcbiAgICAgIHBhcmFtc1trZXldID0gdmFsdWU7XG5cbiAgICAgIHZhciBkZWZlcnJlZCA9ICRxLmRlZmVyKCk7XG4gICAgICAkaHR0cC5wdXQodXJsKCksIHBhcmFtcykudGhlbihmdW5jdGlvbiAocmVzcCkge1xuICAgICAgICBBdXRoU2VydmljZS5zYXZlVXNlcihyZXNwLmRhdGEudXNlcik7XG4gICAgICAgIGRlZmVycmVkLnJlc29sdmUocmVzcC5kYXRhKTtcbiAgICAgIH0sIGZ1bmN0aW9uIChyZXNwKSB7XG4gICAgICAgIGRlZmVycmVkLnJlamVjdChyZXNwLmRhdGEpO1xuICAgICAgfSk7XG5cbiAgICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xuICAgIH07XG5cbiAgICB2YXIgdG9nZ2xlU2V0dGluZyA9IGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgIHZhciBzdGFydCA9IEF1dGhTZXJ2aWNlLmN1cnJlbnRVc2VyKClba2V5XTtcbiAgICAgIHJldHVybiBzZXQoa2V5LCAhc3RhcnQpO1xuICAgIH07XG5cbiAgICByZXR1cm4ge1xuICAgICAgc2V0OiBzZXQsXG4gICAgICB0b2dnbGVTZXR0aW5nOiB0b2dnbGVTZXR0aW5nXG4gICAgfTtcbiAgfSk7XG4iLCIvKmdsb2JhbHMgYW5ndWxhciwgd2luZG93ICovXG5hbmd1bGFyLm1vZHVsZSgnaW5zaWRlci5jb250cm9sbGVycycsIFtdKVxuICAuY29udHJvbGxlcignQXBwQ3RybCcsIGZ1bmN0aW9uICgkdGltZW91dCwgJGlvbmljTG9hZGluZywgJHEsICRzY29wZSwgJGlvbmljTW9kYWwsICRyb290U2NvcGUsIEF1dGhTZXJ2aWNlKSB7XG4gICAgJHNjb3BlLmxvZ2luRGF0YSA9IHt9O1xuXG4gICAgJGlvbmljTW9kYWwuZnJvbVRlbXBsYXRlVXJsKCd0ZW1wbGF0ZXMvbG9naW4uaHRtbCcsIHtcbiAgICAgIHNjb3BlOiAkc2NvcGVcbiAgICB9KS50aGVuKGZ1bmN0aW9uIChtb2RhbCkge1xuICAgICAgJHNjb3BlLm1vZGFsID0gbW9kYWw7XG4gICAgfSk7XG5cbiAgICAkc2NvcGUuY2xvc2VMb2dpbiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICRzY29wZS5tb2RhbC5oaWRlKCk7XG4gICAgfTtcblxuICAgICRzY29wZS5sb2dpbiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICRzY29wZS5tb2RhbC5zaG93KCk7XG4gICAgfTtcblxuICAgICRzY29wZS5sb2dvdXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICBBdXRoU2VydmljZS5kb0xvZ291dCgpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoXCJhdXRoY2hhbmdlXCIpO1xuICAgICAgfSk7XG4gICAgfTtcblxuICAgICRzY29wZS5sb2dnZWRJbiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiBBdXRoU2VydmljZS5sb2dnZWRJbigpO1xuICAgIH07XG5cbiAgICAkc2NvcGUuZG9Mb2dpbiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIEF1dGhTZXJ2aWNlLmRvTG9naW4oJHNjb3BlLmxvZ2luRGF0YSwgJHJvb3RTY29wZS5kZXZpY2VUb2tlbilcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdCgnYXV0aGNoYW5nZScpO1xuICAgICAgICAgICRzY29wZS5jbG9zZUxvZ2luKCk7XG4gICAgICAgIH0sIGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICAgICAgaWYgKGRhdGEubWVzc2FnZSkge1xuICAgICAgICAgICAgd2luZG93LmFsZXJ0KGRhdGEubWVzc2FnZSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHdpbmRvdy5hbGVydChcIlNvbWV0aGluZyB3ZW50IHdyb25nIHdpdGggeW91ciBsb2dpbi4gVHJ5IGFnYWluLlwiKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICAkc2NvcGUucmV0cnlXaXRoUHJvbWlzZSA9IGZ1bmN0aW9uIChwcm9taXNlLCBhcmdzLCBtYXhUcmllcywgY29udGV4dCwgZGVmZXJyZWQpIHtcbiAgICAgIGRlZmVycmVkID0gZGVmZXJyZWQgfHwgJHEuZGVmZXIoKTtcbiAgICAgIGNvbnRleHQgPSBjb250ZXh0IHx8IG51bGw7XG5cbiAgICAgICRzY29wZS5sb2FkaW5nID0gdHJ1ZTtcbiAgICAgICRpb25pY0xvYWRpbmcuc2hvdyh7XG4gICAgICAgIHRlbXBsYXRlOiBcIjxpIGNsYXNzPSdpb24tbG9hZGluZy1kJz48L2k+XCJcbiAgICAgIH0pO1xuXG4gICAgICBwcm9taXNlLmFwcGx5KGNvbnRleHQsIGFyZ3MpXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uIChkKSB7XG4gICAgICAgICAgJHNjb3BlLmxvYWRpbmcgPSBmYWxzZTtcbiAgICAgICAgICAkaW9uaWNMb2FkaW5nLmhpZGUoKTtcbiAgICAgICAgICByZXR1cm4gZGVmZXJyZWQucmVzb2x2ZShkKTtcbiAgICAgICAgfSwgZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgIGlmIChtYXhUcmllcyA9PT0gLTEpIHtcbiAgICAgICAgICAgICRpb25pY0xvYWRpbmcuaGlkZSgpO1xuICAgICAgICAgICAgJHNjb3BlLmxvYWRpbmcgPSBmYWxzZTtcbiAgICAgICAgICAgIHJldHVybiBkZWZlcnJlZC5yZWplY3QoZXJyKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgJHRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICRzY29wZS5yZXRyeVdpdGhQcm9taXNlKHByb21pc2UsIGFyZ3MsIG1heFRyaWVzIC0gMSwgY29udGV4dCwgZGVmZXJyZWQpO1xuICAgICAgICAgICAgfSwgMjAwMCk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xuICAgIH07XG4gIH0pO1xuIiwiLypnbG9iYWxzIGFuZ3VsYXIsIHdpbmRvdyAqL1xuIGFuZ3VsYXIubW9kdWxlKCdpbnNpZGVyLmNvbnRyb2xsZXJzJylcbiAgLmNvbnRyb2xsZXIoJ0J1eXNDdHJsJywgZnVuY3Rpb24gKCRzdGF0ZSwgJHNjb3BlLCBCdXlJZGVhU2VydmljZSkge1xuICAgICRzY29wZS5yZWZyZXNoID0gZnVuY3Rpb24gKCkge1xuICAgICAgJHNjb3BlLnJldHJ5V2l0aFByb21pc2UoQnV5SWRlYVNlcnZpY2UuZmluZEFsbCwgW10sIDMsIHRoaXMpXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uICh0cmFkZXMpIHtcbiAgICAgICAgICAkc2NvcGUudHJhZGVzID0gdHJhZGVzO1xuICAgICAgICB9LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgLy8gVE9ETzogc2hvdyBubyB0cmFkZXMgZm91bmQgdGhpbmdcbiAgICAgICAgICAkc2NvcGUudHJhZGVzID0gW107XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICAkc2NvcGUucmVmcmVzaCgpO1xuXG4gICAgJHNjb3BlLnNob3dUcmFkZSA9IGZ1bmN0aW9uIChpZCkge1xuICAgICAgJHN0YXRlLmdvKCdhcHAudHJhZGUnLCB7XG4gICAgICAgIGlkOiBpZFxuICAgICAgfSk7XG4gICAgfTtcblxuICAgICRzY29wZS4kb24oJ2F1dGhjaGFuZ2UnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAkc2NvcGUucmVmcmVzaCgpO1xuICAgIH0pO1xuICB9KTtcbiIsIi8qZ2xvYmFscyBhbmd1bGFyLCB3aW5kb3cgKi9cbmFuZ3VsYXIubW9kdWxlKCdpbnNpZGVyLmNvbnRyb2xsZXJzJylcbiAgLmNvbnRyb2xsZXIoJ0NvbXBhbnlDdHJsJywgZnVuY3Rpb24gKCRzdGF0ZSwgJHNjb3BlLCAkc3RhdGVQYXJhbXMsIENvbXBhbnlTZXJ2aWNlKSB7XG4gICAgJHNjb3BlLnNob3dUcmFkZXMgPSB0cnVlO1xuXG4gICAgJHNjb3BlLnJlZnJlc2ggPSBmdW5jdGlvbiAoKSB7XG4gICAgICAkc2NvcGUucmV0cnlXaXRoUHJvbWlzZShDb21wYW55U2VydmljZS5maW5kQnlJZCwgWyRzdGF0ZVBhcmFtcy5pZF0sIDMsIHRoaXMpXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uIChjb21wYW55RGF0YSkge1xuICAgICAgICAgICRzY29wZS5jb21wYW55ID0gY29tcGFueURhdGE7XG4gICAgICAgIH0sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBjb25zb2xlLmxvZyhcInNhZCBmYWNlXCIpO1xuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgJHNjb3BlLnJlZnJlc2goKTtcblxuICAgICRzY29wZS5nb1RvSW5zaWRlciA9IGZ1bmN0aW9uIChpbnNpZGVyKSB7XG4gICAgICAkc3RhdGUuZ28oJ2FwcC5pbnNpZGVyJywge1xuICAgICAgICBpZDogaW5zaWRlci5pZFxuICAgICAgfSk7XG4gICAgfTtcblxuICAgICRzY29wZS5nb1RvRm9ybTQgPSBmdW5jdGlvbiAoZm9ybTQpIHtcbiAgICAgICRzdGF0ZS5nbygnYXBwLmZvcm00Jywge1xuICAgICAgICBpZDogZm9ybTQuaWRcbiAgICAgIH0pO1xuICAgIH07XG4gIH0pO1xuIiwiLypnbG9iYWxzIGFuZ3VsYXIsIHdpbmRvdyAqL1xuYW5ndWxhci5tb2R1bGUoJ2luc2lkZXIuY29udHJvbGxlcnMnKVxuICAuY29udHJvbGxlcignRm9ybTRDdHJsJywgZnVuY3Rpb24gKCRzY29wZSwgJHN0YXRlUGFyYW1zLCBGb3JtNFNlcnZpY2UpIHtcbiAgICAkc2NvcGUucmVmcmVzaCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICRzY29wZS5yZXRyeVdpdGhQcm9taXNlKEZvcm00U2VydmljZS5maW5kQnlJZCwgWyRzdGF0ZVBhcmFtcy5pZF0sIDMsIHRoaXMpXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uIChmb3JtNERhdGEpIHtcbiAgICAgICAgICAkc2NvcGUuZm9ybTQgPSBmb3JtNERhdGE7XG4gICAgICAgIH0sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBjb25zb2xlLmxvZyhcInNhZCBmYWNlXCIpO1xuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgJHNjb3BlLm5hdmlnYXRlVG8gPSBmdW5jdGlvbiAodXJsKSB7XG4gICAgICB3aW5kb3cub3Blbih1cmwsICdfYmxhbmsnLCAnbG9jYXRpb249eWVzJyk7XG4gICAgfTtcblxuICAgICRzY29wZS5yZWZyZXNoKCk7XG4gIH0pO1xuIiwiLypnbG9iYWxzIGFuZ3VsYXIsIHdpbmRvdyAqL1xuYW5ndWxhci5tb2R1bGUoJ2luc2lkZXIuY29udHJvbGxlcnMnKVxuICAuY29udHJvbGxlcignSW5zaWRlckN0cmwnLCBmdW5jdGlvbiAoJHN0YXRlLCAkc2NvcGUsICRzdGF0ZVBhcmFtcywgSW5zaWRlclNlcnZpY2UpIHtcbiAgICAkc2NvcGUuc2hvd1RyYWRlcyA9IHRydWU7XG5cbiAgICAkc2NvcGUucmVmcmVzaCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICRzY29wZS5yZXRyeVdpdGhQcm9taXNlKEluc2lkZXJTZXJ2aWNlLmZpbmRCeUlkLCBbJHN0YXRlUGFyYW1zLmlkXSwgMywgdGhpcylcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24gKGluc2lkZXJEYXRhKSB7XG4gICAgICAgICAgJHNjb3BlLmluc2lkZXIgPSBpbnNpZGVyRGF0YTtcbiAgICAgICAgfSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgIGNvbnNvbGUubG9nKFwic2FkIGZhY2VcIik7XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICAkc2NvcGUucmVmcmVzaCgpO1xuXG4gICAgJHNjb3BlLmdvVG9Db21wYW55ID0gZnVuY3Rpb24gKGNvbXBhbnkpIHtcbiAgICAgICRzdGF0ZS5nbygnYXBwLmNvbXBhbnknLCB7XG4gICAgICAgIGlkOiBjb21wYW55LmlkXG4gICAgICB9KTtcbiAgICB9O1xuICAgICRzY29wZS5nb1RvRm9ybTQgPSBmdW5jdGlvbiAoZm9ybTQpIHtcbiAgICAgICRzdGF0ZS5nbygnYXBwLmZvcm00Jywge1xuICAgICAgICBpZDogZm9ybTQuaWRcbiAgICAgIH0pO1xuICAgIH07XG4gIH0pO1xuIiwiLypnbG9iYWxzIGFuZ3VsYXIsIHdpbmRvdyAqL1xuYW5ndWxhci5tb2R1bGUoJ2luc2lkZXIuY29udHJvbGxlcnMnKVxuICAuY29udHJvbGxlcignU2VhcmNoQ3RybCcsIGZ1bmN0aW9uICgkc3RhdGUsICRzY29wZSwgU2VhcmNoU2VydmljZSkge1xuICAgICRzY29wZS5rZXl3b3JkID0gXCJcIjtcbiAgICAkc2NvcGUucmVzdWx0cyA9IFtdO1xuICAgICRzY29wZS5zZWFyY2ggPSBmdW5jdGlvbiAoKSB7XG4gICAgICBTZWFyY2hTZXJ2aWNlLnNlYXJjaCgkc2NvcGUua2V5d29yZCkudGhlbihmdW5jdGlvbiAocmVzcCkge1xuICAgICAgICAkc2NvcGUucmVzdWx0cyA9IHJlc3AuZGF0YTtcbiAgICAgIH0pO1xuICAgIH07XG5cbiAgICAkc2NvcGUub3BlblJlc3VsdCA9IGZ1bmN0aW9uIChyZXN1bHQpIHtcbiAgICAgIHZhciB3aGVyZSA9IChyZXN1bHRbMV0gPT09ICdJbnNpZGVyJykgPyAnYXBwLmluc2lkZXInIDogJ2FwcC5jb21wYW55JztcbiAgICAgICRzdGF0ZS5nbyh3aGVyZSwge1xuICAgICAgICBpZDogcmVzdWx0WzBdXG4gICAgICB9KTtcbiAgICB9O1xuICAgICRzY29wZS5zZWFyY2goKTtcbiAgfSk7XG4iLCIvKmdsb2JhbHMgYW5ndWxhciAqL1xuYW5ndWxhci5tb2R1bGUoJ2luc2lkZXIuY29udHJvbGxlcnMnKVxuICAuY29udHJvbGxlcignU2V0dGluZ3NDdHJsJywgZnVuY3Rpb24gKCR0aW1lb3V0LCAkc2NvcGUsIEF1dGhTZXJ2aWNlLCBTZXR0aW5nc1NlcnZpY2UpIHtcbiAgICAkc2NvcGUudXNlciA9IEF1dGhTZXJ2aWNlLmN1cnJlbnRVc2VyKCk7XG5cbiAgICAkc2NvcGUudG9nZ2xlU2V0dGluZyA9IGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgIFNldHRpbmdzU2VydmljZS50b2dnbGVTZXR0aW5nKGtleSlcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICR0aW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICRzY29wZS4kYXBwbHkoKTtcbiAgICAgICAgICB9LCAxMDApO1xuICAgICAgICB9LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coXCJzb21ldGhpZ24gd2VudCB3cm9uZyB3aGVuIHNldHRpbmc6IFwiICsga2V5KTtcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgICRzY29wZS4kb24oJ2F1dGhjaGFuZ2UnLCBmdW5jdGlvbiAoKSB7XG4gICAgICBpZigkc2NvcGUubG9nZ2VkSW4oKSkge1xuICAgICAgICAkc2NvcGUudXNlciA9IEF1dGhTZXJ2aWNlLmN1cnJlbnRVc2VyKCk7XG4gICAgICAgICRzY29wZS4kYXBwbHkoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgICRzY29wZS5sb2dpbigpO1xuICAgICAgfVxuICAgIH0pO1xuICB9KTtcbiIsIi8qZ2xvYmFscyBhbmd1bGFyLCB3aW5kb3cgKi9cbmFuZ3VsYXIubW9kdWxlKCdpbnNpZGVyLmNvbnRyb2xsZXJzJylcbiAuY29udHJvbGxlcignVG9kYXlzQnV5c0N0cmwnLCBmdW5jdGlvbiAoJHN0YXRlLCAkc2NvcGUsIEJ1eUlkZWFTZXJ2aWNlKSB7XG4gICAgJHNjb3BlLnRyYWRlcyA9IFtdO1xuXG4gICAgJHNjb3BlLnJlZnJlc2ggPSBmdW5jdGlvbiAoKSB7XG4gICAgICAkc2NvcGUucmV0cnlXaXRoUHJvbWlzZShCdXlJZGVhU2VydmljZS5maW5kVG9kYXlzLCBbXSwgMywgdGhpcylcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24gKHRyYWRlcykge1xuICAgICAgICAgICRzY29wZS50cmFkZXMgPSB0cmFkZXM7XG4gICAgICAgIH0sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBjb25zb2xlLmxvZyhcInNhZCBmYWNlXCIpO1xuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgJHNjb3BlLnJlZnJlc2goKTtcblxuICAgICRzY29wZS5zaG93VHJhZGUgPSBmdW5jdGlvbiAoaWQpIHtcbiAgICAgICRzdGF0ZS5nbygnYXBwLnRyYWRlJywge1xuICAgICAgICBpZDogaWRcbiAgICAgIH0pO1xuICAgIH07XG5cbiAgICAkc2NvcGUuJG9uKCdhdXRoY2hhbmdlJywgZnVuY3Rpb24gKCkge1xuICAgICAgJHNjb3BlLnJlZnJlc2goKTtcbiAgICB9KTtcbiAgfSk7XG5cbiIsIi8qZ2xvYmFscyBhbmd1bGFyLCB3aW5kb3csIGRvY3VtZW50ICovXG5hbmd1bGFyLm1vZHVsZSgnaW5zaWRlci5jb250cm9sbGVycycpXG4gIC5jb250cm9sbGVyKCdUcmFkZUN0cmwnLCBmdW5jdGlvbiAoJHRpbWVvdXQsICRpb25pY1BvcHVwLCAkc2NvcGUsICRzdGF0ZVBhcmFtcywgQnV5SWRlYVNlcnZpY2UsIENvbW1lbnRTZXJ2aWNlLCBBdXRoU2VydmljZSkge1xuICAgICRzY29wZS5jb21tZW50RGF0YSA9IHt9O1xuICAgICRzY29wZS5zaG93Q29tbWVudEJveCA9IGZhbHNlO1xuXG4gICAgJHNjb3BlLm5hdmlnYXRlVG8gPSBmdW5jdGlvbiAodXJsKSB7XG4gICAgICB3aW5kb3cub3Blbih1cmwsICdfYmxhbmsnLCAnbG9jYXRpb249eWVzJyk7XG4gICAgfTtcblxuICAgICRzY29wZS5mb2N1c09uQ29tbWVudEJvZHkgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAkdGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjb21tZW50LWJvZHknKS5mb2N1cygpO1xuICAgICAgfSwgMTUwKTtcbiAgICB9O1xuXG4gICAgJHNjb3BlLmZldGNoQXR0ZW1wdHMgPSAwO1xuICAgICRzY29wZS5yZWZyZXNoID0gZnVuY3Rpb24gKCkge1xuICAgICAgJHNjb3BlLnJldHJ5V2l0aFByb21pc2UoQnV5SWRlYVNlcnZpY2UuZmluZEJ5SWQsIFskc3RhdGVQYXJhbXMuaWRdLCAzLCB0aGlzKVxuICAgICAgICAudGhlbihmdW5jdGlvbiAodHJhZGUpIHtcbiAgICAgICAgICAkc2NvcGUudHJhZGUgPSB0cmFkZTtcbiAgICAgICAgfSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgIGNvbnNvbGUubG9nKFwic2FkIGZhY2VcIik7XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICAkc2NvcGUucmVmcmVzaCgpO1xuXG4gICAgJHNjb3BlLnVzZXJJc0F1dGhvck9mID0gZnVuY3Rpb24gKGNvbW1lbnQpIHtcbiAgICAgIHJldHVybiBjb21tZW50LmF1dGhvcl9lbWFpbCA9PT0gQXV0aFNlcnZpY2UuY3VycmVudFVzZXIoKS5lbWFpbDtcbiAgICB9O1xuXG4gICAgJHNjb3BlLmFkZENvbW1lbnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAkc2NvcGUuY29tbWVudERhdGEuaWRlYV9pZCA9ICRzY29wZS50cmFkZS5pZDtcbiAgICAgIENvbW1lbnRTZXJ2aWNlLmFkZENvbW1lbnQoJHNjb3BlLmNvbW1lbnREYXRhKS50aGVuKGZ1bmN0aW9uIChjb21tZW50KSB7XG4gICAgICAgICRzY29wZS50cmFkZS5jb21tZW50cy51bnNoaWZ0KGNvbW1lbnQpO1xuICAgICAgICAkc2NvcGUuY29tbWVudERhdGEgPSB7fTtcbiAgICAgIH0sIGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICAgIGlmIChkYXRhLnN0YXR1cyA9PT0gNDAxKSB7XG4gICAgICAgICAgJHNjb3BlLnNob3dDb21tZW50Qm94ID0gdHJ1ZTtcbiAgICAgICAgICAkc2NvcGUubG9naW4oKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfTtcblxuICAgICRzY29wZS5yZW1vdmVDb21tZW50ID0gZnVuY3Rpb24gKGNvbW1lbnQpIHtcbiAgICAgIGlmICghJHNjb3BlLnVzZXJJc0F1dGhvck9mKGNvbW1lbnQpKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIHZhciBteVBvcHVwID0gJGlvbmljUG9wdXAuc2hvdyh7XG4gICAgICAgIHRlbXBsYXRlOiAnJyxcbiAgICAgICAgdGl0bGU6ICdBcmUgeW91IHN1cmUgeW91IHdhbnQgdG8gZGVsZXRlIHlvdXIgY29tbWVudD8nLFxuICAgICAgICBzdWJUaXRsZTogJycsXG4gICAgICAgIHNjb3BlOiAkc2NvcGUsXG4gICAgICAgIGJ1dHRvbnM6IFt7XG4gICAgICAgICAgdGV4dDogJ0NhbmNlbCdcbiAgICAgICAgfSwge1xuICAgICAgICAgIHRleHQ6ICc8Yj5EZWxldGU8L2I+JyxcbiAgICAgICAgICB0eXBlOiAnYnV0dG9uLWFzc2VydGl2ZScsXG4gICAgICAgICAgb25UYXA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIENvbW1lbnRTZXJ2aWNlLnJlbW92ZUNvbW1lbnQoY29tbWVudC5pZCkudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgIHZhciBjb21tZW50SW5kZXggPSAkc2NvcGUudHJhZGUuY29tbWVudHMuaW5kZXhPZihjb21tZW50KTtcbiAgICAgICAgICAgICAgJHNjb3BlLnRyYWRlLmNvbW1lbnRzLnNwbGljZShjb21tZW50SW5kZXgsIDEpO1xuICAgICAgICAgICAgICBteVBvcHVwLmNsb3NlKCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiBcInRlc3RcIjtcbiAgICAgICAgICB9XG4gICAgICAgIH0sIF1cbiAgICAgIH0pO1xuICAgICAgJHRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICBteVBvcHVwLmNsb3NlKCk7IC8vY2xvc2UgdGhlIHBvcHVwIGFmdGVyIDMgc2Vjb25kcyBmb3Igc29tZSByZWFzb25cbiAgICAgIH0sIDMwMDApO1xuICAgIH07XG4gIH0pO1xuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
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
  .run(function ($ionicPlatform, $cordovaPush, $rootScope, AuthService) {
    console.log("validating user");
    AuthService.validateUser();
    // $rootScope.currentUser = {};
    // var token = window.localStorage.getItem('auth_token');
    // if (token !== null) {
    //   $http.defaults.headers.common['Auth-Token-X'] = token;
    // }
    //
    // $http.get(loc.apiBase + '/api/v1/sessions/validate.json')
    //   .then(function (resp) {
    //     console.log(resp.data);
    //     $rootScope.currentUser = resp.data.user;
    //   }, function (resp) {
    //     window.localStorage.removeItem('auth_token');
    //     delete $http.defaults.headers.common['Auth-Token-X'];
    //     console.log(resp.data.message);
    //   });

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

      if(window.cordova) {
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

      $http.post(loc.apiBase + '/api/v1/users/sign_in.json', params).
      success(function (userData) {
        saveUser(userData);
        deferred.resolve(userData);
      }).
      error(function (data) {
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
      validateUser: validateUser
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
          console.log(trades);
          $scope.trades = trades;
        }, function () {
          // TODO: show no trades found thing
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
  .controller('SettingsCtrl', function () {
    console.log("settings controller");
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
            }, function (data) {
              console.log(data);
            });
            return "test";
          }
        }, ]
      });
      // myPopup.then(function(res) {
      //   console.log('Tapped!', res);
      // });
      $timeout(function () {
        myPopup.close(); //close the popup after 3 seconds for some reason
      }, 3000);
    };
  });

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImZpbHRlcnMuanMiLCJhdXRoX3NlcnZpY2UuanMiLCJjb21tZW50X3Nlcml2Y2UuanMiLCJjb21wYW55X3NlcnZpY2UuanMiLCJmb3JtNF9zZXJ2aWNlLmpzIiwiaWRlYV9zZXJ2aWNlLmpzIiwiaW5zaWRlcl9zZXJ2aWNlLmpzIiwic2VhcmNoX3Nlcml2Y2UuanMiLCJhcHBfY29udHJvbGxlci5qcyIsImJ1eXNfY29udHJvbGxlci5qcyIsImNvbXBhbnlfY29udHJvbGxlci5qcyIsImZvcm00X2NvbnRyb2xsZXIuanMiLCJpbnNpZGVyX2NvbnRyb2xsZXIuanMiLCJzZWFyY2hfY29udHJvbGxlci5qcyIsInNldHRpbmdzX2NvbnRyb2xsZXIuanMiLCJ0b2RheXNfYnV5c19jb250cm9sbGVyLmpzIiwidHJhZGVfY29udHJvbGxlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbktBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDckZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDMUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN4Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3RCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDdkVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDNUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDM0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNuQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMzQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJhbGwuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKmdsb2JhbCB3aW5kb3csIGNvcmRvdmEsIGFuZ3VsYXIgKi9cbnZhciBhcHAgPSBhbmd1bGFyLm1vZHVsZSgnaW5zaWRlcicsIFtcbiAgICAnaW9uaWMnLFxuICAgICdpbnNpZGVyLnNlcnZpY2VzJyxcbiAgICAnaW5zaWRlci5jb250cm9sbGVycycsXG4gICAgJ2luc2lkZXIuZmlsdGVycycsXG4gICAgJ25nQ29yZG92YSdcbiAgXSlcbiAgLmNvbnN0YW50KCdsb2MnLCB7XG4gICAgLy9hcGlCYXNlOiAnaHR0cDovL2xvY2FsaG9zdDozMDAwJ1xuICAgIGFwaUJhc2U6ICdodHRwczovL2luc2lkZXJhaS5jb20nXG4gIH0pXG4gIC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyLCAkdXJsUm91dGVyUHJvdmlkZXIpIHtcbiAgICAkc3RhdGVQcm92aWRlclxuICAgICAgLnN0YXRlKCdhcHAnLCB7XG4gICAgICAgIHVybDogJy9hcHAnLFxuICAgICAgICBhYnN0cmFjdDogdHJ1ZSxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICd0ZW1wbGF0ZXMvbWVudS5odG1sJyxcbiAgICAgICAgY29udHJvbGxlcjogJ0FwcEN0cmwnXG4gICAgICB9KVxuICAgICAgLnN0YXRlKCdhcHAuYnV5cycsIHtcbiAgICAgICAgdXJsOiAnL2J1eXMnLFxuICAgICAgICB2aWV3czoge1xuICAgICAgICAgICdtZW51Q29udGVudCc6IHtcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAndGVtcGxhdGVzL2J1eXMuaHRtbCcsXG4gICAgICAgICAgICBjb250cm9sbGVyOiAnQnV5c0N0cmwnXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KVxuICAgICAgLnN0YXRlKCdhcHAudG9kYXknLCB7XG4gICAgICAgIHVybDogJy90b2RheScsXG4gICAgICAgIHZpZXdzOiB7XG4gICAgICAgICAgJ21lbnVDb250ZW50Jzoge1xuICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICd0ZW1wbGF0ZXMvdG9kYXkuaHRtbCcsXG4gICAgICAgICAgICBjb250cm9sbGVyOiAnVG9kYXlzQnV5c0N0cmwnXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KVxuICAgICAgLnN0YXRlKCdhcHAudHJhZGUnLCB7XG4gICAgICAgIHVybDogJy90cmFkZXMvOmlkJyxcbiAgICAgICAgdmlld3M6IHtcbiAgICAgICAgICAnbWVudUNvbnRlbnQnOiB7XG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogJ3RlbXBsYXRlcy90cmFkZS5odG1sJyxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdUcmFkZUN0cmwnXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KVxuICAgICAgLnN0YXRlKCdhcHAuaW5zaWRlcicsIHtcbiAgICAgICAgdXJsOiAnL2luc2lkZXJzLzppZCcsXG4gICAgICAgIHZpZXdzOiB7XG4gICAgICAgICAgJ21lbnVDb250ZW50Jzoge1xuICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICd0ZW1wbGF0ZXMvaW5zaWRlci5odG1sJyxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdJbnNpZGVyQ3RybCdcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgICAuc3RhdGUoJ2FwcC5mb3JtNCcsIHtcbiAgICAgICAgdXJsOiAnL2Zvcm00cy86aWQnLFxuICAgICAgICB2aWV3czoge1xuICAgICAgICAgICdtZW51Q29udGVudCc6IHtcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAndGVtcGxhdGVzL2Zvcm00Lmh0bWwnLFxuICAgICAgICAgICAgY29udHJvbGxlcjogJ0Zvcm00Q3RybCdcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgICAuc3RhdGUoJ2FwcC5jb21wYW55Jywge1xuICAgICAgICB1cmw6ICcvY29tcGFuaWVzLzppZCcsXG4gICAgICAgIHZpZXdzOiB7XG4gICAgICAgICAgJ21lbnVDb250ZW50Jzoge1xuICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICd0ZW1wbGF0ZXMvY29tcGFueS5odG1sJyxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdDb21wYW55Q3RybCdcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgICAuc3RhdGUoJ2FwcC5zZWFyY2gnLCB7XG4gICAgICAgIHVybDogJy9zZWFyY2gnLFxuICAgICAgICB2aWV3czoge1xuICAgICAgICAgICdtZW51Q29udGVudCc6IHtcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAndGVtcGxhdGVzL3NlYXJjaC5odG1sJyxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdTZWFyY2hDdHJsJ1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSlcbiAgICAgIC5zdGF0ZSgnYXBwLnNldHRpbmdzJywge1xuICAgICAgICB1cmw6ICcvc2V0dGluZ3MnLFxuICAgICAgICB2aWV3czoge1xuICAgICAgICAgICdtZW51Q29udGVudCc6IHtcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAndGVtcGxhdGVzL3NldHRpbmdzLmh0bWwnLFxuICAgICAgICAgICAgY29udHJvbGxlcjogJ1NldHRpbmdzQ3RybCdcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIC8vIGlmIG5vbmUgb2YgdGhlIGFib3ZlIHN0YXRlcyBhcmUgbWF0Y2hlZCwgdXNlIHRoaXMgYXMgdGhlIGZhbGxiYWNrXG4gICAgJHVybFJvdXRlclByb3ZpZGVyLm90aGVyd2lzZSgnL2FwcC9idXlzJyk7XG4gIH0pXG4gIC5ydW4oZnVuY3Rpb24gKCRpb25pY1BsYXRmb3JtLCAkY29yZG92YVB1c2gsICRyb290U2NvcGUsIEF1dGhTZXJ2aWNlKSB7XG4gICAgY29uc29sZS5sb2coXCJ2YWxpZGF0aW5nIHVzZXJcIik7XG4gICAgQXV0aFNlcnZpY2UudmFsaWRhdGVVc2VyKCk7XG4gICAgLy8gJHJvb3RTY29wZS5jdXJyZW50VXNlciA9IHt9O1xuICAgIC8vIHZhciB0b2tlbiA9IHdpbmRvdy5sb2NhbFN0b3JhZ2UuZ2V0SXRlbSgnYXV0aF90b2tlbicpO1xuICAgIC8vIGlmICh0b2tlbiAhPT0gbnVsbCkge1xuICAgIC8vICAgJGh0dHAuZGVmYXVsdHMuaGVhZGVycy5jb21tb25bJ0F1dGgtVG9rZW4tWCddID0gdG9rZW47XG4gICAgLy8gfVxuICAgIC8vXG4gICAgLy8gJGh0dHAuZ2V0KGxvYy5hcGlCYXNlICsgJy9hcGkvdjEvc2Vzc2lvbnMvdmFsaWRhdGUuanNvbicpXG4gICAgLy8gICAudGhlbihmdW5jdGlvbiAocmVzcCkge1xuICAgIC8vICAgICBjb25zb2xlLmxvZyhyZXNwLmRhdGEpO1xuICAgIC8vICAgICAkcm9vdFNjb3BlLmN1cnJlbnRVc2VyID0gcmVzcC5kYXRhLnVzZXI7XG4gICAgLy8gICB9LCBmdW5jdGlvbiAocmVzcCkge1xuICAgIC8vICAgICB3aW5kb3cubG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oJ2F1dGhfdG9rZW4nKTtcbiAgICAvLyAgICAgZGVsZXRlICRodHRwLmRlZmF1bHRzLmhlYWRlcnMuY29tbW9uWydBdXRoLVRva2VuLVgnXTtcbiAgICAvLyAgICAgY29uc29sZS5sb2cocmVzcC5kYXRhLm1lc3NhZ2UpO1xuICAgIC8vICAgfSk7XG5cbiAgICAkaW9uaWNQbGF0Zm9ybS5yZWFkeShmdW5jdGlvbiAoKSB7XG4gICAgICAvLyBIaWRlIHRoZSBhY2Nlc3NvcnkgYmFyIGJ5IGRlZmF1bHQgKHJlbW92ZSB0aGlzIHRvIHNob3cgdGhlIGFjY2Vzc29yeSBiYXIgYWJvdmUgdGhlIGtleWJvYXJkXG4gICAgICAvLyBmb3IgZm9ybSBpbnB1dHMpXG4gICAgICBpZiAod2luZG93LmNvcmRvdmEgJiYgd2luZG93LmNvcmRvdmEucGx1Z2lucy5LZXlib2FyZCkge1xuICAgICAgICBjb3Jkb3ZhLnBsdWdpbnMuS2V5Ym9hcmQuaGlkZUtleWJvYXJkQWNjZXNzb3J5QmFyKHRydWUpO1xuICAgICAgfVxuICAgICAgaWYgKHdpbmRvdy5TdGF0dXNCYXIpIHtcbiAgICAgICAgLy8gb3JnLmFwYWNoZS5jb3Jkb3ZhLnN0YXR1c2JhciByZXF1aXJlZFxuICAgICAgICB3aW5kb3cuU3RhdHVzQmFyLnN0eWxlTGlnaHRDb250ZW50KCk7XG4gICAgICB9XG5cbiAgICAgIHZhciBpb3NDb25maWcgPSB7XG4gICAgICAgIFwiYmFkZ2VcIjogXCJ0cnVlXCIsXG4gICAgICAgIFwic291bmRcIjogXCJ0cnVlXCIsXG4gICAgICAgIFwiYWxlcnRcIjogXCJ0cnVlXCIsXG4gICAgICAgIFwiZWNiXCI6IFwib25Ob3RpZmljYXRpb25BUE5cIlxuICAgICAgfTtcblxuICAgICAgaWYod2luZG93LmNvcmRvdmEpIHtcbiAgICAgICAgJGNvcmRvdmFQdXNoLnJlZ2lzdGVyKGlvc0NvbmZpZykudGhlbihmdW5jdGlvbiAocmVzdWx0KSB7XG4gICAgICAgICAgJHJvb3RTY29wZS5kZXZpY2VUb2tlbiA9IHJlc3VsdDtcbiAgICAgICAgfSwgZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgIGNvbnNvbGUubG9nKFwibm90IGFibGUgdG8gc2VuZCBwdXNoXCIsIGVycik7XG4gICAgICAgIH0pO1xuICAgICAgICAvLyAkY29yZG92YVB1c2gudW5yZWdpc3RlcihvcHRpb25zKS50aGVuKGZ1bmN0aW9uKHJlc3VsdCkge1xuICAgICAgICAvLyAgIGFsZXJ0KFwidW5yZWdpc3RlclwiKTtcbiAgICAgICAgLy8gICBhbGVydChyZXN1bHQpO1xuICAgICAgICAvLyAgIGFsZXJ0KGFyZ3VtZW50cyk7XG4gICAgICAgIC8vICAgICAvLyBTdWNjZXNzIVxuICAgICAgICAvLyB9LCBmdW5jdGlvbihlcnIpIHtcbiAgICAgICAgLy8gICBhbGVydChcImVycm9yXCIpO1xuICAgICAgICAvLyAgIGFsZXJ0KGVycik7XG4gICAgICAgIC8vICAgICAvLyBBbiBlcnJvciBvY2N1cmVkLiBTaG93IGEgbWVzc2FnZSB0byB0aGUgdXNlclxuICAgICAgICAvLyB9KTtcbiAgICAgICAgLy9cbiAgICAgICAgLy8gLy8gaU9TIG9ubHlcbiAgICAgICAgLy8gJGNvcmRvdmFQdXNoLnNldEJhZGdlTnVtYmVyKDIpLnRoZW4oZnVuY3Rpb24ocmVzdWx0KSB7XG4gICAgICAgIC8vICAgYWxlcnQoXCJzZXQgYmFkZ2UgdG8gMiFcIik7XG4gICAgICAgIC8vICAgYWxlcnQocmVzdWx0KTtcbiAgICAgICAgLy8gICBhbGVydChhcmd1bWVudHMpO1xuICAgICAgICAvLyAgICAgLy8gU3VjY2VzcyFcbiAgICAgICAgLy8gfSwgZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgIC8vICAgYWxlcnQoXCJlcnJvclwiKTtcbiAgICAgICAgLy8gICBhbGVydChlcnIpO1xuICAgICAgICAvLyAgICAgLy8gQW4gZXJyb3Igb2NjdXJlZC4gU2hvdyBhIG1lc3NhZ2UgdG8gdGhlIHVzZXJcbiAgICAgICAgLy8gfSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH0pO1xuIiwiLypnbG9iYWxzIGFuZ3VsYXIsIG1kNSAqL1xuYW5ndWxhci5tb2R1bGUoJ2luc2lkZXIuZmlsdGVycycsIFtdKVxuICAuZmlsdGVyKCdncmF2YXRhcicsIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKGVtYWlsKSB7XG4gICAgICByZXR1cm4gXCJodHRwOi8vd3d3LmdyYXZhdGFyLmNvbS9hdmF0YXIvXCIgKyBtZDUoZW1haWwpO1xuICAgIH07XG4gIH0pO1xuIiwiLypnbG9iYWxzIHdpbmRvdywgYW5ndWxhciwgXyAqL1xuYW5ndWxhci5tb2R1bGUoJ2luc2lkZXIuc2VydmljZXMnLCBbXSlcbiAgLmZhY3RvcnkoJ0F1dGhTZXJ2aWNlJywgZnVuY3Rpb24gKGxvYywgJHEsICRodHRwKSB7XG4gICAgdmFyIHVzZXIgPSBudWxsO1xuXG4gICAgdmFyIHJlYWRTdG9yZWRVc2VyID0gZnVuY3Rpb24gKCkge1xuICAgICAgdmFyIHN0b3JlZFVzZXIgPSB3aW5kb3cubG9jYWxTdG9yYWdlLmdldEl0ZW0oJ3VzZXInKTtcbiAgICAgIHRyeSB7XG4gICAgICAgIGlmIChzdG9yZWRVc2VyKSB7XG4gICAgICAgICAgdXNlciA9IEpTT04ucGFyc2Uoc3RvcmVkVXNlcik7XG4gICAgICAgICAgJGh0dHAuZGVmYXVsdHMuaGVhZGVycy5jb21tb25bJ0F1dGgtVG9rZW4tWCddID0gdXNlci5hdXRoX3Rva2VuO1xuICAgICAgICB9XG4gICAgICB9IGNhdGNoIChpZ25vcmUpIHsgLyogZmFpbCBzaWxlbnRseSovIH1cbiAgICB9O1xuXG4gICAgcmVhZFN0b3JlZFVzZXIoKTtcblxuICAgIHZhciBjdXJyZW50VXNlciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIGlmICghdXNlcikge1xuICAgICAgICB1c2VyID0gcmVhZFN0b3JlZFVzZXIoKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB1c2VyO1xuICAgIH07XG5cbiAgICB2YXIgc2F2ZVVzZXIgPSBmdW5jdGlvbiAodXNlclRvU2F2ZSkge1xuICAgICAgdXNlciA9IHVzZXJUb1NhdmU7XG4gICAgICB3aW5kb3cubG9jYWxTdG9yYWdlLnNldEl0ZW0oJ3VzZXInLCBKU09OLnN0cmluZ2lmeSh1c2VyKSk7XG4gICAgICAkaHR0cC5kZWZhdWx0cy5oZWFkZXJzLmNvbW1vblsnQXV0aC1Ub2tlbi1YJ10gPSB1c2VyLmF1dGhfdG9rZW47XG4gICAgfTtcblxuICAgIHZhciBjbGVhclVzZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICB3aW5kb3cubG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oJ3VzZXInKTtcbiAgICAgICRodHRwLmRlZmF1bHRzLmhlYWRlcnMuY29tbW9uWydBdXRoLVRva2VuLVgnXSA9IHVuZGVmaW5lZDtcbiAgICAgIHVzZXIgPSBudWxsO1xuICAgIH07XG5cbiAgICB2YXIgbG9nZ2VkSW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4gISFjdXJyZW50VXNlcigpO1xuICAgIH07XG5cbiAgICB2YXIgZG9Mb2dpbiA9IGZ1bmN0aW9uICh1c2VyUGFyYW1zLCBkZXZpY2VUb2tlbikge1xuICAgICAgdmFyIHBhcmFtcyA9IHtcbiAgICAgICAgdXNlcjogdXNlclBhcmFtcyxcbiAgICAgICAgZGV2aWNlOiB7XG4gICAgICAgICAgcGxhdGZvcm06ICdpb3MnLFxuICAgICAgICAgIHRva2VuOiBkZXZpY2VUb2tlblxuICAgICAgICB9XG4gICAgICB9O1xuXG4gICAgICB2YXIgZGVmZXJyZWQgPSAkcS5kZWZlcigpO1xuXG4gICAgICAkaHR0cC5wb3N0KGxvYy5hcGlCYXNlICsgJy9hcGkvdjEvdXNlcnMvc2lnbl9pbi5qc29uJywgcGFyYW1zKS5cbiAgICAgIHN1Y2Nlc3MoZnVuY3Rpb24gKHVzZXJEYXRhKSB7XG4gICAgICAgIHNhdmVVc2VyKHVzZXJEYXRhKTtcbiAgICAgICAgZGVmZXJyZWQucmVzb2x2ZSh1c2VyRGF0YSk7XG4gICAgICB9KS5cbiAgICAgIGVycm9yKGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICAgIGRlZmVycmVkLnJlamVjdChkYXRhKTtcbiAgICAgIH0pO1xuXG4gICAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbiAgICB9O1xuXG4gICAgdmFyIGRvTG9nb3V0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgY2xlYXJVc2VyKCk7XG4gICAgICByZXR1cm4gJGh0dHAuZGVsZXRlKGxvYy5hcGlCYXNlICsgJy9hcGkvdjEvdXNlcnMvc2lnbl9vdXQuanNvbicpO1xuICAgIH07XG5cbiAgICB2YXIgdmFsaWRhdGVVc2VyID0gZnVuY3Rpb24gKCkge1xuICAgICAgJGh0dHAuZ2V0KGxvYy5hcGlCYXNlICsgJy9hcGkvdjEvc2Vzc2lvbnMvdmFsaWRhdGUuanNvbicpXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uIChyZXNwKSB7XG4gICAgICAgICAgc2F2ZVVzZXIocmVzcC5kYXRhLnVzZXIpO1xuICAgICAgICB9LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgY2xlYXJVc2VyKCk7XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICByZXR1cm4ge1xuICAgICAgZG9Mb2dpbjogZG9Mb2dpbixcbiAgICAgIGRvTG9nb3V0OiBkb0xvZ291dCxcbiAgICAgIGxvZ2dlZEluOiBsb2dnZWRJbixcbiAgICAgIGN1cnJlbnRVc2VyOiBjdXJyZW50VXNlcixcbiAgICAgIHZhbGlkYXRlVXNlcjogdmFsaWRhdGVVc2VyXG4gICAgfTtcbiAgfSk7XG4iLCIvKmdsb2JhbHMgYW5ndWxhciwgXyAqL1xuYW5ndWxhci5tb2R1bGUoJ2luc2lkZXIuc2VydmljZXMnKVxuICAuZmFjdG9yeSgnQ29tbWVudFNlcnZpY2UnLCBmdW5jdGlvbihsb2MsICRxLCAkaHR0cCkge1xuICAgIGZ1bmN0aW9uIHVybChpZCkge1xuICAgICAgaWYoaWQpIHtcbiAgICAgICAgcmV0dXJuIGxvYy5hcGlCYXNlICsgJy9hcGkvdjEvY29tbWVudHMvJyArIGlkICsgJy5qc29uJztcbiAgICAgIH1cbiAgICAgIHJldHVybiBsb2MuYXBpQmFzZSArICcvYXBpL3YxL2NvbW1lbnRzLmpzb24nO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICBhZGRDb21tZW50OiBmdW5jdGlvbiAocGFyYW1zKSB7XG4gICAgICAgIHZhciBkZWZlcnJlZCA9ICRxLmRlZmVyKCk7XG4gICAgICAgICRodHRwLnBvc3QodXJsKCksIHBhcmFtcykudGhlbihmdW5jdGlvbiAocmVzcCkge1xuICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUocmVzcC5kYXRhKTtcbiAgICAgICAgfSwgZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgICAgICBkZWZlcnJlZC5yZWplY3QoZGF0YSk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbiAgICAgIH0sXG5cbiAgICAgIHJlbW92ZUNvbW1lbnQ6IGZ1bmN0aW9uIChpZCkge1xuICAgICAgICByZXR1cm4gJGh0dHAuZGVsZXRlKHVybChpZCkpO1xuICAgICAgfVxuICAgIH07XG4gIH0pO1xuIiwiLypnbG9iYWxzIGFuZ3VsYXIsIF8gKi9cbmFuZ3VsYXIubW9kdWxlKCdpbnNpZGVyLnNlcnZpY2VzJylcbiAgLmZhY3RvcnkoJ0NvbXBhbnlTZXJ2aWNlJywgZnVuY3Rpb24obG9jLCAkcSwgJGh0dHApIHtcbiAgICBmdW5jdGlvbiB1cmwoaWQpIHtcbiAgICAgaWYoaWQpIHtcbiAgICAgICAgcmV0dXJuIGxvYy5hcGlCYXNlICsgJy9hcGkvdjEvY29tcGFuaWVzLycgKyBpZCArICcuanNvbic7XG4gICAgICB9XG4gICAgICByZXR1cm4gbG9jLmFwaUJhc2UgKyAnL2FwaS92MS9jb21wYW5pZXMuanNvbic7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIGZpbmRCeUlkOiBmdW5jdGlvbiAoaWQpIHtcbiAgICAgICAgdmFyIGRlZmVycmVkID0gJHEuZGVmZXIoKTtcbiAgICAgICAgJGh0dHAuZ2V0KHVybChpZCkpLnRoZW4oZnVuY3Rpb24gKHJlc3ApIHtcbiAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKHJlc3AuZGF0YSk7XG4gICAgICAgIH0sIGZ1bmN0aW9uIChyZXNwKSB7XG4gICAgICAgICAgZGVmZXJyZWQucmVqZWN0KHJlc3AuZGF0YSk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbiAgICAgIH0sXG4gICAgfTtcbiAgfSk7XG5cbiIsIi8qZ2xvYmFscyBhbmd1bGFyLCBfICovXG5hbmd1bGFyLm1vZHVsZSgnaW5zaWRlci5zZXJ2aWNlcycpXG4gIC5mYWN0b3J5KCdGb3JtNFNlcnZpY2UnLCBmdW5jdGlvbihsb2MsICRxLCAkaHR0cCkge1xuICAgIGZ1bmN0aW9uIHVybChpZCkge1xuICAgICBpZihpZCkge1xuICAgICAgICByZXR1cm4gbG9jLmFwaUJhc2UgKyAnL2FwaS92MS9mb3JtNHMvJyArIGlkICsgJy5qc29uJztcbiAgICAgIH1cbiAgICAgIHJldHVybiBsb2MuYXBpQmFzZSArICcvYXBpL3YxL2Zvcm00cy5qc29uJztcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgZmluZEJ5SWQ6IGZ1bmN0aW9uIChpZCkge1xuICAgICAgICB2YXIgZGVmZXJyZWQgPSAkcS5kZWZlcigpO1xuICAgICAgICAkaHR0cC5nZXQodXJsKGlkKSkudGhlbihmdW5jdGlvbiAocmVzcCkge1xuICAgICAgICAgIHZhciBmaWxpbmcgPSByZXNwLmRhdGE7XG4gICAgICAgICAgdmFyIGRvYyA9IEpTT04ucGFyc2UocmVzcC5kYXRhLmZpbGluZyk7XG4gICAgICAgICAgZmlsaW5nLm5vbkRlcml2YXRpdmVUcmFuc2FjdGlvbnMgPSBkb2MudHJhbnNhY3Rpb25zO1xuICAgICAgICAgIGZpbGluZy5kZXJpdmF0aXZlVHJhbnNhY3Rpb25zID0gZG9jLmRlcml2YXRpdmVfdHJhbnNhY3Rpb25zO1xuICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUoZmlsaW5nKTtcbiAgICAgICAgfSwgZnVuY3Rpb24gKHJlc3ApIHtcbiAgICAgICAgICBkZWZlcnJlZC5yZWplY3QocmVzcC5kYXRhKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xuICAgICAgfSxcbiAgICB9O1xuICB9KTtcbiIsIi8qZ2xvYmFscyBhbmd1bGFyLCBfICovXG5hbmd1bGFyLm1vZHVsZSgnaW5zaWRlci5zZXJ2aWNlcycpXG4gIC5mYWN0b3J5KCdCdXlJZGVhU2VydmljZScsIGZ1bmN0aW9uKGxvYywgJHEsICRodHRwKSB7XG4gICAgZnVuY3Rpb24gdXJsKGlkKSB7XG4gICAgICBpZihpZCkge1xuICAgICAgICByZXR1cm4gbG9jLmFwaUJhc2UgKyAnL2FwaS92MS9idXlzLycgKyBpZCArICcuanNvbic7XG4gICAgICB9XG4gICAgICByZXR1cm4gbG9jLmFwaUJhc2UgKyAnL2FwaS92MS9idXlzLmpzb24nO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICBmaW5kQWxsOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBkZWZlcnJlZCA9ICRxLmRlZmVyKCk7XG4gICAgICAgICRodHRwLmdldCh1cmwoKSkudGhlbihmdW5jdGlvbiAocmVzcCkge1xuICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUocmVzcC5kYXRhKTtcbiAgICAgICAgfSwgZnVuY3Rpb24gKHJlc3ApIHtcbiAgICAgICAgICBkZWZlcnJlZC5yZWplY3QocmVzcC5kYXRhKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xuICAgICAgfSxcblxuICAgICAgZmluZEJ5SWQ6IGZ1bmN0aW9uIChpZCkge1xuICAgICAgICB2YXIgZGVmZXJyZWQgPSAkcS5kZWZlcigpO1xuICAgICAgICAkaHR0cC5nZXQodXJsKGlkKSkudGhlbihmdW5jdGlvbiAocmVzcCkge1xuICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUocmVzcC5kYXRhKTtcbiAgICAgICAgfSwgZnVuY3Rpb24gKHJlc3ApIHtcbiAgICAgICAgICBkZWZlcnJlZC5yZWplY3QocmVzcC5kYXRhKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xuICAgICAgfSxcblxuICAgICAgZmluZFRvZGF5czogZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgZGVmZXJyZWQgPSAkcS5kZWZlcigpO1xuICAgICAgICAkaHR0cC5nZXQodXJsKCksIHsgcGFyYW1zOiB7ICd0b2RheSc6IHRydWUgfSB9KS50aGVuKGZ1bmN0aW9uIChyZXNwKSB7XG4gICAgICAgICAgZGVmZXJyZWQucmVzb2x2ZShyZXNwLmRhdGEpO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG4gICAgICB9XG4gICAgfTtcbiAgfSk7XG4iLCIvKmdsb2JhbHMgYW5ndWxhciwgXyAqL1xuYW5ndWxhci5tb2R1bGUoJ2luc2lkZXIuc2VydmljZXMnKVxuICAuZmFjdG9yeSgnSW5zaWRlclNlcnZpY2UnLCBmdW5jdGlvbihsb2MsICRxLCAkaHR0cCkge1xuICAgIGZ1bmN0aW9uIHVybChpZCkge1xuICAgICBpZihpZCkge1xuICAgICAgICByZXR1cm4gbG9jLmFwaUJhc2UgKyAnL2FwaS92MS9pbnNpZGVycy8nICsgaWQgKyAnLmpzb24nO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGxvYy5hcGlCYXNlICsgJy9hcGkvdjEvaW5zaWRlcnMuanNvbic7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIGZpbmRCeUlkOiBmdW5jdGlvbiAoaWQpIHtcbiAgICAgICAgdmFyIGRlZmVycmVkID0gJHEuZGVmZXIoKTtcbiAgICAgICAgJGh0dHAuZ2V0KHVybChpZCkpLnRoZW4oZnVuY3Rpb24gKHJlc3ApIHtcbiAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKHJlc3AuZGF0YSk7XG4gICAgICAgIH0sIGZ1bmN0aW9uIChyZXNwKSB7XG4gICAgICAgICAgZGVmZXJyZWQucmVqZWN0KHJlc3AuZGF0YSk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbiAgICAgIH0sXG4gICAgfTtcbiAgfSk7XG4iLCIvKmdsb2JhbHMgYW5ndWxhciwgXyAqL1xuYW5ndWxhci5tb2R1bGUoJ2luc2lkZXIuc2VydmljZXMnKVxuICAuZmFjdG9yeSgnU2VhcmNoU2VydmljZScsIGZ1bmN0aW9uKGxvYywgJGh0dHApIHtcbiAgICBmdW5jdGlvbiB1cmwocSkge1xuICAgICAgcmV0dXJuIGxvYy5hcGlCYXNlICsgJy9hcGkvdjEvc2VhcmNoP3E9JyArIHE7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIHNlYXJjaDogZnVuY3Rpb24gKGtleXdvcmQpIHtcbiAgICAgICAgcmV0dXJuICRodHRwLmdldCh1cmwoa2V5d29yZCkpO1xuICAgICAgfVxuICAgIH07XG4gIH0pO1xuIiwiLypnbG9iYWxzIGFuZ3VsYXIsIHdpbmRvdyAqL1xuYW5ndWxhci5tb2R1bGUoJ2luc2lkZXIuY29udHJvbGxlcnMnLCBbXSlcbiAgLmNvbnRyb2xsZXIoJ0FwcEN0cmwnLCBmdW5jdGlvbiAoJHRpbWVvdXQsICRpb25pY0xvYWRpbmcsICRxLCAkc2NvcGUsICRpb25pY01vZGFsLCAkcm9vdFNjb3BlLCBBdXRoU2VydmljZSkge1xuICAgICRzY29wZS5sb2dpbkRhdGEgPSB7fTtcblxuICAgICRpb25pY01vZGFsLmZyb21UZW1wbGF0ZVVybCgndGVtcGxhdGVzL2xvZ2luLmh0bWwnLCB7XG4gICAgICBzY29wZTogJHNjb3BlXG4gICAgfSkudGhlbihmdW5jdGlvbiAobW9kYWwpIHtcbiAgICAgICRzY29wZS5tb2RhbCA9IG1vZGFsO1xuICAgIH0pO1xuXG4gICAgJHNjb3BlLmNsb3NlTG9naW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAkc2NvcGUubW9kYWwuaGlkZSgpO1xuICAgIH07XG5cbiAgICAkc2NvcGUubG9naW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAkc2NvcGUubW9kYWwuc2hvdygpO1xuICAgIH07XG5cbiAgICAkc2NvcGUubG9nb3V0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgQXV0aFNlcnZpY2UuZG9Mb2dvdXQoKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KFwiYXV0aGNoYW5nZVwiKTtcbiAgICAgIH0pO1xuICAgIH07XG5cbiAgICAkc2NvcGUubG9nZ2VkSW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4gQXV0aFNlcnZpY2UubG9nZ2VkSW4oKTtcbiAgICB9O1xuXG4gICAgJHNjb3BlLmRvTG9naW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgICBBdXRoU2VydmljZS5kb0xvZ2luKCRzY29wZS5sb2dpbkRhdGEsICRyb290U2NvcGUuZGV2aWNlVG9rZW4pXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoJ2F1dGhjaGFuZ2UnKTtcbiAgICAgICAgICAkc2NvcGUuY2xvc2VMb2dpbigpO1xuICAgICAgICB9LCBmdW5jdGlvbiAoZGF0YSkge1xuICAgICAgICAgIGlmIChkYXRhLm1lc3NhZ2UpIHtcbiAgICAgICAgICAgIHdpbmRvdy5hbGVydChkYXRhLm1lc3NhZ2UpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB3aW5kb3cuYWxlcnQoXCJTb21ldGhpbmcgd2VudCB3cm9uZyB3aXRoIHlvdXIgbG9naW4uIFRyeSBhZ2Fpbi5cIik7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgJHNjb3BlLnJldHJ5V2l0aFByb21pc2UgPSBmdW5jdGlvbiAocHJvbWlzZSwgYXJncywgbWF4VHJpZXMsIGNvbnRleHQsIGRlZmVycmVkKSB7XG4gICAgICBkZWZlcnJlZCA9IGRlZmVycmVkIHx8ICRxLmRlZmVyKCk7XG4gICAgICBjb250ZXh0ID0gY29udGV4dCB8fCBudWxsO1xuXG4gICAgICAkc2NvcGUubG9hZGluZyA9IHRydWU7XG4gICAgICAkaW9uaWNMb2FkaW5nLnNob3coe1xuICAgICAgICB0ZW1wbGF0ZTogXCI8aSBjbGFzcz0naW9uLWxvYWRpbmctZCc+PC9pPlwiXG4gICAgICB9KTtcblxuICAgICAgcHJvbWlzZS5hcHBseShjb250ZXh0LCBhcmdzKVxuICAgICAgICAudGhlbihmdW5jdGlvbiAoZCkge1xuICAgICAgICAgICRzY29wZS5sb2FkaW5nID0gZmFsc2U7XG4gICAgICAgICAgJGlvbmljTG9hZGluZy5oaWRlKCk7XG4gICAgICAgICAgcmV0dXJuIGRlZmVycmVkLnJlc29sdmUoZCk7XG4gICAgICAgIH0sIGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICBpZiAobWF4VHJpZXMgPT09IC0xKSB7XG4gICAgICAgICAgICAkaW9uaWNMb2FkaW5nLmhpZGUoKTtcbiAgICAgICAgICAgICRzY29wZS5sb2FkaW5nID0gZmFsc2U7XG4gICAgICAgICAgICByZXR1cm4gZGVmZXJyZWQucmVqZWN0KGVycik7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICR0aW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAkc2NvcGUucmV0cnlXaXRoUHJvbWlzZShwcm9taXNlLCBhcmdzLCBtYXhUcmllcyAtIDEsIGNvbnRleHQsIGRlZmVycmVkKTtcbiAgICAgICAgICAgIH0sIDIwMDApO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbiAgICB9O1xuICB9KTtcbiIsIi8qZ2xvYmFscyBhbmd1bGFyLCB3aW5kb3cgKi9cbiBhbmd1bGFyLm1vZHVsZSgnaW5zaWRlci5jb250cm9sbGVycycpXG4gIC5jb250cm9sbGVyKCdCdXlzQ3RybCcsIGZ1bmN0aW9uICgkc3RhdGUsICRzY29wZSwgQnV5SWRlYVNlcnZpY2UpIHtcbiAgICAkc2NvcGUucmVmcmVzaCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICRzY29wZS5yZXRyeVdpdGhQcm9taXNlKEJ1eUlkZWFTZXJ2aWNlLmZpbmRBbGwsIFtdLCAzLCB0aGlzKVxuICAgICAgICAudGhlbihmdW5jdGlvbiAodHJhZGVzKSB7XG4gICAgICAgICAgY29uc29sZS5sb2codHJhZGVzKTtcbiAgICAgICAgICAkc2NvcGUudHJhZGVzID0gdHJhZGVzO1xuICAgICAgICB9LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgLy8gVE9ETzogc2hvdyBubyB0cmFkZXMgZm91bmQgdGhpbmdcbiAgICAgICAgICBjb25zb2xlLmxvZyhcInNhZCBmYWNlXCIpO1xuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgJHNjb3BlLnJlZnJlc2goKTtcblxuICAgICRzY29wZS5zaG93VHJhZGUgPSBmdW5jdGlvbiAoaWQpIHtcbiAgICAgICRzdGF0ZS5nbygnYXBwLnRyYWRlJywge1xuICAgICAgICBpZDogaWRcbiAgICAgIH0pO1xuICAgIH07XG5cbiAgICAkc2NvcGUuJG9uKCdhdXRoY2hhbmdlJywgZnVuY3Rpb24gKCkge1xuICAgICAgJHNjb3BlLnJlZnJlc2goKTtcbiAgICB9KTtcbiAgfSk7XG4iLCIvKmdsb2JhbHMgYW5ndWxhciwgd2luZG93ICovXG5hbmd1bGFyLm1vZHVsZSgnaW5zaWRlci5jb250cm9sbGVycycpXG4gIC5jb250cm9sbGVyKCdDb21wYW55Q3RybCcsIGZ1bmN0aW9uICgkc3RhdGUsICRzY29wZSwgJHN0YXRlUGFyYW1zLCBDb21wYW55U2VydmljZSkge1xuICAgICRzY29wZS5zaG93VHJhZGVzID0gdHJ1ZTtcblxuICAgICRzY29wZS5yZWZyZXNoID0gZnVuY3Rpb24gKCkge1xuICAgICAgJHNjb3BlLnJldHJ5V2l0aFByb21pc2UoQ29tcGFueVNlcnZpY2UuZmluZEJ5SWQsIFskc3RhdGVQYXJhbXMuaWRdLCAzLCB0aGlzKVxuICAgICAgICAudGhlbihmdW5jdGlvbiAoY29tcGFueURhdGEpIHtcbiAgICAgICAgICAkc2NvcGUuY29tcGFueSA9IGNvbXBhbnlEYXRhO1xuICAgICAgICB9LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coXCJzYWQgZmFjZVwiKTtcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgICRzY29wZS5yZWZyZXNoKCk7XG5cbiAgICAkc2NvcGUuZ29Ub0luc2lkZXIgPSBmdW5jdGlvbiAoaW5zaWRlcikge1xuICAgICAgJHN0YXRlLmdvKCdhcHAuaW5zaWRlcicsIHtcbiAgICAgICAgaWQ6IGluc2lkZXIuaWRcbiAgICAgIH0pO1xuICAgIH07XG5cbiAgICAkc2NvcGUuZ29Ub0Zvcm00ID0gZnVuY3Rpb24gKGZvcm00KSB7XG4gICAgICAkc3RhdGUuZ28oJ2FwcC5mb3JtNCcsIHtcbiAgICAgICAgaWQ6IGZvcm00LmlkXG4gICAgICB9KTtcbiAgICB9O1xuICB9KTtcbiIsIi8qZ2xvYmFscyBhbmd1bGFyLCB3aW5kb3cgKi9cbmFuZ3VsYXIubW9kdWxlKCdpbnNpZGVyLmNvbnRyb2xsZXJzJylcbiAgLmNvbnRyb2xsZXIoJ0Zvcm00Q3RybCcsIGZ1bmN0aW9uICgkc2NvcGUsICRzdGF0ZVBhcmFtcywgRm9ybTRTZXJ2aWNlKSB7XG4gICAgJHNjb3BlLnJlZnJlc2ggPSBmdW5jdGlvbiAoKSB7XG4gICAgICAkc2NvcGUucmV0cnlXaXRoUHJvbWlzZShGb3JtNFNlcnZpY2UuZmluZEJ5SWQsIFskc3RhdGVQYXJhbXMuaWRdLCAzLCB0aGlzKVxuICAgICAgICAudGhlbihmdW5jdGlvbiAoZm9ybTREYXRhKSB7XG4gICAgICAgICAgJHNjb3BlLmZvcm00ID0gZm9ybTREYXRhO1xuICAgICAgICB9LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coXCJzYWQgZmFjZVwiKTtcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgICRzY29wZS5uYXZpZ2F0ZVRvID0gZnVuY3Rpb24gKHVybCkge1xuICAgICAgd2luZG93Lm9wZW4odXJsLCAnX2JsYW5rJywgJ2xvY2F0aW9uPXllcycpO1xuICAgIH07XG5cbiAgICAkc2NvcGUucmVmcmVzaCgpO1xuICB9KTtcbiIsIi8qZ2xvYmFscyBhbmd1bGFyLCB3aW5kb3cgKi9cbmFuZ3VsYXIubW9kdWxlKCdpbnNpZGVyLmNvbnRyb2xsZXJzJylcbiAgLmNvbnRyb2xsZXIoJ0luc2lkZXJDdHJsJywgZnVuY3Rpb24gKCRzdGF0ZSwgJHNjb3BlLCAkc3RhdGVQYXJhbXMsIEluc2lkZXJTZXJ2aWNlKSB7XG4gICAgJHNjb3BlLnNob3dUcmFkZXMgPSB0cnVlO1xuXG4gICAgJHNjb3BlLnJlZnJlc2ggPSBmdW5jdGlvbiAoKSB7XG4gICAgICAkc2NvcGUucmV0cnlXaXRoUHJvbWlzZShJbnNpZGVyU2VydmljZS5maW5kQnlJZCwgWyRzdGF0ZVBhcmFtcy5pZF0sIDMsIHRoaXMpXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uIChpbnNpZGVyRGF0YSkge1xuICAgICAgICAgICRzY29wZS5pbnNpZGVyID0gaW5zaWRlckRhdGE7XG4gICAgICAgIH0sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBjb25zb2xlLmxvZyhcInNhZCBmYWNlXCIpO1xuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgJHNjb3BlLnJlZnJlc2goKTtcblxuICAgICRzY29wZS5nb1RvQ29tcGFueSA9IGZ1bmN0aW9uIChjb21wYW55KSB7XG4gICAgICAkc3RhdGUuZ28oJ2FwcC5jb21wYW55Jywge1xuICAgICAgICBpZDogY29tcGFueS5pZFxuICAgICAgfSk7XG4gICAgfTtcbiAgICAkc2NvcGUuZ29Ub0Zvcm00ID0gZnVuY3Rpb24gKGZvcm00KSB7XG4gICAgICAkc3RhdGUuZ28oJ2FwcC5mb3JtNCcsIHtcbiAgICAgICAgaWQ6IGZvcm00LmlkXG4gICAgICB9KTtcbiAgICB9O1xuICB9KTtcbiIsIi8qZ2xvYmFscyBhbmd1bGFyLCB3aW5kb3cgKi9cbmFuZ3VsYXIubW9kdWxlKCdpbnNpZGVyLmNvbnRyb2xsZXJzJylcbiAgLmNvbnRyb2xsZXIoJ1NlYXJjaEN0cmwnLCBmdW5jdGlvbiAoJHN0YXRlLCAkc2NvcGUsIFNlYXJjaFNlcnZpY2UpIHtcbiAgICAkc2NvcGUua2V5d29yZCA9IFwiXCI7XG4gICAgJHNjb3BlLnJlc3VsdHMgPSBbXTtcbiAgICAkc2NvcGUuc2VhcmNoID0gZnVuY3Rpb24gKCkge1xuICAgICAgU2VhcmNoU2VydmljZS5zZWFyY2goJHNjb3BlLmtleXdvcmQpLnRoZW4oZnVuY3Rpb24gKHJlc3ApIHtcbiAgICAgICAgJHNjb3BlLnJlc3VsdHMgPSByZXNwLmRhdGE7XG4gICAgICB9KTtcbiAgICB9O1xuXG4gICAgJHNjb3BlLm9wZW5SZXN1bHQgPSBmdW5jdGlvbiAocmVzdWx0KSB7XG4gICAgICB2YXIgd2hlcmUgPSAocmVzdWx0WzFdID09PSAnSW5zaWRlcicpID8gJ2FwcC5pbnNpZGVyJyA6ICdhcHAuY29tcGFueSc7XG4gICAgICAkc3RhdGUuZ28od2hlcmUsIHtcbiAgICAgICAgaWQ6IHJlc3VsdFswXVxuICAgICAgfSk7XG4gICAgfTtcbiAgICAkc2NvcGUuc2VhcmNoKCk7XG4gIH0pO1xuIiwiLypnbG9iYWxzIGFuZ3VsYXIgKi9cbmFuZ3VsYXIubW9kdWxlKCdpbnNpZGVyLmNvbnRyb2xsZXJzJylcbiAgLmNvbnRyb2xsZXIoJ1NldHRpbmdzQ3RybCcsIGZ1bmN0aW9uICgpIHtcbiAgICBjb25zb2xlLmxvZyhcInNldHRpbmdzIGNvbnRyb2xsZXJcIik7XG4gIH0pO1xuIiwiLypnbG9iYWxzIGFuZ3VsYXIsIHdpbmRvdyAqL1xuYW5ndWxhci5tb2R1bGUoJ2luc2lkZXIuY29udHJvbGxlcnMnKVxuIC5jb250cm9sbGVyKCdUb2RheXNCdXlzQ3RybCcsIGZ1bmN0aW9uICgkc3RhdGUsICRzY29wZSwgQnV5SWRlYVNlcnZpY2UpIHtcbiAgICAkc2NvcGUudHJhZGVzID0gW107XG5cbiAgICAkc2NvcGUucmVmcmVzaCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICRzY29wZS5yZXRyeVdpdGhQcm9taXNlKEJ1eUlkZWFTZXJ2aWNlLmZpbmRUb2RheXMsIFtdLCAzLCB0aGlzKVxuICAgICAgICAudGhlbihmdW5jdGlvbiAodHJhZGVzKSB7XG4gICAgICAgICAgJHNjb3BlLnRyYWRlcyA9IHRyYWRlcztcbiAgICAgICAgfSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgIGNvbnNvbGUubG9nKFwic2FkIGZhY2VcIik7XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICAkc2NvcGUucmVmcmVzaCgpO1xuXG4gICAgJHNjb3BlLnNob3dUcmFkZSA9IGZ1bmN0aW9uIChpZCkge1xuICAgICAgJHN0YXRlLmdvKCdhcHAudHJhZGUnLCB7XG4gICAgICAgIGlkOiBpZFxuICAgICAgfSk7XG4gICAgfTtcblxuICAgICRzY29wZS4kb24oJ2F1dGhjaGFuZ2UnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAkc2NvcGUucmVmcmVzaCgpO1xuICAgIH0pO1xuICB9KTtcblxuIiwiLypnbG9iYWxzIGFuZ3VsYXIsIHdpbmRvdywgZG9jdW1lbnQgKi9cbmFuZ3VsYXIubW9kdWxlKCdpbnNpZGVyLmNvbnRyb2xsZXJzJylcbiAgLmNvbnRyb2xsZXIoJ1RyYWRlQ3RybCcsIGZ1bmN0aW9uICgkdGltZW91dCwgJGlvbmljUG9wdXAsICRzY29wZSwgJHN0YXRlUGFyYW1zLCBCdXlJZGVhU2VydmljZSwgQ29tbWVudFNlcnZpY2UsIEF1dGhTZXJ2aWNlKSB7XG4gICAgJHNjb3BlLmNvbW1lbnREYXRhID0ge307XG4gICAgJHNjb3BlLnNob3dDb21tZW50Qm94ID0gZmFsc2U7XG5cbiAgICAkc2NvcGUubmF2aWdhdGVUbyA9IGZ1bmN0aW9uICh1cmwpIHtcbiAgICAgIHdpbmRvdy5vcGVuKHVybCwgJ19ibGFuaycsICdsb2NhdGlvbj15ZXMnKTtcbiAgICB9O1xuXG4gICAgJHNjb3BlLmZvY3VzT25Db21tZW50Qm9keSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICR0aW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NvbW1lbnQtYm9keScpLmZvY3VzKCk7XG4gICAgICB9LCAxNTApO1xuICAgIH07XG5cbiAgICAkc2NvcGUuZmV0Y2hBdHRlbXB0cyA9IDA7XG4gICAgJHNjb3BlLnJlZnJlc2ggPSBmdW5jdGlvbiAoKSB7XG4gICAgICAkc2NvcGUucmV0cnlXaXRoUHJvbWlzZShCdXlJZGVhU2VydmljZS5maW5kQnlJZCwgWyRzdGF0ZVBhcmFtcy5pZF0sIDMsIHRoaXMpXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uICh0cmFkZSkge1xuICAgICAgICAgICRzY29wZS50cmFkZSA9IHRyYWRlO1xuICAgICAgICB9LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coXCJzYWQgZmFjZVwiKTtcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgICRzY29wZS5yZWZyZXNoKCk7XG5cbiAgICAkc2NvcGUudXNlcklzQXV0aG9yT2YgPSBmdW5jdGlvbiAoY29tbWVudCkge1xuICAgICAgcmV0dXJuIGNvbW1lbnQuYXV0aG9yX2VtYWlsID09PSBBdXRoU2VydmljZS5jdXJyZW50VXNlcigpLmVtYWlsO1xuICAgIH07XG5cbiAgICAkc2NvcGUuYWRkQ29tbWVudCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICRzY29wZS5jb21tZW50RGF0YS5pZGVhX2lkID0gJHNjb3BlLnRyYWRlLmlkO1xuICAgICAgQ29tbWVudFNlcnZpY2UuYWRkQ29tbWVudCgkc2NvcGUuY29tbWVudERhdGEpLnRoZW4oZnVuY3Rpb24gKGNvbW1lbnQpIHtcbiAgICAgICAgJHNjb3BlLnRyYWRlLmNvbW1lbnRzLnVuc2hpZnQoY29tbWVudCk7XG4gICAgICAgICRzY29wZS5jb21tZW50RGF0YSA9IHt9O1xuICAgICAgfSwgZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgICAgaWYgKGRhdGEuc3RhdHVzID09PSA0MDEpIHtcbiAgICAgICAgICAkc2NvcGUuc2hvd0NvbW1lbnRCb3ggPSB0cnVlO1xuICAgICAgICAgICRzY29wZS5sb2dpbigpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9O1xuXG4gICAgJHNjb3BlLnJlbW92ZUNvbW1lbnQgPSBmdW5jdGlvbiAoY29tbWVudCkge1xuICAgICAgaWYgKCEkc2NvcGUudXNlcklzQXV0aG9yT2YoY29tbWVudCkpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgdmFyIG15UG9wdXAgPSAkaW9uaWNQb3B1cC5zaG93KHtcbiAgICAgICAgdGVtcGxhdGU6ICcnLFxuICAgICAgICB0aXRsZTogJ0FyZSB5b3Ugc3VyZSB5b3Ugd2FudCB0byBkZWxldGUgeW91ciBjb21tZW50PycsXG4gICAgICAgIHN1YlRpdGxlOiAnJyxcbiAgICAgICAgc2NvcGU6ICRzY29wZSxcbiAgICAgICAgYnV0dG9uczogW3tcbiAgICAgICAgICB0ZXh0OiAnQ2FuY2VsJ1xuICAgICAgICB9LCB7XG4gICAgICAgICAgdGV4dDogJzxiPkRlbGV0ZTwvYj4nLFxuICAgICAgICAgIHR5cGU6ICdidXR0b24tYXNzZXJ0aXZlJyxcbiAgICAgICAgICBvblRhcDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgQ29tbWVudFNlcnZpY2UucmVtb3ZlQ29tbWVudChjb21tZW50LmlkKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgdmFyIGNvbW1lbnRJbmRleCA9ICRzY29wZS50cmFkZS5jb21tZW50cy5pbmRleE9mKGNvbW1lbnQpO1xuICAgICAgICAgICAgICAkc2NvcGUudHJhZGUuY29tbWVudHMuc3BsaWNlKGNvbW1lbnRJbmRleCwgMSk7XG4gICAgICAgICAgICAgIG15UG9wdXAuY2xvc2UoKTtcbiAgICAgICAgICAgIH0sIGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKGRhdGEpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4gXCJ0ZXN0XCI7XG4gICAgICAgICAgfVxuICAgICAgICB9LCBdXG4gICAgICB9KTtcbiAgICAgIC8vIG15UG9wdXAudGhlbihmdW5jdGlvbihyZXMpIHtcbiAgICAgIC8vICAgY29uc29sZS5sb2coJ1RhcHBlZCEnLCByZXMpO1xuICAgICAgLy8gfSk7XG4gICAgICAkdGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgIG15UG9wdXAuY2xvc2UoKTsgLy9jbG9zZSB0aGUgcG9wdXAgYWZ0ZXIgMyBzZWNvbmRzIGZvciBzb21lIHJlYXNvblxuICAgICAgfSwgMzAwMCk7XG4gICAgfTtcbiAgfSk7XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
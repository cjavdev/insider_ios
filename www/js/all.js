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
      });
    // if none of the above states are matched, use this as the fallback
    $urlRouterProvider.otherwise('/app/buys');
  })
  .run(function (loc, $http, $ionicPlatform, $cordovaPush, $rootScope) {
    $rootScope.currentUser = {};
    var token = window.localStorage.getItem('auth_token');
    if (token !== null) {
      $http.defaults.headers.common['Auth-Token-X'] = token;
    }
    $http.get(loc.apiBase + '/api/v1/sessions/validate.json')
      .then(function (resp) {
        console.log(resp.data);
        $rootScope.currentUser = resp.data.user;
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

    return {
      doLogin: doLogin,
      doLogout: doLogout,
      loggedIn: loggedIn,
      currentUser: currentUser
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
          console.log(filing);
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
            console.log("giving up...");
            $ionicLoading.hide();
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
    $scope.refresh = function () {
      $scope.retryWithPromise(InsiderService.findById, [$stateParams.id], 3, this)
        .then(function (insiderData) {
          $scope.insider = insiderData;
        }, function () {
          console.log("sad face");
        });
    };

    $scope.refresh();

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


/*globals angular, window */
angular.module('insider.controllers')
  .controller('TradeCtrl', function ($timeout, $ionicPopup, $rootScope, $scope, $stateParams, BuyIdeaService, CommentService, AuthService) {
    $scope.commentData = {};
    $scope.showCommentBox = false;

    $scope.navigateTo = function (url) {
      window.open(url, '_blank', 'location=yes');
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
      console.log(comment.author_email === AuthService.currentUser().email);
      return comment.author_email === $rootScope.currentUser.email;
    };

    $scope.addComment = function () {
      $scope.commentData.idea_id = $scope.trade.id;
      CommentService.addComment($scope.commentData).then(function (comment) {
        $scope.trade.comments.unshift(comment);
        $scope.commentData = {};
      }, function (data) {
        if (data.status === 401) {
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImZpbHRlcnMuanMiLCJhdXRoX3NlcnZpY2UuanMiLCJjb21tZW50X3Nlcml2Y2UuanMiLCJjb21wYW55X3NlcnZpY2UuanMiLCJmb3JtNF9zZXJ2aWNlLmpzIiwiaWRlYV9zZXJ2aWNlLmpzIiwiaW5zaWRlcl9zZXJ2aWNlLmpzIiwic2VhcmNoX3Nlcml2Y2UuanMiLCJhcHBfY29udHJvbGxlci5qcyIsImJ1eXNfY29udHJvbGxlci5qcyIsImNvbXBhbnlfY29udHJvbGxlci5qcyIsImZvcm00X2NvbnRyb2xsZXIuanMiLCJpbnNpZGVyX2NvbnRyb2xsZXIuanMiLCJzZWFyY2hfY29udHJvbGxlci5qcyIsInRvZGF5c19idXlzX2NvbnRyb2xsZXIuanMiLCJ0cmFkZV9jb250cm9sbGVyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN2SkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMxQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDM0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN4Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3RCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDdkVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN6QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzVCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2xCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNyQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMzQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJhbGwuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKmdsb2JhbCB3aW5kb3csIGNvcmRvdmEsIGFuZ3VsYXIgKi9cbnZhciBhcHAgPSBhbmd1bGFyLm1vZHVsZSgnaW5zaWRlcicsIFtcbiAgICAnaW9uaWMnLFxuICAgICdpbnNpZGVyLnNlcnZpY2VzJyxcbiAgICAnaW5zaWRlci5jb250cm9sbGVycycsXG4gICAgJ2luc2lkZXIuZmlsdGVycycsXG4gICAgJ25nQ29yZG92YSdcbiAgXSlcbiAgLmNvbnN0YW50KCdsb2MnLCB7XG4gICAgLy9hcGlCYXNlOiAnaHR0cDovL2xvY2FsaG9zdDozMDAwJ1xuICAgIGFwaUJhc2U6ICdodHRwczovL2luc2lkZXJhaS5jb20nXG4gIH0pXG4gIC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyLCAkdXJsUm91dGVyUHJvdmlkZXIpIHtcbiAgICAkc3RhdGVQcm92aWRlclxuICAgICAgLnN0YXRlKCdhcHAnLCB7XG4gICAgICAgIHVybDogJy9hcHAnLFxuICAgICAgICBhYnN0cmFjdDogdHJ1ZSxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICd0ZW1wbGF0ZXMvbWVudS5odG1sJyxcbiAgICAgICAgY29udHJvbGxlcjogJ0FwcEN0cmwnXG4gICAgICB9KVxuICAgICAgLnN0YXRlKCdhcHAuYnV5cycsIHtcbiAgICAgICAgdXJsOiAnL2J1eXMnLFxuICAgICAgICB2aWV3czoge1xuICAgICAgICAgICdtZW51Q29udGVudCc6IHtcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAndGVtcGxhdGVzL2J1eXMuaHRtbCcsXG4gICAgICAgICAgICBjb250cm9sbGVyOiAnQnV5c0N0cmwnXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KVxuICAgICAgLnN0YXRlKCdhcHAudG9kYXknLCB7XG4gICAgICAgIHVybDogJy90b2RheScsXG4gICAgICAgIHZpZXdzOiB7XG4gICAgICAgICAgJ21lbnVDb250ZW50Jzoge1xuICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICd0ZW1wbGF0ZXMvdG9kYXkuaHRtbCcsXG4gICAgICAgICAgICBjb250cm9sbGVyOiAnVG9kYXlzQnV5c0N0cmwnXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KVxuICAgICAgLnN0YXRlKCdhcHAudHJhZGUnLCB7XG4gICAgICAgIHVybDogJy90cmFkZXMvOmlkJyxcbiAgICAgICAgdmlld3M6IHtcbiAgICAgICAgICAnbWVudUNvbnRlbnQnOiB7XG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogJ3RlbXBsYXRlcy90cmFkZS5odG1sJyxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdUcmFkZUN0cmwnXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KVxuICAgICAgLnN0YXRlKCdhcHAuaW5zaWRlcicsIHtcbiAgICAgICAgdXJsOiAnL2luc2lkZXJzLzppZCcsXG4gICAgICAgIHZpZXdzOiB7XG4gICAgICAgICAgJ21lbnVDb250ZW50Jzoge1xuICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICd0ZW1wbGF0ZXMvaW5zaWRlci5odG1sJyxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdJbnNpZGVyQ3RybCdcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgICAuc3RhdGUoJ2FwcC5mb3JtNCcsIHtcbiAgICAgICAgdXJsOiAnL2Zvcm00cy86aWQnLFxuICAgICAgICB2aWV3czoge1xuICAgICAgICAgICdtZW51Q29udGVudCc6IHtcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAndGVtcGxhdGVzL2Zvcm00Lmh0bWwnLFxuICAgICAgICAgICAgY29udHJvbGxlcjogJ0Zvcm00Q3RybCdcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgICAuc3RhdGUoJ2FwcC5jb21wYW55Jywge1xuICAgICAgICB1cmw6ICcvY29tcGFuaWVzLzppZCcsXG4gICAgICAgIHZpZXdzOiB7XG4gICAgICAgICAgJ21lbnVDb250ZW50Jzoge1xuICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICd0ZW1wbGF0ZXMvY29tcGFueS5odG1sJyxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdDb21wYW55Q3RybCdcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgICAuc3RhdGUoJ2FwcC5zZWFyY2gnLCB7XG4gICAgICAgIHVybDogJy9zZWFyY2gnLFxuICAgICAgICB2aWV3czoge1xuICAgICAgICAgICdtZW51Q29udGVudCc6IHtcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAndGVtcGxhdGVzL3NlYXJjaC5odG1sJyxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdTZWFyY2hDdHJsJ1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgLy8gaWYgbm9uZSBvZiB0aGUgYWJvdmUgc3RhdGVzIGFyZSBtYXRjaGVkLCB1c2UgdGhpcyBhcyB0aGUgZmFsbGJhY2tcbiAgICAkdXJsUm91dGVyUHJvdmlkZXIub3RoZXJ3aXNlKCcvYXBwL2J1eXMnKTtcbiAgfSlcbiAgLnJ1bihmdW5jdGlvbiAobG9jLCAkaHR0cCwgJGlvbmljUGxhdGZvcm0sICRjb3Jkb3ZhUHVzaCwgJHJvb3RTY29wZSkge1xuICAgICRyb290U2NvcGUuY3VycmVudFVzZXIgPSB7fTtcbiAgICB2YXIgdG9rZW4gPSB3aW5kb3cubG9jYWxTdG9yYWdlLmdldEl0ZW0oJ2F1dGhfdG9rZW4nKTtcbiAgICBpZiAodG9rZW4gIT09IG51bGwpIHtcbiAgICAgICRodHRwLmRlZmF1bHRzLmhlYWRlcnMuY29tbW9uWydBdXRoLVRva2VuLVgnXSA9IHRva2VuO1xuICAgIH1cbiAgICAkaHR0cC5nZXQobG9jLmFwaUJhc2UgKyAnL2FwaS92MS9zZXNzaW9ucy92YWxpZGF0ZS5qc29uJylcbiAgICAgIC50aGVuKGZ1bmN0aW9uIChyZXNwKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKHJlc3AuZGF0YSk7XG4gICAgICAgICRyb290U2NvcGUuY3VycmVudFVzZXIgPSByZXNwLmRhdGEudXNlcjtcbiAgICAgIH0sIGZ1bmN0aW9uIChyZXNwKSB7XG4gICAgICAgIHdpbmRvdy5sb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbSgnYXV0aF90b2tlbicpO1xuICAgICAgICBkZWxldGUgJGh0dHAuZGVmYXVsdHMuaGVhZGVycy5jb21tb25bJ0F1dGgtVG9rZW4tWCddO1xuICAgICAgICBjb25zb2xlLmxvZyhyZXNwLmRhdGEubWVzc2FnZSk7XG4gICAgICB9KTtcblxuICAgICRpb25pY1BsYXRmb3JtLnJlYWR5KGZ1bmN0aW9uICgpIHtcbiAgICAgIC8vIEhpZGUgdGhlIGFjY2Vzc29yeSBiYXIgYnkgZGVmYXVsdCAocmVtb3ZlIHRoaXMgdG8gc2hvdyB0aGUgYWNjZXNzb3J5IGJhciBhYm92ZSB0aGUga2V5Ym9hcmRcbiAgICAgIC8vIGZvciBmb3JtIGlucHV0cylcbiAgICAgIGlmICh3aW5kb3cuY29yZG92YSAmJiB3aW5kb3cuY29yZG92YS5wbHVnaW5zLktleWJvYXJkKSB7XG4gICAgICAgIGNvcmRvdmEucGx1Z2lucy5LZXlib2FyZC5oaWRlS2V5Ym9hcmRBY2Nlc3NvcnlCYXIodHJ1ZSk7XG4gICAgICB9XG4gICAgICBpZiAod2luZG93LlN0YXR1c0Jhcikge1xuICAgICAgICAvLyBvcmcuYXBhY2hlLmNvcmRvdmEuc3RhdHVzYmFyIHJlcXVpcmVkXG4gICAgICAgIHdpbmRvdy5TdGF0dXNCYXIuc3R5bGVMaWdodENvbnRlbnQoKTtcbiAgICAgIH1cblxuICAgICAgdmFyIGlvc0NvbmZpZyA9IHtcbiAgICAgICAgXCJiYWRnZVwiOiBcInRydWVcIixcbiAgICAgICAgXCJzb3VuZFwiOiBcInRydWVcIixcbiAgICAgICAgXCJhbGVydFwiOiBcInRydWVcIixcbiAgICAgICAgXCJlY2JcIjogXCJvbk5vdGlmaWNhdGlvbkFQTlwiXG4gICAgICB9O1xuXG4gICAgICBpZih3aW5kb3cuY29yZG92YSkge1xuICAgICAgICAkY29yZG92YVB1c2gucmVnaXN0ZXIoaW9zQ29uZmlnKS50aGVuKGZ1bmN0aW9uIChyZXN1bHQpIHtcbiAgICAgICAgICAkcm9vdFNjb3BlLmRldmljZVRva2VuID0gcmVzdWx0O1xuICAgICAgICB9LCBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coXCJub3QgYWJsZSB0byBzZW5kIHB1c2hcIiwgZXJyKTtcbiAgICAgICAgfSk7XG4gICAgICAgIC8vICRjb3Jkb3ZhUHVzaC51bnJlZ2lzdGVyKG9wdGlvbnMpLnRoZW4oZnVuY3Rpb24ocmVzdWx0KSB7XG4gICAgICAgIC8vICAgYWxlcnQoXCJ1bnJlZ2lzdGVyXCIpO1xuICAgICAgICAvLyAgIGFsZXJ0KHJlc3VsdCk7XG4gICAgICAgIC8vICAgYWxlcnQoYXJndW1lbnRzKTtcbiAgICAgICAgLy8gICAgIC8vIFN1Y2Nlc3MhXG4gICAgICAgIC8vIH0sIGZ1bmN0aW9uKGVycikge1xuICAgICAgICAvLyAgIGFsZXJ0KFwiZXJyb3JcIik7XG4gICAgICAgIC8vICAgYWxlcnQoZXJyKTtcbiAgICAgICAgLy8gICAgIC8vIEFuIGVycm9yIG9jY3VyZWQuIFNob3cgYSBtZXNzYWdlIHRvIHRoZSB1c2VyXG4gICAgICAgIC8vIH0pO1xuICAgICAgICAvL1xuICAgICAgICAvLyAvLyBpT1Mgb25seVxuICAgICAgICAvLyAkY29yZG92YVB1c2guc2V0QmFkZ2VOdW1iZXIoMikudGhlbihmdW5jdGlvbihyZXN1bHQpIHtcbiAgICAgICAgLy8gICBhbGVydChcInNldCBiYWRnZSB0byAyIVwiKTtcbiAgICAgICAgLy8gICBhbGVydChyZXN1bHQpO1xuICAgICAgICAvLyAgIGFsZXJ0KGFyZ3VtZW50cyk7XG4gICAgICAgIC8vICAgICAvLyBTdWNjZXNzIVxuICAgICAgICAvLyB9LCBmdW5jdGlvbihlcnIpIHtcbiAgICAgICAgLy8gICBhbGVydChcImVycm9yXCIpO1xuICAgICAgICAvLyAgIGFsZXJ0KGVycik7XG4gICAgICAgIC8vICAgICAvLyBBbiBlcnJvciBvY2N1cmVkLiBTaG93IGEgbWVzc2FnZSB0byB0aGUgdXNlclxuICAgICAgICAvLyB9KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfSk7XG4iLCIvKmdsb2JhbHMgYW5ndWxhciwgbWQ1ICovXG5hbmd1bGFyLm1vZHVsZSgnaW5zaWRlci5maWx0ZXJzJywgW10pXG4gIC5maWx0ZXIoJ2dyYXZhdGFyJywgZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBmdW5jdGlvbiAoZW1haWwpIHtcbiAgICAgIHJldHVybiBcImh0dHA6Ly93d3cuZ3JhdmF0YXIuY29tL2F2YXRhci9cIiArIG1kNShlbWFpbCk7XG4gICAgfTtcbiAgfSk7XG4iLCIvKmdsb2JhbHMgd2luZG93LCBhbmd1bGFyLCBfICovXG5hbmd1bGFyLm1vZHVsZSgnaW5zaWRlci5zZXJ2aWNlcycsIFtdKVxuICAuZmFjdG9yeSgnQXV0aFNlcnZpY2UnLCBmdW5jdGlvbiAobG9jLCAkcSwgJGh0dHApIHtcbiAgICB2YXIgdXNlciA9IG51bGw7XG5cbiAgICB2YXIgcmVhZFN0b3JlZFVzZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgc3RvcmVkVXNlciA9IHdpbmRvdy5sb2NhbFN0b3JhZ2UuZ2V0SXRlbSgndXNlcicpO1xuICAgICAgdHJ5IHtcbiAgICAgICAgaWYgKHN0b3JlZFVzZXIpIHtcbiAgICAgICAgICB1c2VyID0gSlNPTi5wYXJzZShzdG9yZWRVc2VyKTtcbiAgICAgICAgfVxuICAgICAgfSBjYXRjaCAoaWdub3JlKSB7IC8qIGZhaWwgc2lsZW50bHkqLyB9XG4gICAgfTtcblxuICAgIHJlYWRTdG9yZWRVc2VyKCk7XG5cbiAgICB2YXIgY3VycmVudFVzZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICBpZiAoIXVzZXIpIHtcbiAgICAgICAgdXNlciA9IHJlYWRTdG9yZWRVc2VyKCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gdXNlcjtcbiAgICB9O1xuXG4gICAgdmFyIHNhdmVVc2VyID0gZnVuY3Rpb24gKHVzZXJUb1NhdmUpIHtcbiAgICAgIHVzZXIgPSB1c2VyVG9TYXZlO1xuICAgICAgd2luZG93LmxvY2FsU3RvcmFnZS5zZXRJdGVtKCd1c2VyJywgSlNPTi5zdHJpbmdpZnkodXNlcikpO1xuICAgICAgJGh0dHAuZGVmYXVsdHMuaGVhZGVycy5jb21tb25bJ0F1dGgtVG9rZW4tWCddID0gdXNlci5hdXRoX3Rva2VuO1xuICAgIH07XG5cbiAgICB2YXIgY2xlYXJVc2VyID0gZnVuY3Rpb24gKCkge1xuICAgICAgd2luZG93LmxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKCd1c2VyJyk7XG4gICAgICAkaHR0cC5kZWZhdWx0cy5oZWFkZXJzLmNvbW1vblsnQXV0aC1Ub2tlbi1YJ10gPSB1bmRlZmluZWQ7XG4gICAgICB1c2VyID0gbnVsbDtcbiAgICB9O1xuXG4gICAgdmFyIGxvZ2dlZEluID0gZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuICEhY3VycmVudFVzZXIoKTtcbiAgICB9O1xuXG4gICAgdmFyIGRvTG9naW4gPSBmdW5jdGlvbiAodXNlclBhcmFtcywgZGV2aWNlVG9rZW4pIHtcbiAgICAgIHZhciBwYXJhbXMgPSB7XG4gICAgICAgIHVzZXI6IHVzZXJQYXJhbXMsXG4gICAgICAgIGRldmljZToge1xuICAgICAgICAgIHBsYXRmb3JtOiAnaW9zJyxcbiAgICAgICAgICB0b2tlbjogZGV2aWNlVG9rZW5cbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgdmFyIGRlZmVycmVkID0gJHEuZGVmZXIoKTtcblxuICAgICAgJGh0dHAucG9zdChsb2MuYXBpQmFzZSArICcvYXBpL3YxL3VzZXJzL3NpZ25faW4uanNvbicsIHBhcmFtcykuXG4gICAgICBzdWNjZXNzKGZ1bmN0aW9uICh1c2VyRGF0YSkge1xuICAgICAgICBzYXZlVXNlcih1c2VyRGF0YSk7XG4gICAgICAgIGRlZmVycmVkLnJlc29sdmUodXNlckRhdGEpO1xuICAgICAgfSkuXG4gICAgICBlcnJvcihmdW5jdGlvbiAoZGF0YSkge1xuICAgICAgICBkZWZlcnJlZC5yZWplY3QoZGF0YSk7XG4gICAgICB9KTtcblxuICAgICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG4gICAgfTtcblxuICAgIHZhciBkb0xvZ291dCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIGNsZWFyVXNlcigpO1xuICAgICAgcmV0dXJuICRodHRwLmRlbGV0ZShsb2MuYXBpQmFzZSArICcvYXBpL3YxL3VzZXJzL3NpZ25fb3V0Lmpzb24nKTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIGRvTG9naW46IGRvTG9naW4sXG4gICAgICBkb0xvZ291dDogZG9Mb2dvdXQsXG4gICAgICBsb2dnZWRJbjogbG9nZ2VkSW4sXG4gICAgICBjdXJyZW50VXNlcjogY3VycmVudFVzZXJcbiAgICB9O1xuICB9KTtcbiIsIi8qZ2xvYmFscyBhbmd1bGFyLCBfICovXG5hbmd1bGFyLm1vZHVsZSgnaW5zaWRlci5zZXJ2aWNlcycpXG4gIC5mYWN0b3J5KCdDb21tZW50U2VydmljZScsIGZ1bmN0aW9uKGxvYywgJHEsICRodHRwKSB7XG4gICAgZnVuY3Rpb24gdXJsKGlkKSB7XG4gICAgICBpZihpZCkge1xuICAgICAgICByZXR1cm4gbG9jLmFwaUJhc2UgKyAnL2FwaS92MS9jb21tZW50cy8nICsgaWQgKyAnLmpzb24nO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGxvYy5hcGlCYXNlICsgJy9hcGkvdjEvY29tbWVudHMuanNvbic7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIGFkZENvbW1lbnQ6IGZ1bmN0aW9uIChwYXJhbXMpIHtcbiAgICAgICAgdmFyIGRlZmVycmVkID0gJHEuZGVmZXIoKTtcbiAgICAgICAgJGh0dHAucG9zdCh1cmwoKSwgcGFyYW1zKS50aGVuKGZ1bmN0aW9uIChyZXNwKSB7XG4gICAgICAgICAgZGVmZXJyZWQucmVzb2x2ZShyZXNwLmRhdGEpO1xuICAgICAgICB9LCBmdW5jdGlvbiAoZGF0YSkge1xuICAgICAgICAgIGRlZmVycmVkLnJlamVjdChkYXRhKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xuICAgICAgfSxcblxuICAgICAgcmVtb3ZlQ29tbWVudDogZnVuY3Rpb24gKGlkKSB7XG4gICAgICAgIHJldHVybiAkaHR0cC5kZWxldGUodXJsKGlkKSk7XG4gICAgICB9XG4gICAgfTtcbiAgfSk7XG4iLCIvKmdsb2JhbHMgYW5ndWxhciwgXyAqL1xuYW5ndWxhci5tb2R1bGUoJ2luc2lkZXIuc2VydmljZXMnKVxuICAuZmFjdG9yeSgnQ29tcGFueVNlcnZpY2UnLCBmdW5jdGlvbihsb2MsICRxLCAkaHR0cCkge1xuICAgIGZ1bmN0aW9uIHVybChpZCkge1xuICAgICBpZihpZCkge1xuICAgICAgICByZXR1cm4gbG9jLmFwaUJhc2UgKyAnL2FwaS92MS9jb21wYW5pZXMvJyArIGlkICsgJy5qc29uJztcbiAgICAgIH1cbiAgICAgIHJldHVybiBsb2MuYXBpQmFzZSArICcvYXBpL3YxL2NvbXBhbmllcy5qc29uJztcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgZmluZEJ5SWQ6IGZ1bmN0aW9uIChpZCkge1xuICAgICAgICB2YXIgZGVmZXJyZWQgPSAkcS5kZWZlcigpO1xuICAgICAgICAkaHR0cC5nZXQodXJsKGlkKSkudGhlbihmdW5jdGlvbiAocmVzcCkge1xuICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUocmVzcC5kYXRhKTtcbiAgICAgICAgfSwgZnVuY3Rpb24gKHJlc3ApIHtcbiAgICAgICAgICBkZWZlcnJlZC5yZWplY3QocmVzcC5kYXRhKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xuICAgICAgfSxcbiAgICB9O1xuICB9KTtcblxuIiwiLypnbG9iYWxzIGFuZ3VsYXIsIF8gKi9cbmFuZ3VsYXIubW9kdWxlKCdpbnNpZGVyLnNlcnZpY2VzJylcbiAgLmZhY3RvcnkoJ0Zvcm00U2VydmljZScsIGZ1bmN0aW9uKGxvYywgJHEsICRodHRwKSB7XG4gICAgZnVuY3Rpb24gdXJsKGlkKSB7XG4gICAgIGlmKGlkKSB7XG4gICAgICAgIHJldHVybiBsb2MuYXBpQmFzZSArICcvYXBpL3YxL2Zvcm00cy8nICsgaWQgKyAnLmpzb24nO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGxvYy5hcGlCYXNlICsgJy9hcGkvdjEvZm9ybTRzLmpzb24nO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICBmaW5kQnlJZDogZnVuY3Rpb24gKGlkKSB7XG4gICAgICAgIHZhciBkZWZlcnJlZCA9ICRxLmRlZmVyKCk7XG4gICAgICAgICRodHRwLmdldCh1cmwoaWQpKS50aGVuKGZ1bmN0aW9uIChyZXNwKSB7XG4gICAgICAgICAgdmFyIGZpbGluZyA9IHJlc3AuZGF0YTtcbiAgICAgICAgICB2YXIgZG9jID0gSlNPTi5wYXJzZShyZXNwLmRhdGEuZmlsaW5nKTtcbiAgICAgICAgICBmaWxpbmcubm9uRGVyaXZhdGl2ZVRyYW5zYWN0aW9ucyA9IGRvYy50cmFuc2FjdGlvbnM7XG4gICAgICAgICAgZmlsaW5nLmRlcml2YXRpdmVUcmFuc2FjdGlvbnMgPSBkb2MuZGVyaXZhdGl2ZV90cmFuc2FjdGlvbnM7XG4gICAgICAgICAgY29uc29sZS5sb2coZmlsaW5nKTtcbiAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKGZpbGluZyk7XG4gICAgICAgIH0sIGZ1bmN0aW9uIChyZXNwKSB7XG4gICAgICAgICAgZGVmZXJyZWQucmVqZWN0KHJlc3AuZGF0YSk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbiAgICAgIH0sXG4gICAgfTtcbiAgfSk7XG4iLCIvKmdsb2JhbHMgYW5ndWxhciwgXyAqL1xuYW5ndWxhci5tb2R1bGUoJ2luc2lkZXIuc2VydmljZXMnKVxuICAuZmFjdG9yeSgnQnV5SWRlYVNlcnZpY2UnLCBmdW5jdGlvbihsb2MsICRxLCAkaHR0cCkge1xuICAgIGZ1bmN0aW9uIHVybChpZCkge1xuICAgICAgaWYoaWQpIHtcbiAgICAgICAgcmV0dXJuIGxvYy5hcGlCYXNlICsgJy9hcGkvdjEvYnV5cy8nICsgaWQgKyAnLmpzb24nO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGxvYy5hcGlCYXNlICsgJy9hcGkvdjEvYnV5cy5qc29uJztcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgZmluZEFsbDogZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgZGVmZXJyZWQgPSAkcS5kZWZlcigpO1xuICAgICAgICAkaHR0cC5nZXQodXJsKCkpLnRoZW4oZnVuY3Rpb24gKHJlc3ApIHtcbiAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKHJlc3AuZGF0YSk7XG4gICAgICAgIH0sIGZ1bmN0aW9uIChyZXNwKSB7XG4gICAgICAgICAgZGVmZXJyZWQucmVqZWN0KHJlc3AuZGF0YSk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbiAgICAgIH0sXG5cbiAgICAgIGZpbmRCeUlkOiBmdW5jdGlvbiAoaWQpIHtcbiAgICAgICAgdmFyIGRlZmVycmVkID0gJHEuZGVmZXIoKTtcbiAgICAgICAgJGh0dHAuZ2V0KHVybChpZCkpLnRoZW4oZnVuY3Rpb24gKHJlc3ApIHtcbiAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKHJlc3AuZGF0YSk7XG4gICAgICAgIH0sIGZ1bmN0aW9uIChyZXNwKSB7XG4gICAgICAgICAgZGVmZXJyZWQucmVqZWN0KHJlc3AuZGF0YSk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbiAgICAgIH0sXG5cbiAgICAgIGZpbmRUb2RheXM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGRlZmVycmVkID0gJHEuZGVmZXIoKTtcbiAgICAgICAgJGh0dHAuZ2V0KHVybCgpLCB7IHBhcmFtczogeyAndG9kYXknOiB0cnVlIH0gfSkudGhlbihmdW5jdGlvbiAocmVzcCkge1xuICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUocmVzcC5kYXRhKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xuICAgICAgfVxuICAgIH07XG4gIH0pO1xuIiwiLypnbG9iYWxzIGFuZ3VsYXIsIF8gKi9cbmFuZ3VsYXIubW9kdWxlKCdpbnNpZGVyLnNlcnZpY2VzJylcbiAgLmZhY3RvcnkoJ0luc2lkZXJTZXJ2aWNlJywgZnVuY3Rpb24obG9jLCAkcSwgJGh0dHApIHtcbiAgICBmdW5jdGlvbiB1cmwoaWQpIHtcbiAgICAgaWYoaWQpIHtcbiAgICAgICAgcmV0dXJuIGxvYy5hcGlCYXNlICsgJy9hcGkvdjEvaW5zaWRlcnMvJyArIGlkICsgJy5qc29uJztcbiAgICAgIH1cbiAgICAgIHJldHVybiBsb2MuYXBpQmFzZSArICcvYXBpL3YxL2luc2lkZXJzLmpzb24nO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICBmaW5kQnlJZDogZnVuY3Rpb24gKGlkKSB7XG4gICAgICAgIHZhciBkZWZlcnJlZCA9ICRxLmRlZmVyKCk7XG4gICAgICAgICRodHRwLmdldCh1cmwoaWQpKS50aGVuKGZ1bmN0aW9uIChyZXNwKSB7XG4gICAgICAgICAgZGVmZXJyZWQucmVzb2x2ZShyZXNwLmRhdGEpO1xuICAgICAgICB9LCBmdW5jdGlvbiAocmVzcCkge1xuICAgICAgICAgIGRlZmVycmVkLnJlamVjdChyZXNwLmRhdGEpO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG4gICAgICB9LFxuICAgIH07XG4gIH0pO1xuIiwiLypnbG9iYWxzIGFuZ3VsYXIsIF8gKi9cbmFuZ3VsYXIubW9kdWxlKCdpbnNpZGVyLnNlcnZpY2VzJylcbiAgLmZhY3RvcnkoJ1NlYXJjaFNlcnZpY2UnLCBmdW5jdGlvbihsb2MsICRodHRwKSB7XG4gICAgZnVuY3Rpb24gdXJsKHEpIHtcbiAgICAgIHJldHVybiBsb2MuYXBpQmFzZSArICcvYXBpL3YxL3NlYXJjaD9xPScgKyBxO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICBzZWFyY2g6IGZ1bmN0aW9uIChrZXl3b3JkKSB7XG4gICAgICAgIHJldHVybiAkaHR0cC5nZXQodXJsKGtleXdvcmQpKTtcbiAgICAgIH1cbiAgICB9O1xuICB9KTtcbiIsIi8qZ2xvYmFscyBhbmd1bGFyLCB3aW5kb3cgKi9cbmFuZ3VsYXIubW9kdWxlKCdpbnNpZGVyLmNvbnRyb2xsZXJzJywgW10pXG4gIC5jb250cm9sbGVyKCdBcHBDdHJsJywgZnVuY3Rpb24gKCR0aW1lb3V0LCAkaW9uaWNMb2FkaW5nLCAkcSwgJHNjb3BlLCAkaW9uaWNNb2RhbCwgJHJvb3RTY29wZSwgQXV0aFNlcnZpY2UpIHtcbiAgICAkc2NvcGUubG9naW5EYXRhID0ge307XG5cbiAgICAkaW9uaWNNb2RhbC5mcm9tVGVtcGxhdGVVcmwoJ3RlbXBsYXRlcy9sb2dpbi5odG1sJywge1xuICAgICAgc2NvcGU6ICRzY29wZVxuICAgIH0pLnRoZW4oZnVuY3Rpb24gKG1vZGFsKSB7XG4gICAgICAkc2NvcGUubW9kYWwgPSBtb2RhbDtcbiAgICB9KTtcblxuICAgICRzY29wZS5jbG9zZUxvZ2luID0gZnVuY3Rpb24gKCkge1xuICAgICAgJHNjb3BlLm1vZGFsLmhpZGUoKTtcbiAgICB9O1xuXG4gICAgJHNjb3BlLmxvZ2luID0gZnVuY3Rpb24gKCkge1xuICAgICAgJHNjb3BlLm1vZGFsLnNob3coKTtcbiAgICB9O1xuXG4gICAgJHNjb3BlLmxvZ291dCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIEF1dGhTZXJ2aWNlLmRvTG9nb3V0KCkudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdChcImF1dGhjaGFuZ2VcIik7XG4gICAgICB9KTtcbiAgICB9O1xuXG4gICAgJHNjb3BlLmxvZ2dlZEluID0gZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuIEF1dGhTZXJ2aWNlLmxvZ2dlZEluKCk7XG4gICAgfTtcblxuICAgICRzY29wZS5kb0xvZ2luID0gZnVuY3Rpb24gKCkge1xuICAgICAgQXV0aFNlcnZpY2UuZG9Mb2dpbigkc2NvcGUubG9naW5EYXRhLCAkcm9vdFNjb3BlLmRldmljZVRva2VuKVxuICAgICAgICAudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KCdhdXRoY2hhbmdlJyk7XG4gICAgICAgICAgJHNjb3BlLmNsb3NlTG9naW4oKTtcbiAgICAgICAgfSwgZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgICAgICBpZiAoZGF0YS5tZXNzYWdlKSB7XG4gICAgICAgICAgICB3aW5kb3cuYWxlcnQoZGF0YS5tZXNzYWdlKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgd2luZG93LmFsZXJ0KFwiU29tZXRoaW5nIHdlbnQgd3Jvbmcgd2l0aCB5b3VyIGxvZ2luLiBUcnkgYWdhaW4uXCIpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgICRzY29wZS5yZXRyeVdpdGhQcm9taXNlID0gZnVuY3Rpb24gKHByb21pc2UsIGFyZ3MsIG1heFRyaWVzLCBjb250ZXh0LCBkZWZlcnJlZCkge1xuICAgICAgZGVmZXJyZWQgPSBkZWZlcnJlZCB8fCAkcS5kZWZlcigpO1xuICAgICAgY29udGV4dCA9IGNvbnRleHQgfHwgbnVsbDtcblxuICAgICAgJHNjb3BlLmxvYWRpbmcgPSB0cnVlO1xuICAgICAgJGlvbmljTG9hZGluZy5zaG93KHtcbiAgICAgICAgdGVtcGxhdGU6IFwiPGkgY2xhc3M9J2lvbi1sb2FkaW5nLWQnPjwvaT5cIlxuICAgICAgfSk7XG5cbiAgICAgIHByb21pc2UuYXBwbHkoY29udGV4dCwgYXJncylcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgICAkc2NvcGUubG9hZGluZyA9IGZhbHNlO1xuICAgICAgICAgICRpb25pY0xvYWRpbmcuaGlkZSgpO1xuICAgICAgICAgIHJldHVybiBkZWZlcnJlZC5yZXNvbHZlKGQpO1xuICAgICAgICB9LCBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgaWYgKG1heFRyaWVzID09PSAtMSkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJnaXZpbmcgdXAuLi5cIik7XG4gICAgICAgICAgICAkaW9uaWNMb2FkaW5nLmhpZGUoKTtcbiAgICAgICAgICAgIHJldHVybiBkZWZlcnJlZC5yZWplY3QoZXJyKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgJHRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICRzY29wZS5yZXRyeVdpdGhQcm9taXNlKHByb21pc2UsIGFyZ3MsIG1heFRyaWVzIC0gMSwgY29udGV4dCwgZGVmZXJyZWQpO1xuICAgICAgICAgICAgfSwgMjAwMCk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xuICAgIH07XG4gIH0pO1xuIiwiLypnbG9iYWxzIGFuZ3VsYXIsIHdpbmRvdyAqL1xuIGFuZ3VsYXIubW9kdWxlKCdpbnNpZGVyLmNvbnRyb2xsZXJzJylcbiAgLmNvbnRyb2xsZXIoJ0J1eXNDdHJsJywgZnVuY3Rpb24gKCRzdGF0ZSwgJHNjb3BlLCBCdXlJZGVhU2VydmljZSkge1xuICAgICRzY29wZS5yZWZyZXNoID0gZnVuY3Rpb24gKCkge1xuICAgICAgJHNjb3BlLnJldHJ5V2l0aFByb21pc2UoQnV5SWRlYVNlcnZpY2UuZmluZEFsbCwgW10sIDMsIHRoaXMpXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uICh0cmFkZXMpIHtcbiAgICAgICAgICBjb25zb2xlLmxvZyh0cmFkZXMpO1xuICAgICAgICAgICRzY29wZS50cmFkZXMgPSB0cmFkZXM7XG4gICAgICAgIH0sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBjb25zb2xlLmxvZyhcInNhZCBmYWNlXCIpO1xuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgJHNjb3BlLnJlZnJlc2goKTtcblxuICAgICRzY29wZS5zaG93VHJhZGUgPSBmdW5jdGlvbiAoaWQpIHtcbiAgICAgICRzdGF0ZS5nbygnYXBwLnRyYWRlJywge1xuICAgICAgICBpZDogaWRcbiAgICAgIH0pO1xuICAgIH07XG5cbiAgICAkc2NvcGUuJG9uKCdhdXRoY2hhbmdlJywgZnVuY3Rpb24gKCkge1xuICAgICAgJHNjb3BlLnJlZnJlc2goKTtcbiAgICB9KTtcbiAgfSk7XG4iLCIvKmdsb2JhbHMgYW5ndWxhciwgd2luZG93ICovXG5hbmd1bGFyLm1vZHVsZSgnaW5zaWRlci5jb250cm9sbGVycycpXG4gIC5jb250cm9sbGVyKCdDb21wYW55Q3RybCcsIGZ1bmN0aW9uICgkc3RhdGUsICRzY29wZSwgJHN0YXRlUGFyYW1zLCBDb21wYW55U2VydmljZSkge1xuICAgICRzY29wZS5zaG93VHJhZGVzID0gdHJ1ZTtcblxuICAgICRzY29wZS5yZWZyZXNoID0gZnVuY3Rpb24gKCkge1xuICAgICAgJHNjb3BlLnJldHJ5V2l0aFByb21pc2UoQ29tcGFueVNlcnZpY2UuZmluZEJ5SWQsIFskc3RhdGVQYXJhbXMuaWRdLCAzLCB0aGlzKVxuICAgICAgICAudGhlbihmdW5jdGlvbiAoY29tcGFueURhdGEpIHtcbiAgICAgICAgICAkc2NvcGUuY29tcGFueSA9IGNvbXBhbnlEYXRhO1xuICAgICAgICB9LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coXCJzYWQgZmFjZVwiKTtcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgICRzY29wZS5yZWZyZXNoKCk7XG5cbiAgICAkc2NvcGUuZ29Ub0luc2lkZXIgPSBmdW5jdGlvbiAoaW5zaWRlcikge1xuICAgICAgJHN0YXRlLmdvKCdhcHAuaW5zaWRlcicsIHtcbiAgICAgICAgaWQ6IGluc2lkZXIuaWRcbiAgICAgIH0pO1xuICAgIH07XG5cbiAgICAkc2NvcGUuZ29Ub0Zvcm00ID0gZnVuY3Rpb24gKGZvcm00KSB7XG4gICAgICAkc3RhdGUuZ28oJ2FwcC5mb3JtNCcsIHtcbiAgICAgICAgaWQ6IGZvcm00LmlkXG4gICAgICB9KTtcbiAgICB9O1xuICB9KTtcbiIsIi8qZ2xvYmFscyBhbmd1bGFyLCB3aW5kb3cgKi9cbmFuZ3VsYXIubW9kdWxlKCdpbnNpZGVyLmNvbnRyb2xsZXJzJylcbiAgLmNvbnRyb2xsZXIoJ0Zvcm00Q3RybCcsIGZ1bmN0aW9uICgkc2NvcGUsICRzdGF0ZVBhcmFtcywgRm9ybTRTZXJ2aWNlKSB7XG4gICAgJHNjb3BlLnJlZnJlc2ggPSBmdW5jdGlvbiAoKSB7XG4gICAgICAkc2NvcGUucmV0cnlXaXRoUHJvbWlzZShGb3JtNFNlcnZpY2UuZmluZEJ5SWQsIFskc3RhdGVQYXJhbXMuaWRdLCAzLCB0aGlzKVxuICAgICAgICAudGhlbihmdW5jdGlvbiAoZm9ybTREYXRhKSB7XG4gICAgICAgICAgJHNjb3BlLmZvcm00ID0gZm9ybTREYXRhO1xuICAgICAgICB9LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coXCJzYWQgZmFjZVwiKTtcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgICRzY29wZS5uYXZpZ2F0ZVRvID0gZnVuY3Rpb24gKHVybCkge1xuICAgICAgd2luZG93Lm9wZW4odXJsLCAnX2JsYW5rJywgJ2xvY2F0aW9uPXllcycpO1xuICAgIH07XG5cbiAgICAkc2NvcGUucmVmcmVzaCgpO1xuICB9KTtcbiIsIi8qZ2xvYmFscyBhbmd1bGFyLCB3aW5kb3cgKi9cbmFuZ3VsYXIubW9kdWxlKCdpbnNpZGVyLmNvbnRyb2xsZXJzJylcbiAgLmNvbnRyb2xsZXIoJ0luc2lkZXJDdHJsJywgZnVuY3Rpb24gKCRzdGF0ZSwgJHNjb3BlLCAkc3RhdGVQYXJhbXMsIEluc2lkZXJTZXJ2aWNlKSB7XG4gICAgJHNjb3BlLnJlZnJlc2ggPSBmdW5jdGlvbiAoKSB7XG4gICAgICAkc2NvcGUucmV0cnlXaXRoUHJvbWlzZShJbnNpZGVyU2VydmljZS5maW5kQnlJZCwgWyRzdGF0ZVBhcmFtcy5pZF0sIDMsIHRoaXMpXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uIChpbnNpZGVyRGF0YSkge1xuICAgICAgICAgICRzY29wZS5pbnNpZGVyID0gaW5zaWRlckRhdGE7XG4gICAgICAgIH0sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBjb25zb2xlLmxvZyhcInNhZCBmYWNlXCIpO1xuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgJHNjb3BlLnJlZnJlc2goKTtcblxuICAgICRzY29wZS5nb1RvRm9ybTQgPSBmdW5jdGlvbiAoZm9ybTQpIHtcbiAgICAgICRzdGF0ZS5nbygnYXBwLmZvcm00Jywge1xuICAgICAgICBpZDogZm9ybTQuaWRcbiAgICAgIH0pO1xuICAgIH07XG4gfSk7XG4iLCIvKmdsb2JhbHMgYW5ndWxhciwgd2luZG93ICovXG5hbmd1bGFyLm1vZHVsZSgnaW5zaWRlci5jb250cm9sbGVycycpXG4gIC5jb250cm9sbGVyKCdTZWFyY2hDdHJsJywgZnVuY3Rpb24gKCRzdGF0ZSwgJHNjb3BlLCBTZWFyY2hTZXJ2aWNlKSB7XG4gICAgJHNjb3BlLmtleXdvcmQgPSBcIlwiO1xuICAgICRzY29wZS5yZXN1bHRzID0gW107XG4gICAgJHNjb3BlLnNlYXJjaCA9IGZ1bmN0aW9uICgpIHtcblxuXG4gICAgICBTZWFyY2hTZXJ2aWNlLnNlYXJjaCgkc2NvcGUua2V5d29yZCkudGhlbihmdW5jdGlvbiAocmVzcCkge1xuICAgICAgICAkc2NvcGUucmVzdWx0cyA9IHJlc3AuZGF0YTtcbiAgICAgIH0pO1xuICAgIH07XG5cbiAgICAkc2NvcGUub3BlblJlc3VsdCA9IGZ1bmN0aW9uIChyZXN1bHQpIHtcbiAgICAgIHZhciB3aGVyZSA9IChyZXN1bHRbMV0gPT09ICdJbnNpZGVyJykgPyAnYXBwLmluc2lkZXInIDogJ2FwcC5jb21wYW55JztcbiAgICAgICRzdGF0ZS5nbyh3aGVyZSwge1xuICAgICAgICBpZDogcmVzdWx0WzBdXG4gICAgICB9KTtcbiAgICB9O1xuICAgICRzY29wZS5zZWFyY2goKTtcbiAgfSk7XG4iLCIvKmdsb2JhbHMgYW5ndWxhciwgd2luZG93ICovXG5hbmd1bGFyLm1vZHVsZSgnaW5zaWRlci5jb250cm9sbGVycycpXG4gLmNvbnRyb2xsZXIoJ1RvZGF5c0J1eXNDdHJsJywgZnVuY3Rpb24gKCRzdGF0ZSwgJHNjb3BlLCBCdXlJZGVhU2VydmljZSkge1xuICAgICRzY29wZS50cmFkZXMgPSBbXTtcblxuICAgICRzY29wZS5yZWZyZXNoID0gZnVuY3Rpb24gKCkge1xuICAgICAgJHNjb3BlLnJldHJ5V2l0aFByb21pc2UoQnV5SWRlYVNlcnZpY2UuZmluZFRvZGF5cywgW10sIDMsIHRoaXMpXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uICh0cmFkZXMpIHtcbiAgICAgICAgICAkc2NvcGUudHJhZGVzID0gdHJhZGVzO1xuICAgICAgICB9LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coXCJzYWQgZmFjZVwiKTtcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgICRzY29wZS5yZWZyZXNoKCk7XG5cbiAgICAkc2NvcGUuc2hvd1RyYWRlID0gZnVuY3Rpb24gKGlkKSB7XG4gICAgICAkc3RhdGUuZ28oJ2FwcC50cmFkZScsIHtcbiAgICAgICAgaWQ6IGlkXG4gICAgICB9KTtcbiAgICB9O1xuXG4gICAgJHNjb3BlLiRvbignYXV0aGNoYW5nZScsIGZ1bmN0aW9uICgpIHtcbiAgICAgICRzY29wZS5yZWZyZXNoKCk7XG4gICAgfSk7XG4gIH0pO1xuXG4iLCIvKmdsb2JhbHMgYW5ndWxhciwgd2luZG93ICovXG5hbmd1bGFyLm1vZHVsZSgnaW5zaWRlci5jb250cm9sbGVycycpXG4gIC5jb250cm9sbGVyKCdUcmFkZUN0cmwnLCBmdW5jdGlvbiAoJHRpbWVvdXQsICRpb25pY1BvcHVwLCAkcm9vdFNjb3BlLCAkc2NvcGUsICRzdGF0ZVBhcmFtcywgQnV5SWRlYVNlcnZpY2UsIENvbW1lbnRTZXJ2aWNlLCBBdXRoU2VydmljZSkge1xuICAgICRzY29wZS5jb21tZW50RGF0YSA9IHt9O1xuICAgICRzY29wZS5zaG93Q29tbWVudEJveCA9IGZhbHNlO1xuXG4gICAgJHNjb3BlLm5hdmlnYXRlVG8gPSBmdW5jdGlvbiAodXJsKSB7XG4gICAgICB3aW5kb3cub3Blbih1cmwsICdfYmxhbmsnLCAnbG9jYXRpb249eWVzJyk7XG4gICAgfTtcblxuICAgICRzY29wZS5mZXRjaEF0dGVtcHRzID0gMDtcbiAgICAkc2NvcGUucmVmcmVzaCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICRzY29wZS5yZXRyeVdpdGhQcm9taXNlKEJ1eUlkZWFTZXJ2aWNlLmZpbmRCeUlkLCBbJHN0YXRlUGFyYW1zLmlkXSwgMywgdGhpcylcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24gKHRyYWRlKSB7XG4gICAgICAgICAgJHNjb3BlLnRyYWRlID0gdHJhZGU7XG4gICAgICAgIH0sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBjb25zb2xlLmxvZyhcInNhZCBmYWNlXCIpO1xuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgJHNjb3BlLnJlZnJlc2goKTtcblxuICAgICRzY29wZS51c2VySXNBdXRob3JPZiA9IGZ1bmN0aW9uIChjb21tZW50KSB7XG4gICAgICBjb25zb2xlLmxvZyhjb21tZW50LmF1dGhvcl9lbWFpbCA9PT0gQXV0aFNlcnZpY2UuY3VycmVudFVzZXIoKS5lbWFpbCk7XG4gICAgICByZXR1cm4gY29tbWVudC5hdXRob3JfZW1haWwgPT09ICRyb290U2NvcGUuY3VycmVudFVzZXIuZW1haWw7XG4gICAgfTtcblxuICAgICRzY29wZS5hZGRDb21tZW50ID0gZnVuY3Rpb24gKCkge1xuICAgICAgJHNjb3BlLmNvbW1lbnREYXRhLmlkZWFfaWQgPSAkc2NvcGUudHJhZGUuaWQ7XG4gICAgICBDb21tZW50U2VydmljZS5hZGRDb21tZW50KCRzY29wZS5jb21tZW50RGF0YSkudGhlbihmdW5jdGlvbiAoY29tbWVudCkge1xuICAgICAgICAkc2NvcGUudHJhZGUuY29tbWVudHMudW5zaGlmdChjb21tZW50KTtcbiAgICAgICAgJHNjb3BlLmNvbW1lbnREYXRhID0ge307XG4gICAgICB9LCBmdW5jdGlvbiAoZGF0YSkge1xuICAgICAgICBpZiAoZGF0YS5zdGF0dXMgPT09IDQwMSkge1xuICAgICAgICAgICRzY29wZS5sb2dpbigpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9O1xuXG4gICAgJHNjb3BlLnJlbW92ZUNvbW1lbnQgPSBmdW5jdGlvbiAoY29tbWVudCkge1xuICAgICAgaWYgKCEkc2NvcGUudXNlcklzQXV0aG9yT2YoY29tbWVudCkpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgdmFyIG15UG9wdXAgPSAkaW9uaWNQb3B1cC5zaG93KHtcbiAgICAgICAgdGVtcGxhdGU6ICcnLFxuICAgICAgICB0aXRsZTogJ0FyZSB5b3Ugc3VyZSB5b3Ugd2FudCB0byBkZWxldGUgeW91ciBjb21tZW50PycsXG4gICAgICAgIHN1YlRpdGxlOiAnJyxcbiAgICAgICAgc2NvcGU6ICRzY29wZSxcbiAgICAgICAgYnV0dG9uczogW3tcbiAgICAgICAgICB0ZXh0OiAnQ2FuY2VsJ1xuICAgICAgICB9LCB7XG4gICAgICAgICAgdGV4dDogJzxiPkRlbGV0ZTwvYj4nLFxuICAgICAgICAgIHR5cGU6ICdidXR0b24tYXNzZXJ0aXZlJyxcbiAgICAgICAgICBvblRhcDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgQ29tbWVudFNlcnZpY2UucmVtb3ZlQ29tbWVudChjb21tZW50LmlkKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgdmFyIGNvbW1lbnRJbmRleCA9ICRzY29wZS50cmFkZS5jb21tZW50cy5pbmRleE9mKGNvbW1lbnQpO1xuICAgICAgICAgICAgICAkc2NvcGUudHJhZGUuY29tbWVudHMuc3BsaWNlKGNvbW1lbnRJbmRleCwgMSk7XG4gICAgICAgICAgICAgIG15UG9wdXAuY2xvc2UoKTtcbiAgICAgICAgICAgIH0sIGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKGRhdGEpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4gXCJ0ZXN0XCI7XG4gICAgICAgICAgfVxuICAgICAgICB9LCBdXG4gICAgICB9KTtcbiAgICAgIC8vIG15UG9wdXAudGhlbihmdW5jdGlvbihyZXMpIHtcbiAgICAgIC8vICAgY29uc29sZS5sb2coJ1RhcHBlZCEnLCByZXMpO1xuICAgICAgLy8gfSk7XG4gICAgICAkdGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgIG15UG9wdXAuY2xvc2UoKTsgLy9jbG9zZSB0aGUgcG9wdXAgYWZ0ZXIgMyBzZWNvbmRzIGZvciBzb21lIHJlYXNvblxuICAgICAgfSwgMzAwMCk7XG4gICAgfTtcbiAgfSk7XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
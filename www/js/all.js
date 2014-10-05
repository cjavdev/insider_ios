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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImZpbHRlcnMuanMiLCJhdXRoX3NlcnZpY2UuanMiLCJjb21tZW50X3Nlcml2Y2UuanMiLCJjb21wYW55X3NlcnZpY2UuanMiLCJmb3JtNF9zZXJ2aWNlLmpzIiwiaWRlYV9zZXJ2aWNlLmpzIiwiaW5zaWRlcl9zZXJ2aWNlLmpzIiwic2VhcmNoX3Nlcml2Y2UuanMiLCJhcHBfY29udHJvbGxlci5qcyIsImJ1eXNfY29udHJvbGxlci5qcyIsImNvbXBhbnlfY29udHJvbGxlci5qcyIsImZvcm00X2NvbnRyb2xsZXIuanMiLCJpbnNpZGVyX2NvbnRyb2xsZXIuanMiLCJzZWFyY2hfY29udHJvbGxlci5qcyIsInRvZGF5c19idXlzX2NvbnRyb2xsZXIuanMiLCJ0cmFkZV9jb250cm9sbGVyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMxSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNyRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDMUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMxQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDdEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNiQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN2RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDMUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM1QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNsQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMzQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ25CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImFsbC5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qZ2xvYmFsIHdpbmRvdywgY29yZG92YSwgYW5ndWxhciAqL1xudmFyIGFwcCA9IGFuZ3VsYXIubW9kdWxlKCdpbnNpZGVyJywgW1xuICAgICdpb25pYycsXG4gICAgJ2luc2lkZXIuc2VydmljZXMnLFxuICAgICdpbnNpZGVyLmNvbnRyb2xsZXJzJyxcbiAgICAnaW5zaWRlci5maWx0ZXJzJyxcbiAgICAnbmdDb3Jkb3ZhJ1xuICBdKVxuICAuY29uc3RhbnQoJ2xvYycsIHtcbiAgICAvL2FwaUJhc2U6ICdodHRwOi8vbG9jYWxob3N0OjMwMDAnXG4gICAgYXBpQmFzZTogJ2h0dHBzOi8vaW5zaWRlcmFpLmNvbSdcbiAgfSlcbiAgLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIsICR1cmxSb3V0ZXJQcm92aWRlcikge1xuICAgICRzdGF0ZVByb3ZpZGVyXG4gICAgICAuc3RhdGUoJ2FwcCcsIHtcbiAgICAgICAgdXJsOiAnL2FwcCcsXG4gICAgICAgIGFic3RyYWN0OiB0cnVlLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ3RlbXBsYXRlcy9tZW51Lmh0bWwnLFxuICAgICAgICBjb250cm9sbGVyOiAnQXBwQ3RybCdcbiAgICAgIH0pXG4gICAgICAuc3RhdGUoJ2FwcC5idXlzJywge1xuICAgICAgICB1cmw6ICcvYnV5cycsXG4gICAgICAgIHZpZXdzOiB7XG4gICAgICAgICAgJ21lbnVDb250ZW50Jzoge1xuICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICd0ZW1wbGF0ZXMvYnV5cy5odG1sJyxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdCdXlzQ3RybCdcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgICAuc3RhdGUoJ2FwcC50b2RheScsIHtcbiAgICAgICAgdXJsOiAnL3RvZGF5JyxcbiAgICAgICAgdmlld3M6IHtcbiAgICAgICAgICAnbWVudUNvbnRlbnQnOiB7XG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogJ3RlbXBsYXRlcy90b2RheS5odG1sJyxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdUb2RheXNCdXlzQ3RybCdcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgICAuc3RhdGUoJ2FwcC50cmFkZScsIHtcbiAgICAgICAgdXJsOiAnL3RyYWRlcy86aWQnLFxuICAgICAgICB2aWV3czoge1xuICAgICAgICAgICdtZW51Q29udGVudCc6IHtcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAndGVtcGxhdGVzL3RyYWRlLmh0bWwnLFxuICAgICAgICAgICAgY29udHJvbGxlcjogJ1RyYWRlQ3RybCdcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgICAuc3RhdGUoJ2FwcC5pbnNpZGVyJywge1xuICAgICAgICB1cmw6ICcvaW5zaWRlcnMvOmlkJyxcbiAgICAgICAgdmlld3M6IHtcbiAgICAgICAgICAnbWVudUNvbnRlbnQnOiB7XG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogJ3RlbXBsYXRlcy9pbnNpZGVyLmh0bWwnLFxuICAgICAgICAgICAgY29udHJvbGxlcjogJ0luc2lkZXJDdHJsJ1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSlcbiAgICAgIC5zdGF0ZSgnYXBwLmZvcm00Jywge1xuICAgICAgICB1cmw6ICcvZm9ybTRzLzppZCcsXG4gICAgICAgIHZpZXdzOiB7XG4gICAgICAgICAgJ21lbnVDb250ZW50Jzoge1xuICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICd0ZW1wbGF0ZXMvZm9ybTQuaHRtbCcsXG4gICAgICAgICAgICBjb250cm9sbGVyOiAnRm9ybTRDdHJsJ1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSlcbiAgICAgIC5zdGF0ZSgnYXBwLmNvbXBhbnknLCB7XG4gICAgICAgIHVybDogJy9jb21wYW5pZXMvOmlkJyxcbiAgICAgICAgdmlld3M6IHtcbiAgICAgICAgICAnbWVudUNvbnRlbnQnOiB7XG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogJ3RlbXBsYXRlcy9jb21wYW55Lmh0bWwnLFxuICAgICAgICAgICAgY29udHJvbGxlcjogJ0NvbXBhbnlDdHJsJ1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSlcbiAgICAgIC5zdGF0ZSgnYXBwLnNlYXJjaCcsIHtcbiAgICAgICAgdXJsOiAnL3NlYXJjaCcsXG4gICAgICAgIHZpZXdzOiB7XG4gICAgICAgICAgJ21lbnVDb250ZW50Jzoge1xuICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICd0ZW1wbGF0ZXMvc2VhcmNoLmh0bWwnLFxuICAgICAgICAgICAgY29udHJvbGxlcjogJ1NlYXJjaEN0cmwnXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAvLyBpZiBub25lIG9mIHRoZSBhYm92ZSBzdGF0ZXMgYXJlIG1hdGNoZWQsIHVzZSB0aGlzIGFzIHRoZSBmYWxsYmFja1xuICAgICR1cmxSb3V0ZXJQcm92aWRlci5vdGhlcndpc2UoJy9hcHAvYnV5cycpO1xuICB9KVxuICAucnVuKGZ1bmN0aW9uICgkaW9uaWNQbGF0Zm9ybSwgJGNvcmRvdmFQdXNoLCAkcm9vdFNjb3BlLCBBdXRoU2VydmljZSkge1xuICAgIGNvbnNvbGUubG9nKFwidmFsaWRhdGluZyB1c2VyXCIpO1xuICAgIEF1dGhTZXJ2aWNlLnZhbGlkYXRlVXNlcigpO1xuICAgIC8vICRyb290U2NvcGUuY3VycmVudFVzZXIgPSB7fTtcbiAgICAvLyB2YXIgdG9rZW4gPSB3aW5kb3cubG9jYWxTdG9yYWdlLmdldEl0ZW0oJ2F1dGhfdG9rZW4nKTtcbiAgICAvLyBpZiAodG9rZW4gIT09IG51bGwpIHtcbiAgICAvLyAgICRodHRwLmRlZmF1bHRzLmhlYWRlcnMuY29tbW9uWydBdXRoLVRva2VuLVgnXSA9IHRva2VuO1xuICAgIC8vIH1cbiAgICAvL1xuICAgIC8vICRodHRwLmdldChsb2MuYXBpQmFzZSArICcvYXBpL3YxL3Nlc3Npb25zL3ZhbGlkYXRlLmpzb24nKVxuICAgIC8vICAgLnRoZW4oZnVuY3Rpb24gKHJlc3ApIHtcbiAgICAvLyAgICAgY29uc29sZS5sb2cocmVzcC5kYXRhKTtcbiAgICAvLyAgICAgJHJvb3RTY29wZS5jdXJyZW50VXNlciA9IHJlc3AuZGF0YS51c2VyO1xuICAgIC8vICAgfSwgZnVuY3Rpb24gKHJlc3ApIHtcbiAgICAvLyAgICAgd2luZG93LmxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKCdhdXRoX3Rva2VuJyk7XG4gICAgLy8gICAgIGRlbGV0ZSAkaHR0cC5kZWZhdWx0cy5oZWFkZXJzLmNvbW1vblsnQXV0aC1Ub2tlbi1YJ107XG4gICAgLy8gICAgIGNvbnNvbGUubG9nKHJlc3AuZGF0YS5tZXNzYWdlKTtcbiAgICAvLyAgIH0pO1xuXG4gICAgJGlvbmljUGxhdGZvcm0ucmVhZHkoZnVuY3Rpb24gKCkge1xuICAgICAgLy8gSGlkZSB0aGUgYWNjZXNzb3J5IGJhciBieSBkZWZhdWx0IChyZW1vdmUgdGhpcyB0byBzaG93IHRoZSBhY2Nlc3NvcnkgYmFyIGFib3ZlIHRoZSBrZXlib2FyZFxuICAgICAgLy8gZm9yIGZvcm0gaW5wdXRzKVxuICAgICAgaWYgKHdpbmRvdy5jb3Jkb3ZhICYmIHdpbmRvdy5jb3Jkb3ZhLnBsdWdpbnMuS2V5Ym9hcmQpIHtcbiAgICAgICAgY29yZG92YS5wbHVnaW5zLktleWJvYXJkLmhpZGVLZXlib2FyZEFjY2Vzc29yeUJhcih0cnVlKTtcbiAgICAgIH1cbiAgICAgIGlmICh3aW5kb3cuU3RhdHVzQmFyKSB7XG4gICAgICAgIC8vIG9yZy5hcGFjaGUuY29yZG92YS5zdGF0dXNiYXIgcmVxdWlyZWRcbiAgICAgICAgd2luZG93LlN0YXR1c0Jhci5zdHlsZUxpZ2h0Q29udGVudCgpO1xuICAgICAgfVxuXG4gICAgICB2YXIgaW9zQ29uZmlnID0ge1xuICAgICAgICBcImJhZGdlXCI6IFwidHJ1ZVwiLFxuICAgICAgICBcInNvdW5kXCI6IFwidHJ1ZVwiLFxuICAgICAgICBcImFsZXJ0XCI6IFwidHJ1ZVwiLFxuICAgICAgICBcImVjYlwiOiBcIm9uTm90aWZpY2F0aW9uQVBOXCJcbiAgICAgIH07XG5cbiAgICAgIGlmKHdpbmRvdy5jb3Jkb3ZhKSB7XG4gICAgICAgICRjb3Jkb3ZhUHVzaC5yZWdpc3Rlcihpb3NDb25maWcpLnRoZW4oZnVuY3Rpb24gKHJlc3VsdCkge1xuICAgICAgICAgICRyb290U2NvcGUuZGV2aWNlVG9rZW4gPSByZXN1bHQ7XG4gICAgICAgIH0sIGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICBjb25zb2xlLmxvZyhcIm5vdCBhYmxlIHRvIHNlbmQgcHVzaFwiLCBlcnIpO1xuICAgICAgICB9KTtcbiAgICAgICAgLy8gJGNvcmRvdmFQdXNoLnVucmVnaXN0ZXIob3B0aW9ucykudGhlbihmdW5jdGlvbihyZXN1bHQpIHtcbiAgICAgICAgLy8gICBhbGVydChcInVucmVnaXN0ZXJcIik7XG4gICAgICAgIC8vICAgYWxlcnQocmVzdWx0KTtcbiAgICAgICAgLy8gICBhbGVydChhcmd1bWVudHMpO1xuICAgICAgICAvLyAgICAgLy8gU3VjY2VzcyFcbiAgICAgICAgLy8gfSwgZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgIC8vICAgYWxlcnQoXCJlcnJvclwiKTtcbiAgICAgICAgLy8gICBhbGVydChlcnIpO1xuICAgICAgICAvLyAgICAgLy8gQW4gZXJyb3Igb2NjdXJlZC4gU2hvdyBhIG1lc3NhZ2UgdG8gdGhlIHVzZXJcbiAgICAgICAgLy8gfSk7XG4gICAgICAgIC8vXG4gICAgICAgIC8vIC8vIGlPUyBvbmx5XG4gICAgICAgIC8vICRjb3Jkb3ZhUHVzaC5zZXRCYWRnZU51bWJlcigyKS50aGVuKGZ1bmN0aW9uKHJlc3VsdCkge1xuICAgICAgICAvLyAgIGFsZXJ0KFwic2V0IGJhZGdlIHRvIDIhXCIpO1xuICAgICAgICAvLyAgIGFsZXJ0KHJlc3VsdCk7XG4gICAgICAgIC8vICAgYWxlcnQoYXJndW1lbnRzKTtcbiAgICAgICAgLy8gICAgIC8vIFN1Y2Nlc3MhXG4gICAgICAgIC8vIH0sIGZ1bmN0aW9uKGVycikge1xuICAgICAgICAvLyAgIGFsZXJ0KFwiZXJyb3JcIik7XG4gICAgICAgIC8vICAgYWxlcnQoZXJyKTtcbiAgICAgICAgLy8gICAgIC8vIEFuIGVycm9yIG9jY3VyZWQuIFNob3cgYSBtZXNzYWdlIHRvIHRoZSB1c2VyXG4gICAgICAgIC8vIH0pO1xuICAgICAgfVxuICAgIH0pO1xuICB9KTtcbiIsIi8qZ2xvYmFscyBhbmd1bGFyLCBtZDUgKi9cbmFuZ3VsYXIubW9kdWxlKCdpbnNpZGVyLmZpbHRlcnMnLCBbXSlcbiAgLmZpbHRlcignZ3JhdmF0YXInLCBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChlbWFpbCkge1xuICAgICAgcmV0dXJuIFwiaHR0cDovL3d3dy5ncmF2YXRhci5jb20vYXZhdGFyL1wiICsgbWQ1KGVtYWlsKTtcbiAgICB9O1xuICB9KTtcbiIsIi8qZ2xvYmFscyB3aW5kb3csIGFuZ3VsYXIsIF8gKi9cbmFuZ3VsYXIubW9kdWxlKCdpbnNpZGVyLnNlcnZpY2VzJywgW10pXG4gIC5mYWN0b3J5KCdBdXRoU2VydmljZScsIGZ1bmN0aW9uIChsb2MsICRxLCAkaHR0cCkge1xuICAgIHZhciB1c2VyID0gbnVsbDtcblxuICAgIHZhciByZWFkU3RvcmVkVXNlciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciBzdG9yZWRVc2VyID0gd2luZG93LmxvY2FsU3RvcmFnZS5nZXRJdGVtKCd1c2VyJyk7XG4gICAgICB0cnkge1xuICAgICAgICBpZiAoc3RvcmVkVXNlcikge1xuICAgICAgICAgIHVzZXIgPSBKU09OLnBhcnNlKHN0b3JlZFVzZXIpO1xuICAgICAgICAgICRodHRwLmRlZmF1bHRzLmhlYWRlcnMuY29tbW9uWydBdXRoLVRva2VuLVgnXSA9IHVzZXIuYXV0aF90b2tlbjtcbiAgICAgICAgfVxuICAgICAgfSBjYXRjaCAoaWdub3JlKSB7IC8qIGZhaWwgc2lsZW50bHkqLyB9XG4gICAgfTtcblxuICAgIHJlYWRTdG9yZWRVc2VyKCk7XG5cbiAgICB2YXIgY3VycmVudFVzZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICBpZiAoIXVzZXIpIHtcbiAgICAgICAgdXNlciA9IHJlYWRTdG9yZWRVc2VyKCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gdXNlcjtcbiAgICB9O1xuXG4gICAgdmFyIHNhdmVVc2VyID0gZnVuY3Rpb24gKHVzZXJUb1NhdmUpIHtcbiAgICAgIHVzZXIgPSB1c2VyVG9TYXZlO1xuICAgICAgd2luZG93LmxvY2FsU3RvcmFnZS5zZXRJdGVtKCd1c2VyJywgSlNPTi5zdHJpbmdpZnkodXNlcikpO1xuICAgICAgJGh0dHAuZGVmYXVsdHMuaGVhZGVycy5jb21tb25bJ0F1dGgtVG9rZW4tWCddID0gdXNlci5hdXRoX3Rva2VuO1xuICAgIH07XG5cbiAgICB2YXIgY2xlYXJVc2VyID0gZnVuY3Rpb24gKCkge1xuICAgICAgd2luZG93LmxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKCd1c2VyJyk7XG4gICAgICAkaHR0cC5kZWZhdWx0cy5oZWFkZXJzLmNvbW1vblsnQXV0aC1Ub2tlbi1YJ10gPSB1bmRlZmluZWQ7XG4gICAgICB1c2VyID0gbnVsbDtcbiAgICB9O1xuXG4gICAgdmFyIGxvZ2dlZEluID0gZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuICEhY3VycmVudFVzZXIoKTtcbiAgICB9O1xuXG4gICAgdmFyIGRvTG9naW4gPSBmdW5jdGlvbiAodXNlclBhcmFtcywgZGV2aWNlVG9rZW4pIHtcbiAgICAgIHZhciBwYXJhbXMgPSB7XG4gICAgICAgIHVzZXI6IHVzZXJQYXJhbXMsXG4gICAgICAgIGRldmljZToge1xuICAgICAgICAgIHBsYXRmb3JtOiAnaW9zJyxcbiAgICAgICAgICB0b2tlbjogZGV2aWNlVG9rZW5cbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgdmFyIGRlZmVycmVkID0gJHEuZGVmZXIoKTtcblxuICAgICAgJGh0dHAucG9zdChsb2MuYXBpQmFzZSArICcvYXBpL3YxL3VzZXJzL3NpZ25faW4uanNvbicsIHBhcmFtcykuXG4gICAgICBzdWNjZXNzKGZ1bmN0aW9uICh1c2VyRGF0YSkge1xuICAgICAgICBzYXZlVXNlcih1c2VyRGF0YSk7XG4gICAgICAgIGRlZmVycmVkLnJlc29sdmUodXNlckRhdGEpO1xuICAgICAgfSkuXG4gICAgICBlcnJvcihmdW5jdGlvbiAoZGF0YSkge1xuICAgICAgICBkZWZlcnJlZC5yZWplY3QoZGF0YSk7XG4gICAgICB9KTtcblxuICAgICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG4gICAgfTtcblxuICAgIHZhciBkb0xvZ291dCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIGNsZWFyVXNlcigpO1xuICAgICAgcmV0dXJuICRodHRwLmRlbGV0ZShsb2MuYXBpQmFzZSArICcvYXBpL3YxL3VzZXJzL3NpZ25fb3V0Lmpzb24nKTtcbiAgICB9O1xuXG4gICAgdmFyIHZhbGlkYXRlVXNlciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICRodHRwLmdldChsb2MuYXBpQmFzZSArICcvYXBpL3YxL3Nlc3Npb25zL3ZhbGlkYXRlLmpzb24nKVxuICAgICAgICAudGhlbihmdW5jdGlvbiAocmVzcCkge1xuICAgICAgICAgIHNhdmVVc2VyKHJlc3AuZGF0YS51c2VyKTtcbiAgICAgICAgfSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgIGNsZWFyVXNlcigpO1xuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIGRvTG9naW46IGRvTG9naW4sXG4gICAgICBkb0xvZ291dDogZG9Mb2dvdXQsXG4gICAgICBsb2dnZWRJbjogbG9nZ2VkSW4sXG4gICAgICBjdXJyZW50VXNlcjogY3VycmVudFVzZXIsXG4gICAgICB2YWxpZGF0ZVVzZXI6IHZhbGlkYXRlVXNlclxuICAgIH07XG4gIH0pO1xuIiwiLypnbG9iYWxzIGFuZ3VsYXIsIF8gKi9cbmFuZ3VsYXIubW9kdWxlKCdpbnNpZGVyLnNlcnZpY2VzJylcbiAgLmZhY3RvcnkoJ0NvbW1lbnRTZXJ2aWNlJywgZnVuY3Rpb24obG9jLCAkcSwgJGh0dHApIHtcbiAgICBmdW5jdGlvbiB1cmwoaWQpIHtcbiAgICAgIGlmKGlkKSB7XG4gICAgICAgIHJldHVybiBsb2MuYXBpQmFzZSArICcvYXBpL3YxL2NvbW1lbnRzLycgKyBpZCArICcuanNvbic7XG4gICAgICB9XG4gICAgICByZXR1cm4gbG9jLmFwaUJhc2UgKyAnL2FwaS92MS9jb21tZW50cy5qc29uJztcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgYWRkQ29tbWVudDogZnVuY3Rpb24gKHBhcmFtcykge1xuICAgICAgICB2YXIgZGVmZXJyZWQgPSAkcS5kZWZlcigpO1xuICAgICAgICAkaHR0cC5wb3N0KHVybCgpLCBwYXJhbXMpLnRoZW4oZnVuY3Rpb24gKHJlc3ApIHtcbiAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKHJlc3AuZGF0YSk7XG4gICAgICAgIH0sIGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICAgICAgZGVmZXJyZWQucmVqZWN0KGRhdGEpO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG4gICAgICB9LFxuXG4gICAgICByZW1vdmVDb21tZW50OiBmdW5jdGlvbiAoaWQpIHtcbiAgICAgICAgcmV0dXJuICRodHRwLmRlbGV0ZSh1cmwoaWQpKTtcbiAgICAgIH1cbiAgICB9O1xuICB9KTtcbiIsIi8qZ2xvYmFscyBhbmd1bGFyLCBfICovXG5hbmd1bGFyLm1vZHVsZSgnaW5zaWRlci5zZXJ2aWNlcycpXG4gIC5mYWN0b3J5KCdDb21wYW55U2VydmljZScsIGZ1bmN0aW9uKGxvYywgJHEsICRodHRwKSB7XG4gICAgZnVuY3Rpb24gdXJsKGlkKSB7XG4gICAgIGlmKGlkKSB7XG4gICAgICAgIHJldHVybiBsb2MuYXBpQmFzZSArICcvYXBpL3YxL2NvbXBhbmllcy8nICsgaWQgKyAnLmpzb24nO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGxvYy5hcGlCYXNlICsgJy9hcGkvdjEvY29tcGFuaWVzLmpzb24nO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICBmaW5kQnlJZDogZnVuY3Rpb24gKGlkKSB7XG4gICAgICAgIHZhciBkZWZlcnJlZCA9ICRxLmRlZmVyKCk7XG4gICAgICAgICRodHRwLmdldCh1cmwoaWQpKS50aGVuKGZ1bmN0aW9uIChyZXNwKSB7XG4gICAgICAgICAgZGVmZXJyZWQucmVzb2x2ZShyZXNwLmRhdGEpO1xuICAgICAgICB9LCBmdW5jdGlvbiAocmVzcCkge1xuICAgICAgICAgIGRlZmVycmVkLnJlamVjdChyZXNwLmRhdGEpO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG4gICAgICB9LFxuICAgIH07XG4gIH0pO1xuXG4iLCIvKmdsb2JhbHMgYW5ndWxhciwgXyAqL1xuYW5ndWxhci5tb2R1bGUoJ2luc2lkZXIuc2VydmljZXMnKVxuICAuZmFjdG9yeSgnRm9ybTRTZXJ2aWNlJywgZnVuY3Rpb24obG9jLCAkcSwgJGh0dHApIHtcbiAgICBmdW5jdGlvbiB1cmwoaWQpIHtcbiAgICAgaWYoaWQpIHtcbiAgICAgICAgcmV0dXJuIGxvYy5hcGlCYXNlICsgJy9hcGkvdjEvZm9ybTRzLycgKyBpZCArICcuanNvbic7XG4gICAgICB9XG4gICAgICByZXR1cm4gbG9jLmFwaUJhc2UgKyAnL2FwaS92MS9mb3JtNHMuanNvbic7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIGZpbmRCeUlkOiBmdW5jdGlvbiAoaWQpIHtcbiAgICAgICAgdmFyIGRlZmVycmVkID0gJHEuZGVmZXIoKTtcbiAgICAgICAgJGh0dHAuZ2V0KHVybChpZCkpLnRoZW4oZnVuY3Rpb24gKHJlc3ApIHtcbiAgICAgICAgICB2YXIgZmlsaW5nID0gcmVzcC5kYXRhO1xuICAgICAgICAgIHZhciBkb2MgPSBKU09OLnBhcnNlKHJlc3AuZGF0YS5maWxpbmcpO1xuICAgICAgICAgIGZpbGluZy5ub25EZXJpdmF0aXZlVHJhbnNhY3Rpb25zID0gZG9jLnRyYW5zYWN0aW9ucztcbiAgICAgICAgICBmaWxpbmcuZGVyaXZhdGl2ZVRyYW5zYWN0aW9ucyA9IGRvYy5kZXJpdmF0aXZlX3RyYW5zYWN0aW9ucztcbiAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKGZpbGluZyk7XG4gICAgICAgIH0sIGZ1bmN0aW9uIChyZXNwKSB7XG4gICAgICAgICAgZGVmZXJyZWQucmVqZWN0KHJlc3AuZGF0YSk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbiAgICAgIH0sXG4gICAgfTtcbiAgfSk7XG4iLCIvKmdsb2JhbHMgYW5ndWxhciwgXyAqL1xuYW5ndWxhci5tb2R1bGUoJ2luc2lkZXIuc2VydmljZXMnKVxuICAuZmFjdG9yeSgnQnV5SWRlYVNlcnZpY2UnLCBmdW5jdGlvbihsb2MsICRxLCAkaHR0cCkge1xuICAgIGZ1bmN0aW9uIHVybChpZCkge1xuICAgICAgaWYoaWQpIHtcbiAgICAgICAgcmV0dXJuIGxvYy5hcGlCYXNlICsgJy9hcGkvdjEvYnV5cy8nICsgaWQgKyAnLmpzb24nO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGxvYy5hcGlCYXNlICsgJy9hcGkvdjEvYnV5cy5qc29uJztcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgZmluZEFsbDogZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgZGVmZXJyZWQgPSAkcS5kZWZlcigpO1xuICAgICAgICAkaHR0cC5nZXQodXJsKCkpLnRoZW4oZnVuY3Rpb24gKHJlc3ApIHtcbiAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKHJlc3AuZGF0YSk7XG4gICAgICAgIH0sIGZ1bmN0aW9uIChyZXNwKSB7XG4gICAgICAgICAgZGVmZXJyZWQucmVqZWN0KHJlc3AuZGF0YSk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbiAgICAgIH0sXG5cbiAgICAgIGZpbmRCeUlkOiBmdW5jdGlvbiAoaWQpIHtcbiAgICAgICAgdmFyIGRlZmVycmVkID0gJHEuZGVmZXIoKTtcbiAgICAgICAgJGh0dHAuZ2V0KHVybChpZCkpLnRoZW4oZnVuY3Rpb24gKHJlc3ApIHtcbiAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKHJlc3AuZGF0YSk7XG4gICAgICAgIH0sIGZ1bmN0aW9uIChyZXNwKSB7XG4gICAgICAgICAgZGVmZXJyZWQucmVqZWN0KHJlc3AuZGF0YSk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbiAgICAgIH0sXG5cbiAgICAgIGZpbmRUb2RheXM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGRlZmVycmVkID0gJHEuZGVmZXIoKTtcbiAgICAgICAgJGh0dHAuZ2V0KHVybCgpLCB7IHBhcmFtczogeyAndG9kYXknOiB0cnVlIH0gfSkudGhlbihmdW5jdGlvbiAocmVzcCkge1xuICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUocmVzcC5kYXRhKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xuICAgICAgfVxuICAgIH07XG4gIH0pO1xuIiwiLypnbG9iYWxzIGFuZ3VsYXIsIF8gKi9cbmFuZ3VsYXIubW9kdWxlKCdpbnNpZGVyLnNlcnZpY2VzJylcbiAgLmZhY3RvcnkoJ0luc2lkZXJTZXJ2aWNlJywgZnVuY3Rpb24obG9jLCAkcSwgJGh0dHApIHtcbiAgICBmdW5jdGlvbiB1cmwoaWQpIHtcbiAgICAgaWYoaWQpIHtcbiAgICAgICAgcmV0dXJuIGxvYy5hcGlCYXNlICsgJy9hcGkvdjEvaW5zaWRlcnMvJyArIGlkICsgJy5qc29uJztcbiAgICAgIH1cbiAgICAgIHJldHVybiBsb2MuYXBpQmFzZSArICcvYXBpL3YxL2luc2lkZXJzLmpzb24nO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICBmaW5kQnlJZDogZnVuY3Rpb24gKGlkKSB7XG4gICAgICAgIHZhciBkZWZlcnJlZCA9ICRxLmRlZmVyKCk7XG4gICAgICAgICRodHRwLmdldCh1cmwoaWQpKS50aGVuKGZ1bmN0aW9uIChyZXNwKSB7XG4gICAgICAgICAgZGVmZXJyZWQucmVzb2x2ZShyZXNwLmRhdGEpO1xuICAgICAgICB9LCBmdW5jdGlvbiAocmVzcCkge1xuICAgICAgICAgIGRlZmVycmVkLnJlamVjdChyZXNwLmRhdGEpO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG4gICAgICB9LFxuICAgIH07XG4gIH0pO1xuIiwiLypnbG9iYWxzIGFuZ3VsYXIsIF8gKi9cbmFuZ3VsYXIubW9kdWxlKCdpbnNpZGVyLnNlcnZpY2VzJylcbiAgLmZhY3RvcnkoJ1NlYXJjaFNlcnZpY2UnLCBmdW5jdGlvbihsb2MsICRodHRwKSB7XG4gICAgZnVuY3Rpb24gdXJsKHEpIHtcbiAgICAgIHJldHVybiBsb2MuYXBpQmFzZSArICcvYXBpL3YxL3NlYXJjaD9xPScgKyBxO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICBzZWFyY2g6IGZ1bmN0aW9uIChrZXl3b3JkKSB7XG4gICAgICAgIHJldHVybiAkaHR0cC5nZXQodXJsKGtleXdvcmQpKTtcbiAgICAgIH1cbiAgICB9O1xuICB9KTtcbiIsIi8qZ2xvYmFscyBhbmd1bGFyLCB3aW5kb3cgKi9cbmFuZ3VsYXIubW9kdWxlKCdpbnNpZGVyLmNvbnRyb2xsZXJzJywgW10pXG4gIC5jb250cm9sbGVyKCdBcHBDdHJsJywgZnVuY3Rpb24gKCR0aW1lb3V0LCAkaW9uaWNMb2FkaW5nLCAkcSwgJHNjb3BlLCAkaW9uaWNNb2RhbCwgJHJvb3RTY29wZSwgQXV0aFNlcnZpY2UpIHtcbiAgICAkc2NvcGUubG9naW5EYXRhID0ge307XG5cbiAgICAkaW9uaWNNb2RhbC5mcm9tVGVtcGxhdGVVcmwoJ3RlbXBsYXRlcy9sb2dpbi5odG1sJywge1xuICAgICAgc2NvcGU6ICRzY29wZVxuICAgIH0pLnRoZW4oZnVuY3Rpb24gKG1vZGFsKSB7XG4gICAgICAkc2NvcGUubW9kYWwgPSBtb2RhbDtcbiAgICB9KTtcblxuICAgICRzY29wZS5jbG9zZUxvZ2luID0gZnVuY3Rpb24gKCkge1xuICAgICAgJHNjb3BlLm1vZGFsLmhpZGUoKTtcbiAgICB9O1xuXG4gICAgJHNjb3BlLmxvZ2luID0gZnVuY3Rpb24gKCkge1xuICAgICAgJHNjb3BlLm1vZGFsLnNob3coKTtcbiAgICB9O1xuXG4gICAgJHNjb3BlLmxvZ291dCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIEF1dGhTZXJ2aWNlLmRvTG9nb3V0KCkudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdChcImF1dGhjaGFuZ2VcIik7XG4gICAgICB9KTtcbiAgICB9O1xuXG4gICAgJHNjb3BlLmxvZ2dlZEluID0gZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuIEF1dGhTZXJ2aWNlLmxvZ2dlZEluKCk7XG4gICAgfTtcblxuICAgICRzY29wZS5kb0xvZ2luID0gZnVuY3Rpb24gKCkge1xuICAgICAgQXV0aFNlcnZpY2UuZG9Mb2dpbigkc2NvcGUubG9naW5EYXRhLCAkcm9vdFNjb3BlLmRldmljZVRva2VuKVxuICAgICAgICAudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KCdhdXRoY2hhbmdlJyk7XG4gICAgICAgICAgJHNjb3BlLmNsb3NlTG9naW4oKTtcbiAgICAgICAgfSwgZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgICAgICBpZiAoZGF0YS5tZXNzYWdlKSB7XG4gICAgICAgICAgICB3aW5kb3cuYWxlcnQoZGF0YS5tZXNzYWdlKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgd2luZG93LmFsZXJ0KFwiU29tZXRoaW5nIHdlbnQgd3Jvbmcgd2l0aCB5b3VyIGxvZ2luLiBUcnkgYWdhaW4uXCIpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgICRzY29wZS5yZXRyeVdpdGhQcm9taXNlID0gZnVuY3Rpb24gKHByb21pc2UsIGFyZ3MsIG1heFRyaWVzLCBjb250ZXh0LCBkZWZlcnJlZCkge1xuICAgICAgZGVmZXJyZWQgPSBkZWZlcnJlZCB8fCAkcS5kZWZlcigpO1xuICAgICAgY29udGV4dCA9IGNvbnRleHQgfHwgbnVsbDtcblxuICAgICAgJHNjb3BlLmxvYWRpbmcgPSB0cnVlO1xuICAgICAgJGlvbmljTG9hZGluZy5zaG93KHtcbiAgICAgICAgdGVtcGxhdGU6IFwiPGkgY2xhc3M9J2lvbi1sb2FkaW5nLWQnPjwvaT5cIlxuICAgICAgfSk7XG5cbiAgICAgIHByb21pc2UuYXBwbHkoY29udGV4dCwgYXJncylcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgICAkc2NvcGUubG9hZGluZyA9IGZhbHNlO1xuICAgICAgICAgICRpb25pY0xvYWRpbmcuaGlkZSgpO1xuICAgICAgICAgIHJldHVybiBkZWZlcnJlZC5yZXNvbHZlKGQpO1xuICAgICAgICB9LCBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgaWYgKG1heFRyaWVzID09PSAtMSkge1xuICAgICAgICAgICAgJGlvbmljTG9hZGluZy5oaWRlKCk7XG4gICAgICAgICAgICAkc2NvcGUubG9hZGluZyA9IGZhbHNlO1xuICAgICAgICAgICAgcmV0dXJuIGRlZmVycmVkLnJlamVjdChlcnIpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAkdGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgJHNjb3BlLnJldHJ5V2l0aFByb21pc2UocHJvbWlzZSwgYXJncywgbWF4VHJpZXMgLSAxLCBjb250ZXh0LCBkZWZlcnJlZCk7XG4gICAgICAgICAgICB9LCAyMDAwKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG4gICAgfTtcbiAgfSk7XG4iLCIvKmdsb2JhbHMgYW5ndWxhciwgd2luZG93ICovXG4gYW5ndWxhci5tb2R1bGUoJ2luc2lkZXIuY29udHJvbGxlcnMnKVxuICAuY29udHJvbGxlcignQnV5c0N0cmwnLCBmdW5jdGlvbiAoJHN0YXRlLCAkc2NvcGUsIEJ1eUlkZWFTZXJ2aWNlKSB7XG4gICAgJHNjb3BlLnJlZnJlc2ggPSBmdW5jdGlvbiAoKSB7XG4gICAgICAkc2NvcGUucmV0cnlXaXRoUHJvbWlzZShCdXlJZGVhU2VydmljZS5maW5kQWxsLCBbXSwgMywgdGhpcylcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24gKHRyYWRlcykge1xuICAgICAgICAgIGNvbnNvbGUubG9nKHRyYWRlcyk7XG4gICAgICAgICAgJHNjb3BlLnRyYWRlcyA9IHRyYWRlcztcbiAgICAgICAgfSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgIC8vIFRPRE86IHNob3cgbm8gdHJhZGVzIGZvdW5kIHRoaW5nXG4gICAgICAgICAgY29uc29sZS5sb2coXCJzYWQgZmFjZVwiKTtcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgICRzY29wZS5yZWZyZXNoKCk7XG5cbiAgICAkc2NvcGUuc2hvd1RyYWRlID0gZnVuY3Rpb24gKGlkKSB7XG4gICAgICAkc3RhdGUuZ28oJ2FwcC50cmFkZScsIHtcbiAgICAgICAgaWQ6IGlkXG4gICAgICB9KTtcbiAgICB9O1xuXG4gICAgJHNjb3BlLiRvbignYXV0aGNoYW5nZScsIGZ1bmN0aW9uICgpIHtcbiAgICAgICRzY29wZS5yZWZyZXNoKCk7XG4gICAgfSk7XG4gIH0pO1xuIiwiLypnbG9iYWxzIGFuZ3VsYXIsIHdpbmRvdyAqL1xuYW5ndWxhci5tb2R1bGUoJ2luc2lkZXIuY29udHJvbGxlcnMnKVxuICAuY29udHJvbGxlcignQ29tcGFueUN0cmwnLCBmdW5jdGlvbiAoJHN0YXRlLCAkc2NvcGUsICRzdGF0ZVBhcmFtcywgQ29tcGFueVNlcnZpY2UpIHtcbiAgICAkc2NvcGUuc2hvd1RyYWRlcyA9IHRydWU7XG5cbiAgICAkc2NvcGUucmVmcmVzaCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICRzY29wZS5yZXRyeVdpdGhQcm9taXNlKENvbXBhbnlTZXJ2aWNlLmZpbmRCeUlkLCBbJHN0YXRlUGFyYW1zLmlkXSwgMywgdGhpcylcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24gKGNvbXBhbnlEYXRhKSB7XG4gICAgICAgICAgJHNjb3BlLmNvbXBhbnkgPSBjb21wYW55RGF0YTtcbiAgICAgICAgfSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgIGNvbnNvbGUubG9nKFwic2FkIGZhY2VcIik7XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICAkc2NvcGUucmVmcmVzaCgpO1xuXG4gICAgJHNjb3BlLmdvVG9JbnNpZGVyID0gZnVuY3Rpb24gKGluc2lkZXIpIHtcbiAgICAgICRzdGF0ZS5nbygnYXBwLmluc2lkZXInLCB7XG4gICAgICAgIGlkOiBpbnNpZGVyLmlkXG4gICAgICB9KTtcbiAgICB9O1xuXG4gICAgJHNjb3BlLmdvVG9Gb3JtNCA9IGZ1bmN0aW9uIChmb3JtNCkge1xuICAgICAgJHN0YXRlLmdvKCdhcHAuZm9ybTQnLCB7XG4gICAgICAgIGlkOiBmb3JtNC5pZFxuICAgICAgfSk7XG4gICAgfTtcbiAgfSk7XG4iLCIvKmdsb2JhbHMgYW5ndWxhciwgd2luZG93ICovXG5hbmd1bGFyLm1vZHVsZSgnaW5zaWRlci5jb250cm9sbGVycycpXG4gIC5jb250cm9sbGVyKCdGb3JtNEN0cmwnLCBmdW5jdGlvbiAoJHNjb3BlLCAkc3RhdGVQYXJhbXMsIEZvcm00U2VydmljZSkge1xuICAgICRzY29wZS5yZWZyZXNoID0gZnVuY3Rpb24gKCkge1xuICAgICAgJHNjb3BlLnJldHJ5V2l0aFByb21pc2UoRm9ybTRTZXJ2aWNlLmZpbmRCeUlkLCBbJHN0YXRlUGFyYW1zLmlkXSwgMywgdGhpcylcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24gKGZvcm00RGF0YSkge1xuICAgICAgICAgICRzY29wZS5mb3JtNCA9IGZvcm00RGF0YTtcbiAgICAgICAgfSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgIGNvbnNvbGUubG9nKFwic2FkIGZhY2VcIik7XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICAkc2NvcGUubmF2aWdhdGVUbyA9IGZ1bmN0aW9uICh1cmwpIHtcbiAgICAgIHdpbmRvdy5vcGVuKHVybCwgJ19ibGFuaycsICdsb2NhdGlvbj15ZXMnKTtcbiAgICB9O1xuXG4gICAgJHNjb3BlLnJlZnJlc2goKTtcbiAgfSk7XG4iLCIvKmdsb2JhbHMgYW5ndWxhciwgd2luZG93ICovXG5hbmd1bGFyLm1vZHVsZSgnaW5zaWRlci5jb250cm9sbGVycycpXG4gIC5jb250cm9sbGVyKCdJbnNpZGVyQ3RybCcsIGZ1bmN0aW9uICgkc3RhdGUsICRzY29wZSwgJHN0YXRlUGFyYW1zLCBJbnNpZGVyU2VydmljZSkge1xuICAgICRzY29wZS5zaG93VHJhZGVzID0gdHJ1ZTtcblxuICAgICRzY29wZS5yZWZyZXNoID0gZnVuY3Rpb24gKCkge1xuICAgICAgJHNjb3BlLnJldHJ5V2l0aFByb21pc2UoSW5zaWRlclNlcnZpY2UuZmluZEJ5SWQsIFskc3RhdGVQYXJhbXMuaWRdLCAzLCB0aGlzKVxuICAgICAgICAudGhlbihmdW5jdGlvbiAoaW5zaWRlckRhdGEpIHtcbiAgICAgICAgICAkc2NvcGUuaW5zaWRlciA9IGluc2lkZXJEYXRhO1xuICAgICAgICB9LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coXCJzYWQgZmFjZVwiKTtcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgICRzY29wZS5yZWZyZXNoKCk7XG5cbiAgICAkc2NvcGUuZ29Ub0NvbXBhbnkgPSBmdW5jdGlvbiAoY29tcGFueSkge1xuICAgICAgJHN0YXRlLmdvKCdhcHAuY29tcGFueScsIHtcbiAgICAgICAgaWQ6IGNvbXBhbnkuaWRcbiAgICAgIH0pO1xuICAgIH07XG4gICAgJHNjb3BlLmdvVG9Gb3JtNCA9IGZ1bmN0aW9uIChmb3JtNCkge1xuICAgICAgJHN0YXRlLmdvKCdhcHAuZm9ybTQnLCB7XG4gICAgICAgIGlkOiBmb3JtNC5pZFxuICAgICAgfSk7XG4gICAgfTtcbiAgfSk7XG4iLCIvKmdsb2JhbHMgYW5ndWxhciwgd2luZG93ICovXG5hbmd1bGFyLm1vZHVsZSgnaW5zaWRlci5jb250cm9sbGVycycpXG4gIC5jb250cm9sbGVyKCdTZWFyY2hDdHJsJywgZnVuY3Rpb24gKCRzdGF0ZSwgJHNjb3BlLCBTZWFyY2hTZXJ2aWNlKSB7XG4gICAgJHNjb3BlLmtleXdvcmQgPSBcIlwiO1xuICAgICRzY29wZS5yZXN1bHRzID0gW107XG4gICAgJHNjb3BlLnNlYXJjaCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIFNlYXJjaFNlcnZpY2Uuc2VhcmNoKCRzY29wZS5rZXl3b3JkKS50aGVuKGZ1bmN0aW9uIChyZXNwKSB7XG4gICAgICAgICRzY29wZS5yZXN1bHRzID0gcmVzcC5kYXRhO1xuICAgICAgfSk7XG4gICAgfTtcblxuICAgICRzY29wZS5vcGVuUmVzdWx0ID0gZnVuY3Rpb24gKHJlc3VsdCkge1xuICAgICAgdmFyIHdoZXJlID0gKHJlc3VsdFsxXSA9PT0gJ0luc2lkZXInKSA/ICdhcHAuaW5zaWRlcicgOiAnYXBwLmNvbXBhbnknO1xuICAgICAgJHN0YXRlLmdvKHdoZXJlLCB7XG4gICAgICAgIGlkOiByZXN1bHRbMF1cbiAgICAgIH0pO1xuICAgIH07XG4gICAgJHNjb3BlLnNlYXJjaCgpO1xuICB9KTtcbiIsIi8qZ2xvYmFscyBhbmd1bGFyLCB3aW5kb3cgKi9cbmFuZ3VsYXIubW9kdWxlKCdpbnNpZGVyLmNvbnRyb2xsZXJzJylcbiAuY29udHJvbGxlcignVG9kYXlzQnV5c0N0cmwnLCBmdW5jdGlvbiAoJHN0YXRlLCAkc2NvcGUsIEJ1eUlkZWFTZXJ2aWNlKSB7XG4gICAgJHNjb3BlLnRyYWRlcyA9IFtdO1xuXG4gICAgJHNjb3BlLnJlZnJlc2ggPSBmdW5jdGlvbiAoKSB7XG4gICAgICAkc2NvcGUucmV0cnlXaXRoUHJvbWlzZShCdXlJZGVhU2VydmljZS5maW5kVG9kYXlzLCBbXSwgMywgdGhpcylcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24gKHRyYWRlcykge1xuICAgICAgICAgICRzY29wZS50cmFkZXMgPSB0cmFkZXM7XG4gICAgICAgIH0sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBjb25zb2xlLmxvZyhcInNhZCBmYWNlXCIpO1xuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgJHNjb3BlLnJlZnJlc2goKTtcblxuICAgICRzY29wZS5zaG93VHJhZGUgPSBmdW5jdGlvbiAoaWQpIHtcbiAgICAgICRzdGF0ZS5nbygnYXBwLnRyYWRlJywge1xuICAgICAgICBpZDogaWRcbiAgICAgIH0pO1xuICAgIH07XG5cbiAgICAkc2NvcGUuJG9uKCdhdXRoY2hhbmdlJywgZnVuY3Rpb24gKCkge1xuICAgICAgJHNjb3BlLnJlZnJlc2goKTtcbiAgICB9KTtcbiAgfSk7XG5cbiIsIi8qZ2xvYmFscyBhbmd1bGFyLCB3aW5kb3csIGRvY3VtZW50ICovXG5hbmd1bGFyLm1vZHVsZSgnaW5zaWRlci5jb250cm9sbGVycycpXG4gIC5jb250cm9sbGVyKCdUcmFkZUN0cmwnLCBmdW5jdGlvbiAoJHRpbWVvdXQsICRpb25pY1BvcHVwLCAkc2NvcGUsICRzdGF0ZVBhcmFtcywgQnV5SWRlYVNlcnZpY2UsIENvbW1lbnRTZXJ2aWNlLCBBdXRoU2VydmljZSkge1xuICAgICRzY29wZS5jb21tZW50RGF0YSA9IHt9O1xuICAgICRzY29wZS5zaG93Q29tbWVudEJveCA9IGZhbHNlO1xuXG4gICAgJHNjb3BlLm5hdmlnYXRlVG8gPSBmdW5jdGlvbiAodXJsKSB7XG4gICAgICB3aW5kb3cub3Blbih1cmwsICdfYmxhbmsnLCAnbG9jYXRpb249eWVzJyk7XG4gICAgfTtcblxuICAgICRzY29wZS5mb2N1c09uQ29tbWVudEJvZHkgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAkdGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjb21tZW50LWJvZHknKS5mb2N1cygpO1xuICAgICAgfSwgMTUwKTtcbiAgICB9O1xuXG4gICAgJHNjb3BlLmZldGNoQXR0ZW1wdHMgPSAwO1xuICAgICRzY29wZS5yZWZyZXNoID0gZnVuY3Rpb24gKCkge1xuICAgICAgJHNjb3BlLnJldHJ5V2l0aFByb21pc2UoQnV5SWRlYVNlcnZpY2UuZmluZEJ5SWQsIFskc3RhdGVQYXJhbXMuaWRdLCAzLCB0aGlzKVxuICAgICAgICAudGhlbihmdW5jdGlvbiAodHJhZGUpIHtcbiAgICAgICAgICAkc2NvcGUudHJhZGUgPSB0cmFkZTtcbiAgICAgICAgfSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgIGNvbnNvbGUubG9nKFwic2FkIGZhY2VcIik7XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICAkc2NvcGUucmVmcmVzaCgpO1xuXG4gICAgJHNjb3BlLnVzZXJJc0F1dGhvck9mID0gZnVuY3Rpb24gKGNvbW1lbnQpIHtcbiAgICAgIHJldHVybiBjb21tZW50LmF1dGhvcl9lbWFpbCA9PT0gQXV0aFNlcnZpY2UuY3VycmVudFVzZXIoKS5lbWFpbDtcbiAgICB9O1xuXG4gICAgJHNjb3BlLmFkZENvbW1lbnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAkc2NvcGUuY29tbWVudERhdGEuaWRlYV9pZCA9ICRzY29wZS50cmFkZS5pZDtcbiAgICAgIENvbW1lbnRTZXJ2aWNlLmFkZENvbW1lbnQoJHNjb3BlLmNvbW1lbnREYXRhKS50aGVuKGZ1bmN0aW9uIChjb21tZW50KSB7XG4gICAgICAgICRzY29wZS50cmFkZS5jb21tZW50cy51bnNoaWZ0KGNvbW1lbnQpO1xuICAgICAgICAkc2NvcGUuY29tbWVudERhdGEgPSB7fTtcbiAgICAgIH0sIGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICAgIGlmIChkYXRhLnN0YXR1cyA9PT0gNDAxKSB7XG4gICAgICAgICAgJHNjb3BlLnNob3dDb21tZW50Qm94ID0gdHJ1ZTtcbiAgICAgICAgICAkc2NvcGUubG9naW4oKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfTtcblxuICAgICRzY29wZS5yZW1vdmVDb21tZW50ID0gZnVuY3Rpb24gKGNvbW1lbnQpIHtcbiAgICAgIGlmICghJHNjb3BlLnVzZXJJc0F1dGhvck9mKGNvbW1lbnQpKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIHZhciBteVBvcHVwID0gJGlvbmljUG9wdXAuc2hvdyh7XG4gICAgICAgIHRlbXBsYXRlOiAnJyxcbiAgICAgICAgdGl0bGU6ICdBcmUgeW91IHN1cmUgeW91IHdhbnQgdG8gZGVsZXRlIHlvdXIgY29tbWVudD8nLFxuICAgICAgICBzdWJUaXRsZTogJycsXG4gICAgICAgIHNjb3BlOiAkc2NvcGUsXG4gICAgICAgIGJ1dHRvbnM6IFt7XG4gICAgICAgICAgdGV4dDogJ0NhbmNlbCdcbiAgICAgICAgfSwge1xuICAgICAgICAgIHRleHQ6ICc8Yj5EZWxldGU8L2I+JyxcbiAgICAgICAgICB0eXBlOiAnYnV0dG9uLWFzc2VydGl2ZScsXG4gICAgICAgICAgb25UYXA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIENvbW1lbnRTZXJ2aWNlLnJlbW92ZUNvbW1lbnQoY29tbWVudC5pZCkudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgIHZhciBjb21tZW50SW5kZXggPSAkc2NvcGUudHJhZGUuY29tbWVudHMuaW5kZXhPZihjb21tZW50KTtcbiAgICAgICAgICAgICAgJHNjb3BlLnRyYWRlLmNvbW1lbnRzLnNwbGljZShjb21tZW50SW5kZXgsIDEpO1xuICAgICAgICAgICAgICBteVBvcHVwLmNsb3NlKCk7XG4gICAgICAgICAgICB9LCBmdW5jdGlvbiAoZGF0YSkge1xuICAgICAgICAgICAgICBjb25zb2xlLmxvZyhkYXRhKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIFwidGVzdFwiO1xuICAgICAgICAgIH1cbiAgICAgICAgfSwgXVxuICAgICAgfSk7XG4gICAgICAvLyBteVBvcHVwLnRoZW4oZnVuY3Rpb24ocmVzKSB7XG4gICAgICAvLyAgIGNvbnNvbGUubG9nKCdUYXBwZWQhJywgcmVzKTtcbiAgICAgIC8vIH0pO1xuICAgICAgJHRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICBteVBvcHVwLmNsb3NlKCk7IC8vY2xvc2UgdGhlIHBvcHVwIGFmdGVyIDMgc2Vjb25kcyBmb3Igc29tZSByZWFzb25cbiAgICAgIH0sIDMwMDApO1xuICAgIH07XG4gIH0pO1xuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
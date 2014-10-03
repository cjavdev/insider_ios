/*global window, cordova, angular */
var app = angular.module('insider', [
    'ionic',
    'insider.controllers',
    'insider.services',
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
    });
  });

/*globals angular, md5 */
var today = new Date(),
    thisYear = today.getFullYear();
angular.module('insider.filters', [])
.filter('gravatar', function () {
  return function (email) {
    return "http://www.gravatar.com/avatar/" + md5(email);
  };
})
.filter('shortDate', function () {
  return function (date) {
    var d = new Date(date),
      month = d.getMonth() + 1,
      day = d.getDay() + 1,
      year = d.getFullYear();

    if(year === thisYear) {
       return month + "/" + day;
    }
    return year + "/" + month + "/" + day;
  };
});

/*globals angular, _ */
angular.module('insider.services', [])
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
  .controller('AppCtrl', function (loc, $scope, $ionicModal, $http, $rootScope) {
    // Form data for the login modal
    $scope.loginData = {};

    // Create the login modal that we will use later
    $ionicModal.fromTemplateUrl('templates/login.html', {
      scope: $scope
    }).then(function (modal) {
      $scope.modal = modal;
    });

    // Triggered in the login modal to close it
    $scope.closeLogin = function () {
      $scope.modal.hide();
    };

    // Open the login modal
    $scope.login = function () {
      $scope.modal.show();
    };

    $scope.logout = function () {
      $scope.doLogout();
    };

    $scope.loggedIn = function () {
      var token = window.localStorage.getItem('auth_token');
      if (token !== null) {
        $http.defaults.headers.common['Auth-Token-X'] = token;
      }
      return token !== null;
    };

    // Perform the login action when the user submits the login form
    $scope.doLogin = function () {
      var params = {
        user: $scope.loginData
      };
      params.device = {
        platform: 'ios',
        token: $rootScope.deviceToken
      };

      $http.post(loc.apiBase + '/api/v1/users/sign_in.json', params).
      success(function (data) {
        $rootScope.currentUser.email = data.email;
        window.localStorage.setItem('auth_token', data.auth_token);
        $http.defaults.headers.common['Auth-Token-X'] = data.auth_token;
        $rootScope.$broadcast('authchange');
        $scope.closeLogin();
      }).
      error(function (data) {
        if(data.message) {
          window.alert(data.message);
        } else {
          window.alert("Something went wrong with your login. Try again.");
        }
      });
    };
    // Perform the login action when the user submits the login form
    $scope.doLogout = function () {
      $http.delete(app.config.apiBase + '/api/v1/users/sign_out.json').
        success(function () {
          $rootScope.$broadcast('authchange');
        });

      $http.defaults.headers.common['Auth-Token-X'] = undefined;
      window.localStorage.removeItem('auth_token');
    };
  });

/*globals angular, window */
 angular.module('insider.controllers')
  .controller('BuysCtrl', function ($state, $scope, BuyIdeaService, $ionicLoading) {
    $scope.fetchAttempts = 0;

    $scope.refresh = function () {
      $scope.loading = true;
      $ionicLoading.show({
        template: "<i class='ion-loading-d'></i>"
      });
      BuyIdeaService.findAll().then(function (trades) {
        $scope.trades = trades;
        $scope.loading = false;
        $ionicLoading.hide();
      }, function () {
        if($scope.fetchAttempts < 3) {
          console.log('trying to fetch all again in 2 seconds');
          setTimeout(function () {
            $scope.refresh();
          }, 2000);
          $scope.fetchAttempts++;
        } else {
          console.log('giving up...');
          $scope.trades = [];
          $ionicLoading.hide();
        }
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
  .controller('CompanyCtrl', function ($scope, $stateParams, CompanyService) {
    $scope.showTrades = true;
    CompanyService.findById($stateParams.id).then(function (data) {
      $scope.company = data;
    }, function () {
      console.log("no company found :(");
    });
  });

/*globals angular, window */
angular.module('insider.controllers')
  .controller('Form4Ctrl', function ($scope, $stateParams, Form4Service) {
    Form4Service.findById($stateParams.id).then(function (data) {
      $scope.form4 = data;
    }, function () {
      console.log("no form4 found :(");
    });
  });

/*globals angular, window */
angular.module('insider.controllers')
  .controller('InsiderCtrl', function ($scope, $stateParams, InsiderService) {
    InsiderService.findById($stateParams.id).then(function (data) {
      $scope.insider = data;
    }, function () {
      console.log("no insider found :(");
    });
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
 .controller('TodaysBuysCtrl', function ($state, $scope, BuyIdeaService, $ionicLoading) {
    $scope.trades = [];
    $scope.fetchAttempts = 0;
    $scope.refresh = function () {
      $scope.loading = true;
      $ionicLoading.show({
        template: "<i class='ion-loading-d'></i>"
      });

      BuyIdeaService.findTodays().then(function (trades) {
        $scope.trades = trades;
        $scope.loading = false;
        $ionicLoading.hide();
      }, function () {
        if($scope.fetchAttempts < 3) {
          console.log('trying to fetch today again in 2 seconds', $scope.fetchAttempts);
          setTimeout(function () {
            $scope.refresh();
          }, 2000);
          $scope.fetchAttempts++;
        } else {
          console.log('giving up...');
          $scope.trades = [];
          $ionicLoading.hide();
        }
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
  })


/*globals angular, window */
angular.module('insider.controllers')
  .controller('TradeCtrl', function ($timeout, $ionicPopup, $rootScope, $scope, $stateParams, BuyIdeaService, CommentService) {
    $scope.commentData = {};
    $scope.showCommentBox = false;

    $scope.navigateTo = function (url) {
      window.open(url, '_blank', 'location=yes');
    };
    BuyIdeaService.findById($stateParams.id).then(function (trade) {
      $scope.trade = trade;
    }, function (data) {
      console.log(data.message);
    });

    $scope.userIsAuthorOf = function (comment) {
      console.log(comment.author_email === $rootScope.currentUser.email);
      return comment.author_email === $rootScope.currentUser.email;
    };

    $scope.addComment = function () {
      $scope.commentData.idea_id = $scope.trade.id;
      CommentService.addComment($scope.commentData).then(function (comment) {
        $scope.trade.comments.unshift(comment);
        $scope.commentData = {};
      }, function (data) {
        if(data.status === 401) {
          $scope.login();
        }
      });
    };


    $scope.removeComment = function (comment) {
      if(!$scope.userIsAuthorOf(comment)) {
        return;
      }
       var myPopup = $ionicPopup.show({
        template: '',
        title: 'Are you sure you want to delete your comment?',
        subTitle: '',
        scope: $scope,
        buttons: [
          { text: 'Cancel' },
          {
            text: '<b>Delete</b>',
            type: 'button-assertive',
            onTap: function() {
              CommentService.removeComment(comment.id).then(function () {
                var commentIndex = $scope.trade.comments.indexOf(comment)
                $scope.trade.comments.splice(commentIndex, 1);
                myPopup.close();
              }, function (data) {
                console.log(data);
              });
              return "test"
            }
          },
        ]
      });
      // myPopup.then(function(res) {
      //   console.log('Tapped!', res);
      // });
      $timeout(function() {
         myPopup.close(); //close the popup after 3 seconds for some reason
      }, 3000);

    };
  });

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImZpbHRlcnMuanMiLCJjb21tZW50X3Nlcml2Y2UuanMiLCJjb21wYW55X3NlcnZpY2UuanMiLCJmb3JtNF9zZXJ2aWNlLmpzIiwiaWRlYV9zZXJ2aWNlLmpzIiwiaW5zaWRlcl9zZXJ2aWNlLmpzIiwic2VhcmNoX3Nlcml2Y2UuanMiLCJhcHBfY29udHJvbGxlci5qcyIsImJ1eXNfY29udHJvbGxlci5qcyIsImNvbXBhbnlfY29udHJvbGxlci5qcyIsImZvcm00X2NvbnRyb2xsZXIuanMiLCJpbnNpZGVyX2NvbnRyb2xsZXIuanMiLCJzZWFyY2hfY29udHJvbGxlci5qcyIsInRvZGF5c19idXlzX2NvbnRyb2xsZXIuanMiLCJ0cmFkZV9jb250cm9sbGVyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3JKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDdEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3RCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDeENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN0QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDeEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN4Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDMUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImFsbC5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qZ2xvYmFsIHdpbmRvdywgY29yZG92YSwgYW5ndWxhciAqL1xudmFyIGFwcCA9IGFuZ3VsYXIubW9kdWxlKCdpbnNpZGVyJywgW1xuICAgICdpb25pYycsXG4gICAgJ2luc2lkZXIuY29udHJvbGxlcnMnLFxuICAgICdpbnNpZGVyLnNlcnZpY2VzJyxcbiAgICAnaW5zaWRlci5maWx0ZXJzJyxcbiAgICAnbmdDb3Jkb3ZhJ1xuICBdKVxuICAuY29uc3RhbnQoJ2xvYycsIHtcbiAgICAvL2FwaUJhc2U6ICdodHRwOi8vbG9jYWxob3N0OjMwMDAnXG4gICAgYXBpQmFzZTogJ2h0dHBzOi8vaW5zaWRlcmFpLmNvbSdcbiAgfSlcbiAgLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIsICR1cmxSb3V0ZXJQcm92aWRlcikge1xuICAgICRzdGF0ZVByb3ZpZGVyXG4gICAgICAuc3RhdGUoJ2FwcCcsIHtcbiAgICAgICAgdXJsOiAnL2FwcCcsXG4gICAgICAgIGFic3RyYWN0OiB0cnVlLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ3RlbXBsYXRlcy9tZW51Lmh0bWwnLFxuICAgICAgICBjb250cm9sbGVyOiAnQXBwQ3RybCdcbiAgICAgIH0pXG4gICAgICAuc3RhdGUoJ2FwcC5idXlzJywge1xuICAgICAgICB1cmw6ICcvYnV5cycsXG4gICAgICAgIHZpZXdzOiB7XG4gICAgICAgICAgJ21lbnVDb250ZW50Jzoge1xuICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICd0ZW1wbGF0ZXMvYnV5cy5odG1sJyxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdCdXlzQ3RybCdcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgICAuc3RhdGUoJ2FwcC50b2RheScsIHtcbiAgICAgICAgdXJsOiAnL3RvZGF5JyxcbiAgICAgICAgdmlld3M6IHtcbiAgICAgICAgICAnbWVudUNvbnRlbnQnOiB7XG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogJ3RlbXBsYXRlcy90b2RheS5odG1sJyxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdUb2RheXNCdXlzQ3RybCdcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgICAuc3RhdGUoJ2FwcC50cmFkZScsIHtcbiAgICAgICAgdXJsOiAnL3RyYWRlcy86aWQnLFxuICAgICAgICB2aWV3czoge1xuICAgICAgICAgICdtZW51Q29udGVudCc6IHtcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAndGVtcGxhdGVzL3RyYWRlLmh0bWwnLFxuICAgICAgICAgICAgY29udHJvbGxlcjogJ1RyYWRlQ3RybCdcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgICAuc3RhdGUoJ2FwcC5pbnNpZGVyJywge1xuICAgICAgICB1cmw6ICcvaW5zaWRlcnMvOmlkJyxcbiAgICAgICAgdmlld3M6IHtcbiAgICAgICAgICAnbWVudUNvbnRlbnQnOiB7XG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogJ3RlbXBsYXRlcy9pbnNpZGVyLmh0bWwnLFxuICAgICAgICAgICAgY29udHJvbGxlcjogJ0luc2lkZXJDdHJsJ1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSlcbiAgICAgIC5zdGF0ZSgnYXBwLmZvcm00Jywge1xuICAgICAgICB1cmw6ICcvZm9ybTRzLzppZCcsXG4gICAgICAgIHZpZXdzOiB7XG4gICAgICAgICAgJ21lbnVDb250ZW50Jzoge1xuICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICd0ZW1wbGF0ZXMvZm9ybTQuaHRtbCcsXG4gICAgICAgICAgICBjb250cm9sbGVyOiAnRm9ybTRDdHJsJ1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSlcbiAgICAgIC5zdGF0ZSgnYXBwLmNvbXBhbnknLCB7XG4gICAgICAgIHVybDogJy9jb21wYW5pZXMvOmlkJyxcbiAgICAgICAgdmlld3M6IHtcbiAgICAgICAgICAnbWVudUNvbnRlbnQnOiB7XG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogJ3RlbXBsYXRlcy9jb21wYW55Lmh0bWwnLFxuICAgICAgICAgICAgY29udHJvbGxlcjogJ0NvbXBhbnlDdHJsJ1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSlcbiAgICAgIC5zdGF0ZSgnYXBwLnNlYXJjaCcsIHtcbiAgICAgICAgdXJsOiAnL3NlYXJjaCcsXG4gICAgICAgIHZpZXdzOiB7XG4gICAgICAgICAgJ21lbnVDb250ZW50Jzoge1xuICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICd0ZW1wbGF0ZXMvc2VhcmNoLmh0bWwnLFxuICAgICAgICAgICAgY29udHJvbGxlcjogJ1NlYXJjaEN0cmwnXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAvLyBpZiBub25lIG9mIHRoZSBhYm92ZSBzdGF0ZXMgYXJlIG1hdGNoZWQsIHVzZSB0aGlzIGFzIHRoZSBmYWxsYmFja1xuICAgICR1cmxSb3V0ZXJQcm92aWRlci5vdGhlcndpc2UoJy9hcHAvYnV5cycpO1xuICB9KVxuICAucnVuKGZ1bmN0aW9uIChsb2MsICRodHRwLCAkaW9uaWNQbGF0Zm9ybSwgJGNvcmRvdmFQdXNoLCAkcm9vdFNjb3BlKSB7XG4gICAgJHJvb3RTY29wZS5jdXJyZW50VXNlciA9IHt9O1xuICAgIHZhciB0b2tlbiA9IHdpbmRvdy5sb2NhbFN0b3JhZ2UuZ2V0SXRlbSgnYXV0aF90b2tlbicpO1xuICAgIGlmICh0b2tlbiAhPT0gbnVsbCkge1xuICAgICAgJGh0dHAuZGVmYXVsdHMuaGVhZGVycy5jb21tb25bJ0F1dGgtVG9rZW4tWCddID0gdG9rZW47XG4gICAgfVxuICAgICRodHRwLmdldChsb2MuYXBpQmFzZSArICcvYXBpL3YxL3Nlc3Npb25zL3ZhbGlkYXRlLmpzb24nKVxuICAgICAgLnRoZW4oZnVuY3Rpb24gKHJlc3ApIHtcbiAgICAgICAgY29uc29sZS5sb2cocmVzcC5kYXRhKTtcbiAgICAgICAgJHJvb3RTY29wZS5jdXJyZW50VXNlciA9IHJlc3AuZGF0YS51c2VyO1xuICAgICAgfSwgZnVuY3Rpb24gKHJlc3ApIHtcbiAgICAgICAgd2luZG93LmxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKCdhdXRoX3Rva2VuJyk7XG4gICAgICAgIGRlbGV0ZSAkaHR0cC5kZWZhdWx0cy5oZWFkZXJzLmNvbW1vblsnQXV0aC1Ub2tlbi1YJ107XG4gICAgICAgIGNvbnNvbGUubG9nKHJlc3AuZGF0YS5tZXNzYWdlKTtcbiAgICAgIH0pO1xuXG4gICAgJGlvbmljUGxhdGZvcm0ucmVhZHkoZnVuY3Rpb24gKCkge1xuICAgICAgLy8gSGlkZSB0aGUgYWNjZXNzb3J5IGJhciBieSBkZWZhdWx0IChyZW1vdmUgdGhpcyB0byBzaG93IHRoZSBhY2Nlc3NvcnkgYmFyIGFib3ZlIHRoZSBrZXlib2FyZFxuICAgICAgLy8gZm9yIGZvcm0gaW5wdXRzKVxuICAgICAgaWYgKHdpbmRvdy5jb3Jkb3ZhICYmIHdpbmRvdy5jb3Jkb3ZhLnBsdWdpbnMuS2V5Ym9hcmQpIHtcbiAgICAgICAgY29yZG92YS5wbHVnaW5zLktleWJvYXJkLmhpZGVLZXlib2FyZEFjY2Vzc29yeUJhcih0cnVlKTtcbiAgICAgIH1cbiAgICAgIGlmICh3aW5kb3cuU3RhdHVzQmFyKSB7XG4gICAgICAgIC8vIG9yZy5hcGFjaGUuY29yZG92YS5zdGF0dXNiYXIgcmVxdWlyZWRcbiAgICAgICAgd2luZG93LlN0YXR1c0Jhci5zdHlsZUxpZ2h0Q29udGVudCgpO1xuICAgICAgfVxuXG4gICAgICB2YXIgaW9zQ29uZmlnID0ge1xuICAgICAgICBcImJhZGdlXCI6IFwidHJ1ZVwiLFxuICAgICAgICBcInNvdW5kXCI6IFwidHJ1ZVwiLFxuICAgICAgICBcImFsZXJ0XCI6IFwidHJ1ZVwiLFxuICAgICAgICBcImVjYlwiOiBcIm9uTm90aWZpY2F0aW9uQVBOXCJcbiAgICAgIH07XG5cbiAgICAgICRjb3Jkb3ZhUHVzaC5yZWdpc3Rlcihpb3NDb25maWcpLnRoZW4oZnVuY3Rpb24gKHJlc3VsdCkge1xuICAgICAgICAkcm9vdFNjb3BlLmRldmljZVRva2VuID0gcmVzdWx0O1xuICAgICAgfSwgZnVuY3Rpb24gKGVycikge1xuICAgICAgICBjb25zb2xlLmxvZyhcIm5vdCBhYmxlIHRvIHNlbmQgcHVzaFwiLCBlcnIpO1xuICAgICAgfSk7XG4gICAgICAvLyAkY29yZG92YVB1c2gudW5yZWdpc3RlcihvcHRpb25zKS50aGVuKGZ1bmN0aW9uKHJlc3VsdCkge1xuICAgICAgLy8gICBhbGVydChcInVucmVnaXN0ZXJcIik7XG4gICAgICAvLyAgIGFsZXJ0KHJlc3VsdCk7XG4gICAgICAvLyAgIGFsZXJ0KGFyZ3VtZW50cyk7XG4gICAgICAvLyAgICAgLy8gU3VjY2VzcyFcbiAgICAgIC8vIH0sIGZ1bmN0aW9uKGVycikge1xuICAgICAgLy8gICBhbGVydChcImVycm9yXCIpO1xuICAgICAgLy8gICBhbGVydChlcnIpO1xuICAgICAgLy8gICAgIC8vIEFuIGVycm9yIG9jY3VyZWQuIFNob3cgYSBtZXNzYWdlIHRvIHRoZSB1c2VyXG4gICAgICAvLyB9KTtcbiAgICAgIC8vXG4gICAgICAvLyAvLyBpT1Mgb25seVxuICAgICAgLy8gJGNvcmRvdmFQdXNoLnNldEJhZGdlTnVtYmVyKDIpLnRoZW4oZnVuY3Rpb24ocmVzdWx0KSB7XG4gICAgICAvLyAgIGFsZXJ0KFwic2V0IGJhZGdlIHRvIDIhXCIpO1xuICAgICAgLy8gICBhbGVydChyZXN1bHQpO1xuICAgICAgLy8gICBhbGVydChhcmd1bWVudHMpO1xuICAgICAgLy8gICAgIC8vIFN1Y2Nlc3MhXG4gICAgICAvLyB9LCBmdW5jdGlvbihlcnIpIHtcbiAgICAgIC8vICAgYWxlcnQoXCJlcnJvclwiKTtcbiAgICAgIC8vICAgYWxlcnQoZXJyKTtcbiAgICAgIC8vICAgICAvLyBBbiBlcnJvciBvY2N1cmVkLiBTaG93IGEgbWVzc2FnZSB0byB0aGUgdXNlclxuICAgICAgLy8gfSk7XG4gICAgfSk7XG4gIH0pO1xuIiwiLypnbG9iYWxzIGFuZ3VsYXIsIG1kNSAqL1xudmFyIHRvZGF5ID0gbmV3IERhdGUoKSxcbiAgICB0aGlzWWVhciA9IHRvZGF5LmdldEZ1bGxZZWFyKCk7XG5hbmd1bGFyLm1vZHVsZSgnaW5zaWRlci5maWx0ZXJzJywgW10pXG4uZmlsdGVyKCdncmF2YXRhcicsIGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uIChlbWFpbCkge1xuICAgIHJldHVybiBcImh0dHA6Ly93d3cuZ3JhdmF0YXIuY29tL2F2YXRhci9cIiArIG1kNShlbWFpbCk7XG4gIH07XG59KVxuLmZpbHRlcignc2hvcnREYXRlJywgZnVuY3Rpb24gKCkge1xuICByZXR1cm4gZnVuY3Rpb24gKGRhdGUpIHtcbiAgICB2YXIgZCA9IG5ldyBEYXRlKGRhdGUpLFxuICAgICAgbW9udGggPSBkLmdldE1vbnRoKCkgKyAxLFxuICAgICAgZGF5ID0gZC5nZXREYXkoKSArIDEsXG4gICAgICB5ZWFyID0gZC5nZXRGdWxsWWVhcigpO1xuXG4gICAgaWYoeWVhciA9PT0gdGhpc1llYXIpIHtcbiAgICAgICByZXR1cm4gbW9udGggKyBcIi9cIiArIGRheTtcbiAgICB9XG4gICAgcmV0dXJuIHllYXIgKyBcIi9cIiArIG1vbnRoICsgXCIvXCIgKyBkYXk7XG4gIH07XG59KTtcbiIsIi8qZ2xvYmFscyBhbmd1bGFyLCBfICovXG5hbmd1bGFyLm1vZHVsZSgnaW5zaWRlci5zZXJ2aWNlcycsIFtdKVxuICAuZmFjdG9yeSgnQ29tbWVudFNlcnZpY2UnLCBmdW5jdGlvbihsb2MsICRxLCAkaHR0cCkge1xuICAgIGZ1bmN0aW9uIHVybChpZCkge1xuICAgICAgaWYoaWQpIHtcbiAgICAgICAgcmV0dXJuIGxvYy5hcGlCYXNlICsgJy9hcGkvdjEvY29tbWVudHMvJyArIGlkICsgJy5qc29uJztcbiAgICAgIH1cbiAgICAgIHJldHVybiBsb2MuYXBpQmFzZSArICcvYXBpL3YxL2NvbW1lbnRzLmpzb24nO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICBhZGRDb21tZW50OiBmdW5jdGlvbiAocGFyYW1zKSB7XG4gICAgICAgIHZhciBkZWZlcnJlZCA9ICRxLmRlZmVyKCk7XG4gICAgICAgICRodHRwLnBvc3QodXJsKCksIHBhcmFtcykudGhlbihmdW5jdGlvbiAocmVzcCkge1xuICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUocmVzcC5kYXRhKTtcbiAgICAgICAgfSwgZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgICAgICBkZWZlcnJlZC5yZWplY3QoZGF0YSk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbiAgICAgIH0sXG5cbiAgICAgIHJlbW92ZUNvbW1lbnQ6IGZ1bmN0aW9uIChpZCkge1xuICAgICAgICByZXR1cm4gJGh0dHAuZGVsZXRlKHVybChpZCkpO1xuICAgICAgfVxuICAgIH07XG4gIH0pO1xuIiwiLypnbG9iYWxzIGFuZ3VsYXIsIF8gKi9cbmFuZ3VsYXIubW9kdWxlKCdpbnNpZGVyLnNlcnZpY2VzJylcbiAgLmZhY3RvcnkoJ0NvbXBhbnlTZXJ2aWNlJywgZnVuY3Rpb24obG9jLCAkcSwgJGh0dHApIHtcbiAgICBmdW5jdGlvbiB1cmwoaWQpIHtcbiAgICAgaWYoaWQpIHtcbiAgICAgICAgcmV0dXJuIGxvYy5hcGlCYXNlICsgJy9hcGkvdjEvY29tcGFuaWVzLycgKyBpZCArICcuanNvbic7XG4gICAgICB9XG4gICAgICByZXR1cm4gbG9jLmFwaUJhc2UgKyAnL2FwaS92MS9jb21wYW5pZXMuanNvbic7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIGZpbmRCeUlkOiBmdW5jdGlvbiAoaWQpIHtcbiAgICAgICAgdmFyIGRlZmVycmVkID0gJHEuZGVmZXIoKTtcbiAgICAgICAgJGh0dHAuZ2V0KHVybChpZCkpLnRoZW4oZnVuY3Rpb24gKHJlc3ApIHtcbiAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKHJlc3AuZGF0YSk7XG4gICAgICAgIH0sIGZ1bmN0aW9uIChyZXNwKSB7XG4gICAgICAgICAgZGVmZXJyZWQucmVqZWN0KHJlc3AuZGF0YSk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbiAgICAgIH0sXG4gICAgfTtcbiAgfSk7XG5cbiIsIi8qZ2xvYmFscyBhbmd1bGFyLCBfICovXG5hbmd1bGFyLm1vZHVsZSgnaW5zaWRlci5zZXJ2aWNlcycpXG4gIC5mYWN0b3J5KCdGb3JtNFNlcnZpY2UnLCBmdW5jdGlvbihsb2MsICRxLCAkaHR0cCkge1xuICAgIGZ1bmN0aW9uIHVybChpZCkge1xuICAgICBpZihpZCkge1xuICAgICAgICByZXR1cm4gbG9jLmFwaUJhc2UgKyAnL2FwaS92MS9mb3JtNHMvJyArIGlkICsgJy5qc29uJztcbiAgICAgIH1cbiAgICAgIHJldHVybiBsb2MuYXBpQmFzZSArICcvYXBpL3YxL2Zvcm00cy5qc29uJztcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgZmluZEJ5SWQ6IGZ1bmN0aW9uIChpZCkge1xuICAgICAgICB2YXIgZGVmZXJyZWQgPSAkcS5kZWZlcigpO1xuICAgICAgICAkaHR0cC5nZXQodXJsKGlkKSkudGhlbihmdW5jdGlvbiAocmVzcCkge1xuICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUocmVzcC5kYXRhKTtcbiAgICAgICAgfSwgZnVuY3Rpb24gKHJlc3ApIHtcbiAgICAgICAgICBkZWZlcnJlZC5yZWplY3QocmVzcC5kYXRhKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xuICAgICAgfSxcbiAgICB9O1xuICB9KTtcbiIsIi8qZ2xvYmFscyBhbmd1bGFyLCBfICovXG5hbmd1bGFyLm1vZHVsZSgnaW5zaWRlci5zZXJ2aWNlcycpXG4gIC5mYWN0b3J5KCdCdXlJZGVhU2VydmljZScsIGZ1bmN0aW9uKGxvYywgJHEsICRodHRwKSB7XG4gICAgZnVuY3Rpb24gdXJsKGlkKSB7XG4gICAgICBpZihpZCkge1xuICAgICAgICByZXR1cm4gbG9jLmFwaUJhc2UgKyAnL2FwaS92MS9idXlzLycgKyBpZCArICcuanNvbic7XG4gICAgICB9XG4gICAgICByZXR1cm4gbG9jLmFwaUJhc2UgKyAnL2FwaS92MS9idXlzLmpzb24nO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICBmaW5kQWxsOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBkZWZlcnJlZCA9ICRxLmRlZmVyKCk7XG4gICAgICAgICRodHRwLmdldCh1cmwoKSkudGhlbihmdW5jdGlvbiAocmVzcCkge1xuICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUocmVzcC5kYXRhKTtcbiAgICAgICAgfSwgZnVuY3Rpb24gKHJlc3ApIHtcbiAgICAgICAgICBkZWZlcnJlZC5yZWplY3QocmVzcC5kYXRhKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xuICAgICAgfSxcblxuICAgICAgZmluZEJ5SWQ6IGZ1bmN0aW9uIChpZCkge1xuICAgICAgICB2YXIgZGVmZXJyZWQgPSAkcS5kZWZlcigpO1xuICAgICAgICAkaHR0cC5nZXQodXJsKGlkKSkudGhlbihmdW5jdGlvbiAocmVzcCkge1xuICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUocmVzcC5kYXRhKTtcbiAgICAgICAgfSwgZnVuY3Rpb24gKHJlc3ApIHtcbiAgICAgICAgICBkZWZlcnJlZC5yZWplY3QocmVzcC5kYXRhKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xuICAgICAgfSxcblxuICAgICAgZmluZFRvZGF5czogZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgZGVmZXJyZWQgPSAkcS5kZWZlcigpO1xuICAgICAgICAkaHR0cC5nZXQodXJsKCksIHsgcGFyYW1zOiB7ICd0b2RheSc6IHRydWUgfSB9KS50aGVuKGZ1bmN0aW9uIChyZXNwKSB7XG4gICAgICAgICAgZGVmZXJyZWQucmVzb2x2ZShyZXNwLmRhdGEpO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG4gICAgICB9XG4gICAgfTtcbiAgfSk7XG4iLCIvKmdsb2JhbHMgYW5ndWxhciwgXyAqL1xuYW5ndWxhci5tb2R1bGUoJ2luc2lkZXIuc2VydmljZXMnKVxuICAuZmFjdG9yeSgnSW5zaWRlclNlcnZpY2UnLCBmdW5jdGlvbihsb2MsICRxLCAkaHR0cCkge1xuICAgIGZ1bmN0aW9uIHVybChpZCkge1xuICAgICBpZihpZCkge1xuICAgICAgICByZXR1cm4gbG9jLmFwaUJhc2UgKyAnL2FwaS92MS9pbnNpZGVycy8nICsgaWQgKyAnLmpzb24nO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGxvYy5hcGlCYXNlICsgJy9hcGkvdjEvaW5zaWRlcnMuanNvbic7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIGZpbmRCeUlkOiBmdW5jdGlvbiAoaWQpIHtcbiAgICAgICAgdmFyIGRlZmVycmVkID0gJHEuZGVmZXIoKTtcbiAgICAgICAgJGh0dHAuZ2V0KHVybChpZCkpLnRoZW4oZnVuY3Rpb24gKHJlc3ApIHtcbiAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKHJlc3AuZGF0YSk7XG4gICAgICAgIH0sIGZ1bmN0aW9uIChyZXNwKSB7XG4gICAgICAgICAgZGVmZXJyZWQucmVqZWN0KHJlc3AuZGF0YSk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbiAgICAgIH0sXG4gICAgfTtcbiAgfSk7XG4iLCIvKmdsb2JhbHMgYW5ndWxhciwgXyAqL1xuYW5ndWxhci5tb2R1bGUoJ2luc2lkZXIuc2VydmljZXMnKVxuICAuZmFjdG9yeSgnU2VhcmNoU2VydmljZScsIGZ1bmN0aW9uKGxvYywgJGh0dHApIHtcbiAgICBmdW5jdGlvbiB1cmwocSkge1xuICAgICAgcmV0dXJuIGxvYy5hcGlCYXNlICsgJy9hcGkvdjEvc2VhcmNoP3E9JyArIHE7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIHNlYXJjaDogZnVuY3Rpb24gKGtleXdvcmQpIHtcbiAgICAgICAgcmV0dXJuICRodHRwLmdldCh1cmwoa2V5d29yZCkpO1xuICAgICAgfVxuICAgIH07XG4gIH0pO1xuIiwiLypnbG9iYWxzIGFuZ3VsYXIsIHdpbmRvdyAqL1xuYW5ndWxhci5tb2R1bGUoJ2luc2lkZXIuY29udHJvbGxlcnMnLCBbXSlcbiAgLmNvbnRyb2xsZXIoJ0FwcEN0cmwnLCBmdW5jdGlvbiAobG9jLCAkc2NvcGUsICRpb25pY01vZGFsLCAkaHR0cCwgJHJvb3RTY29wZSkge1xuICAgIC8vIEZvcm0gZGF0YSBmb3IgdGhlIGxvZ2luIG1vZGFsXG4gICAgJHNjb3BlLmxvZ2luRGF0YSA9IHt9O1xuXG4gICAgLy8gQ3JlYXRlIHRoZSBsb2dpbiBtb2RhbCB0aGF0IHdlIHdpbGwgdXNlIGxhdGVyXG4gICAgJGlvbmljTW9kYWwuZnJvbVRlbXBsYXRlVXJsKCd0ZW1wbGF0ZXMvbG9naW4uaHRtbCcsIHtcbiAgICAgIHNjb3BlOiAkc2NvcGVcbiAgICB9KS50aGVuKGZ1bmN0aW9uIChtb2RhbCkge1xuICAgICAgJHNjb3BlLm1vZGFsID0gbW9kYWw7XG4gICAgfSk7XG5cbiAgICAvLyBUcmlnZ2VyZWQgaW4gdGhlIGxvZ2luIG1vZGFsIHRvIGNsb3NlIGl0XG4gICAgJHNjb3BlLmNsb3NlTG9naW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAkc2NvcGUubW9kYWwuaGlkZSgpO1xuICAgIH07XG5cbiAgICAvLyBPcGVuIHRoZSBsb2dpbiBtb2RhbFxuICAgICRzY29wZS5sb2dpbiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICRzY29wZS5tb2RhbC5zaG93KCk7XG4gICAgfTtcblxuICAgICRzY29wZS5sb2dvdXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAkc2NvcGUuZG9Mb2dvdXQoKTtcbiAgICB9O1xuXG4gICAgJHNjb3BlLmxvZ2dlZEluID0gZnVuY3Rpb24gKCkge1xuICAgICAgdmFyIHRva2VuID0gd2luZG93LmxvY2FsU3RvcmFnZS5nZXRJdGVtKCdhdXRoX3Rva2VuJyk7XG4gICAgICBpZiAodG9rZW4gIT09IG51bGwpIHtcbiAgICAgICAgJGh0dHAuZGVmYXVsdHMuaGVhZGVycy5jb21tb25bJ0F1dGgtVG9rZW4tWCddID0gdG9rZW47XG4gICAgICB9XG4gICAgICByZXR1cm4gdG9rZW4gIT09IG51bGw7XG4gICAgfTtcblxuICAgIC8vIFBlcmZvcm0gdGhlIGxvZ2luIGFjdGlvbiB3aGVuIHRoZSB1c2VyIHN1Ym1pdHMgdGhlIGxvZ2luIGZvcm1cbiAgICAkc2NvcGUuZG9Mb2dpbiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciBwYXJhbXMgPSB7XG4gICAgICAgIHVzZXI6ICRzY29wZS5sb2dpbkRhdGFcbiAgICAgIH07XG4gICAgICBwYXJhbXMuZGV2aWNlID0ge1xuICAgICAgICBwbGF0Zm9ybTogJ2lvcycsXG4gICAgICAgIHRva2VuOiAkcm9vdFNjb3BlLmRldmljZVRva2VuXG4gICAgICB9O1xuXG4gICAgICAkaHR0cC5wb3N0KGxvYy5hcGlCYXNlICsgJy9hcGkvdjEvdXNlcnMvc2lnbl9pbi5qc29uJywgcGFyYW1zKS5cbiAgICAgIHN1Y2Nlc3MoZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgICAgJHJvb3RTY29wZS5jdXJyZW50VXNlci5lbWFpbCA9IGRhdGEuZW1haWw7XG4gICAgICAgIHdpbmRvdy5sb2NhbFN0b3JhZ2Uuc2V0SXRlbSgnYXV0aF90b2tlbicsIGRhdGEuYXV0aF90b2tlbik7XG4gICAgICAgICRodHRwLmRlZmF1bHRzLmhlYWRlcnMuY29tbW9uWydBdXRoLVRva2VuLVgnXSA9IGRhdGEuYXV0aF90b2tlbjtcbiAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KCdhdXRoY2hhbmdlJyk7XG4gICAgICAgICRzY29wZS5jbG9zZUxvZ2luKCk7XG4gICAgICB9KS5cbiAgICAgIGVycm9yKGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICAgIGlmKGRhdGEubWVzc2FnZSkge1xuICAgICAgICAgIHdpbmRvdy5hbGVydChkYXRhLm1lc3NhZ2UpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHdpbmRvdy5hbGVydChcIlNvbWV0aGluZyB3ZW50IHdyb25nIHdpdGggeW91ciBsb2dpbi4gVHJ5IGFnYWluLlwiKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfTtcbiAgICAvLyBQZXJmb3JtIHRoZSBsb2dpbiBhY3Rpb24gd2hlbiB0aGUgdXNlciBzdWJtaXRzIHRoZSBsb2dpbiBmb3JtXG4gICAgJHNjb3BlLmRvTG9nb3V0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgJGh0dHAuZGVsZXRlKGFwcC5jb25maWcuYXBpQmFzZSArICcvYXBpL3YxL3VzZXJzL3NpZ25fb3V0Lmpzb24nKS5cbiAgICAgICAgc3VjY2VzcyhmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KCdhdXRoY2hhbmdlJyk7XG4gICAgICAgIH0pO1xuXG4gICAgICAkaHR0cC5kZWZhdWx0cy5oZWFkZXJzLmNvbW1vblsnQXV0aC1Ub2tlbi1YJ10gPSB1bmRlZmluZWQ7XG4gICAgICB3aW5kb3cubG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oJ2F1dGhfdG9rZW4nKTtcbiAgICB9O1xuICB9KTtcbiIsIi8qZ2xvYmFscyBhbmd1bGFyLCB3aW5kb3cgKi9cbiBhbmd1bGFyLm1vZHVsZSgnaW5zaWRlci5jb250cm9sbGVycycpXG4gIC5jb250cm9sbGVyKCdCdXlzQ3RybCcsIGZ1bmN0aW9uICgkc3RhdGUsICRzY29wZSwgQnV5SWRlYVNlcnZpY2UsICRpb25pY0xvYWRpbmcpIHtcbiAgICAkc2NvcGUuZmV0Y2hBdHRlbXB0cyA9IDA7XG5cbiAgICAkc2NvcGUucmVmcmVzaCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICRzY29wZS5sb2FkaW5nID0gdHJ1ZTtcbiAgICAgICRpb25pY0xvYWRpbmcuc2hvdyh7XG4gICAgICAgIHRlbXBsYXRlOiBcIjxpIGNsYXNzPSdpb24tbG9hZGluZy1kJz48L2k+XCJcbiAgICAgIH0pO1xuICAgICAgQnV5SWRlYVNlcnZpY2UuZmluZEFsbCgpLnRoZW4oZnVuY3Rpb24gKHRyYWRlcykge1xuICAgICAgICAkc2NvcGUudHJhZGVzID0gdHJhZGVzO1xuICAgICAgICAkc2NvcGUubG9hZGluZyA9IGZhbHNlO1xuICAgICAgICAkaW9uaWNMb2FkaW5nLmhpZGUoKTtcbiAgICAgIH0sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYoJHNjb3BlLmZldGNoQXR0ZW1wdHMgPCAzKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coJ3RyeWluZyB0byBmZXRjaCBhbGwgYWdhaW4gaW4gMiBzZWNvbmRzJyk7XG4gICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkc2NvcGUucmVmcmVzaCgpO1xuICAgICAgICAgIH0sIDIwMDApO1xuICAgICAgICAgICRzY29wZS5mZXRjaEF0dGVtcHRzKys7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY29uc29sZS5sb2coJ2dpdmluZyB1cC4uLicpO1xuICAgICAgICAgICRzY29wZS50cmFkZXMgPSBbXTtcbiAgICAgICAgICAkaW9uaWNMb2FkaW5nLmhpZGUoKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfTtcbiAgICAkc2NvcGUucmVmcmVzaCgpO1xuXG4gICAgJHNjb3BlLnNob3dUcmFkZSA9IGZ1bmN0aW9uIChpZCkge1xuICAgICAgJHN0YXRlLmdvKCdhcHAudHJhZGUnLCB7XG4gICAgICAgIGlkOiBpZFxuICAgICAgfSk7XG4gICAgfTtcblxuICAgICRzY29wZS4kb24oJ2F1dGhjaGFuZ2UnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAkc2NvcGUucmVmcmVzaCgpO1xuICAgIH0pO1xuICB9KTtcbiIsIi8qZ2xvYmFscyBhbmd1bGFyLCB3aW5kb3cgKi9cbmFuZ3VsYXIubW9kdWxlKCdpbnNpZGVyLmNvbnRyb2xsZXJzJylcbiAgLmNvbnRyb2xsZXIoJ0NvbXBhbnlDdHJsJywgZnVuY3Rpb24gKCRzY29wZSwgJHN0YXRlUGFyYW1zLCBDb21wYW55U2VydmljZSkge1xuICAgICRzY29wZS5zaG93VHJhZGVzID0gdHJ1ZTtcbiAgICBDb21wYW55U2VydmljZS5maW5kQnlJZCgkc3RhdGVQYXJhbXMuaWQpLnRoZW4oZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgICRzY29wZS5jb21wYW55ID0gZGF0YTtcbiAgICB9LCBmdW5jdGlvbiAoKSB7XG4gICAgICBjb25zb2xlLmxvZyhcIm5vIGNvbXBhbnkgZm91bmQgOihcIik7XG4gICAgfSk7XG4gIH0pO1xuIiwiLypnbG9iYWxzIGFuZ3VsYXIsIHdpbmRvdyAqL1xuYW5ndWxhci5tb2R1bGUoJ2luc2lkZXIuY29udHJvbGxlcnMnKVxuICAuY29udHJvbGxlcignRm9ybTRDdHJsJywgZnVuY3Rpb24gKCRzY29wZSwgJHN0YXRlUGFyYW1zLCBGb3JtNFNlcnZpY2UpIHtcbiAgICBGb3JtNFNlcnZpY2UuZmluZEJ5SWQoJHN0YXRlUGFyYW1zLmlkKS50aGVuKGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICAkc2NvcGUuZm9ybTQgPSBkYXRhO1xuICAgIH0sIGZ1bmN0aW9uICgpIHtcbiAgICAgIGNvbnNvbGUubG9nKFwibm8gZm9ybTQgZm91bmQgOihcIik7XG4gICAgfSk7XG4gIH0pO1xuIiwiLypnbG9iYWxzIGFuZ3VsYXIsIHdpbmRvdyAqL1xuYW5ndWxhci5tb2R1bGUoJ2luc2lkZXIuY29udHJvbGxlcnMnKVxuICAuY29udHJvbGxlcignSW5zaWRlckN0cmwnLCBmdW5jdGlvbiAoJHNjb3BlLCAkc3RhdGVQYXJhbXMsIEluc2lkZXJTZXJ2aWNlKSB7XG4gICAgSW5zaWRlclNlcnZpY2UuZmluZEJ5SWQoJHN0YXRlUGFyYW1zLmlkKS50aGVuKGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICAkc2NvcGUuaW5zaWRlciA9IGRhdGE7XG4gICAgfSwgZnVuY3Rpb24gKCkge1xuICAgICAgY29uc29sZS5sb2coXCJubyBpbnNpZGVyIGZvdW5kIDooXCIpO1xuICAgIH0pO1xuICB9KTtcbiIsIi8qZ2xvYmFscyBhbmd1bGFyLCB3aW5kb3cgKi9cbmFuZ3VsYXIubW9kdWxlKCdpbnNpZGVyLmNvbnRyb2xsZXJzJylcbiAgLmNvbnRyb2xsZXIoJ1NlYXJjaEN0cmwnLCBmdW5jdGlvbiAoJHN0YXRlLCAkc2NvcGUsIFNlYXJjaFNlcnZpY2UpIHtcbiAgICAkc2NvcGUua2V5d29yZCA9IFwiXCI7XG4gICAgJHNjb3BlLnJlc3VsdHMgPSBbXTtcbiAgICAkc2NvcGUuc2VhcmNoID0gZnVuY3Rpb24gKCkge1xuICAgICAgU2VhcmNoU2VydmljZS5zZWFyY2goJHNjb3BlLmtleXdvcmQpLnRoZW4oZnVuY3Rpb24gKHJlc3ApIHtcbiAgICAgICAgJHNjb3BlLnJlc3VsdHMgPSByZXNwLmRhdGE7XG4gICAgICB9KTtcbiAgICB9O1xuXG4gICAgJHNjb3BlLm9wZW5SZXN1bHQgPSBmdW5jdGlvbiAocmVzdWx0KSB7XG4gICAgICB2YXIgd2hlcmUgPSAocmVzdWx0WzFdID09PSAnSW5zaWRlcicpID8gJ2FwcC5pbnNpZGVyJyA6ICdhcHAuY29tcGFueSc7XG4gICAgICAkc3RhdGUuZ28od2hlcmUsIHtcbiAgICAgICAgaWQ6IHJlc3VsdFswXVxuICAgICAgfSk7XG4gICAgfTtcbiAgICAkc2NvcGUuc2VhcmNoKCk7XG4gIH0pO1xuIiwiLypnbG9iYWxzIGFuZ3VsYXIsIHdpbmRvdyAqL1xuYW5ndWxhci5tb2R1bGUoJ2luc2lkZXIuY29udHJvbGxlcnMnKVxuIC5jb250cm9sbGVyKCdUb2RheXNCdXlzQ3RybCcsIGZ1bmN0aW9uICgkc3RhdGUsICRzY29wZSwgQnV5SWRlYVNlcnZpY2UsICRpb25pY0xvYWRpbmcpIHtcbiAgICAkc2NvcGUudHJhZGVzID0gW107XG4gICAgJHNjb3BlLmZldGNoQXR0ZW1wdHMgPSAwO1xuICAgICRzY29wZS5yZWZyZXNoID0gZnVuY3Rpb24gKCkge1xuICAgICAgJHNjb3BlLmxvYWRpbmcgPSB0cnVlO1xuICAgICAgJGlvbmljTG9hZGluZy5zaG93KHtcbiAgICAgICAgdGVtcGxhdGU6IFwiPGkgY2xhc3M9J2lvbi1sb2FkaW5nLWQnPjwvaT5cIlxuICAgICAgfSk7XG5cbiAgICAgIEJ1eUlkZWFTZXJ2aWNlLmZpbmRUb2RheXMoKS50aGVuKGZ1bmN0aW9uICh0cmFkZXMpIHtcbiAgICAgICAgJHNjb3BlLnRyYWRlcyA9IHRyYWRlcztcbiAgICAgICAgJHNjb3BlLmxvYWRpbmcgPSBmYWxzZTtcbiAgICAgICAgJGlvbmljTG9hZGluZy5oaWRlKCk7XG4gICAgICB9LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmKCRzY29wZS5mZXRjaEF0dGVtcHRzIDwgMykge1xuICAgICAgICAgIGNvbnNvbGUubG9nKCd0cnlpbmcgdG8gZmV0Y2ggdG9kYXkgYWdhaW4gaW4gMiBzZWNvbmRzJywgJHNjb3BlLmZldGNoQXR0ZW1wdHMpO1xuICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJHNjb3BlLnJlZnJlc2goKTtcbiAgICAgICAgICB9LCAyMDAwKTtcbiAgICAgICAgICAkc2NvcGUuZmV0Y2hBdHRlbXB0cysrO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNvbnNvbGUubG9nKCdnaXZpbmcgdXAuLi4nKTtcbiAgICAgICAgICAkc2NvcGUudHJhZGVzID0gW107XG4gICAgICAgICAgJGlvbmljTG9hZGluZy5oaWRlKCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH07XG4gICAgJHNjb3BlLnJlZnJlc2goKTtcblxuICAgICRzY29wZS5zaG93VHJhZGUgPSBmdW5jdGlvbiAoaWQpIHtcbiAgICAgICRzdGF0ZS5nbygnYXBwLnRyYWRlJywge1xuICAgICAgICBpZDogaWRcbiAgICAgIH0pO1xuICAgIH07XG5cbiAgICAkc2NvcGUuJG9uKCdhdXRoY2hhbmdlJywgZnVuY3Rpb24gKCkge1xuICAgICAgJHNjb3BlLnJlZnJlc2goKTtcbiAgICB9KTtcbiAgfSlcblxuIiwiLypnbG9iYWxzIGFuZ3VsYXIsIHdpbmRvdyAqL1xuYW5ndWxhci5tb2R1bGUoJ2luc2lkZXIuY29udHJvbGxlcnMnKVxuICAuY29udHJvbGxlcignVHJhZGVDdHJsJywgZnVuY3Rpb24gKCR0aW1lb3V0LCAkaW9uaWNQb3B1cCwgJHJvb3RTY29wZSwgJHNjb3BlLCAkc3RhdGVQYXJhbXMsIEJ1eUlkZWFTZXJ2aWNlLCBDb21tZW50U2VydmljZSkge1xuICAgICRzY29wZS5jb21tZW50RGF0YSA9IHt9O1xuICAgICRzY29wZS5zaG93Q29tbWVudEJveCA9IGZhbHNlO1xuXG4gICAgJHNjb3BlLm5hdmlnYXRlVG8gPSBmdW5jdGlvbiAodXJsKSB7XG4gICAgICB3aW5kb3cub3Blbih1cmwsICdfYmxhbmsnLCAnbG9jYXRpb249eWVzJyk7XG4gICAgfTtcbiAgICBCdXlJZGVhU2VydmljZS5maW5kQnlJZCgkc3RhdGVQYXJhbXMuaWQpLnRoZW4oZnVuY3Rpb24gKHRyYWRlKSB7XG4gICAgICAkc2NvcGUudHJhZGUgPSB0cmFkZTtcbiAgICB9LCBmdW5jdGlvbiAoZGF0YSkge1xuICAgICAgY29uc29sZS5sb2coZGF0YS5tZXNzYWdlKTtcbiAgICB9KTtcblxuICAgICRzY29wZS51c2VySXNBdXRob3JPZiA9IGZ1bmN0aW9uIChjb21tZW50KSB7XG4gICAgICBjb25zb2xlLmxvZyhjb21tZW50LmF1dGhvcl9lbWFpbCA9PT0gJHJvb3RTY29wZS5jdXJyZW50VXNlci5lbWFpbCk7XG4gICAgICByZXR1cm4gY29tbWVudC5hdXRob3JfZW1haWwgPT09ICRyb290U2NvcGUuY3VycmVudFVzZXIuZW1haWw7XG4gICAgfTtcblxuICAgICRzY29wZS5hZGRDb21tZW50ID0gZnVuY3Rpb24gKCkge1xuICAgICAgJHNjb3BlLmNvbW1lbnREYXRhLmlkZWFfaWQgPSAkc2NvcGUudHJhZGUuaWQ7XG4gICAgICBDb21tZW50U2VydmljZS5hZGRDb21tZW50KCRzY29wZS5jb21tZW50RGF0YSkudGhlbihmdW5jdGlvbiAoY29tbWVudCkge1xuICAgICAgICAkc2NvcGUudHJhZGUuY29tbWVudHMudW5zaGlmdChjb21tZW50KTtcbiAgICAgICAgJHNjb3BlLmNvbW1lbnREYXRhID0ge307XG4gICAgICB9LCBmdW5jdGlvbiAoZGF0YSkge1xuICAgICAgICBpZihkYXRhLnN0YXR1cyA9PT0gNDAxKSB7XG4gICAgICAgICAgJHNjb3BlLmxvZ2luKCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH07XG5cblxuICAgICRzY29wZS5yZW1vdmVDb21tZW50ID0gZnVuY3Rpb24gKGNvbW1lbnQpIHtcbiAgICAgIGlmKCEkc2NvcGUudXNlcklzQXV0aG9yT2YoY29tbWVudCkpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgIHZhciBteVBvcHVwID0gJGlvbmljUG9wdXAuc2hvdyh7XG4gICAgICAgIHRlbXBsYXRlOiAnJyxcbiAgICAgICAgdGl0bGU6ICdBcmUgeW91IHN1cmUgeW91IHdhbnQgdG8gZGVsZXRlIHlvdXIgY29tbWVudD8nLFxuICAgICAgICBzdWJUaXRsZTogJycsXG4gICAgICAgIHNjb3BlOiAkc2NvcGUsXG4gICAgICAgIGJ1dHRvbnM6IFtcbiAgICAgICAgICB7IHRleHQ6ICdDYW5jZWwnIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgdGV4dDogJzxiPkRlbGV0ZTwvYj4nLFxuICAgICAgICAgICAgdHlwZTogJ2J1dHRvbi1hc3NlcnRpdmUnLFxuICAgICAgICAgICAgb25UYXA6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICBDb21tZW50U2VydmljZS5yZW1vdmVDb21tZW50KGNvbW1lbnQuaWQpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciBjb21tZW50SW5kZXggPSAkc2NvcGUudHJhZGUuY29tbWVudHMuaW5kZXhPZihjb21tZW50KVxuICAgICAgICAgICAgICAgICRzY29wZS50cmFkZS5jb21tZW50cy5zcGxpY2UoY29tbWVudEluZGV4LCAxKTtcbiAgICAgICAgICAgICAgICBteVBvcHVwLmNsb3NlKCk7XG4gICAgICAgICAgICAgIH0sIGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coZGF0YSk7XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICByZXR1cm4gXCJ0ZXN0XCJcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9LFxuICAgICAgICBdXG4gICAgICB9KTtcbiAgICAgIC8vIG15UG9wdXAudGhlbihmdW5jdGlvbihyZXMpIHtcbiAgICAgIC8vICAgY29uc29sZS5sb2coJ1RhcHBlZCEnLCByZXMpO1xuICAgICAgLy8gfSk7XG4gICAgICAkdGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgIG15UG9wdXAuY2xvc2UoKTsgLy9jbG9zZSB0aGUgcG9wdXAgYWZ0ZXIgMyBzZWNvbmRzIGZvciBzb21lIHJlYXNvblxuICAgICAgfSwgMzAwMCk7XG5cbiAgICB9O1xuICB9KTtcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
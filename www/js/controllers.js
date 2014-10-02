/*globals angular, window */

var app = angular.module('insider');
angular.module('insider.controllers', [])
  .controller('AppCtrl', function ($scope, $ionicModal, $http, $rootScope) {
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

      $http.post(app.config.apiBase + '/api/v1/users/sign_in.json', params).
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
  })
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
  })
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
  })
  .controller('Form4Ctrl', function ($scope, $stateParams, Form4Service) {
    Form4Service.findById($stateParams.id).then(function (data) {
      $scope.form4 = data;
    }, function () {
      console.log("no form4 found :(");
    });
  })
  .controller('InsiderCtrl', function ($scope, $stateParams, InsiderService) {
    InsiderService.findById($stateParams.id).then(function (data) {
      $scope.insider = data;
    }, function () {
      console.log("no insider found :(");
    });
  })
  .controller('CompanyCtrl', function ($scope, $stateParams, CompanyService) {
    $scope.showTrades = true;
    CompanyService.findById($stateParams.id).then(function (data) {
      $scope.company = data;
    }, function () {
      console.log("no company found :(");
    });
  })
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

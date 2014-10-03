/*globals angular, window */
angular.module('insider.controllers')
  .controller('TradeCtrl', function ($ionicLoading, $timeout, $ionicPopup, $rootScope, $scope, $stateParams, BuyIdeaService, CommentService) {
    $scope.commentData = {};
    $scope.showCommentBox = false;

    $scope.navigateTo = function (url) {
      window.open(url, '_blank', 'location=yes');
    };

    $scope.fetchAttempts = 0;
    $scope.refresh = function () {
      $scope.loading = true;
      $ionicLoading.show({
        template: "<i class='ion-loading-d'></i>"
      });

      BuyIdeaService.findById($stateParams.id)
        .then(function (trade) {
          $scope.trade = trade;
          $scope.loading = false;
          $ionicLoading.hide();
        }, function () {
          if ($scope.fetchAttempts < 3) {
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
              var commentIndex = $scope.trade.comments.indexOf(comment)
              $scope.trade.comments.splice(commentIndex, 1);
              myPopup.close();
            }, function (data) {
              console.log(data);
            });
            return "test"
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

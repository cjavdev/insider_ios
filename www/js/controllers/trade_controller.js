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

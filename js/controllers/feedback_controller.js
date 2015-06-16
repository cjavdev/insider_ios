/*globals angular, window */
 angular.module('insider.controllers')
  .controller('FeedbackCtrl', function ($scope, $location, FeedbackService) {
    if(typeof analytics !== undefined) { analytics.trackView("Feedback Controller"); }
    $scope.feedback = {};

    $scope.submitFeedback = function () {
      FeedbackService.submitFeedback($scope.feedback);
      $location.path("/");
    };

    return;
  });

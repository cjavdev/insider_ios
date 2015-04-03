/*globals angular, _ */
angular.module('insider.services')
  .factory('FeedbackService', function(loc, $http) {
    function url() {
      return loc.apiBase + '/api/v2/feedbacks';
    }

    return {
      submitFeedback: function (feedbackParams) {
        return $http.post(url(), feedbackParams);
      }
    };
  });

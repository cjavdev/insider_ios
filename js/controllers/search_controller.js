/*globals angular, window */
angular.module('insider.controllers')
  .controller('SearchCtrl', function ($state, $scope, SearchService) {
    if(typeof analytics !== undefined) { analytics.trackView("Search Controller"); }
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

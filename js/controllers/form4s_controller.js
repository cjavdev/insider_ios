/*globals angular, window */
 angular.module('insider.controllers')
  .controller('Form4sCtrl', function ($cacheFactory, $state, $scope, loc, Form4Service) {
    this.offset = 0;
    var _form4s = [];
    var loadRemote = function (offset) {
      $scope.retryWithPromisePullToRefresh(Form4Service.allToday, [offset], 3, this)
        .then(function (form4s) {
          _form4s = _.uniq(_form4s.concat(form4s), 'id');
          $scope.form4s = _form4s;
          $scope.$broadcast('scroll.infiniteScrollComplete');
        }, function () {
          // TODO: show no trades found thing
          $scope.form4s = [];
        });
    };

    $scope.fetchMore = function () {
      if(_form4s.length > 1) {
        this.offset += 20;
      }
      console.log(this.offset);
      loadRemote(this.offset);
    }.bind(this);

    $scope.refresh = function () {
      var cache = $cacheFactory.get('$http');
      cache.remove(loc.apiBase + '/api/v2/form4s.json?today=true');
      loadRemote();
    };

    $scope.$on('$stateChangeSuccess', function() {
      $scope.fetchMore();
    });

    $scope.$on('authchange', function () {
      $scope.refresh();
    });
  });

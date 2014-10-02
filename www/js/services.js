/*globals angular, _ */

var app = angular.module('insider');
angular.module('insider.services', [])
  .factory('Form4Service', function($q, $http) {
    function url(id) {
     if(id) {
        return app.config.apiBase + '/api/v1/form4s/' + id + '.json';
      }
      return app.config.apiBase + '/api/v1/form4s.json';
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
  })
  .factory('InsiderService', function($q, $http) {
    function url(id) {
     if(id) {
        return app.config.apiBase + '/api/v1/insiders/' + id + '.json';
      }
      return app.config.apiBase + '/api/v1/insiders.json';
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
  })
  .factory('CompanyService', function($q, $http) {
    function url(id) {
     if(id) {
        return app.config.apiBase + '/api/v1/companies/' + id + '.json';
      }
      return app.config.apiBase + '/api/v1/companies.json';
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
  })
  .factory('SearchService', function($http) {
    function url(q) {
      return app.config.apiBase + '/api/v1/search?q=' + q;
    }

    return {
      search: function (keyword) {
        return $http.get(url(keyword));
      }
    };
  })
  .factory('CommentService', function($q, $http) {
    function url(id) {
      if(id) {
        return app.config.apiBase + '/api/v1/comments/' + id + '.json';
      }
      return app.config.apiBase + '/api/v1/comments.json';
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
  })
  .factory('BuyIdeaService', function($q, $http) {
    function url(id) {
      if(id) {
        return app.config.apiBase + '/api/v1/buys/' + id + '.json';
      }
      return app.config.apiBase + '/api/v1/buys.json';
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

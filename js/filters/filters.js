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

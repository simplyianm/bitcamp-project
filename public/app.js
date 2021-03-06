var s;

angular.module('justin', ['ui.router', 'ui.bootstrap'])

.config(function($stateProvider, $urlRouterProvider) {
  $stateProvider.state('home', {
    url: '/',
    controller: 'HomeCtrl',
    templateUrl: '/templates/home.html'
  }).state('iapd', {
    url: '/iapd/:id',
    controller: 'IapdCtrl',
    templateUrl: '/templates/iapd.html'
  }).state('company', {
    url: '/company/:id',
    controller: 'CompanyCtrl',
    templateUrl: '/templates/company.html'

  }).state('advisors', {
    url: '/advisors',
    controller: 'AdvisorsCtrl',
    templateUrl: '/templates/advisors.html'
  }).state('companies', {
    url: '/companies',
    controller: 'CompaniesCtrl',
    templateUrl: '/templates/companies.html'
  }).state('compare', {
    url: '/compare/:a/:b',
    controller: 'CompareCtrl',
    templateUrl: '/templates/compare.html'
  });

  $urlRouterProvider.otherwise('/');
})

.controller('MainCtrl', function($scope) {
  s = $scope;
})

.controller('HomeCtrl', function($scope, $http, $location, $advisors) {
  s.title = 'InvestorWatch - Verify the integrity of investment advisors';

  $scope.advisor = {};
  $scope.advisorIds = {};

  $scope.advisors = [];
  $advisors.then(function(data) {
    $scope.advisors = data;
  });

  $scope.onSelectA = function(item) {
    $scope.advisorIds.a = item._id;
  };

  $scope.onSelectB = function(item) {
    $scope.advisorIds.b = item._id;
  };

  $scope.compare = function() {
    if (!$scope.advisorIds.a || !$scope.advisorIds.b) return;
    $location.url('/compare/' + $scope.advisorIds.a + '/' + $scope.advisorIds.b);
  };
})

.controller('IapdCtrl', function($scope, $stateParams) {
  $http.get('/iapds/' + $stateParams.id).success(function(data) {
    $scope.iapd = data;
  });
})

.controller('CompareCtrl', function($scope, $stateParams, $http) {
  $http.get('/iapds/' + $stateParams.a).success(function(data) {
    $scope.a = transform(data);
    r();
  });
  $http.get('/iapds/' + $stateParams.b).success(function(data) {
    $scope.b = transform(data);
    r();
  });

  function r() {
    if (!$scope.a || !$scope.b) return;
    s.title = $scope.a.name + ' vs ' + $scope.b.name;
    $http.get('/companies/' + $scope.a.eid).success(function(data) {
      $scope.a.er = data.rating;
    });
    $http.get('/companies/' + $scope.b.eid).success(function(data) {
      $scope.b.er = data.rating;
    });
  }

})

.controller('AdvisorsCtrl', function($scope, $advisors) {
  s.title = 'Best and Worst Advisors';
  $scope.advisors = [];
  $advisors.then(function(data) {
    $scope.advisors = data;
  });
})

.controller('CompaniesCtrl', function($scope, $companies) {
  s.title = 'Best and Worst Companies';
  $scope.companies = [];
  $companies.then(function(data) {
    $scope.companies = data;
  });
})

.controller('CompanyCtrl', function($scope, $stateParams) {
  $http.get('/companies/' + $stateParams.id).success(function(data) {
    $scope.company = data;
  });
})

.factory('$companies', function($http, $q) {
  var data = {};
  return $q(function(resolve, reject) {
    if (data.companies) return resolve(data.companies);
    $http.get('/companies').then(function(companies) {
      data.companies = companies.data.filter(function(c) {
        return c.rating;
      });
      resolve(data.companies);
    });
  });
})

.factory('$advisors', function($http, $q) {
  var data = {};
  return $q(function(resolve, reject) {
    if (data.advisors) return resolve(data.advisors);
    $http.get('/iapds').then(function(iapds) {
      data.advisors = iapds.data.map(transform);
      resolve(data.advisors);
    });
  });
});

function transform(a) {
  var ret = {};
  ret._id = a._id;
  ret.name = a.Info['@firstNm'] + ' ' + a.Info['@lastNm'];
  ret.rating = a.score;
  if (a.CrntEmps) {
    ret.employer = a.CrntEmps['CrntEmp']['@orgNm'];
    ret.eid = a.CrntEmps['CrntEmp']['@orgPK'];
    ret.regs = a.CrntEmps['CrntEmp']['CrntRgstns']['CrntRgstn'];
    if (!Array.isArray(ret.regs)) {
      ret.regs = [ret.regs];
    }
    ret.regs = ret.regs.map(function(r) {
      return r['@regAuth'];
    });
  }
  if(!a.PrevRgstns){
    ret.exp = "<1"
  } else {
    if(!Array.isArray(a.PrevRgstns['PrevRgstn']))
      ret.exp = 2015 - parseInt(a.PrevRgstns['PrevRgstn']['@regBeginDt'].substring(0,4))
    else{
      ret.exp = 2015 - parseInt(a.PrevRgstns['PrevRgstn'][0]['@regBeginDt'].substring(0,4))
    }
  }

  if (a.Exms) {
    ret.exams = a.Exms['Exm'];
    if(!Array.isArray(ret.exams)){
      ret.exams = [ret.exams]
    }
    ret.exams = ret.exams.map(function(r) {
      return r['@exmNm'];
    });
  }
  ret.DRPs = [];

  if (a.DRPs) {
    for (key in a.DRPs['DRP']) {
      if (a.DRPs['DRP'].hasOwnProperty(key)) {
        ret.DRPs.push({
          key: key.substring(1).replace(/([A-Z])/g, ' $1')
            .replace(/^./, function(str){ return str.toUpperCase(); }),
          val: a.DRPs['DRP'][key]
        });
      }
    }
  }
  return ret;
}

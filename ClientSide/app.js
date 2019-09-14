let app = angular.module('myApp', ["ngRoute"]);

app.controller('indexController', function ($scope, $window, $location) {
    $scope.getUserName=function(){
        var user_name="Guest";
        if($window.sessionStorage.getItem("userName")!=null){
            user_name= $window.sessionStorage.getItem("userName");
        }
        return user_name;
    }
    
    /* check whether there is a logged user in the system */
     $scope.isUserLoggedIn= function(){
         if($window.sessionStorage.getItem("token")!=null )
             return true;
         else
             return false;
     }

     $scope.logOut=function(){
        $window.sessionStorage.removeItem("token");
        $window.sessionStorage.removeItem("userName");
        $location.path('/home');
    }
});

// config routes
app.config(function($routeProvider)  {
    $routeProvider
    // homepage
        .when('/home', {
            templateUrl: 'pages/home/home.html',
            controller : 'homeController as homeCtrl'
        })
        // about
        .when('/about', {
            // this is a template url
            templateUrl: 'pages/about/about.html',
        })
        // poi
        .when('/poi', {
            templateUrl: 'pages/poi/poi.html',
            controller : 'poiController as poiCtrl'
        })
        // register
        .when('/register', {
            templateUrl: 'pages/register/register.html',
            controller : 'registerController as regCtrl'
        })
        // retrieve password
        .when('/retrievePassword', {
            templateUrl: 'pages/home/retrievePassword.html',
            controller : 'homeController as homeCntrl'
        })
        .when('/loggedUserHome', {
            templateUrl: 'pages/login/login.html',
            controller : 'loginController as loginCtrl'
        })
        .when('/favourites',{
            templateUrl:'pages/favourites/favourites.html',
            controller: 'favouritesController as favorCtrl'
        })
        // other
        .otherwise({ redirectTo: '/home' });
});

app.service("poiDetails", function($http,$rootScope,$window){
   this.poiPopoverCtrl=function(poiId){
        var onDetailsRetrvied = function (response) {
            $rootScope.model_title=response.data.poiDetails[0].POIname;
            $rootScope.model_content=response.data.poiDetails[0].POIdescription;
            $rootScope.model_numViewers=response.data.poiDetails[0].POInumOfViewers;
            $rootScope.model_averagePoiRank=response.data.poiDetails[0].POIaverageRank;
            //for the favourites
            $rootScope.model_poiId=poiId;
            $rootScope.model_img=response.data.poiDetails[0].POIimage;
            $rootScope.model_category=response.data.poiDetails[0].CategoryName;
            var numReviews=response.data.poiLastReviews.length;
            if(numReviews==2){
                $rootScope.model_first_review=(response.data.poiLastReviews[0].Critic).concat
                (" (",(response.data.poiLastReviews[0].RankDate).substring(0,10)+")");
                $rootScope.model_second_review=(response.data.poiLastReviews[1].Critic)
                .concat(" (",(response.data.poiLastReviews[1].RankDate).substring(0,10)+")");;
            }
            else if(numReviews==1){
                $rootScope.model_first_review=(response.data.poiLastReviews[0].Critic).concat
                (" (",(response.data.poiLastReviews[0].RankDate).substring(0,10)+")");
            }
        }
        var onDetailsFailed = function (response) {
            //deal with errors!
            console.log(response);
        }
        var checkIfPOIInFavorites=function(poiId){
            var userFavourites=JSON.parse($window.sessionStorage.getItem('userFavouritePOIs'));
            for(var i = 0; i < userFavourites.length; i++) {
                var fav_poi = userFavourites[i];
                if(fav_poi.POIid== poiId){
                    return true;
                }
            }
            return false;
        }
        $rootScope.model_first_review=null;
        $rootScope.model_second_review=null;
        if($window.sessionStorage.getItem("token")!=null )
            $rootScope.isPOIInFavourite=checkIfPOIInFavorites(poiId);
        $http.get("http://localhost:3000/poi/getPOIDet/"+poiId).then(onDetailsRetrvied, onDetailsFailed);
    }
});

app.service("handleFavorites", function($window, $rootScope){
    this.removeFavPOIs=function(poiID,userFavorites)
    {
        for(var i = 0; i < userFavorites.length; i++) {
            var fav_poi = userFavorites[i];
            if(fav_poi.POIid== poiID){
                userFavorites.splice(i,1);
            }
        }
        $rootScope.numOfFavorites--;
        $window.sessionStorage.setItem("userFavouritePOIs",JSON.stringify(userFavorites));
        $rootScope.isPOIInFavourite=false;
        alert("removed!");
    }

    this.addFavPOIs=function(poiID,poiName,poiImage,poiCategory,poiRank,userFavorites)
    {
        var curDate= new Date();
        userFavorites.push({
            "POIid" :poiID,
            "POIname": poiName,            
            "InsertionDate": curDate,
            "CategoryName": poiCategory,
            "POIimage": poiImage,
            "POIaverageRank": poiRank
         });
         $rootScope.numOfFavorites++;
        $window.sessionStorage.setItem("userFavouritePOIs",JSON.stringify(userFavorites));
        $rootScope.isPOIInFavourite=true;
        alert("saved!");
    }
    
});

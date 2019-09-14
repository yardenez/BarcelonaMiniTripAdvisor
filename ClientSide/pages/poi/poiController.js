// poi controller
var jq = $.noConflict();
angular.module("myApp").controller("poiController", function ($rootScope,$scope, $http, $window, poiDetails,handleFavorites) {
    $scope.userFavourite =$window.sessionStorage.getItem('userFavouritePOIs');
    var favorites= $scope.userFavourite?JSON.parse($scope.userFavourite):[];
    $rootScope.numOfFavorites = favorites.length;
    //handle poi details presentaion
    $scope.showDet=function(event){
        poiDetails.poiPopoverCtrl(event.target.id);
    };
    //logged user check
    $scope.isUserLoggedIn = function () {
        if ($window.sessionStorage.getItem("token") != null)
            return true;
        else
            return false;
    }
    $scope.addOrRemoveFavorite = function (poiID,poiName,poiImage,poiCategory,poiRank) {
        $scope.userFavourite =JSON.parse($window.sessionStorage.getItem('userFavouritePOIs'));
        for(var p=0; p<$scope.allPOIs.length; p++){
            var poi = $scope.allPOIs[p];
            if(poi.POIid == poiID){
                console.log("true");
                if(poi.Favorite === true){
                    $scope.allPOIs[p].Favorite=false;
                    handleFavorites.removeFavPOIs(poiID, $scope.userFavourite);  
                }
                else{
                    $scope.allPOIs[p].Favorite=true;
                    handleFavorites.addFavPOIs(poiID,poiName,poiImage,poiCategory,poiRank,$scope.userFavourite);                    
                }
            }
        }
    }
    //retriveing categories
    var onSucessCategories = function (response) {
        $scope.categories = response.data;
    }
    var onErrorCategories = function (response) {
        console.log(response);
    }
    $http.get("http://localhost:3000/categories/getAllCategories").then(onSucessCategories, onErrorCategories);

    addIsFavorite = function (POIs) {
        $scope.userFavourite = JSON.parse($window.sessionStorage.getItem('userFavouritePOIs'));
        for (var j = 0; j < POIs.length; j++) {
            var isFav=false;
            for (var i = 0; i < $scope.userFavourite.length; i++) {
                var fav = $scope.userFavourite[i];
                if (fav.POIid == POIs[j].POIid) {
                    isFav=true;
                    break;
                }
            }
            POIs[j].Favorite= isFav;
        }
        return POIs;           
    }
    
    $scope.chooseImage =function(isFavorite){
        if(isFavorite)
            return "glyphicon glyphicon-heart"
        else
            return "glyphicon glyphicon-heart-empty"
    }

    //getAllPOIs
    var onSucessAllPOIs = function (response) {
        if($scope.isUserLoggedIn())
            $scope.allPOIs = addIsFavorite(response.data);
        else
            $scope.allPOIs = response.data;
        
    }
    var onErrorAllPOIs = function (response) {
        console.log(response);
    }
    $http.get("http://localhost:3000/poi/getALLPOIs").then(onSucessAllPOIs, onErrorAllPOIs);
    //change sort parameter
    $scope.sort = function () {
        if ($scope.sortByRank)
            return '-POIaverageRank';
        else
            return null;
    }
    //handle sort clicke
    $scope.toggleSortButtonText = "sort by rank";
    $scope.handleSortClicked = function () {
        if ($scope.toggleSortButtonText == "set to unsorted") {
            $scope.sortByRank = false;
            $scope.toggleSortButtonText = "sort by rank";
        }
        else {
            $scope.sortByRank = true;
            $scope.toggleSortButtonText = "set to unsorted";
        }
    }
    //handle review
    $scope.passPOIid = function (event) {
        $scope.poiForReview = event.target.id;
    }
    $scope.saveReview = function () {
        //checking the rank and content values
        if (!$scope.user_review)
            $scope.user_review = null;
        if (!$scope.userRating)
            alert("Please enter rank before submitting your review");
        else {
            $http({
                method: "POST",
                url: "http://localhost:3000/private/poi/saveReview",
                headers: { "x-auth-token": $window.sessionStorage.getItem("token") },
                data: {
                    "POIid": $scope.poiForReview,
                    "rank": $scope.userRating,
                    "review_content": $scope.user_review
                }
            }).then(function mySuccess(response) {
                alert("saved!");
                jq(".modal").modal('hide');
            }, function myError(response) {
                alert("save was unsuccesfull. Notice you can't review the same site twice");
            });
        }
    };
    $scope.removeFavourite=function(){
        $scope.addOrRemoveFavorite($rootScope.model_poiId, $rootScope.model_title, 
            $rootScope.model_img, $rootScope.model_category, $rootScope.model_averagePoiRank);
    };
    $scope.addFavourite=function(){
        $scope.addOrRemoveFavorite($rootScope.model_poiId, $rootScope.model_title, 
            $rootScope.model_img, $rootScope.model_category, $rootScope.model_averagePoiRank);
    };
    jq(document).ready(function () {
        jq(".modal").on('hidden.bs.modal', function () {
            jq('textarea#userContentInput').val('');
            $scope.user_review = null;
            jq('input[name="rate"]').prop('checked', false);
            $scope.userRating = null;
        });
    });
});


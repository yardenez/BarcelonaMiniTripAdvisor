// home controller
angular.module("myApp")
    .controller("homeController", function ($scope, $http, $window, $location, poiDetails) {
        var saveUserFavToStorage = function (response) {
            $http
            ({
                method: "GET",
                url:"http://localhost:3000/private/poi/getAllSavedFavouritePOI",
                headers: {"x-auth-token": response.data},
            }).then(function handleFavReqSuccess(favouritesReqRes) {
                $window.sessionStorage.setItem("userFavouritePOIs",JSON.stringify(favouritesReqRes.data));
            }, function handleFavReqError(favouritesReqRes) {
                console.log(favouritesReqRes);
            });
          };
        //handle login
        $scope.login = function () {
            $http({
                method: "POST",
                url: "http://localhost:3000/users/login",
                // headers: {},
                data: {
                    "username": $scope.username,
                    "password": $scope.password
                }
            }).then(function mySuccess(response) {

                $window.sessionStorage.setItem("token", response.data);
                $window.sessionStorage.setItem("userName", $scope.username);
                saveUserFavToStorage(response);
                $location.path('/loggedUserHome');
            }, function myError(response) {
                alert("Username or password incorrect, please try again! :)");
                });

        }
        var onSucessRandPOI = function (response) {
            $scope.randomePOIs = response.data;
        }
        var onErrorRandPOI = function (response) {
            console.log(response);
        }
        // TODO: determine real minimal rank
        $http.get("http://localhost:3000/poi/getRandomPOI/3").then(onSucessRandPOI, onErrorRandPOI);
        //handle showing poi detailes
        $scope.showDet = function (event) {
            poiDetails.poiPopoverCtrl(event.target.id);
        };

        var setUserQuestions = function (data) {
            if (data.length > 1) {
                $scope.firstUserQuestion = data[0];
                $scope.secondUserQuestion = data[1];
                $scope.userVerified = true;
                $scope.wrongUsername = false;
                return true;
            }
            else {
                $scope.userVerified = false;
                $scope.wrongUsername = true;
                return false;

            }
        }

        $scope.isUserVerified = function () {
            return $scope.userVerified;
        }
        $scope.getVerificationQuestions = function () {
            $http({
                method: "GET",
                url: "http://localhost:3000/users/getUsersVerificationQuestions/" + $scope.userToRestore
            }).then(function mySuccess(response) {
                setUserQuestions(response.data);

            }, function myError(response) {
                console.log(response.data)
                
            });
        }

        $scope.cancelRequest = function () {
            $location.path('/home');
        }
        $scope.isUserLoggedIn = function () {
            if ($window.sessionStorage.getItem("token") != null)
                return true;
            else
                return false;
        } 
        $scope.retrievePassword = function () {
            $http({
                method: "POST",
                url: "http://localhost:3000/users/restorePassword",
                data: {
                    "username": $scope.userToRestore,
                    "firstQuestId": $scope.firstUserQuestion.QuestionId,
                    "firstAnswer": $scope.answer1,
                    "secondQuestId": $scope.secondUserQuestion.QuestionId,
                    "secondAnswer": $scope.answer2
                }
            }).then(function mySuccess(response) {
                if (response.data[0].UserPassword)
                    $scope.message = "Your Password is: " + response.data[0].UserPassword;
                else
                    $scope.message = "Error- Invalid verification answers"

            }, function myError(response) {
                console.log(response)
            });


        }
    });

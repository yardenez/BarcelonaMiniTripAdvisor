const express = require("express");
const navigator = express();
const fs= require("fs"),xml2js=require('xml2js');

var DButilsAzure = require('./DButils');
var parser=new xml2js.Parser();
var systemCountries=[];

const secret = "YardenAndLihiSecretKey";
const jwt = require("jsonwebtoken");
navigator.use(express.json());


//handleCountries
//when server is up-> update the countries file.
readAllCountriesFromXml();

function readAllCountriesFromXml(){
    fs.readFile('./Resources/countries.xml','utf8', function(err, data){
        parser.parseString(data, function(err,result){
            var countries= result.Countries.Country;
            var i;
            for( i=0;i<countries.length;i++)
                systemCountries.push(countries[i].Name[0]);
        })
    });
}

function isValidCountry(country){
    if(systemCountries.includes(country))
        return true;
    else
        return false;
}

/* Login user to the system.
If the server finds that the username and password are correct, it will generate the user with a unique token.
 */
navigator.post("/login",(req,res)=>{
    DButilsAzure.execQuery("SELECT * FROM Users where Username='"+req.body.username +"' AND UserPassword='"
    + req.body.password+"'")
        .then(function(result){
            if(result.length ==1) { // password is correct => create new token to user
                var payload = {id: 1, name: req.body.username};
                var options = {expiresIn: "1y"};
                const token = jwt.sign(payload, secret, options);
                res.send(token);
            }
            else{
                res.status(400).send("username or password are incorrect");
            }
        })
        .catch(function (err) {
            console.log(err);
            res.status(400).send(err)
        });
});

///add the new user
navigator.post("/register", (req, res,next)=> {
    console.log("---- register user:" + req.body.username + "-----");
    //validate number of user interests
    if (req.body.categories.length < 2) {
        res.status(400).send({error: "at least two categories required"});
    }
    //validate user country input
    if(!isValidCountry(req.body.country))
        res.status(400).send({error: "country not valid"});
    else {
        DButilsAzure.execQuery("INSERT INTO Users VALUES ('" + req.body.username + "','" + req.body.password + "','"
            + req.body.firstName + "','" + req.body.lastName + "','" + req.body.city + "','" + req.body.country + "','"
            + req.body.email + "')")
            .then(result => next())
            .catch(function (err) {
                console.log(err);
                res.status(400).send(err)
            })
    }
});

// Add verification questions answers to the tables
navigator.post("/register", (req, res,next)=> {
    console.log("---- Add user answers for verification questions----");
    DButilsAzure.execQuery("INSERT INTO UserQuestions VALUES ('" + req.body.username + "','"
        + parseInt(req.body.firstQuestionId, 10) + "','" + req.body.firstAnswer + "')," +
        "('" + req.body.username + "','" + parseInt(req.body.secondQuestionId, 10) + "','" + req.body.secondAnswer + "')")
        .then(result => next())
        .catch(function (err) {
            console.log(err);
            res.status(400).send(err)
        })
});

// add user choice of interesting categories
navigator.post("/register", (req, res)=> {
    console.log("---- Add user interests----");
    var userCategories = req.body.categories;
    userCategories.forEach(function (category) {
        DButilsAzure.execQuery("INSERT INTO UserInterests VALUES ('" + req.body.username +
            "',(SELECT CategoryId FROM Categories WHERE CategoryName = '" + category.name + "'))")
            .catch(function (err) {
                console.log(err);
                res.status(400).send(err);
            })
    })
    res.sendStatus(201);
});

// Return 2 verification questions saved for the user in order to restore password.
navigator.get("/getUsersVerificationQuestions/:username", (req, res) => {
    DButilsAzure.execQuery("SELECT Questions.QuestionValue, Questions.QuestionId FROM UserQuestions JOIN Questions ON UserQuestions.QuestionId=Questions.QuestionId" +
        "  WHERE Username='" + req.params.username + "';")
        .then(result => res.status(200).send(result))
        .catch(function(err){
            console.log(err)
            res.status(400).send(err)
        })
});


// Return list of verification questions.
navigator.get("/getVerificationQuestions/", (req, res) => {

    DButilsAzure.execQuery("SELECT QuestionValue, QuestionId FROM Questions;")
        .then(result => res.status(200).send(result))
        .catch(function(err){
            console.log(err)
            res.status(400).send(err)
        })
});

//Restore user password if authentication succeed
navigator.post("/restorePassword",(req,res)=> {
    DButilsAzure.execQuery("SELECT Answer FROM UserQuestions where Username ='"+
    req.body.username+"' AND ((QuestionId='"+ req.body.firstQuestId+ "' AND Answer= '"+req.body.firstAnswer +"')" +
        " OR (QuestionId='"+ req.body.secondQuestId+ "' AND Answer= '"+req.body.secondAnswer +"'))")
        .then(function(result){
            console.log(result.length);
            if(result.length ==2) {
                DButilsAzure.execQuery("SELECT UserPassword FROM Users where username='" + req.body.username + "'")
                    .then(function(password){
                        res.status(200).send(password);
                    })
            }
            else{
                res.send("Wrong input. Password can not be restored");
            }
        })
        .catch(function(error) {
            console.log(error);
            res.status(401).send(error);
        })
});

//private
//Returns 2 most popular POIs from users interests.
navigator.get("/getPopularPOI",(req,res)=> {
    if(!req.decoded)
        res.status(400).send("missing private in URI");
    console.log("-----get the most popluar POI's according to the user interests-----");
    DButilsAzure.execQuery("SELECT TOP 2  POIid, POIname, POIimage FROM PointsOfInterest " +
        "JOIN (SELECT CategoryId, Max(POIaverageRank) as mostPopular FROM UserInterests " +
        "JOIN (SELECT POIid, POIname, POIimage, Category_ID , POIaverageRank FROM PointsOfInterest) Points " +
        "ON (UserInterests.CategoryId = Points.Category_ID) " +
        "where UserInterests.Username='" + req.decoded.name + "' AND Points.POIaverageRank>=3.5 " +
        "GROUP by CategoryID) Popular " +
        "ON PointsOfInterest.Category_ID = Popular.CategoryId and PointsOfInterest.POIaverageRank = Popular.mostPopular" +
        " order by POIaverageRank desc")
        .then(function(result){
            if(result.length==0)
                res.status(200).send("No popular POI's among the user interests");
            else
                res.status(200).send(result);
        })
        .catch(error => function (error) {
            console.log(error);
            res.status(400).send(error);
        })
});

navigator.get("/getCountries", (req, res) => {
    res.status(200).send(systemCountries)
});

module.exports= navigator;
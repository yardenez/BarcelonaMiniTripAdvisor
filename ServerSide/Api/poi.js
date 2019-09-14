const express = require("express");
const navigator = express();
var DButilsAzure = require('./DButils');

//not used for now.
//Returns the number of poi which were selected as favourites by the connected user.
navigator.get("/getNumFavouritePOI",(req,res)=>{
    if(!req.decoded)
        res.status(400).send("missing private in URI");
    console.log("-----Retrieving number of favorites poi of the given user-------");
    DButilsAzure.execQuery("SELECT * FROM Favorites where username='"+req.decoded.name+"'")
        .then(function(favorites){
            var numFavorits =favorites.length;
            res.status(200).send({numUserFavorites: numFavorits});
        })
        .catch(err => function (err) {
            console.log(err);
            res.status(400).send(err);
        })
});


//Return 3 random POI above a given rank.
navigator.get("/getRandomPOI/:minimalRank", (req, res) => {
    var minRank = req.params.minimalRank;
    minRank = parseInt(minRank,10);
    if(isNaN(minRank))
        res.status(400).send("Must choose a minimum rank from 1-5")
    if(minRank>5)
        res.status(400).send("The Maximal rank is 5!")
    DButilsAzure.execQuery("SELECT TOP 3 POIid, POIname , POIimage " +
        "FROM PointsOfInterest " +
        "WHERE POIaverageRank >= " + minRank + " ORDER BY NEWID();")
        .then(result => res.status(200).send(result))
        .catch(function(err){
            console.log(err) //not needed?
            res.status(400).send(err)
        })
});

//Get all POIs
navigator.get("/getAllPOIs", (req, res) => {
   DButilsAzure.execQuery("SELECT * FROM PointsOfInterest JOIN Categories on CategoryId=Category_ID;")
        .then(result=> res.status(200).send(result))
        .catch(function(err){
            console.log(err)
            res.status(400).send(err)
        })
});


//Returns details of a specific POI.
navigator.get("/getPOIDet/:POIid", (req, res) => {
    console.log("-----get POI details to show-------");
    var POI_id = req.params.POIid;
    POI_id = parseInt(POI_id,10);

    Promise.all([DButilsAzure.execQuery("SELECT CategoryName, POIimage, POIname, POIdescription ,POInumOfViewers, POIaverageRank " +
        "FROM PointsOfInterest Join Categories on CategoryId=Category_ID " +
        "WHERE POIid=" + POI_id + ";"),
        DButilsAzure.execQuery("UPDATE PointsOfInterest SET POInumOfViewers = POInumOfViewers+1  WHERE POIid= " + POI_id +";" ),
        DButilsAzure.execQuery("SELECT TOP 2 Critic, RankDate " +
        "FROM Ranks WHERE POIid=" + POI_id + " AND Critic IS NOT NULL ORDER BY RankDate DESC;")])
        .then(([poiDetails,r2,poiLastReviews])=>{
            var results = {poiDetails,poiLastReviews};
            console.log(results);
            res.status(200).send(results);
         })
        .catch(function(err){
            console.log(err) //not needed?
            res.status(400).send(err)
        })
});

//private
//Receive a list of favorite POI's and saves them to the database
navigator.post("/saveFavouritePOIs",(req,res)=> {
    if(!req.decoded)
        res.status(400).send("missing private in URI");
    console.log("-----saving all favorite POIs of the given user-------");
    DButilsAzure.execQuery("DELETE FROM Favorites where Username ='" + req.decoded.name + "'")
        .then(function () {
            var favoritePOI = req.body.POIs;
            favoritePOI.forEach(function (poi) {
                DButilsAzure.execQuery("INSERT INTO Favorites VALUES ('" + req.decoded.name + "','" + poi.id + "','" + poi.date + "')")
                    .catch(error=>res.status(400).send(error));
            });
            res.sendStatus(200);
        })
        .catch(error=>console.log(error))
});

//Return all saved Favorite POIs
navigator.get("/getAllSavedFavouritePOI",(req,res)=>{
    if(!req.decoded)
        res.status(400).send("missing private in URI");
    console.log("-----Retrieving all favorite POIs of the given user-------");
    DButilsAzure.execQuery("SELECT PointsOfInterest.POIid, PointsOfInterest.POIname,PointsOfInterest.POIimage," +
        "CategoryName, PointsOfInterest.POIaverageRank,InsertionDate FROM Favorites JOIN PointsOfInterest ON PointsOfInterest.POIid=Favorites.POIid JOIN Categories " +
        "on Categories.CategoryId=PointsOfInterest.Category_ID WHERE username='"+req.decoded.name+"' order by POIorder;")
        .then(FavoritePOIs=>res.status(200).send(FavoritePOIs))
        .catch(err => function (err) {
            console.log(err);
            res.status(400).send(err);
        })
});

//Return 2 last saved Favorite POIs
navigator.get("/getLastSavedFavouritePOI",(req,res)=>{
    if(!req.decoded)
        res.status(400).send("missing private in URI");
    console.log("-----Retrieving last saved favorite POIs of the given user-------");
    DButilsAzure.execQuery("SELECT TOP 2 PointsOfInterest.POIid,PointsOfInterest.POIname,PointsOfInterest.POIimage " +
        "FROM Favorites JOIN PointsOfInterest ON PointsOfInterest.POIid=Favorites.POIid " +
        "WHERE username='"+req.decoded.name+"' ORDER BY Favorites.InsertionDate DESC ")
        .then(LastSavedPOIs=> res.status(200).send(LastSavedPOIs))
        .catch(err => function (err) {
            console.log(err);
            res.status(400).send(err);
        })
});


//save a new ranking.
navigator.post("/saveReview",(req,res)=>{
    if(!req.decoded)
        res.status(400).send("missing private in URI");
    else if (!req.body.rank || !req.body.POIid || req.body.review_content===undefined ){
        res.status(400).send("Please Fill out all fields!") // status 400?
    }
    else if (req.body.rank > 5 || req.body.rank < 0){
        res.status(400).send("Rank must a number from 1 to 5") // In table constraint not working!!!
    }
    else{
        if(req.body.review_content!=null && (req.body.review_content).length!=0)
            req.body.review_content="'"+req.body.review_content+"'";
        console.log("-----saving a new review for a chosen POI of the given user-------");
        DButilsAzure.execQuery("INSERT INTO Ranks (Username,POIid,Ranking,Critic,RankDate) Values('" + req.decoded.name + "', '"
        + parseInt(req.body.POIid,10) +"', '"+parseInt(req.body.rank,10)+ "', "+req.body.review_content+", CURRENT_TIMESTAMP); " )
            .then( res =>DButilsAzure.execQuery("SELECT AVG(Cast(Ranking as Float)) as avgResult FROM Ranks WHERE POIid= " + parseInt(req.body.POIid,10) +";" ))
            .then( avg => DButilsAzure.execQuery("UPDATE PointsOfInterest SET POIaverageRank ="+
                ((avg[0].avgResult)/5)*100+ "WHERE POIid='" + req.body.POIid + "';"))
            .then(result=> res.sendStatus(200))
            .catch(error=> function(error){
                res.status(400).send(error);
            })
        }
    });


module.exports= navigator;
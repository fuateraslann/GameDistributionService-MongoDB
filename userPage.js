const app = new Realm.App({ id: "cloud-hw2-orlht" });
const mongodb = app.currentUser.mongoClient("mongodb-atlas");
const db = mongodb.db("game_distribution");
const credentials = Realm.Credentials.anonymous();
app.logIn(credentials);
let user = "";

function loadUserInfo() {
    var url_string = document.location.href;
    var url = new URL(url_string);
    var username = url.searchParams.get("username");

    db.collection("users")
    .find({user_name: username}, { limit: 1 })
    .then(function (docs) {
        if (docs.length > 0) {
          const rating = docs.map(doc => `<div>${doc.average_rating}</div>`);
          document.getElementById("average_rating").innerHTML = rating;
            const playTime = docs.map(doc => `<div>${doc.total_play_time}</div>`);
            document.getElementById("total_play_time").innerHTML = playTime
            const mostPlayedGame = docs.map(doc => `<div>${doc.most_played_game}</div>`);
            document.getElementById("most_played_game").innerHTML = mostPlayedGame
            const comments = docs.map(doc => doc.comments)[0];
            const allComments = comments.map(doc => `<div>${doc.game_name}-${doc.comment }</div>`);
            document.getElementById("comments").innerHTML = allComments
        }
    });
    document.getElementById("username").innerHTML = username;
    user = username;
    loadGames();
}

function loadGames() {
  db.collection("games")
        .find({}, { limit: 1000 })
        .then(async function(docs) {
            const photo_area = docs.map(function(doc) {
                let myControl = doc.enabled_rating;
                console.log(myControl)
                if(myControl)
                      return `<div> 
                                <div style="color:black"> ${doc.game_name} </div>
                                <img src=\"${doc.photo_url}\" class=\"game-img\">
                                <div> 
                                     <button class="button" onclick="commentOnGame(user,'${doc.game_name}')" value="commentOnGame">Comment</button>
                                    <button class="button" onclick="playGame(user,'${doc.game_name}')" value="playGame">Play Game</button> 
                                    <button class="button" onclick="lookGame('${doc.game_name}')" value="lookGame">Look Game</button>                        
                                    <button class="button" onclick="rateGame(user,'${doc.game_name}')" value="rateGame">Rate</button>
                                </div>
                      </div>`
                else
                    return `<div> 
                                <div style="color:black"> ${doc.game_name} </div>
                                <img src=\"${doc.photo_url}\" class=\"game-img\">
                                <div> 
                                    comment and rate disabled  <br/>
                                    <button class="button" onclick="playGame(user,'${doc.game_name}')" value="playGame">Play Game</button> 
                                    <button class="button" onclick="lookGame('${doc.game_name}')" value="lookGame">Look Game</button>                        
                                </div>
                      </div>`
              });
              document.getElementById("all_game").innerHTML = photo_area.join('');
        })
}
function  commentOnGame (userName,gameName) {
    const comment = document.getElementById("comment_game");
    console.log(comment.value)
    alert("commented")
    alert("added user comments ")
    db.collection("games")
        .find({game_name: gameName}, { limit: 1 })
        .then(async function (docs) {
                 db.collection("games").updateOne({game_name: gameName}, {$push: {"all_comments":{
                        "user_name":userName  ,
                        "comment" :comment.value
                         }}});
        });
    db.collection("users")
        .find({user_name: userName}, { limit: 1 })
        .then(async function (docs) {
            await db.collection("users").updateOne({user_name: userName}, {$push: {"comments":{
                        "game_name":gameName,
                        "comment":comment.value
                    }}});
            location.reload()
        });
}
function rateGame(userName,gameName) {
    const rateValue = document.getElementById("rate_game");
    const rate=parseInt(rateValue.value)
    console.log(rate)
    db.collection("users")
        .find({user_name: user })
        .then(function (docs) {
                db.collection("users")
                    .find({user_name: userName}, {limit: 1})
                    .then(async function (docs) {
                        const rated = docs.map(doc => doc.ratedFor)[0];
                        let i = 0;
                        let ratedBefore = 0;
                        while (rated[i]) {
                            if (rated[i].game_name===gameName) {
                                let gameRating = rated[i].rate;
                                ratedBefore = 1;
                                alert("Previous rate (" + gameRating + ") will be overwritten by " + rate);
                                await db.collection("users").updateOne({user_name: user}, {$pull: {"ratedFor": {
                                            "game_name": gameName,
                                            "rate": gameRating
                                        }}});
                                await db.collection("users").updateOne({user_name: user}, {$addToSet: {"ratedFor": {
                                            "game_name": gameName,
                                            "rate": rate
                                        }}});

                                await db.collection("games").updateOne({game_name: gameName}, {$pull: {"allRatings": {
                                            "user_name": userName,
                                            "rate": gameRating
                                        }}});
                                await db.collection("games").updateOne({game_name: gameName}, {
                                    $addToSet: {
                                        "allRatings": {
                                            "user_name": userName,
                                            "rate": rate
                                        }
                                    }
                                });

                                alert("You updated " + gameName + " rate to" + rate + ".");
                                await updateUserAverageRating()
                                await calculateRate(gameName);
                            }
                            i++;
                        }
                        if (ratedBefore === 0) {
                            await db.collection("users").updateOne({user_name: userName}, {$addToSet: {"ratedFor": {
                                        "game_name": gameName,
                                        "rate": rate
                                    }}})
                            await db.collection("games").updateOne({game_name: gameName}, {
                                $addToSet: {
                                    "allRatings": {
                                        "user_name": user,
                                        "rate": rate
                                    }
                                }
                            });
                            console.log(user + " is added to usersRated of " + gameName);
                            alert("You rated " + gameName + " " + rate + ".");
                            await updateUserAverageRating()
                            await calculateRate(gameName);
                        }
                    })
        })

    rateValue.value =""
}
function updateUserAverageRating() {
    db.collection("users")
        .find({user_name: user}, { limit: 1000 })
        .then(async function (docs) {
            const rated = docs.map(doc => doc.ratedFor)[0];
            let j = 0;
            let sum = 0;
            const rates = docs.map(doc => doc.ratedFor)[0];
            let rateCount = rates.length;
            console.log("Ratings for " + user );
            console.log(rates);
            let i = 0;
            while(rates[i]) {
                console.log(rates[i]);
                sum += rates[i].rate;
                i++;
            }
            let averageRating = (sum / rateCount).toPrecision(3);
            console.log("Sum of all ratings: " + sum);
            console.log("Overall Rating for " + user + ": " + averageRating);
            await db.collection("users").updateOne({user_name: user}, {$set : {"average_rating": averageRating}});
            location.reload()
        })
}
function updateMostPlayedGame(){
    db.collection("users")
        .find({user_name: user}, { limit: 1000 })
        .then(async function (docs) {
            let max = 0;
            let i = 0;
            const times = docs.map(doc => doc.playedGames)[0];
            max=times[i].time;
            let most_played = times[i].game_name;
            console.log("most played for " + user );
            while(times[i]) {
                if(times[i].time>max){
                    max=times[i].time
                    most_played = times[i].game_name;
                }
                i++
            }
            console.log("updated" + most_played)
            await db.collection("users").updateOne({user_name: user}, {$set : {"most_played_game": most_played}});
            location.reload()
        })
}
function playGame(userName,gameName) {
    db.collection("games")
        .find({game_name: gameName })
        .then(async function (docs) {
            let playTime =  docs.map(doc => doc.play_time)[0];
            playTime++;
            await db.collection("games").updateOne({game_name: gameName}, {$set : {"play_time": playTime}});
            console.log("game_play_time updated"
            )
        })
    db.collection("users")
        .find({user_name: user })
        .then(function (docs) {
            db.collection("users")
                .find({user_name: userName}, {limit: 1})
                .then(async function (docs) {
                    let totalPlayTime = docs.map(doc => doc.total_play_time)[0];
                    totalPlayTime++;
                    await db.collection("users").updateOne({user_name: user}, {$set : {"total_play_time": totalPlayTime}});
                    const played = docs.map(doc => doc.playedGames)[0];
                    let i = 0;
                    let playedBefore = 0;
                    while (played[i]) {
                        console.log(played[i])
                        if (played[i].game_name===gameName) {
                            let gameTime = played[i].time;
                            let x = gameTime;
                            playedBefore = 1;
                            gameTime++;
                            await db.collection("users").updateOne({user_name: user}, {$pull: {"playedGames": {
                                        "game_name": gameName,
                                        "time": x
                                    }}});
                            await db.collection("users").updateOne({user_name: user}, {$addToSet: {"playedGames": {
                                        "game_name": gameName,
                                        "time": gameTime
                                    }}});
                            await db.collection("games").updateOne({game_name: gameName}, {
                                $pull: {
                                    "usersAndTime": {
                                        "user_name": user,
                                        "time": x
                                    }
                                }
                            });
                            await db.collection("games").updateOne({game_name: gameName}, {
                                $addToSet: {
                                    "usersAndTime": {
                                        "user_name": user,
                                        "time": gameTime
                                    }
                                }
                            });
                            console.log("You updated " + gameName + " time to" + gameTime + ".");
                            updateMostPlayedGame()
                        }
                        i++;
                    }
                    if (playedBefore === 0) {
                        await db.collection("users").updateOne({user_name: userName}, {$addToSet: {"playedGames": {
                                    "game_name": gameName,
                                    "time": 1
                                }}})
                        await db.collection("games").updateOne({game_name: gameName}, {
                            $addToSet: {
                                "usersAndTime": {
                                    "user_name": user,
                                    "time": 1
                                }
                            }
                        });
                        console.log(user + " played " + gameName);
                        updateMostPlayedGame()
                    }
                })
        })
}
function lookGame(gameName) {
  console.log(gameName);
  if (gameName !== "") {
    document.location = "game.html?gameName=" + gameName;
  } 
}
function calculateRate(gameName){
    let rating=0;
    db.collection("games")
        .find({game_name: gameName},{ limit: 1 })
        .then(async function (docs){
            if (docs.length > 0) {
                let i =0 ;
                let allRating = docs.map(doc => doc.allRatings)[0];
                let usersAndTime= docs.map(doc => doc.usersAndTime)[0];
                let playTime= docs.map(doc => doc.play_time)[0];
                console.log(playTime)
                console.log(usersAndTime)
                console.log(allRating)
                while(allRating[i]){
                    let j =0;
                    while(usersAndTime[j]){
                        if(usersAndTime[j].user_name===allRating[i].user_name){

                            rating+=allRating[i].rate *usersAndTime[j].time /playTime
                        }
                        j++;
                    }
                    i++;
                }
                await db.collection("games").updateOne({game_name: gameName}, {$set : {"rating": rating}});
            }

        })

}



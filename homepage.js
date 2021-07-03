const app = new Realm.App({ id: "cloud-hw2-orlht" });
const mongodb = app.currentUser.mongoClient("mongodb-atlas");
const db = mongodb.db("game_distribution");
const credentials = Realm.Credentials.anonymous();
app.logIn(credentials);
function addUser() {
    const newUser = document.getElementById("add_user");
    if(newUser.value!==""){
        db.collection("users")
            .find({user_name: newUser.value}, { limit: 1 })
            .then(async function (docs) {
                console.log("add user", app.currentUser.id)
                db.collection("users")
                    .insertOne({
                        user_name: newUser.value,
                        total_play_time : 0,
                        average_rating:0,
                        most_played_game : "",
                        comments : [],
                        ratedFor : [],
                        playedGames:[]})
                    .then(displayUsers);
                newUser.value = "";
            });
    }


}
function deleteUser() {
    const user = document.getElementById("delete_user");
    db.collection("users")
        .find({user_name: user.value}, { limit: 1 })
        .then(async function (docs) {
            if (docs.length == 0) { // if there is no user in databse
                alert("User '" + user.value + "' does not exist.");
                user.value = "";
            }
            else {
                await db.collection("games")
                    .find({},{limit:100})
                    .then(async function (docs){

                        const gamesArray = docs.map(doc=>doc);
                        let i=0;
                        while(gamesArray[i]){

                             db.collection("games")
                                .updateOne({game_name:gamesArray[i].game_name,"all_comments.user_name":user.value},
                                    {
                                        $pull: {"all_comments":{"user_name":user.value}}
                                    });

                             db.collection("games")
                                .updateOne({game_name:gamesArray[i].game_name,"allRatings.user_name":user.value},
                                    {
                                        $pull: {"allRatings":{"user_name":user.value}}
                                    });

                            i++;
                        }
                    });
                console.log("deleting user: ");
                db.collection("users")
                    .deleteOne( {user_name: user.value})
                    .then(displayUsers);
                alert("User '" + user.value + "' is deleted.");
                user.value = "";
            }
        });
}
function loginAsUser() {
    const user = document.getElementById("login_user");
    console.log("login as a user: ");
    db.collection("users")
        .find({user_name: user.value}, { limit: 1 })
        .then(function (docs) {
            if (docs.length === 0) {
                alert("User '" + user.value + "' does not exist.");
                user.value = "";
            }
            else {
                loadUser(user.value);
            }
        });

}
function loadUser(user) {
    if (user !== "") {
        document.location = "user.html?username=" + user;
    } else {
        alert(user + " does not exist.");
    }
}
function addGame() {
    const newGame = document.getElementById("game_name");
    if(newGame.value!==""){
        const game_genre = document.getElementById("game_genre");
        const url = document.getElementById("photoUrl");
        db.collection("games")
            .find({game: newGame.value}, { limit: 1 })
            .then(async function (docs) {
                db.collection("games")
                    .insertOne({
                        game_name: newGame.value,
                        genre : game_genre.value,
                        photo_url:url.value,
                        play_time : 0,
                        rating:0,
                        allRatings:[],
                        all_comments : [],
                        enabled_rating:true,
                        usersAndTime:[]})
                    .then(displayUsers);
                newGame.value = "";
                game_genre.value = "";
                url.value = "";
            });
    }

}
function removeGame() {
    const game = document.getElementById("game_name_remove");
    db.collection("games")
        .find({game_name: game.value}, { limit: 1 })
        .then(async function (docs) {
            if (docs.length == 0) { // if there is no game in databse
                alert("Game '" + game.value + "' does not exist.");
                game.value = "";
            }
            else {
                await db.collection("users")
                    .find({},{limit:100})
                    .then( function (docs){

                        const usersArray = docs.map(doc=>doc);
                        let i=0;
                        while(usersArray[i]){

                            db.collection("users")
                                .updateOne({user_name:usersArray[i].user_name,"comments.game_name":game.value},
                                    {
                                        $pull: {"comments":{"game_name":game.value}}
                                    });

                            db.collection("games")
                                .updateOne({user_name:usersArray[i].user_name,"ratedFor.game_name":game.value},
                                    {
                                        $pull: {"ratedFor":{"game_name":game.value}}
                                    });

                            i++;
                        }
                    })
                console.log("deleting game: ");
                await db.collection("games")
                    .deleteOne( {game_name: game.value})
                    .then(displayUsers);
                alert("Game '" + game.value + "' is deleted.");
                game.value = "";
            }
        });
}
function disableRating() {
    const game = document.getElementById("game_name_remove");
    db.collection("games")
        .find({game_name: game.value}, { limit: 1 })
        .then(function (docs) {
            if (docs.length == 0) { // if there is no game in databse
                alert("Game '" + game.value + "' does not exist.");
                game.value = "";
            }
            else {
                console.log("disable rating: ");
                db.collection("games").updateOne({game_name: game.value}, {$set: {"enabled_rating": false}});
                game.value = "";
            }
        });
}
function enableRating() {
    const game = document.getElementById("game_name_remove");
    db.collection("games")
        .find({game_name: game.value}, { limit: 1 })
        .then(function (docs) {
            if (docs.length == 0) { // if there is no game in databse
                alert("Game '" + game.value + "' does not exist.");
                game.value = "";
            }
            else {
                console.log("enable rating : ");
                db.collection("games").updateOne({game_name: game.value}, {$set: {"enabled_rating": true}});
                game.value = "";
            }
        });
}


function displayUsers() {
    db.collection("users")
        .find({}, { limit: 1000 })
        .then(docs => {
            const html = docs.map(doc => `<div>${doc.user_name}</div>`);
            document.getElementById("users").innerHTML = html.join('');
        })
    db.collection("games")
        .find({}, { limit: 1000 })
        .then(docs => {
            const html = docs.map(doc => `<div>${doc.game_name}</div>`);
            document.getElementById("games").innerHTML = html.join('');
        })
}

function deleteAllUsers() {
    console.log("deleting all users");

    db.collection("users").deleteMany({});
    document.getElementById("users").innerHTML = "";
}
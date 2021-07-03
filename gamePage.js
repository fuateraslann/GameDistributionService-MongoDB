const app = new Realm.App({ id: "cloud-hw2-orlht" });
const mongodb = app.currentUser.mongoClient("mongodb-atlas");
const db = mongodb.db("game_distribution");
const credentials = Realm.Credentials.anonymous();
app.logIn(credentials);
async function loadGameInfos() {
    var url_string = document.location.href;
    var url = new URL(url_string);
    var name = url.searchParams.get("gameName");
    await db.collection("users")
    db.collection("games")
    .find({game_name: name}, { limit: 1 })
    .then(async function (docs) {
        if (docs.length > 0) {
            const gameSource = docs.map(doc => `${doc.photo_url}`);
            const playTime = docs.map(doc => `<div>${doc.play_time}</div>`);
            const ratings = docs.map(doc => `<div>${doc.rating}</div>`);
            const comments = docs.map(doc => doc.all_comments)[0];
            const allComments = comments.map(doc => `<div>${doc.comment}</div>`);
            const genre = docs.map(doc => `<div>${doc.genre}</div>`);

            document.getElementById("game-name").innerHTML = name;
            document.getElementById("product-photo").innerHTML = `<div id=\"game-item\" class=\"game-item\"
                                                                       tabindex=\"0\"> 
                                                                            <img src=\"${gameSource}\" class=\"game-img2\"
                                                                                 id=\"game-img2\" alt=\"\">
                                                                  </div>`;
            document.getElementById("play_time").innerHTML = playTime;
            document.getElementById("game_rating").innerHTML = ratings;
            document.getElementById("all_comments").innerHTML = allComments;
            document.getElementById("genre").innerHTML = genre;

        }
        else {
            console.log("Product: " + name + " not found.");
            console.log(docs);
        }
    });
    
}

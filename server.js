const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const fs = require("fs");

const app = express();

const server = http.createServer(app);

const io = new Server(server);

app.use(express.static("public"));

// mot de passe admin
const ADMIN_PASSWORD = "1234";

// utilisateurs connectés
let connectedUsers = 0;

// charger les publications
let news = [];

try{

    if(fs.existsSync("news.json")){

        const data =
            fs.readFileSync("news.json", "utf8");

        news = data ? JSON.parse(data) : [];

    }

}
catch(error){

    console.log("Erreur JSON détectée");

    news = [];

}

// sauvegarder les news
function saveNews(){

    fs.writeFileSync(
        "news.json",
        JSON.stringify(news, null, 2)
    );

}

io.on("connection", (socket) => {

    connectedUsers++;

    io.emit("userCount", connectedUsers);

    console.log("Utilisateur connecté");

    socket.emit("loadNews", news);

    // connexion admin
    socket.on("adminLogin", (password) => {

        if(password === ADMIN_PASSWORD){

            socket.emit("adminSuccess");

        }
        else{

            socket.emit("adminError");

        }

    });

    // publier
    socket.on("publishNews", (data) => {

        const post = {

            id: Date.now(),

            title: data.title,

            summary: data.summary,

            media: data.media || "",

            mediaType: data.mediaType || "",

            date: new Date()
            .toLocaleString("fr-FR"),

            likes: 0,

            dislikes: 0

        };

        news.unshift(post);

        saveNews();

        io.emit("updateNews", news);

    });

    // likes
    socket.on("like", (id) => {

        news = news.map(post => {

            if(post.id == id){

                post.likes++;

            }

            return post;

        });

        saveNews();

        io.emit("updateNews", news);

    });

    // dislikes
    socket.on("dislike", (id) => {

        news = news.map(post => {

            if(post.id == id){

                post.dislikes++;

            }

            return post;

        });

        saveNews();

        io.emit("updateNews", news);

    });

    // supprimer
    socket.on("deleteNews", (id) => {

        news = news.filter(
            post => post.id != id
        );

        saveNews();

        io.emit("updateNews", news);

    });

    // modifier
    socket.on("editNews", (data) => {

        news = news.map(post => {

            if(post.id == data.id){

                post.title = data.title;

                post.summary = data.summary;

            }

            return post;

        });

        saveNews();

        io.emit("updateNews", news);

    });

    socket.on("disconnect", () => {

        connectedUsers--;

        io.emit("userCount", connectedUsers);

        console.log("Utilisateur déconnecté");

    });

});

server.listen(3000, () => {

    console.log(
        "Serveur lancé sur http://localhost:3000"
    );

});

// server.js

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();

const server = http.createServer(app);

const io = new Server(server);

app.use(express.static("public"));

let news = [];

let connectedUsers = 0;

io.on("connection", (socket) => {

    connectedUsers++;

    io.emit("userCount", connectedUsers);

    console.log("Utilisateur connecté");

    socket.emit("loadNews", news);

    socket.on("publishNews", (data) => {

        const post = {

            id: Date.now(),

            title: data.title,

            summary: data.summary,

            media: data.media || "",

            mediaType: data.mediaType || "",

            date: new Date().toLocaleString("fr-FR"),

            likes: 0,

            dislikes: 0

        };

        news.unshift(post);

        io.emit("updateNews", news);

    });

    socket.on("like", (id) => {

        news = news.map(post => {

            if(post.id === id){

                post.likes++;

            }

            return post;

        });

        io.emit("updateNews", news);

    });

    socket.on("dislike", (id) => {

        news = news.map(post => {

            if(post.id === id){

                post.dislikes++;

            }

            return post;

        });

        io.emit("updateNews", news);

    });

    socket.on("deleteNews", (id) => {

        news = news.filter(post => post.id !== id);

        io.emit("updateNews", news);

    });

    socket.on("disconnect", () => {

        connectedUsers--;

        io.emit("userCount", connectedUsers);

        console.log("Utilisateur déconnecté");

    });

});

server.listen(3000, () => {

    console.log("Serveur lancé sur http://localhost:3000");

});
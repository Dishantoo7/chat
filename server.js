const express = require("express");
const socketio = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
const cryptoJs = require("crypto-js");
const User = require("./user");
const Msg = require("./chat");
const http = require("http");
const app = express();

app.use(express.json());
app.use(cors());

const server = http.createServer(app);
const io = socketio(server);

mongoose.connect(
  "mongodb+srv://chat:chat@123@chat-z8kv6.mongodb.net/dishant?retryWrites=true&w=majority",
  { useNewUrlParser: true, useUnifiedTopology: true },
  () => {
    console.log("connected to the mongodb..");
  }
);

app.post("/insert", (req, res) => {
  const { username, email, password } = req.body;
  User.find({ username }).then((response) => {
    if (response[0]) {
      res.status(200).json({
        status: false,
        msg: "Username is already taken please try new one",
      });
    } else {
      console.log(username, email, password);
      const tempUser = new User({
        username,
        email,
        password,
      });
      tempUser.save().then((savedUser) => {
        res.status(200).json({
          status: true,
        });
      });
    }
  });
});

app.post("/check", (req, res) => {
  const { uname, key } = req.body;
  decPassword = cryptoJs.AES.decrypt(key, "dkiesvhaalnt").toString(
    cryptoJs.enc.Utf8
  );
  User.find({ username: uname, password: decPassword }).then((data) => {
    if (!data[0]) {
      res.json({ status: false });
    } else {
      res.json({ status: true });
    }
  });
});

app.post("/auth", (req, res) => {
  const { username, password } = req.body;

  User.find({ username, password })
    .then((data) => {
      if (!data[0]) {
        res.status(200).json({
          status: false,
          msg: "Invalid credentials..",
        });
      } else {
        var encPassword = cryptoJs.AES.encrypt(
          data[0].password,
          "dkiesvhaalnt"
        ).toString();
        res.status(200).json({
          status: true,
          uname: data[0].username,
          key: encPassword,
        });
      }
    })
    .catch((err) => console.log(err));
});

app.get("/show", (req, res) => {
  Msg.find().then((data) => {
    res.send(data);
  });
});

io.on("connection", (client) => {
  const handleFunction = (data) => {
    // console.log(data);
    client.emit("show-massage", { allMsg: data });
  };
  const othersSend = (data) => {
    client.broadcast.emit("show-others", { allMsg: data });
  };
  const otherjoin = (data) => {
    client.broadcast.emit("join-others", { allMsg: data });
  };
  const disOthers = (data) => {
    client.broadcast.emit("dis-others", { allMsg: data });
  };
  Msg.find().then((data) => handleFunction(data));
  let currentUser = client.handshake.query.user;

  const conMsg = new Msg({
    username: client.handshake.query.user,
    msg: `has join...`,
  });
  conMsg.save().then((data) => otherjoin(data));

  client.on("send-massage", (msg) => {
    const saveMsg = new Msg({
      username: currentUser,
      msg: msg.msg,
    });
    saveMsg.save().then((data) => othersSend(data));
    // console.log(msg);
  });

  client.on("disconnect", () => {
    const disMsg = new Msg({
      username: currentUser,
      msg: `has left..`,
    });
    disMsg.save().then((data) => disOthers(data));
    currentUser = null;
  });
});

const PORT = process.env.PORT || 8000;

server.listen(PORT, () => {
  console.log("Server up and running");
});

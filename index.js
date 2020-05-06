const express = require("express");
const socketio = require("socket.io");
const rm = require("./server/RoomManager");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const path = require("path");

const PARTIAL_EVENT = path.join(__dirname, "views/partials/chat-events.ejs");
const PARTIAL_CHAT_BUBBLE = path.join(
  __dirname,
  "views/partials/chat-bubble.ejs"
);

const urlencoded = bodyParser.urlencoded({ extended: false });

let roomManager = new rm();

const PORT = process.env.PORT || 5000;

// ================= Express App =================

let app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");

app.post("/chat", urlencoded, (req, res) => {
  let info = {
    handle: req.body.handle,
    private: req.body.isPrivate == "on",
    host: req.body.newHost == "on",
    roomId: req.body.roomId,
  };

  if (info.private && !info.host) {
    let roomStatus = roomManager.getStatus(info.roomId);
    console.log(JSON.stringify(roomStatus));
    if (!roomStatus.valid) {
      res.send("Unknown Room");
    } else if (roomStatus.isFull) {
      res.send("Room Full");
    } else {
      res.render("chatroom", {
        params: {
          handle: req.body.handle,
          active: 0,
          max: roomManager.maxStrength,
          info: JSON.stringify(info),
        },
      });
    }
  } else {
    res.render("chatroom", {
      params: {
        handle: req.body.handle,
        active: 0,
        max: roomManager.maxStrength,
        info: JSON.stringify(info),
      },
    });
  }
});

let server = app.listen(PORT, () => {
  console.log("Server started at port " + PORT);
});

// ================= Socket IO =================

let io = socketio(server);

io.on("connect", (socket) => {
  socket.on("initialize", (data) => {
    let userHandle = data.handle;

    let room = roomManager.addclient(socket.id, data.options);
    if(!room) {
      io.to(socket.id).emit("error", {});
      return; // Failed to join room
    }

    socket.join(room.id);

    console.log(
      "Initialize request from " + userHandle + " assigned to room " + room.id
    );

    ejs.renderFile(
      PARTIAL_EVENT,
      {
        params: {
          handle: userHandle,
          message: "has joined the room",
        },
      },
      (err, str) => {
        io.to(room.id).emit("event", {
          code: str,
        });
      }
    );

    socket.on("msg", (mdata) => {
      console.log(mdata.handle + " Sent a message saying " + mdata.message);

      ejs.renderFile(
        PARTIAL_CHAT_BUBBLE,
        {
          params: {
            handle: mdata.handle,
            message: mdata.message,
          },
        },
        (err, str) => {
          io.to(room.id).emit("msg", {
            handle: mdata.handle,
            code: str,
          });
        }
      );
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected with handle: " + userHandle);
      ejs.renderFile(
        PARTIAL_EVENT,
        {
          params: {
            handle: userHandle,
            message: "has left the room",
          },
        },
        (err, str) => {
          io.to(room.id).emit("event", {
            code: str,
          });
        }
      );

      roomManager.removeclient(socket.id, room);
      socket.leave(room.id);
      
      io.to(room.id).emit("meta", {
        active: room.strength,
        max: roomManager.maxStrength,
        roomId: room.id
      });
    });

    io.to(room.id).emit("meta", {
      active: room.strength,
      max: roomManager.maxStrength,
      roomId: room.id
    });
  });
});

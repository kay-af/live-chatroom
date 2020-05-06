// Imports
const express = require("express");
const socketio = require("socket.io");
const rm = require("./server/RoomManager");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const path = require("path");
// End imports

// Ejs partial template sources
const PARTIAL_EVENT = path.join(__dirname, "views/partials/chat-events.ejs");
const PARTIAL_CHAT_BUBBLE = path.join(
  __dirname,
  "views/partials/chat-bubble.ejs"
);
// End Ejs partial template sources

// Extra stuff
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
  
  let renderChatroom = function () {
    // If private and host then new private room
    // If private but not host then old private room
    // Else public room
    let pvt = (info.private && info.host) || (info.private && roomManager.rooms[info.roomId].isPrivate);

    res.render("chatroom", {
      params: {
        handle: req.body.handle,
        active: 0,
        max: roomManager.maxStrength,
        info: JSON.stringify(info),
        roomType: pvt?"Private room Id:":"Public room Id:"
      },
    });
  }

  // Get the status of the room requested
  let roomStatus = roomManager.getStatus(info.roomId);

  if (info.private && !info.host) {
    if (!roomStatus.valid) {
      res.render("error", {
        params: {
          head: "Unknown Room!",
          content: 'Unfortunately, the room you are trying to access does not exists'
        }
      });
    } else if (roomStatus.isFull) {
      res.render("error", {
        params: {
          head: "Room is full!",
          content:
            "Unfortunately, the room you are trying to access is full",
        },
      });
    } else {
      renderChatroom();
    }
  } else {
    renderChatroom();
  }
});

// Start the server
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
      // This error might occur rarely.
      // It indicates that either the room was deleted or the space exhausted within the timeframe of post and initialize
      // This error occurs only for private rooms
      io.to(socket.id).emit("error", {});
      return; // Failed to join room
    }

    // Join the room
    socket.join(room.id);

    console.log(
      "Initialize request from " + userHandle + " assigned to room " + room.id
    );

    // Create the chat event to send
    // example: abc123 has joined the room
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

    // When a message is received
    socket.on("msg", (mdata) => {

      // Create the chat bubble and send it to the room
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
      console.log("Client disconnected with handle: " + userHandle + " removed from room " + room.id);

      // Create a chat event
      // example: abc123 has left the room
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

      // Remove the client when he/she disconnects
      roomManager.removeclient(socket.id, room);
      socket.leave(room.id);
      
      // Update the meta data of the room
      io.to(room.id).emit("meta", {
        active: room.strength,
        max: roomManager.maxStrength,
        roomId: room.id
      });
    });

    // Update the meta data of the room whenever someone joins
    io.to(room.id).emit("meta", {
      active: room.strength,
      max: roomManager.maxStrength,
      roomId: room.id
    });
  });
});

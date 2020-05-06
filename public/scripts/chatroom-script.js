const appServer = "https://thelivechatapp.herokuapp.com/";

const socket = io(appServer, {
  reconnection: false,
  forceNew: true,
});

let clientInfo;
window.onload = () => {

    clientInfo = information;

    handle = $("#handle").html();
    socket.emit("initialize", {
        handle: clientInfo.handle,
        options: {
          hostRoom: clientInfo.host,
          customRoom: !clientInfo.host && clientInfo.private,
          roomId: clientInfo.roomId
        }
    });

    $("#send-btn").click(sendMessage);
    $("#scroll-down-btn").click(scrollToEnd);
    $("#scroll-down-btn").hide();

    $("#chat-window").scroll(function () { 
        if(isScrolledUp()) $("#scroll-down-btn").show();
        else $("#scroll-down-btn").hide();
    });

    $("#text-box").keypress(function (e) {
        if (e.keyCode == 13) $("#send-btn").click();
    });
}

socket.on("meta", (data) => {
  let active = data.active;
  let max = data.max;
  $("#active").html(active + " / " + max);
  $("#room-id").html(data.roomId);
});

socket.on("event", (data) => {
  $("#chat-window").append(data.code);
  if(!isScrolledUp()) {
      scrollToEnd();
  }
});

socket.on("error", (data) => {
  alert(
    "An error occured while joining the room. You will be redirected to the lobby"
  );
  redirectToLobby();
});

socket.on('disconnect', () => {
  console.log("Disconnected");
  alert('Client was disconnected abruptly. This might be a server error or connection problem!');
  redirectToLobby();
});

socket.on("msg", (data) => {
  // Generate timestamp
  let code = data.code;
  let date = new Date();
  let dateString = date.toLocaleString();

  let $code = $('<div />', {html: code});
  $code.find('.bubble-footer').html(dateString);
  
  if(data.handle == clientInfo.handle)
    $code.find('.chat-bubble').attr('class', 'right-aligned ' + $code.find('.chat-bubble').attr('class'));
  else
    $code.find('.chat-bubble').attr('class', 'left-aligned ' + $code.find('.chat-bubble').attr('class'));
  
  $("#chat-window").append($code.html());
  if (!isScrolledUp()) {
    scrollToEnd();
  }
});

function redirectToLobby() {
  window.location.href = appServer;
}

function sendMessage() {
    isScrolledUp();
    let msg = $("#text-box").val();
    msg = msg.trim();
    if(msg !== '') {
        socket.emit('msg', {
            handle: clientInfo.handle,
            message: msg
        });
        $("#text-box").val("");
        scrollToEnd();
    }
}

function isScrolledUp() {
    let scTop = $("#chat-window")[0].scrollTop;
    let h = $("#chat-window")[0].clientHeight;
    let scHeight = $("#chat-window")[0].scrollHeight;

    return scTop < scHeight - h - 100;
}

function scrollToEnd() {
    let scHeight = $("#chat-window")[0].scrollHeight;
    $("#chat-window").animate(
      {
        scrollTop:
          scHeight
      },
      500
    );
    
    $("#scroll-down-btn").hide();
}
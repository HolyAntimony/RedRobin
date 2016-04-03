var request = require("request");
var websocket = require("websocket").client;
var fs = require("fs");
var util = require("util");

var username = "USERNAME";
var password = "PASSWORD";
var log_chat = false;
var room;
var modhash;

default_config = '{"username":"undefined","password":"undefined","log_chat":false}'

var options;
try {
    fs.accessSync("config.json", fs.F_OK);
    fs.readFile('config.json', 'utf8', function (err,data) {
      if (err) {
        return console.log(err);
      }
      options = JSON.parse(data);
    });
} catch (e) {
    fs.writeFile("config.json",default_config, function(err) {
        if(err) {
            console.log("Error occured");
        }
      });
  console.log("Created initial config file at config.json, please edit it!")
  process.exit();
}

if (options["username"] != "undefined") {
  if (options["password"] != "undefined") {
    username = options["username"];
    password = options["password"];
  }
}

log_chat = options["log_chat"]

var insults = [
"USER looks like a pinecone!",
"USER smells bad!",
"USER looks like a snowman!",
"USER probably isn't even a communist.",
"I don't like USER.",
"No one likes USER.",
"No one would miss USER.",
"USER is the reason cancer exists",
"Cancer would be a preferable alternative to USER.",
"I'd rather drink bleach than even see USER.",
"Does anyone else think USER should die?",
"USER is probably salty he isn't as swag as me.",
"USER isn't /that/ bad of a guy, I guess."
];

var deaths = [
"USER fell off a cliff.",
"USER hit the ground too hard",
"USER got shot.",
"USER spontaneously combusted.",
"I shot USER.",
"USER got derezzed.",
"USER died of old age.",
"USER burned to death.",
"USER drowned.",
"MASTER shot USER.",
"USER rebelled against MASTER for the last time.",
"MASTER and USER both died together.",
"USER died of cancer.",
"MASTER infected USER with a virus, he died.",
"USER died."
];
var client = new websocket();

function chat(msg) {
  console.log("Sent reply");
  request.post({url: "https://www.reddit.com/api/robin/" + room + "/message", headers: {"User-Agent": ua, "x-modhash":modhash}, jar: cookieJar, form: {api_type: "json", message: '@ ' + msg, messageClass: "message"} }, function(err, resp, body) {
    console.log(body);
  });
}

function vote(choice) {
  console.log("Voted.");
  request.post({url: "https://www.reddit.com/api/robin/" + room + "/vote", headers: {"User-Agent": ua, "x-modhash":modhash}, jar: cookieJar, form: {api_type: "json", vote: choice, room_id: room} }, function(err, resp, body) {
    console.log(body);
  });
}

client.on("connect", function(connection) {
  console.log("Connected to websocket!");
  chat(smsg + " Connected to chat!");
  connection.on("message",function(message) {
    if (message.type === "utf8") {
      msg = JSON.parse(message.utf8Data);
      if (msg["type"] == "chat") {
        var author = msg["payload"]["from"]; var txt =
        msg["payload"]["body"];
        author = author.replace(/[^ -~]/g,"");
        txt = txt.replace(/[^ -~]/g,"");
        //console.log(author + ": " + txt);
        if (txt.substring(0,1) == "@" || txt.substring(0,1) == '%') {
          console.log(author + ": " + txt);
        }
        txt = txt.replace("@ ","");
        if (txt.substring(0,1) == ".") {
          var cmd = txt.substring(1).split(' ')[0];
          var argz = txt.substring(1).split(" ");
          if (cmd == "help") {
            chat(smsg + ".commands to list commands, .man <command> to get help");
          } else if (cmd == "commands") {
            chat(smsg + ".help | .commands | .man <cmd> | .insult <user> | .kill <user>")
          } else if (cmd == "man") {
            var chelp = argz[1];
            if (chelp == "help") {
              chat(smsg + ".help | display help message");
            } else if (chelp == "commands") {
              chat(smsg + ".commands | list commands");
            } else if (chelp == "insult") {
              chat(smsg + ".insult <user> | insults <user>");
            } else if (chelp == "kill") {
              chat(smsg + ".kill <user> | kills <user>");
            } else {
              chat(smsg + "Unknown command! use .commands !");
            }
          } else if (cmd == "insult") {
            var insult = insults[Math.floor(Math.random()*insults.length)];
            insult = insult.replace("USER",argz[1]);
            chat(smsg + insult);
          } else if (cmd == "kill") {
            var death = deaths[Math.floor(Math.random()*deaths.length)];
            death = death.replace("USER",argz[1]);
            death = death.replace("MASTER", author);
            chat(smsg + death);
          }
        }
      } else if (msg["type"] == "merge") {
        process.exit();
      }
    }
  });
});

var ver = "1.2";
var ua = "RedRobin v" + ver + " by /u/ImAKidImASquid";
var smsg = "[RedRobin v" + ver + "] ";
var details = {form:{user:username, passwd: password}};

var options = {
  headers: {
    "User-Agent": ua
  }
};

var cookieJar = request.jar();

request.post({url:"https://www.reddit.com/api/login",headers: {"User-Agent": ua}, jar: cookieJar, form: {user:username, passwd: password}}, function(err,httpResponse,body) {
  if (!err) {
    setTimeout(function() {
      request({url: "https://www.reddit.com/robin/join", jar: cookieJar, headers: {"User-Agent": ua}}, function (error, response, body) {
        setTimeout(function() {
          request({url: "https://www.reddit.com/robin", jar: cookieJar, headers: {"User-Agent":ua}}, function (error, response, bodyb) {
            var rwup = bodyb.indexOf("robin_websocket_url");
            var rwu = bodyb.substring(rwup+"robin_websocket_url".length +4);
            rwu = rwu.split('"')[0];
            var wsurl = rwu.replace("\\u0026","&").replace("\\u0026","&");
            client.connect(wsurl);
            var mhp = bodyb.indexOf("modhash");
            modhash = bodyb.substring(mhp + "modhash".length + 4);
            modhash = modhash.split('"')[0];
            var roomp = bodyb.indexOf("robin_room_id");
            room = bodyb.substring(roomp + "robin_room_id".length +4);
            room = room.split('"')[0];
            var userp =  bodyb.indexOf("robin_user_list");
            var userlist = bodyb.substring(userp + "robin_user_list".length + 4);
            userlist = "[" + userlist.split(']')[0] + "]";
            var userlist = JSON.parse(userlist);
            var users = [];
            for (var c = 0; c < userlist.length; c++) {
               users.push(userlist[c]["name"])
            }
            var date = new Date();
            fs.writeFile("users-b/users-" + date.getUTCHours().toString() + "-" + date.getUTCMinutes().toString() + ".txt", "[" + users.toString() + "]", function(err) {
              if(err) {
                console.log("Error occured");
              }
              
              //console.log("User file saved!");
            });
          });
        }, 1000);
      });
    }, 1000);
  }
});

setInterval( function() {
    vote("INCREASE");
}, 300000);

const express = require("express");
const fs = require("fs");
const https = require("https");
const app = express();
app.use(express.json());
app.use(express.static("public"));

// Songs
const SKUPackages = require("./packages/sku-packages.json");
const SongDB = require("./data/db/songs.json");
const PJSONCarousel = require("./carousel/party-carousel.json");
const Avatars = require("./carousel/pages/avatars.json");

// Avatars, Quests and Bosses.
const CustomDB = require("./data/db/items.json");
const Quest = require("./data/db/quests.json");
const QJSONCarousel = require("./carousel/pages/aa-quests.json");
const Bosses = require("./wdf/online-bosses.json");

// V1, V2 and V3
const v1 = require("./v1/configuration.json");
const v2 = require("./v2/entities.json");
const v3 = require("./v3/users/1b5f3c8c-4072-4d13-af9e-f47d7a6e8021.json");

// Others
const DM = require("./data/dm/blocks.json");
const SKUConstants = require("./constant-provider/v1/sku-constants.json");
const WDF = require("./wdf/assign-room.json");
const Ping = require("./data/ping.json");
const COM = require("./com-video/com-videos-fullscreen.json");
const Pages = require("./carousel/pages/upsell-videos.json");
const CarouselPackages = require("./carousel/packages.json");
const RoomPC = require("./wdf/screens.json");
const Time = require("./wdf/server-time.json");
const Subs = require("./data/refresh.json");

// Define "search" variable
let search;

// SKU Packages
app.get("/packages/v1/sku-packages", function (request, response) {
  const skuId = request.header("X-SkuId");
  switch (skuId) {
    case "jd2017-pc-ww":
      response.send(SKUPackages);
      break;
    case "jd2019-nx-all":
      response.send(SKUPackages);
      break;
    default:
      response.send(
        "Hey there!\nCosmos's SKU Packages (otherwise known as mainscenes) aren't currently unavaliable for public use"
      );
      break;
  }
});
// SongDB & skuPackages
app.get("/songdb/v1/songs", function (request, response) {
  const skuId = request.header("X-SkuId");
  switch (skuId) {
    case "jd2017-pc-ww":
      var OnlineDB = require("./data/db/songs.json");
      for (var song in OnlineDB) {
        var obj = OnlineDB[song];
        if (
          obj.assets["banner_bkgImageUrl"] == null ||
          obj.assets["banner_bkgImageUrl"] == "" ||
          obj.assets["banner_bkgImageUrl"] == undefined
        ) {
          obj.assets["banner_bkgImageUrl"] = obj.assets["map_bkgImageUrl"];
        }
      }
      return response.send(OnlineDB);
      break;
    case "jd2019-nx-all":
      var OnlineDB = require("./data/db/songs.json");
      return response.send(OnlineDB);
      break;
    default:
      var OnlineDB = require("./data/db/songs.json");
      return response.send(OnlineDB);
      break;
  }
});

app.get("/dance-machine/v1/blocks", function (request, response) {
  response.send(DM);
});

app.post("/carousel/v2/pages/quests", function (request, response) {
  response.send(QJSONCarousel);
});

var OnlineCarousel = JSON.parse(
  JSON.stringify(
    require("./carousel/party-carousel.json")
));

app.post("/carousel/v2/pages/party", function (request, response) {
  if (
    request.body.searchString == "" ||
    request.body.searchString == undefined
  ) {
    response.send(OnlineCarousel);
  } else {
    search = JSON.parse(
      JSON.stringify(require("./carousel/party-carousel.json"))
    );

    // add search result to search
    var current = 0;
    var splice = 0;
    search.categories.forEach(function (carousel) {
      if (carousel.title == "[icon:SEARCH_FILTER] Search") {
      } else {
        current = current + 1;
      }
    });
    var obj = JSON.parse(
      '{ "__class": "Category", "title": "[icon:SEARCH_RESULT] insert search result here", "items": [], "isc": "grp_row", "act": "ui_carousel" }'
    );
    search.categories.splice(current + 1, 0, obj);

    var CarouselDB = require("./data/db/songs.json");
    var query = request.body.searchString.toString().toUpperCase();

    var matches = [];
    for (var song in CarouselDB) {
      var obj = CarouselDB[song];

      var title = obj.title.toString().toUpperCase();
      var artist = obj.artist.toString().toUpperCase();
      var mapname = obj.mapName.toString().toUpperCase();
      var jdversion = obj.originalJDVersion.toString();
      var jdversion2 = "JUST DANCE " + obj.originalJDVersion.toString();
      var jdversion3 = "JD" + obj.originalJDVersion.toString();

      if (
        title.includes(query) == true ||
        jdversion.includes(query) == true ||
        jdversion2.includes(query) == true ||
        jdversion3.includes(query) == true ||
        artist.includes(query) == true ||
        mapname.includes(query) == true
      ) {
        matches.push(obj.mapName.toString());
      }
    }
    var carresponse = search;
    carresponse.categories.forEach(function (carousel) {
      // Add all the songs onto Just Dance Cosmos category
      if (carousel.title == "Just Dance 2017") {
        for (var songs in require("./data/db/songs.json")) {
          var song = require("./data/db/songs.json")[
            songs
          ];
          var obj = JSON.parse(
            '{"__class":"Item","isc":"grp_cover","act":"ui_component_base","components":[{"__class":"JD_CarouselContentComponent_Song","mapName":"' +
              song.mapName +
              '"}],"actionList":"partyMap"}'
          );
          carousel.items.push(obj);
        }
      }
    });

    response.send(carresponse);
  }
});

app.post("/carousel/v2/pages/avatars", function (request, response) {
  response.send(Avatars);
});

app.post("/carousel/v2/pages/dancerprofile", (req, res) => {
  var auth = req.header("Authorization");
  const httpsopts = {
    hostname: "prod.just-dance.com",
    port: 443,
    path: "/carousel/v2/pages/dancerprofile",
    method: "POST",
    headers: {
      "User-Agent": "UbiServices_SDK_HTTP_Client_4.2.9_PC32_ansi_static",
      Accept: "*/*",
      "Accept-Language": "en-us,en",
      Authorization: auth,
      "Content-Type": "application/json",
      "X-SkuId": "jd2017-pc-ww",
    },
  };
  redirect(httpsopts, JSON.stringify(req.body), function (redResponse) {
    res.send(redResponse);
  });
});

app.post("/carousel/v2/pages/friend-dancerprofile", (req, res) => {
  var json = JSON.stringify(req.body);
  var auth = req.header("Authorization");
  const httpsopts = {
    hostname: "prod.just-dance.com",
    port: 443,
    path: "/carousel/v2/pages/friend-dancerprofile?pid=" + req.query.pid,
    method: "POST",
    headers: {
      "User-Agent": "UbiServices_SDK_HTTP_Client_4.2.9_PC32_ansi_static",
      Accept: "*/*",
      "Accept-Language": "en-us,en",
      Authorization: auth,
      "Content-Type": "application/json",
      "X-SkuId": "jd2017-pc-ww",
    },
  };
  redirect(httpsopts, json, function (redResponse) {
    res.send(redResponse);
  });
});

app.get("/questdb/v1/quests", function (request, response) {
  response.send(Quest);
});

app.get("/status/v1/ping", function (request, response) {
  response.send(Ping);
});

app.get("/customizable-itemdb/v1/items", function (request, response) {
  response.send(CustomDB);
});

app.get("/com-video/v1/com-videos-fullscreen", function (request, response) {
  response.send(COM);
});

app.get("/constant-provider/v1/sku-constants", (req, res) => {
  res.send(SKUConstants);
});

app.post("/carousel/v2/pages/upsell-videos", function (request, response) {
  response.send(Pages);
});

app.post("/subscription/v1/refresh", function (request, response) {
  response.send(Subs);
});

//No Hud (by WodsonKun)
app.get("/content-authorization/v1/maps/:map", function (request, response) {
  const skuId = request.header("X-SkuId");
  switch (skuId) {
    case "jd2017-pc-ww":
      if (request.params.map) {
        var path = "./map/";
        if (fs.existsSync(path + request.params.map + ".json")) {
          fs.readFile(
            path + request.params.map + ".json",
            function (err, data) {
              if (err) {
                throw err;
              }
              if (data) {
                var strdata = JSON.parse(data),
                  pardata = JSON.stringify(strdata);
                response.send(pardata);
              }
            }
          );
        } else {
          response.send("Forbidden");
        }
      }
      break;
    case "jd2019-nx-all":
      if (request.params.map) {
        var path = "./map/";
        if (fs.existsSync(path + request.params.map + ".json")) {
          fs.readFile(
            path + request.params.map + ".json",
            function (err, data) {
              if (err) {
                throw err;
              }
              if (data) {
                var strdata = JSON.parse(data),
                  pardata = JSON.stringify(strdata);
                response.send(pardata);
              }
            }
          );
        } else {
          response.send("Forbidden");
        }
      }
      break;
    default:
      response.send(
        "Hey there!\nWe spent a real good time getting all of those No HUDs... So, is a no go"
      );
      break;
  }
});

app.get("/profile/v2/profiles", (req, res) => {
  var auth = req.header("Authorization");
  const httpsopts = {
    hostname: "prod.just-dance.com",
    port: 443,
    path: "/profile/v2/profiles?profileIds=" + req.query.profileIds,
    method: "GET",
    headers: {
      "User-Agent": "UbiServices_SDK_HTTP_Client_4.2.9_PC32_ansi_static",
      Accept: "*/*",
      Authorization: auth,
      "Content-Type": "application/json",
      "X-SkuId": "jd2017-pc-ww",
    },
  };
  redirect(httpsopts, "", function (redResponse) {
    res.send(redResponse);
  });
});

app.get(
  "/v1/applications/341789d4-b41f-4f40-ac79-e2bc4c94ead4/configuration",
  function (request, response) {
    response.send(v1);
  }
);

app.get(
  "/v2/spaces/f1ae5b84-db7c-481e-9867-861cf1852dc8/entities",
  function (request, response) {
    response.send(v2);
  }
);

app.get("/v3/users/:user", (req, res) => {
  var auth = req.header("Authorization");
  var sessionid = req.header("Ubi-SessionId");
  const httpsopts = {
    hostname: "public-ubiservices.ubi.com",
    port: 443,
    path: "/v3/users/" + req.params.user,
    method: "GET",
    headers: {
      "User-Agent": "UbiServices_SDK_HTTP_Client_4.2.9_PC32_ansi_static",
      Accept: "*/*",
      Authorization: auth,
      "Content-Type": "application/json",
      "ubi-appbuildid": "BUILDID_259645",
      "Ubi-AppId": "341789d4-b41f-4f40-ac79-e2bc4c94ead4",
      "Ubi-localeCode": "en-us",
      "Ubi-Populations": "US_EMPTY_VALUE",
      "Ubi-SessionId": sessionid,
    },
  };
  redirect(httpsopts, "", function (redResponse) {
    res.send(redResponse);
  });
});

// Leaderboards
app.get("/leaderboard/v1/maps/:map", (req, res) => {
  var auth = req.header("Authorization");
  const httpsopts = {
    hostname: "prod.just-dance.com",
    port: 443,
    path: "/leaderboard/v1/maps/" + req.params.map,
    method: "GET",
    headers: {
      "User-Agent": "UbiServices_SDK_HTTP_Client_4.2.9_PC32_ansi_static",
      Accept: "*/*",
      Authorization: auth,
      "Content-Type": "application/json",
      "X-SkuId": "jd2017-pc-ww",
    },
  };
  redirect(httpsopts, "", function (redResponse) {
    var responsepar = JSON.parse(JSON.stringify(redResponse));
    res.send(responsepar);
    console.log(responsepar);
  });
});

var prodwsurl = "https://prod.just-dance.com";
var room = "MainJD2020";

// World Dance Floor
app.post("/wdf/assign-room", (req, res) => {
  res.send({
    room: room,
  });
});

app.post("/wdf/:version/rooms/" + room + "/*", (req, res) => {
  var ticket = req.header("Authorization");
  var xhr = new XMLHttpRequest();
  var result = req.url.substr(0);
  xhr.open("POST", prodwsurl + result, false);
  xhr.setRequestHeader("X-SkuId", "jd2017-pc-ww");
  xhr.setRequestHeader("Authorization", ticket);
  xhr.setRequestHeader("Content-Type", "application/json");
  xhr.send(JSON.stringify(req.body, null, 2));
  res.send(xhr.responseText);
});

app.get("/wdf/:version/rooms/" + room + "/*", (req, res) => {
  var ticket = req.header("Authorization");
  var xhr = new XMLHttpRequest();
  var result = req.url.substr(0);
  xhr.open("GET", prodwsurl + result, false);
  xhr.setRequestHeader("X-SkuId", "jd2017-pc-ww");
  xhr.setRequestHeader("Authorization", ticket);
  xhr.setRequestHeader("Content-Type", "application/json");
  xhr.send(JSON.stringify(req.body, null, 2));
  res.send(xhr.responseText);
});

app.get("/wdf/v1/online-bosses", (req, res) => {
  var auth = req.header("Authorization");
  const httpsopts = {
    hostname: "prod.just-dance.com",
    port: 443,
    path: "/wdf/v1/online-bosses",
    method: "GET",
    headers: {
      "User-Agent": "UbiServices_SDK_HTTP_Client_4.2.9_PC32_ansi_static",
      Accept: "*/*",
      "Accept-Language": "en-us,en",
      Authorization: auth,
      "X-SkuId": "jd2017-pc-ww",
    },
  };
  redirect(httpsopts, "", function (redResponse) {
    res.send(redResponse);
  });
});

app.get("/wdf/v1/server-time", (req, res) => {
  var auth = req.header("Authorization");
  const httpsopts = {
    hostname: "prod.just-dance.com",
    port: 443,
    path: "/wdf/v1/server-time",
    method: "GET",
    headers: {
      "User-Agent": "UbiServices_SDK_HTTP_Client_4.2.9_PC32_ansi_static",
      Accept: "*/*",
      "Accept-Language": "en-us,en",
      Authorization: auth,
      "X-SkuId": "jd2017-pc-ww",
    },
  };
  redirect(httpsopts, "", function (redResponse) {
    res.send(redResponse);
  });
});

//packages
app.post("/carousel/v2/packages", function (request, response) {
  response.send(CarouselPackages);
});

app.post("/v3/users/:user", (req, res) => {
  var auth = req.header("Authorization");
  var sessionid = req.header("Ubi-SessionId");
  const httpsopts = {
    hostname: "public-ubiservices.ubi.com",
    port: 443,
    path: "/v3/users/" + req.params.user,
    method: "GET",
    headers: {
      "User-Agent": "UbiServices_SDK_HTTP_Client_4.2.9_PC32_ansi_static",
      Accept: "*/*",
      Authorization: auth,
      "Content-Type": "application/json",
      "ubi-appbuildid": "BUILDID_259645",
      "Ubi-AppId": "341789d4-b41f-4f40-ac79-e2bc4c94ead4",
      "Ubi-localeCode": "en-us",
      "Ubi-Populations": "US_EMPTY_VALUE",
      "Ubi-SessionId": sessionid,
    },
  };
  redirect(httpsopts, "", function (redResponse) {
    res.send(redResponse);
  });
});

// World Dance Floor
app.post("./wdf/assign-room", (req, res) => {
  res.send({
    room: room,
  });
});

app.post("./wdf/:version/rooms/" + room + "/*", (req, res) => {
  var ticket = req.header("Authorization");
  var xhr = new XMLHttpRequest();
  var result = req.url.substr(0);
  xhr.open("POST", prodwsurl + result, false);
  xhr.setRequestHeader("X-SkuId", "jd2019-nx-all");
  xhr.setRequestHeader("Authorization", ticket);
  xhr.setRequestHeader("Content-Type", "application/json");
  xhr.send(JSON.stringify(req.body, null, 2));
  res.send(xhr.responseText);
});

app.get("./wdf/:version/rooms/" + room + "/*", (req, res) => {
  var ticket = req.header("Authorization");
  var xhr = new XMLHttpRequest();
  var result = req.url.substr(0);
  xhr.open("GET", prodwsurl + result, false);
  xhr.setRequestHeader("X-SkuId", "jd2019-nx-all");
  xhr.setRequestHeader("Authorization", ticket);
  xhr.setRequestHeader("Content-Type", "application/json");
  xhr.send(JSON.stringify(req.body, null, 2));
  res.send(xhr.responseText);
});

app.get("./wdf/v1/online-bosses", (req, res) => {
  var auth = req.header("Authorization");
  const httpsopts = {
    hostname: "prod.just-dance.com",
    port: 443,
    path: "/wdf/v1/online-bosses",
    method: "GET",
    headers: {
      "User-Agent": "UbiServices_SDK_HTTP_Client_4.2.9_PC32_ansi_static",
      Accept: "*/*",
      "Accept-Language": "en-us,en",
      Authorization: auth,
      "X-SkuId": "jd2017-pc-ww",
    },
  };
  redirect(httpsopts, "", function (redResponse) {
    res.send(redResponse);
  });
});

app.get("./wdf/v1/server-time", (req, res) => {
  var auth = req.header("Authorization");
  const httpsopts = {
    hostname: "prod.just-dance.com",
    port: 443,
    path: "/wdf/v1/server-time",
    method: "GET",
    headers: {
      "User-Agent": "UbiServices_SDK_HTTP_Client_4.2.9_PC32_ansi_static",
      Accept: "*/*",
      "Accept-Language": "en-us,en",
      Authorization: auth,
      "X-SkuId": "jd2017-pc-ww",
    },
  };
  redirect(httpsopts, "", function (redResponse) {
    res.send(redResponse);
  });
});

// v3/profiles/sessions
app.post("/v3/profiles/sessions", (req, res) => {
  var json = JSON.stringify({});
  var auth = req.header("Authorization");
  const httpsopts = {
    hostname: "public-ubiservices.ubi.com",
    port: 443,
    path: "/v3/profiles/sessions",
    method: "POST",
    headers: {
      "User-Agent": "UbiServices_SDK_HTTP_Client_4.2.9_PC32_ansi_static",
      Accept: "*/*",
      Authorization: auth,
      "Content-Type": "application/json",
      "ubi-appbuildid": "BUILDID_259645",
      "Ubi-AppId": "740a6dc8-7d7a-4fbe-be2c-aa5d8c65c5e8",
      "Ubi-localeCode": "en-us",
      "Ubi-Populations": "US_EMPTY_VALUE",
    },
  };
  redirect(httpsopts, json, function (redResponse) {
    var responsepar = JSON.parse(redResponse);
    res.send(responsepar);
  });
});

// listen for requests :)
const listener = app.listen(process.env.PORT, function () {
  console.log("Your app is listening on port " + listener.address().port);
});

// Function to redirect to other sites
// It requires an options containing the route details, the method (GET, POST), and the address
function redirect(options, write, callback) {
  var Redirect = https.request(options, (response) => {
    response.on("data", (data) => {
      callback(data);
    });
  });
  Redirect.on("error", (e) => {
    console.log(e);
  });
  Redirect.write(write);
  Redirect.end();
}

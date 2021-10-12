function getid(id) {
  return parseInt(id.replace(/\D/g, ""), 10);
}
function unixToDeg(time) {
  var time = new Date(time * 1000);
  var hour = time.getUTCHours();
  var min = time.getUTCMinutes();
  var minSec = hour * 60 + min;
  console.log((360 / 1440) * minSec);
  return (360 / 1440) * minSec;
}
function unixToTime(time) {
  var time = new Date(time * 1000);
  var hour = time.getUTCHours();
  var min = time.getUTCMinutes();
  return hour + ":" + (min < 10 ? "0" : "") + min;
}
function weather(location) {
  var data = $.ajax({
    url: "https://api.openweathermap.org/data/2.5/weather",
    data: {
      units: "metric",
      appid: "7edcf34932c0c0e29367bcfedf992342",
      q: location,
    },
    async: false,
  }).responseText;
  return JSON.parse(data);
}

function getPeeps() {
  var data = $.ajax({
    url: "peeps.json",
    async: false,
  }).responseText;
  return JSON.parse(data).peeps;
}

$(document).ready(function () {
  // so, how's the weather?
  var jsonPeeps = getPeeps();

  // get the weather for errybody
  var forecast = jsonPeeps.map(function (data) {
    data.weather = weather(data.location);
    return data;
  });

  // get the time of day
  var forecast = forecast.map(function (data) {
    const timeOfDay = {
      currentTime: {
        deg:
          unixToDeg(parseInt(Date.now() / 1000, 10) + data.weather.timezone) -
          90,
        humanReadable: unixToTime(
          parseInt(Date.now() / 1000, 10) + data.weather.timezone
        ),
      },
      sunrise: {
        deg: unixToDeg(data.weather.sys.sunrise + data.weather.timezone) - 270,
        humanReadable: unixToTime(
          data.weather.sys.sunrise + data.weather.timezone
        ),
      },
      sunset: {
        deg: unixToDeg(data.weather.sys.sunset + data.weather.timezone) - 270,
        humanReadable: unixToTime(
          data.weather.sys.sunset + data.weather.timezone
        ),
      },
    };
    data.time = timeOfDay;
    return data;
  });

  // sort it left to right
  var sorted = [];
  $.each(forecast, function (k, v) {
    sorted.push(v);
  });
  sorted.sort(function (a, b) {
    return a.weather.coord.lon - b.weather.coord.lon;
  });
  forecast = sorted;
  console.log(forecast);
  //make the list
  const template = $("#peep").html();
  const rendered = Mustache.render(template, { peeps: forecast });
  $("#list").html(rendered);

  //round out the weather
  $.each($(".temp"), function () {
    var temp = parseFloat($(this).html()).toFixed(1);
    $(this).html(temp + "&deg;");
  });

  // Click a card to go to there
  // $(".peepWrapper").click(function () {
  //   const id = getid($(this).attr("id"));
  //   console.log(id);
  // });
  // make the map
  const thunderForestAPIkey = "0cc787ee20fd4009bbd734f133395579";
  var map = L.map("map").setView([51, -100], 4);
  L.tileLayer(
    "https://{s}.tile.thunderforest.com/transport-dark/{z}/{x}/{y}.png?apikey={apikey}",
    {
      attribution:
        '&copy; <a href="http://www.thunderforest.com/">Thunderforest</a>, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      apikey: thunderForestAPIkey,
      maxZoom: 22,
    }
  ).addTo(map);

  // custom icon
  const leIcon = L.icon({
    iconUrl: "contrast-marker-icon-2x.png",
    iconSize: [28, 33],
  });

  // show em on the map
  const popUpTemplate = $("#popup").html();
  $.each(forecast, function (k, v) {
    var latlog = [v.weather.coord.lat, v.weather.coord.lon];
    L.marker(latlog, { icon: leIcon })
      .addTo(map)
      .bindPopup(Mustache.render(popUpTemplate, v));
  });
});

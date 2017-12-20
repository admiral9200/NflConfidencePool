var fs = require('fs');
var axios = require('axios');
var cheerio  = require('cheerio');

var firebase = require('firebase');

var admin = require("firebase-admin");

var serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://nfl-confidence-app.firebaseio.com"
});

function getWeeklyGames(week) {
  return new Promise(function( resolve, reject) {
    try {
      var url = `http://www.nfl.com/schedules/2017/REG${week}`;
      var games = {};

      axios.get(url)
        .then(function (res) {
          const $  = cheerio.load(res.data);

          $('ul.schedules-table').children().each(function(index, element) {
            if ($(element).attr('class').indexOf('schedules-list-matchup') >= 0) {

              if ($(element).attr('class').indexOf('expanded') >=0)
                { return; }

              var gameDiv = $(element).find($('.schedules-list-content'));
              var homeTeam = gameDiv.attr('data-home-abbr');
              var homeTeamMascot = gameDiv.attr('data-home-mascot');
              var awayTeam = gameDiv.attr('data-away-abbr');
              var awayTeamMascot = gameDiv.attr('data-away-mascot');
              var startTime = $(element).find($('.list-matchup-row-time')).text().replace(/([\t\n]+)/g, "");
              var gameId = gameDiv.attr('data-gameid');

              var date = gameDiv.attr('data-gameid');
              date = date.substr(0, date.length-2);

              games[gameId] = {
                homeTeam,
                homeTeamMascot,
                awayTeam,
                awayTeamMascot,
                date,
                startTime
              };
            }
          });
          resolve(games);
        })
        .catch(function (err) {
          console.log(err);
        });
      }
      catch (err) {
        reject(err);
      }
  });
}

function getWeeklyResults(week) {
  return new Promise(function( resolve, reject) {
    try {
      var url = `http://www.nfl.com/scores/2017/REG${week}`;
      var results = {};

      axios.get(url)
        .then(function (res) {
          const $  = cheerio.load(res.data);
          $('div.scores-container .grid #score-boxes').children().each(function(index, element) {
            if ($(element).attr('id') && $(element).attr('id').indexOf('sb-wrapper') >= 0) {

              var gameId = $(element).attr('id').substr(11);
              var scoreDiv = $(element).find($('.new-score-box'));
              var homeTeam = $(scoreDiv).find($('.home-team'));
              var awayTeam = $(scoreDiv).find($('.away-team'));
              var homeTeamScore = $(homeTeam).find($('.total-score')).text();
              var awayTeamScore = $(awayTeam).find($('.total-score')).text();

              var winner = (parseInt(homeTeamScore, 10) > parseInt(awayTeamScore, 10) ? 'H' : 'A');
              if (homeTeamScore === '--')
              {
                return;
              }

              results[gameId] = {
                homeTeamScore,
                awayTeamScore,
                winner
              }
            }
          });
          resolve(results);
        })
        .catch(function (err) {
          console.log(err);
        });
      }
      catch (err) {
        reject(err);
      }
  });
}


function mainGetGames() {
  promises = [];
  for (var i = 1; i <= 17; i++) {
    promises.push(getWeeklyGames(i));
  };
  Promise.all(promises).then((result) => {
    var allGames = {};
    for (var i = 0; i < 17; i++) {
      allGames[(i+1)] = result[i];
    }
    fs.writeFile('./data/games2017.json', JSON.stringify(allGames), 'utf8', (err) => {
      if (err) throw err;
      console.log('File Saved!');
    });
    var database = admin.database();
    database.ref('/games/2017/').set({allGames}).then(() => {
      console.log("Done Talking w/ Firebase")
      admin.app().delete();
    });
  });
}

function mainGetResults() {
  promises = [];
  for (var i = 1; i <= 17; i++) {
    promises.push(getWeeklyResults(i));
  };
  Promise.all(promises).then((result) => {
    var allResults = {};
    for (var i = 0; i < 17; i++) {
      allResults[(i+1)] = result[i];
    }
    var database = admin.database();
    database.ref('/results/2017/').set({allResults}).then(() => {
      console.log("Done Talking w/ Firebase")
      admin.app().delete();
    });
  });
}

function mainComparePicksToResults(week) {
  var database = admin.database();
  var picks = {};
  var weekResults = {};

  database.ref('/users').once('value').then((snap) => {
    picks = snap.exportVal();
  }).then(() => {
    database.ref('/results/2017/allResults/' + week).once('value').then((snap) => {
      weekResults = snap.exportVal();
    })
  .then(() => {
    Object.keys(picks).forEach((userId) => {
      console.log(userId);
      if (userId != 'profiles') {
        Object.keys(weekResults).forEach((gameId) => {
          console.log(gameId);
          if (!!picks[userId][week] && picks[userId][week]['picks'][gameId] &&
              weekResults[gameId]) {

            var resultsUserRef = database.ref('/results/2017/' + week + '/users/' + userId + '/' + gameId);
            //var userResultsRef = database.ref('/users/' + userId + '/' + week + '/results/' + gameId);
            if (picks[userId][week]['picks'][gameId]['teamGuess'] ===
              weekResults[gameId]['winner'])
            {
              resultsUserRef.update({'result': picks[userId][week]['picks'][gameId]['guessValue']});
            } else {
              resultsUserRef.update({'result': 0});
            }
          }
        });
      }
    });
  })
  });
}
//mainGetResults(15);
mainComparePicksToResults(15);

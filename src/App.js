import React, { Component } from 'react';
import momentjs from 'moment';
import 'moment-timezone';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';

import ProfilePage from './Components/ProfilePage';
import ResultsPage from './Components/ResultsPage';
import GameCard from './Components/GameCard';
import WeeksDropDown from './Components/WeeksDropDown';
import LoginForm from './Components/LoginForm'
import firebase from './Components/Firebase';

import './App.css';
import 'react-dropdown/style.css';
import 'react-tabs/style/react-tabs.css';


class App extends Component {
  state = {
    games: {},
    picks: {},
    numsUsed: [],
    selectedWeek: {value:"15", label: "15"},
    currentUser: null,
    loading: false,
    errors: []
  }

  componentWillMount() {
    this.fetchWeek(this.state.selectedWeek.value);
    firebase.auth().onAuthStateChanged((user) => {
      if (user) {
        var currentUser = user;

        var picksPath = 'users/' + currentUser.uid + '/' + this.state.selectedWeek.value + '/picks/';
        var picksRef = firebase.database().ref(picksPath);
        this.setState({currentUser});
        this.listenForPicks(picksRef);
        console.log("User logged in.");
      } else {
        this.setState({ currentUser: null });
      }
    });
  }

  listenForPicks(picksRef) {
    picksRef.on('value', (snap) => {
      var picks = {};

      snap.forEach((pick) => {

        picks[pick.key] = {
          teamGuess: pick.val().teamGuess,
          guessValue: pick.val().guessValue
        };
      });

      this.setState({ picks }, () => {
        var numsUsed = [];
        Object.keys(picks).forEach((key) => {
          if (numsUsed.indexOf(picks[key].guessValue) === -1)
            numsUsed.push(parseInt(picks[key].guessValue, 10));
        });
        this.setState({ numsUsed });
      });
    }, (error) => {
      console.log(error);
    });
  }

  fetchWeek(week) {
    firebase.database().ref('/games/2017/allGames/' + week).once('value')
      .then((snap) => {
        const games = snap.exportVal();
        this.setState({ games });
      });
  }

  changePickObject(gameId, pickObj) {
    const { picks } = this.state;

    picks[gameId] = pickObj;
    this.setState({ picks });
  }

  changeNumberUsed(num, prevNum) {

    var newNumsUsed = this.state.numsUsed.slice();

    if (prevNum) {
      const index = newNumsUsed.indexOf(parseInt(prevNum, 10));
      newNumsUsed.splice(index, 1)
    };

    if (num) {
      newNumsUsed.push(parseInt(num, 10));
    }

    this.setState({numsUsed: newNumsUsed})
  }

  onWeekSelect (week) {
    if (week.value !== this.state.selectedWeek.value) {
      this.setState({ picks: {}, selectedWeek: week},
        () => {
          this.fetchWeek(week.value);
          var picksPath = 'users/' + this.state.currentUser.uid + '/' + this.state.selectedWeek.value + '/picks/';
          var picksRef = firebase.database().ref(picksPath);
          this.listenForPicks(picksRef);
        });
    }
  }

  pushError(error) {
    const errors = this.state.errors.concat(error);
    this.setState({ errors });
  }

  checkDuplicatePicks() {
    const numsUsed = this.state.numsUsed.slice();

    //Check for duplicate picks
    var numsSeen = [];
    var duplicatePicks = {};

    for (var i = 0; i < numsUsed.length; i++) {
      if (numsSeen.indexOf(numsUsed[i]) < 0)
        numsSeen.push(numsUsed[i])
      else
        duplicatePicks[numsUsed[i]] = (duplicatePicks[numsUsed[i]] || 1) + 1;
    }

    var errors = [];
    var keys = Object.keys(duplicatePicks);
    for (i = 0; i < keys.length; i++) {
      errors.push(keys[i] + " has been used " + duplicatePicks[keys[i]]  + " times");
    };

    return errors;
  }

  checkPickRange() {
    const numsUsed = this.state.numsUsed.slice();

    var maxNum = Object.keys(this.state.games).length;

    var errors = [];
    for (var i = 0; i < numsUsed.length; i++) {
      if (numsUsed[i] > maxNum)
        errors.push("Max pick this week is " + maxNum + ". " + numsUsed[i] + " was used below.")
    }

    return errors;
  }

  cleanUpPicks() {
    var cleanPicks = Object.assign({}, this.state.picks);
    const games = this.state.games;

    if (Object.keys(cleanPicks).length > 0) {
      Object.keys(cleanPicks).forEach((gameId) => {
        const dateToFormat = games[gameId].date + ' ' + games[gameId].startTime;
        if (momentjs.tz(dateToFormat, "YYYYMMDD hh:mmAA", "America/New_York") <= momentjs()) {
          delete cleanPicks[gameId];
        }
      });
    }
  }

  submitPicks() {
    this.setState({loading: true, errors: []});

    const dbPath = 'users/' + this.state.currentUser.uid + '/' + this.state.selectedWeek.value;
    const picks = this.state.picks;
    this.cleanUpPicks();
    if (this.state.currentUser /*&& this.state.currentUser.emailVerified*/) {
      if (Object.keys(picks).length > 0) {
        firebase.database().ref().child(dbPath).update({picks})
        .then(this.setState({loading: false}, () => window.scrollTo(0,0)));
      }
    } else {
      this.pushError("Could Not Submit. Your email is not verified. Please verify it, in case you need to recover your account down the line.");
      window.scrollTo(0,0);
    }
  }

  checkForErrors() {
    const errors = this.state.errors.concat(this.checkDuplicatePicks(), this.checkPickRange());

    return errors;
  }

  renderErrors() {
    const errors = this.checkForErrors();
    if (errors.length > 0) {
      var htmlErrors = errors.map((error, id) => {
        return (<div key={id}>{error}</div>)
      });
      return (<div style={styles.errorStyle}>{htmlErrors}</div>)
    }
  }

  renderTracker() {
    const { games, numsUsed } = this.state;
    var htmlEle = [];

    for (var i = 0; i < Object.keys(games).length; i++) {
      if (numsUsed.includes(i+1))
        htmlEle.push(<div style={{color: 'red', textDecoration:'line-through'}} key={i}>
                       <div style={{color:'black'}}>
                         {i+1}
                       </div>
                     </div>);
      else {
        htmlEle.push(<div key={i}>
                      {i+1}
                    </div>);
      }
    }

    return (<div style={styles.sideTracker}>
              <div style={styles.trackerCounter}>
                {htmlEle}
              </div>
            </div>);
  }

  renderGames() {

    return Object.keys(this.state.games).map((gId, index) => {
      const game = this.state.games[gId];

      return (<GameCard
        key={gId}
        gameId= {gId}
        homeTeam = {game.homeTeam}
        awayTeam = {game.awayTeam}
        startTime = {'6:00 PM'}//{game.startTime}
        date = {'20171230'}//{game.date}
        changeNumberUsed = {this.changeNumberUsed.bind(this)}
        changePickObject = {this.changePickObject.bind(this)}
        gamePick = {this.state.picks[gId]}
      />)
    })
  }

  async logout() {
    try {
      await firebase.auth().signOut()
        .then(() => {
          console.log("logged Out!");
        });
    } catch (error) {
      console.log('log out error');
      console.log(error);
    }
  }

  renderLogin() {
    if (this.state.currentUser != null) {
      return <button style={styles.buttonStyle} onClick={() => this.logout()}>Logout</button>
    }
    else {
      return <LoginForm />
    }
  }

  renderMain() {

    if (this.state.currentUser != null) {
      return (
        <Tabs>
          <TabList>
            <Tab>Picks</Tab>
            <Tab>Results</Tab>
            <Tab>Profile</Tab>
          </TabList>
          {this.renderErrors()}
          <WeeksDropDown
            onWeekSelect={this.onWeekSelect.bind(this)}
            selectedWeek={this.state.selectedWeek}
          />
          <TabPanel>
            <div>
              {this.renderGames()}
            </div>
            <button
              disabled={this.checkForErrors().length > 0 ? "disabled" : ""}
              style={styles.buttonStyle}
              onClick={this.submitPicks.bind(this)}
              value="Submit Picks"
            >
              Submit Picks
            </button>
          </TabPanel>
          <TabPanel>
            <ResultsPage
              week={this.state.selectedWeek.value}
              currentUser={this.state.currentUser}
              games={this.state.games} />
          </TabPanel>
          <TabPanel>
            <ProfilePage />
          </TabPanel>
        </Tabs>
      )
    }
  }

  render() {

    return (
      <div className="App">
        <div style={styles.stickyStyle}>{this.renderTracker()}</div>
        <div style={styles.mainContent}>
          {this.renderLogin()}
          {this.renderMain()}
        </div>
      </div>
    );
  }
}

const styles = {
  mainContent: {
    marginRight: '40px'
  },
  stickyStyle: {
    position: 'fixed',
    top: 0,
    right: 0,
    height: '100%',
    zIndex: 100000,
    width: '40px',
    backgroundColor: '#C0C0C0'
  },
  sideTracker: {
    display:'table',
    textAlign: 'center',
    height:'85%',
    width: '100%'
  },
  trackerCounter: {
    display: 'table-cell',
    verticalAlign:'middle',
    textAlign: 'center',
    fontSize: '30px',
  },
  buttonStyle: {
    display: 'inline-block',
    margin: '5px',
    padding: '5px',
    cursor: 'pointer'
  },
  errorStyle: {
    color: 'red',
    fontWeight:'bold',
    margin: '5px'
  }
}

export default App;

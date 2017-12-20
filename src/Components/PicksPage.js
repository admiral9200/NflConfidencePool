import React, { Component } from 'react';
import momentjs from 'moment';
import 'moment-timezone';

import GameCard from './GameCard';
import PickTracker from './PickTracker';
import firebase from './Firebase';

class PicksPage extends Component {
  state = {
    picks: {},
    numsUsed: [],
    errors: []
  }

  componentWillMount() {
    this.fetchPicks(this.props.week);
  }

  componentWillReceiveProps(newProps) {
    //Since the week selection is managed by the parent
    //This will re-render the component on week change
    if (this.props.week !== newProps.week) {
      this.fetchPicks(newProps.week)
    }
  }

  fetchPicks(week) {
    /* Sets up a listener with the firebase database, to watch for changes to
     * picks. On a change of picks, fetches them, and assigns the change to
     * the picks state.
     */
    var currentUser = this.props.currentUser;
    var picksPath = 'users/' + currentUser.uid + '/' + week + '/picks/';
    var picksRef = firebase.database().ref(picksPath);
    picksRef.on('value', (snap) => {
      var picks = {};

      snap.forEach((pick) => {

        picks[pick.key] = {
          teamGuess: pick.val().teamGuess,
          guessValue: pick.val().guessValue
        };
      });

      this.setState({ picks }, () => {
        // Wait for picks state to be changed, then execute a callback
        // to update the numUsed state. This is most important for the first
        // render of the session, to ensure the client-side tracker is up to date
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

  changePickObject(gameId, pickObj) {
    const { picks } = this.state;

    picks[gameId] = pickObj;
    this.setState({ picks });
  }

  changeNumberUsed(num, prevNum) {
    /* Used by the setter of picks to update the numbers used in the state.
     * As each pick needs to use a unique number, this will modify a picks
     * 'used' number when it is updated/changed in the onChange function of
     * the GameCard inputs.
     */

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

  checkDuplicatePicks() {
    /* Checks the user submitted Picks for duplicate picks.
     * As per the rules of the game, each game pick value (from 1 - Max Games)
     * must be unique. Picks 'used' are kept track of in the PicksPage state
     * via the numsUsed property. This also allows the 'tracker' component to
     * present the available values and used values to the client.
     */

    const numsUsed = this.state.numsUsed.slice();

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
    // Duplicate picks are treated as errors and will not allow the user to
    // submit their picks until they are resolved. The errors array above
    // is returned to the checkForErrors function below.
    for (i = 0; i < keys.length; i++) {
      errors.push(keys[i] + " has been used " + duplicatePicks[keys[i]]  + " times");
    };

    return errors;
  }

  checkPickRange() {
    /* Each week the user assigns values to each game, from a minimum of 1 to
     * a maximum of the amount of games in the week. Most weeks values can be
     * 1 - 16, but bye weeks will reduce the maximum on some weeks. This function
     * makes sure that the values are above 1, and below the amount of games on
     * the week.
     */
    const numsUsed = this.state.numsUsed.slice();

    var maxNum = Object.keys(this.props.games).length;

    var errors = [];
    for (var i = 0; i < numsUsed.length; i++) {
      if (numsUsed[i] > maxNum)
        errors.push("Max pick this week is " + maxNum + ". " + numsUsed[i] + " was used below.")
    }

    return errors;
  }

  checkForErrors() {
    // Uses the two functions above to check for errors.
    // Any errors returned will be concatenated to existing errors in the state.
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

  cleanUpPicks() {
    /* Because the picks are all kept in the same object, even for games which
     * might be over, we need to clean them up before submitting to the database
     * this function removes any games which have started from the picks object
     */
    var cleanPicks = Object.assign({}, this.state.picks);
    const games = this.props.games;

    if (Object.keys(cleanPicks).length > 0) {
      Object.keys(cleanPicks).forEach((gameId) => {
        const dateToFormat = games[gameId].date + ' ' + games[gameId].startTime;
        if (momentjs.tz(dateToFormat, "YYYYMMDD hh:mmAA", "America/New_York") <= momentjs()) {
          delete cleanPicks[gameId];
        }
      });
    }
  }

  pushError(error) {
    const errors = this.state.errors.concat(error);
    this.setState({ errors });
  }

  submitPicks() {
    this.setState({errors: []});

    const dbPath = 'users/' + this.props.currentUser.uid + '/' + this.props.week;
    const picks = this.state.picks;

    //Make sure therer are no picks being pushed to the database
    //for games that have started.
    this.cleanUpPicks();

    // Check to make sure there is a user logged in, and that their email is
    // verified, before allowing them to submit.
    if (this.props.currentUser /*&& this.state.currentUser.emailVerified*/) {
      if (Object.keys(picks).length > 0) {
        firebase.database().ref().child(dbPath).update({picks})
        .then(this.setState({loading: false}, () => window.scrollTo(0,0)));
      }
    } else {
      this.pushError("Could Not Submit. Your email is not verified. Please verify it, in case you need to recover your account down the line.");
      window.scrollTo(0,0);
    }
  }

  renderGames() {
    //GameCard is the box for each individual game on the week.
    return Object.keys(this.props.games).map((gId, index) => {
      const game = this.props.games[gId];

      return (<GameCard
        key={gId}
        gameId= {gId}
        homeTeam = {game.homeTeam}
        awayTeam = {game.awayTeam}
        startTime = {game.startTime}
        date = {game.date}
        changeNumberUsed = {this.changeNumberUsed.bind(this)}
        changePickObject = {this.changePickObject.bind(this)}
        gamePick = {this.state.picks[gId]}
      />)
    })
  }

  render() {
    return(
      <div>
        <PickTracker
          numsUsed = {this.state.numsUsed}
          games = {this.props.games}
        />
        {this.renderErrors()}
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
      </div>
    )
  }
}

const styles = {
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

export default PicksPage;

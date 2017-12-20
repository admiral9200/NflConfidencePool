import React, { Component } from 'react';

import firebase from './Firebase';
import './ResultsTable.css';

/* Component used for rendering weekly results, when the user
 * clicks on the results tab. Results are displayed as a table,
 * with the users in the rows, and the games in the columns.
 * 0 will be displayed for games that were picked incorrectly,
 * whereas the value of the pick will be displayed for games
 * picked correctly. Games missing a pick are given a '-' in order
 * to differentiate them from wrong picks.
 */
class ResultsPage extends Component {
  state = {
    results: {},
    users: {}
  }

  componentWillMount() {
    this.fetchResults(this.props.week);
  }

  componentWillReceiveProps(newProps) {
    if (this.props.week !== newProps.week) {
      this.fetchResults(newProps.week)
    }
  }

  fetchResults(week) {
    /* Sets up the listener for changes to the results in the database.
     * Useful for realtime updating if the user is logged in when games
     * finish, or when the database updates. Currently listens for the results
     * for every user in the pool. Room to optimize this in the future.
     */
    var resultsRef = firebase.database().ref('/results/2017/' + week +
      '/users/');

    resultsRef.on('value', (snap) => {
      var results = {};

      snap.forEach((result) => {
        //exportVal() is the function used within the firebase database
        //'snapshot' (snap) to convert the snapshot payload to a js Obj
        results[result.key] = result.exportVal();
      });
      this.setState({ results }, () => {
        // Uses a promise to give the database time to send a response back
        // with the list of usernames. This list is used for the row labels
        var promise = this.getUserNames();
        Promise.resolve(promise).then((users) => {
          this.setState({users})
        });
      });
    }, (error) => {
      console.log(error);
    });
  }

  async getUserNames() {
    try {
      var user = {};
      await firebase.database().ref('/users/profiles').once('value').then((snap) => {
        user = snap.exportVal();
      });
      return user;
    } catch (error) {
      console.log(error);
    }
  }

  generateUserRows() {
    //used by the renderResults function to generate the user rows in
    //the final results table
    var usersResults = Object.assign({}, this.state.results);
    const users = Object.assign({}, this.state.users);
    const games = this.props.games;
    var htmlResults = [];

    Object.keys(users).forEach((user) => {
      // For each user in the users object, generate a row for the table
      var userRow = [];
      var totalScore = 0;
      userRow.push(<td key={user}>{users[user].name}</td>);

      Object.keys(games).forEach((gameId) => {
        var result = '';
        //Nested && statement to make sure the given keys/props exist for the
        //returned object. This is necessary in case a user doesn't have results
        //in the usersResults object, or doesn't have a particular gameId in their
        //results for the week (because they missed a pick)
        if (usersResults && usersResults[user] && usersResults[user][gameId])
          result = usersResults[user][gameId].result;
        else
          result = '--';

        if (result !== '--') {
          totalScore += parseInt(result, 10);
        }
        userRow.push(<td key={gameId + '-' + users[user]}>{result}</td>);
      });
      userRow.push(<td key={users[user]}>{totalScore}</td>);
      htmlResults.push(userRow);
    })

    return(htmlResults);

  }

  renderResults() {
    const games = this.props.games;

    //tableHeader is the html elements for the column headers
    var tableHeader = [<th key={'topLeft'}> </th>];
    Object.keys(games).forEach((gameId) => {
      tableHeader.push(<th key={gameId}>{games[gameId].homeTeam} vs. {games[gameId].awayTeam}</th>);
    });
    tableHeader.push(<th key={"Total"}>Total</th>);
    return (
        <table className="results" cellPadding="7">
              <thead>
                <tr>
                  {tableHeader}
                </tr>
              </thead>
              <tbody>
                {this.generateUserRows().map((row, id) => <tr key={id}>{row}</tr>)}
              </tbody>
            </table>
          )
  }

  render() {
    return(
      <div style={{display:'inline-block'}}>
        {"Week " + this.props.week}
        {this.renderResults()}
      </div>
    )
  }
};

export default ResultsPage;

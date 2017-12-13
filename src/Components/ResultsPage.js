import React, { Component } from 'react';
import firebase from './Firebase';

import './ResultsTable.css';

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
    var resultsRef = firebase.database().ref('/results/2017/' + week +
      '/users/');

    resultsRef.on('value', (snap) => {
      var results = {};

      snap.forEach((result) => {
        results[result.key] = result.exportVal();
      });

      this.setState({ results }, () => {
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
    var usersResults = Object.assign({}, this.state.results);
    const users = Object.assign({}, this.state.users);
    const games = this.props.games;
    var htmlResults = [];

    Object.keys(users).forEach((user) => {
      var userRow = [];
      var totalScore = 0;
      userRow.push(<td key={user}>{users[user].name}</td>);

      //if (Object.keys(usersResults).length > 0) {
      Object.keys(games).forEach((gameId) => {
        var result = '';
        if (usersResults && usersResults[user] && usersResults[user][gameId])
          result = usersResults[user][gameId].result;
        else
          result = '--';

        if (result !== '--') {
          totalScore += parseInt(result, 10);
        }
        userRow.push(<td key={gameId + '-' + users[user]}>{result}</td>);
      });
      //}

      userRow.push(<td key={users[user]}>{totalScore}</td>);
      htmlResults.push(userRow);
    })

    return(htmlResults);

  }

  renderResults() {
    const games = this.props.games;

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

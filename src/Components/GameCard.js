import React, { Component } from 'react';
import momentjs from 'moment';
import Moment from 'react-moment';
import 'moment-timezone';

class GameCard extends Component {
  state = {
    hasGuess: false,
    gameIsOver: null
  }

  componentWillMount() {
    if (this.checkGameHasStarted(this.props.startTime, this.props.date))
      this.setState({gameIsOver: true});
  }

  onValueChange(e) {
    if (this.checkGameHasStarted(this.props.startTime, this.props.date)) {
      this.setState({gameIsOver: true});
      return;
    }
    const { target } = e;
    const key = target.getAttribute('name');

    const prevValue = this.props.gamePick.guessValue;
    const value = e.target.value;

    if (value === "") {
      this.props.changeNumberUsed(null, prevValue);
      this.setState({hasGuess:false});
      this.props.changePickObject(this.props.gameId, {teamGuess: null, guessValue: null });
    } else {
      this.props.changeNumberUsed(value, prevValue);
      this.setState({hasGuess: true});
      this.props.changePickObject(this.props.gameId, {teamGuess: key, guessValue: value });
    }
  }

  formatGameTimeHeader(time, date) {
    //gameTime format is two seperate strings, which have been scraped from nfl.com
    //this is required to convert them to a proper datetime object using moment,
    //and format it nicely for the user
    const dateToFormat = date + ' ' + time;
    const momentObj = (momentjs.tz(dateToFormat, "YYYYMMDD hh:mmAA", "America/New_York"));
    const momentDate = <Moment format="ddd MMM D">{momentObj}</Moment>
    const momentTime = (time==='FINAL') ? 'FINAL' : <Moment format="h:mm z" tz="America/Edmonton">{momentObj}</Moment>
    return (<tr>
              <th>{momentDate}</th>
              <th>{momentTime}</th>
              <th>{this.checkGameHasStarted(time, date) && time !=='FINAL' ? "FINAL" : ""}</th>
            </tr>)
  }

  checkGameHasStarted(time, date) {
    //checks whether the game has started or not
    const dateToFormat = date + ' ' + time;
    if (momentjs.tz(dateToFormat, "YYYYMMDD hh:mmAA", "America/New_York") <= momentjs())
      return true;
    return false;
  }

  isDisabled(teamGuess, teamChar, startTime, date) {
    /* The input field will be disabled for two reasons:
     * 1. The game has started, and so the user can no longer enter picks (this is checked during the
          input fields on change function, and during rendered)
     * 2. The game already has a pick for the other team. This is to protect the user from picking both teams,
     *    by accident or on purpose.
     */
    return ((this.state.hasGuess && teamGuess === teamChar) || this.checkGameHasStarted(startTime, date)) ? "disabled" : "";
  }

  render() {
    const { teamGuess, guessValue } = this.props.gamePick;
    const { homeTeam, awayTeam, date, startTime } = this.props;

    /* There are a handful of style changes related to the users selection of
     * picks / teams. When a selection is made for one team (for example the
     * home team), the input field for the opposite team will be disabled (for
     * example the away team), and a background color will be added to the two
     * teams to represent your seleciton (Green for the team they expect to win;
     * red for the team they expect to lose).
     */
    return (
      <table style={styles.cardStyle}>
        <thead>
          {this.formatGameTimeHeader(startTime, date)}
        </thead>
        <tbody>
          <tr style={(teamGuess !== null) ? ((teamGuess === 'A') ? styles.pickedStyle : styles.notPickedStyle) : styles.defaultStyle}>
            <td>
              <img
                style={{verticalAlign: 'middle'}}
                src={`http://i.nflcdn.com/static/site/7.5/img/logos/teams-matte-80x53/${awayTeam}.png`}
                alt="away-team-img"
              />
            </td>
            <td>{awayTeam}</td>
            <td>
              <input
                name="A"
                type="text"
                value={(teamGuess === 'A') ? guessValue : ""}
                style={{width:"50px"}}
                disabled={this.isDisabled(teamGuess, 'H', startTime, date)}
                onChange={(e) => this.onValueChange(e) }
              />
            </td>
          </tr>
          <tr style={(teamGuess !== null) ? ((teamGuess === 'H') ? styles.pickedStyle : styles.notPickedStyle) : styles.defaultStyle}>
            <td>
              <img
                style={{verticalAlign: 'middle'}}
                src={`http://i.nflcdn.com/static/site/7.5/img/logos/teams-matte-80x53/${homeTeam}.png`}
                alt="home-team-img"
              />
            </td>
            <td>{homeTeam}</td>
            <td>
              <input
                name="H"
                type="text"
                value={(teamGuess === 'H') ? guessValue : ""}
                style={{width:"50px"}}
                disabled={((this.state.hasGuess && teamGuess === 'A') || this.checkGameHasStarted(startTime, date)) ? "disabled" : ""}
                onChange={(e) => this.onValueChange(e) }
              />
            </td>
          </tr>
        </tbody>
      </table>
    );
  }
}

GameCard.defaultProps = {
  gamePick: {
    teamGuess: null,
    guessValue: null
  }
};

const styles = {
  cardStyle: {
    display:"inline-block",
    borderStyle:"solid",
    padding: '2px',
    margin: '5px',
    borderCollapse: 'collapse'
  },
  pickedStyle: {
    backgroundColor: '#7fc17f',
    height: '60px'
  },
  notPickedStyle: {
    backgroundColor: "#ff9999",
    height: '60px'
  },
  defaultStyle: {
    backgroundcolor: "none",
    height: '60px'
  }
}

export default GameCard;

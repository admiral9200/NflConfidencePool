import React, { Component } from 'react';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';

import ProfilePage from './Components/ProfilePage';
import PicksPage from './Components/PicksPage';
import ResultsPage from './Components/ResultsPage';
import WeeksDropDown from './Components/WeeksDropDown';
import LoginForm from './Components/LoginForm'
import firebase from './Components/Firebase';

import './App.css';
import 'react-dropdown/style.css';
import 'react-tabs/style/react-tabs.css';


class App extends Component {
  state = {
    games: {},
    selectedWeek: {value:"16", label: "16"},
    currentUser: null,
    loading: false
  }

  componentWillMount() {
    this.fetchWeek(this.state.selectedWeek.value);
    // Firebase listener to check for a log-in/log-out by the user
    firebase.auth().onAuthStateChanged((user) => {
      if (user) {
        var currentUser = user;

        this.setState({currentUser});
        console.log("User logged in.");
      } else {
        this.setState({ currentUser: null });
      }
    });
  }

  fetchWeek(week) {
    /*  App keeps track of the selected week and fetches the games
     *  associated with that week on week change. These games are used
     *  by the picks page and the results page for rendering.
     *  Weeks can be changed by user via the week-dropdown menu.
     */
    firebase.database().ref('/games/2017/allGames/' + week).once('value')
      .then((snap) => {
        const games = snap.exportVal();
        this.setState({ games });
      });
  }

  onWeekSelect (week) {
    /* Used by the week drop down menu to change the selected
     * week in the state, and update the games via fetchWeek
     */
    if (week.value !== this.state.selectedWeek.value) {
      this.setState({selectedWeek: week},
        () => {
          this.fetchWeek(week.value);
        });
    }
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
          <WeeksDropDown
            onWeekSelect={this.onWeekSelect.bind(this)}
            selectedWeek={this.state.selectedWeek}
          />
          <TabPanel>
            <PicksPage
              week={this.state.selectedWeek.value}
              currentUser={this.state.currentUser}
              games={this.state.games}
            />
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
        <div style={styles.stickyStyle}></div>
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
  buttonStyle: {
    display: 'inline-block',
    margin: '5px',
    padding: '5px',
    cursor: 'pointer'
  },
}

export default App;

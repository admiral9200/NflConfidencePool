import React, { Component } from 'react';
import firebase from 'firebase';

class LoginForm extends Component {
  state = {
    email: '',
    password: '',
    loading: false
  }

  async login() {

    const { email, password } = this.state;

    try {
        await firebase.auth()
          .signInWithEmailAndPassword(email, password)
          .then(() => {
            this.setState({
              email: '',
              password: '',
              loading: false});
          });
        console.log("Logged In!");
    } catch (error) {
      console.log(error.toString())
    }
  }

  async signup() {

    const { email, password } = this.state;
    console.log(email);
    console.log(password);

    try {
      await firebase.auth()
        .createUserWithEmailAndPassword(email, password)
        .then(() => {

          var user = firebase.auth().currentUser;
          var displayName = user.displayName ? user.displayName : user.email.split('@')[0];
          firebase.database().ref('/users/profiles/' + user.uid).update({name: displayName});
          user.sendEmailVerification().then(function() {
          }).catch(function(error) {
            console.log(error);
          });
          this.setState({
            email: '',
            password: '',
            loading: false});
        });
      console.log("Account created");
    } catch (error) {
      console.log(error.toString());
    }
  }

  renderButton() {
    if (this.state.loading) {
      return <div>Loading...</div>
    }

    return (
      <div>
        <button
          style={styles.buttonStyle}
          onClick={this.login.bind(this)}
        >
          Log In
        </button>
        <button
          style={styles.buttonStyle}
          onClick={this.signup.bind(this)}
        >
          Sign Up
        </button>
      </div>
    )
  }

  render() {
    return (
      <div>
        E-mail:
        <input
          type="text"
          name="email"
          placeholder="Enter your e-mail"
          value={this.state.email}
          onChange={(e) => this.setState({email: e.target.value})}
          style={styles.inputStyle}
        />
        Password:
        <input
          type="password"
          name="pass"
          placeholder="Enter your password"
          value={this.state.password}
          onChange={(e) => this.setState({password: e.target.value})}
          style={styles.inputStyle}
        />
        <div>
          {this.renderButton()}
        </div>
      </div>
    )
  }
}

const styles = {
  inputStyle: {
    width:'150px',
    margin: '5px'
  },
  buttonStyle: {
    display: 'inline-block',
    margin: '5px',
    padding: '5px',
    cursor: 'pointer'
  }
}

export default LoginForm;

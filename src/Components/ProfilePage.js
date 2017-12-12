import React, { Component } from 'react';

import firebase from './Firebase';

class ProfilePage extends Component {
  state = {
    name: "",
    email: ""
  }

  componentWillMount() {
    this.getUserProfile();
  }

  getUserProfile() {
    var user = firebase.auth().currentUser;
    var name, email;

    if (user != null) {
      name = user.displayName;
      email = user.email;
    }

    console.log(name);

    this.setState({name, email});
  }

  updateProfile() {
    var user = firebase.auth().currentUser;
    var { name, email } = this.state;

    user.updateProfile({
      displayName: name,
      email: email
    }).then(() => {
      console.log("Profile Updated");
    });
    firebase.database().ref('/users/profiles/' + user.uid).update({ name })
      .then(() => console.log('added user profile'))
      .catch((err) => console.log('error in user profile node'));
  }

  render() {

    return (
      <div>
        <h2>Update Profile</h2>
        <form>
          <label style={{display: 'block', marginBottom: '5px', marginLeft: '5px'}}>
            E-mail:
          <input
            style={{marginLeft: '5px', textAlign:'center'}}
            type="text"
            name="email"
            value={this.state.email}
            onChange={(e) => {this.setState({email: e.target.value})}}
          />
          </label>
          <label style={{display: 'block', marginBottom: '5px'}}>
            Display Name:

            <input
              style={{marginLeft: '5px', textAlign:'center'}}
              type="text"
              name="name"
              value={this.state.name}
              onChange={(e) => {this.setState({name: e.target.value})}}
            />
            </label>
            <button
              style={styles.buttonStyle}
              onClick={this.updateProfile.bind(this)}
              value="Update Profile"
            >
              Update Profile
            </button>

        </form>
      </div>
    )
  }
}

const styles =   {
  buttonStyle: {
    display: 'inline-block',
    margin: '5px',
    padding: '5px',
    cursor: 'pointer'
  }
}
export default ProfilePage;

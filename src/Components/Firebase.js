import * as firebase from 'firebase';

const config = {
    apiKey: "AIzaSyDY7yMtP5-5RBjagnb1rblG1iMcc9qpOQI",
    authDomain: "nfl-confidence-app.firebaseapp.com",
    databaseURL: "https://nfl-confidence-app.firebaseio.com",
    projectId: "nfl-confidence-app",
    storageBucket: "",
    messagingSenderId: "1022611613866"
  };

firebase.initializeApp(config);

export default firebase;

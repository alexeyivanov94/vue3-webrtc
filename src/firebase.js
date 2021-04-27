import firebase from 'firebase/app';
import 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyC1Jf1atp_eNeUS5CdzOpI4ox_pyALwtGQ",
  authDomain: "webrtcvue3.firebaseapp.com",
  projectId: "webrtcvue3",
  storageBucket: "webrtcvue3.appspot.com",
  messagingSenderId: "36038833792",
  appId: "1:36038833792:web:85d9e75df723dcc4a6d865"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const getFirestore = () => firebase.firestore()

export {
  firebase,
  getFirestore
}


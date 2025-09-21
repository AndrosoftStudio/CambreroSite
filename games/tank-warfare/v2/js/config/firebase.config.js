// Firebase Configuration
window.FirebaseConfig = {
    config: {
        apiKey: "AIzaSyAVHznNje2-StnWRFvoakV_F9nMuYG4ODI",
        authDomain: "tank-warfare-10a05.firebaseapp.com",
        databaseURL: "https://tank-warfare-10a05-default-rtdb.firebaseio.com",
        projectId: "tank-warfare-10a05",
        storageBucket: "tank-warfare-10a05.firebasestorage.app",
        messagingSenderId: "797243766343",
        appId: "1:797243766343:web:850ffb416ab755c1f62362",
        measurementId: "G-G9D4B7ZC6S"
    },
    
    init() {
        firebase.initializeApp(this.config);
        window.auth = firebase.auth();
        window.database = firebase.database();
        window.storage = firebase.storage();
        console.log('Firebase initialized');
    }
};
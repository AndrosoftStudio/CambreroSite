// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc, collection, addDoc, query, where, orderBy, limit, onSnapshot, serverTimestamp, increment, deleteDoc } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";
import { getDatabase, ref, set, get, update, remove, onValue, push, serverTimestamp as rtServerTimestamp, onDisconnect } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyCFv6rHPSRLHvZ1OmZqroeSU3A3_VYZDV4",
    authDomain: "nemsei-c5e83.firebaseapp.com",
    projectId: "nemsei-c5e83",
    storageBucket: "nemsei-c5e83.firebasestorage.app",
    messagingSenderId: "866918578524",
    appId: "1:866918578524:web:8fbd112e59e50a7bb6e999",
    measurementId: "G-84P45Q6TQ4"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const rtdb = getDatabase(app);

// Exportar para uso global
window.firebaseApp = { 
    auth, 
    db, 
    rtdb,
    // Funções de autenticação
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    signOut,
    onAuthStateChanged,
    // Funções do Firestore
    doc,
    setDoc,
    getDoc,
    updateDoc,
    collection,
    addDoc,
    query,
    where,
    orderBy,
    limit,
    onSnapshot,
    serverTimestamp,
    increment,
    deleteDoc,
    // Funções do Realtime Database
    ref,
    set,
    get,
    update,
    remove,
    onValue,
    push,
    rtServerTimestamp,
    onDisconnect
};

// Estado global do jogo
window.gameState = {
    user: null,
    currentMatch: null,
    gameMode: null,
    gameType: null,
    isHost: false,
    players: {},
    gameData: {},
    peer: null,
    connections: {},
    matchmakingTimeout: null,
    queueStartTime: null,
    queueId: null,
    ping: 0,
    onlinePlayersCount: 0
};

console.log('🔥 Firebase configurado com sucesso!');
require("dotenv").config();
const { initializeApp, applicationDefault } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { getAuth } = require("firebase-admin/auth");
const { getStorage } = require("firebase-admin/storage");


initializeApp({
  credential: applicationDefault(),
});

const db = getFirestore();
const auth = getAuth();
const storage = getStorage();

module.exports = {
  db,
  auth,
  storage
};

// Import the functions you need from the SDKs you need
const { initializeApp } = require("firebase/app");;
const { getDatabase, ref, set} = require("firebase/database");
const express = require("express");
const app = express();
const path = require("path");
const fs = require("fs");
const tess = require("tesseract.js");
app.set('view engine', 'ejs');
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = initializeApp({
    apiKey: "AIzaSyDkLkXvfbwQUM2CZ1fPYU1vEh5O-EIJ4mI",
    authDomain: "thai-id-ocr.firebaseapp.com",
    databaseURL: "https://thai-id-ocr-default-rtdb.firebaseio.com",
    projectId: "thai-id-ocr",
    storageBucket: "thai-id-ocr.appspot.com",
    messagingSenderId: "1087833116",
    appId: "1:1087833116:web:71c28b571c3199198f0bd9",
    measurementId: "G-4BEGLQR46B"
});


app.get("/", function (req, res) {
    res.render("index");
});
// Multer configuration for handling file uploads
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Route to handle the POST request for image upload
app.post("/upload", upload.single("fileInput"), (req, res) => {
    // Check if the file has been received
    if (!req.file) {
        return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    // Access the uploaded file using req.file
    const uploadedImage = req.file;

    // Log information about the received file
    console.log("File received:", uploadedImage.originalname);
    console.log("File size:", uploadedImage.size, "bytes");
    console.log("MIME type:", uploadedImage.mimetype);

    //SAving the image here
    const fileName = `${Date.now()}_${uploadedImage.originalname}`;
    const filePath = path.join(__dirname, fileName);
    console.log(fileName);
    fs.writeFileSync(filePath, uploadedImage.buffer);

    // Perform OCR processing here
    // ...
    tess.recognize(fileName,"eng", {logger: e => console.log(e)})
        .then(out => {
            const ocrText = out.data.text;

            // Send the OCR text as part of the response
            return res.json({ success: true, message: "OCR processing complete", ocrText });
        })
        .catch(error => {
            // Handle OCR processing error
            console.error(error);
            return res.status(500).json({ success: false, message: "OCR processing failed" });
        });

    // Send a response back to the client
    // return res.json({ success: true, message: "OCR processing complete" });
    return ;
});


// Initialize Firebase
app.listen(4000, function () {
    console.log(`Running on port 4000`);
});
  
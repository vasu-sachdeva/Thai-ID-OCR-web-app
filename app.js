// Import the functions you need from the SDKs you need
const { initializeApp } = require("firebase/app");;
const { getDatabase, ref, set, onValue, remove} = require("firebase/database");
const express = require("express");
const app = express();
const path = require("path");
const fs = require("fs");
const tess = require("tesseract.js");
require('dotenv').config();
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));
const bodyParser = require('body-parser');
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const firebaseConfig = initializeApp({
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: "thai-id-ocr.firebaseapp.com",
    databaseURL: "https://thai-id-ocr-default-rtdb.firebaseio.com",
    projectId: "thai-id-ocr",
    storageBucket: "thai-id-ocr.appspot.com",
    messagingSenderId: "1087833116",
    appId: "1:1087833116:web:71c28b571c3199198f0bd9",
    measurementId: "G-4BEGLQR46B"
});

async function writeUserData(id, name, lastName, dateOfBirth, dateOfExpiry, dateOfIssue) {
    try{
        const db = await getDatabase();
        await set(ref(db, 'users/' + id), {
        firstName: name,
        lastName: lastName,
        dateOfBirth: dateOfBirth,
        dateOfExpiry: dateOfExpiry,
        dateOfIssue: dateOfIssue
        });
        console.log("WRITTEN TO DATABASE",id);
    }
    catch(error){
        console.log("ERROR WHILE WRITING:", error);
    }
}

app.get("/", function (req, res) {
    res.render("index", {
        name: 'Not found',
        lastName: 'Not found',
        identificationNumber: 'Not found',
        dateOfIssue: 'Not found',
        dateOfExpiry: 'Not found',
        dateOfBirth: 'Not found'
    });
});


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

    // Saving the image here
    const fileName = `${Date.now()}_${uploadedImage.originalname}`;
    const filePath = path.join(__dirname, fileName);
    console.log(fileName);
    fs.writeFileSync(filePath, uploadedImage.buffer);

    // Perform OCR processing here
    tess.recognize(fileName, "eng", { logger: e => console.log(e) })
        .then(out => {
            const ocrText = out.data.text;

            // Function to extract information based on patterns
            const extractInfo = (pattern) => {
                const regex = new RegExp(`${pattern}\\s*([^\\n]*)`, 'i');
                const match = ocrText.match(regex);
                return match ? match[1].trim() : 'Not found';
            };

            // Extracted information
            const name = extractInfo('Name');
            const lastName = extractInfo('Last name');
            const identificationNumber = extractInfo('Identification Number');
            const dateOfIssue = extractInfo('Date of issue');
            const dateOfExpiry = extractInfo('Date of expiry');
            const dateOfBirth = extractInfo('Date of Birth');

            // Log the extracted information
            writeUserData(identificationNumber, name, lastName, dateOfBirth, dateOfExpiry, dateOfIssue);
            console.log(ocrText);
            // Send the extracted information and OCR text as part of the response
            return res.render("index", {
                name,
                lastName,
                identificationNumber,
                dateOfIssue,
                dateOfExpiry,
                dateOfBirth
            });
        })
        .catch(error => {
            // Handle OCR processing error
            console.error(error);
            return res.status(500).json({ success: false, message: "OCR processing failed" });
        });
});

app.get("/get-all-users", async (req, res) => {
    try {
        const dbRef = ref(getDatabase(), 'users/');
        onValue(dbRef, async (snapshot) => {
            const data = await snapshot.val();
            console.log("data of all users:", data);
            const records = data || {}; // Use an empty object if data is null
            console.log("ACTION SUCCESSFUL");
            res.render("index2", {records: records});
        });
    }
    catch (error) {
        console.error('ERROR FETCHING USERS:', error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
});

app.delete("/delete-record/:id", async(req, res) => {
    try{
        console.log("id to be deleted:",req.params.id);
        const db = getDatabase();
        const dbRef = ref(db, 'users/'+req.params.id);
        await remove(dbRef);
        console.log("DELETE SUCCESSFUL:", req.params.id);
        res.redirect("/get-all-users");
    }
    catch(error){
        console.log("ERROR WHILE DELETING:", error);
        res.status(200).json({error: "Error while deleting"});
    }
});


const port = parseInt(process.env.PORT, 10) || 4000;
app.listen(port, function () {
  console.log(`Running on port ${port}`);
});
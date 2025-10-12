import express from "express";
import cors from "cors";
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv';
import multer from "multer"

dotenv.config();

const app= express();

import auth from "./routes/auth.js"
import profile_manager from "./routes/profile.js"

app.use(cors());
app.use(express.json());
const upload= multer();

app.use("/profile/docs", profile_manager);

app.use(express.urlencoded({ extended: true }));

app.use("/auth", auth);
app.get("/", (req, res) => {
    res.send("Hello");
})


const supabaseUrl = process.env.SUPABASE_URL 
const supabaseKey = process.env.SUPABASE_ANON_KEY 

const supabase = createClient(supabaseUrl, supabaseKey);

if(supabase){
    app.listen(process.env.PORT, () =>{
        console.log(`The backend server is at ${process.env.LOCAL_URL}.`);
    })
}
else{
    console.log("Error connecting to supabase!");
}

export default supabase;


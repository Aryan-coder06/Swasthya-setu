import express from "express";
import cors from "cors";
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv';
dotenv.config();

const app= express();

app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));

import auth from "./routes/auth.js"

app.use("/auth/", auth);


const supabaseUrl = process.env.SUPABASE_URL 
const supabaseKey = process.env.SUPABASE_KEY 

const supabase = createClient(supabaseUrl, supabaseKey);

if(supabase){
    app.listen(8000, () =>{
        console.log("The backend server is at http://localhost:8000.");
    })
}
else{
    console.log("Error connecting to supabase!");
}

export default supabase;


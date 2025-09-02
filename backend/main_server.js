import express from "express";
import cors from "cors";
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv';
dotenv.config();

const app= express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

import auth from "./routes/auth.js"

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


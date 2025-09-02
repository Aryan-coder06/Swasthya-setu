import supabase from "../main_server.js"

const signupPatient=async (req, res) => {

    try {
        const {email, password}=req.body;
        console.log(email, password);
        const result=await supabase.auth.signUp({email, password});
        
        console.log(result.data);
        res.json(result.data);

    } catch (error) {
        console.log(error);
    }
}

const signinPatient=async (req, res) => {

}

export {signinPatient, signupPatient};


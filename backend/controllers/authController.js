import supabase from "../main_server.js"

const signupPatient=async (req, res) => {

    try {
        const {email, password}=req.body;
        console.log(email, password);
        const result=await supabase.auth.signUp({email, password});

        if(result.user== null){
            return res.json({message: "User already signed up!"});
        }

        console.log(result.data);
        res.json({
            message: "Signup Successful",
            user: {
                id: result.user.id,
                email: result.user.email,
                phone: result.user.phone
            },
            session: {
                access_token: result.session.access_token,
                expires_in: result.session.expires_in,
                refresh_token: result.session.refresh_token
            }
        });

    } catch (error) {
        console.log(error);
    }
}

const signinPatient=async (req, res) => {

}

export {signinPatient, signupPatient};


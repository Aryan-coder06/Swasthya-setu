import supabase from "../main_server.js"

const signupPatient=async (req, res) => {

    try {
        const {email, password}=req.body;
        console.log(email, password);
        const {data, error}=await supabase.auth.signUp({email, password});

        if(error){
            console.log(error);
            return res.json({status: error.status, code: error.code, reason: error.reason || "none"});
        }

        res.json({
            message: "Signup Successful",
            user: {
                id: data.user.id,
                email: data.user.email,
                phone: data.user.phone
            },
            session: {
                access_token: data.session.access_token,
                expires_in: data.session.expires_in,
                refresh_token: data.session.refresh_token
            }
        });

    } catch (error) {
        console.log(error);
    }
}

const signinPatient=async (req, res) => {

}

export {signinPatient, signupPatient};


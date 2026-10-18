const HandleUnauthorized = (result, logoutUser, navigate) => {

    if (["Unauthorized, Token Not Get", "Unauthorized, Token does not match", "Token expired, please log in again", "Invalid token, please log in again"].includes(result.message)) {
        console.log("Unauthorized. Redirecting to Signin...");
        logoutUser();
        navigate("/Signin");
        return false;

    }
    return false;
};

export default HandleUnauthorized;
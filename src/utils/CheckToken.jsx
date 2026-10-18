const CheckToken = (token, logoutUser, navigate) => {
    if (!token) {
        if (typeof logoutUser === 'function') logoutUser();
        if (typeof navigate === 'function') navigate("/Signin");
        return false;
    }
    return true;
};

export default CheckToken;
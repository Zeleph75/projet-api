import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { exchangeToken } from "../utils/auth";

const Callback = () => {
    const navigate = useNavigate();
    const setToken = useAuthStore((state) => state.setToken);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");

        if (code) {
            exchangeToken(code).then((data) => {
                if (data.access_token) {
                    setToken(data.access_token);
                    navigate("/dashboard");
                }
            });
        }
    }, [navigate, setToken]);

    return <div className="text-center mt-10">Connexion en cours...</div>;
};

export default Callback;

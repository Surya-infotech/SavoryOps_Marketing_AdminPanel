import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../../Context/LanguageContext";

const PageNotFound = () => {
    const navigate = useNavigate();
    const { translations } = useLanguage();

    useEffect(() => {
        if (translations.pagenotfound) document.title = translations.pagenotfound;
    }, [translations]);

    return (
        <div style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#0f172a",
            color: "#fff",
            fontFamily: "'Poppins', sans-serif",
            textAlign: "center",
            padding: "20px"
        }}>
            <div style={{
                background: "rgba(255, 255, 255, 0.05)",
                padding: "40px",
                borderRadius: "16px",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                maxWidth: "460px",
                width: "100%"
            }}>
                <h1 style={{ fontSize: "64px", fontWeight: "800", color: "var(--primary-color, #028802)", margin: 0 }}>
                    404
                </h1>
                <h2 style={{ fontSize: "20px", fontWeight: "600", margin: "16px 0 8px" }}>
                    {translations.pagenotfound}
                </h2>
                <p style={{ color: "#94a3b8", fontSize: "14px", marginBottom: "24px" }}>
                    {translations.pagenotfoundmessage}
                </p>
                <button
                    onClick={() => navigate("/Home/Dashboard")}
                    style={{
                        padding: "10px 24px",
                        backgroundColor: "var(--primary-color, #028802)",
                        color: "#fff",
                        border: "none",
                        borderRadius: "8px",
                        fontWeight: "600",
                        cursor: "pointer"
                    }}
                >
                    {translations.backtodashboard}
                </button>
            </div>
        </div>
    );
};

export default PageNotFound;

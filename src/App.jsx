import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/Login.jsx";
import SignPage from "./pages/Signup.jsx"
import TestPage from "./pages/Test.jsx"; // Crée cette page pour tester la redirection
import "bootstrap/dist/css/bootstrap.min.css";


function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<LoginPage />} />
                <Route path="/signup" element={<SignPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/test" element={<TestPage />} />
            </Routes>
        </Router>
    );
}

export default App;

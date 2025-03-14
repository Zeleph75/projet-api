import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/Login";
import SignPage from "./pages/Signup";
import TestPage from "./pages/Test"; // Page de test
import Callback from "./pages/Callback";
import "bootstrap/dist/css/bootstrap.min.css";

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<LoginPage />} />
                <Route path="/signup" element={<SignPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/callback" element={<Callback />} />
                <Route path="/test" element={<TestPage />} />
            </Routes>
        </Router>
    );
}

export default App;

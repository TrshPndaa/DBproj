import React from "react";
import {BrowserRouter as Router, Routes, Route} from 'react-router-dom'
import LoginPage from "./pages/LoginPage";
import AdminDashboard from "./pages/components/AdminPage";

function App(){
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage/>}/>
        <Route path="/admin/dashboard" element={<AdminDashboard/>}/>
      </Routes>
    </Router>
  )

}

export default App;
import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Switch, Redirect, Link } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import Surveys from './components/Surveys';
import AdminPanel from './components/AdminPanel';
import logo from './logo.png'; // ודא שהלוגו נמצא בתיקייה הנכונה
import './App.css';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <div>
            <img src={logo} alt="לוגו אבטליון" className="logo" />
            <h1>מערכת הצבעות אבטליון</h1>
          </div>
          <nav>
            <Link to="/">דף הבית</Link>
            {!isLoggedIn && <Link to="/register">הרשמה</Link>}
            {!isLoggedIn && <Link to="/login">התחברות</Link>}
            {isLoggedIn && <Link to="/surveys">סקרים</Link>}
            {isAdmin && <Link to="/admin">פאנל ניהול</Link>}
            {isLoggedIn && <button onClick={() => setIsLoggedIn(false)}>התנתק</button>}
          </nav>
        </header>
        <main>
          <Switch>
            <Route exact path="/">
              <div className="welcome-message">
                <h2>ברוכים הבאים למערכת ההצבעות אסיפת חברים אבטליון</h2>
                <p>כאן תוכלו להשתתף בסקרים ולהביע את דעתכם בנושאים חשובים לקהילה שלנו.</p>
                {!isLoggedIn && (
                  <div>
                    <Link to="/register" className="btn">הרשמה</Link>
                    <Link to="/login" className="btn">התחברות</Link>
                  </div>
                )}
              </div>
            </Route>
            <Route path="/login">
              <Login setIsLoggedIn={setIsLoggedIn} setIsAdmin={setIsAdmin} />
            </Route>
            <Route path="/register" component={Register} />
            <Route path="/surveys">
              {isLoggedIn ? <Surveys /> : <Redirect to="/login" />}
            </Route>
            <Route path="/admin">
              {isLoggedIn && isAdmin ? <AdminPanel /> : <Redirect to="/" />}
            </Route>
          </Switch>
        </main>
        <footer>
          <p>© 2024 מערכת הצבעות אבטליון. כל הזכויות שמורות.</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;
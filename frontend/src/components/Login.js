import React, { useState } from 'react';
import axios from 'axios';
import { useHistory } from 'react-router-dom';

function Login({ setIsLoggedIn, setIsAdmin }) {
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const history = useHistory();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5000/login', { id, password });
      localStorage.setItem('token', response.data.token);
      setIsLoggedIn(true);
      setIsAdmin(response.data.is_admin);
      history.push('/surveys');
    } catch (error) {
      setError('פרטי התחברות שגויים');
    }
  };

  return (
    <div className="card">
      <h2>התחברות</h2>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={id}
          onChange={(e) => setId(e.target.value)}
          placeholder="תעודת זהות"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="סיסמה"
          required
        />
        <button type="submit" className="btn">התחבר</button>
      </form>
    </div>
  );
}

export default Login;
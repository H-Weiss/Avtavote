import React, { useState } from 'react';
import axios from 'axios';

function CreateUser() {
  const [userData, setUserData] = useState({
    id: '',
    first_name: '',
    last_name: '',
    email: ''
  });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserData(prevState => ({
      ...prevState,
      [name]: value
    }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prevErrors => ({ ...prevErrors, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (userData.id.length !== 9 || !/^\d+$/.test(userData.id)) {
      newErrors.id = 'תעודת זהות חייבת להכיל 9 ספרות';
    }
    if (userData.first_name.length < 2) {
      newErrors.first_name = 'שם פרטי חייב להכיל לפחות 2 תווים';
    }
    if (userData.last_name.length < 2) {
      newErrors.last_name = 'שם משפחה חייב להכיל לפחות 2 תווים';
    }
    if (!/\S+@\S+\.\S+/.test(userData.email)) {
      newErrors.email = 'כתובת אימייל לא תקינה';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    try {
      const response = await axios.post('http://localhost:5000/create_user', 
        userData,
        { headers: { Authorization: localStorage.getItem('token') } }
      );
      setMessage(response.data.message);
      setUserData({ id: '', first_name: '', last_name: '', email: '' }); // Reset form
    } catch (error) {
      if (error.response && error.response.data && error.response.data.errors) {
        setErrors(error.response.data.errors);
      } else {
        setMessage(error.response?.data?.message || 'אירעה שגיאה ביצירת המשתמש');
      }
    }
  };

  return (
    <div className="card">
      <h2>יצירת משתמש חדש</h2>
      {message && <p className="message">{message}</p>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <input
            type="text"
            name="id"
            value={userData.id}
            onChange={handleChange}
            placeholder="תעודת זהות"
            className={errors.id ? 'error' : ''}
            required
          />
          {errors.id && <span className="error-message">{errors.id}</span>}
        </div>
        <div className="form-group">
          <input
            type="text"
            name="first_name"
            value={userData.first_name}
            onChange={handleChange}
            placeholder="שם פרטי"
            className={errors.first_name ? 'error' : ''}
            required
          />
          {errors.first_name && <span className="error-message">{errors.first_name}</span>}
        </div>
        <div className="form-group">
          <input
            type="text"
            name="last_name"
            value={userData.last_name}
            onChange={handleChange}
            placeholder="שם משפחה"
            className={errors.last_name ? 'error' : ''}
            required
          />
          {errors.last_name && <span className="error-message">{errors.last_name}</span>}
        </div>
        <div className="form-group">
          <input
            type="email"
            name="email"
            value={userData.email}
            onChange={handleChange}
            placeholder="כתובת אימייל"
            className={errors.email ? 'error' : ''}
            required
          />
          {errors.email && <span className="error-message">{errors.email}</span>}
        </div>
        <button type="submit" className="btn">צור משתמש</button>
      </form>
    </div>
  );
}

export default CreateUser;
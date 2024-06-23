import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CreateUser from './CreateUser';

function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [surveys, setSurveys] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [editingSurvey, setEditingSurvey] = useState(null);
  const [message, setMessage] = useState('');
  const [showNewSurveyForm, setShowNewSurveyForm] = useState(false);
  const [newSurvey, setNewSurvey] = useState({ title: '', description: '', options: ['', ''] });

  useEffect(() => {
    fetchUsers();
    fetchSurveys();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get('http://localhost:5000/users', {
        headers: { Authorization: localStorage.getItem('token') }
      });
      setUsers(response.data);
    } catch (error) {
      setMessage('Failed to fetch users');
    }
  };

  const fetchSurveys = async () => {
    try {
      const response = await axios.get('http://localhost:5000/results', {
        headers: { Authorization: localStorage.getItem('token') }
      });
      setSurveys(response.data);
    } catch (error) {
      setMessage('Failed to fetch surveys');
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`http://localhost:5000/user/${editingUser.id}`, editingUser, {
        headers: { Authorization: localStorage.getItem('token') }
      });
      setMessage('User updated successfully');
      setEditingUser(null);
      fetchUsers();
    } catch (error) {
      setMessage('Failed to update user');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await axios.delete(`http://localhost:5000/user/${userId}`, {
          headers: { Authorization: localStorage.getItem('token') }
        });
        setMessage('User deleted successfully');
        fetchUsers();
      } catch (error) {
        setMessage('Failed to delete user');
      }
    }
  };

  const handleCreateSurvey = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/survey', newSurvey, {
        headers: { Authorization: localStorage.getItem('token') }
      });
      setMessage('Survey created successfully');
      setNewSurvey({ title: '', description: '', options: ['', ''] });
      setShowNewSurveyForm(false);
      fetchSurveys();
    } catch (error) {
      setMessage('Failed to create survey');
    }
  };

  const handleUpdateSurvey = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`http://localhost:5000/survey/${editingSurvey.id}`, editingSurvey, {
        headers: { Authorization: localStorage.getItem('token') }
      });
      setMessage('Survey updated successfully');
      setEditingSurvey(null);
      fetchSurveys();
    } catch (error) {
      setMessage('Failed to update survey');
    }
  };

  const handleDeleteSurvey = async (surveyId) => {
    if (window.confirm('Are you sure you want to delete this survey?')) {
      try {
        await axios.delete(`http://localhost:5000/survey/${surveyId}`, {
          headers: { Authorization: localStorage.getItem('token') }
        });
        setMessage('Survey deleted successfully');
        fetchSurveys();
      } catch (error) {
        setMessage('Failed to delete survey');
      }
    }
  };

  const handleToggleSurveyLock = async (surveyId, isLocked) => {
    try {
      await axios.put(`http://localhost:5000/survey/${surveyId}/lock`, { is_locked: !isLocked }, {
        headers: { Authorization: localStorage.getItem('token') }
      });
      setMessage(`Survey ${isLocked ? 'unlocked' : 'locked'} successfully`);
      fetchSurveys();
    } catch (error) {
      setMessage('Failed to toggle survey lock');
    }
  };

  return (
    <div className="admin-panel">
      <h2>פאנל ניהול</h2>
      {message && <div className="message">{message}</div>}
      
      <h3>ניהול סקרים</h3>
      <button className="btn" onClick={() => setShowNewSurveyForm(!showNewSurveyForm)}>
        {showNewSurveyForm ? 'בטל יצירת סקר חדש' : 'צור סקר חדש'}
      </button>

      {showNewSurveyForm && (
        <div className="new-survey-form">
          <h3>יצירת סקר חדש</h3>
          <form onSubmit={handleCreateSurvey}>
            <input
              type="text"
              value={newSurvey.title}
              onChange={(e) => setNewSurvey({...newSurvey, title: e.target.value})}
              placeholder="כותרת הסקר"
              required
            />
            <textarea
              value={newSurvey.description}
              onChange={(e) => setNewSurvey({...newSurvey, description: e.target.value})}
              placeholder="תיאור הסקר"
              required
            />
            {newSurvey.options.map((option, index) => (
              <input
                key={index}
                type="text"
                value={option}
                onChange={(e) => {
                  const newOptions = [...newSurvey.options];
                  newOptions[index] = e.target.value;
                  setNewSurvey({...newSurvey, options: newOptions});
                }}
                placeholder={`אפשרות ${index + 1}`}
                required
              />
            ))}
            <button type="button" className="btn btn-secondary" onClick={() => setNewSurvey({...newSurvey, options: [...newSurvey.options, '']})}>
              הוסף אפשרות
            </button>
            <button type="submit" className="btn">צור סקר</button>
          </form>
        </div>
      )}

      <div className="surveys-list">
        {surveys.map(survey => (
          <div key={survey.id} className="survey-item">
            <h4>{survey.title}</h4>
            <p>{survey.description}</p>
            <p>סך הכל הצבעות: {survey.total_votes}</p>
            <ul>
              {survey.options.map(option => (
                <li key={option.id}>
                  {option.text}: {option.votes} קולות 
                  ({survey.total_votes > 0 ? ((option.votes / survey.total_votes) * 100).toFixed(2) : 0}%)
                </li>
              ))}
            </ul>
            <div className="survey-actions">
              <button className="btn btn-secondary" onClick={() => setEditingSurvey(survey)}>ערוך</button>
              <button className="btn btn-danger" onClick={() => handleDeleteSurvey(survey.id)}>מחק</button>
              <button className="btn" onClick={() => handleToggleSurveyLock(survey.id, survey.is_locked)}>
                {survey.is_locked ? 'פתח להצבעות' : 'נעל להצבעות'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {editingSurvey && (
        <div className="edit-survey-form">
          <h3>עריכת סקר</h3>
          <form onSubmit={handleUpdateSurvey}>
            <input
              type="text"
              value={editingSurvey.title}
              onChange={(e) => setEditingSurvey({...editingSurvey, title: e.target.value})}
              placeholder="כותרת הסקר"
              required
            />
            <textarea
              value={editingSurvey.description}
              onChange={(e) => setEditingSurvey({...editingSurvey, description: e.target.value})}
              placeholder="תיאור הסקר"
              required
            />
            {editingSurvey.options.map((option, index) => (
              <input
                key={index}
                type="text"
                value={option.text}
                onChange={(e) => {
                  const newOptions = [...editingSurvey.options];
                  newOptions[index] = {...newOptions[index], text: e.target.value};
                  setEditingSurvey({...editingSurvey, options: newOptions});
                }}
                placeholder={`אפשרות ${index + 1}`}
                required
              />
            ))}
            <button type="submit" className="btn">עדכן סקר</button>
            <button type="button" className="btn btn-secondary" onClick={() => setEditingSurvey(null)}>ביטול</button>
          </form>
        </div>
      )}

      <h3>ניהול משתמשים</h3>
      <CreateUser onUserCreated={fetchUsers} />

      <table className="user-table">
        <thead>
          <tr>
            <th>תעודת זהות</th>
            <th>שם פרטי</th>
            <th>שם משפחה</th>
            <th>אימייל</th>
            <th>מנהל</th>
            <th>פעולות</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id}>
              <td>{user.id}</td>
              <td>{user.first_name}</td>
              <td>{user.last_name}</td>
              <td>{user.email}</td>
              <td>{user.is_admin ? 'כן' : 'לא'}</td>
              <td>
                <button className="btn btn-secondary" onClick={() => setEditingUser(user)}>ערוך</button>
                <button className="btn btn-danger" onClick={() => handleDeleteUser(user.id)}>מחק</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {editingUser && (
        <div className="edit-user-form">
          <h3>עריכת משתמש</h3>
          <form onSubmit={handleUpdateUser}>
            <input
              type="text"
              value={editingUser.first_name}
              onChange={(e) => setEditingUser({...editingUser, first_name: e.target.value})}
              placeholder="שם פרטי"
            />
            <input
              type="text"
              value={editingUser.last_name}
              onChange={(e) => setEditingUser({...editingUser, last_name: e.target.value})}
              placeholder="שם משפחה"
            />
            <input
              type="email"
              value={editingUser.email}
              onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
              placeholder="אימייל"
            />
            <label>
              <input
                type="checkbox"
                checked={editingUser.is_admin}
                onChange={(e) => setEditingUser({...editingUser, is_admin: e.target.checked})}
              />
              מנהל
            </label>
            <button type="submit" className="btn">עדכן משתמש</button>
            <button type="button" className="btn btn-secondary" onClick={() => setEditingUser(null)}>ביטול</button>
          </form>
        </div>
      )}
    </div>
  );
}

export default AdminPanel;
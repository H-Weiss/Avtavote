import React, { useState, useEffect } from 'react';
import axios from 'axios';

function AdminPanel() {
  const [surveys, setSurveys] = useState([]);
  const [newSurvey, setNewSurvey] = useState({ title: '', description: '', options: ['', ''] });
  const [editingSurvey, setEditingSurvey] = useState(null);
  const [message, setMessage] = useState('');
  const [showNewSurveyForm, setShowNewSurveyForm] = useState(false);

  useEffect(() => {
    fetchSurveys();
  }, []);

  const fetchSurveys = async () => {
    try {
      const response = await axios.get('http://localhost:5000/results', {
        headers: { Authorization: localStorage.getItem('token') }
      });
      setSurveys(response.data);
    } catch (error) {
      console.error('Failed to fetch survey results:', error);
      setMessage('אירעה שגיאה בטעינת תוצאות הסקרים');
    }
  };

  const handleCreateSurvey = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/survey', newSurvey, {
        headers: { Authorization: localStorage.getItem('token') }
      });
      setMessage('הסקר נוצר בהצלחה!');
      setNewSurvey({ title: '', description: '', options: ['', ''] });
      setShowNewSurveyForm(false);
      fetchSurveys();
    } catch (error) {
      setMessage('אירעה שגיאה ביצירת הסקר. אנא נסה שנית.');
    }
  };

  const handleUpdateSurvey = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`http://localhost:5000/survey/${editingSurvey.id}`, editingSurvey, {
        headers: { Authorization: localStorage.getItem('token') }
      });
      setMessage('הסקר עודכן בהצלחה!');
      setEditingSurvey(null);
      fetchSurveys();
    } catch (error) {
      setMessage('אירעה שגיאה בעדכון הסקר. אנא נסה שנית.');
    }
  };

  const handleDeleteSurvey = async (surveyId) => {
    if (window.confirm('האם אתה בטוח שברצונך למחוק סקר זה?')) {
      try {
        await axios.delete(`http://localhost:5000/survey/${surveyId}`, {
          headers: { Authorization: localStorage.getItem('token') }
        });
        setMessage('הסקר נמחק בהצלחה!');
        fetchSurveys();
      } catch (error) {
        setMessage('אירעה שגיאה במחיקת הסקר. אנא נסה שנית.');
      }
    }
  };

  const handleToggleSurveyLock = async (surveyId, isLocked) => {
    try {
      await axios.put(`http://localhost:5000/survey/${surveyId}/lock`, { is_locked: !isLocked }, {
        headers: { Authorization: localStorage.getItem('token') }
      });
      setMessage(`הסקר ${isLocked ? 'נפתח' : 'ננעל'} בהצלחה!`);
      fetchSurveys();
    } catch (error) {
      setMessage(`אירעה שגיאה ב${isLocked ? 'פתיחת' : 'נעילת'} הסקר. אנא נסה שנית.`);
    }
  };

  const handleExportResults = async () => {
    try {
      const response = await axios.get('http://localhost:5000/export', {
        headers: { Authorization: localStorage.getItem('token') }
      });
      // כאן תוכל להוסיף לוגיקה לייצוא הנתונים, למשל להורדת קובץ CSV
      console.log(response.data);
      setMessage('תוצאות הסקרים יוצאו בהצלחה!');
    } catch (error) {
      setMessage('אירעה שגיאה בייצוא התוצאות. אנא נסה שנית.');
    }
  };

  return (
    <div className="admin-panel">
      <h2>פאנל ניהול</h2>
      {message && <div className="message">{message}</div>}
      
      <button onClick={() => setShowNewSurveyForm(!showNewSurveyForm)} className="btn">
        {showNewSurveyForm ? 'בטל יצירת סקר חדש' : 'צור סקר חדש'}
      </button>

      {showNewSurveyForm && (
        <div className="card">
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

      <div className="card">
        <h3>סקרים קיימים ותוצאות</h3>
        {surveys.map(survey => (
          <div key={survey.id} className="survey-results">
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
              <button onClick={() => setEditingSurvey(survey)} className="btn btn-secondary">ערוך</button>
              <button onClick={() => handleDeleteSurvey(survey.id)} className="btn btn-danger">מחק</button>
              <button onClick={() => handleToggleSurveyLock(survey.id, survey.is_locked)} className="btn">
                {survey.is_locked ? 'פתח להצבעות' : 'נעל להצבעות'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {editingSurvey && (
        <div className="card">
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

      <div className="btn-group">
        <button onClick={handleExportResults} className="btn">ייצא תוצאות</button>
      </div>
    </div>
  );
}

export default AdminPanel;
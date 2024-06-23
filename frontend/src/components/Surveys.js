import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Surveys() {
  const [surveys, setSurveys] = useState([]);
  const [userVotes, setUserVotes] = useState({});
  const [message, setMessage] = useState('');
  const [selectedOptions, setSelectedOptions] = useState({});

  useEffect(() => {
    fetchSurveys();
    fetchUserVotes();
  }, []);

  const fetchSurveys = async () => {
    try {
      const response = await axios.get('http://localhost:5000/surveys', {
        headers: { Authorization: localStorage.getItem('token') }
      });
      setSurveys(response.data);
    } catch (error) {
      console.error('Failed to fetch surveys:', error);
      setMessage('אירעה שגיאה בטעינת הסקרים');
    }
  };

  const fetchUserVotes = async () => {
    try {
      const response = await axios.get('http://localhost:5000/user-votes', {
        headers: { Authorization: localStorage.getItem('token') }
      });
      setUserVotes(response.data);
    } catch (error) {
      console.error('Failed to fetch user votes:', error);
    }
  };

  const handleOptionSelect = (surveyId, optionId) => {
    setSelectedOptions(prev => ({...prev, [surveyId]: optionId}));
  };

  const handleVote = async (surveyId) => {
    if (!selectedOptions[surveyId]) {
      setMessage('אנא בחר אפשרות לפני ההצבעה');
      return;
    }

    if (window.confirm('האם אתה בטוח? ניתן להצביע רק פעם אחת!')) {
      try {
        await axios.post('http://localhost:5000/vote', 
          { survey_id: surveyId, option_id: selectedOptions[surveyId] },
          { headers: { Authorization: localStorage.getItem('token') } }
        );
        setMessage('הצבעתך נקלטה בהצלחה!');
        setUserVotes({...userVotes, [surveyId]: true});
        // ניקוי הבחירה לאחר ההצבעה
        setSelectedOptions(prev => {
          const newSelected = {...prev};
          delete newSelected[surveyId];
          return newSelected;
        });
      } catch (error) {
        setMessage('אירעה שגיאה בעת ההצבעה. אנא נסה שנית.');
      }
    }
  };

  return (
    <div>
      <h2>סקרים זמינים</h2>
      {message && <div className="message">{message}</div>}
      {surveys.map(survey => (
        <div key={survey.id} className="survey-item">
          <h3>{survey.title}</h3>
          <p>{survey.description}</p>
          {userVotes[survey.id] ? (
            <div className="message">הצבעת כבר בסקר זה</div>
          ) : survey.is_locked ? (
            <div className="message">סקר זה נעול ואינו מקבל הצבעות</div>
          ) : (
            <div className="survey-options">
              {survey.options.map(option => (
                <div key={option.id} className="survey-option">
                  <input
                    type="radio"
                    id={`option-${option.id}`}
                    name={`survey-${survey.id}`}
                    checked={selectedOptions[survey.id] === option.id}
                    onChange={() => handleOptionSelect(survey.id, option.id)}
                  />
                  <label htmlFor={`option-${option.id}`}>{option.text}</label>
                </div>
              ))}
              <button 
                className="btn"
                onClick={() => handleVote(survey.id)}
                disabled={!selectedOptions[survey.id]}
              >
                שלח הצבעה
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default Surveys;
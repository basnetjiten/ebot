import { useState } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './App.css';

// Define types based on the server's expected types
interface ReflectionFormData {
  userId: string;
  type: 'morning' | 'evening';
  content: string;
  userGoals?: string[];
}

function App() {
  const [formData, setFormData] = useState<ReflectionFormData>({
    userId: 'user1', // Default user ID for demo purposes
    type: 'morning',
    content: '',
    userGoals: []
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<{ content: string; analysis: { summary: string; feedback: string; } } | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'userGoals' ? [value] : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await axios.post('http://localhost:3000/api/reflections', formData);
      console.log('FINAL RESULT', response.data.data);
      setSubmissionResult(response.data.data);
      setNotification({ type: 'success', message: 'Reflection submitted successfully!' });
      // Clear the form
      setFormData(prev => ({
        ...prev,
        content: ''
      }));
      // Clear notification after 3 seconds
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      console.error('Error submitting reflection:', error);
      setNotification({
        type: 'error',
        message: error instanceof Error ? error.message : 'An error occurred while submitting your reflection.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="app">
      <div className="container">
        <header className="header">
          <h1>Daily Reflection</h1>
          <span className={`icon ${formData.type}`}>
            {formData.type === 'morning' ? '☀️' : '🌙'}
          </span>
        </header>

        {notification && (
          <div className={`notification ${notification.type}`}>
            {notification.message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="reflection-form">
          <div className="form-group">
            <label htmlFor="type">Reflection Type</label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              className="form-control"
            >
              <option value="morning">Morning Reflection</option>
              <option value="evening">Evening Reflection</option>
            </select>
          </div>

          <div className="form-group">
            <label>
              {formData.type === 'morning'
                ? 'What are your thoughts and intentions for today?'
                : 'How was your day? What did you accomplish?'}
            </label>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleInputChange}
              placeholder={formData.type === 'morning'
                ? 'Share your thoughts, goals, and intentions for today...'
                : 'Reflect on your day, achievements, and things you\'re grateful for...'}
              rows={12}
              className="form-control"
              required
            />
          </div>

          <button
            type="submit"
            className="submit-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Processing...' : 'Submit Reflection'}
          </button>
        </form>

        {submissionResult && (
          <div className="result-container">
            <h3>Reflection Submitted Successfully!</h3>
            <p><strong>Your submission:</strong> {submissionResult.content}</p>
            {submissionResult.analysis && (
              <div className="analysis">
                <h4>Feedback:</h4>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{submissionResult.analysis.feedback}</ReactMarkdown>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
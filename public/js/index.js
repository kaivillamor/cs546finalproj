// Client-side JS for uploading, taking, saving quizzes + other functionality
// public/js/index.js
const searchQuizzes = async (searchTerm) => {
    try {
      const response = await axios.get(`/api/quizzes/search?term=${searchTerm}`);
      displayQuizzes(response.data);
    } catch (error) {
      console.error('Error searching quizzes:', error);
      showError('Failed to search quizzes');
    }
  };
  
  const displayQuizzes = (quizzes) => {
    const quizContainer = document.getElementById('quiz-list');
    quizContainer.innerHTML = '';
  
    quizzes.forEach(quiz => {
      const quizCard = document.createElement('div');
      quizCard.className = 'quiz-card';
      quizCard.innerHTML = `
        <h3>${quiz.title}</h3>
        <p>${quiz.description}</p>
        <div class="quiz-meta">
          <span>By: ${quiz.creator}</span>
          <span>Questions: ${quiz.questionCount}</span>
        </div>
        <div class="quiz-actions">
          <button onclick="startQuiz('${quiz._id}')" class="btn-primary">Start Quiz</button>
          <button onclick="saveForLater('${quiz._id}')" class="btn-secondary">Save for Later</button>
        </div>
      `;
      quizContainer.appendChild(quizCard);
    });
  };
  
  const startQuiz = async (quizId) => {
    try {
      const response = await axios.post(`/api/quizzes/${quizId}/start`);
      window.location.href = `/quiz/${quizId}`;
    } catch (error) {
      console.error('Error starting quiz:', error);
      showError('Failed to start quiz');
    }
  };
  
  const saveForLater = async (quizId) => {
    try {
      await axios.post(`/api/quizzes/${quizId}/save`);
      showSuccess('Quiz saved for later');
    } catch (error) {
      console.error('Error saving quiz:', error);
      showError('Failed to save quiz');
    }
  };
  
  // Error and success message handling
  const showError = (message) => {
    const alert = document.getElementById('alert');
    alert.textContent = message;
    alert.className = 'alert error';
    setTimeout(() => alert.className = 'alert hidden', 3000);
  };
  
  const showSuccess = (message) => {
    const alert = document.getElementById('alert');
    alert.textContent = message;
    alert.className = 'alert success';
    setTimeout(() => alert.className = 'alert hidden', 3000);
  };
  
  // Event listeners
  document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('quiz-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        if (searchTimeout) clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => searchQuizzes(e.target.value), 300);
      });
    }
  });
  
  let searchTimeout = null;
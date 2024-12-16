let searchTimeout = null;

function displayQuizzes(quizzes) {
    const quizzesGrid = document.getElementById('quizzes-grid');
    quizzesGrid.innerHTML = '';

    if (quizzes.length === 0) {
        const noResults = document.createElement('div');
        noResults.className = 'no-results';
        noResults.textContent = 'No quizzes found';
        quizzesGrid.appendChild(noResults);
        return;
    }

    quizzes.forEach(quiz => {
        const quizCard = document.createElement('div');
        quizCard.className = 'stat-card quiz-card';

        const quizInfo = document.createElement('div');
        quizInfo.className = 'quiz-info';

        const title = document.createElement('h3');
        title.textContent = quiz.title;
        quizInfo.appendChild(title);

        const quizStats = document.createElement('div');
        quizStats.className = 'quiz-stats';

        const questionsStat = document.createElement('div');
        questionsStat.className = 'stat';
        
        const questionsLabel = document.createElement('span');
        questionsLabel.className = 'label';
        questionsLabel.textContent = 'Questions:';
        
        const questionsValue = document.createElement('span');
        questionsValue.className = 'value';
        questionsValue.textContent = quiz.questionCount || 0;

        questionsStat.appendChild(questionsLabel);
        questionsStat.appendChild(questionsValue);

        const categoryStat = document.createElement('div');
        categoryStat.className = 'stat';
        
        const categoryLabel = document.createElement('span');
        categoryLabel.className = 'label';
        categoryLabel.textContent = 'Category:';
        
        const categoryValue = document.createElement('span');
        categoryValue.className = 'value';
        categoryValue.textContent = quiz.category || 'Uncategorized';

        categoryStat.appendChild(categoryLabel);
        categoryStat.appendChild(categoryValue);

        quizStats.appendChild(questionsStat);
        quizStats.appendChild(categoryStat);
        quizInfo.appendChild(quizStats);

        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'card-actions';

        const deleteButton = document.createElement('button');
        deleteButton.className = 'btn-danger';
        deleteButton.textContent = 'Delete Quiz';
        deleteButton.addEventListener('click', () => deleteQuiz(quiz._id));

        actionsDiv.appendChild(deleteButton);

        quizCard.appendChild(quizInfo);
        quizCard.appendChild(actionsDiv);
        quizzesGrid.appendChild(quizCard);
    });
}

async function searchQuizzes(searchTerm) {
    try {
        const response = await fetch(`/api/quizzes/search?term=${encodeURIComponent(searchTerm)}&limit=20`);
        if (!response.ok) throw new Error('Search failed');
        
        const quizzes = await response.json();
        displayQuizzes(quizzes);
    } catch (error) {
        console.error('Error searching quizzes:', error);
    }
}

async function deleteQuiz(quizId) {
    if (!confirm('Are you sure you want to delete this quiz? This action cannot be undone.')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/quizzes/${quizId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('Failed to delete quiz');
        
        window.location.reload();
    } catch (error) {
        console.error('Error deleting quiz:', error);
        alert('Failed to delete quiz. Please try again.');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('quiz-search');
    
    searchInput.addEventListener('input', (e) => {
        if (searchTimeout) clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => searchQuizzes(e.target.value), 300);
    });

    searchQuizzes('');
}); 
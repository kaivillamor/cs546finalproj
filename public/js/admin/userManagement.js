let searchTimeout = null;

function displayUsers(users) {
    const usersGrid = document.getElementById('users-grid');
    usersGrid.innerHTML = '';

    if (users.length === 0) {
        const noResults = document.createElement('div');
        noResults.className = 'no-results';
        noResults.textContent = 'No users found';
        usersGrid.appendChild(noResults);
        return;
    }

    users.forEach(user => {
        const userCard = document.createElement('div');
        userCard.className = 'stat-card user-card';

        const userInfo = document.createElement('div');
        userInfo.className = 'user-info';

        const username = document.createElement('h3');
        username.textContent = user.username;
        userInfo.appendChild(username);

        const userStats = document.createElement('div');
        userStats.className = 'user-stats';

        const quizzesStat = document.createElement('div');
        quizzesStat.className = 'stat';
        
        const quizzesLabel = document.createElement('span');
        quizzesLabel.className = 'label';
        quizzesLabel.textContent = 'Quizzes Taken:';
        
        const quizzesValue = document.createElement('span');
        quizzesValue.className = 'value';
        quizzesValue.textContent = user.quizzesTaken || 0;

        quizzesStat.appendChild(quizzesLabel);
        quizzesStat.appendChild(quizzesValue);

        const scoreStat = document.createElement('div');
        scoreStat.className = 'stat';
        
        const scoreLabel = document.createElement('span');
        scoreLabel.className = 'label';
        scoreLabel.textContent = 'Average Score:';
        
        const scoreValue = document.createElement('span');
        scoreValue.className = 'value';
        scoreValue.textContent = `${user.averageScore || 0}%`;

        scoreStat.appendChild(scoreLabel);
        scoreStat.appendChild(scoreValue);

        userStats.appendChild(quizzesStat);
        userStats.appendChild(scoreStat);
        userInfo.appendChild(userStats);

        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'card-actions';

        const banButton = document.createElement('button');
        banButton.className = 'btn-danger';
        banButton.textContent = 'Ban User';
        banButton.addEventListener('click', () => banUser(user._id));

        actionsDiv.appendChild(banButton);
        userCard.appendChild(userInfo);
        userCard.appendChild(actionsDiv);
        usersGrid.appendChild(userCard);
    });
}

async function searchUsers(searchTerm) {
    try {
        const response = await fetch(`/api/users/search?term=${encodeURIComponent(searchTerm)}`);
        if (!response.ok) throw new Error('Search failed');
        
        const users = await response.json();
        displayUsers(users);
    } catch (error) {
        console.error('Error searching users:', error);
    }
}

async function banUser(userId) {
    if (!confirm('Are you sure you want to ban this user?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/users/${userId}/ban`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) throw new Error('Failed to ban user');
        
        // Refresh the user list
        searchUsers('');
    } catch (error) {
        console.error('Error banning user:', error);
        alert('Failed to ban user. Please try again.');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('user-search');
    
    searchInput.addEventListener('input', (e) => {
        if (searchTimeout) clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => searchUsers(e.target.value), 300);
    });

    // Load initial users
    searchUsers('');
}); 
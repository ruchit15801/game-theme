document.addEventListener('DOMContentLoaded', () => {
    const gameGrid = document.getElementById('game-grid');
    const recentGrid = document.getElementById('recent-grid');
    const recentSection = document.getElementById('recent-games-section');
    const searchInput = document.getElementById('game-search');
    const categoryBtns = document.querySelectorAll('.cat-btn');
    const paginationControls = document.getElementById('pagination-controls');
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');
    const pageInfo = document.getElementById('page-info');

    let currentFilter = 'all';
    let searchQuery = '';
    let currentPage = 1;
    const itemsPerPage = 12;

    // Initial Renders
    renderRecentGames();
    renderGames();

    // --- Search & Category Handlers ---
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase();
        currentPage = 1;
        renderGames();
    });

    categoryBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            categoryBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.category;
            currentPage = 1;
            renderGames();
        });
    });

    prevPageBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderGames();
            document.querySelector('.controls').scrollIntoView({ behavior: 'smooth' });
        }
    });

    nextPageBtn.addEventListener('click', () => {
        currentPage++;
        renderGames();
        document.querySelector('.controls').scrollIntoView({ behavior: 'smooth' });
    });

    // --- Core Logic ---

    function renderGames() {
        if (!window.GAMES) return;

        let filtered = window.GAMES;

        if (currentFilter === 'trending') {
            filtered = filtered.filter(game => game.isTrending);
        } else if (currentFilter !== 'all') {
            filtered = filtered.filter(game => game.category === currentFilter);
        }

        if (searchQuery) {
            filtered = filtered.filter(game => game.title.toLowerCase().includes(searchQuery));
        }

        if (filtered.length === 0) {
            gameGrid.innerHTML = '<div class="loader">No games found matching your search.</div>';
            paginationControls.style.display = 'none';
            return;
        }

        const totalPages = Math.ceil(filtered.length / itemsPerPage);
        
        if (currentPage > totalPages) currentPage = totalPages;
        
        const startIndex = (currentPage - 1) * itemsPerPage;
        const paginated = filtered.slice(startIndex, startIndex + itemsPerPage);

        gameGrid.innerHTML = paginated.map((game, index) => `
            <div class="game-card" onclick="openGameDetails('${game.id}')">
                <div class="game-thumb">
                    ${index === 0 ? '<div class="featured-crown">⭐ Featured</div>' : (game.isTrending ? '<div class="recent-badge-tag" style="background: linear-gradient(90deg, #ff8a00, #e52e71);">🔥 Trending</div>' : '')}
                    <img src="/${game.thumbnail}" alt="${game.title}" loading="lazy" decoding="async" onerror="this.src='https://placehold.co/600x400/070C1A/EEF0FF?text=${game.title.replace(/ /g, '+')}'">
                    <div class="play-badge">▶</div>
                </div>
                <div class="game-info">
                    <span class="title">${game.title}</span>
                    <span class="sub">${game.category.toUpperCase()}</span>
                </div>
            </div>
        `).join('');

        if (totalPages > 1) {
            paginationControls.style.display = 'flex';
            pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
            prevPageBtn.disabled = currentPage === 1;
            nextPageBtn.disabled = currentPage === totalPages;
        } else {
            paginationControls.style.display = 'none';
        }
    }

    function renderRecentGames() {
        const recentIds = JSON.parse(localStorage.getItem('recent_games') || '[]');
        if (recentIds.length === 0) {
            recentSection.style.display = 'none';
            return;
        }

        // Filter and get game objects, keep most recent first
        const recentGames = recentIds
            .map(id => window.GAMES.find(g => g.id === id))
            .filter(Boolean)
            .slice(0, 4); // Show top 4

        if (recentGames.length === 0) {
            recentSection.style.display = 'none';
            return;
        }

        recentSection.style.display = 'block';
        recentGrid.innerHTML = recentGames.map(game => `
            <div class="game-card" onclick="openGameDetails('${game.id}')">
                <div class="game-thumb">
                    <div class="recent-badge-tag">Recent</div>
                    <img src="/${game.thumbnail}" alt="${game.title}" loading="lazy" decoding="async" onerror="this.src='https://placehold.co/600x400/1e293b/f8fafc?text=${game.title.replace(/ /g, '+')}'">
                    <div class="play-badge">▶</div>
                </div>
                <div class="game-info">
                    <span class="title">${game.title}</span>
                    <span class="sub">${game.category.toUpperCase()}</span>
                </div>
            </div>
        `).join('');
    }

    // --- Navigation & Tracking ---
    window.openGameDetails = (gameId) => {
        const game = window.GAMES.find(g => g.id === gameId);
        if (!game) return;

        // Save to Recent (still using ID for logic)
        let recent = JSON.parse(localStorage.getItem('recent_games') || '[]');
        recent = recent.filter(id => id !== gameId); 
        recent.unshift(gameId); 
        localStorage.setItem('recent_games', JSON.stringify(recent.slice(0, 8))); 

        // Track when they left for a game to reward them upon return
        localStorage.setItem('a23_last_play_time', Date.now());

        // SEO Optimized URL (Absolute Path)
        window.location.href = `/games/${game.slug || game.id}`;
    };

    // --- Premium Coin & Playtime Reward Logic ---
    const balanceAmountEl = document.getElementById('balance-amount');
    const coinBalanceContainer = document.querySelector('.coin-balance');
    let coins = parseInt(localStorage.getItem('a23_coins')) || 5;
    
    balanceAmountEl.textContent = coins;

    function addCoins(amount) {
        coins += amount;
        localStorage.setItem('a23_coins', coins);
        
        balanceAmountEl.textContent = coins;
        
        // Pulse animation
        coinBalanceContainer.classList.remove('coin-animate');
        void coinBalanceContainer.offsetWidth; 
        coinBalanceContainer.classList.add('coin-animate');
        
        // Floating +X animation
        const floatEl = document.createElement('div');
        floatEl.className = 'coin-float';
        floatEl.textContent = `+${amount}`;
        coinBalanceContainer.appendChild(floatEl);
        
        setTimeout(() => floatEl.remove(), 1500);
    }

    // Initial load bonus if returning from a game (simulated playtime reward)
    const lastPlayed = localStorage.getItem('a23_last_play_time');
    if (lastPlayed) {
        const timeDiff = Math.floor((Date.now() - parseInt(lastPlayed)) / 1000);
        
        // Logic: Give 1 coin per 3 seconds of gameplay
        // Requirement: Must earn at least 5 coins (minimum ~15 seconds of play)
        const earned = Math.min(Math.floor(timeDiff / 3), 100); 
        
        if (earned >= 5) {
            setTimeout(() => addCoins(earned), 800);
        }
        
        localStorage.removeItem('a23_last_play_time');
    }
});

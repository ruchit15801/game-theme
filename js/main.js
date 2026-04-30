document.addEventListener('DOMContentLoaded', () => {
    const gameGrid          = document.getElementById('game-grid');
    const recentGrid        = document.getElementById('recent-grid');
    const recentSection     = document.getElementById('recent-games-section');
    const searchInput       = document.getElementById('game-search');
    const categoryBtns      = document.querySelectorAll('.cat-btn');
    const paginationControls= document.getElementById('pagination-controls');
    const prevPageBtn       = document.getElementById('prev-page');
    const nextPageBtn       = document.getElementById('next-page');
    const pageInfo          = document.getElementById('page-info');

    let currentFilter = 'all';
    let searchQuery   = '';
    let currentPage   = 1;
    const itemsPerPage = 12;

    // Build a fast lookup map by ID once
    let GAME_MAP = {};
    if (window.GAMES) {
        window.GAMES.forEach(g => { GAME_MAP[g.id] = g; });
    }

    // Initial render
    renderRecentGames();
    renderGames();

    // ── Debounced search ──
    let searchTimer = null;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => {
            searchQuery = e.target.value.toLowerCase().trim();
            currentPage = 1;
            renderGames();
        }, 180);   // 180ms debounce — fast but not janky
    });

    // ── Category filter ──
    categoryBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (btn.dataset.category === currentFilter) return; // no-op if same
            categoryBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.category;
            currentPage   = 1;
            renderGames();
        });
    });

    // ── Pagination ──
    prevPageBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderGames();
            document.querySelector('.controls').scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });

    nextPageBtn.addEventListener('click', () => {
        currentPage++;
        renderGames();
        document.querySelector('.controls').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    // ── Card HTML builder (avoids repeat string ops) ──
    const GENRE_CLASS = {
        action:'genre-action', strategy:'genre-strategy', sports:'genre-sports',
        racing:'genre-racing', puzzle:'genre-puzzle',  arcade:'genre-arcade'
    };

    function buildCard(game, index, isRecent) {
        // 100% reliable offline premium fallback if an image is missing, properly encoded to not break HTML attributes
        const svgStr = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"><rect width="400" height="400" fill="#12121A"/><text x="50%" y="50%" font-family="Bebas Neue, sans-serif" font-size="40" fill="#C9A84C" text-anchor="middle" dominant-baseline="middle">${game.title}</text></svg>`;
        const placeholder = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgStr)}`;
        const imgLoad  = index < 4 ? 'eager' : 'lazy';  // first 4 = eager (LCP boost)
        const imgDecode= index < 4 ? 'sync'  : 'async';
        const gClass   = GENRE_CLASS[game.category] || 'genre-default';
        const thumbSrc = game.thumbnail ? `./${game.thumbnail}` : placeholder;

        let badge = '';
        if (isRecent)          badge = '<div class="recent-badge-tag">⟳ Recent</div>';
        else if (index === 0)  badge = '<div class="featured-crown">★ Featured</div>';
        else if (game.isTrending) badge = '<div class="recent-badge-tag">🔥 Trending</div>';

        return `<div class="game-card" onclick="openGameDetails('${game.id}')">
            <div class="game-thumb">
                ${badge}
                <div class="genre-badge ${gClass}">${game.category}</div>
                <img src="${thumbSrc}" alt="${game.title}" width="400" height="400"
                     loading="${imgLoad}" decoding="${imgDecode}"
                     onerror="this.onerror=null; this.src='${placeholder}';">
                <div class="play-badge">▶</div>
            </div>
            <div class="game-info">
                <span class="title">${game.title}</span>
                <span class="sub">${game.category.toUpperCase()}</span>
            </div>
        </div>`;
    }

    // ── Core render (uses DocumentFragment-style single innerHTML set) ──
    function renderGames() {
        if (!window.GAMES) return;

        let filtered = window.GAMES;

        if (currentFilter === 'trending') {
            filtered = filtered.filter(g => g.isTrending);
        } else if (currentFilter !== 'all') {
            filtered = filtered.filter(g => g.category === currentFilter);
        }

        if (searchQuery) {
            filtered = filtered.filter(g => g.title.toLowerCase().includes(searchQuery));
        }

        if (filtered.length === 0) {
            gameGrid.innerHTML = '<div class="loader">No games found.</div>';
            paginationControls.style.display = 'none';
            return;
        }

        const totalPages  = Math.ceil(filtered.length / itemsPerPage);
        if (currentPage > totalPages) currentPage = totalPages;

        const start     = (currentPage - 1) * itemsPerPage;
        const paginated = filtered.slice(start, start + itemsPerPage);

        // Single innerHTML assignment — fastest DOM update
        gameGrid.innerHTML = paginated.map((game, i) => buildCard(game, i, false)).join('');

        // Pagination
        if (totalPages > 1) {
            paginationControls.style.display = 'flex';
            pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
            prevPageBtn.disabled = currentPage === 1;
            nextPageBtn.disabled = currentPage === totalPages;
        } else {
            paginationControls.style.display = 'none';
        }
    }

    // ── Recent games ──
    function renderRecentGames() {
        const recentIds = JSON.parse(localStorage.getItem('recent_games') || '[]');
        if (recentIds.length === 0) { recentSection.style.display = 'none'; return; }

        const recentGames = recentIds
            .map(id => GAME_MAP[id] || window.GAMES?.find(g => g.id === id))
            .filter(Boolean)
            .slice(0, 4);

        if (recentGames.length === 0) { recentSection.style.display = 'none'; return; }

        recentSection.style.display = 'block';
        recentGrid.innerHTML = recentGames.map((game, i) => buildCard(game, i + 10, true)).join('');
    }

    // ── Navigation ──
    window.openGameDetails = (gameId) => {
        const game = GAME_MAP[gameId] || window.GAMES?.find(g => g.id === gameId);
        if (!game) return;

        // Optimistic save to recent
        let recent = JSON.parse(localStorage.getItem('recent_games') || '[]');
        recent = recent.filter(id => id !== gameId);
        recent.unshift(gameId);
        localStorage.setItem('recent_games', JSON.stringify(recent.slice(0, 8)));
        localStorage.setItem('a23_last_play_time', Date.now());

        // Use query parameter directly so it works on simple local servers
        // Vercel rewrites handles /games/slug in prod, but local http-server doesn't by default
        window.location.href = `/game-details.html?slug=${game.slug || game.id}`;
    };

    // ── Coin system ──
    const balanceAmountEl      = document.getElementById('balance-amount');
    const coinBalanceContainer = document.querySelector('.coin-balance');
    let coins = parseInt(localStorage.getItem('a23_coins'), 10) || 5;
    balanceAmountEl.textContent = coins;

    function addCoins(amount) {
        coins += amount;
        localStorage.setItem('a23_coins', coins);
        balanceAmountEl.textContent = coins;

        coinBalanceContainer.classList.remove('coin-animate');
        void coinBalanceContainer.offsetWidth;
        coinBalanceContainer.classList.add('coin-animate');

        const floatEl = document.createElement('div');
        floatEl.className = 'coin-float';
        floatEl.textContent = `+${amount}`;
        coinBalanceContainer.appendChild(floatEl);
        setTimeout(() => floatEl.remove(), 1500);
    }

    const lastPlayed = localStorage.getItem('a23_last_play_time');
    if (lastPlayed) {
        const timeDiff = Math.floor((Date.now() - parseInt(lastPlayed, 10)) / 1000);
        const earned   = Math.min(Math.floor(timeDiff / 3), 100);
        if (earned >= 5) setTimeout(() => addCoins(earned), 800);
        localStorage.removeItem('a23_last_play_time');
    }
});

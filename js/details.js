document.addEventListener('DOMContentLoaded', () => {
    const detailsContent = document.getElementById('details-content');
    
    // 1. Get Slug from URL Path or Query Params
    const urlParams = new URLSearchParams(window.location.search);
    let slug = urlParams.get('slug');
    const gameId = urlParams.get('id');

    // If no slug in query, try to parse from the path: /games/slug-name
    if (!slug) {
        const pathParts = window.location.pathname.split('/');
        const gamesIndex = pathParts.indexOf('games');
        if (gamesIndex !== -1 && pathParts[gamesIndex + 1]) {
            slug = pathParts[gamesIndex + 1];
        }
    }

    if (!window.GAMES) {
        detailsContent.innerHTML = '<div class="loader">Metadata error. <a href="/index.html">Go back</a></div>';
        return;
    }

    // Attempt to find game by slug first, then fallback to ID
    let game;
    if (slug) {
        game = window.GAMES.find(g => g.slug === slug);
    } else if (gameId) {
        game = window.GAMES.find(g => g.id === gameId);
    }

    if (!game) {
        detailsContent.innerHTML = '<div class="loader">Game not found. <a href="/index.html">Go back to Home</a></div>';
        return;
    }

    // Dynamic Stats (Randomized for premium feel)
    const activeUsers = (Math.floor(Math.random() * 50000) + 10000).toLocaleString();

    detailsContent.innerHTML = `
        <div class="game-hero">
            <img src="/${game.thumbnail}" alt="${game.title} - Play Free Online" class="hero-thumb" onerror="this.src='https://placehold.co/600x400/1e293b/f8fafc?text=${game.title.replace(/ /g, '+')}'">
        </div>
        
        <h2 class="game-title">${game.title}</h2>
        
        <div class="stats">
            <span>👤 ${activeUsers} Active Players</span>
            <span>⭐ 4.8 Rating</span>
            <span>🏷️ ${game.category.toUpperCase()}</span>
        </div>

        <div style="margin: 2rem 0;">
            <a href="/${game.path}" class="play-btn-large">Play Now</a>
        </div>

        <div class="description-box">
            <div class="description-section">
                <h3>About ${game.title}</h3>
                <p>${game.longDescription}</p>
            </div>
            
            <div class="description-section" style="margin-top: 2rem; border-top: 1px solid var(--glass-border); padding-top: 2rem;">
                <h3>How to Play</h3>
                <p>${game.howToPlay}</p>
            </div>
        </div>
    `;
    
    // Update Page Title & SEO Meta Tags
    const fullTitle = `Play ${game.title} Online - Best Free Mobile Games | A23GAMES`;
    document.title = fullTitle;
    
    // SEO Meta Tags update
    const metaDesc = document.getElementById('meta-desc');
    if (metaDesc) metaDesc.setAttribute('content', game.longDescription.substring(0, 160));
    
    const ogTitle = document.getElementById('og-title');
    if (ogTitle) ogTitle.setAttribute('content', fullTitle);
    
    const ogDesc = document.getElementById('og-desc');
    if (ogDesc) ogDesc.setAttribute('content', game.longDescription.substring(0, 160));
    
    const ogImage = document.getElementById('og-image');
    if (ogImage) ogImage.setAttribute('content', `https://a23game.in/${game.thumbnail}`);

    const canonical = document.getElementById('canonical-url');
    const prettyUrl = `https://a23game.in/games/${game.slug || game.id}`;
    if (canonical) canonical.setAttribute('href', prettyUrl);

    // SEO Strategy: Inject JSON-LD for individual Game SEO ranking
    const schemaData = {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": game.title,
        "url": prettyUrl,
        "description": game.longDescription,
        "applicationCategory": "GameApplication",
        "operatingSystem": "Web, iOS, Android",
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD"
        },
        "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.8",
            "ratingCount": activeUsers.replace(/,/g, '')
        }
    };
    
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(schemaData);
    document.head.appendChild(script);
});

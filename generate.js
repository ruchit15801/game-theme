const fs = require('fs');
const path = require('path');

const gamesDir = path.join(__dirname, 'games');
const gamesJsPath = path.join(__dirname, 'js', 'games.js');

const defaultCategories = ['puzzle', 'action', 'arcade', 'strategy', 'racing', 'sports'];

let existingGames = [];

const dirs = fs.readdirSync(gamesDir).filter(f => fs.statSync(path.join(gamesDir, f)).isDirectory());

// Helper to recursively find all files in a dir
function getAllFiles(dirPath, arrayOfFiles) {
    let files;
    try {
        files = fs.readdirSync(dirPath);
    } catch (e) {
        return arrayOfFiles;
    }

    arrayOfFiles = arrayOfFiles || [];

    files.forEach(function(file) {
        if (fs.statSync(dirPath + "/" + file).isDirectory()) {
            arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
        } else {
            arrayOfFiles.push(path.join(dirPath, "/", file));
        }
    });

    return arrayOfFiles;
}

dirs.forEach((dir) => {
    const id = dir.replace(/ /g, '_').toLowerCase();
    const title = dir.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    const slug = dir.replace(/ /g, '-').toLowerCase() + '-game';
    
    // Find index.html
    let indexPath = `games/${dir}/index.html`;
    if (!fs.existsSync(path.join(__dirname, indexPath))) {
        if (fs.existsSync(path.join(__dirname, `games/${dir}/dist/index.html`))) {
            indexPath = `games/${dir}/dist/index.html`;
        } else if (fs.existsSync(path.join(__dirname, `games/${dir}/Deploy/index.html`))) {
            indexPath = `games/${dir}/Deploy/index.html`;
        }
    }

    // Find a thumbnail
    let finalThumb = `assets/thumbs/${id}.png`; // absolute fallback

    // Get all files in this game's directory
    const allGameFiles = getAllFiles(path.join(gamesDir, dir), []);
    
    // Check if an explicit high-quality thumbnail exists in assets/thumbs first
    if (fs.existsSync(path.join(__dirname, `assets/thumbs/${id}.png`))) {
        finalThumb = `assets/thumbs/${id}.png`;
    } else if (fs.existsSync(path.join(__dirname, `assets/thumbs/${dir}.png`))) {
        finalThumb = `assets/thumbs/${dir}.png`;
    } else {
        // Filter for images
        const imageFiles = allGameFiles.filter(f => {
            const ext = path.extname(f).toLowerCase();
            return ['.png', '.jpg', '.jpeg', '.svg', '.webp', '.gif'].includes(ext);
        });

        if (imageFiles.length > 0) {
            // Score images to find the best one
            let bestImage = imageFiles[0];
            let bestScore = -999;

        imageFiles.forEach(img => {
            let score = 0;
            const lowerImg = img.toLowerCase();
            
            // Priorities based on naming
            if (lowerImg.includes('icon')) score += 20;
            if (lowerImg.includes('thumb')) score += 20;
            if (lowerImg.includes('cover')) score += 15;
            if (lowerImg.includes('logo')) score += 10;
            if (lowerImg.includes('256')) score += 5;
            if (lowerImg.includes('512')) score += 5;
            
            // Prefer PNG or SVG for icons usually
            if (lowerImg.endsWith('.png') || lowerImg.endsWith('.svg')) score += 2;
            
            // Penalize background/spritesheet type images
            if (lowerImg.includes('bg') || lowerImg.includes('background')) score -= 20;
            if (lowerImg.includes('sprite')) score -= 20;
            if (lowerImg.includes('button')) score -= 10;
            if (lowerImg.includes('ui')) score -= 10;
            if (lowerImg.includes('character')) score -= 5;
            if (lowerImg.includes('particle')) score -= 15;
            if (lowerImg.includes('shadow')) score -= 15;

            if (score > bestScore) {
                bestScore = score;
                bestImage = img;
            }
        });

        // Convert absolute path to relative path for the web
        const relativePath = path.relative(__dirname, bestImage).replace(/\\/g, '/');
        finalThumb = relativePath;
        }
    }

    const category = defaultCategories[Math.floor(Math.random() * defaultCategories.length)];

    existingGames.push({
        id: id,
        slug: slug,
        title: title,
        category: category,
        creator: "A23 Games",
        path: indexPath,
        thumbnail: finalThumb,
        description: `Play ${title} online for free!`,
        longDescription: `Experience the thrill of ${title}. Complete challenges, achieve high scores, and enjoy this engaging ${category} game.`,
        howToPlay: "Follow the on-screen instructions to play. Use your mouse or touch controls to interact."
    });
});

let trendingCount = 0;
existingGames.forEach((g, index) => {
    if (index % 11 === 0 && trendingCount < 10) {
        g.isTrending = true;
        trendingCount++;
    } else {
        g.isTrending = false;
    }
});

if (trendingCount === 0 && existingGames.length > 0) {
    existingGames[0].isTrending = true;
}

const newContent = `window.GAMES = ${JSON.stringify(existingGames, null, 4)};`;
fs.writeFileSync(gamesJsPath, newContent);
console.log("Re-generated games.js with " + existingGames.length + " games. Thumbnails scanned recursively.");

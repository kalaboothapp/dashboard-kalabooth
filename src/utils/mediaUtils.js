/**
 * Detects the type of music link and returns an embeddable URL.
 * Supports: YouTube, Spotify
 * 
 * @param {string} url - The raw URL input
 * @returns {object|null} - { type: 'youtube'|'spotify', src: string } or null
 */
export const getEmbedData = (url) => {
    if (!url) return null;

    // YOUTUBE
    // Regex for: youtube.com/watch?v=ID, youtube.com/embed/ID, youtu.be/ID
    const ytRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
    const ytMatch = url.match(ytRegex);
    if (ytMatch && ytMatch[1]) {
        return {
            type: 'youtube',
            // autoplay=1 (muted usually needed for chrome), controls=0 (minimal), loop=1
            src: `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&controls=1&loop=1&playlist=${ytMatch[1]}`
        };
    }

    // SPOTIFY
    // Regex for: open.spotify.com/track/ID, open.spotify.com/playlist/ID
    const spRegex = /open\.spotify\.com\/(track|playlist|album)\/([a-zA-Z0-9]+)/i;
    const spMatch = url.match(spRegex);
    if (spMatch && spMatch[2]) {
        return {
            type: 'spotify',
            // Spotify embed URL
            src: `https://open.spotify.com/embed/${spMatch[1]}/${spMatch[2]}?utm_source=generator`
        };
    }

    return null; // Not supported or invalid
};

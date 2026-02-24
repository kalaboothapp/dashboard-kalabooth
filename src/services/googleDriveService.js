
// TODO: REPLACE THIS URL WITH YOUR DEPLOYED GOOGLE APPS SCRIPT WEB APP URL
// Example: https://script.google.com/macros/s/AKfycbx.../exec
const GOOGLE_SCRIPT_URL = import.meta.env.VITE_GOOGLE_SCRIPT_URL || '';

export const uploadAndSendEmail = async (imageBase64, email, isWinner = false) => {
    if (!GOOGLE_SCRIPT_URL) {
        return { success: false, message: "System configuration error: Backend URL missing." };
    }

    try {
        const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");

        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain',
            },
            body: JSON.stringify({
                image: cleanBase64,
                email: email,
                isWinner: isWinner
            })
        });

        const data = await response.json();

        if (data.status === 'success') {
            return { success: true, url: data.url, message: "Email sent successfully!" };
        } else {
            return { success: false, message: data.message || "Unknown error from backend." };
        }

    } catch (error) {
        return { success: false, message: `Failed to connect: ${error.message}` };
    }
};

export const blobToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

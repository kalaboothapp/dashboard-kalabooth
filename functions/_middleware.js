export async function onRequest(context) {
    // Biarkan traffic normal website berjalan seperti biasa
    return await context.next();
}

export async function scheduled(event, env, ctx) {
    console.log("Running Supabase keepalive cron...");
    
    // Cloudflare Pages exposes environment variables via the 'env' object
    const supabaseUrl = env.VITE_SUPABASE_URL;
    const supabaseKey = env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error("Missing Supabase credentials in Cloudflare environment variables.");
        return;
    }

    try {
        // Lakukan request REST API sederhana ke Supabase
        const res = await fetch(`${supabaseUrl}/rest/v1/config?select=id&limit=1`, {
            method: 'GET',
            headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json'
            }
        });

        if (res.ok) {
            console.log("Supabase successfully pinged.");
        } else {
            console.error("Supabase ping failed with status:", res.status);
        }
    } catch (error) {
        console.error("Error pinging Supabase:", error);
    }
}

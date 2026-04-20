import { supabase } from '../lib/supabase';

/**
 * Fetches the gallery session history from Supabase.
 * 
 * @returns {Promise<Array>} - List of sessions
 */
export const getSessions = async () => {
    const { data, error } = await supabase
        .from('gallery_sessions')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching sessions:", error);
        throw error;
    }
    return data;
};

/**
 * Deletes a session record by ID.
 * 
 * @param {string} id - The database UUID of the session
 */
export const deleteSession = async (id) => {
    const { error } = await supabase
        .from('gallery_sessions')
        .delete()
        .eq('id', id);

    if (error) {
        console.error("Error deleting session:", error);
        throw error;
    }
    return true;
};

import { supabase } from '../lib/supabase';

// Fetch all letters
export const getLetters = async () => {
    const { data, error } = await supabase
        .from('letters')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
};

// Create a new letter
export const createLetter = async (letterData) => {
    const { data, error } = await supabase
        .from('letters')
        .insert([{
            title: letterData.title,
            content: letterData.content,
            is_active: letterData.is_active,
            allowed_emails: letterData.allowed_emails
        }])
        .select()
        .single();

    if (error) throw error;
    return data;
};

// Update a letter
export const updateLetter = async (id, updates) => {
    const { data, error } = await supabase
        .from('letters')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
};

// Delete a letter
export const deleteLetter = async (id) => {
    const { error } = await supabase
        .from('letters')
        .delete()
        .eq('id', id);

    if (error) throw error;
    return true;
};

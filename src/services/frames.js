import { supabase } from '../lib/supabase';

// Normalize layout_config to canonical format: { a: [], b: [], images: {} }
const normalizeLayoutConfig = (config) => {
    if (!config) return { a: [], b: [], images: {} };
    if (Array.isArray(config)) return { a: config, b: [], images: {} };
    return {
        a: Array.isArray(config.a) ? config.a : [],
        b: Array.isArray(config.b) ? config.b : [],
        images: config.images || {}
    };
};

// Fetch all frames
export const getFrames = async () => {
    const { data, error } = await supabase
        .from('frames')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
};

// Helper to upload file
const uploadFile = async (file, bucket = 'frames') => {
    const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
    const { data, error } = await supabase.storage.from(bucket).upload(fileName, file);
    if (error) throw error;
    const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(fileName);
    return publicUrlData.publicUrl;
};

// Create a new frame record
export const createFrame = async (frameData) => {
    // 1. Upload Main Image (Layout A)
    let imageUrl = frameData.image; // Potentially empty or old URL

    // Handle External URL Payload from Editor
    if (frameData.externalImage) {
        imageUrl = frameData.externalImage;
    } else if (frameData.file) {
        imageUrl = await uploadFile(frameData.file);
    }

    // 2. Upload or set Layout B Image
    let imageUrlB = null;
    if (frameData.externalImageB) {
        imageUrlB = frameData.externalImageB;
    } else if (frameData.imageFileB) {
        imageUrlB = await uploadFile(frameData.imageFileB);
    }

    // 3. Upload Thumbnail (if exists)
    let thumbnailUrl = null;
    if (frameData.thumbnailFile) {
        thumbnailUrl = await uploadFile(frameData.thumbnailFile);
    }

    // 4. Normalize layout_config and include image for B
    const finalLayoutConfig = normalizeLayoutConfig(frameData.layout_config);
    if (imageUrlB) {
        finalLayoutConfig.images = {
            ...finalLayoutConfig.images,
            b: imageUrlB
        };
    }

    // 5. Insert Record
    const { data, error } = await supabase
        .from('frames')
        .insert([{
            name: frameData.name,
            image_url: imageUrl,
            thumbnail_url: thumbnailUrl,
            status: frameData.status || 'active',
            layout_config: finalLayoutConfig,
            style: frameData.style || 'Custom',
            rarity: frameData.rarity || 'Common',
            artist: frameData.artist || 'Default',
            type: 'custom'
        }])
        .select()
        .single();

    if (error) throw error;
    return data;
};

// Update a frame
export const updateFrame = async (id, updates) => {
    const dbUpdates = { ...updates };

    // Remove file objects from direct DB update
    delete dbUpdates.file;
    delete dbUpdates.imageFileB;
    delete dbUpdates.thumbnailFile;
    delete dbUpdates.externalImage; // Clean up payload
    delete dbUpdates.externalImageB;

    // Handle External URL Update
    if (updates.externalImage) {
        dbUpdates.image_url = updates.externalImage;
    }
    // If new main file provided (Layout A), overwrite external URL
    else if (updates.file) {
        dbUpdates.image_url = await uploadFile(updates.file);
    }

    // Normalize layout_config before further modifications
    if (dbUpdates.layout_config) {
        dbUpdates.layout_config = normalizeLayoutConfig(dbUpdates.layout_config);
    }

    // If new Layout B: external URL or file upload
    if (updates.externalImageB) {
        const normalized = normalizeLayoutConfig(dbUpdates.layout_config);
        normalized.images = { ...normalized.images, b: updates.externalImageB };
        dbUpdates.layout_config = normalized;
    } else if (updates.imageFileB) {
        const urlB = await uploadFile(updates.imageFileB);
        const normalized = normalizeLayoutConfig(dbUpdates.layout_config);
        normalized.images = { ...normalized.images, b: urlB };
        dbUpdates.layout_config = normalized;
    }

    // If new thumbnail file provided
    if (updates.thumbnailFile) {
        dbUpdates.thumbnail_url = await uploadFile(updates.thumbnailFile);
    }

    const { data, error } = await supabase
        .from('frames')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
};

// Delete a frame
export const deleteFrame = async (id, imageUrl) => {
    // 1. Delete DB Record
    const { error } = await supabase
        .from('frames')
        .delete()
        .eq('id', id);

    if (error) throw error;

    // 2. Delete from Storage (only for Supabase-hosted files, skip external CDN URLs)
    if (imageUrl && imageUrl.includes('supabase.co')) {
        const urlParts = imageUrl.split('/');
        const fileName = urlParts[urlParts.length - 1];
        if (fileName) {
            await supabase.storage.from('frames').remove([fileName]);
        }
    }

    return true;
};

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

const BUCKET_NAME = 'maintenance-images';

let supabase = null;

const getSupabase = () => {
    if (!supabase) {
        if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
            throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables');
        }
        supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    }
    return supabase;
};

/**
 * Upload an image buffer to Supabase Storage
 * @param {Buffer} buffer - File buffer from multer memoryStorage
 * @param {string} filename - Target filename
 * @param {string} mimetype - MIME type (e.g. 'image/jpeg')
 * @returns {string} Public URL of the uploaded file
 */
const uploadImage = async (buffer, filename, mimetype) => {
    const client = getSupabase();
    const filePath = `${Date.now()}-${Math.round(Math.random() * 1000)}-${filename}`;

    const { data, error } = await client.storage
        .from(BUCKET_NAME)
        .upload(filePath, buffer, {
            contentType: mimetype,
            upsert: false,
        });

    if (error) {
        console.error('Supabase upload error:', error);
        throw new Error(`Failed to upload image: ${error.message}`);
    }

    // Get the public URL
    const { data: urlData } = client.storage
        .from(BUCKET_NAME)
        .getPublicUrl(data.path);

    return urlData.publicUrl;
};

/**
 * Delete an image from Supabase Storage
 * @param {string} publicUrl - Full public URL of the image
 */
const deleteImage = async (publicUrl) => {
    try {
        const client = getSupabase();
        // Extract the path from the public URL
        const urlParts = publicUrl.split(`/storage/v1/object/public/${BUCKET_NAME}/`);
        if (urlParts.length < 2) return;
        const filePath = urlParts[1];

        await client.storage.from(BUCKET_NAME).remove([filePath]);
    } catch (err) {
        console.error('Supabase delete error:', err);
    }
};

module.exports = { uploadImage, deleteImage, BUCKET_NAME };

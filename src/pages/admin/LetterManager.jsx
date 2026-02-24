import React, { useState, useEffect } from 'react';
import { useAlert } from '../../context/AlertContext';
import { getLetters, createLetter, updateLetter, deleteLetter, uploadLetterPhoto } from '../../services/letters';
import { Plus, Trash2, Edit, Mail, CheckCircle, XCircle, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getEmbedData, compressImageToWebP } from '../../utils/mediaUtils';

const LetterManager = () => {
    const { showAlert } = useAlert();
    const [letters, setLetters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingLetter, setEditingLetter] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        allowed_emails: '',
        music_url: '',
        photo_urls: '',
        photo_messages: '',
        theme_override: 'none',
        is_active: true
    });

    useEffect(() => {
        loadLetters();
    }, []);

    const loadLetters = async () => {
        try {
            const data = await getLetters();
            setLetters(data);
        } catch (error) {
            console.error("Failed to load letters:", error);
            showAlert("Failed to load letters.", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (letter = null) => {
        if (letter) {
            setEditingLetter(letter);
            setFormData({
                title: letter.title,
                content: letter.content,
                allowed_emails: letter.allowed_emails ? letter.allowed_emails.join(', ') : '',
                music_url: letter.music_url || '',
                photo_urls: letter.photo_urls ? letter.photo_urls.join(', ') : '',
                photo_messages: letter.photo_messages ? letter.photo_messages.join(', ') : '',
                theme_override: letter.theme_override || 'none',
                is_active: letter.is_active
            });
        } else {
            setEditingLetter(null);
            setFormData({
                title: '',
                content: '',
                allowed_emails: '',
                music_url: '',
                photo_urls: '',
                photo_messages: '',
                theme_override: 'none',
                is_active: true
            });
        }
        setIsModalOpen(true);
    };

    const handlePhotoUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        setIsUploadingPhoto(true);
        try {
            const uploadedUrls = [];
            for (const file of files) {
                // Compress and convert to webp (max width 1080px)
                const webpFile = await compressImageToWebP(file, 1080, 0.8);
                // Upload to Supabase (letters or frames bucket)
                const url = await uploadLetterPhoto(webpFile);
                uploadedUrls.push(url);
            }

            // Append to existing urls
            const currentUrls = formData.photo_urls ? formData.photo_urls.split(',').map(u => u.trim()).filter(Boolean) : [];
            const newUrlsList = [...currentUrls, ...uploadedUrls];

            // Add blank messages for new photos so index matches
            const currentMessages = formData.photo_messages ? formData.photo_messages.split(',').map(m => m.trim()) : [];
            const newMessagesList = [...currentMessages, ...Array(uploadedUrls.length).fill('A beautiful moment ❤️')];

            setFormData({
                ...formData,
                photo_urls: newUrlsList.join(', '),
                photo_messages: newMessagesList.join(', ')
            });

            showAlert(`Successfully compressed and uploaded ${files.length} photo(s) in WebP format!`, "success");
        } catch (error) {
            console.error("Upload error:", error);
            showAlert("Failed to upload photos. Ensure uploading is configured correctly.", "error");
        } finally {
            setIsUploadingPhoto(false);
            e.target.value = null; // Reset input
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();

        // 1. Validate Music URL if present
        if (formData.music_url && formData.music_url.trim() !== '') {
            const embedData = getEmbedData(formData.music_url);
            if (!embedData) {
                showAlert("Invalid Music URL! Only YouTube and Spotify links are supported.", "error");
                return;
            }
        }

        try {
            const payload = {
                ...formData,
                allowed_emails: formData.allowed_emails ? formData.allowed_emails.split(',').map(e => e.trim().toLowerCase()).filter(Boolean) : [],
                photo_urls: formData.photo_urls ? formData.photo_urls.split(',').map(e => e.trim()).filter(Boolean) : [],
                photo_messages: formData.photo_messages ? formData.photo_messages.split(',').map(e => e.trim()) : []
            };

            if (editingLetter) {
                const updated = await updateLetter(editingLetter.id, payload);
                setLetters(letters.map(l => l.id === editingLetter.id ? updated : l));
                showAlert("Letter updated!", "success");
            } else {
                const created = await createLetter(payload);
                setLetters([created, ...letters]);
                showAlert("Letter created!", "success");
            }
            setIsModalOpen(false);
        } catch (error) {
            console.error(error);
            showAlert("Failed to save letter.", "error");
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Delete this letter?")) return;
        try {
            await deleteLetter(id);
            setLetters(letters.filter(l => l.id !== id));
            showAlert("Letter deleted.", "success");
        } catch (error) {
            console.error(error);
            showAlert("Failed to delete.", "error");
        }
    };

    return (
        <div className="p-4 md:p-8 text-slate-800 min-h-screen relative">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                        <Mail className="text-blue-500" size={28} />
                        Sepucuk Surat Manager
                    </h1>
                    <p className="text-slate-500 font-medium">Manage and compose digital letters.</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-semibold flex items-center gap-2 hover:bg-blue-700 transition shadow-sm"
                >
                    <Plus size={18} /> New Letter
                </button>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
                    <div className="animate-spin text-blue-500">
                        <svg className="w-8 h-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    </div>
                    <p className="font-medium">Loading letters...</p>
                </div>
            ) : letters.length === 0 ? (
                <div className="text-center py-20 bg-white border border-dashed border-slate-300 rounded-2xl shadow-sm">
                    <Mail size={48} className="mx-auto mb-4 text-slate-300" />
                    <p className="text-slate-600 font-medium z-10">No letters found. Create one to surprise someone!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {letters.map((letter) => (
                        <motion.div
                            key={letter.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`bg-white border rounded-2xl p-6 shadow-sm relative overflow-hidden group transition-all hover:shadow-md ${!letter.is_active ? 'opacity-70 grayscale-[30%] border-slate-200 bg-slate-50' : 'border-slate-200 hover:border-blue-200'}`}
                        >
                            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleOpenModal(letter)} className="p-2 text-blue-600 hover:bg-blue-50 bg-white rounded-lg shadow-sm transition"><Edit size={16} /></button>
                                <button onClick={() => handleDelete(letter.id)} className="p-2 text-rose-500 hover:bg-rose-50 bg-white rounded-lg shadow-sm transition"><Trash2 size={16} /></button>
                            </div>

                            <div className="flex items-center gap-2 mb-3">
                                {letter.is_active ? <CheckCircle size={16} className="text-emerald-500" /> : <XCircle size={16} className="text-slate-400" />}
                                <span className={`text-xs font-bold uppercase tracking-wide ${letter.is_active ? 'text-emerald-600' : 'text-slate-500'}`}>
                                    {letter.is_active ? 'Active' : 'Inactive'}
                                </span>
                            </div>

                            <h3 className="font-bold text-xl mb-3 text-slate-800 truncate" title={letter.title}>{letter.title}</h3>

                            <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl text-sm text-slate-600 h-28 overflow-y-auto mb-5 whitespace-pre-wrap">
                                {letter.content}
                            </div>

                            <div className="space-y-2 text-sm text-slate-500 border-t border-slate-100 pt-4">
                                <div>
                                    <span className="font-semibold text-slate-700">Targets:</span> {letter.allowed_emails && letter.allowed_emails.length > 0 ? (
                                        <span className="text-blue-600 font-medium ml-1">{letter.allowed_emails.length} Users</span>
                                    ) : (
                                        <span className="text-slate-400 ml-1">No one (Public?)</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="font-semibold text-slate-700">Theme:</span> <span className={`px-2 py-0.5 rounded text-xs font-bold ${letter.theme_override === 'valentine' ? 'bg-pink-100 text-pink-700' : 'bg-slate-100 text-slate-600'}`}>{letter.theme_override && letter.theme_override !== 'none' ? letter.theme_override.toUpperCase() : 'Default'}</span>
                                </div>
                                <div className="flex flex-wrap gap-1.5 pt-1">
                                    {letter.allowed_emails?.slice(0, 3).map(email => (
                                        <span key={email} className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md text-[10px] text-slate-600">{email}</span>
                                    ))}
                                    {letter.allowed_emails?.length > 3 && <span className="text-[10px] text-slate-400 font-medium">+{letter.allowed_emails.length - 3} more</span>}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* MODAL */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 10 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 10 }}
                            className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
                        >
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                    {editingLetter ? <Edit className="text-blue-500" size={20} /> : <Mail className="text-blue-500" size={20} />}
                                    {editingLetter ? 'Edit Letter' : 'Compose Letter'}
                                </h2>
                                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
                                    <XCircle size={24} />
                                </button>
                            </div>

                            <div className="p-6 overflow-y-auto">
                                <form id="letter-form" onSubmit={handleSave} className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Title</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.title}
                                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                                            className="w-full bg-white border border-slate-300 rounded-xl p-3 text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                            placeholder="Header of the letter..."
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Message Content</label>
                                        <textarea
                                            required
                                            rows={6}
                                            value={formData.content}
                                            onChange={e => setFormData({ ...formData, content: e.target.value })}
                                            className="w-full bg-white border border-slate-300 rounded-xl p-3 text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                            placeholder="Write your heartwarming message here..."
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Target Emails (Comma Separated)</label>
                                        <textarea
                                            rows={2}
                                            value={formData.allowed_emails}
                                            onChange={e => setFormData({ ...formData, allowed_emails: e.target.value })}
                                            className="w-full bg-white border border-slate-300 rounded-xl p-3 text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm"
                                            placeholder="user@example.com, friend@gmail.com"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Background Music (YouTube / Spotify track link)</label>
                                        <input
                                            type="text"
                                            value={formData.music_url}
                                            onChange={e => setFormData({ ...formData, music_url: e.target.value })}
                                            className="w-full bg-white border border-slate-300 rounded-xl p-3 text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm"
                                            placeholder="https://youtu.be/... or https://open.spotify.com/track/..."
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Attached Photos (Comma Separated URLs)</label>
                                        <textarea
                                            rows={2}
                                            value={formData.photo_urls}
                                            onChange={e => setFormData({ ...formData, photo_urls: e.target.value })}
                                            className="w-full bg-white border border-slate-300 rounded-xl p-3 text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm mb-3"
                                            placeholder="https://example.com/img1.jpg, https://example.com/img2.jpg"
                                        />
                                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-slate-50 p-4 border border-slate-200 rounded-xl">
                                            <label className={`px-4 py-2 rounded-lg font-semibold text-sm cursor-pointer transition flex-shrink-0 ${isUploadingPhoto ? 'bg-slate-200 text-slate-500 cursor-wait' : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'}`}>
                                                {isUploadingPhoto ? 'Uploading...' : 'Upload & Compress to WebP'}
                                                <input
                                                    type="file"
                                                    multiple
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={handlePhotoUpload}
                                                    disabled={isUploadingPhoto}
                                                />
                                            </label>
                                            <span className="text-xs text-slate-500">Files automatically convert to WebP to save space.</span>
                                        </div>
                                    </div>

                                    {formData.photo_urls && formData.photo_urls.length > 0 && (
                                        <div className="bg-blue-50 border border-blue-100 p-5 rounded-xl">
                                            <label className="block text-sm font-semibold text-blue-900 mb-1.5">
                                                Polaroid Texts (Comma Separated)
                                            </label>
                                            <textarea
                                                rows={2}
                                                value={formData.photo_messages}
                                                onChange={e => setFormData({ ...formData, photo_messages: e.target.value })}
                                                className="w-full bg-white border border-blue-200 rounded-xl p-3 text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm"
                                                placeholder="A beautiful moment ❤️, Always together ✨"
                                            />
                                            <span className="text-xs text-blue-700/80 mt-2 block font-medium">
                                                These messages appear on the back of floating photos. Must correspond to the order of photo URLs.
                                            </span>
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Theme Override</label>
                                        <select
                                            value={formData.theme_override}
                                            onChange={e => setFormData({ ...formData, theme_override: e.target.value })}
                                            className="w-full bg-white border border-slate-300 rounded-xl p-3 text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all font-medium appearance-none"
                                        >
                                            <option value="none">Default (Follows app global theme)</option>
                                            <option value="valentine">Valentine (Pink / Romantic)</option>
                                        </select>
                                    </div>

                                    <div className="flex items-center gap-3 pt-2">
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" checked={formData.is_active} onChange={e => setFormData({ ...formData, is_active: e.target.checked })} className="sr-only peer" />
                                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                                            <span className="ml-3 text-sm font-bold text-slate-700 select-none">Set as Active</span>
                                        </label>
                                    </div>
                                </form>
                            </div>

                            <div className="p-4 sm:p-6 border-t border-slate-100 bg-slate-50 flex gap-3 justify-end">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-6 py-2.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl font-semibold transition shadow-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    form="letter-form"
                                    type="submit"
                                    className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition shadow-sm flex items-center gap-2"
                                >
                                    <Save size={18} /> Save Letter
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default LetterManager;

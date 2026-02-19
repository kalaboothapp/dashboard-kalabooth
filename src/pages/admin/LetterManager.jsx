import React, { useState, useEffect } from 'react';
import { useAlert } from '../../context/AlertContext';
import { getLetters, createLetter, updateLetter, deleteLetter } from '../../services/letters';
import { Plus, Trash2, Edit, Mail, CheckCircle, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getEmbedData } from '../../utils/mediaUtils';

const LetterManager = () => {
    const { showAlert } = useAlert();
    const [letters, setLetters] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingLetter, setEditingLetter] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        allowed_emails: '',
        music_url: '',
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
                is_active: letter.is_active
            });
        } else {
            setEditingLetter(null);
            setFormData({
                title: '',
                content: '',
                allowed_emails: '',
                music_url: '',
                is_active: true
            });
        }
        setIsModalOpen(true);
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
                allowed_emails: formData.allowed_emails.split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
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
        <div className="p-4 md:p-8 text-white min-h-screen font-nunito relative">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <h1 className="text-3xl font-titan text-game-accent flex items-center gap-2">
                    <Mail /> SEPUCUK SURAT MANAGER
                </h1>
                <button
                    onClick={() => handleOpenModal()}
                    className="px-6 py-2 bg-game-primary text-white rounded-lg font-bold flex items-center gap-2 hover:bg-white hover:text-black transition shadow-game"
                >
                    <Plus size={18} /> NEW LETTER
                </button>
            </div>

            {loading ? (
                <div className="text-center py-20 animate-pulse text-gray-500">Loading letters...</div>
            ) : letters.length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed border-gray-700 rounded-xl">
                    <Mail size={48} className="mx-auto mb-4 opacity-50 text-gray-400" />
                    <p className="text-gray-500">No letters found. Create one to surprise someone!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {letters.map((letter) => (
                        <motion.div
                            key={letter.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`bg-white/10 border border-white/10 rounded-xl p-5 relative overflow-hidden group ${!letter.is_active ? 'opacity-60 grayscale' : ''}`}
                        >
                            <div className="absolute top-0 right-0 p-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 rounded-bl-xl">
                                <button onClick={() => handleOpenModal(letter)} className="text-blue-400 hover:text-white"><Edit size={16} /></button>
                                <button onClick={() => handleDelete(letter.id)} className="text-red-400 hover:text-white"><Trash2 size={16} /></button>
                            </div>

                            <div className="flex items-center gap-2 mb-2">
                                {letter.is_active ? <CheckCircle size={16} className="text-green-500" /> : <XCircle size={16} className="text-gray-500" />}
                                <span className={`text-xs font-bold uppercase ${letter.is_active ? 'text-green-500' : 'text-gray-500'}`}>
                                    {letter.is_active ? 'ACTIVE' : 'INACTIVE'}
                                </span>
                            </div>

                            <h3 className="font-bold text-xl mb-2 text-yellow-400 truncate">{letter.title}</h3>

                            <div className="bg-black/30 p-3 rounded text-sm text-gray-300 h-24 overflow-y-auto mb-4 font-mono whitespace-pre-wrap">
                                {letter.content}
                            </div>

                            <div className="text-xs text-gray-500">
                                <strong>Targets:</strong> {letter.allowed_emails && letter.allowed_emails.length > 0 ? (
                                    <span className="text-white ml-1">{letter.allowed_emails.length} Users</span>
                                ) : (
                                    <span className="text-red-400 ml-1">No one (Public?)</span>
                                )}
                            </div>
                            <div className="mt-2 flex flex-wrap gap-1">
                                {letter.allowed_emails?.slice(0, 3).map(email => (
                                    <span key={email} className="bg-white/10 px-2 py-0.5 rounded text-[10px] text-gray-300">{email}</span>
                                ))}
                                {letter.allowed_emails?.length > 3 && <span className="text-[10px] text-gray-500">+{letter.allowed_emails.length - 3} more</span>}
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* MODAL */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-[#1a1a2e] border border-white/20 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl"
                        >
                            <div className="p-6">
                                <h2 className="text-2xl font-titan text-white mb-6">
                                    {editingLetter ? 'EDIT LETTER' : 'COMPOSE LETTER'}
                                </h2>

                                <form onSubmit={handleSave} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 mb-1">TITLE</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.title}
                                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                                            className="w-full bg-black/40 border border-gray-600 rounded p-3 text-white focus:border-game-primary outline-none"
                                            placeholder="Header of the letter..."
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 mb-1">MESSAGE CONTENT</label>
                                        <textarea
                                            required
                                            rows={5}
                                            value={formData.content}
                                            onChange={e => setFormData({ ...formData, content: e.target.value })}
                                            className="w-full bg-black/40 border border-gray-600 rounded p-3 text-white focus:border-game-primary outline-none font-mono text-sm"
                                            placeholder="Write your heartwarming message here..."
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 mb-1">TARGET EMAILS (COMMA SEPARATED)</label>
                                        <textarea
                                            rows={2}
                                            value={formData.allowed_emails}
                                            onChange={e => setFormData({ ...formData, allowed_emails: e.target.value })}
                                            className="w-full bg-black/40 border border-gray-600 rounded p-3 text-white focus:border-game-primary outline-none text-sm"
                                            placeholder="user@example.com, friend@gmail.com"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 mb-1">BACKGROUND MUSIC (YOUTUBE / SPOTIFY LINK)</label>
                                        <input
                                            type="text"
                                            value={formData.music_url}
                                            onChange={e => setFormData({ ...formData, music_url: e.target.value })}
                                            className="w-full bg-black/40 border border-gray-600 rounded p-3 text-white focus:border-game-primary outline-none text-sm"
                                            placeholder="https://youtu.be/... or https://open.spotify.com/track/..."
                                        />
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            id="isActive"
                                            checked={formData.is_active}
                                            onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                                            className="w-5 h-5 accent-game-primary"
                                        />
                                        <label htmlFor="isActive" className="text-sm font-bold cursor-pointer">Set as Active</label>
                                    </div>

                                    <div className="flex gap-3 pt-4">
                                        <button
                                            type="button"
                                            onClick={() => setIsModalOpen(false)}
                                            className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-bold transition"
                                        >
                                            CANCEL
                                        </button>
                                        <button
                                            type="submit"
                                            className="flex-1 py-3 bg-game-primary hover:bg-white hover:text-black rounded-lg font-bold transition shadow-game"
                                        >
                                            SAVE LETTER
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default LetterManager;

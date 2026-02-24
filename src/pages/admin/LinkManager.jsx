import React, { useEffect, useState } from 'react';
import { useAlert } from '../../context/AlertContext';
import { getLinks, addLink, updateLink, deleteLink } from '../../services/links';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Edit, Home, ExternalLink, Save, X, GripVertical, CheckCircle, Eye, EyeOff, Link as LinkIcon } from 'lucide-react';
import { motion, Reorder } from 'framer-motion';
import * as LucideIcons from 'lucide-react';

const IconPicker = ({ onSelect, onClose }) => {
    const [search, setSearch] = useState('');
    const iconList = Object.keys(LucideIcons).filter(key =>
        typeof LucideIcons[key] === 'object' &&
        key !== 'createLucideIcon' &&
        key.toLowerCase().includes(search.toLowerCase())
    ).slice(0, 50);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col shadow-xl">
                <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-bold text-lg text-slate-900">Select Icon</h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 text-slate-500 rounded-full transition-colors"><X size={20} /></button>
                </div>
                <div className="p-4 bg-slate-50">
                    <input
                        type="text"
                        placeholder="Search icons..."
                        className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        autoFocus
                    />
                </div>
                <div className="flex-1 overflow-y-auto p-4 grid grid-cols-5 sm:grid-cols-6 gap-2 bg-white rounded-b-2xl">
                    {iconList.map(name => {
                        const Icon = LucideIcons[name];
                        return (
                            <button
                                key={name}
                                onClick={() => onSelect(name)}
                                className="flex flex-col items-center justify-center gap-2 p-3 hover:bg-slate-50 text-slate-600 hover:text-blue-600 rounded-xl transition-colors border border-transparent hover:border-slate-200"
                                title={name}
                            >
                                <Icon size={24} />
                                <span className="text-[10px] truncate w-full text-center font-medium">{name}</span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

const LinkManager = () => {
    const navigate = useNavigate();
    const { showAlert } = useAlert();
    const [links, setLinks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        url: '',
        icon: 'Link',
        is_active: true,
        button_color: '#face10',
        text_color: '#042493'
    });
    const [showIconPicker, setShowIconPicker] = useState(false);

    useEffect(() => {
        loadLinks();
    }, []);

    const loadLinks = async () => {
        try {
            const data = await getLinks();
            setLinks(data);
        } catch (error) {
            showAlert("Failed to load links.", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.title || !formData.url) {
            showAlert("Title and URL are required.", "error");
            return;
        }

        try {
            if (editingId) {
                const updated = await updateLink(editingId, formData);
                setLinks(links.map(l => l.id === editingId ? updated : l));
                showAlert("Link updated!", "success");
            } else {
                const newLink = await addLink({ ...formData, order: links.length });
                setLinks([...links, newLink]);
                showAlert("Link added!", "success");
            }
            resetForm();
        } catch (error) {
            showAlert("Failed to save link.", "error");
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Delete this link?")) return;
        try {
            await deleteLink(id);
            setLinks(links.filter(l => l.id !== id));
            showAlert("Link deleted.", "success");
        } catch (error) {
            showAlert("Failed to delete.", "error");
        }
    };

    const handleEdit = (link) => {
        setEditingId(link.id);
        setFormData({
            title: link.title,
            url: link.url,
            icon: link.icon,
            is_active: link.is_active,
            button_color: link.button_color || '#face10',
            text_color: link.text_color || '#042493'
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const resetForm = () => {
        setEditingId(null);
        setFormData({
            title: '',
            url: '',
            icon: 'Link',
            is_active: true,
            button_color: '#face10',
            text_color: '#042493'
        });
    };

    const DynamicIcon = ({ name }) => {
        const Icon = LucideIcons[name] || LucideIcons.Link;
        return <Icon size={20} />;
    };

    return (
        <div className="relative pb-12">
            {showIconPicker && (
                <IconPicker
                    onSelect={(icon) => { setFormData({ ...formData, icon }); setShowIconPicker(false); }}
                    onClose={() => setShowIconPicker(false)}
                />
            )}

            <div className="max-w-4xl mx-auto z-10 relative">
                <div className="mb-8">
                    <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight text-center">Manage Links</h1>
                </div>

                <div className="bg-white border border-slate-200 p-6 sm:p-8 rounded-2xl mb-8 shadow-sm">
                    <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                        {editingId ? <Edit className="text-blue-500" size={20} /> : <Plus className="text-emerald-500" size={20} />}
                        {editingId ? 'Edit Link' : 'Add New Link'}
                    </h2>

                    <div className="grid gap-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Title</label>
                                <input
                                    type="text"
                                    className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                    placeholder="e.g. My Website"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">URL</label>
                                <input
                                    type="url"
                                    className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                    placeholder="https://..."
                                    value={formData.url}
                                    onChange={e => setFormData({ ...formData, url: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="flex gap-4 items-end">
                            <div className="flex-1">
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Icon</label>
                                <button
                                    onClick={() => setShowIconPicker(true)}
                                    className="w-full flex items-center gap-3 bg-white border border-slate-300 rounded-xl px-4 py-2.5 hover:bg-slate-50 text-slate-700 transition-colors"
                                >
                                    <div className="text-slate-500"><DynamicIcon name={formData.icon} /></div>
                                    <span className="flex-1 text-left font-medium">{formData.icon}</span>
                                    <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-md">Change</span>
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Button Color</label>
                                <div className="flex items-center gap-3 bg-white border border-slate-300 rounded-xl px-4 py-2 hover:border-slate-400 transition-colors focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
                                    <input
                                        type="color"
                                        className="w-8 h-8 rounded cursor-pointer bg-transparent border-0 p-0"
                                        value={formData.button_color || '#face10'}
                                        onChange={e => setFormData({ ...formData, button_color: e.target.value })}
                                    />
                                    <span className="text-sm font-medium text-slate-600 uppercase flex-1">{formData.button_color || '#face10'}</span>
                                    <button
                                        onClick={() => setFormData({ ...formData, button_color: '#face10' })}
                                        className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                                    >
                                        Reset
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Text Color</label>
                                <div className="flex items-center gap-3 bg-white border border-slate-300 rounded-xl px-4 py-2 hover:border-slate-400 transition-colors focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
                                    <input
                                        type="color"
                                        className="w-8 h-8 rounded cursor-pointer bg-transparent border-0 p-0"
                                        value={formData.text_color || '#042493'}
                                        onChange={e => setFormData({ ...formData, text_color: e.target.value })}
                                    />
                                    <span className="text-sm font-medium text-slate-600 uppercase flex-1">{formData.text_color || '#042493'}</span>
                                    <button
                                        onClick={() => setFormData({ ...formData, text_color: '#042493' })}
                                        className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                                    >
                                        Reset
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 mt-2">
                            <label className="block text-xs font-bold text-slate-400 mb-4 text-center uppercase tracking-widest">Live Preview</label>
                            <div className="flex justify-center">
                                <div
                                    className="flex items-center gap-4 px-6 py-4 w-full max-w-sm rounded-xl text-lg font-bold relative overflow-hidden transition-all duration-200 shadow-[0_4px_14px_0_rgba(0,0,0,0.1)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.15)] hover:-translate-y-0.5"
                                    style={{
                                        backgroundColor: formData.button_color || '#face10',
                                        color: formData.text_color || '#042493',
                                    }}
                                >
                                    <div className="flex-shrink-0 opacity-80">
                                        <DynamicIcon name={formData.icon} />
                                    </div>
                                    <span className="flex-1 text-left truncate">{formData.title || 'Link Title'}</span>
                                    <LucideIcons.ArrowRight size={20} className="opacity-80" />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                            {editingId && (
                                <button
                                    onClick={resetForm}
                                    className="px-6 py-2.5 rounded-xl font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
                                >
                                    Cancel
                                </button>
                            )}
                            <button
                                onClick={handleSave}
                                className="px-6 py-2.5 rounded-xl font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-sm flex items-center gap-2"
                            >
                                <Save size={18} /> {editingId ? 'Save Changes' : 'Add Link'}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-10 text-slate-400 gap-3">
                            <LucideIcons.Loader2 className="animate-spin" size={24} />
                            <p>Loading links...</p>
                        </div>
                    ) : (
                        links.map((link, index) => (
                            <motion.div
                                key={link.id}
                                layout
                                className={`flex items-center gap-4 p-4 rounded-2xl border ${link.is_active ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-50 border-slate-200 opacity-70 grayscale-[20%]'}`}
                            >
                                <div className="text-slate-400 font-bold text-lg w-6 text-center">{index + 1}</div>
                                <div
                                    className="p-3.5 rounded-xl shadow-sm"
                                    style={{ backgroundColor: link.button_color || '#face10', color: link.text_color || '#042493' }}
                                >
                                    <DynamicIcon name={link.icon} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-bold text-slate-800 text-lg">{link.title}</h3>
                                        {!link.is_active && <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-md font-bold uppercase tracking-wide">Hidden</span>}
                                    </div>
                                    <p className="text-sm text-slate-500 truncate mt-0.5 font-medium">{link.url}</p>
                                </div>
                                <div className="flex gap-1.5 shrink-0">
                                    <button
                                        onClick={() => updateLink(link.id, { is_active: !link.is_active }).then(loadLinks)}
                                        className={`p-2.5 rounded-xl transition-colors ${link.is_active ? 'text-slate-400 hover:bg-slate-100' : 'text-slate-500 hover:bg-slate-200'}`}
                                        title={link.is_active ? 'Hide link' : 'Show link'}
                                    >
                                        {link.is_active ? <Eye size={18} /> : <EyeOff size={18} />}
                                    </button>
                                    <button onClick={() => handleEdit(link)} className="p-2.5 text-blue-600 rounded-xl hover:bg-blue-50 transition-colors" title="Edit">
                                        <Edit size={18} />
                                    </button>
                                    <button onClick={() => handleDelete(link.id)} className="p-2.5 text-rose-500 rounded-xl hover:bg-rose-50 transition-colors" title="Delete">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </motion.div>
                        ))
                    )}

                    {links.length === 0 && !loading && (
                        <div className="text-center py-16 text-slate-500 bg-slate-50 border border-dashed border-slate-300 rounded-2xl shadow-sm">
                            <LinkIcon size={32} className="mx-auto mb-3 text-slate-400" />
                            <p className="font-medium text-slate-700">No links found</p>
                            <p className="text-sm mt-1">Add your first link above to see it here.</p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default LinkManager;

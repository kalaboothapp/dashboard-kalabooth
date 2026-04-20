import React, { useState, useEffect } from 'react';
import { getSessions, deleteSession } from '../../services/sessions';
import { useAlert } from '../../context/AlertContext';
import { 
    ClockIcon, 
    ExternalLinkIcon, 
    TrashIcon, 
    UpdateIcon,
    MagnifyingGlassIcon,
} from '@radix-ui/react-icons';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { cn } from '../../lib/utils';

const SessionHistory = () => {
    const { showAlert } = useAlert();
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadSessions();
    }, []);

    const loadSessions = async () => {
        setLoading(true);
        try {
            const data = await getSessions();
            setSessions(data || []);
        } catch (error) {
            showAlert("Gagal memuat riwayat.", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Hapus riwayat ini?")) return;
        try {
            await deleteSession(id);
            setSessions(prev => prev.filter(s => s.id !== id));
            showAlert("Riwayat dihapus.", "success");
        } catch (error) {
            showAlert("Gagal menghapus.", "error");
        }
    };

    const filteredSessions = sessions.filter(session => 
        session.client_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        session.session_id?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('id-ID', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500 font-inter">
            {/* Header Ringkas */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">Riwayat Sesi</h1>
                    <p className="text-slate-400 text-sm font-medium">Total {sessions.length} sesi tersimpan</p>
                </div>
                <Button 
                    variant="ghost" 
                    onClick={loadSessions}
                    disabled={loading}
                    className="h-10 w-10 p-0 rounded-full hover:bg-slate-100"
                >
                    <UpdateIcon className={cn("w-5 h-5 text-slate-500", loading && "animate-spin")} />
                </Button>
            </div>

            {/* Pencarian Minimalis */}
            <div className="relative">
                <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                    placeholder="Cari nama klien..."
                    className="h-12 pl-11 bg-white border-slate-100 rounded-xl text-sm font-medium focus:ring-0 focus:border-slate-300 transition-all"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* List Sesi */}
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                {loading ? (
                    <div className="py-20 text-center">
                        <UpdateIcon className="w-8 h-8 mx-auto text-slate-200 animate-spin mb-2" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Memuat data...</p>
                    </div>
                ) : filteredSessions.length > 0 ? (
                    <div className="divide-y divide-slate-50">
                        {filteredSessions.map((session) => (
                            <div key={session.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors group">
                                <div className="flex items-center gap-4 min-w-0">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span className="font-bold text-slate-900 truncate">
                                                {session.client_name || 'Guest'}
                                            </span>
                                            <Badge variant="secondary" className="bg-slate-100 text-slate-500 text-[9px] font-bold border-none uppercase tracking-tight h-5">
                                                {session.session_id}
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-slate-400 font-medium">{formatDate(session.created_at)}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    {session.folder_url && (
                                        <Button 
                                            asChild
                                            variant="secondary"
                                            className="h-9 px-4 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border-none font-bold text-xs gap-2 transition-all"
                                        >
                                            <a href={session.folder_url} target="_blank" rel="noopener noreferrer">
                                                <ExternalLinkIcon className="w-3.5 h-3.5" />
                                                G-Drive
                                            </a>
                                        </Button>
                                    )}
                                    <Button 
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDelete(session.id)}
                                        className="h-9 w-9 rounded-lg text-slate-200 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                                    >
                                        <TrashIcon className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="py-20 text-center">
                        <ClockIcon className="w-12 h-12 mx-auto text-slate-100 mb-4" />
                        <p className="text-sm font-bold text-slate-300">Belum ada riwayat sesi.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SessionHistory;

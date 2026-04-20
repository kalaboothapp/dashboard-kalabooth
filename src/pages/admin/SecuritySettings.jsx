import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAlert } from '../../context/AlertContext';
import { 
    LockClosedIcon, 
    UpdateIcon, 
    CheckCircledIcon, 
    ShadowIcon,
    FileTextIcon,
    ResetIcon,
    UploadIcon
} from '@radix-ui/react-icons';
import { Button } from '../../components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { cn } from '../../lib/utils';

const SecuritySettings = () => {
    const { showAlert } = useAlert();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [adminPassword, setAdminPassword] = useState('1945');

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('global_settings')
                .select('*')
                .eq('id', 1)
                .single();

            if (data) {
                setAdminPassword(data.admin_password || '1945');
            }
        } catch (err) {
            console.error("Error fetching security settings:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        if (e) e.preventDefault();
        setSaving(true);

        try {
            const { error } = await supabase
                .from('global_settings')
                .update({ 
                    admin_password: adminPassword,
                    updated_at: new Date()
                })
                .eq('id', 1);

            if (error) throw error;
            showAlert("Security settings updated successfully!", "success");
        } catch (err) {
            console.error("SecuritySettings Save Error:", err);
            showAlert("Failed to save settings: " + err.message, "error");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-24 text-slate-400 gap-4">
                <UpdateIcon className="animate-spin text-kala-red" width={32} height={32} />
                <p className="font-black text-xs uppercase tracking-[0.2em]">Authenticating Security Module...</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 font-inter">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Security Settings</h1>
                    <p className="text-slate-500 font-bold mt-2">Manage master access security and dashboard authentication.</p>
                </div>
                <Badge variant="outline" className="px-5 py-2 text-[10px] font-black uppercase tracking-widest border-slate-200">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2 animate-pulse" />
                    Security Active
                </Badge>
            </div>

            <form onSubmit={handleSave} className="space-y-8">
                <Card className="shadow-2xl border-none relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-bl-[100px] -z-10" />
                    
                    <CardHeader className="md:p-10 pb-0">
                        <div className="flex items-center gap-5">
                            <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-slate-900/10">
                                <LockClosedIcon width={32} height={32} />
                            </div>
                            <div>
                                <CardTitle className="text-2xl font-black text-slate-900 tracking-tight">Master Entry PIN</CardTitle>
                                <CardDescription className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mt-1">Primary Access Control</CardDescription>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="md:p-10 max-w-xl">
                        <div className="space-y-6">
                            <div className="space-y-3">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Master Dashboard PIN</label>
                                <div className="relative">
                                    <LockClosedIcon className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" width={24} height={24} />
                                    <Input
                                        type="text"
                                        value={adminPassword}
                                        onChange={e => setAdminPassword(e.target.value)}
                                        className="h-20 pl-16 pr-6 bg-slate-50 border-transparent focus:bg-white text-4xl font-black tracking-[0.4em] rounded-[24px] shadow-inner transition-all"
                                        placeholder="1945"
                                        maxLength={8}
                                    />
                                </div>
                            </div>
                            
                            <div className="flex items-start gap-4 p-6 rounded-[2rem] bg-indigo-50/50 border border-indigo-100/50">
                                <div className="mt-1 text-indigo-500 shrink-0">
                                    <FileTextIcon width={20} height={20} />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[11px] font-black uppercase tracking-widest text-indigo-900">Security Recommendation</p>
                                    <p className="text-xs font-bold text-indigo-600/80 leading-relaxed italic">
                                        This PIN is used to bypass traditional logins on this terminal. Ensure it is unique and known only to authorized booth operators.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-4">
                    <Button
                        type="submit"
                        disabled={saving}
                        className={cn(
                            "h-16 px-12 rounded-[24px] bg-slate-900 text-white font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl hover:bg-slate-800 transition-all",
                            saving && "opacity-80"
                        )}
                    >
                        {saving ? (
                            <ShadowIcon className="animate-spin mr-3" width={20} height={20} />
                        ) : (
                            <><UploadIcon className="mr-3" /> Update & Lock PIN</>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default SecuritySettings;

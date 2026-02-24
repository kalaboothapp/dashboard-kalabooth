import React, { useEffect, useState } from 'react';
import { useAlert } from '../../context/AlertContext';
import { checkCampaignStatus, toggleCampaign, resetCampaign, getWinners } from '../../services/campaignService';
import { RefreshCw, Trophy, Users, Image as ImageIcon, Gift } from 'lucide-react';

const CampaignManager = () => {
    const { showAlert } = useAlert();
    const [campaign, setCampaign] = useState({ active: false, remaining: 0, winners: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadCampaign();
    }, []);

    const loadCampaign = async () => {
        setLoading(true);
        try {
            const status = await checkCampaignStatus();
            const winnerList = await getWinners();
            setCampaign({ ...status, winners: winnerList });
        } catch (error) {
            console.error("Failed to load campaign data:", error);
            showAlert("Failed to load campaign data", "error");
        } finally {
            setLoading(false);
        }
    };

    const [processing, setProcessing] = useState(false);

    const handleToggleCampaign = async () => {
        if (processing) return;
        setProcessing(true);

        // Optimistic Update
        const previousState = campaign.active;
        const newState = !previousState;

        setCampaign(prev => ({ ...prev, active: newState }));

        try {
            await toggleCampaign(newState);
            showAlert(newState ? "CAMPAIGN ACTIVATED!" : "CAMPAIGN PAUSED!", "success");
            // Reload just to be safe, but keep quiet about it
            const status = await checkCampaignStatus();
            setCampaign(prev => ({ ...prev, ...status }));
        } catch (error) {
            console.error("Failed to toggle campaign:", error);
            setCampaign(prev => ({ ...prev, active: previousState })); // Revert
            showAlert("Failed to update campaign status. Check network.", "error");
        } finally {
            setProcessing(false);
        }
    };

    const handleResetCampaign = async () => {
        if (processing) return;
        if (!confirm("RESET CAMPAIGN? This will clear current winner count (but keep data).")) return;

        setProcessing(true);
        try {
            await resetCampaign();
            // Manually update local state to reflect reset immediately
            setCampaign(prev => ({ ...prev, current_winners: 0, active: false, remaining: 10 }));
            loadCampaign();
            showAlert("CAMPAIGN RESET!", "success");
        } catch (error) {
            console.error(error);
            showAlert("Failed to reset campaign.", "error");
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="relative">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-8">Campaign Manager</h1>

            {/* CAMPAIGN CONTROL CENTER */}
            <div className="bg-white border border-slate-200 shadow-sm p-6 sm:p-8 rounded-2xl mb-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-[0.03] pointer-events-none">
                    <Gift size={140} />
                </div>

                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative z-10">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 mb-2 flex items-center gap-2">
                            <Gift className="text-blue-500" /> Lucky Giveaway System
                        </h2>
                        <p className="text-slate-500 font-medium mb-5">Manage the "First 10 Wins" campaign.</p>

                        <div className="flex flex-wrap items-center gap-3">
                            <div className={`px-4 py-1.5 rounded-full text-xs font-bold border uppercase tracking-wider ${campaign.active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                                Status: {campaign.active ? 'Active (Running)' : 'Inactive (Paused)'}
                            </div>
                            <div className="text-sm font-medium text-slate-600 bg-slate-50 px-4 py-1.5 rounded-full border border-slate-100">
                                Remaining Slots: <span className="text-blue-600 font-bold ml-1">{campaign.remaining}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-3 w-full lg:w-auto mt-2 lg:mt-0">
                        <button
                            onClick={handleToggleCampaign}
                            disabled={processing}
                            className={`flex-1 lg:flex-none px-6 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shadow-sm ${campaign.active ? 'bg-rose-500 hover:bg-rose-600 text-white' : 'bg-emerald-500 hover:bg-emerald-600 text-white'} ${processing ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'}`}
                        >
                            {processing ? <RefreshCw className="animate-spin" size={18} /> : (campaign.active ? 'Stop Campaign' : 'Start Campaign')}
                        </button>
                        <button
                            onClick={handleResetCampaign}
                            disabled={processing}
                            className={`flex-1 lg:flex-none px-6 py-3 rounded-xl font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all flex items-center justify-center gap-2 shadow-sm ${processing ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'}`}
                        >
                            <RefreshCw size={18} className={processing ? "animate-spin text-slate-400" : "text-slate-500"} /> Reset
                        </button>
                    </div>
                </div>
            </div>

            {/* WINNERS LIST */}
            <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 sm:p-8 overflow-hidden">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Trophy className="text-amber-500" /> Hall of Fame
                    </h2>
                    <button className="text-sm font-semibold bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 px-4 py-2.5 rounded-lg transition-colors shadow-sm flex items-center gap-2" onClick={loadCampaign}>
                        <RefreshCw size={16} /> Refresh Data
                    </button>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
                        <RefreshCw className="animate-spin" size={28} />
                        <p className="font-medium text-slate-500">Loading data...</p>
                    </div>
                ) : campaign.winners.length === 0 ? (
                    <div className="text-center py-16 text-slate-500 bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                        <Trophy className="mx-auto mb-3 text-slate-300" size={48} />
                        <p className="font-medium text-slate-600">No winners yet</p>
                        <p className="text-sm mt-1">Start the campaign to see data here.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                        <table className="w-full text-left border-collapse bg-white">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr className="text-slate-500 text-xs font-bold uppercase tracking-wider">
                                    <th className="p-4 whitespace-nowrap">Winner</th>
                                    <th className="p-4 whitespace-nowrap">Contact</th>
                                    <th className="p-4">Address</th>
                                    <th className="p-4 text-center whitespace-nowrap">Photo Evidence</th>
                                    <th className="p-4 whitespace-nowrap">Time</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm divide-y divide-slate-100">
                                {campaign.winners.map((w) => (
                                    <tr key={w.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="p-4 font-semibold text-slate-800">{w.name}</td>
                                        <td className="p-4 text-slate-600 font-medium">{w.whatsapp}</td>
                                        <td className="p-4 text-slate-600 max-w-[200px] truncate" title={w.address}>{w.address}</td>
                                        <td className="p-4 text-center">
                                            <a
                                                href={w.photo_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center justify-center gap-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded-lg border border-transparent hover:border-blue-100 transition-colors text-xs font-bold"
                                            >
                                                <ImageIcon size={14} /> Open Print
                                            </a>
                                        </td>
                                        <td className="p-4 text-slate-500 text-xs font-medium">
                                            {new Date(w.created_at).toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CampaignManager;

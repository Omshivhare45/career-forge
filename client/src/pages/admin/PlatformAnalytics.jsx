import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  FiSmartphone,
  FiMonitor,
  FiTrendingUp,
  FiUsers,
  FiActivity,
  FiClock,
  FiDatabase,
  FiCheckCircle,
  FiAlertTriangle,
  FiDownload,
  FiSearch,
  FiTrash2,
  FiLogOut,
  FiRefreshCw
} from 'react-icons/fi';
import toast from 'react-hot-toast';

// Chart colors
const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#3b82f6', '#8b5cf6'];
const PLATFORM_COLORS = {
  Android: '#10b981',
  iOS: '#f59e0b',
  Desktop: '#6366f1',
  Web: '#3b82f6'
};

const PlatformAnalytics = () => {
  const [stats, setStats] = useState(null);
  const [charts, setCharts] = useState(null);
  const [realtime, setRealtime] = useState(null);
  const [devices, setDevices] = useState([]);
  const [versions, setVersions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters for Device Management
  const [searchQuery, setSearchQuery] = useState('');
  const [platformFilter, setPlatformFilter] = useState('');
  const [versionFilter, setVersionFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchData();

    // Set up auto-refresh every 30 seconds for real-time analytics
    const interval = setInterval(() => {
      fetchRealtimeAndDevices(false);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, chartsRes, versionsRes] = await Promise.all([
        api.get('/admin/analytics/active-users'),
        api.get('/admin/analytics/installations'),
        api.get('/admin/analytics/versions')
      ]);

      setStats(statsRes.data.data);
      setCharts(chartsRes.data.data);
      setVersions(versionsRes.data.data);
      await fetchRealtimeAndDevices(false);
    } catch (err) {
      toast.error('Failed to load administrative analytics data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRealtimeAndDevices = async (showToast = false) => {
    if (showToast) setRefreshing(true);
    try {
      const [realtimeRes, devicesRes] = await Promise.all([
        api.get('/admin/analytics/realtime'),
        api.get('/admin/analytics/devices', {
          params: {
            searchQuery,
            platform: platformFilter,
            appVersion: versionFilter,
            status: statusFilter
          }
        })
      ]);

      setRealtime(realtimeRes.data.data);
      setDevices(devicesRes.data.data || []);
      if (showToast) toast.success('Real-time metrics refreshed');
    } catch (err) {
      console.error('Error fetching real-time data:', err);
    } finally {
      if (showToast) setRefreshing(false);
    }
  };

  // Trigger search filter refresh
  useEffect(() => {
    if (!loading) {
      fetchRealtimeAndDevices(false);
    }
  }, [searchQuery, platformFilter, versionFilter, statusFilter]);

  const handleForceLogout = async (installationId) => {
    if (!window.confirm('Are you sure you want to force log out this device? All active sessions will be terminated.')) return;
    const loadingToast = toast.loading('Terminating device session...');
    try {
      await api.post(`/admin/analytics/devices/${installationId}/logout`);
      toast.success('Device logged out successfully', { id: loadingToast });
      fetchRealtimeAndDevices();
    } catch (err) {
      toast.error('Failed to log out device', { id: loadingToast });
    }
  };

  const handleRemoveDevice = async (installationId) => {
    if (!window.confirm('Are you sure you want to remove this device? This will clear its historical tracking data.')) return;
    const loadingToast = toast.loading('Removing device tracking...');
    try {
      await api.delete(`/admin/analytics/devices/${installationId}`);
      toast.success('Device removed successfully', { id: loadingToast });
      fetchRealtimeAndDevices();
    } catch (err) {
      toast.error('Failed to remove device', { id: loadingToast });
    }
  };

  const exportReport = () => {
    try {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify({ stats, charts, realtime, devices, versions }, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `CareerForge_Analytics_Report_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      toast.success('Report exported successfully');
    } catch (err) {
      toast.error('Failed to export report');
    }
  };

  const formatDuration = (sec) => {
    if (!sec || isNaN(sec)) return '0s';
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const secs = sec % 60;
    
    if (hrs > 0) return `${hrs}h ${mins}m`;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="w-10 h-10 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin"></div>
        <p className="text-xs font-bold text-slate-400">Loading system analytics dashboards...</p>
      </div>
    );
  }

  // Format platform data
  const platformChartData = stats?.platformUsage
    ? Object.keys(stats.platformUsage).map(key => ({
        name: key.charAt(0).toUpperCase() + key.slice(1),
        value: stats.platformUsage[key]
      }))
    : charts?.platformDistribution || [];

  return (
    <div className="space-y-10 fade-in">
      {/* Top Banner Control Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-white/5 p-5 rounded-2xl">
        <div>
          <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
            <FiActivity className="text-indigo-500" /> Platform Usage & Install Analytics
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
            Real-time telemetry and installation distribution statistics across Web, PWA, and client applications.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchRealtimeAndDevices(true)}
            disabled={refreshing}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-white/5 bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors flex items-center gap-1.5 text-xs font-bold"
          >
            <FiRefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh Live
          </button>
          <button
            onClick={exportReport}
            className="p-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 transition-colors flex items-center gap-1.5 text-xs font-bold shadow-md shadow-indigo-500/10"
          >
            <FiDownload className="w-3.5 h-3.5" />
            Export JSON
          </button>
        </div>
      </div>

      {/* Outdated Version Alert */}
      {versions?.alertOutdated && (
        <div className="flex items-start gap-4 p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 animate-pulse">
          <FiAlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-black">Outdated Client Versions Detected!</h4>
            <p className="text-xs text-amber-700 dark:text-amber-400/90 mt-1 leading-relaxed">
              Less than {versions.latestAdoptionRate}% of users are running the latest application build ({versions.latestVersion}). Consider triggering an app update prompt to ensure system stability.
            </p>
          </div>
        </div>
      )}

      {/* Analytics Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {/* Total Installs */}
        <div className="bg-white dark:bg-slate-900/40 border border-slate-150 dark:border-white/5 p-4 rounded-2xl shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-slate-550 uppercase tracking-wider block">Total Installs</span>
          <div className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-1.5">
            <FiSmartphone className="text-indigo-500" /> {realtime?.currentActiveDevices || 0}
          </div>
        </div>
        {/* Online Users */}
        <div className="bg-white dark:bg-slate-900/40 border border-slate-150 dark:border-white/5 p-4 rounded-2xl shadow-sm space-y-1 relative overflow-hidden">
          <span className="text-[10px] font-bold text-slate-550 uppercase tracking-wider block">Current Online</span>
          <div className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping absolute top-4 right-4"></span>
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full absolute top-4 right-4"></span>
            <FiActivity className="text-emerald-500" /> {realtime?.currentOnlineUsers || 0}
          </div>
        </div>
        {/* New Installs Today */}
        <div className="bg-white dark:bg-slate-900/40 border border-slate-150 dark:border-white/5 p-4 rounded-2xl shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-slate-550 uppercase tracking-wider block">Installs Today</span>
          <div className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-1.5">
            <FiTrendingUp className="text-emerald-500" /> {stats?.newInstallsToday || 0}
          </div>
        </div>
        {/* Installs This Week */}
        <div className="bg-white dark:bg-slate-900/40 border border-slate-150 dark:border-white/5 p-4 rounded-2xl shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-slate-550 uppercase tracking-wider block">Installs Week</span>
          <div className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-1.5">
            <FiTrendingUp className="text-indigo-500" /> {stats?.newInstallsThisWeek || 0}
          </div>
        </div>
        {/* Installs This Month */}
        <div className="bg-white dark:bg-slate-900/40 border border-slate-150 dark:border-white/5 p-4 rounded-2xl shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-slate-550 uppercase tracking-wider block">Installs Month</span>
          <div className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-1.5">
            <FiTrendingUp className="text-purple-500" /> {stats?.newInstallsThisMonth || 0}
          </div>
        </div>
        {/* DAU */}
        <div className="bg-white dark:bg-slate-900/40 border border-slate-150 dark:border-white/5 p-4 rounded-2xl shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-slate-550 uppercase tracking-wider block">Daily Active (DAU)</span>
          <div className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-1.5">
            <FiUsers className="text-sky-500" /> {stats?.dau || 0}
          </div>
        </div>
        {/* WAU */}
        <div className="bg-white dark:bg-slate-900/40 border border-slate-150 dark:border-white/5 p-4 rounded-2xl shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-slate-550 uppercase tracking-wider block">Weekly Active (WAU)</span>
          <div className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-1.5">
            <FiUsers className="text-indigo-500" /> {stats?.wau || 0}
          </div>
        </div>
        {/* MAU */}
        <div className="bg-white dark:bg-slate-900/40 border border-slate-150 dark:border-white/5 p-4 rounded-2xl shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-slate-550 uppercase tracking-wider block">Monthly Active (MAU)</span>
          <div className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-1.5">
            <FiUsers className="text-purple-500" /> {stats?.mau || 0}
          </div>
        </div>
        {/* Returning Users */}
        <div className="bg-white dark:bg-slate-900/40 border border-slate-150 dark:border-white/5 p-4 rounded-2xl shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-slate-550 uppercase tracking-wider block">Returning Users</span>
          <div className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-1.5">
            <FiRefreshCw className="text-emerald-500" /> {stats?.returningUsers || 0}
          </div>
        </div>
        {/* Avg Session Duration */}
        <div className="bg-white dark:bg-slate-900/40 border border-slate-150 dark:border-white/5 p-4 rounded-2xl shadow-sm space-y-1 col-span-2 md:col-span-1">
          <span className="text-[10px] font-bold text-slate-550 uppercase tracking-wider block">Avg Session Time</span>
          <div className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-1.5 truncate">
            <FiClock className="text-amber-500" /> {formatDuration(stats?.avgSessionDuration)}
          </div>
        </div>
        {/* Total Sessions */}
        <div className="bg-white dark:bg-slate-900/40 border border-slate-150 dark:border-white/5 p-4 rounded-2xl shadow-sm space-y-1 col-span-2 md:col-span-1">
          <span className="text-[10px] font-bold text-slate-550 uppercase tracking-wider block">Total Sessions</span>
          <div className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-1.5">
            <FiDatabase className="text-rose-500" /> {stats?.totalSessions || 0}
          </div>
        </div>
        {/* Live Login Count */}
        <div className="bg-white dark:bg-slate-900/40 border border-slate-150 dark:border-white/5 p-4 rounded-2xl shadow-sm space-y-1 col-span-2 md:col-span-1">
          <span className="text-[10px] font-bold text-slate-550 uppercase tracking-wider block">Live Logins (24h)</span>
          <div className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-1.5">
            <FiCheckCircle className="text-emerald-500" /> {realtime?.liveLoginCount || 0}
          </div>
        </div>
      </div>

      {/* Visual Charts Layout */}
      <div className="grid md:grid-cols-12 gap-6">
        {/* Installs & DAU Trend (Line Chart) */}
        <div className="md:col-span-8 bg-white dark:bg-slate-900/35 border border-slate-200 dark:border-white/5 p-6 rounded-3xl shadow-md">
          <h3 className="text-sm font-black text-slate-800 dark:text-white mb-4">Active Users & Installation Growth</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts?.dailyActiveTrend || []}>
                <defs>
                  <linearGradient id="colorInstalls" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorDAU" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                <XAxis dataKey="date" stroke="#94a3b850" style={{ fontSize: '10px' }} />
                <YAxis stroke="#94a3b850" style={{ fontSize: '10px' }} />
                <Tooltip contentStyle={{ background: '#09090b', border: '1px solid #ffffff10', borderRadius: '12px' }} />
                <Legend />
                <Area type="monotone" name="New Installs" dataKey="installs" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorInstalls)" />
                <Area type="monotone" name="DAU" dataKey="dau" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorDAU)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Platform Distribution (Donut Chart) */}
        <div className="md:col-span-4 bg-white dark:bg-slate-900/35 border border-slate-200 dark:border-white/5 p-6 rounded-3xl shadow-md flex flex-col justify-between">
          <h3 className="text-sm font-black text-slate-800 dark:text-white mb-4">Platform Distribution</h3>
          <div className="h-60 relative flex justify-center items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={platformChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {platformChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PLATFORM_COLORS[entry.name] || COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#09090b', border: '1px solid #ffffff10', borderRadius: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Label */}
            <div className="absolute text-center">
              <span className="text-[10px] font-black uppercase text-slate-400">Total Devices</span>
              <span className="text-2xl font-black text-slate-800 dark:text-white block mt-0.5">{stats?.totalInstalls || 0}</span>
            </div>
          </div>
          {/* Custom Legends */}
          <div className="grid grid-cols-2 gap-2 mt-4 text-xs font-bold text-slate-650 dark:text-slate-300">
            {platformChartData.map((p, idx) => (
              <div key={p.name} className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: PLATFORM_COLORS[p.name] || COLORS[idx % COLORS.length] }}></span>
                <span>{p.name}: {p.value} ({stats?.totalInstalls > 0 ? Math.round((p.value / stats.totalInstalls) * 100) : 0}%)</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Additional Charts Row */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Peak Usage Hours */}
        <div className="bg-white dark:bg-slate-900/35 border border-slate-200 dark:border-white/5 p-6 rounded-3xl shadow-md">
          <h3 className="text-sm font-black text-slate-800 dark:text-white mb-4">Peak Usage Hours</h3>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.peakUsageHours || charts?.peakUsageHours || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                <XAxis dataKey="hour" stroke="#94a3b850" style={{ fontSize: '9px' }} />
                <YAxis stroke="#94a3b850" style={{ fontSize: '9px' }} />
                <Tooltip contentStyle={{ background: '#09090b', border: '1px solid #ffffff10' }} />
                <Bar name="Sessions Started" dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* New vs Returning Users */}
        <div className="bg-white dark:bg-slate-900/35 border border-slate-200 dark:border-white/5 p-6 rounded-3xl shadow-md">
          <h3 className="text-sm font-black text-slate-800 dark:text-white mb-4">New vs Returning Users</h3>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.newVsReturning || charts?.newVsReturning || []}>
                <defs>
                  <linearGradient id="colorNew" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorReturning" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                <XAxis dataKey="date" stroke="#94a3b850" style={{ fontSize: '9px' }} />
                <YAxis stroke="#94a3b850" style={{ fontSize: '9px' }} />
                <Tooltip contentStyle={{ background: '#09090b', border: '1px solid #ffffff10' }} />
                <Area type="monotone" name="New Installs" dataKey="newUsers" stroke="#10b981" fillOpacity={1} fill="url(#colorNew)" stackId="1" />
                <Area type="monotone" name="Returning" dataKey="returningUsers" stroke="#6366f1" fillOpacity={1} fill="url(#colorReturning)" stackId="1" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Version Adoption Rate */}
        <div className="bg-white dark:bg-slate-900/35 border border-slate-200 dark:border-white/5 p-6 rounded-3xl shadow-md">
          <h3 className="text-sm font-black text-slate-800 dark:text-white mb-4">Version Distribution</h3>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={versions?.versions || []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                <XAxis type="number" stroke="#94a3b850" style={{ fontSize: '9px' }} />
                <YAxis type="category" dataKey="version" stroke="#94a3b850" style={{ fontSize: '9px' }} />
                <Tooltip contentStyle={{ background: '#09090b', border: '1px solid #ffffff10' }} />
                <Bar name="Percentage Adoption" dataKey="percentage" fill="#ec4899" radius={[0, 4, 4, 0]}>
                  {versions?.versions?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.isLatest ? '#10b981' : '#f59e0b'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Device Management Console */}
      <div className="bg-white dark:bg-slate-900/40 border border-slate-150 dark:border-white/5 rounded-3xl p-6 shadow-md space-y-6">
        <div>
          <h3 className="text-lg font-black text-slate-800 dark:text-white">Active Device Management Console</h3>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">Moderate active connections, force logout devices, or remove unused tracking instances.</p>
        </div>

        {/* Toolbar Filters */}
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search devices by name, user name, email, or installation ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950/45 border border-slate-200 dark:border-white/5 rounded-xl pl-11 pr-4 py-2.5 text-xs text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-all font-semibold"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950/45 border border-slate-200 dark:border-white/5 rounded-xl px-4 py-2.5 text-xs text-slate-700 dark:text-slate-300 font-bold focus:outline-none focus:border-indigo-500"
            >
              <option value="">All Platforms</option>
              <option value="android">Android</option>
              <option value="ios">iOS</option>
              <option value="windows">Windows</option>
              <option value="macos">macOS</option>
              <option value="linux">Linux</option>
            </select>

            <select
              value={versionFilter}
              onChange={(e) => setVersionFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950/45 border border-slate-200 dark:border-white/5 rounded-xl px-4 py-2.5 text-xs text-slate-700 dark:text-slate-300 font-bold focus:outline-none focus:border-indigo-500"
            >
              <option value="">All Versions</option>
              {versions?.versions.map(v => (
                <option key={v.version} value={v.version}>{v.version}</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950/45 border border-slate-200 dark:border-white/5 rounded-xl px-4 py-2.5 text-xs text-slate-700 dark:text-slate-300 font-bold focus:outline-none focus:border-indigo-500"
            >
              <option value="">All Connection Statuses</option>
              <option value="online">Online Now</option>
              <option value="offline">Offline</option>
            </select>
          </div>
        </div>

        {/* Devices Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-slate-950/20">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-white/5 bg-slate-100/70 dark:bg-slate-950/40 text-[10px] font-black text-slate-550 dark:text-slate-400 uppercase tracking-widest">
                <th className="p-4">Device Identity</th>
                <th className="p-4">Platform & Version</th>
                <th className="p-4">Location (IP Geo)</th>
                <th className="p-4">Install Date</th>
                <th className="p-4">Last Active</th>
                <th className="p-4">Owner Profile</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {devices.length > 0 ? (
                devices.map((d) => (
                  <tr key={d.installationId} className="hover:bg-slate-100/50 dark:hover:bg-slate-900/30 transition-colors text-xs font-medium text-slate-700 dark:text-slate-300">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/5 text-indigo-500">
                          {d.operatingSystem.toLowerCase().includes('android') || d.operatingSystem.toLowerCase().includes('ios') ? (
                            <FiSmartphone size={16} />
                          ) : (
                            <FiMonitor size={16} />
                          )}
                        </div>
                        <div>
                          <span className="font-bold text-slate-800 dark:text-white block">{d.deviceName}</span>
                          <span className="text-[10px] text-slate-400 font-mono block mt-0.5 truncate max-w-[120px]" title={d.installationId}>
                            {d.installationId}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="space-y-1">
                        <span className="bg-slate-100 dark:bg-slate-800/40 px-2.5 py-1 rounded-md text-[10px] font-bold text-slate-650 dark:text-slate-300 border border-slate-200 dark:border-white/5">
                          {d.operatingSystem} ({d.osVersion})
                        </span>
                        <div className="text-[10px] text-slate-400 font-semibold">
                          Build Version: {d.appVersion}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="space-y-0.5">
                        <span className="font-bold block">{d.country}</span>
                        <span className="text-[10px] text-slate-400 block">{d.state}, {d.city}</span>
                      </div>
                    </td>
                    <td className="p-4 text-[10px] font-bold text-slate-500 dark:text-slate-400">
                      {new Date(d.installationDate).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {d.isOnline ? (
                          <>
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></span>
                            <span className="font-bold text-emerald-600 dark:text-emerald-450 uppercase text-[10px] tracking-wider">Online</span>
                          </>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-500">
                            {new Date(d.lastActiveDate).toLocaleDateString()} {new Date(d.lastActiveDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      {d.userId ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-indigo-500/10 text-indigo-500 text-[10px] font-black flex items-center justify-center border border-indigo-500/20">
                            {d.userId.fullName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold block text-slate-800 dark:text-slate-200">{d.userId.fullName}</span>
                            <span className="text-[9px] text-slate-400 block">{d.userId.email}</span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 italic">Guest / Anonymous</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {d.userId && (
                          <button
                            onClick={() => handleForceLogout(d.installationId)}
                            className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/10 flex items-center justify-center text-xs hover:bg-amber-500 hover:text-white transition-all"
                            title="Force Logout Session"
                          >
                            <FiLogOut />
                          </button>
                        )}
                        <button
                          onClick={() => handleRemoveDevice(d.installationId)}
                          className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/10 flex items-center justify-center text-xs hover:bg-rose-500 hover:text-white transition-all"
                          title="Remove Device"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-500 font-semibold">
                    No active devices matched your search or filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Real-time Activity Stream */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent Registrations */}
        <div className="bg-white dark:bg-slate-900/40 border border-slate-150 dark:border-white/5 rounded-3xl p-6 shadow-md">
          <h3 className="text-sm font-black text-slate-800 dark:text-white mb-4">Recent Registrations</h3>
          <div className="space-y-4">
            {realtime?.recentRegistrations.length > 0 ? (
              realtime.recentRegistrations.map((user) => (
                <div key={user._id} className="flex justify-between items-center bg-slate-50 dark:bg-slate-950/20 border border-slate-100 dark:border-white/5 p-3 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-500 text-xs font-black flex items-center justify-center border border-indigo-500/20">
                      {user.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <span className="font-bold text-slate-800 dark:text-white block text-xs">{user.fullName}</span>
                      <span className="text-[10px] text-slate-400 block">{user.email}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-indigo-400 bg-emerald-50 dark:bg-indigo-950/50 border border-emerald-100 dark:border-indigo-900/30 px-2 py-0.5 rounded">
                      🚀 {user.activeDomain?.name || 'New Trajectory'}
                    </span>
                    <span className="text-[9px] text-slate-400 block mt-1">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 text-center py-4">No recent user registrations.</p>
            )}
          </div>
        </div>

        {/* Live Activity Stream */}
        <div className="bg-white dark:bg-slate-900/40 border border-slate-150 dark:border-white/5 rounded-3xl p-6 shadow-md">
          <h3 className="text-sm font-black text-slate-800 dark:text-white mb-4">Active Telemetry Logs</h3>
          <div className="space-y-4">
            {realtime?.recentActivity.length > 0 ? (
              realtime.recentActivity.map((act) => (
                <div key={act.sessionId} className="flex justify-between items-center bg-slate-50 dark:bg-slate-950/20 border border-slate-100 dark:border-white/5 p-3 rounded-xl">
                  <div className="flex items-center gap-2.5">
                    <span className={`w-2 h-2 rounded-full ${act.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                    <div>
                      <span className="font-bold text-slate-800 dark:text-white block text-xs">
                        {act.userId ? act.userId.fullName : 'Guest Session'}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        Device: {act.deviceName} ({act.operatingSystem})
                      </span>
                    </div>
                  </div>
                  <div className="text-right text-xs">
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">
                      {formatDuration(act.duration)}
                    </span>
                    <span className="text-[9px] text-slate-400 block mt-0.5">
                      Last active: {new Date(act.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 text-center py-4">No active user telemetry streams.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlatformAnalytics;

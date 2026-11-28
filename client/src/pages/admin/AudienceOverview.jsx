import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts';
import useCountUp from '../../hooks/useCountUp';

export default function AudienceOverview({ stats, users }) {
  const [ref, progress] = useCountUp();
  const days = useMemo(() => {
    const today = new Date();
    const series = Array.from({ length: 7 }, (_, i) => {
      const day = new Date(today);
      day.setUTCDate(day.getUTCDate() - 6 + i);
      return { date: day.toISOString().slice(0, 10), label: day.toLocaleDateString('en', { month: 'short', day: 'numeric', timeZone: 'UTC' }), registrations: 0 };
    });
    for (const user of users) {
      const day = series.find(item => item.date === user.createdAt?.slice(0, 10));
      if (day) day.registrations++;
    }
    return series;
  }, [users]);
  const roles = Object.entries(users.reduce((counts, user) => {
    const role = user.role || 'Unassigned';
    counts[role] = (counts[role] || 0) + 1;
    return counts;
  }, {})).sort((a,b) => b[1]-a[1]);
  return <section aria-label="Audience overview" className="admin-overview">
    <dl ref={ref} className="grid gap-4 my-6 md:grid-cols-3">
      {[
        ['Registered users', stats?.totalUsers, 'Current accounts'],
        ['Guest visitors', stats?.guestVisitors, 'Unique browsers visiting signed out'],
        ['Video viewers', stats?.videoViewers, 'Unique browsers playing tracked lessons']
      ].map(([label,value,detail]) => <div className="admin-metric" key={label}><dt>{label}</dt>
        <dd className="admin-count"><span aria-hidden="true">{value == null ? '—' : Math.floor(value * progress).toLocaleString()}</span><span className="sr-only">{value ?? 'Unavailable'}</span></dd><dd>{detail}</dd></div>)}
    </dl>
    <div className="grid gap-4 lg:grid-cols-[3fr_2fr]">
      <section className="admin-metric"><h2>New registrations</h2><p>Last 7 days · UTC</p>
        {stats ? <><div aria-hidden="true"><ResponsiveContainer width="100%" height={200}><BarChart data={days} margin={{left:-25,right:6,top:15,bottom:0}}>
          <CartesianGrid vertical={false} stroke="var(--border)" /><XAxis dataKey="label" tick={{fill:'var(--text-muted)',fontSize:11}} axisLine={false} tickLine={false}/><YAxis allowDecimals={false} tick={{fill:'var(--text-muted)',fontSize:11}} axisLine={false} tickLine={false}/>
          <Tooltip cursor={{fill:'var(--bg-sub)'}} contentStyle={{background:'var(--bg-card)',borderColor:'var(--border)'}}/><Bar dataKey="registrations" name="Registrations" fill="var(--primary)" maxBarSize={34} radius={[4,4,0,0]} isAnimationActive={false}/>
        </BarChart></ResponsiveContainer></div><ul className="sr-only">{days.map(day=><li key={day.date}>{day.label}: {day.registrations}</li>)}</ul></> : <p>Registration data unavailable.</p>}
      </section>
      <section className="admin-metric"><h2>Accounts by role</h2><p>Share of current registered users</p>
        {stats && roles.length ? roles.map(([role,count]) => <div className="admin-role" key={role}><div><span>{role}</span><b>{count.toLocaleString()}</b></div><progress aria-label={role} max={users.length} value={count}/></div>) : <p>{stats ? 'No accounts yet.' : 'Role data unavailable.'}</p>}
      </section>
    </div><p className="my-5 text-sm text-[var(--text-muted)]">Guest and viewer totals start when tracking is enabled. A browser can appear in both.</p>
  </section>;
}

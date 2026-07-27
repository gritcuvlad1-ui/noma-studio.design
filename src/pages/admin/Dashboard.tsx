import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, 
  MessageSquare, 
  Image as ImageIcon, 
  GraduationCap, 
  FileText,
  LogOut,
  TrendingUp,
  Eye
} from 'lucide-react';
import { 
  AreaChart, Area, 
  LineChart, Line, 
  PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import './Dashboard.css';
import AdminBlogPosts from './BlogPosts';
import PortfolioManager from './PortfolioManager';
import AdminStudents from './Students';

type Tab = 'overview' | 'messages' | 'portfolio' | 'students' | 'blog';

// --- MOCK DATA ---
const miniViewsData = [
  { name: 'L', value: 120 }, { name: 'M', value: 132 }, { name: 'M', value: 101 }, 
  { name: 'J', value: 134 }, { name: 'V', value: 190 }, { name: 'S', value: 230 }, { name: 'D', value: 210 }
];

const miniMessagesData = [
  { name: 'L', value: 2 }, { name: 'M', value: 5 }, { name: 'M', value: 3 }, 
  { name: 'J', value: 8 }, { name: 'V', value: 4 }, { name: 'S', value: 1 }, { name: 'D', value: 0 }
];

const miniProjectsData = [
  { name: 'L', value: 45 }, { name: 'M', value: 45 }, { name: 'M', value: 48 }, 
  { name: 'J', value: 48 }, { name: 'V', value: 52 }, { name: 'S', value: 52 }, { name: 'D', value: 55 }
];

const mainChartData = [
  { name: 'Ian', vizitatori: 4000, interactiuni: 2400 },
  { name: 'Feb', vizitatori: 3000, interactiuni: 1398 },
  { name: 'Mar', vizitatori: 2000, interactiuni: 9800 },
  { name: 'Apr', vizitatori: 2780, interactiuni: 3908 },
  { name: 'Mai', vizitatori: 1890, interactiuni: 4800 },
  { name: 'Iun', vizitatori: 2390, interactiuni: 3800 },
  { name: 'Iul', vizitatori: 3490, interactiuni: 4300 },
];

const pieData = [
  { name: 'Google (SEO)', value: 45, color: '#b8956a' },
  { name: 'Instagram', value: 30, color: '#8b7565' },
  { name: 'Tiktok', value: 15, color: '#4a3f35' },
  { name: 'Direct', value: 10, color: '#2d241c' },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip">
        <div className="custom-tooltip-label">{label}</div>
        <div className="custom-tooltip-value">
          {payload[0].value} {payload[0].name === 'vizitatori' ? 'Vizite' : ''}
        </div>
      </div>
    );
  }
  return null;
};

export default function AdminDashboard() {
  const { signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="admin-overview">
            
            {/* Top KPIs Row */}
            <div className="admin-stats-grid">
              <div className="admin-stat-card">
                <div className="admin-stat-card-header">
                  <div className="admin-stat-icon-wrapper"><Eye size={20} /></div>
                  <TrendingUp size={20} color="#10b981" />
                </div>
                <h3 className="admin-stat-value">24.5K</h3>
                <p className="admin-stat-label">Vizualizări Totale</p>
                <div className="admin-stat-chart-mini">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={miniViewsData}>
                      <defs>
                        <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#b8956a" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#b8956a" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <Area type="monotone" dataKey="value" stroke="#b8956a" fillOpacity={1} fill="url(#colorViews)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="admin-stat-card">
                <div className="admin-stat-card-header">
                  <div className="admin-stat-icon-wrapper"><MessageSquare size={20} /></div>
                  <TrendingUp size={20} color="#10b981" />
                </div>
                <h3 className="admin-stat-value">124</h3>
                <p className="admin-stat-label">Mesaje Contact Active</p>
                <div className="admin-stat-chart-mini">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={miniMessagesData}>
                      <defs>
                        <linearGradient id="colorMsgs" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#b8956a" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#b8956a" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <Area type="monotone" dataKey="value" stroke="#b8956a" fillOpacity={1} fill="url(#colorMsgs)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="admin-stat-card">
                <div className="admin-stat-card-header">
                  <div className="admin-stat-icon-wrapper"><ImageIcon size={20} /></div>
                </div>
                <h3 className="admin-stat-value">56</h3>
                <p className="admin-stat-label">Proiecte în Portofoliu</p>
                <div className="admin-stat-chart-mini">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={miniProjectsData}>
                      <defs>
                        <linearGradient id="colorProj" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#b8956a" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#b8956a" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <Area type="step" dataKey="value" stroke="#b8956a" fillOpacity={1} fill="url(#colorProj)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Main Charts Row */}
            <div className="admin-charts-row">
              <div className="admin-chart-card">
                <div className="admin-chart-header">
                  <h3 className="admin-chart-title">Statistică Trafic Website</h3>
                  <select className="admin-chart-select">
                    <option>Ultimele 6 Luni</option>
                    <option>Acest An</option>
                  </select>
                </div>
                <div className="admin-chart-container">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={mainChartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="name" stroke="#a3a3a3" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#a3a3a3" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value / 1000}k`} />
                      <Tooltip content={<CustomTooltip />} />
                      <Line type="monotone" dataKey="vizitatori" stroke="#b8956a" strokeWidth={3} dot={{ r: 4, fill: '#141414', stroke: '#b8956a', strokeWidth: 2 }} activeDot={{ r: 6, fill: '#b8956a' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="admin-chart-card">
                <div className="admin-chart-header">
                  <h3 className="admin-chart-title">Surse Trafic</h3>
                  <select className="admin-chart-select">
                    <option>Luna Curentă</option>
                  </select>
                </div>
                <div className="admin-chart-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center', marginTop: '16px' }}>
                    {pieData.map((entry, index) => (
                      <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#a3a3a3' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: entry.color }}></div>
                        {entry.name} ({entry.value}%)
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="admin-recent-list">
              <div className="admin-chart-header">
                <h3 className="admin-chart-title">Activitate Recentă</h3>
              </div>
              
              <div className="admin-list-header">
                <div>Tip</div>
                <div>Subiect / Titlu</div>
                <div>Dată</div>
                <div>Status</div>
              </div>

              <div className="admin-list-item">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#b8956a' }}><MessageSquare size={16}/> Mesaj</div>
                <div>Colaborare Proiect Rezidențial</div>
                <div style={{ color: '#a3a3a3' }}>Azi, 14:30</div>
                <div><span className="admin-badge warning">Necitit</span></div>
              </div>

              <div className="admin-list-item">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#b8956a' }}><ImageIcon size={16}/> Portofoliu</div>
                <div>Vila Snagov - Design Interior</div>
                <div style={{ color: '#a3a3a3' }}>Ieri, 09:15</div>
                <div><span className="admin-badge success">Publicat</span></div>
              </div>

              <div className="admin-list-item">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#b8956a' }}><FileText size={16}/> Blog</div>
                <div>Tendințe Design Interior 2026</div>
                <div style={{ color: '#a3a3a3' }}>18 Mai 2026</div>
                <div><span className="admin-badge success">Publicat</span></div>
              </div>

            </div>

          </div>
        );
      case 'messages':
        return <div className="admin-card" style={{ background: 'var(--admin-card-bg)' }}><h2>Mesaje de Contact</h2><p>Aici vor apărea mesajele primite din formularul de contact.</p></div>;
      case 'portfolio':
        return <PortfolioManager />;
      case 'students':
        return <AdminStudents />;
      case 'blog':
        return <AdminBlogPosts />;
      default:
        return null;
    }
  };

  const getPageTitle = () => {
    switch (activeTab) {
      case 'overview': return 'Dashboard';
      case 'messages': return 'Mesaje Noi';
      case 'portfolio': return 'Portofoliu Studio';
      case 'students': return 'Portofoliu Studenți';
      case 'blog': return 'Articole Blog';
    }
  };

  return (
    <div className="admin-dashboard-container">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <div className="admin-sidebar-logo" style={{ fontSize: '18px', fontWeight: 600, letterSpacing: '0.15em' }}>ADMIN WORKSPACE</div>
        </div>

        <nav className="admin-nav">
          <button 
            className={`admin-nav-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <LayoutDashboard size={18} />
            Overview
          </button>
          
          <button 
            className={`admin-nav-item ${activeTab === 'messages' ? 'active' : ''}`}
            onClick={() => setActiveTab('messages')}
          >
            <MessageSquare size={18} />
            Mesaje
          </button>

          <button 
            className={`admin-nav-item ${activeTab === 'portfolio' ? 'active' : ''}`}
            onClick={() => setActiveTab('portfolio')}
          >
            <ImageIcon size={18} />
            Portofoliu
          </button>

          <button 
            className={`admin-nav-item ${activeTab === 'students' ? 'active' : ''}`}
            onClick={() => setActiveTab('students')}
          >
            <GraduationCap size={18} />
            Studenți
          </button>

          <button 
            className={`admin-nav-item ${activeTab === 'blog' ? 'active' : ''}`}
            onClick={() => setActiveTab('blog')}
          >
            <FileText size={18} />
            Blog
          </button>
        </nav>

        <div className="admin-sidebar-footer">
          <button onClick={signOut} className="admin-logout-btn">
            <LogOut size={18} />
            Deconectare
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-main-content">
        <div className="admin-page-header">
          <h1 className="admin-page-title">{getPageTitle()}</h1>
        </div>
        {renderContent()}
      </main>
    </div>
  );
}

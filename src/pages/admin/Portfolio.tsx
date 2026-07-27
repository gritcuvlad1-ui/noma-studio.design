import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import './AdminSections.css';

interface PortfolioProject {
  id: string;
  title: string;
  description: string;
  image_url: string;
  created_at: string;
}

export default function AdminPortfolio() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<PortfolioProject[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchProjects = async () => {
    const { data, error } = await supabase.from('portfolio_projects').select('*').order('created_at', { ascending: false });
    if (!error) setProjects(data as PortfolioProject[]);
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    setLoading(true);
    const { data, error } = await supabase.from('portfolio_projects').insert({ title, description, image_url: imageUrl });
    if (!error && data) {
      setProjects([...(data as PortfolioProject[]), ...projects]);
      setTitle('');
      setDescription('');
      setImageUrl('');
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    await supabase.from('portfolio_projects').delete().eq('id', id);
    setProjects(projects.filter(p => p.id !== id));
  };

  if (!user) return <p>Loading...</p>;

  return (
    <div className="admin-section">
      <h2 className="admin-section-title">Gestionare Portofoliu</h2>
      <form className="admin-form" onSubmit={handleCreate}>
        <input type="text" placeholder="Titlu" value={title} onChange={e => setTitle(e.target.value)} required />
        <textarea placeholder="Descriere" rows={4} value={description} onChange={e => setDescription(e.target.value)} required />
        <input type="text" placeholder="URL Imagine" value={imageUrl} onChange={e => setImageUrl(e.target.value)} />
        <button type="submit" disabled={loading} className="admin-btn-submit">
          {loading ? 'Salvare...' : 'Adaugă proiect'}
        </button>
      </form>
      <div className="admin-list">
        {projects.map(project => (
          <div key={project.id} className="admin-list-item">
            <div style={{flex: 1, paddingRight: '20px'}}>
              <h3 style={{margin: '0 0 8px 0', fontSize: '18px'}}>{project.title}</h3>
              <p style={{margin: '0 0 12px 0', fontSize: '14px', color: '#5a4a3a'}}>{project.description}</p>
              <p className="admin-portfolio-meta" style={{margin: 0, fontSize: '12px', color: '#8b7565'}}>{new Date(project.created_at).toLocaleDateString()}</p>
            </div>
            {project.image_url && (
              <img 
                src={project.image_url} 
                alt={project.title} 
                style={{width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px', marginRight: '20px'}} 
              />
            )}
            <button className="admin-btn-delete" onClick={() => handleDelete(project.id)}>Șterge</button>
          </div>
        ))}
      </div>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import './AdminSections.css';

type PortfolioProject = {
  id: string;
  title: string;
  description: string;
  image_url: string | null;
};

export default function PortfolioAdmin() {
  const [projects, setProjects] = useState<PortfolioProject[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = async () => {
    const { data, error } = await supabase.from('portfolio_projects').select('*').order('created_at', { ascending: false });
    if (error) setError(error.message);
    else setProjects(data as PortfolioProject[]);
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const { error } = await supabase.from('portfolio_projects').insert({ title, description });
    if (error) setError(error.message);
    else {
      setTitle('');
      setDescription('');
      fetchProjects();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('portfolio_projects').delete().eq('id', id);
    if (error) setError(error.message);
    else fetchProjects();
  };

  return (
    <div className="admin-section">
      <h2 className="admin-section-title">Gestionare Portofoliu</h2>
      {error && <div className="admin-error">{error}</div>}
      <form className="admin-form" onSubmit={handleCreate}>
        <input
          type="text"
          placeholder="Titlu"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <textarea
          placeholder="Descriere"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          required
        />
        <button type="submit" className="admin-btn-submit">Adaugă Proiect</button>
      </form>
      <ul className="admin-list">
        {projects.map((proj) => (
          <li key={proj.id} className="admin-list-item">
            <div>
              <strong>{proj.title}</strong>
              <p>{proj.description.slice(0, 100)}…</p>
            </div>
            <button className="admin-btn-delete" onClick={() => handleDelete(proj.id)}>Șterge</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

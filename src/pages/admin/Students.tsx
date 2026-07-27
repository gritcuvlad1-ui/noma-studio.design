import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import './AdminSections.css';

interface StudentProject {
  id: string;
  student_name: string;
  module: string;
  image_url: string;
  pdf_url: string;
  created_at: string;
}

export default function AdminStudents() {
  const { hasSupabaseConfig } = useAuth();
  
  // State for form
  const [studentName, setStudentName] = useState('');
  const [moduleName, setModuleName] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  
  // State for list & feedback
  const [projects, setProjects] = useState<StudentProject[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Initial mock data if no db
  useEffect(() => {
    if (!hasSupabaseConfig) {
      setProjects([
        {
          id: '1',
          student_name: 'Elena Popescu',
          module: 'Design Interior - Începători',
          image_url: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&q=80',
          pdf_url: '#',
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          student_name: 'Andrei Ionescu',
          module: 'Modelare 3D - Avansați',
          image_url: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&q=80',
          pdf_url: '#',
          created_at: new Date().toISOString()
        }
      ]);
    }
  }, [hasSupabaseConfig]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    // Generate local preview URLs if files exist
    let localImageUrl = '';
    let localPdfUrl = '';
    
    if (imageFile) localImageUrl = URL.createObjectURL(imageFile);
    if (pdfFile) localPdfUrl = URL.createObjectURL(pdfFile);

    if (!hasSupabaseConfig) {
      // Mock logic
      const newProject: StudentProject = {
        id: Date.now().toString(),
        student_name: studentName,
        module: moduleName,
        image_url: localImageUrl || 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&q=80', // Fallback image
        pdf_url: localPdfUrl || '#',
        created_at: new Date().toISOString()
      };
      
      setTimeout(() => {
        setProjects([newProject, ...projects]);
        setStudentName('');
        setModuleName('');
        setImageFile(null);
        setPdfFile(null);
        // Reset file inputs manually
        const fileInputs = document.querySelectorAll('input[type="file"]') as NodeListOf<HTMLInputElement>;
        fileInputs.forEach(input => input.value = '');
        
        setSuccessMsg('Proiect adăugat cu succes (Mock Mode)!');
        setLoading(false);
      }, 500);
      return;
    }

    try {
      // In a real scenario, here we would upload imageFile and pdfFile to Supabase Storage first,
      // get their public URLs, and then insert into the database.
      // For now, we simulate the insert with local object URLs.
      const { data, error: err } = await supabase
        .from('student_projects')
        .insert([{ student_name: studentName, module: moduleName, image_url: localImageUrl, pdf_url: localPdfUrl }])
        .select();

      if (err) throw err;

      if (data) {
        setProjects([...(data as StudentProject[]), ...projects]);
        setStudentName('');
        setModuleName('');
        setImageFile(null);
        setPdfFile(null);
        const fileInputs = document.querySelectorAll('input[type="file"]') as NodeListOf<HTMLInputElement>;
        fileInputs.forEach(input => input.value = '');
        setSuccessMsg('Proiect adăugat cu succes!');
      }
    } catch (err: any) {
      console.error('Error adding project:', err);
      setError(err.message || 'A apărut o eroare la adăugarea proiectului.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Ești sigur că vrei să ștergi acest proiect?')) return;

    if (!hasSupabaseConfig) {
      setProjects(projects.filter(p => p.id !== id));
      return;
    }

    try {
      const { error: err } = await supabase.from('student_projects').delete().eq('id', id);
      if (err) throw err;
      setProjects(projects.filter(p => p.id !== id));
    } catch (err: any) {
      console.error('Error deleting project:', err);
      alert('Eroare la ștergerea proiectului.');
    }
  };

  return (
    <div className="admin-section">
      <h2 className="admin-section-title">Adaugă Proiect Student</h2>
      
      {error && <div className="admin-error">{error}</div>}
      {successMsg && <div className="admin-error" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>{successMsg}</div>}

      <form className="admin-form" onSubmit={handleSubmit}>
        <input 
          type="text" 
          placeholder="Numele Cursantului (ex: Maria Popescu)" 
          value={studentName}
          onChange={(e) => setStudentName(e.target.value)}
          required
        />
        <input 
          type="text" 
          placeholder="Modul Curs (ex: Design Interior - Începători)" 
          value={moduleName}
          onChange={(e) => setModuleName(e.target.value)}
          required
        />
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
          <label style={{ fontSize: '13px', color: 'var(--admin-text-secondary)', marginLeft: '4px' }}>Imagine Copertă Proiect</label>
          <input
            type="file"
            accept="image/*"
            id="imageUpload"
            className="custom-file-input"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                setImageFile(e.target.files[0]);
              }
            }}
            style={{ display: 'none' }}
          />
          <label htmlFor="imageUpload" className="custom-file-label">
            Încarcă Imagine
            <span className="file-name">{imageFile?.name || ''}</span>
          </label>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
  <label style={{ fontSize: '13px', color: 'var(--admin-text-secondary)', marginLeft: '4px' }}>Fișier PDF (Proiectul Final)</label>
  <input
    type="file"
    accept=".pdf"
    id="pdfUpload"
    className="custom-file-input"
    style={{ display: 'none' }}
    onChange={(e) => {
      if (e.target.files && e.target.files[0]) {
        setPdfFile(e.target.files[0]);
      }
    }}
  />
  <label htmlFor="pdfUpload" className="custom-file-label">
    Încarcă PDF
    <span className="file-name">{pdfFile?.name || ''}</span>
  </label>
</div>
        
        <button type="submit" className="admin-btn-submit" disabled={loading} style={{ marginTop: '16px' }}>
          {loading ? 'Se salvează...' : 'Adaugă Proiect'}
        </button>
      </form>

      <div style={{ marginTop: '48px' }}>
        <h2 className="admin-section-title">Portofoliu Cursanți Existent</h2>
        <ul className="admin-list">
          {projects.map((project) => (
            <li key={project.id} className="admin-list-item">
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ 
                  width: '60px', 
                  height: '40px', 
                  borderRadius: '4px', 
                  overflow: 'hidden',
                  background: 'rgba(255,255,255,0.05)'
                }}>
                  {project.image_url ? (
                    <img src={project.image_url} alt={project.student_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', background: '#b8956a' }} />
                  )}
                </div>
                <div>
                  <strong style={{ color: 'var(--admin-text-primary)' }}>{project.student_name}</strong>
                  <div style={{ fontSize: '13px', color: 'var(--admin-text-secondary)', marginTop: '2px' }}>{project.module}</div>
                </div>
              </div>
              <button 
                onClick={() => handleDelete(project.id)}
                className="admin-btn-delete"
              >
                Șterge
              </button>
            </li>
          ))}
          {projects.length === 0 && (
            <li className="admin-list-item" style={{ justifyContent: 'center', color: 'var(--admin-text-secondary)' }}>
              Nu există proiecte adăugate încă.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}

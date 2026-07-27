import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import './AdminSections.css';

interface BlogPost {
  id: string;
  title: string;
  content: string;
  seo_keywords: string;
  created_at: string;
}

export default function AdminBlogPosts() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [seo, setSeo] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchPosts = async () => {
    const { data, error } = await supabase.from('blog_posts').select('*').order('created_at', { ascending: false });
    if (!error) setPosts(data as BlogPost[]);
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setLoading(true);
    const { data, error } = await supabase.from('blog_posts').insert({ title, content, seo_keywords: seo });
    if (!error) {
      setPosts([...((data || []) as BlogPost[]), ...posts]);
      setTitle('');
      setContent('');
      setSeo('');
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    await supabase.from('blog_posts').delete().eq('id', id);
    setPosts(posts.filter(p => p.id !== id));
  };

  if (!user) return <p>Loading...</p>;

  return (
    <div className="admin-section">
      <h2 className="admin-section-title">Gestionare articole SEO</h2>
      <form className="admin-form" onSubmit={handleCreate}>
        <input
          type="text"
          placeholder="Titlu"
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
        />
        <textarea
          placeholder="Conținut"
          rows={6}
          value={content}
          onChange={e => setContent(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Cuvinte SEO (comma-separated)"
          value={seo}
          onChange={e => setSeo(e.target.value)}
        />
        <button type="submit" disabled={loading} className="admin-btn-submit">
          {loading ? 'Salvare...' : 'Publică articol'}
        </button>
      </form>
      <div className="admin-list">
        {posts.map(post => (
          <div key={post.id} className="admin-list-item">
            <div>
              <h3>{post.title}</h3>
              <p className="admin-blog-meta" style={{fontSize: '12px', color: '#8b7565'}}>{new Date(post.created_at).toLocaleDateString()}</p>
              <p className="admin-blog-seo" style={{fontSize: '13px'}}>SEO: {post.seo_keywords}</p>
            </div>
            <button className="admin-btn-delete" onClick={() => handleDelete(post.id)}>
              Șterge
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

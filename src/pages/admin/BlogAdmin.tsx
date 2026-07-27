import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import './AdminSections.css';

type BlogPost = {
  id: string;
  title: string;
  content: string;
  created_at: string;
};

export default function BlogAdmin() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = async () => {
    const { data, error } = await supabase.from('blog_posts').select('*').order('created_at', { ascending: false });
    if (error) setError(error.message);
    else setPosts(data as BlogPost[]);
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const { error } = await supabase.from('blog_posts').insert({ title, content });
    if (error) setError(error.message);
    else {
      setTitle('');
      setContent('');
      fetchPosts();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('blog_posts').delete().eq('id', id);
    if (error) setError(error.message);
    else fetchPosts();
  };

  return (
    <div className="admin-section">
      <h2 className="admin-section-title">Gestionare Articole Blog</h2>
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
          placeholder="Conținut"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
          required
        />
        <button type="submit" className="admin-btn-submit">Adaugă Articol</button>
      </form>
      <ul className="admin-list">
        {posts.map((post) => (
          <li key={post.id} className="admin-list-item">
            <div>
              <strong>{post.title}</strong>
              <p>{post.content.slice(0, 100)}…</p>
            </div>
            <button className="admin-btn-delete" onClick={() => handleDelete(post.id)}>Șterge</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

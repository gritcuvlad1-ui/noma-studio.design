import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import './AdminSections.css';

type ContactMessage = {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  created_at: string;
};

export default function MessagesAdmin() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchMessages = async () => {
    const { data, error } = await supabase.from('contact_messages').select('*').order('created_at', { ascending: false });
    if (error) setError(error.message);
    else setMessages(data as ContactMessage[]);
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('contact_messages').delete().eq('id', id);
    if (error) setError(error.message);
    else fetchMessages();
  };

  return (
    <div className="admin-section">
      <h2 className="admin-section-title">Mesaje de Contact</h2>
      {error && <div className="admin-error">{error}</div>}
      <ul className="admin-list">
        {messages.map((msg) => (
          <li key={msg.id} className="admin-list-item">
            <div>
              <strong>{msg.name} – {msg.email}</strong>
              <p><em>{msg.subject}</em>: {msg.message.slice(0, 120)}…</p>
            </div>
            <button className="admin-btn-delete" onClick={() => handleDelete(msg.id)}>Șterge</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

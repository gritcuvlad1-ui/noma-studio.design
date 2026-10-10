import { Outlet } from 'react-router-dom';
import { Head as Helmet } from 'vite-react-ssg';
import { AuthProvider } from '../../context/AuthContext';

/* AuthProvider (care trage după el clientul supabase-js, ~120KB minificat) trăiește
   DOAR aici, în ruta-părinte /admin încărcată leneș. Înainte învelea toată
   aplicația, deci îl descărca și îl rula fiecare vizitator al paginilor publice,
   deși autentificarea există doar în admin. Un singur provider pentru /admin/login
   și /admin/dashboard, ca sesiunea să rămână partajată între ele. */
export default function AdminAuthShell() {
  return (
    <AuthProvider>
      <Helmet>
        <title>Admin | NOMA Studio</title>
      </Helmet>
      <Outlet />
    </AuthProvider>
  );
}

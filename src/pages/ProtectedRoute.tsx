import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  if (sessionStorage.getItem('authenticated') !== 'true') {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

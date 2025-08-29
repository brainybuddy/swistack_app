'use client';

import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import AuthForm from '../../components/AuthForm';
import ProtectedRoute from '../../components/ProtectedRoute';
import { LoginRequest } from '@swistack/shared';

export default function LoginPage() {
  const { login, isLoading, error, clearError } = useAuth();
  const router = useRouter();

  const handleLogin = async (data: LoginRequest) => {
    try {
      clearError();
      await login(data.email, data.password);
      router.push('/workspace');
    } catch (err) {
      // Error is handled by AuthContext
    }
  };

  return (
    <ProtectedRoute requireAuth={false}>
      <AuthForm
        mode="login"
        onSubmit={handleLogin}
        isLoading={isLoading}
        error={error}
      />
    </ProtectedRoute>
  );
}
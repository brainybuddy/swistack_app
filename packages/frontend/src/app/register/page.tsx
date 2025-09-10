'use client';

import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import AuthForm from '../../components/AuthForm';
import ProtectedRoute from '../../components/ProtectedRoute';
export default function RegisterPage() {
  const { register, isLoading, error, clearError } = useAuth();
  const router = useRouter();

  const handleRegister = async (data: any) => {
    try {
      clearError();
      await register(data);
      router.push('/workspace');
    } catch (err) {
      // Error is handled by AuthContext
    }
  };

  return (
    <ProtectedRoute requireAuth={false}>
      <AuthForm
        mode="register"
        onSubmit={handleRegister}
        isLoading={isLoading}
        error={error}
      />
    </ProtectedRoute>
  );
}
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4">
      <div className="text-center space-y-6 max-w-md">
        <h1 className="text-4xl font-bold text-foreground">MetaFlow</h1>
        <p className="text-lg text-muted-foreground">
          Sistema de gestão e automação para campanhas digitais
        </p>
        <div className="space-y-4">
          <Link to="/dashboard">
            <Button size="lg" className="w-full">
              Acessar Dashboard
            </Button>
          </Link>
          <Link to="/auth">
            <Button variant="outline" size="lg" className="w-full">
              Fazer Login / Criar Conta
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Index;
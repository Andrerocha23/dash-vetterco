import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { 
  Play, 
  Star, 
  Clock, 
  Users, 
  ArrowLeft, 
  CheckCircle,
  BookOpen
} from "lucide-react";
import { trainingService, TrainingModule } from "@/mocks/trainingService";
import { pt } from "@/i18n/pt";

export default function TrainingDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [module, setModule] = useState<TrainingModule | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadModule();
    }
  }, [id]);

  const loadModule = async () => {
    try {
      const moduleData = await trainingService.getModule(id!);
      setModule(moduleData);
    } catch (error) {
      console.error('Erro ao carregar módulo:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartModule = async () => {
    if (module && module.status === "not-started") {
      try {
        const updated = await trainingService.startModule(module.id);
        setModule(updated);
      } catch (error) {
        console.error('Erro ao iniciar módulo:', error);
      }
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case "beginner": return "bg-green-100 text-green-800";
      case "intermediate": return "bg-yellow-100 text-yellow-800";
      case "advanced": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "text-green-600";
      case "in-progress": return "text-blue-600";
      default: return "text-gray-600";
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Carregando aula...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!module) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-screen">
          <h1 className="text-2xl font-bold text-muted-foreground">Aula não encontrada</h1>
          <Button 
            variant="outline" 
            onClick={() => navigate('/capacitacao')}
            className="mt-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Capacitação
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate('/capacitacao')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video Player */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardContent className="p-0">
                <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden relative">
                  <img 
                    src={module.thumbnail} 
                    alt={module.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Button 
                      size="lg" 
                      className="rounded-full h-16 w-16"
                      onClick={handleStartModule}
                    >
                      <Play className="h-6 w-6" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Course Info */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-2xl mb-2">{module.title}</CardTitle>
                    <p className="text-muted-foreground">{module.description}</p>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2 mt-4">
                  <Badge className={getLevelColor(module.level)}>
                    {module.level}
                  </Badge>
                  <Badge variant="outline">{module.category}</Badge>
                  {module.tags.map(tag => (
                    <Badge key={tag} variant="secondary">{tag}</Badge>
                  ))}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Progress */}
                {module.status !== "not-started" && (
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Progresso</span>
                      <span className={getStatusColor(module.status)}>
                        {module.progress}%
                      </span>
                    </div>
                    <Progress value={module.progress} className="h-2" />
                  </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium">{module.duration} min</p>
                    <p className="text-xs text-muted-foreground">Duração</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium">{module.enrolled}</p>
                    <p className="text-xs text-muted-foreground">Inscritos</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <Star className="h-4 w-4 text-yellow-500" />
                    </div>
                    <p className="text-sm font-medium">{module.rating}</p>
                    <p className="text-xs text-muted-foreground">Avaliação</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      {module.status === "completed" ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <p className="text-sm font-medium">
                      {module.status === "completed" ? "Concluído" : 
                       module.status === "in-progress" ? "Em andamento" : "Não iniciado"}
                    </p>
                    <p className="text-xs text-muted-foreground">Status</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Mentor Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Instrutor</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={module.mentor.avatar} />
                    <AvatarFallback>
                      {module.mentor.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <h3 className="font-semibold">{module.mentor.name}</h3>
                    <p className="text-sm text-muted-foreground">{module.mentor.title}</p>
                    
                    <div className="flex items-center gap-2 mt-2">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm">{module.mentor.rating}</span>
                      <span className="text-sm text-muted-foreground">
                        • {module.mentor.totalCourses} cursos
                      </span>
                    </div>
                  </div>
                </div>
                
                <Separator className="my-4" />
                
                <div>
                  <h4 className="font-medium mb-2">Especialidades</h4>
                  <div className="flex flex-wrap gap-1">
                    {module.mentor.expertise.map(skill => (
                      <Badge key={skill} variant="outline" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <Separator className="my-4" />
                
                <p className="text-sm text-muted-foreground">{module.mentor.bio}</p>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  {module.status === "not-started" ? (
                    <Button className="w-full" onClick={handleStartModule}>
                      <Play className="h-4 w-4 mr-2" />
                      Iniciar Aula
                    </Button>
                  ) : module.status === "completed" ? (
                    <Button variant="outline" className="w-full">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Assistir Novamente
                    </Button>
                  ) : (
                    <Button className="w-full">
                      <Play className="h-4 w-4 mr-2" />
                      Continuar
                    </Button>
                  )}
                  
                  <Button variant="outline" className="w-full">
                    Fazer Download
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
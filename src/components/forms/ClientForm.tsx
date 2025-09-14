// ATUALIZAÇÕES PARA O ARQUIVO src/components/forms/ClientForm.tsx

// 1. ADICIONAR ESTE IMPORT no topo do arquivo:
import { managersService } from "@/services/managersService";

// 2. ADICIONAR ESTES ESTADOS no componente (após os outros useState):
const [managers, setManagers] = useState<any[]>([]);
const [loadingManagers, setLoadingManagers] = useState(true);

// 3. ADICIONAR ESTE useEffect (após os outros useEffect):
useEffect(() => {
  const loadManagers = async () => {
    try {
      setLoadingManagers(true);
      const managersData = await managersService.getManagersForSelect();
      setManagers(managersData);
      console.log('✅ Managers loaded for form:', managersData);
    } catch (error) {
      console.error('❌ Error loading managers:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar gestores",
        variant: "destructive"
      });
    } finally {
      setLoadingManagers(false);
    }
  };

  loadManagers();
}, [toast]);

// 4. SUBSTITUIR o FormField do gestorId por este código:

<FormField
  control={form.control}
  name="gestorId"
  render={({ field }) => (
    <FormItem>
      <FormLabel className="flex items-center gap-2">
        <Users className="h-4 w-4" />
        Gestor Responsável *
      </FormLabel>
      <Select onValueChange={field.onChange} defaultValue={field.value}>
        <FormControl>
          <SelectTrigger className="h-12">
            <SelectValue placeholder="Selecione um gestor" />
          </SelectTrigger>
        </FormControl>
        <SelectContent>
          {loadingManagers ? (
            <SelectItem value="loading" disabled>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-muted animate-pulse"></div>
                <span>Carregando gestores...</span>
              </div>
            </SelectItem>
          ) : managers.length === 0 ? (
            <SelectItem value="empty" disabled>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>Nenhum gestor encontrado</span>
              </div>
            </SelectItem>
          ) : (
            managers.map((manager) => (
              <SelectItem key={manager.id} value={manager.id}>
                <div className="flex items-center gap-3 py-1">
                  {manager.avatar_url ? (
                    <img 
                      src={manager.avatar_url} 
                      alt={manager.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs flex items-center justify-center font-medium">
                      {manager.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                    </div>
                  )}
                  <div className="flex flex-col">
                    <span className="font-medium">{manager.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {manager.department} • {manager.clientsCount || 0} clientes
                    </span>
                  </div>
                </div>
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
      <FormDescription>
        Escolha o gestor que será responsável por este cliente
      </FormDescription>
      <FormMessage />
    </FormItem>
  )}
/>

// 5. REMOVER OU COMENTAR as linhas dos gestores mockados:
// const mockGestores = [
//   { id: "gest1", nome: "Sarah Chen", avatar: "👩‍💼" },
//   { id: "gest2", nome: "Marcus Johnson", avatar: "👨‍💼" },
//   { id: "gest3", nome: "Elena Rodriguez", avatar: "👩‍💼" },
// ];

// 6. ATUALIZAR a validação do schema (se necessário):
// No clientSchema, certifique-se que o gestorId está assim:
gestorId: z.string().min(1, "Gestor é obrigatório"),
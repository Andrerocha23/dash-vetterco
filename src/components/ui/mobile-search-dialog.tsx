import { useState } from "react";
import { Search, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface MobileSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  placeholder?: string;
  onSearch?: (query: string) => void;
}

export function MobileSearchDialog({ 
  open, 
  onOpenChange, 
  placeholder = "Buscar...",
  onSearch 
}: MobileSearchDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = () => {
    onSearch?.(searchQuery);
    onOpenChange(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 max-w-full h-full m-0 rounded-none border-0">
        <DialogHeader className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-5 w-5" />
            </Button>
            <DialogTitle className="flex-1">Buscar</DialogTitle>
          </div>
        </DialogHeader>
        
        <div className="p-4">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={placeholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="pl-10 text-base h-12"
              autoFocus
            />
          </div>
          
          <Button 
            onClick={handleSearch}
            className="w-full h-12"
            disabled={!searchQuery.trim()}
          >
            Buscar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
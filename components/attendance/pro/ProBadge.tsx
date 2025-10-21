import { Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function ProBadge() {
  return (
    <Badge 
      variant="default" 
      className="ml-2 gap-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0"
    >
      <Sparkles className="h-3 w-3" />
      PRO
    </Badge>
  );
}


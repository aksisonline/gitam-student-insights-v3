import { Lock, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { ProFeatureLockProps } from '@/lib/types';

export function ProFeatureLock({
  featureName,
  description,
  previewImage,
}: ProFeatureLockProps) {
  return (
    <Card className="border-2 border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-16 px-6">
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 blur-2xl rounded-full"></div>
          <div className="relative p-6 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full">
            <Lock className="h-16 w-16 text-purple-600 dark:text-purple-400" />
          </div>
        </div>
        
        <div className="text-center space-y-3 max-w-md">
          <div className="flex items-center justify-center gap-2">
            <h3 className="text-2xl font-bold">{featureName}</h3>
            <Badge 
              variant="default" 
              className="gap-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0"
            >
              <Sparkles className="h-3 w-3" />
              PRO
            </Badge>
          </div>
          
          {description && (
            <p className="text-muted-foreground text-sm leading-relaxed">
              {description}
            </p>
          )}
          
          {previewImage && (
            <div className="mt-6 rounded-lg overflow-hidden border border-border opacity-50">
              <img 
                src={previewImage} 
                alt={`${featureName} preview`}
                className="w-full h-auto blur-sm"
              />
            </div>
          )}
          
          <div className="pt-4">
            <Button 
              size="lg"
              className="gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
            >
              <Sparkles className="h-4 w-4" />
              Upgrade to Pro
            </Button>
            
            <p className="text-xs text-muted-foreground mt-3">
              Unlock this feature and more with Pro subscription
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


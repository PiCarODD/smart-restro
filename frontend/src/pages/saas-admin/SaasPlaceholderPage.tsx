import { useLocation } from 'react-router-dom';
import { Construction } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export function SaasPlaceholderPage() {
  const location = useLocation();
  const pageName = location.pathname.split('/').pop() || 'Page';
  const formattedName = pageName.charAt(0).toUpperCase() + pageName.slice(1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{formattedName}</h1>
        <p className="text-muted-foreground">SaaS Admin - {formattedName}</p>
      </div>

      <Card>
        <CardContent className="py-16 text-center">
          <Construction className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Coming Soon</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            This page is under construction. The {formattedName.toLowerCase()} management
            features will be available in a future update.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

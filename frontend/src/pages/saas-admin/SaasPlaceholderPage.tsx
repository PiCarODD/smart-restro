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
        <h1 className="text-2xl font-bold text-white">{formattedName}</h1>
        <p className="text-slate-400">SaaS Admin - {formattedName}</p>
      </div>

      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="py-16 text-center">
          <Construction className="h-16 w-16 mx-auto text-slate-600 mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Coming Soon</h2>
          <p className="text-slate-400 max-w-md mx-auto">
            This page is under construction. The {formattedName.toLowerCase()} management 
            features will be available when the backend is implemented.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}


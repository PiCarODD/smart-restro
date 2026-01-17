import { Home, ArrowLeft, Ghost, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigationStore } from '@/store/navigationStore';

export function NotFoundPage() {
    const { goBack, navigate } = useNavigationStore();

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

            <div className="max-w-md w-full text-center space-y-8 animate-in zoom-in duration-500">
                <div className="relative inline-block">
                    <div className="text-[150px] font-black leading-none text-muted selection:bg-primary/20">
                        404
                    </div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                        <Ghost className="h-20 w-20 text-primary animate-bounce duration-[2000ms]" />
                    </div>
                </div>

                <div className="space-y-3">
                    <h1 className="text-3xl font-bold tracking-tight">Oops! Page not found</h1>
                    <p className="text-muted-foreground">
                        The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <Button
                        variant="outline"
                        size="lg"
                        className="w-full sm:w-auto gap-2"
                        onClick={goBack}
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Go Back
                    </Button>
                    <Button
                        size="lg"
                        className="w-full sm:w-auto gap-2 bg-gradient-to-r from-primary to-primary/80 hover:opacity-90"
                        onClick={() => navigate('dashboard')}
                    >
                        <Home className="h-4 w-4" />
                        Return Home
                    </Button>
                </div>

                <div className="pt-8 flex items-center justify-center gap-2 text-sm text-muted-foreground border-t border-border/50">
                    <Search className="h-4 w-4" />
                    <span>Try searching for something else or contact support.</span>
                </div>
            </div>
        </div>
    );
}

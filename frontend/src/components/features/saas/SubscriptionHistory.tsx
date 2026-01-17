import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { saasApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';

interface SubscriptionHistoryProps {
    tenantId: string;
    className?: string;
}

export function SubscriptionHistory({ tenantId, className }: SubscriptionHistoryProps) {
    const [history, setHistory] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadHistory = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const data = await saasApi.getSubscriptionHistory(tenantId);
                setHistory(data.history || []);
            } catch (err: any) {
                setError(err?.message || 'Failed to load subscription history');
            } finally {
                setIsLoading(false);
            }
        };

        if (tenantId) {
            loadHistory();
        }
    }, [tenantId]);

    if (isLoading) {
        return (
            <Card className={className}>
                <CardHeader>
                    <CardTitle>Subscription History</CardTitle>
                    <CardDescription>Track changes to subscription plan</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card className={className}>
                <CardHeader>
                    <CardTitle>Subscription History</CardTitle>
                    <CardDescription>Track changes to subscription plan</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-sm text-destructive">{error}</div>
                </CardContent>
            </Card>
        );
    }

    if (history.length === 0) {
        return (
            <Card className={className}>
                <CardHeader>
                    <CardTitle>Subscription History</CardTitle>
                    <CardDescription>Track changes to subscription plan</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-sm text-muted-foreground text-center py-8">
                        No subscription history available
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle>Subscription History</CardTitle>
                <CardDescription>Track changes to subscription plan</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {history.map((entry, index) => (
                        <div
                            key={entry.id || index}
                            className="flex items-start gap-4 pb-4 border-b last:border-0"
                        >
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium">{entry.action}</span>
                                    {entry.previousValue && entry.newValue && (
                                        <>
                                            <Badge variant="outline">{entry.previousValue}</Badge>
                                            <span className="text-muted-foreground">→</span>
                                            <Badge>{entry.newValue}</Badge>
                                        </>
                                    )}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    {formatDate(entry.timestamp)}
                                    {entry.performedBy && (
                                        <> • by {entry.performedBy}</>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

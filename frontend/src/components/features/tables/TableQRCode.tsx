import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQRStore } from '@/store/qrStore';
import { QrCode, RefreshCw, X, Copy, Download } from 'lucide-react';

interface TableQRCodeProps {
  tableId: string;
  tableNumber: string;
}

export function TableQRCode({ tableId, tableNumber }: TableQRCodeProps) {
  const { qrCodes, loading, error, generateQRCode, regenerateQRCode, invalidateQRCode, getQRCode } = useQRStore();
  const [qrCode, setQRCode] = useState(getQRCode(tableId));

  useEffect(() => {
    // Load QR code if not in store
    if (!qrCode && !loading) {
      generateQRCode(tableId).catch(() => {
        // Error handled by store
      });
    } else {
      setQRCode(getQRCode(tableId));
    }
  }, [tableId, qrCode, loading]);

  useEffect(() => {
    setQRCode(getQRCode(tableId));
  }, [qrCodes, tableId]);

  const handleGenerate = async () => {
    try {
      await generateQRCode(tableId);
      // QR code generated successfully
    } catch (err) {
      console.error('Failed to generate QR code:', err);
    }
  };

  const handleRegenerate = async () => {
    try {
      await regenerateQRCode(tableId);
      // QR code regenerated successfully
    } catch (err) {
      console.error('Failed to regenerate QR code:', err);
    }
  };

  const handleInvalidate = async () => {
    try {
      await invalidateQRCode(tableId);
      // QR code invalidated
    } catch (err) {
      console.error('Failed to invalidate QR code:', err);
    }
  };

  const handleCopyUrl = () => {
    if (qrCode?.qrUrl) {
      navigator.clipboard.writeText(qrCode.qrUrl);
      // URL copied to clipboard
    }
  };

  const handleDownload = () => {
    if (qrCode?.qrCodeImage) {
      const link = document.createElement('a');
      link.href = qrCode.qrCodeImage;
      link.download = `qr-table-${tableNumber}.png`;
      link.click();
    }
  };

  if (loading && !qrCode) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error && !qrCode) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>QR Code</CardTitle>
          <CardDescription>Failed to load QR code</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive mb-4">{error}</p>
          <Button onClick={handleGenerate}>
            <QrCode className="h-4 w-4 mr-2" />
            Generate QR Code
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!qrCode) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>QR Code</CardTitle>
          <CardDescription>No QR code generated for this table</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleGenerate}>
            <QrCode className="h-4 w-4 mr-2" />
            Generate QR Code
          </Button>
        </CardContent>
      </Card>
    );
  }

  const isExpired = qrCode.isExpired || !qrCode.isValid;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="h-5 w-5" />
          QR Code - Table {tableNumber}
        </CardTitle>
        <CardDescription>
          {isExpired ? 'QR code has expired' : 'Scan to view menu and create orders'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {qrCode.qrCodeImage && (
          <div className="flex justify-center">
            <div className={`p-4 bg-white rounded-lg ${isExpired ? 'opacity-50' : ''}`}>
              <img
                src={qrCode.qrCodeImage}
                alt="QR Code"
                className="w-64 h-64"
              />
            </div>
          </div>
        )}

        {isExpired && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
              This QR code has expired. Generate a new one to continue.
            </p>
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">QR URL:</span>
            <code className="flex-1 text-xs bg-muted p-2 rounded truncate">
              {qrCode.qrUrl}
            </code>
            <Button variant="outline" size="icon" onClick={handleCopyUrl}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>

          {qrCode.generatedAt && (
            <p className="text-xs text-muted-foreground">
              Generated: {new Date(qrCode.generatedAt).toLocaleString()}
            </p>
          )}

          {qrCode.expiresAt && (
            <p className="text-xs text-muted-foreground">
              Expires: {new Date(qrCode.expiresAt).toLocaleString()}
            </p>
          )}
        </div>

        <div className="flex gap-2">
          {isExpired ? (
            <Button onClick={handleGenerate} className="flex-1">
              <RefreshCw className="h-4 w-4 mr-2" />
              Generate New QR Code
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={handleRegenerate} className="flex-1">
                <RefreshCw className="h-4 w-4 mr-2" />
                Regenerate
              </Button>
              <Button variant="outline" onClick={handleInvalidate} className="flex-1">
                <X className="h-4 w-4 mr-2" />
                Invalidate
              </Button>
            </>
          )}
          {qrCode.qrCodeImage && (
            <Button variant="outline" onClick={handleDownload}>
              <Download className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

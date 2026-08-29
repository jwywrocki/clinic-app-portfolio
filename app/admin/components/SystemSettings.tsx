'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Database,
  Mail,
  Download,
  AlertCircle,
  CheckCircle,
  Clock,
  Eye,
  EyeOff,
  MapPin,
  Save,
} from 'lucide-react';
import { isEncrypted } from '@/lib/crypto';

interface SystemSettingsData {
  db_backup_enabled: string;
  db_backup_frequency: string;
  db_backup_retention_days: string;

  email_smtp_host: string;
  email_smtp_port: string;
  email_smtp_user: string;
  email_smtp_password: string;
  email_from_address: string;
  email_from_name: string;
  email_use_tls: string;

  google_maps_embed_url: string;
}

interface SystemSettingsProps {
  onSave?: (data: any) => Promise<void>;
}

interface BackupInfo {
  id: string;
  created_at: string;
  size: string;
  status: 'completed' | 'failed' | 'in_progress';
}

interface SchedulerStatus {
  scheduler_status: string;
  backup_enabled: boolean;
  backup_frequency: string;
  retention_days: number;
  last_backup: {
    created_at: string;
    status: string;
  } | null;
  next_backup: string;
  old_backups_count: number;
  old_backups: Array<{
    id: string;
    filename: string;
    created_at: string;
  }>;
}

export function SystemSettings({ onSave }: SystemSettingsProps) {
  const [settings, setSettings] = useState<SystemSettingsData>({
    db_backup_enabled: 'true',
    db_backup_frequency: 'daily',
    db_backup_retention_days: '30',
    email_smtp_host: '',
    email_smtp_port: '587',
    email_smtp_user: '',
    email_smtp_password: '',
    email_from_address: '',
    email_from_name: 'Klinika Medyczna',
    email_use_tls: 'true',
    google_maps_embed_url: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
  const [savingGoogleMaps, setSavingGoogleMaps] = useState(false);
  const [savingBackup, setSavingBackup] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isTestingEmail, setIsTestingEmail] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [backups, setBackups] = useState<BackupInfo[]>([]);
  const [schedulerStatus, setSchedulerStatus] = useState<SchedulerStatus | null>(null);
  const [isLoadingScheduler, setIsLoadingScheduler] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
    loadBackups();
    loadSchedulerStatus();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/settings');
      if (response.ok) {
        const data = await response.json();
        const settingsObj: Partial<SystemSettingsData> = {};

        data.forEach((setting: any) => {
          if (
            setting.key.startsWith('db_') ||
            setting.key.startsWith('email_') ||
            setting.key === 'google_maps_embed_url'
          ) {
            settingsObj[setting.key as keyof SystemSettingsData] = setting.value || '';
          }
        });

        setSettings(prev => ({ ...prev, ...settingsObj }));
      }
    } catch (error) {
      console.error('Error loading system settings:', error);
      toast({
        title: 'Błąd',
        description: 'Błąd podczas ładowania ustawień systemowych',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadBackups = async () => {
    try {
      const response = await fetch('/api/admin/backups');
      if (response.ok) {
        const data = await response.json();
        setBackups(data);
      }
    } catch (error) {
      console.error('Error loading backups:', error);
    }
  };

  const loadSchedulerStatus = async () => {
    setIsLoadingScheduler(true);
    try {
      const response = await fetch('/api/admin/scheduler');
      if (response.ok) {
        const data = await response.json();
        setSchedulerStatus(data);
      }
    } catch (error) {
      console.error('Error loading scheduler status:', error);
      toast({
        title: 'Błąd',
        description: 'Błąd podczas ładowania statusu automatycznych backupów',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingScheduler(false);
    }
  };

  const saveEmailSettings = async () => {
    setSavingEmail(true);
    try {
      const emailSettings = Object.entries(settings)
        .filter(([key]) => key.startsWith('email_'))
        .map(([key, value]) => ({
          key,
          value,
          description: getSettingDescription(key),
        }));

      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settings: emailSettings }),
      });

      if (response.ok) {
        toast({
          title: 'Sukces',
          description: 'Konfiguracja email została zapisana',
          variant: 'success',
        });
      } else {
        throw new Error('Failed to save email settings');
      }
    } catch (error) {
      console.error('Error saving email settings:', error);
      toast({
        title: 'Błąd',
        description: 'Błąd podczas zapisywania konfiguracji email',
        variant: 'destructive',
      });
    } finally {
      setSavingEmail(false);
    }
  };

  const saveGoogleMapsSettings = async () => {
    setSavingGoogleMaps(true);
    try {
      const googleMapsSettings = [
        {
          key: 'google_maps_embed_url',
          value: settings.google_maps_embed_url,
          description: getSettingDescription('google_maps_embed_url'),
        },
      ];

      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settings: googleMapsSettings }),
      });

      if (response.ok) {
        toast({
          title: 'Sukces',
          description: 'Integracja z Google Maps została zapisana',
          variant: 'success',
        });
      } else {
        throw new Error('Failed to save Google Maps settings');
      }
    } catch (error) {
      console.error('Error saving Google Maps settings:', error);
      toast({
        title: 'Błąd',
        description: 'Błąd podczas zapisywania integracji z Google Maps',
        variant: 'destructive',
      });
    } finally {
      setSavingGoogleMaps(false);
    }
  };

  const saveBackupSettings = async () => {
    setSavingBackup(true);
    try {
      const backupSettings = Object.entries(settings)
        .filter(([key]) => key.startsWith('db_backup_'))
        .map(([key, value]) => ({
          key,
          value,
          description: getSettingDescription(key),
        }));

      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settings: backupSettings }),
      });

      if (response.ok) {
        toast({
          title: 'Sukces',
          description: 'Ustawienia kopii zapasowych zostały zapisane',
          variant: 'success',
        });

        // Restart schedulera when backup settings change
        await restartBuiltinScheduler();
      } else {
        throw new Error('Failed to save backup settings');
      }
    } catch (error) {
      console.error('Error saving backup settings:', error);
      toast({
        title: 'Błąd',
        description: 'Błąd podczas zapisywania ustawień kopii zapasowych',
        variant: 'destructive',
      });
    } finally {
      setSavingBackup(false);
    }
  };

  const getSettingDescription = (key: string) => {
    const descriptions: Record<string, string> = {
      db_backup_enabled: 'Włączenie automatycznych kopii zapasowych bazy danych',
      db_backup_frequency: 'Częstotliwość tworzenia kopii zapasowych',
      db_backup_retention_days: 'Czas przechowywania kopii zapasowych w dniach',
      email_smtp_host: 'Adres serwera SMTP',
      email_smtp_port: 'Port serwera SMTP',
      email_smtp_user: 'Nazwa użytkownika SMTP',
      email_smtp_password: 'Hasło SMTP',
      email_from_address: 'Adres nadawcy wiadomości email',
      email_from_name: 'Nazwa nadawcy wiadomości email',
      email_use_tls: 'Użycie szyfrowania TLS dla SMTP',
      google_maps_embed_url: 'URL do osadzenia mapy Google Maps na stronie kontaktu',
    };
    return descriptions[key] || '';
  };

  const updateSetting = (key: keyof SystemSettingsData, value: string) => {
    // If current password is encrypted and user enters the placeholder, ignore
    if (key === 'email_smtp_password' && value === '••••••••••••••••') {
      return;
    }
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleTestEmail = async () => {
    setIsTestingEmail(true);
    try {
      const response = await fetch('/api/admin/test-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settings }),
      });

      if (response.ok) {
        toast({
          title: 'Sukces',
          description: 'Wiadomość testowa została wysłana',
          variant: 'success',
        });
      } else {
        throw new Error('Failed to send test email');
      }
    } catch (error) {
      toast({
        title: 'Błąd',
        description: 'Błąd podczas wysyłania wiadomości testowej',
        variant: 'destructive',
      });
    } finally {
      setIsTestingEmail(false);
    }
  };

  const handleBackupNow = async () => {
    setIsBackingUp(true);
    try {
      const response = await fetch('/api/admin/backups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        toast({
          title: 'Sukces',
          description: 'Kopia zapasowa została utworzona',
          variant: 'success',
        });
        await loadBackups();
      } else {
        throw new Error('Failed to create backup');
      }
    } catch (error) {
      toast({
        title: 'Błąd',
        description: 'Błąd podczas tworzenia kopii zapasowej',
        variant: 'destructive',
      });
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleDownloadBackup = async (backupId: string) => {
    try {
      const response = await fetch(`/api/admin/backups/${backupId}/download`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup-${backupId}.sql`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        throw new Error('Failed to download backup');
      }
    } catch (error) {
      toast({
        title: 'Błąd',
        description: 'Błąd podczas pobierania kopii zapasowej',
        variant: 'destructive',
      });
    }
  };

  const handleAutoBackup = async () => {
    setIsLoadingScheduler(true);
    try {
      const response = await fetch('/api/admin/scheduler?task=backup', {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: 'Sukces',
          description: data.message || 'Automatyczny backup został uruchomiony',
          variant: 'success',
        });
        await loadBackups();
        await loadSchedulerStatus();
      } else {
        throw new Error('Failed to trigger automatic backup');
      }
    } catch (error) {
      toast({
        title: 'Błąd',
        description: 'Błąd podczas uruchamiania automatycznego backupu',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingScheduler(false);
    }
  };

  const handleCleanupOldBackups = async () => {
    setIsLoadingScheduler(true);
    try {
      const response = await fetch('/api/admin/scheduler?task=cleanup', {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: 'Sukces',
          description: data.message || 'Czyszczenie starych backupów zostało uruchomione',
          variant: 'success',
        });
        await loadBackups();
        await loadSchedulerStatus();
      } else {
        throw new Error('Failed to trigger backup cleanup');
      }
    } catch (error) {
      toast({
        title: 'Błąd',
        description: 'Błąd podczas czyszczenia starych backupów',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingScheduler(false);
    }
  };

  const restartBuiltinScheduler = async () => {
    try {
      const response = await fetch('/api/admin/scheduler', {
        method: 'PUT',
      });

      if (response.ok) {
        toast({
          title: 'Sukces',
          description: 'Wbudowany scheduler został zrestartowany',
          variant: 'success',
        });
      }
    } catch (error) {
      console.error('Błąd restartu schedulera:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Email Configuration */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-green-600" />
            Konfiguracja email
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={handleTestEmail} variant="outline" size="sm" disabled={isTestingEmail}>
              {isTestingEmail ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                  Wysyłanie...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Test email
                </>
              )}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email_smtp_host">Serwer SMTP</Label>
              <Input
                id="email_smtp_host"
                value={settings.email_smtp_host}
                onChange={e => updateSetting('email_smtp_host', e.target.value)}
                placeholder="smtp.gmail.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email_smtp_port">Port</Label>
              <Input
                id="email_smtp_port"
                value={settings.email_smtp_port}
                onChange={e => updateSetting('email_smtp_port', e.target.value)}
                placeholder="587"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email_smtp_user">Użytkownik</Label>
              <Input
                id="email_smtp_user"
                value={settings.email_smtp_user}
                onChange={e => updateSetting('email_smtp_user', e.target.value)}
                placeholder="user@example.com"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="email_smtp_password">Hasło SMTP</Label>
                {settings.email_smtp_password && (
                  <Badge
                    variant={isEncrypted(settings.email_smtp_password) ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {isEncrypted(settings.email_smtp_password)
                      ? '🔒 Zaszyfrowane'
                      : '📝 Nowe hasło'}
                  </Badge>
                )}
              </div>
              <div className="relative">
                <Input
                  id="email_smtp_password"
                  type={showPassword ? 'text' : 'password'}
                  value={
                    isEncrypted(settings.email_smtp_password)
                      ? '••••••••••••••••'
                      : settings.email_smtp_password
                  }
                  onChange={e => updateSetting('email_smtp_password', e.target.value)}
                  placeholder={
                    isEncrypted(settings.email_smtp_password)
                      ? 'Wprowadź nowe hasło aby zmienić'
                      : 'Wprowadź hasło SMTP'
                  }
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                  disabled={isEncrypted(settings.email_smtp_password)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {settings.email_smtp_password && !isEncrypted(settings.email_smtp_password) && (
                <p className="text-xs text-blue-600">
                  💡 Hasło zostanie automatycznie zaszyfrowane przy zapisie
                </p>
              )}
              {isEncrypted(settings.email_smtp_password) && (
                <p className="text-xs text-green-600">
                  ✅ Hasło jest bezpiecznie przechowywane w zaszyfrowanej formie
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email_from_address">Adres nadawcy</Label>
              <Input
                id="email_from_address"
                value={settings.email_from_address}
                onChange={e => updateSetting('email_from_address', e.target.value)}
                placeholder="noreply@klinika.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email_from_name">Nazwa nadawcy</Label>
              <Input
                id="email_from_name"
                value={settings.email_from_name}
                onChange={e => updateSetting('email_from_name', e.target.value)}
                placeholder="Klinika Medyczna"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="email_use_tls"
              checked={settings.email_use_tls === 'true'}
              onCheckedChange={checked => updateSetting('email_use_tls', checked.toString())}
            />
            <Label htmlFor="email_use_tls">Użyj szyfrowania TLS</Label>
          </div>
        </CardContent>
        <div className="border-t bg-gray-50 px-6 py-4 rounded-b-lg">
          <div className="flex justify-end">
            <Button
              onClick={saveEmailSettings}
              disabled={savingEmail}
              size="sm"
              className="bg-green-600 hover:bg-green-700"
            >
              <Save className="h-4 w-4 mr-2" />
              {savingEmail ? 'Zapisywanie...' : 'Zapisz konfigurację email'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Google Maps Integration */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-green-600" />
            Integracja z Google Maps
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="google_maps_embed_url">URL do osadzenia mapy Google Maps</Label>
            <Input
              id="google_maps_embed_url"
              value={settings.google_maps_embed_url}
              onChange={e => updateSetting('google_maps_embed_url', e.target.value)}
              placeholder="https://www.google.com/maps/embed?pb=..."
            />
            <p className="text-xs text-gray-500 mt-1">
              Aby uzyskać link do osadzenia, przejdź do Google Maps, znajdź lokalizację, kliknij
              &quot;Udostępnij&quot; → &quot;Osadź mapę&quot; i skopiuj URL z iframe src
            </p>
          </div>
          {settings.google_maps_embed_url && (
            <div className="p-3 bg-green-50 rounded-lg">
              <p className="text-sm text-green-800">
                ✅ Mapa zostanie wyświetlona na dole strony kontaktu
              </p>
            </div>
          )}
        </CardContent>
        <div className="border-t bg-gray-50 px-6 py-4 rounded-b-lg">
          <div className="flex justify-end">
            <Button
              onClick={saveGoogleMapsSettings}
              disabled={savingGoogleMaps}
              size="sm"
              className="bg-green-600 hover:bg-green-700"
            >
              <Save className="h-4 w-4 mr-2" />
              {savingGoogleMaps ? 'Zapisywanie...' : 'Zapisz Google Maps'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Database Backups */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-blue-600" />
            Kopie zapasowe bazy danych
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="font-medium">Utwórz kopię zapasową</h4>
              <p className="text-sm text-gray-600">
                Ostatnia kopia:{' '}
                {backups.length > 0
                  ? new Date(backups[0]!.created_at).toLocaleString('pl-PL')
                  : 'Brak'}
              </p>
            </div>
            <Button onClick={handleBackupNow} variant="outline" size="sm" disabled={isBackingUp}>
              {isBackingUp ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                  Tworzenie...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Utwórz teraz
                </>
              )}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="db_backup_enabled"
                checked={settings.db_backup_enabled === 'true'}
                onCheckedChange={checked => updateSetting('db_backup_enabled', checked.toString())}
              />
              <Label htmlFor="db_backup_enabled">Automatyczne kopie</Label>
            </div>
            <div className="space-y-2">
              <Label htmlFor="db_backup_frequency">Częstotliwość</Label>
              <Select
                value={settings.db_backup_frequency}
                onValueChange={value => updateSetting('db_backup_frequency', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Codziennie</SelectItem>
                  <SelectItem value="weekly">Co tydzień</SelectItem>
                  <SelectItem value="monthly">Co miesiąc</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="db_backup_retention_days">Przechowywanie (dni)</Label>
              <Input
                id="db_backup_retention_days"
                type="number"
                value={settings.db_backup_retention_days}
                onChange={e => updateSetting('db_backup_retention_days', e.target.value)}
              />
            </div>
          </div>

          {/* Backup History */}
          {backups.length > 0 && (
            <div className="mt-6">
              <h5 className="font-medium mb-3">Historia kopii zapasowych</h5>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {backups.slice(0, 10).map(backup => (
                  <div
                    key={backup.id}
                    className="flex items-center justify-between p-3 bg-white border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {backup.status === 'completed' && (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                      {backup.status === 'failed' && (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      )}
                      {backup.status === 'in_progress' && (
                        <Clock className="h-4 w-4 text-blue-500" />
                      )}
                      <div>
                        <div className="text-sm font-medium">
                          {new Date(backup.created_at).toLocaleString('pl-PL')}
                        </div>
                        <div className="text-xs text-gray-500">{backup.size}</div>
                      </div>
                    </div>
                    {backup.status === 'completed' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownloadBackup(backup.id)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
        <div className="border-t bg-gray-50 px-6 py-4 rounded-b-lg">
          <div className="flex justify-end">
            <Button
              onClick={saveBackupSettings}
              disabled={savingBackup}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Save className="h-4 w-4 mr-2" />
              {savingBackup ? 'Zapisywanie...' : 'Zapisz ustawienia kopii'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Automatic Backup Status */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-blue-600" />
            Status automatycznych kopii zapasowych
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Ostatni backup</h4>
            <Button
              onClick={loadSchedulerStatus}
              variant="ghost"
              size="sm"
              disabled={isLoadingScheduler}
            >
              {isLoadingScheduler ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
              ) : (
                <Clock className="h-4 w-4" />
              )}
            </Button>
          </div>

          {schedulerStatus && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-blue-800">Status</span>
                  <Badge variant={schedulerStatus.backup_enabled ? 'default' : 'secondary'}>
                    {schedulerStatus.backup_enabled ? 'Włączone' : 'Wyłączone'}
                  </Badge>
                </div>
                <p className="text-xs text-blue-600 mt-1">
                  Częstotliwość: {schedulerStatus.backup_frequency}
                </p>
              </div>

              <div className="p-3 bg-green-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-green-800">Retencja</span>
                  <span className="text-sm text-green-700">
                    {schedulerStatus.retention_days} dni
                  </span>
                </div>
                <p className="text-xs text-green-600 mt-1">
                  Starych kopii: {schedulerStatus.old_backups_count}
                </p>
              </div>

              {schedulerStatus.last_backup && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-800">Ostatni backup</span>
                  <p className="text-xs text-gray-600 mt-1">
                    {new Date(schedulerStatus.last_backup.created_at).toLocaleString('pl-PL')}
                  </p>
                  <Badge
                    variant={
                      schedulerStatus.last_backup.status === 'completed' ? 'default' : 'destructive'
                    }
                    className="mt-2"
                  >
                    {schedulerStatus.last_backup.status}
                  </Badge>
                </div>
              )}

              <div className="p-3 bg-yellow-50 rounded-lg">
                <span className="text-sm font-medium text-yellow-800">Następny backup</span>
                <p className="text-xs text-yellow-600 mt-1">
                  {new Date(schedulerStatus.next_backup).toLocaleString('pl-PL')}
                </p>
              </div>
            </div>
          )}

          {/* Scheduler Actions */}
          <div className="flex gap-2 mt-4">
            <Button
              onClick={handleAutoBackup}
              variant="outline"
              size="sm"
              disabled={isLoadingScheduler}
            >
              {isLoadingScheduler ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
              ) : (
                <Database className="h-4 w-4 mr-2" />
              )}
              Uruchom backup
            </Button>

            {schedulerStatus && schedulerStatus.old_backups_count > 0 && (
              <Button
                onClick={handleCleanupOldBackups}
                variant="outline"
                size="sm"
                disabled={isLoadingScheduler}
              >
                {isLoadingScheduler ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                ) : (
                  <AlertCircle className="h-4 w-4 mr-2" />
                )}
                Usuń stare ({schedulerStatus.old_backups_count})
              </Button>
            )}

            <Button
              onClick={restartBuiltinScheduler}
              variant="outline"
              size="sm"
              disabled={isLoadingScheduler}
            >
              {isLoadingScheduler ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
              ) : (
                <Clock className="h-4 w-4 mr-2" />
              )}
              Restart schedulera
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings as SettingsIcon, Webhook, Globe, Bell } from "lucide-react";
import { pt } from "@/i18n/pt";

export default function Settings() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{pt.settings.title}</h1>
            <p className="text-muted-foreground mt-1">{pt.settings.subtitle}</p>
          </div>
        </div>

        <Tabs defaultValue="integrations" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="integrations">{pt.settings.integrations}</TabsTrigger>
            <TabsTrigger value="notifications">{pt.settings.notifications}</TabsTrigger>
            <TabsTrigger value="general">{pt.settings.general}</TabsTrigger>
          </TabsList>

          <TabsContent value="integrations" className="space-y-6">
            <Card className="surface-elevated">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Webhook className="h-5 w-5 text-primary" />
                  Meta Business
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="meta-token">{pt.settings.accessToken}</Label>
                  <Input id="meta-token" type="password" placeholder="***************" />
                </div>
                <Button>{pt.actions.test}</Button>
              </CardContent>
            </Card>

            <Card className="surface-elevated">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-primary" />
                  Google Ads
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="google-creds">{pt.settings.credentials}</Label>
                  <Input id="google-creds" type="password" placeholder="***************" />
                </div>
                <Button>{pt.actions.test}</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card className="surface-elevated">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-primary" />
                  {pt.settings.notifications}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="enable-notifications">{pt.settings.enableNotifications}</Label>
                  <Switch id="enable-notifications" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="balance-alerts">{pt.settings.lowBalanceAlerts}</Label>
                  <Switch id="balance-alerts" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="daily-reports">{pt.settings.dailyReports}</Label>
                  <Switch id="daily-reports" defaultChecked />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="general" className="space-y-6">
            <Card className="surface-elevated">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <SettingsIcon className="h-5 w-5 text-primary" />
                  {pt.settings.general}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="org-name">{pt.settings.organizationName}</Label>
                  <Input id="org-name" defaultValue="MetaFlow" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">{pt.settings.currency}</Label>
                  <Input id="currency" defaultValue="BRL" disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">{pt.settings.timezone}</Label>
                  <Input id="timezone" defaultValue="America/Sao_Paulo" disabled />
                </div>
                <Button>{pt.actions.save}</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
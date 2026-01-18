import { Header } from '@/components/layout/header';
import { SettingsPanel } from '@/components/settings/settings-panel';

export default function SettingsPage() {
  return (
    <div className="flex flex-col h-full">
      <Header
        title="Settings"
        subtitle="Configure risk profiles, trading parameters, and symbol universe"
      />

      <div className="flex-1 p-6 overflow-auto">
        <SettingsPanel />
      </div>
    </div>
  );
}

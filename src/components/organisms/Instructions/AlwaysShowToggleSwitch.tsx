import { SettingsToggle } from '@molecules';
import { usePersistedSettingsStore } from '@stores';

export const AlwaysShowToggleSwitch: React.FC = () => {
  const { alwaysShowInstructions, setAlwaysShowInstructions } =
    usePersistedSettingsStore();
  return (
    <SettingsToggle
      title="show every time"
      isEnabled={alwaysShowInstructions}
      onToggle={setAlwaysShowInstructions}
    />
  );
};

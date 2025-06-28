import { SettingsToggle } from '@molecules';
import { usePersistedSettingsStore } from '@stores';

/**
 * AlwaysShowToggleSwitch component that controls instruction visibility preference.
 *
 * This component renders a toggle switch that allows users to control whether
 * instructions should be shown automatically every time they use the app.
 * It uses the persisted settings store to maintain the user's preference.
 *
 * @returns JSX element containing the always show instructions toggle
 *
 * @example
 * ```typescript
 * <AlwaysShowToggleSwitch />
 * ```
 */
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

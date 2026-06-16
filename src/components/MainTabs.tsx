import type { TranslationKey } from '../data/translations';

export type TabKey = 'map' | 'directory' | 'overview' | 'notes';

type Props = {
  activeTab: TabKey;
  t: (key: TranslationKey) => string;
  onChange: (tab: TabKey) => void;
};

const tabs: Array<{ key: TabKey; label: TranslationKey }> = [
  { key: 'map', label: 'friendlyMap' },
  { key: 'directory', label: 'storeDirectory' },
  { key: 'overview', label: 'friendlyOverview' },
  { key: 'notes', label: 'dataNotes' },
];

export function MainTabs({ activeTab, t, onChange }: Props) {
  return (
    <nav className="tabs" aria-label="Main sections">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          className={activeTab === tab.key ? 'active' : ''}
          onClick={() => onChange(tab.key)}
        >
          {t(tab.label)}
        </button>
      ))}
    </nav>
  );
}

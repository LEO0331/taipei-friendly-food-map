import type { TranslationKey } from '../data/translations';
import { navigationGroups as groups, navigationTabs as tabs, type TabKey } from '../data/navigation';
export type { TabKey, NavigationGroup } from '../data/navigation';

type Props = { activeTab: TabKey; t: (key: TranslationKey) => string; onChange: (tab: TabKey) => void };

export function MainTabs({ activeTab, t, onChange }: Props) {
  const activeGroup = tabs.find((tab) => tab.key === activeTab)?.group ?? 'explore';
  const visibleTabs = tabs.filter((tab) => tab.group === activeGroup);

  return (
    <nav className="section-navigation" aria-label={t('navigationSections')}>
      <div className="primary-tabs" aria-label={t('navigationSections')}>
        {groups.map((group) => (
          <button
            type="button"
            key={group.key}
            className={activeGroup === group.key ? 'active' : ''}
            aria-pressed={activeGroup === group.key}
            onClick={() => onChange(tabs.find((tab) => tab.group === group.key)?.key ?? 'map')}
          >
            {t(group.label)}
          </button>
        ))}
      </div>
      <div className="secondary-tabs" aria-label={t('currentSectionPages')}>
        {visibleTabs.map((tab) => (
          <button
            type="button"
            key={tab.key}
            className={activeTab === tab.key ? 'active' : ''}
            aria-current={activeTab === tab.key ? 'page' : undefined}
            onClick={() => onChange(tab.key)}
          >
            {t(tab.label)}
          </button>
        ))}
      </div>
    </nav>
  );
}

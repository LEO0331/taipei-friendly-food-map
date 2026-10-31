import { navigationGroups, navigationTabs, type NavigationGroup } from '../data/navigation';
import { translations } from '../data/translations';

/** Search the existing bilingual catalogue only; no data records or network calls. */
export function searchNavigation(query: string, group: NavigationGroup | null = null) {
  const normalized = query.trim().toLocaleLowerCase();
  return navigationTabs.filter(tab => {
    if (group && tab.group !== group) return false;
    const label = navigationGroups.find(item => item.key === tab.group)!.label;
    return [tab.key, translations.zh[tab.label], translations.en[tab.label], translations.zh[label], translations.en[label]]
      .some(value => value.toLocaleLowerCase().includes(normalized));
  });
}

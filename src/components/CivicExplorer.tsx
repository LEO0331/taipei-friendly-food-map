import { useEffect, useRef, useState } from 'react';
import { navigationGroups, type NavigationGroup, type TabKey } from '../data/navigation';
import type { TranslationKey } from '../data/translations';
import { searchNavigation } from '../lib/explorerNavigation';
import { HexHub } from './explorer/HexHub';
import '../styles/civicExplorer.css';

type Props = { activeTab: TabKey; t: (key: TranslationKey) => string; onChange: (tab: TabKey) => void };

/** Four-group host adapter: no location, filters, source records or fetching responsibilities. */
export default function CivicExplorer({ activeTab, t, onChange }: Props) {
  const [selectedGroup, setSelectedGroup] = useState<NavigationGroup | null>(null);
  const [query, setQuery] = useState('');
  const [listOnly, setListOnly] = useState(false);
  const results = useRef<HTMLHeadingElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const tabs = searchNavigation(query, selectedGroup);
  const selected = navigationGroups.find(group => group.key === selectedGroup);

  useEffect(() => {
    // Announce the new category only after its heading and results have committed.
    if (selectedGroup) results.current?.focus();
  }, [selectedGroup]);

  return <div className="civic-explorer">
    <p className="civic-intro">{t('explorerIntroduction')}</p>
    <div className="civic-toolbar">
      <label><span>{t('explorerSearch')}</span><input ref={search} type="search" value={query}
        onChange={event => setQuery(event.target.value)} placeholder={t('explorerSearchHint')} /></label>
      <button type="button" aria-pressed={listOnly} onClick={() => setListOnly(!listOnly)}>{t('explorerList')}</button>
    </div>
    {!listOnly && <div className="civic-hubs" role="group" aria-label={t('navigationSections')}>
      {navigationGroups.map((group, index) => <HexHub key={group.key} label={t(group.label)} index={index}
        selected={selectedGroup === group.key} onSelect={() => setSelectedGroup(group.key)} />)}
    </div>}
    <div className="civic-result-header">
      <h3 ref={results} tabIndex={-1}>{selected ? t(selected.label) : t('explorerAllModules')}</h3>
      <p role="status">{t('explorerResultCount')}: {tabs.length}</p>
      {(selectedGroup || query) && <button type="button" onClick={() => {
        setSelectedGroup(null); setQuery(''); search.current?.focus();
      }}>{t('explorerReset')}</button>}
    </div>
    <div className="civic-results">
      {tabs.length === 0 && <p>{t('explorerNoResults')}</p>}
      {navigationGroups.filter(group => tabs.some(tab => tab.group === group.key)).map(group =>
        <section key={group.key} aria-labelledby={`civic-group-${group.key}`}>
          <h4 id={`civic-group-${group.key}`}>{t(group.label)}</h4>
          <ul>{tabs.filter(tab => tab.group === group.key).map(tab => <li key={tab.key}>
            <button type="button" data-civic-tab={tab.key} aria-current={activeTab === tab.key ? 'page' : undefined}
              onClick={() => onChange(tab.key)}>{t(tab.label)}<span aria-hidden="true"> ↗</span></button>
          </li>)}</ul>
        </section>)}
    </div>
    <p className="civic-source">{t('explorerSourceNotice')} <button type="button" onClick={() => onChange('notes')}>{t('dataNotes')} ↗</button></p>
  </div>;
}

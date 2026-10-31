import { Component, lazy, Suspense, useId, useRef, useState, type ReactNode } from 'react';
import type { TabKey } from '../data/navigation';
import type { TranslationKey } from '../data/translations';
import '../styles/explorerLauncher.css';

const CivicExplorer = lazy(() => import('./CivicExplorer'));

class ExplorerBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

/** Opening this optional overlay never updates App or unmounts its current module. */
export function ExplorerLauncher({ activeTab, t, onChange }: {
  activeTab: TabKey; t: (key: TranslationKey) => string; onChange: (tab: TabKey) => void;
}) {
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const heading = useId();
  const dialogId = useId();
  function close() { dialog.current?.close(); setOpen(false); }

  return <>
    <button className="civic-launch" type="button" aria-haspopup="dialog" aria-controls={dialogId}
      onClick={() => { setOpen(true); dialog.current?.showModal(); }}>{t('civicExplorer')}</button>
    <dialog className="civic-dialog" id={dialogId} ref={dialog} aria-labelledby={heading}
      onCancel={event => { event.preventDefault(); close(); }} onClose={() => setOpen(false)}>
      <header className="civic-dialog-header">
        <div><p>{t('explorerEyebrow')}</p><h2 id={heading}>{t('civicExplorer')}</h2></div>
        <button type="button" onClick={close}>{t('explorerClose')} <span aria-hidden="true">×</span></button>
      </header>
      {open && <ExplorerBoundary fallback={<p role="alert">{t('explorerUnavailable')}</p>}>
        <Suspense fallback={<p role="status">{t('loading')}</p>}>
          <CivicExplorer activeTab={activeTab} t={t} onChange={tab => { close(); onChange(tab); }} />
        </Suspense>
      </ExplorerBoundary>}
    </dialog>
  </>;
}

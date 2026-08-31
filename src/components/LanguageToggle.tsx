import type { Language } from '../types';

type Props = {
  language: Language;
  onChange: (language: Language) => void;
  label?: string;
};

export function LanguageToggle({ language, onChange, label = 'Language' }: Props) {
  return (
    <div className="language-toggle" aria-label={label}>
      <button className={language === 'zh' ? 'active' : ''} onClick={() => onChange('zh')}>
        繁中
      </button>
      <button className={language === 'en' ? 'active' : ''} onClick={() => onChange('en')}>
        EN
      </button>
    </div>
  );
}

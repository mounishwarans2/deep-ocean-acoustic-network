import { useMemo, useState } from 'react';
import { MENU_GROUPS } from '../../data/menuContent';
import type { MenuOption } from '../../data/menuContent';
import { useTheme } from '../../hooks/useTheme';
import './Menu.css';

interface Props {
  open: boolean;
  onClose: () => void;
  selectedOption: MenuOption | null;
  onSelectOption: (option: MenuOption) => void;
  onPageAction: (page: string) => void;
  onLogout: () => void;
}

export function MenuPanel({ open, onClose, selectedOption, onSelectOption, onPageAction, onLogout }: Props) {
  const [search, setSearch] = useState('');
  const [openGroups, setOpenGroups] = useState<Set<string>>(() => new Set(MENU_GROUPS.map(g => g.id)));
  const [, setTheme] = useTheme();

  const filteredGroups = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return MENU_GROUPS;
    return MENU_GROUPS
      .map(g => ({ ...g, options: g.options.filter(o => o.label.toLowerCase().includes(q)) }))
      .filter(g => g.options.length > 0);
  }, [search]);

  const toggleGroup = (id: string) => {
    setOpenGroups(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleOption = (option: MenuOption) => {
    if (option.actionType === 'page') {
      onPageAction(option.page || 'overview');
      return;
    }
    if (option.actionType === 'theme') {
      setTheme(option.theme || 'system');
      onClose();
      return;
    }
    if (option.actionType === 'logout') {
      onLogout();
      return;
    }
    onSelectOption(option);
  };

  if (!open) return null;

  return (
    <>
      <div className="menu-overlay" onClick={onClose} />
      <aside className="menu-panel">
        <div className="menu-header">
          <div className="menu-header-title">
            <span className="menu-logo">🌊</span>
            <div>
              <div className="menu-header-name">EXPLORE</div>
              <div className="menu-header-sub">Navigate the Mission Platform</div>
            </div>
          </div>
          <button className="menu-close" onClick={onClose} aria-label="Close menu">✕</button>
        </div>

        <div className="menu-search">
          <span className="menu-search-icon">🔍</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search options..."
            aria-label="Search menu"
          />
          {search && <button className="menu-search-clear" onClick={() => setSearch('')}>✕</button>}
        </div>

        <div className="menu-body">
          {filteredGroups.map(group => (
            <div className="menu-group" key={group.id}>
              <div className="menu-group-header" onClick={() => toggleGroup(group.id)}>
                <span className="menu-group-icon">{group.icon}</span>
                <span className="menu-group-label">{group.label}</span>
                <span className={`menu-chevron ${openGroups.has(group.id) ? 'open' : ''}`}>▸</span>
              </div>
              {openGroups.has(group.id) && (
                <div className="menu-group-options">
                  {group.options.map(option => {
                    const isActive = selectedOption?.id === option.id;
                    return (
                      <div
                        key={option.id}
                        className={`menu-option ${isActive ? 'active' : ''}`}
                        onClick={() => handleOption(option)}
                      >
                        <span className="menu-option-icon">{option.icon}</span>
                        <span className="menu-option-label">{option.label}</span>
                        {option.actionType === 'page' && <span className="menu-option-arrow">→</span>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
          {filteredGroups.length === 0 && (
            <div className="menu-no-results">No options match “{search}”.</div>
          )}
        </div>

        <div className="menu-footer">
          <span>Underwater Intelligence Mission Platform</span>
        </div>
      </aside>
    </>
  );
}
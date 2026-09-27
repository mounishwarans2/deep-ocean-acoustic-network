import type { CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { canGoBackInApp } from '../../utils/appHistory';

interface Props {
  /** Displayed label. Defaults to a generic history Back. */
  label?: string;
  className?: string;
  style?: CSSProperties;
}

/**
 * History Back button: returns to the previously visited page via browser
 * history. Falls back to Dashboard only when no in-app history exists
 * (fresh deep link / new session).
 */
export function BackButton({ label = '← Back', className = 'menu-content-back', style }: Props) {
  const navigate = useNavigate();

  const goBack = () => {
    if (canGoBackInApp()) {
      navigate(-1);
    } else {
      navigate('/dashboard', { replace: true });
    }
  };

  return (
    <button type="button" className={className} style={style} onClick={goBack}>
      {label}
    </button>
  );
}

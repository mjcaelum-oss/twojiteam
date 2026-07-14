import styles from './Header.module.css';

export function Header() {
  return (
    <header className={styles.topbar}>
      <div className={styles.brand}>
        <span className={styles.dot} aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M12 21s-7-6.3-7-11a7 7 0 0 1 14 0c0 4.7-7 11-7 11z" />
            <circle cx="12" cy="10" r="2.5" />
          </svg>
        </span>
        TRAVEL PICK
      </div>
      <span className={styles.avatar} aria-hidden="true">여</span>
    </header>
  );
}

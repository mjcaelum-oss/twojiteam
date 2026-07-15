import { Link } from 'react-router-dom';
import styles from './Header.module.css';

export function Header() {
  return (
    <header className={styles.topbar}>
      <Link to="/" className={styles.brand} aria-label="TRAVEL PICK 홈">
        <img src="/logo.png" alt="TRAVEL PICK" className={styles.logoImg} />
      </Link>
      <Link to="/mypage" className={styles.avatar} aria-label="마이페이지">여</Link>
    </header>
  );
}

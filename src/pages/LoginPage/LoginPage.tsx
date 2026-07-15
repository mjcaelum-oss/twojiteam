import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../app/providers/AuthProvider';
import styles from './LoginPage.module.css';

export function LoginPage() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(''); setBusy(true);
    try { await signIn(email, password); navigate('/'); } catch (caught) { setError(caught instanceof Error ? caught.message : '로그인에 실패했습니다.'); } finally { setBusy(false); }
  };
  return (
    <div className={styles.wrap}>
      <form className={styles.card} onSubmit={submit}>
        <img src="/logo.png" alt="TRAVEL PICK" className={styles.logoImg} />
        <p className={styles.sub}>국내 여행지를 취향에 맞게 골라보세요</p>

        <label className={styles.field} htmlFor="login-email">이메일
          <input id="login-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" autoComplete="username" />
        </label>
        <label className={styles.field} htmlFor="login-password">비밀번호
          <input id="login-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="비밀번호" autoComplete="current-password" />
        </label>
        {error && <p className={styles.error} role="alert">{error}</p>}

        <button type="submit" className={`button button-primary ${styles.submit}`} disabled={busy}>{busy ? '로그인 중...' : '로그인'}</button>

        <p className={styles.signup}>아직 회원이 아니신가요? <Link to="/signup">회원가입</Link></p>
      </form>
    </div>
  );
}

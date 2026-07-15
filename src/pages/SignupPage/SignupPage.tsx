import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../app/providers/AuthProvider';
import styles from './SignupPage.module.css';

export function SignupPage() {
  const [form, setForm] = useState({ nickname: '', email: '', phone: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const { signUp } = useAuth();
  const update = (key: keyof typeof form) => (event: ChangeEvent<HTMLInputElement>) => setForm((prev) => ({ ...prev, [key]: event.target.value }));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.nickname.trim()) { setError('닉네임을 입력해주세요.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { setError('올바른 이메일 형식을 입력해주세요.'); return; }
    if (!/^01[016789]-?\d{3,4}-?\d{4}$/.test(form.phone.replace(/\s/g, ''))) { setError('올바른 전화번호를 입력해주세요. (예: 010-1234-5678)'); return; }
    if (form.password.length < 8) { setError('비밀번호는 8자 이상이어야 합니다.'); return; }
    if (form.password !== form.confirm) { setError('비밀번호가 일치하지 않습니다.'); return; }
    setError(''); setBusy(true);
    try { await signUp(form.email, form.password, { display_name: form.nickname, phone: form.phone }); setDone(true); } catch (caught) { setError(caught instanceof Error ? caught.message : '회원가입에 실패했습니다.'); } finally { setBusy(false); }
  };

  if (done) {
    return (
      <div className={styles.wrap}>
        <div className={styles.card}>
          <div className={styles.doneIcon} aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M20 6 9 17l-5-5" /></svg>
          </div>
          <h1>가입이 완료되었어요</h1>
          <p className={styles.sub}>{form.nickname}님, 환영합니다. 지금 바로 여행 계획을 시작할 수 있어요.</p>
          <Link to="/" className={`button button-primary ${styles.submit}`}>여행 시작하기</Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <form className={styles.card} onSubmit={submit}>
        <img src="/logo.png" alt="TRAVEL PICK" className={styles.logoImg} />
        <h1>회원가입</h1>
        <p className={styles.sub}>이메일과 전화번호는 확인 절차 없이 계정 정보로만 저장됩니다.</p>

        <label className={styles.field} htmlFor="signup-nickname">닉네임
          <input id="signup-nickname" type="text" value={form.nickname} onChange={update('nickname')} placeholder="여행자" autoComplete="nickname" />
        </label>
        <label className={styles.field} htmlFor="signup-email">이메일
          <input id="signup-email" type="email" value={form.email} onChange={update('email')} placeholder="you@example.com" autoComplete="email" />
        </label>
        <label className={styles.field} htmlFor="signup-phone">전화번호
          <input id="signup-phone" type="tel" value={form.phone} onChange={update('phone')} placeholder="010-1234-5678" autoComplete="tel" />
        </label>
        <label className={styles.field} htmlFor="signup-password">비밀번호
          <input id="signup-password" type="password" value={form.password} onChange={update('password')} placeholder="8자 이상" autoComplete="new-password" />
        </label>
        <label className={styles.field} htmlFor="signup-confirm">비밀번호 확인
          <input id="signup-confirm" type="password" value={form.confirm} onChange={update('confirm')} placeholder="비밀번호 재입력" autoComplete="new-password" />
        </label>

        {error && <p className={styles.error} role="alert">{error}</p>}

        <button type="submit" className={`button button-primary ${styles.submit}`} disabled={busy}>{busy ? '가입 중...' : '가입하기'}</button>
        <p className={styles.login}>이미 계정이 있으신가요? <Link to="/login">로그인</Link></p>
      </form>
    </div>
  );
}

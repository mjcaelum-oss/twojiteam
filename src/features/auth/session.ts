import { readLocal, removeLocal, writeLocal } from '../../services/storage/localStorage.service';

// 로그인 여부(mock 세션). 백엔드 연동 시 실제 세션/JWT 확인으로 교체.
const KEY = 'logged-in';

export function isLoggedIn(): boolean {
  return readLocal<boolean>(KEY, false);
}
export function login(): void {
  writeLocal(KEY, true);
}
export function logout(): void {
  removeLocal(KEY);
}

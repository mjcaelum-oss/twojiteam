import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Header } from '../../components/layout/Header/Header';
import { PageContainer } from '../../components/layout/PageContainer/PageContainer';
import { Toast } from '../../components/common/Toast/Toast';
import { courseMeta } from '../../data/mock/savedCourses';
import { getSavedCourses, removeSavedCourse } from '../../features/saved-courses/savedCourses.store';
import { LIKED_KEY, seedLikedSpots } from '../../features/favorites/favorites.store';
import type { LikedSpot } from '../../features/favorites/favorites.store';
import { useAuth } from '../../app/providers/AuthProvider';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { useToast } from '../../hooks/useToast';
import { copyShareLink } from '../../features/sharing/share';
import styles from './MyPage.module.css';

const shareIcon = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" /></svg>;
const moreIcon = <svg viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" /></svg>;
const heartIcon = <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 20s-7-4.5-9.2-9C1.3 8 3 4.5 6.3 4.5c2 0 3.2 1.2 4.7 3 1.5-1.8 2.7-3 4.7-3C19 4.5 20.7 8 21.2 11c-2.2 4.5-9.2 9-9.2 9z" /></svg>;

export function MyPage() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [courses, setCourses] = useState(getSavedCourses);
  const [openCourseMenu, setOpenCourseMenu] = useState<string | null>(null);
  const [liked, setLiked] = useLocalStorage<LikedSpot[]>(LIKED_KEY, seedLikedSpots);
  const { message, showToast } = useToast();
  const share = (path: string) => { void copyShareLink(path).then((ok) => showToast(ok ? '링크가 복사되었어요.' : '복사에 실패했어요.')); };
  const shareCourse = (id: string) => { setOpenCourseMenu(null); share(`/mypage/course/${id}`); };
  const deleteCourse = (id: string) => { setCourses(removeSavedCourse(id)); setOpenCourseMenu(null); showToast('저장된 코스를 삭제했어요.'); };
  const removeLiked = (id: string) => setLiked((list) => list.filter((item) => item.id !== id));
  const onLogout = async () => { await signOut(); navigate('/login'); };

  return (
    <>
      <Header />
      <PageContainer className={styles.page}>
        <Link to="/" className={styles.back}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M15 18l-6-6 6-6" /></svg>홈으로
        </Link>

        <div className={styles.profile}>
          <div className={styles.avatar} aria-hidden="true">여</div>
          <div className={styles.info}>
            <div className={styles.name}>{user?.displayName ?? '여행자님'}</div>
            <div className={styles.id}>{user?.email}</div>
            <div className={styles.phone}>{user?.phone ?? ''}</div>
          </div>
          <button type="button" className={`button button-secondary ${styles.logout}`} onClick={onLogout}>로그아웃</button>
        </div>

        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>저장된 여행 코스</h3>
          {courses.length === 0 ? (
            <p className={styles.empty}>저장된 코스가 없어요. 여행 계획을 완성하고 저장해보세요.</p>
          ) : (
            <div className={styles.grid}>
              {courses.map((course) => (
                <div key={course.id} className={styles.savedCard}>
                  <div className={styles.courseActions}>
                    <button type="button" className={styles.moreBtn} aria-label="코스 더보기" aria-expanded={openCourseMenu === course.id} onClick={() => setOpenCourseMenu((current) => current === course.id ? null : course.id)}>{moreIcon}</button>
                    {openCourseMenu === course.id && <div className={styles.courseMenu} role="menu">
                      <button type="button" role="menuitem" onClick={() => shareCourse(course.id)}>{shareIcon}공유</button>
                      <button type="button" role="menuitem" className={styles.deleteMenuItem} onClick={() => deleteCourse(course.id)}>삭제</button>
                    </div>}
                  </div>
                  <Link to={`/mypage/course/${course.id}`} className={styles.savedLink}>
                    <div className={styles.savedThumb} aria-hidden="true">{course.initial}</div>
                    <div className={styles.savedBody}>
                      <div className={styles.savedName}>{course.name}</div>
                      <div className={styles.savedMeta}>{courseMeta(course)}</div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>찜해둔 여행지</h3>
          {liked.length === 0 ? (
            <p className={styles.empty}>찜한 여행지가 없어요. 추천 화면에서 하트를 눌러보세요.</p>
          ) : (
            <div className={styles.grid}>
              {liked.map((spot) => (
                <div key={spot.id} className={styles.likeCard}>
                  <div className={styles.likeActions}>
                    <button type="button" className={styles.likedBtn} aria-label="찜 해제" onClick={() => removeLiked(spot.id)}>{heartIcon}</button>
                    <button type="button" className={styles.iconBtn} aria-label="공유" onClick={() => share('/')}>{shareIcon}</button>
                  </div>
                  <div className={styles.likeThumb} aria-hidden="true">{spot.name.trim().charAt(0)}</div>
                  <div className={styles.likeBody}>
                    <div className={styles.likeName}>{spot.name}</div>
                    <div className={styles.likeRegion}>{spot.region}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <span className={styles.mockTag}>테스트용 목업 · 저장/찜은 localStorage에 기록됩니다</span>
      </PageContainer>
      <Toast message={message} />
    </>
  );
}

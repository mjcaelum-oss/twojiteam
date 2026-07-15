import { Link, useParams } from 'react-router-dom';
import { Header } from '../../components/layout/Header/Header';
import { PageContainer } from '../../components/layout/PageContainer/PageContainer';
import { Toast } from '../../components/common/Toast/Toast';
import { courseMeta, formatDuration } from '../../data/mock/savedCourses';
import { findSavedCourse } from '../../features/saved-courses/savedCourses.store';
import { copyShareLink } from '../../features/sharing/share';
import { useToast } from '../../hooks/useToast';
import styles from './CourseDetailPage.module.css';

const clockIcon = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>;
const pinIcon = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M12 21s-7-6.3-7-11a7 7 0 0 1 14 0c0 4.7-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></svg>;
const shareIcon = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" /></svg>;

export function CourseDetailPage() {
  const { courseId } = useParams();
  const course = findSavedCourse(courseId);
  const { message, showToast } = useToast();
  const share = () => { void copyShareLink(`/mypage/course/${courseId}`).then((ok) => showToast(ok ? '링크가 복사되었어요.' : '복사에 실패했어요.')); };
  return (
    <>
      <Header />
      <PageContainer className={styles.page}>
        <Link to="/mypage" className={styles.back}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M15 18l-6-6 6-6" /></svg>저장된 코스로
        </Link>

        {!course ? (
          <p className={styles.empty}>코스를 찾을 수 없습니다. <Link to="/mypage">마이페이지로 돌아가기</Link></p>
        ) : (
          <div className={styles.inner}>
            <div className={styles.header}>
              <div>
                <h2 className={styles.title}>{course.name}</h2>
                <p className={styles.meta}>{courseMeta(course)}</p>
              </div>
              <button type="button" className={styles.share} aria-label="공유" onClick={share}>{shareIcon}</button>
            </div>

            <ol className={styles.list}>
              {course.spots.map((spot, index) => (
                <li key={spot.name} className={styles.item}>
                  <div className={styles.index}>{index + 1}</div>
                  <div className={styles.thumb} aria-hidden="true">{spot.name.trim().charAt(0)}</div>
                  <div className={styles.body}>
                    <div className={styles.name}>{spot.name}</div>
                    <div className={styles.region}>{spot.region}</div>
                    <p className={styles.desc}>{spot.description}</p>
                    <div className={styles.metaRow}>
                      <span>{clockIcon} 체류 추천 {formatDuration(spot.durationMinutes)}</span>
                      <span>입장료 {spot.fee}</span>
                      <span>운영 {spot.hours}</span>
                    </div>
                    <div className={styles.addr}>{pinIcon} {spot.address}</div>
                  </div>
                </li>
              ))}
            </ol>

            <span className={styles.mockTag}>테스트용 목업 · 실제 저장 데이터 연동 전</span>
          </div>
        )}
      </PageContainer>
      <Toast message={message} />
    </>
  );
}

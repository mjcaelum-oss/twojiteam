import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { Header } from '../../components/layout/Header/Header';
import { PageContainer } from '../../components/layout/PageContainer/PageContainer';
import { Toast } from '../../components/common/Toast/Toast';
import { courseMeta, formatDuration } from '../../data/mock/savedCourses';
import { findSavedCourse } from '../../features/saved-courses/savedCourses.store';
import { copyShareLink } from '../../features/sharing/share';
import { useToast } from '../../hooks/useToast';
import { transportLabels } from '../../data/constants/travel.constants';
import { formatRouteCost } from '../../features/routes/routeCost.utils';
import { TravelMap } from '../../features/map/components/TravelMap';
import { buildSchedule } from '../../features/schedule-validation/scheduleValidation.service';
import { useTravelPlan } from '../../app/providers/TravelPlanProvider';
import { updateSavedCourseName } from '../../features/saved-courses/savedCourses.store';
import styles from './CourseDetailPage.module.css';

const clockIcon = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>;
const pinIcon = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M12 21s-7-6.3-7-11a7 7 0 0 1 14 0c0 4.7-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></svg>;
const shareIcon = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" /></svg>;

export function CourseDetailPage() {
  const { courseId } = useParams();
  const course = findSavedCourse(courseId);
  const navigate = useNavigate();
  const { setPlan } = useTravelPlan();
  const { message, showToast } = useToast();
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(course?.name ?? '');
  const share = () => { void copyShareLink(`/mypage/course/${courseId}`).then((ok) => showToast(ok ? '링크가 복사되었어요.' : '복사에 실패했어요.')); };
  const editPlan = () => { if (!course?.plan) return; setPlan({ ...course.plan, status: 'draft' }); navigate('/recommendations'); };
  const renameCourse = () => { if (!course || !nameDraft.trim()) return; updateSavedCourseName(course.id, nameDraft.trim()); setEditingName(false); };
  const planningDates = useMemo(() => {
    if (!course?.plan) return [];
    const dates: string[] = [];
    const start = new Date(`${course.plan.travelDate}T00:00:00`);
    const end = new Date(`${course.plan.returnDate ?? course.plan.travelDate}T00:00:00`);
    for (const cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) dates.push(`${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`);
    return dates;
  }, [course?.plan]);
  const [selectedDate, setSelectedDate] = useState('');
  const activeDate = planningDates.includes(selectedDate) ? selectedDate : planningDates[0];
  const visiblePlanSpots = course?.plan ? course.plan.spots.map((item, index) => ({ item, index })).filter(({ item }) => (item.travelDate ?? course.plan!.travelDate) === activeDate) : [];
  const visibleSpots = course?.plan ? visiblePlanSpots.map(({ index }) => ({ spot: course!.spots[index], planSpot: course!.plan!.spots[index], index })) : course?.spots.map((spot, index) => ({ spot, planSpot: undefined, index })) ?? [];
  const savedMapRoutes = course?.plan ? course.plan.spots.slice(0, -1).flatMap((item, index) => {
    const next = course.plan!.spots[index + 1];
    const sameDay = (item.travelDate ?? course.plan!.travelDate) === (next.travelDate ?? course.plan!.travelDate);
    return sameDay && course.plan!.routes[index] ? [{ origin: item.spot, destination: next.spot, mode: next.transportMode ?? 'DRIVING' as const, departureTime: buildSchedule(course.plan!)[index]?.departure }] : [];
  }) : [];
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
                {editingName ? <div className={styles.renameRow}><input className={styles.renameInput} value={nameDraft} onChange={(event) => setNameDraft(event.target.value)} maxLength={60} autoFocus /><button type="button" className={styles.renameSave} onClick={renameCourse}>저장</button><button type="button" className={styles.renameCancel} onClick={() => { setNameDraft(course.name); setEditingName(false); }}>취소</button></div> : <button type="button" className={styles.titleEdit} title="이름을 변경하려면 클릭하세요" aria-label="이름을 변경하려면 클릭하세요" onClick={() => { setNameDraft(course.name); setEditingName(true); }}>{course.name}</button>}
                <p className={styles.meta}>{courseMeta(course)}</p>
                {course.plan && <p className={styles.meta}>{course.plan.destination.name} · {course.plan.travelDate}{course.plan.returnDate && course.plan.returnDate !== course.plan.travelDate ? ` ~ ${course.plan.returnDate}` : ''}</p>}
              </div>
              <div className={styles.headerActions}>
                {course.plan && <button type="button" className={styles.edit} onClick={editPlan}>계획 수정</button>}
                <button type="button" className={styles.share} aria-label="공유" onClick={share}>{shareIcon}</button>
              </div>
            </div>

            {course.plan && <div className={styles.summary}>
              <span>여행 인원 {course.plan.partySize}명</span>
              <span>이동 {course.plan.routes.reduce((total, route) => total + (route?.durationMinutes ?? 0), 0)}분</span>
              <span>예상 비용 {formatRouteCost(course.plan.spots.reduce((total, item) => total + item.spot.feeAmount * course.plan!.partySize, 0) + course.plan.routes.reduce((total, route) => total + (route?.cost ?? 0), 0), [...course.plan.spots.map((item) => item.spot.feeCurrency), ...course.plan.routes.map((route) => route?.costCurrency)].find(Boolean) ?? 'KRW')}</span>
            </div>}

            {course.plan && <>
              <label className={styles.daySelect}>일정 날짜<select value={activeDate} onChange={(event) => setSelectedDate(event.target.value)}>{planningDates.map((date) => <option key={date} value={date}>{date}</option>)}</select></label>
              <div className={styles.mapWrap}><TravelMap spots={[]} selected={visibleSpots.map(({ planSpot }) => planSpot!.spot)} routes={savedMapRoutes.filter((route) => visiblePlanSpots.some(({ item }) => item.spot.id === route.origin.id))} /></div>
            </>}

            <ol className={styles.list}>
              {visibleSpots.map(({ spot, planSpot, index }) => (
                <div key={spot.name}>
                  <li className={styles.item}>
                    <div className={styles.index}>{index + 1}</div>
                    <div className={styles.thumb}>{spot.photoUrl ? <img src={spot.photoUrl} alt="" /> : <span aria-hidden="true">{spot.name.trim().charAt(0)}</span>}</div>
                    <div className={styles.body}>
                      <div className={styles.name}>{spot.name}</div>
                      <div className={styles.region}>{spot.region}</div>
                      {planSpot?.travelDate && <div className={styles.date}>{planSpot.travelDate} · {planSpot.arrivalAt ? new Date(planSpot.arrivalAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }) : '시간 미정'} 도착</div>}
                      <p className={styles.desc}>{spot.description}</p>
                      <div className={styles.metaRow}>
                        <span>{clockIcon} 체류 추천 {formatDuration(spot.durationMinutes)}</span>
                        <span>입장료 {spot.fee}</span>
                        <span>운영 {spot.hours}</span>
                        {planSpot?.transportMode && <span>{transportLabels[planSpot.transportMode]}</span>}
                      </div>
                      <div className={styles.addr}>{pinIcon} {spot.address}</div>
                    </div>
                  </li>
                  {course.plan && index < course.plan.routes.length && course.plan.routes[index] && <div className={styles.route}>
                    <strong>{course.plan.spots[index].spot.name} → {course.plan.spots[index + 1].spot.name}</strong>
                    <span>{transportLabels[course.plan.spots[index + 1].transportMode ?? 'DRIVING']} · {course.plan.routes[index]!.durationMinutes}분 · {(course.plan.routes[index]!.distanceMeters / 1000).toFixed(1)}km{course.plan.routes[index]!.transitDetails ? ` · ${course.plan.routes[index]!.transitDetails}` : ''}</span>
                    {course.plan.routes[index]!.costNote && <span>{course.plan.routes[index]!.cost !== null ? `${formatRouteCost(course.plan.routes[index]!.cost, course.plan.routes[index]!.costCurrency)} · ` : ''}{course.plan.routes[index]!.costNote}</span>}
                  </div>}
                </div>
              ))}
            </ol>

            {!course.plan && <span className={styles.mockTag}>테스트용 목업 데이터</span>}
          </div>
        )}
      </PageContainer>
      <Toast message={message} />
    </>
  );
}

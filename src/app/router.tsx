import { createBrowserRouter } from 'react-router-dom';
import { RootLayout } from './RootLayout';
import { SearchPage } from '../pages/SearchPage/SearchPage';
import { RecommendationPage } from '../pages/RecommendationPage/RecommendationPage';
import { ReviewPage } from '../pages/ReviewPage/ReviewPage';
import { LoginPage } from '../pages/LoginPage/LoginPage';
import { SignupPage } from '../pages/SignupPage/SignupPage';
import { MyPage } from '../pages/MyPage/MyPage';
import { CourseDetailPage } from '../pages/CourseDetailPage/CourseDetailPage';
import { RequireLogin } from '../features/auth/RequireLogin';
export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: '/', element: <RequireLogin><SearchPage /></RequireLogin> },
      { path: '/recommendations', element: <RecommendationPage /> },
      { path: '/review', element: <ReviewPage /> },
      { path: '/login', element: <LoginPage /> },
      { path: '/signup', element: <SignupPage /> },
      { path: '/mypage', element: <MyPage /> },
      { path: '/mypage/course/:courseId', element: <CourseDetailPage /> }
    ]
  }
]);

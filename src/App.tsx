import './App.scss';
import './locales/i18n';
import 'dayjs/locale/zh-cn';
import 'dayjs/locale/en';
import React from 'react'
const Dashboard = React.lazy(() => import('./components/Dashboard'))
import { useTheme } from './hooks';


export default function App() {
  useTheme();
  return (
    <React.Suspense fallback={<div style={{display:'flex',height:'100vh',alignItems:'center',justifyContent:'center',color:'var(--text)'}}><span>加载中...</span></div>}>
      <Dashboard />
    </React.Suspense>
  )
}

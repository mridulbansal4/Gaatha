import { Routes, Route } from 'react-router-dom'
import { Layout } from './components/shell/Layout.jsx'
import { CommandCenter } from './routes/CommandCenter.jsx'
import { Appraisals } from './routes/Appraisals.jsx'
import { AppraisalDetail } from './routes/AppraisalDetail.jsx'
import { Portfolio } from './routes/Portfolio.jsx'
import { EntityProfile } from './routes/EntityProfile.jsx'
import { Climate } from './routes/Climate.jsx'
import { Schemes } from './routes/Schemes.jsx'
import { AuditLog } from './routes/AuditLog.jsx'

export function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<CommandCenter />} />
        <Route path="/appraisals" element={<Appraisals />} />
        <Route path="/appraisals/:id" element={<AppraisalDetail />} />
        <Route path="/portfolio" element={<Portfolio />} />
        <Route path="/portfolio/:id" element={<EntityProfile />} />
        <Route path="/climate" element={<Climate />} />
        <Route path="/schemes" element={<Schemes />} />
        <Route path="/audit" element={<AuditLog />} />
      </Routes>
    </Layout>
  )
}

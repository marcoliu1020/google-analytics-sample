import { useEffect, useState } from 'react'
import { initAnalytics, trackEvent } from './analytics'
import './App.css'

type PlanId = 'free' | 'pro' | 'enterprise'
type SignupMethod = 'email' | 'google' | 'phone'

const plans: Array<{
  id: PlanId
  name: string
  price: number
  desc: string
}> = [
  { id: 'free', name: 'Free', price: 0, desc: '適合快速體驗與測試' },
  { id: 'pro', name: 'Pro', price: 29, desc: '小型團隊核心功能' },
  { id: 'enterprise', name: 'Enterprise', price: 99, desc: '高用量與客製需求' },
]

const features = [
  { id: 'upload', label: '上傳資料 (Upload data)' },
  { id: 'share', label: '分享報告 (Share report)' },
  { id: 'export', label: '匯出 CSV (Export CSV)' },
]

function App() {
  const [selectedPlan, setSelectedPlan] = useState<PlanId>('free')
  const [signupMethod, setSignupMethod] = useState<SignupMethod>('email')
  const [signedUp, setSignedUp] = useState(false)
  const [loggedIn, setLoggedIn] = useState(false)
  const [checkoutStarted, setCheckoutStarted] = useState(false)

  useEffect(() => {
    initAnalytics()
  }, [])

  const handleViewPricing = () => {
    trackEvent('view_pricing', { plan_id: selectedPlan })
  }

  const handleStartSignup = () => {
    trackEvent('start_signup', { method: signupMethod, plan_id: selectedPlan })
  }

  const handleSignup = () => {
    setSignedUp(true)
    setLoggedIn(true)
    trackEvent('sign_up', { method: signupMethod, plan_id: selectedPlan })
  }

  const handleLogin = () => {
    setLoggedIn(true)
    trackEvent('login', { method: signupMethod, plan_id: selectedPlan })
  }

  const handlePlanChange = (planId: PlanId) => {
    setSelectedPlan(planId)
    setCheckoutStarted(false)
    trackEvent('select_plan', { plan_id: planId })
  }

  const handleBeginCheckout = () => {
    setCheckoutStarted(true)
    const plan = plans.find((p) => p.id === selectedPlan)
    trackEvent('begin_checkout', {
      plan_id: selectedPlan,
      value: plan?.price ?? 0,
      currency: 'USD',
    })
  }

  const handlePurchase = () => {
    const plan = plans.find((p) => p.id === selectedPlan)
    trackEvent('purchase', {
      plan_id: selectedPlan,
      value: plan?.price ?? 0,
      currency: 'USD',
      transaction_id: `demo-${Date.now()}`,
    })
  }

  const handleFeatureUse = (featureId: string) => {
    trackEvent('feature_use', {
      feature_id: featureId,
      plan_id: selectedPlan,
      logged_in: loggedIn ? 'true' : 'false',
    })
  }

  return (
    <div className="page">
      <header className="hero">
        <div className="pill">GA4 Demo Site</div>
        <h1>最小可行的 GA4 事件演練</h1>
        <p className="lede">
          透過註冊、登入、方案選擇與功能點擊，驗證 GA 事件、漏斗與新/回訪用戶分析。
        </p>
        <div className="cta-row">
          <button className="primary" onClick={handleStartSignup}>
            開始註冊 (start_signup)
          </button>
          <button className="ghost" onClick={handleViewPricing}>
            查看方案 (view_pricing)
          </button>
        </div>
      </header>

      <section className="grid">
        <div className="card">
          <div className="card-head">
            <p className="eyebrow">Step 1</p>
            <h2>註冊 / 登入</h2>
          </div>
          <label className="field">
            <span>註冊方式 (method)</span>
            <select
              value={signupMethod}
              onChange={(e) => setSignupMethod(e.target.value as SignupMethod)}
            >
              <option value="email">Email</option>
              <option value="google">Google</option>
              <option value="phone">Phone</option>
            </select>
          </label>
          <div className="stack">
            <button onClick={handleSignup} className="primary">
              完成註冊 (sign_up)
            </button>
            <button onClick={handleLogin} disabled={loggedIn}>
              我是回訪用戶 (login)
            </button>
          </div>
          <p className="hint">
            回訪用戶可直接觸發 login，讓 GA 自帶的新/回訪切分與你自訂的 plan_id 一起分析。
          </p>
          <div className="state">
            <span className={signedUp ? 'dot on' : 'dot off'} />
            {signedUp ? '已註冊' : '尚未註冊'}
            <span className={loggedIn ? 'dot on' : 'dot off'} />
            {loggedIn ? '登入中' : '未登入'}
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <p className="eyebrow">Step 2</p>
            <h2>方案與付費流程</h2>
          </div>
          <div className="plans">
            {plans.map((plan) => (
              <button
                key={plan.id}
                className={`plan ${selectedPlan === plan.id ? 'active' : ''}`}
                onClick={() => handlePlanChange(plan.id)}
              >
                <div className="plan-name">{plan.name}</div>
                <div className="plan-price">${plan.price}/mo</div>
                <div className="plan-desc">{plan.desc}</div>
              </button>
            ))}
          </div>
          <div className="stack">
            <button onClick={handleBeginCheckout} className="primary">
              開始結帳 (begin_checkout)
            </button>
            <button onClick={handlePurchase} disabled={!checkoutStarted}>
              完成購買 (purchase)
            </button>
          </div>
          <p className="hint">
            begin_checkout / purchase 會帶 plan_id、value、currency，方便比對方案差異。
          </p>
        </div>

        <div className="card wide">
          <div className="card-head">
            <p className="eyebrow">Step 3</p>
            <h2>核心功能使用</h2>
          </div>
          <div className="features">
            {features.map((feature) => (
              <button
                key={feature.id}
                className="feature"
                onClick={() => handleFeatureUse(feature.id)}
              >
                {feature.label} (feature_use)
              </button>
            ))}
          </div>
          <p className="hint">
            feature_use 事件會帶 feature_id、plan_id、logged_in，可用於功能滲透率與方案差異。
          </p>
        </div>
      </section>

      <section className="panel">
        <h3>如何驗證</h3>
        <ol>
          <li>在 .env.local 填入 VITE_GA_MEASUREMENT_ID，重新啟動 dev server。</li>
          <li>開 Chrome → GA DebugView，點擊上方按鈕演練流程。</li>
          <li>在 GA「探索」建立漏斗：landing → start_signup → sign_up → begin_checkout → purchase。</li>
          <li>用 plan_id、feature_id 交叉表觀察新 / 回訪用戶差異。</li>
        </ol>
      </section>
    </div>
  )
}

export default App

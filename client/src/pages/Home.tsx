import { ArrowRight, Check, ChevronDown, Play, Sparkles, Wand2 } from "lucide-react";
import { Link } from "wouter";

const features = [
  { number: "01", title: "Research with context", text: "Turn your niche into a living feed of signals, sources, and high-potential opportunities — not empty trend-chasing." },
  { number: "02", title: "Create in your flow", text: "Move from a spark to a finished brief, script, visual, or AI video without leaving the workspace." },
  { number: "03", title: "Publish with intention", text: "Customize for every platform, schedule your week, and learn what actually compounds." },
];

const platforms = ["Instagram", "YouTube", "TikTok", "LinkedIn", "X", "Pinterest"];

function FlowMark() {
  return <span className="flow-mark" aria-hidden="true"><span /><span /><span /></span>;
}

function MiniDashboard() {
  return (
    <div className="hero-product" aria-label="FlowPost dashboard preview">
      <div className="preview-sidebar">
        <div className="preview-brand"><FlowMark /><span>flowpost</span></div>
        <div className="preview-nav-label">WORKSPACE</div>
        <div className="preview-nav active"><span className="nav-dot" />Overview</div>
        <div className="preview-nav"><span className="nav-dot" />Research <b>5</b></div>
        <div className="preview-nav"><span className="nav-dot" />My content</div>
        <div className="preview-nav"><span className="nav-dot" />Schedule</div>
        <div className="preview-nav"><span className="nav-dot" />Analytics</div>
        <div className="preview-divider" />
        <div className="preview-nav muted"><span className="nav-dot" />Connected accounts</div>
        <div className="preview-user"><div className="avatar-small">DA</div><div><strong>Daoud Ahmed</strong><small>Creator plan</small></div><ChevronDown size={12} /></div>
      </div>
      <div className="preview-main">
        <div className="preview-top"><div><span className="preview-kicker">MONDAY, SEP 16</span><h3>Good morning, Daoud <span>✦</span></h3></div><div className="preview-actions"><div className="preview-search">⌕ <span>Search</span></div><div className="preview-bell">○</div><div className="avatar-small bright">DA</div></div></div>
        <div className="preview-stats">
          <div><span>Drafts</span><strong>12</strong><small>+4 this week</small></div>
          <div><span>Scheduled</span><strong>08</strong><small className="neutral">Next up 6:00 PM</small></div>
          <div><span>Published</span><strong>24</strong><small>+18% reach</small></div>
        </div>
        <div className="preview-grid">
          <div className="preview-card opportunity-card"><div className="card-title"><span>TOP OPPORTUNITY</span><span className="live-pill">● LIVE</span></div><h4>Recovery is the new performance</h4><p>Interest is rising across fitness audiences. Low competition, high save potential.</p><div className="opportunity-score"><div><span>Interest</span><strong>92%</strong></div><div><span>Competition</span><strong>38%</strong></div><div className="score-line"><i /></div></div><button className="preview-link">Develop this idea <ArrowRight size={13} /></button></div>
          <div className="preview-card schedule-card"><div className="card-title"><span>UP NEXT</span><span className="day-pill">THIS WEEK</span></div><div className="schedule-item"><div className="time-block"><strong>6:00</strong><small>PM</small></div><div className="schedule-line orange" /><div><strong>5 signs your body needs rest</strong><small>Instagram Reel · Today</small></div><span className="platform-chip ig">IG</span></div><div className="schedule-item"><div className="time-block"><strong>10:00</strong><small>AM</small></div><div className="schedule-line blue" /><div><strong>Beginner mobility flow</strong><small>YouTube Short · Tomorrow</small></div><span className="platform-chip yt">YT</span></div><button className="preview-link">Open calendar <ArrowRight size={13} /></button></div>
        </div>
        <div className="preview-bottom"><div className="trend-title"><span>REACH THIS MONTH</span><strong>42.8K <small>+18.4%</small></strong></div><div className="chart-bars">{[32, 46, 38, 56, 49, 68, 62, 78, 72, 90, 82, 100].map((height, index) => <i key={index} style={{ height: `${height}%` }} />)}</div><div className="chart-labels"><span>Aug 19</span><span>Aug 26</span><span>Sep 02</span><span>Sep 09</span></div></div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="site-shell">
      <header className="marketing-nav">
        <Link href="/" className="brand"><FlowMark /><span>flowpost</span></Link>
        <nav className="desktop-nav"><a href="#workflow">How it works</a><a href="#features">Capabilities</a><a href="#signal">Why FlowPost</a></nav>
        <div className="nav-actions"><a className="login-link" href="/app">Log in</a><Link className="button button-small button-lime" href="/app">Start creating <ArrowRight size={15} /></Link></div>
      </header>

      <main>
        <section className="hero-section">
          <div className="hero-copy">
            <div className="eyebrow"><span className="eyebrow-star">✦</span> THE CREATOR OPERATING SYSTEM</div>
            <h1>Make the work.<br /><em>Move the world.</em></h1>
            <p className="hero-lede">FlowPost brings research, ideas, creation, publishing, and analytics into one focused workspace for creators who are building something that lasts.</p>
            <div className="hero-ctas"><Link className="button button-lime" href="/app">Build your next week <ArrowRight size={17} /></Link><a className="watch-link" href="#workflow"><span className="play-icon"><Play size={13} fill="currentColor" /></span> See how it works</a></div>
            <div className="hero-proof"><div className="proof-avatars"><span>AM</span><span>RK</span><span>JN</span><span>+</span></div><p>Join 2,400+ thoughtful creators<br /><span>turning signals into stories.</span></p></div>
          </div>
          <div className="hero-visual"><div className="hero-glow" /><div className="floating-note note-top"><Sparkles size={14} /><span>5 new opportunities</span><b>↗</b></div><MiniDashboard /><div className="floating-note note-bottom"><Wand2 size={14} /><span>Copilot is thinking…</span><i><span /><span /><span /></i></div></div>
        </section>

        <section className="signal-strip" id="signal"><div className="signal-label">BUILT FOR THE<br /><span>FULL LOOP</span></div><div className="signal-items">{["Discover", "Develop", "Create", "Customize", "Schedule", "Learn"].map((item, index) => <div key={item} className="signal-item"><span>0{index + 1}</span>{item}<ArrowRight size={14} /></div>)}</div></section>

        <section className="manifesto-section"><div className="manifesto-index">01 / 03</div><div className="manifesto-copy"><p className="section-kicker">A better kind of momentum</p><h2>Stop stitching together<br /><span>your creative life.</span></h2><p>Most tools help you publish. FlowPost helps you think. Start with a question, follow the signal, make something useful, and build a body of work you can be proud of.</p></div><div className="manifesto-aside"><div className="aside-orb"><span>✦</span></div><p>From first thought<br />to <strong>lasting impact.</strong></p></div></section>

        <section className="features-section" id="features"><div className="section-header"><div><p className="section-kicker">One workspace. Full context.</p><h2>Everything you need<br /><span>to keep going.</span></h2></div><p className="section-note">Your best work is already in you.<br />FlowPost clears the path.</p></div><div className="feature-grid">{features.map((feature) => <article key={feature.number} className="feature-card"><span className="feature-number">{feature.number}</span><div className="feature-icon">{feature.number === "01" ? "◌" : feature.number === "02" ? "✧" : "↗"}</div><h3>{feature.title}</h3><p>{feature.text}</p><a href="#workflow">Explore <ArrowRight size={14} /></a></article>)}</div></section>

        <section className="workflow-section" id="workflow"><div className="workflow-head"><p className="section-kicker">The FlowPost loop</p><h2>Ideas are a practice.<br /><span>Make yours visible.</span></h2></div><div className="workflow-stages">{["Research", "Ideate", "Create", "Publish"].map((stage, index) => <div key={stage} className={`workflow-stage stage-${index + 1}`}><div className="stage-top"><span>0{index + 1}</span><div className="stage-line" /></div><h3>{stage}</h3><p>{["Find the signal before it becomes noise.", "Turn insight into a point of view.", "Make it yours, in every format.", "Show up consistently, then learn."][index]}</p><div className="stage-symbol">{["◎", "✳", "◈", "↗"][index]}</div></div>)}</div></section>

        <section className="platform-section"><div className="platform-copy"><p className="section-kicker">Your audience, your way</p><h2>One idea.<br /><span>Everywhere it belongs.</span></h2><p>Adapt the thought, not your integrity. FlowPost gives every platform the format it deserves while keeping your voice unmistakably yours.</p><Link className="text-link" href="/app">Explore the workspace <ArrowRight size={15} /></Link></div><div className="platform-cloud">{platforms.map((platform, index) => <div key={platform} className={`platform-pill p-${index}`}><span className="platform-glyph">{["◎", "▶", "♪", "in", "𝕏", "✦"][index]}</span>{platform}</div>)}<div className="cloud-center">Your<br /><strong>voice</strong></div></div></section>

        <section className="final-cta"><div className="final-spark">✦</div><p className="section-kicker">The next good thing starts here</p><h2>Give your ideas<br /><em>somewhere to go.</em></h2><Link className="button button-lime button-large" href="/app">Start creating for free <ArrowRight size={17} /></Link><p className="cta-note">No credit card. No viral promises. Just a clearer way forward.</p></section>
      </main>

      <footer className="marketing-footer"><Link href="/" className="brand"><FlowMark /><span>flowpost</span></Link><p>Creator work, in motion.</p><div><a href="#features">Capabilities</a><a href="#workflow">How it works</a><a href="/app">Open workspace</a></div><span className="footer-meta">© 2026 FlowPost</span></footer>
    </div>
  );
}

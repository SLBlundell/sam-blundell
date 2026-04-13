import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { BookOpen, FileText, Mail, Github, Linkedin, TrendingUp, Anchor, ChevronDown, ExternalLink, Download } from 'lucide-react';

import DebtSimulator from './DebtSimulator'; 

// --- Components ---

const Section = ({ id, children, className = "" }) => (
  <section id={id} className={`py-20 md:py-32 px-6 md:px-12 max-w-4xl mx-auto relative z-10 ${className}`}>
    {children}
  </section>
);

const FadeIn = ({ children, delay = 0 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.unobserve(el);
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-1000 ease-out transform ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

// --- Fixed Background (Noise & Grid) ---
const NOISE_BG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`;

const SystemBackground = () => {
  const gridRef = useRef(null);
  const nodeRef = useRef(null);

  useEffect(() => {
    let rafId;
    const handleScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const y = window.scrollY;
        if (gridRef.current) gridRef.current.style.transform = `translateY(${y * 0.05}px)`;
        if (nodeRef.current) nodeRef.current.style.transform = `translateY(${-y * 0.1}px)`;
      });
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      <div className="absolute inset-0 bg-[#F2F0E9]"></div>
      
      {/* Noise Texture */}
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: NOISE_BG }}></div>
      
      {/* Base Grid - Moves slowly for parallax */}
      <div 
        ref={gridRef}
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(#4a4a4a 1px, transparent 1px), linear-gradient(90deg, #4a4a4a 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          willChange: 'transform', 
        }}
      ></div>

      {/* Floating Abstract Nodes */}
      <div className="absolute top-1/4 left-10 w-64 h-64 bg-stone-300 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
      <div 
        ref={nodeRef}
        className="absolute bottom-1/3 right-10 w-96 h-96 bg-stone-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10" 
        style={{ willChange: 'transform' }}
      ></div>
    </div>
  );
};

// --- Hero Graph (Absolute Positioned) ---
const HeroGraph = () => {
  const mousePosRef = useRef({ x: 0, y: 0 });
  const spreadsRef = useRef(new Array(51).fill(20));
  
  const mainPathRef = useRef(null);
  const topPathRef = useRef(null);
  const bottomPathRef = useRef(null);
  const modelPathRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      mousePosRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useEffect(() => {
    let animationFrameId;
    
    const loop = () => {
      const width = 1000;
      const segments = 50;
      const svgMouseX = (mousePosRef.current.x / (window.innerWidth || 1)) * 1000;
      
      const points = [];

      for (let i = 0; i <= segments; i++) {
        const x = (width / segments) * i;
        
        const dist = Math.abs(x - svgMouseX);
        const interactiveInfluence = Math.exp(-(dist * dist) / (150 * 150)); 
        const targetSpread = 20 + (interactiveInfluence * 60);

        const current = spreadsRef.current[i];
        const next = current + (targetSpread - current) * 0.08;
        spreadsRef.current[i] = next;
        
        const normX = (x - 500) / 500; 
        const mainY = 480 - 300 * Math.pow(Math.abs(normX), 2.2);

        points.push({ x, y: mainY, spread: next });
      }

      const createPath = (offsetFn) => {
        let d = `M ${points[0].x},${offsetFn(points[0])}`;
        for (let i = 1; i < points.length; i++) {
          d += ` L ${points[i].x},${offsetFn(points[i])}`;
        }
        return d;
      };

      const topD = createPath(p => p.y - p.spread);
      const bottomD = createPath(p => p.y + p.spread);
      const modelD = createPath(p => p.y - p.spread * 0.3 - 10);
      const mainD = createPath(p => p.y);

      if (topPathRef.current) topPathRef.current.setAttribute('d', topD);
      if (bottomPathRef.current) bottomPathRef.current.setAttribute('d', bottomD);
      if (modelPathRef.current) modelPathRef.current.setAttribute('d', modelD);
      if (mainPathRef.current) mainPathRef.current.setAttribute('d', mainD);

      animationFrameId = requestAnimationFrame(loop);
    };

    loop();
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  return (
    <div className="absolute top-0 left-0 w-full h-screen pointer-events-none z-0 overflow-hidden">
      <style>{`
        @keyframes scrollDash {
          to { stroke-dashoffset: -40; }
        }
        .scrolling-dash {
          animation: scrollDash 1s linear infinite;
        }
      `}</style>

      <svg viewBox="0 0 1000 600" className="w-full h-full" preserveAspectRatio="none">
          <path ref={topPathRef} fill="none" stroke="#5F6F7E" strokeWidth="2" strokeDasharray="4,6" className="opacity-30 scrolling-dash" />
          <path ref={bottomPathRef} fill="none" stroke="#5F6F7E" strokeWidth="2" strokeDasharray="4,6" className="opacity-30 scrolling-dash" />
          <path ref={modelPathRef} fill="none" stroke="#5F6F7E" strokeWidth="1.5" strokeDasharray="8,8" className="opacity-20" />
          <path ref={mainPathRef} fill="none" stroke="#4a4a4a" strokeWidth="3" strokeLinecap="round" className="opacity-70 drop-shadow-md" />
      </svg>
    </div>
  );
};

const projects = [
  { label: 'Bayes Optimality', href: '/sam-blundell/bayes_optimality.html', desc: 'Interactive risk space' },
  { label: 'NBA Salary Efficiency', href: '/sam-blundell/datascience_project.html', desc: 'Undergraduate Data Science project' },
];

const ProjectsDropdown = () => {
  const [open, setOpen] = useState(false);
  const timeoutRef = useRef(null);

  const show = () => {
    clearTimeout(timeoutRef.current);
    setOpen(true);
  };
  const hide = () => {
    timeoutRef.current = setTimeout(() => setOpen(false), 120);
  };

  return (
    <div className="relative" onMouseEnter={show} onMouseLeave={hide}>
      <button className="flex items-center gap-1 hover:text-stone-900 transition-colors">
        Projects
        <ChevronDown
          size={12}
          className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      <div
        className={`absolute right-0 top-full mt-2 w-52 bg-[#F2F0E9]/95 backdrop-blur-sm border border-stone-200 shadow-lg transition-all duration-200 origin-top ${
          open ? 'opacity-100 scale-y-100 translate-y-0' : 'opacity-0 scale-y-95 -translate-y-1 pointer-events-none'
        }`}
      >
        {projects.map(({ label, href, desc }) => (
          <a
            key={href}
            href={href}
            className="block px-4 py-3 group hover:bg-stone-200/60 transition-colors"
          >
            <div className="text-sm text-stone-800 font-medium group-hover:text-stone-900">{label}</div>
            <div className="text-xs text-stone-500 mt-0.5">{desc}</div>
          </a>
        ))}
      </div>
    </div>
  );
};

const NavBar = () => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    let rafId;
    const handleScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => setIsScrolled(window.scrollY > 50));
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(rafId);
    };
  }, []);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-[#F2F0E9]/90 backdrop-blur-sm border-b border-stone-200 py-4' : 'py-6 bg-transparent'}`}>
      <div className="max-w-4xl mx-auto px-6 flex justify-between items-center">
        <div className={`font-serif font-bold text-xl text-stone-800 tracking-tight transition-opacity duration-500 ${isScrolled ? 'opacity-100' : 'opacity-0'}`}>
          S. Blundell
        </div>
        <div className="flex gap-6 text-sm font-sans tracking-wide text-stone-600">
          <button onClick={() => scrollTo('research')} className="hover:text-stone-900 transition-colors">Research</button>
          <button onClick={() => scrollTo('cv')} className="hover:text-stone-900 transition-colors">CV</button>
          <button onClick={() => scrollTo('contact')} className="hover:text-stone-900 transition-colors">Contact</button>
          <ProjectsDropdown />
        </div>
      </div>
    </nav>
  );
};

const PaperCard = ({ title, year, abstract, link, status }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="group border-l-2 border-stone-300 pl-6 py-2 transition-all duration-300 hover:border-stone-800">
      <div className="flex justify-between items-baseline mb-2 cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
        <h3 className="font-serif text-xl text-stone-800 group-hover:text-stone-600 transition-colors">
          {title}
        </h3>
        <span className="font-mono text-xs text-stone-500 shrink-0 ml-4">{year}</span>
      </div>
      
      <div className="flex items-center gap-3 text-xs font-sans uppercase tracking-widest text-stone-500 mb-3">
        <span>{status}</span>
        {link && link !== '#' && (
          <a href={link} className="flex items-center gap-1 hover:text-stone-800 transition-colors">
            PDF <ExternalLink size={10} />
          </a>
        )}
      </div>

      <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
        <p className="font-sans text-stone-600 leading-relaxed text-sm mb-4">
          {abstract}
        </p>
      </div>
      
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="text-stone-400 text-xs flex items-center gap-1 hover:text-stone-800 transition-colors"
      >
        {isOpen ? 'Collapse' : 'Read Abstract'} <ChevronDown size={12} className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
    </div>
  );
};

// --- Main Portfolio Layout Component ---
const Portfolio = () => {
  return (
    <div className="relative min-h-screen text-stone-800 font-sans selection:bg-stone-300 selection:text-stone-900">
      <SystemBackground />
      <HeroGraph />
      <NavBar />

      {/* --- HERO SECTION --- */}
      <Section id="home" className="min-h-screen flex flex-col justify-center items-center text-center">
        <FadeIn>
          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12 max-w-6xl mx-auto">
            
            {/* Profile Image */}
            <div className="shrink-0 relative group">
              <div className="absolute -inset-1 bg-gradient-to-tr from-stone-300 to-stone-100 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
              <img
                src="blundell_sam_1674614.jpg"
                alt="Sam Blundell"
                fetchPriority="high"
                loading="eager"
                className="relative w-48 h-56 md:w-64 md:h-80 object-cover rounded-2xl shadow-xl grayscale-[10%] hover:grayscale-0 transition-all duration-500"
              />
            </div>

            {/* Text Content */}
            <div className="text-center md:text-left">
              <h1 className="font-serif text-4xl md:text-6xl mb-6 text-stone-900 tracking-tight leading-none">
                <span className="font-normal">Sam</span> <span className="italic text-stone-700">Blundell.</span>
              </h1>
              
              <div className="max-w-lg border-t border-stone-300 pt-6">
                <p className="font-sans text-base md:text-lg text-stone-700 leading-relaxed mb-4">
                  I am an MPhil in Economics candidate at the <span className="font-semibold text-stone-900">University of Oxford</span> (Linacre College), supervised by <a href="https://www.sbs.ox.ac.uk/about-us/people/dimitrios-tsomocos" target="_blank" rel="noopener noreferrer" className="underline decoration-stone-400 hover:text-stone-900 hover:decoration-stone-900 transition-all">Professor Dimitrios Tsomocos</a> and <a href="https://fatih.ai/" target="_blank" rel="noopener noreferrer" className="underline decoration-stone-400 hover:text-stone-900 hover:decoration-stone-900 transition-all">Professor Fatih Kansoy</a>. My research focuses on quantitative modelling of financial frictions, price transmission mechanisms, and causal inference in complex macroeconomic settings.
                </p>
                <p className="font-sans text-base md:text-lg text-stone-700 leading-relaxed mb-6">
                  I was awarded the <a href="https://www.linkedin.com/posts/university-of-bristol-school-of-economics_a-massive-congratulations-to-our-four-award-winning-activity-7090717689429512193-e9NT" target="_blank" rel="noopener noreferrer" className="underline decoration-stone-400 hover:text-stone-900 hover:decoration-stone-900 transition-all">Deaton Prize</a> for my undergraduate dissertation linking Chinese COVID-19 policy with herding behaviour in equity markets.
                </p>
                <div className="flex justify-center md:justify-start gap-4">
                  <a href="#contact" className="px-6 py-2 border border-stone-800 text-stone-800 text-sm font-medium hover:bg-stone-800 hover:text-[#F2F0E9] transition-all">
                    Get in Touch
                  </a>
                  <a href="#research" className="px-6 py-2 text-stone-600 text-sm font-medium hover:text-stone-900 transition-colors flex items-center gap-2">
                    View Research <TrendingUp size={16} />
                  </a>
                </div>
              </div>
            </div>
            
          </div>
        </FadeIn>
      </Section>

      {/* --- RESEARCH SECTION --- */}
      <Section id="research">
        <FadeIn>
          <div className="flex items-center gap-4 mb-12">
            <BookOpen size={24} className="text-stone-400" />
            <h2 className="font-sans text-xs font-bold uppercase tracking-widest text-stone-500">Selected Research</h2>
          </div>
        </FadeIn>

        <div className="space-y-12">
          <FadeIn delay={100}>
            <PaperCard 
              title="A Model of Partial Sovereign Default in General Equilibrium with a Banking Sector: The Case of Sri Lanka"
              year="2026"
              status="MPhil Thesis (In Progress)"
              link="#"
              abstract="My MPhil thesis builds a general equilibrium model of partial sovereign default, in which a banking sector intermediates foreign import financing. I quantify how sovereign haircuts transmit to the real economy through a highly-convex external finance premium channel — eroding bank net worth, raising import prices, and compressing consumption. The model is calibrated to Sri Lanka's 2021–22 default episode using CDS-implied default probabilities."
            />
          </FadeIn>

          <FadeIn delay={200}>
            <PaperCard 
              title="Debiased/Double Machine Learning for Exchange-Rate Pass-Through Estimation"
              year="2026"
              status="ML Research Project (In Progress)"
              link="#"
              abstract="Applying Debiased Machine Learning (DML) to estimate exchange-rate pass-through in a high-dimensional panel setting. Using a partial linear model with cross-fitted nuisance functions, the framework accommodates the nonlinear, state-dependent relationships between macro confounders and prices that linear specifications mishandle — recovering a √N-consistent, asymptotically normal structural parameter estimate. I developed a hierarchy of first-stage learner specifications, utilizing boosted regression-trees and penalized regressions to handle non-linear nuisances consistent with regime-switching literature."
            />
          </FadeIn>

          <FadeIn delay={300}>
            <PaperCard 
              title="Systematic Bias in IMF Sovereign Debt Sustainability Assessments"
              year="2025"
              status="Research Assistance - Saïd Business School and LSE CETEx"
              link="#"
              abstract="Constructed and maintained a novel database of Debt Sustainability Analysis and macro-financial data covering 191 countries over 25 years, utilising a reproducible OCR and LLM-assisted verification pipeline in Python to extract and validate data from unstructured IMF archival documents."
            />
          </FadeIn>

          <FadeIn delay={400}>
            <PaperCard 
              title="Herding in Chinese Equity Markets"
              year="2023"
              status="BSc Dissertation (Deaton Prize)"
              link="diss.pdf"
              abstract="Investigating investor herding behaviour in Chinese A-share markets in response to COVID-19 containment policies, using a cross-sectional return dispersion framework on daily CSI 300 data. The empirical pipeline was built in Python, with Newey-West HAC-corrected regressions and PCA robustness checks estimated in Stata."
            />
          </FadeIn>
        </div>
      </Section>

{/* --- EXPERIENCE / CV SECTION --- */}
<Section id="cv">
  <FadeIn>
    <div className="flex items-center justify-between mb-12">
      <div className="flex items-center gap-4">
        <FileText size={24} className="text-stone-400" />
        <h2 className="font-sans text-xs font-bold uppercase tracking-widest text-stone-500">Curriculum Vitae</h2>
      </div>
      <a href="/cv.pdf" download className="flex items-center gap-2 text-xs font-mono text-stone-500 hover:text-stone-800 transition-colors">
        <Download size={14} /> Download PDF
      </a>
    </div>
  </FadeIn>

  <div className="grid md:grid-cols-[1fr_2fr] gap-12">
    {/* Education Column */}
    <FadeIn delay={100}>
      <div>
        <h3 className="font-serif text-xl text-stone-900 mb-6 border-b border-stone-300 pb-2">Education</h3>
        
        <div className="mb-8">
          <div className="font-bold text-stone-800">University of Oxford</div>
          <div className="text-stone-600 italic mb-1">MPhil in Economics</div>
          <div className="text-xs font-mono text-stone-500">2024 — 2026</div>
          <ul className="text-sm text-stone-600 mt-2 list-disc list-inside space-y-1">
            <li>Linacre College</li>
            <li>Supervisors: Prof. Dimitrios Tsomocos & Prof. Fatih Kansoy</li>
            <li>Thesis: Sovereign default with banking sector intermediation — nonlinear amplification of import prices through a costly-state-verification friction</li>
            <li>ML Project: Debiased Machine Learning for exchange-rate pass-through estimation</li>
            <li>Coursework: International Macro & Finance, Financial Economics, Empirical Research Methods, Machine Learning</li>
          </ul>
        </div>

        <div className="mb-8">
          <div className="font-bold text-stone-800">University of Bristol</div>
          <div className="text-stone-600 italic mb-1">BSc Economics with Study Abroad</div>
          <div className="text-xs font-mono text-stone-500">2019 — 2023</div>
          <ul className="text-sm text-stone-600 mt-2 list-disc list-inside space-y-1">
            <li>First Class Honours</li>
            <li>Deaton Prize for Best Dissertation in Economics</li>
            <li>Year abroad: Chinese University of Hong Kong</li>
            <li>Data Science Project: Python pipeline for NBA salary efficiency modelling with Vega-Lite visualisations</li>
          </ul>
        </div>
      </div>
    </FadeIn>

    {/* Experience Column */}
    <FadeIn delay={200}>
      <div>
        <h3 className="font-serif text-xl text-stone-900 mb-6 border-b border-stone-300 pb-2">Experience</h3>

        <div className="mb-8 pl-4 border-l border-stone-300">
          <div className="font-bold text-stone-800">Saïd Business School & LSE CETEx</div>
          <div className="text-stone-600 italic mb-1">Research Assistant — Prof. Dimitrios Tsomocos</div>
          <div className="text-xs font-mono text-stone-500">May — Oct 2025</div>
          <p className="text-sm text-stone-600 mt-2 leading-relaxed">
            Constructed a novel database of IMF Debt Sustainability Analyses and macro-financial data covering 191 countries over 20 years. Designed a reproducible Python pipeline using OCR and LLM-assisted verification to extract and validate data from unstructured PDF reports. Catalogued climate risk assessments embedded within IMF DSAs to quantify systematic forecast errors in the Fund's climate projections.
          </p>
        </div>

        <div className="mb-8 pl-4 border-l border-stone-300">
          <div className="font-bold text-stone-800">Parliamentary Office of Science and Technology</div>
          <div className="text-stone-600 italic mb-1">Research Intern</div>
          <div className="text-xs font-mono text-stone-500">May — Aug 2022</div>
          <p className="text-sm text-stone-600 mt-2 leading-relaxed">
            Researched Chinese development assistance and capital-market policy; synthesised findings into a briefing contributing to Parliamentary debate on British foreign policy. Delivered a presentation on RMB internationalisation and the Belt-and-Road Initiative to department academics and external stakeholders.
          </p>
        </div>

        <div className="mb-8 pl-4 border-l border-stone-300">
          <div className="font-bold text-stone-800">HSBC London</div>
          <div className="text-stone-600 italic mb-1">Spring Intern</div>
          <div className="text-xs font-mono text-stone-500">Apr 2021</div>
          <p className="text-sm text-stone-600 mt-2 leading-relaxed">
            Completed equity valuation training in Excel and participated in an equity pitch competition. Attended executive briefings on institutional banking and global economic trends.
          </p>
        </div>

        <h3 className="font-serif text-xl text-stone-900 mb-6 border-b border-stone-300 pb-2 pt-4">Technical Skills</h3>
        <div className="text-sm text-stone-600 space-y-2">
          <p><span className="font-semibold text-stone-800">Proficient:</span> Python (Pandas, NumPy, Scikit-learn), R (econometrics, data visualisation), Stata, Excel.</p>
          <p><span className="font-semibold text-stone-800">Intermediate:</span> MATLAB, Dynare, SQL, LaTeX, Git.</p>
          <p><span className="font-semibold text-stone-800">Data Sources:</span> Bloomberg Terminal (BMC certified), LSEG DataStream.</p>
          <p><span className="font-semibold text-stone-800">Languages:</span> English (native), Japanese (beginner).</p>
        </div>

        <h3 className="font-serif text-xl text-stone-900 mb-6 border-b border-stone-300 pb-2 pt-8">Honours & Activities</h3>
        <div className="text-sm text-stone-600 space-y-4">
          <p><span className="font-semibold text-stone-800">Graduate Teaching, Oxford UNIQ</span> <span className="font-mono text-xs text-stone-500 ml-2">Jul 2026</span><br />Delivering lecture and interactive session on Government Debt Sustainability for Oxford's widening participation outreach programme.</p>
          <p><span className="font-semibold text-stone-800">World Econometrics Games</span> <span className="font-mono text-xs text-stone-500 ml-2">Apr 2026</span><br />Selected to represent Oxford in Amsterdam; case study on hourly day-ahead electricity price forecasting in the DK1 price zone.</p>
          <p><span className="font-semibold text-stone-800">Linacre College Scholarship</span> <span className="font-mono text-xs text-stone-500 ml-2">2025–26</span><br />Japanese Fast-Track Language Course.</p>
          <p><span className="font-semibold text-stone-800">Deaton Prize</span> <span className="font-mono text-xs text-stone-500 ml-2">2023</span><br />Best dissertation in Economics, University of Bristol.</p>
          <p><span className="font-semibold text-stone-800">Mentor, Zero Gravity</span> <span className="font-mono text-xs text-stone-500 ml-2">2022–23</span><br />Mentored prospective undergraduates; supported successful applications to LSE and Warwick.</p>
        </div>
      </div>
    </FadeIn>
  </div>
</Section>

      {/* --- CONTACT SECTION --- */}
      <Section id="contact" className="mb-20">
        <FadeIn>
          <div className="bg-stone-200/50 p-12 rounded-sm border border-stone-300">
            <h2 className="font-serif text-3xl text-stone-900 mb-6">Connect</h2>
            <p className="text-stone-700 mb-8 max-w-xl">
              Please feel free to reach out to me for research collaborations, chats about economics, or if you have Japanese restaurant recommendations.
            </p>
            
            <div className="grid md:grid-cols-2 gap-6">
              <a href="mailto:sam.blundell@economics.ox.ac.uk" className="flex items-center gap-3 p-4 bg-[#F2F0E9] border border-stone-300 hover:border-stone-500 transition-colors">
                <Mail size={18} className="text-stone-600" />
                <span className="text-sm font-mono text-stone-800">sam.blundell@economics.ox.ac.uk</span>
              </a>
              
              <div className="flex gap-4">
                <a href="https://www.linkedin.com/in/sam-blundell-7608b7196/" target="_blank" rel="noopener noreferrer" className="flex-1 flex justify-center items-center gap-2 p-4 bg-[#F2F0E9] border border-stone-300 hover:border-stone-500 transition-colors">
                  <Linkedin size={18} className="text-stone-600" />
                  <span className="text-sm font-medium">LinkedIn</span>
                </a>
              </div>
            </div>
          </div>
        </FadeIn>
      </Section>

      <footer className="py-8 text-center text-stone-400 text-xs font-mono">
        <p>&copy; {new Date().getFullYear()} Sam Blundell. Typeset in Serif & Sans.</p>
        <p className="mt-1 opacity-50">Built with React & Tailwind.</p>
      </footer>
    </div>
  );
};

// --- App Component with Routing Setup ---
export default function App() {
  return (
    // Tell the Router that all paths start with /sam-blundell
    <Router basename="/sam-blundell"> 
      <Routes>
        {/* Main Portfolio Page */}
        <Route path="/" element={<Portfolio />} />
        
        {/* Debt Simulator Page */}
        <Route path="/debt-simulator" element={<DebtSimulator />} />
      </Routes>
    </Router>
  );
}
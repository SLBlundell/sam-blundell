import React, { useState, useEffect, useRef, useMemo } from 'react';
import { BookOpen, FileText, Mail, Github, Linkedin, TrendingUp, Anchor, ChevronDown, ExternalLink, Download } from 'lucide-react';

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
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => {
      if (ref.current) observer.unobserve(ref.current);
    };
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
// OPTIMIZED: Uses Refs for parallax to avoid re-rendering on every scroll event
const SystemBackground = () => {
  const gridRef = useRef(null);
  const nodeRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      // Update DOM directly for performance
      if (gridRef.current) {
        gridRef.current.style.transform = `translateY(${y * 0.05}px)`;
      }
      if (nodeRef.current) {
        nodeRef.current.style.transform = `translateY(${-y * 0.1}px)`;
      }
    };
    
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      <div className="absolute inset-0 bg-[#F2F0E9]"></div>
      
      {/* Noise Texture */}
      <div className="absolute inset-0 opacity-[0.03]" 
           style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}>
      </div>
      
      {/* Base Grid - Moves slowly for parallax */}
      <div 
        ref={gridRef}
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(#4a4a4a 1px, transparent 1px), linear-gradient(90deg, #4a4a4a 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          willChange: 'transform', // Hardware acceleration hint
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
// OPTIMIZED: Uses Refs + Animation Loop without State
const HeroGraph = () => {
  const mousePosRef = useRef({ x: 0, y: 0 });
  const spreadsRef = useRef(new Array(51).fill(20));
  
  // Refs to access SVG paths directly
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

  // Optimized Animation Loop
  useEffect(() => {
    let animationFrameId;
    
    const loop = () => {
      const width = 1000;
      const segments = 50;
      const svgMouseX = (mousePosRef.current.x / (window.innerWidth || 1)) * 1000;
      const now = Date.now() / 1000;

      const points = [];

      // 1. Calculate Physics
      for (let i = 0; i <= segments; i++) {
        const x = (width / segments) * i;
        
        // Target Spread Calculation
        const dist = Math.abs(x - svgMouseX);
        const interactiveInfluence = Math.exp(-(dist * dist) / (150 * 150)); 
        const targetSpread = 20 + (interactiveInfluence * 60);

        // Smooth Interpolation
        const current = spreadsRef.current[i];
        const next = current + (targetSpread - current) * 0.08;
        spreadsRef.current[i] = next;
        
        // Base Shape Calculation - REVERTED TO TIGHTER CURVE
        const normX = (x - 500) / 500; 
        const mainY = 480 - 300 * Math.pow(Math.abs(normX), 2.2);

        points.push({ x, y: mainY, spread: next });
      }

      // 2. Generate Path Strings
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

      // 3. Update DOM Directly (Bypasses React Render Cycle)
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
          {/* Top Confidence Band */}
          <path ref={topPathRef} fill="none" stroke="#5F6F7E" strokeWidth="2" strokeDasharray="4,6" className="opacity-30 scrolling-dash" />
          
          {/* Bottom Confidence Band */}
          <path ref={bottomPathRef} fill="none" stroke="#5F6F7E" strokeWidth="2" strokeDasharray="4,6" className="opacity-30 scrolling-dash" />

          {/* Secondary Model */}
          <path ref={modelPathRef} fill="none" stroke="#5F6F7E" strokeWidth="1.5" strokeDasharray="8,8" className="opacity-20" />

          {/* Main Trend Line */}
          <path ref={mainPathRef} fill="none" stroke="#4a4a4a" strokeWidth="3" strokeLinecap="round" className="opacity-70 drop-shadow-md" />
      </svg>
    </div>
  );
};

const NavBar = () => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
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

export default function App() {
  return (
    <div className="relative min-h-screen text-stone-800 font-sans selection:bg-stone-300 selection:text-stone-900">
      <SystemBackground />
      <HeroGraph />
      <NavBar />

      {/* --- HERO SECTION --- */}
      <Section id="home" className="min-h-screen flex flex-col justify-center items-center text-center">
        <FadeIn>
          {/* Reverted layout container to remove relative z-20 */}
          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12 max-w-6xl mx-auto">
            
            {/* Profile Image */}
            <div className="shrink-0 relative group">
              <div className="absolute -inset-1 bg-gradient-to-tr from-stone-300 to-stone-100 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
              <img 
                src="blundell_sam_1674614.jpg" 
                alt="Sam Blundell" 
                className="relative w-48 h-48 md:w-64 md:h-64 object-cover rounded-2xl shadow-xl grayscale-[10%] hover:grayscale-0 transition-all duration-500"
              />
            </div>

            {/* Text Content */}
            <div className="text-center md:text-left">
              <h1 className="font-serif text-4xl md:text-6xl mb-6 text-stone-900 tracking-tight leading-none">
                <span className="font-normal">Sam</span> <span className="italic text-stone-700">Blundell.</span>
              </h1>
              
              <div className="max-w-lg border-t border-stone-300 pt-6">
                <p className="font-sans text-base md:text-lg text-stone-700 leading-relaxed mb-6">
                  I am an MPhil in Economics at the <span className="font-semibold text-stone-900">University of Oxford</span> (Linacre College), supervised by <a href="https://www.sbs.ox.ac.uk/about-us/people/dimitrios-tsomocos" target="_blank" rel="noopener noreferrer" className="underline decoration-stone-400 hover:text-stone-900 hover:decoration-stone-900 transition-all">Professor Dimitrios Tsomocos</a> and <a href="https://fatih.ai/" target="_blank" rel="noopener noreferrer" className="underline decoration-stone-400 hover:text-stone-900 hover:decoration-stone-900 transition-all">Professor Fatih Kansoy</a>. 
                  My research focuses on sovereign default, financial frictions, and emerging market macroeconomics.
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
              title="Partial Model of Sovereign Default with Endogenous Banking Frictions"
              year="2026"
              status="MPhil Thesis (In Progress)"
              link="#"
              abstract="Developing a small open-economy reduced-form model of sovereign default with endogenous import-based banking frictions. The project aims to better capture empirical facts and moments in emerging markets using dynamic programming-based numerical simulations calibrated to EM data."
            />
          </FadeIn>

          <FadeIn delay={200}>
            <PaperCard 
              title="Systematic Bias in IMF Sovereign Debt Sustainability Assessments"
              year="2025"
              status="Research Assistance - Forthcoming Paper"
              link="#"
              abstract="Constructed a novel database of IMF Debt Sustainability Analysis and macro-financial data covering 191 countries. Decomposed forecast errors to identify systematic bias in sovereign risk assessments, contributing to research on debt sustainability and policy effectiveness."
            />
          </FadeIn>

          <FadeIn delay={300}>
            <PaperCard 
              title="Herding in Chinese Equity Markets"
              year="2023"
              status="BSc Dissertation (Deaton Prize)"
              link="diss.pdf"
              abstract="Applied Newey-West regressions to financial data and policy indices during the COVID-19 pandemic. Findings suggest that lockdown announcements paradoxically reduced herding behavior and stabilized markets."
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
                <ul className="text-sm text-stone-600 mt-2 list-disc list-inside">
                  <li>Linacre College</li>
                  <li>Supervisor: Prof. Dimitrios Tsomocos</li>
                  <li>Focus: International Macro & Finance</li>
                </ul>
              </div>

              <div className="mb-8">
                <div className="font-bold text-stone-800">University of Bristol</div>
                <div className="text-stone-600 italic mb-1">BSc Economics</div>
                <div className="text-xs font-mono text-stone-500">2019 — 2023</div>
                <ul className="text-sm text-stone-600 mt-2 list-disc list-inside">
                  <li>First Class Honours</li>
                  <li>Deaton Prize for Best Dissertation</li>
                  <li>Study Year Abroad: CUHK</li>
                </ul>
              </div>
            </div>
          </FadeIn>

          {/* Experience Column */}
          <FadeIn delay={200}>
            <div>
              <h3 className="font-serif text-xl text-stone-900 mb-6 border-b border-stone-300 pb-2">Experience</h3>

              <div className="mb-8 pl-4 border-l border-stone-300">
                <div className="font-bold text-stone-800">Saïd Business School</div>
                <div className="text-stone-600 italic mb-1">Research Assistant</div>
                <div className="text-xs font-mono text-stone-500">May — Oct 2025</div>
                <p className="text-sm text-stone-600 mt-2 leading-relaxed">
                  Research Assistant for Prof. Dimitrios Tsomocos. Constructed a database of IMF Debt Sustainability Analysis for 191 countries. Engineered a reproducible Python data pipeline using OCR and Pandas to structure unstructured PDF reports.
                </p>
              </div>

              <div className="mb-8 pl-4 border-l border-stone-300">
                <div className="font-bold text-stone-800">Parliamentary Office of Science and Technology</div>
                <div className="text-stone-600 italic mb-1">Research Intern</div>
                <div className="text-xs font-mono text-stone-500">May — Aug 2022</div>
                <p className="text-sm text-stone-600 mt-2 leading-relaxed">
                  Presented economic policy research for Parliamentary debate on Chinese development assistance. Analyzed the relationship between RMB internationalization and Belt-and-Road policy.
                </p>
              </div>

              <div className="mb-8 pl-4 border-l border-stone-300">
                <div className="font-bold text-stone-800">HSBC London</div>
                <div className="text-stone-600 italic mb-1">Spring Intern</div>
                <div className="text-xs font-mono text-stone-500">Apr 2021</div>
                <p className="text-sm text-stone-600 mt-2 leading-relaxed">
                  Built fundamental equity valuation models in Excel, gaining practical exposure to industry asset pricing.
                </p>
              </div>

               <h3 className="font-serif text-xl text-stone-900 mb-6 border-b border-stone-300 pb-2 pt-4">Technical & Awards</h3>
               <div className="text-sm text-stone-600 space-y-2">
                 <p><span className="font-semibold text-stone-800">Languages:</span> R, Python (Pandas, NumPy, Scikit-learn), MATLAB, Dynare, Stata.</p>
                 <p><span className="font-semibold text-stone-800">Awards:</span> World Econometrics Games Competitor (2026), Linacre College Scholarship (2025).</p>
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
        <p className="mt-1 opacity-50">Built with React & Tailwind, in collaboration with Gemini.</p>
      </footer>
    </div>
  );
}
import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';

const DebtSimulator = () => {
  // Initialize state with standard UK-style figures
  const [initialDebt, setInitialDebt] = useState(100);
  const [interestRate, setInterestRate] = useState(4);
  const [growthRate, setGrowthRate] = useState(2);
  const [primaryDeficit, setPrimaryDeficit] = useState(2);

  // Calculate the 20-year projection based on the macroeconomic inputs
  const chartData = useMemo(() => {
    let currentDebt = parseFloat(initialDebt);
    const data = [];
    
    for (let year = 0; year <= 20; year++) {
      data.push({
        year: year,
        debt: parseFloat(currentDebt.toFixed(1))
      });
      
      // Macroeconomic Debt Dynamics Formula:
      // Debt(t) = Debt(t-1) * ((1 + r) / (1 + g)) + PrimaryDeficit
      const r = interestRate / 100;
      const g = growthRate / 100;
      const p = parseFloat(primaryDeficit);
      
      currentDebt = currentDebt * ((1 + r) / (1 + g)) + p;
    }
    return data;
  }, [initialDebt, interestRate, growthRate, primaryDeficit]);

  // Determine the (r - g) dynamic for the summary text
  const rMinusG = interestRate - growthRate;
  
  let summaryText = "";
  let statusColor = "";

  if (rMinusG > 0) {
    summaryText = `Because the interest rate exceeds growth (r > g by ${rMinusG}%), the debt is compounding faster than the economy can keep up. Unless the deficit is severely cut, the trajectory is explosive.`;
    statusColor = "border-red-300 bg-red-50 text-red-900";
  } else if (rMinusG < 0) {
    summaryText = `Because growth is higher than the interest rate (g > r by ${Math.abs(rMinusG)}%), the economy is "outgrowing" its debt. The burden may stabilize or shrink despite running a deficit.`;
    statusColor = "border-emerald-300 bg-emerald-50 text-emerald-900";
  } else {
    summaryText = `Interest rates and economic growth are perfectly balanced (r = g). The debt trajectory is driven entirely by the size of the primary deficit.`;
    statusColor = "border-stone-300 bg-stone-100 text-stone-800";
  }

  return (
    <div className="min-h-screen bg-[#F2F0E9] text-stone-800 font-sans selection:bg-stone-300 selection:text-stone-900">
      
      {/* Container matching your portfolio width and padding */}
      <div className="max-w-4xl mx-auto px-6 py-12 md:py-20">
        
        {/* Navigation Back */}
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-xs font-mono text-stone-500 hover:text-stone-900 transition-colors mb-12"
        >
          <ArrowLeft size={14} /> Back to Portfolio
        </Link>

        {/* Header */}
        <div className="mb-12 border-b border-stone-300 pb-6">
          <h1 className="font-serif text-3xl md:text-4xl text-stone-900 mb-4 tracking-tight">
            Macroeconomic Policy Space Simulator
          </h1>
          <p className="font-sans text-stone-600 leading-relaxed max-w-2xl">
            Adjust the parameters below to visualize how interest rates (r) and economic growth (g) dictate a country's sovereign debt trajectory over a 20-year horizon.
          </p>
        </div>

        {/* Chart Section */}
        <div className="bg-[#F2F0E9] border border-stone-300 rounded-sm p-4 md:p-8 mb-8 shadow-sm">
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d6d3d1" vertical={false} />
                <XAxis 
                  dataKey="year" 
                  stroke="#78716c"
                  tick={{ fill: '#78716c', fontSize: 12 }}
                  tickMargin={10}
                />
                <YAxis 
                  domain={['auto', 'auto']}
                  stroke="#78716c"
                  tick={{ fill: '#78716c', fontSize: 12 }}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#F2F0E9', borderColor: '#d6d3d1', borderRadius: '4px', color: '#1c1917' }}
                  itemStyle={{ color: '#1c1917' }}
                  formatter={(value) => [`${value}%`, 'Debt-to-GDP']}
                  labelFormatter={(label) => `Year ${label}`}
                />
                <ReferenceLine y={100} stroke="#ef4444" strokeDasharray="4 4" opacity={0.4} />
                <Line 
                  type="monotone" 
                  dataKey="debt" 
                  stroke="#292524" 
                  strokeWidth={2.5}
                  dot={{ r: 0 }}
                  activeDot={{ r: 5, fill: '#292524' }} 
                  animationDuration={1500}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Dynamic Summary Section */}
        <div className={`p-5 rounded-sm border-l-4 mb-12 text-sm leading-relaxed transition-colors duration-500 ${statusColor}`}>
          <strong className="font-semibold uppercase tracking-wider text-xs mr-2">Dynamic Analysis:</strong> 
          {summaryText}
        </div>

        {/* Controls Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
          
          <div className="group">
            <div className="flex justify-between font-sans text-xs font-bold uppercase tracking-widest text-stone-500 mb-4 group-hover:text-stone-800 transition-colors">
              <span>Initial Debt-to-GDP</span>
              <span className="font-mono text-stone-900">{initialDebt}%</span>
            </div>
            <input 
              type="range" min="0" max="250" step="1"
              value={initialDebt} onChange={(e) => setInitialDebt(e.target.value)}
              className="w-full accent-stone-700 h-1 bg-stone-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div className="group">
            <div className="flex justify-between font-sans text-xs font-bold uppercase tracking-widest text-stone-500 mb-4 group-hover:text-stone-800 transition-colors">
              <span>Interest Rate (r)</span>
              <span className="font-mono text-stone-900">{interestRate}%</span>
            </div>
            <input 
              type="range" min="0" max="15" step="0.5"
              value={interestRate} onChange={(e) => setInterestRate(e.target.value)}
              className="w-full accent-stone-700 h-1 bg-stone-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div className="group">
            <div className="flex justify-between font-sans text-xs font-bold uppercase tracking-widest text-stone-500 mb-4 group-hover:text-stone-800 transition-colors">
              <span>Economic Growth (g)</span>
              <span className="font-mono text-stone-900">{growthRate}%</span>
            </div>
            <input 
              type="range" min="-5" max="10" step="0.5"
              value={growthRate} onChange={(e) => setGrowthRate(e.target.value)}
              className="w-full accent-stone-700 h-1 bg-stone-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div className="group">
            <div className="flex justify-between font-sans text-xs font-bold uppercase tracking-widest text-stone-500 mb-4 group-hover:text-stone-800 transition-colors">
              <span>Primary Deficit</span>
              <span className="font-mono text-stone-900">{primaryDeficit}%</span>
            </div>
            <input 
              type="range" min="-5" max="15" step="0.5"
              value={primaryDeficit} onChange={(e) => setPrimaryDeficit(e.target.value)}
              className="w-full accent-stone-700 h-1 bg-stone-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>

        </div>
      </div>
    </div>
  );
};

export default DebtSimulator;
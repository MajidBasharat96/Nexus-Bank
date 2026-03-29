export default {
  content: ['./index.html','./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: { 50:'#f0f4ff',100:'#e0e9ff',500:'#4361ee',600:'#3651d4',700:'#2d45ba',900:'#1a2878' },
        accent: { 400:'#f72585',500:'#e91e8c' },
        surface: { DEFAULT:'#0f1729',card:'#162040',border:'#1e2d4a' },
      },
      fontFamily: { display:['Outfit','sans-serif'], body:['DM Sans','sans-serif'], mono:['JetBrains Mono','monospace'] }
    }
  }
}

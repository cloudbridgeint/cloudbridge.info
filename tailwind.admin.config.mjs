/** Admin palette — mirrors the config that used to be inlined in AdminLayout.astro.
    Deliberately separate: `bridge` and `sunrise` resolve to DIFFERENT hex values
    here than on the public site, so the two builds must not share a config. */
export default {
  content: [
    './src/**/*.{astro,html,js,jsx,ts,tsx,md,mdx}',
    './public/scripts/**/*.js',
  ],
  theme: {
    extend: {
      colors: {
        bridge: { 50:'#eef2f9',100:'#dbe6f2',500:'#3d6099',600:'#2f5182',700:'#254368',800:'#1c3255',900:'#15263f',950:'#0f1c30' },
        sunrise: { 50:'#fdeceb', 100:'#ffe6d9',500:'#c0201f',600:'#aa1821',700:'#8f1519' },
        iris: { 50:'#f1f1fc',100:'#e3e4f9',200:'#c5c7f3',300:'#a2a5ec',400:'#8286e2',500:'#5b5fc7',600:'#4d51b0',700:'#3f4293',800:'#33356f',900:'#282a57' },
      },
    },
  },
};

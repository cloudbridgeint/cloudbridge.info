/** Public site palette — mirrors the config that used to be inlined in Layout.astro. */
export default {
  content: [
    './src/**/*.{astro,html,js,jsx,ts,tsx,md,mdx}',
    './public/scripts/**/*.js',
  ],
  theme: {
    extend: {
      colors: {
        bridge: {50:'#eef2f9',100:'#d7e0ef',200:'#b0c1df',300:'#7f9bc9',400:'#4d70a8',500:'#2f5182',600:'#233f68',700:'#1c3255',800:'#162743',900:'#0f1c30',950:'#0a1220'},
        sunrise: {50:'#fcedee',100:'#f9d2d5',200:'#f2a6aa',300:'#eb7077',400:'#e12d38',500:'#ce1d27',600:'#aa1821',700:'#86131a'},
        harbor: {500:'#1c9c82',600:'#157e69'},
        ink: '#1e2430',
        cloud: '#f7f9fc',
      },
      fontFamily: {
        display: ['Inter','ui-sans-serif','system-ui','sans-serif'],
        body: ['Lato','ui-sans-serif','system-ui','sans-serif'],
      },
      backgroundImage: {
        'dusk-gradient': 'linear-gradient(160deg, #0f1c30 0%, #1c3255 45%, #2f5182 100%)',
      },
      maxWidth: { container: '1240px' },
    },
  },
};

export default function Footer() {
  return (
    <footer className="bg-[#0c0c10] border-t border-white/[0.04] mt-12">
      <div className="max-w-[1400px] mx-auto px-5 md:px-10 py-10">
        {/* Main grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {/* Company */}
          <div>
            <h4 className="text-white/70 text-sm font-semibold mb-4">Company</h4>
            <ul className="space-y-2.5">
              <li><a href="#" className="text-white/35 text-sm hover:text-white/60 transition-colors">About Us</a></li>
              <li><a href="#" className="text-white/35 text-sm hover:text-white/60 transition-colors">Careers</a></li>
              <li><a href="#" className="text-white/35 text-sm hover:text-white/60 transition-colors">Press</a></li>
            </ul>
          </div>

          {/* View Website in */}
          <div>
            <h4 className="text-white/70 text-sm font-semibold mb-4">View Website in</h4>
            <ul className="space-y-2.5">
              <li className="flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary"><path d="M20 6L9 17l-5-5"/></svg>
                <span className="text-white/50 text-sm">English</span>
              </li>
            </ul>
          </div>

          {/* Need Help */}
          <div>
            <h4 className="text-white/70 text-sm font-semibold mb-4">Need Help?</h4>
            <ul className="space-y-2.5">
              <li><a href="#" className="text-white/35 text-sm hover:text-white/60 transition-colors">Visit Help Center</a></li>
              <li><a href="#" className="text-white/35 text-sm hover:text-white/60 transition-colors">Share Feedback</a></li>
            </ul>
          </div>

          {/* Connect with Us */}
          <div>
            <h4 className="text-white/70 text-sm font-semibold mb-4">Connect with Us</h4>
            <div className="flex items-center gap-3">
              {/* Facebook */}
              <a href="#" className="w-9 h-9 rounded-full bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center transition-colors" aria-label="Facebook">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-white/50">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              {/* X / Twitter */}
              <a href="#" className="w-9 h-9 rounded-full bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center transition-colors" aria-label="X">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-white/50">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              {/* Instagram */}
              <a href="#" className="w-9 h-9 rounded-full bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center transition-colors" aria-label="Instagram">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-white/50">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                </svg>
              </a>
              {/* YouTube */}
              <a href="#" className="w-9 h-9 rounded-full bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center transition-colors" aria-label="YouTube">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-white/50">
                  <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>
            </div>

            {/* App Store badges */}
            <div className="flex items-center gap-2 mt-5">
              <a href="#" className="h-9 px-3 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] flex items-center gap-2 transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-white/60">
                  <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.199l2.302 1.33-3.038 1.756-2.3-2.3 3.036-2.786zM5.864 2.658L16.8 8.99l-2.3 2.3-8.636-8.632z"/>
                </svg>
                <div className="flex flex-col">
                  <span className="text-[8px] text-white/30 leading-none">GET IT ON</span>
                  <span className="text-[11px] text-white/60 font-medium leading-tight">Google Play</span>
                </div>
              </a>
              <a href="#" className="h-9 px-3 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] flex items-center gap-2 transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-white/60">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
                <div className="flex flex-col">
                  <span className="text-[8px] text-white/30 leading-none">Download on the</span>
                  <span className="text-[11px] text-white/60 font-medium leading-tight">App Store</span>
                </div>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-10 pt-6 border-t border-white/[0.04]">
          <p className="text-white/20 text-xs">
            © {new Date().getFullYear()} MIDFLIX. All Rights Reserved.
          </p>
          <div className="flex items-center gap-4 mt-2 sm:mt-0">
            <a href="#" className="text-white/25 text-xs hover:text-white/50 transition-colors">Terms of Use</a>
            <a href="#" className="text-white/25 text-xs hover:text-white/50 transition-colors">Privacy Policy</a>
            <a href="#" className="text-white/25 text-xs hover:text-white/50 transition-colors">FAQ</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

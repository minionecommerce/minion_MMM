import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-black text-gray-300 py-16 lg:py-24 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          
          <div className="space-y-6">
            <Link href="/" className="inline-block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#FF4D00] rounded-sm">
              <span className="text-2xl font-bold tracking-tighter text-white">
                MINION<span className="text-[#FF4D00]">.</span>
              </span>
            </Link>
            <p className="text-sm font-medium text-gray-400 max-w-xs">
              Design. Build. Automate. Transform.<br />
              Architecture | Construction | Interiors | Smart Home | Landscaping | Products
            </p>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-6">Quick Links</h3>
            <ul className="space-y-3">
              {[
                { name: 'Home', href: '/' },
                { name: 'About', href: '/#about' },
                { name: 'Services', href: '/#services' },
                { name: 'Projects', href: '/#projects' },
                { name: 'Products', href: '/#products' },
                { name: 'FAQ', href: '/faq' },
                { name: 'Careers', href: '#' },
                { name: 'Contact', href: '/contact' },
              ].map((item) => (
                <li key={item.name}>
                  <Link href={item.href} className="text-sm hover:text-[#FF4D00] transition-colors focus-visible:outline-[#FF4D00] rounded-sm">
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-6">Services</h3>
            <ul className="space-y-3">
              {['Architecture', 'Construction', 'Interior Design', 'Home Automation', 'Security', 'Landscaping', 'Garden Automation', 'Building Products'].map((item) => (
                <li key={item}>
                  <Link href={`/#services`} className="text-sm hover:text-[#FF4D00] transition-colors focus-visible:outline-[#FF4D00] rounded-sm">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-6">Contact</h3>
            <address className="not-italic space-y-3 text-sm text-gray-400">
              <p>Chennai, Tamil Nadu, India</p>
              <p>
                Email:{' '}
                <a href="mailto:info@minion.com" className="hover:text-[#FF4D00] transition-colors focus-visible:outline-[#FF4D00] rounded-sm">
                  info@minion.com
                </a>
              </p>
              <p>
                Phone:{' '}
                <a href="tel:+910000000000" className="hover:text-[#FF4D00] transition-colors focus-visible:outline-[#FF4D00] rounded-sm">
                  +91 000 000 0000
                </a>
              </p>
            </address>

            <h3 className="text-white font-semibold mt-8 mb-4">Follow Us</h3>
            <div className="flex gap-4">
              {['Instagram', 'Facebook', 'YouTube', 'LinkedIn'].map((social) => (
                <a key={social} href="#" className="text-sm text-gray-400 hover:text-[#FF4D00] transition-colors focus-visible:outline-[#FF4D00] rounded-sm">
                  {social}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-gray-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-500 text-center md:text-left">
            © {new Date().getFullYear()} Minion Smart Home Solutions and Landscaping Private Limited. All Rights Reserved.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-xs text-gray-500">
            {['Privacy Policy', 'Terms & Conditions', 'Warranty Policy', 'Cancellation Policy', 'Shipping & Delivery Policy', 'Refund Policy'].map((policy) => (
              <a key={policy} href="#" className="hover:text-gray-300 transition-colors focus-visible:outline-[#FF4D00] rounded-sm">
                {policy}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

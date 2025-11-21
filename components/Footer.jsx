import React from "react";
import { FaFacebookF, FaInstagram, FaTwitter, FaGlobe } from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="bg-gray-600 text-white pb-8">
      {/* <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"> */}
        
        {/* About Section */}
        {/* <div>
          <h3 className="text-lg font-bold mb-2">Attendance Evaluation</h3>
          <p className="text-sm">A smart platform for managing student performance and attendance efficiently.</p>
        </div> */}

        {/* Links */}
        {/* <div>
          <h3 className="text-lg font-bold mb-2">Useful Links</h3>
          <ul className="space-y-2 text-sm">
            <li><a href="#" className="hover:underline">Home</a></li>
            <li><a href="#" className="hover:underline">Docs</a></li>
            <li><a href="#" className="hover:underline">Contact Us</a></li>
            <li><a href="#" className="hover:underline">Support</a></li>
          </ul>
        </div> */}

        {/* Social Links */}
        {/* <div>
          <h3 className="text-lg font-bold mb-2">Follow Us</h3>
          <div className="flex gap-4 text-xl">
            <a href="#" className="hover:text-gray-300" aria-label="Facebook"><FaFacebookF /></a>
            <a href="#" className="hover:text-gray-300" aria-label="Instagram"><FaInstagram /></a>
            <a href="#" className="hover:text-gray-300" aria-label="Twitter"><FaTwitter /></a>
            <a href="#" className="hover:text-gray-300" aria-label="Website"><FaGlobe /></a>
          </div>
        </div> */}
      {/* </div> */}

      {/* Copyright */}
      <div className="text-center mt-8 text-sm border-t border-gray-500 pt-4">
        &copy; {new Date().getFullYear()} Attendance Monitoring And Performance Evaluation. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;

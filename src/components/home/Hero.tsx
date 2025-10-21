import Link from 'next/link'
import { AlertTriangle, FileText, Shield, Users } from 'lucide-react'

export default function Hero() {
  return (
    <section className="relative bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 text-white">
      <div className="absolute inset-0 bg-black/10"></div>
      <div className="relative container mx-auto px-4 py-16 lg:py-24">
        <div className="max-w-4xl mx-auto text-center">
          {/* Logo/Header */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
              <AlertTriangle className="h-8 w-8 text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-3xl lg:text-4xl font-bold">EduAlert</h1>
              <p className="text-primary-100 text-sm lg:text-base">Ministry of Education - Guyana</p>
            </div>
          </div>

          {/* Main Content */}
          <div className="space-y-6 mb-12">
            <h2 className="text-4xl lg:text-6xl font-bold leading-tight">
              Teacher Absence
              <span className="block text-warning-400">Reporting System</span>
            </h2>
            
            <p className="text-xl lg:text-2xl text-primary-100 max-w-3xl mx-auto leading-relaxed">
              Help us ensure quality education by reporting when teachers are absent from their duties. 
              Your reports help maintain educational standards across Guyana.
            </p>

            <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto mt-12">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
                <FileText className="h-8 w-8 mx-auto mb-2 text-success-400" />
                <h3 className="font-semibold mb-1">Easy Reporting</h3>
                <p className="text-sm text-primary-100">Simple form to report teacher absence</p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
                <Shield className="h-8 w-8 mx-auto mb-2 text-success-400" />
                <h3 className="font-semibold mb-1">Secure & Anonymous</h3>
                <p className="text-sm text-primary-100">Your identity is protected</p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
                <Users className="h-8 w-8 mx-auto mb-2 text-success-400" />
                <h3 className="font-semibold mb-1">Quick Response</h3>
                <p className="text-sm text-primary-100">Education officers respond promptly</p>
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link 
              href="/report" 
              className="bg-warning-500 hover:bg-warning-600 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              Report Teacher Absence
            </Link>
            
            <Link 
              href="/admin" 
              className="bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/30 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200"
            >
              Officer Login
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
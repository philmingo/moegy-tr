import Link from 'next/link'
import { ArrowRight, Phone, Mail, MapPin } from 'lucide-react'

export default function ReportingCTA() {
  return (
    <section className="py-16 lg:py-24 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Main CTA Section */}
          <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl p-8 lg:p-12 text-white text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Ready to Report?
            </h2>
            <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
              Help us maintain quality education standards. Your report can make a difference 
              in a student&apos;s education journey.
            </p>
            <Link 
              href="/report"
              className="inline-flex items-center gap-2 bg-warning-500 hover:bg-warning-600 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              Submit Report Now
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>

          {/* Contact Information */}
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gray-50 rounded-xl p-6 text-center">
              <Phone className="h-8 w-8 text-primary-500 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">Call Us</h3>
              <p className="text-gray-600 text-sm mb-2">Ministry of Education</p>
              <p className="text-primary-600 font-medium">+592-223-7900</p>
            </div>

            <div className="bg-gray-50 rounded-xl p-6 text-center">
              <Mail className="h-8 w-8 text-primary-500 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">Email Us</h3>
              <p className="text-gray-600 text-sm mb-2">For general inquiries</p>
              <p className="text-primary-600 font-medium">info@moe.gov.gy</p>
            </div>

            <div className="bg-gray-50 rounded-xl p-6 text-center">
              <MapPin className="h-8 w-8 text-primary-500 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">Visit Us</h3>
              <p className="text-gray-600 text-sm mb-2">21 Brickdam, Georgetown</p>
              <p className="text-primary-600 font-medium">Guyana</p>
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-16 text-center">
            <div className="bg-success-50 border border-success-200 rounded-lg p-6 max-w-4xl mx-auto">
              <h3 className="text-lg font-semibold text-success-800 mb-3">
                Your Privacy is Protected
              </h3>
              <p className="text-success-700 leading-relaxed">
                All reports are handled confidentially. Your personal information is secure and will only be used 
                for the purpose of investigating and addressing the reported issue. We are committed to protecting 
                your privacy while ensuring our students receive the quality education they deserve.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
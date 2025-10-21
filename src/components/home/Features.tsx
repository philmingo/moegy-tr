import { Clock, MapPin, GraduationCap, AlertCircle, CheckCircle, Eye } from 'lucide-react'

export default function Features() {
  const features = [
    {
      icon: AlertCircle,
      title: "Report Issues",
      description: "Quickly report when a teacher is not present or not teaching in your school",
      color: "text-warning-600"
    },
    {
      icon: MapPin,
      title: "All Regions Covered",
      description: "Report from any region across Guyana - Demerara, Berbice, and Essequibo",
      color: "text-primary-600"
    },
    {
      icon: GraduationCap,
      title: "All School Levels",
      description: "Submit reports for nursery, primary, and secondary schools",
      color: "text-success-600"
    },
    {
      icon: Eye,
      title: "Track Progress",
      description: "Officers receive and respond to reports to ensure quick resolution",
      color: "text-primary-600"
    },
    {
      icon: Clock,
      title: "Real-Time Alerts",
      description: "Education officers are notified immediately when reports are submitted",
      color: "text-warning-600"
    },
    {
      icon: CheckCircle,
      title: "Quality Assurance",
      description: "Help maintain educational standards and ensure students receive proper instruction",
      color: "text-success-600"
    }
  ]

  return (
    <section className="py-16 lg:py-24 bg-muted">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              How EduAlert Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Our system makes it easy for parents, students, and community members to report 
              teacher absence and help ensure quality education for all.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-100"
              >
                <div className="flex items-start space-x-4">
                  <div className={`p-3 rounded-lg bg-gray-50 ${feature.color}`}>
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Process Steps */}
          <div className="mt-16">
            <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">Simple 3-Step Process</h3>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="bg-primary-500 text-white rounded-full w-12 h-12 flex items-center justify-center font-bold text-lg mx-auto mb-4">1</div>
                <h4 className="font-semibold text-gray-900 mb-2">Fill the Form</h4>
                <p className="text-gray-600 text-sm">Provide details about the school, grade, and teacher absence</p>
              </div>
              
              <div className="text-center">
                <div className="bg-warning-500 text-white rounded-full w-12 h-12 flex items-center justify-center font-bold text-lg mx-auto mb-4">2</div>
                <h4 className="font-semibold text-gray-900 mb-2">Automatic Assignment</h4>
                <p className="text-gray-600 text-sm">Your report is automatically sent to the responsible education officers</p>
              </div>
              
              <div className="text-center">
                <div className="bg-success-500 text-white rounded-full w-12 h-12 flex items-center justify-center font-bold text-lg mx-auto mb-4">3</div>
                <h4 className="font-semibold text-gray-900 mb-2">Quick Response</h4>
                <p className="text-gray-600 text-sm">Officers investigate and take appropriate action to resolve the issue</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
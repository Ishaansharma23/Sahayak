import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  HiHeart,
  HiLocationMarker,
  HiPhone,
  HiShieldCheck,
  HiClock,
  HiUserGroup,
  HiOfficeBuilding,
  HiTruck,
} from 'react-icons/hi';
import Button from '../components/common/Button';

const Home = () => {
  const features = [
    {
      icon: HiOfficeBuilding,
      title: 'Real-time Hospital Data',
      description: 'Live bed availability, ICU status, and emergency services across verified hospitals.',
      color: 'bg-blue-500',
    },
    {
      icon: HiUserGroup,
      title: 'Verified Doctors',
      description: 'Connect with verified healthcare professionals in your area.',
      color: 'bg-green-500',
    },
    {
      icon: HiTruck,
      title: 'Emergency Ambulance',
      description: 'Request ambulance instantly with real-time tracking and ETA.',
      color: 'bg-red-500',
    },
    {
      icon: HiShieldCheck,
      title: 'Women Safety SOS',
      description: 'One-tap emergency alert with live location sharing to trusted contacts.',
      color: 'bg-purple-500',
    },
    {
      icon: HiLocationMarker,
      title: 'Live Location Tracking',
      description: 'Track ambulances and emergency responders in real-time on map.',
      color: 'bg-orange-500',
    },
    {
      icon: HiClock,
      title: '24/7 Availability',
      description: 'Round-the-clock emergency services and support.',
      color: 'bg-teal-500',
    },
  ];

  const stats = [
    { value: '500+', label: 'Verified Hospitals' },
    { value: '2000+', label: 'Doctors' },
    { value: '50K+', label: 'Lives Saved' },
    { value: '100+', label: 'Cities' },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-red-500 to-secondary py-20 lg:py-32">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-flex items-center gap-2 bg-white/20 text-white px-4 py-2 rounded-full text-sm font-medium mb-6">
                <HiHeart className="w-4 h-4" />
                Your Safety, Our Priority
              </span>
              
              <h1 className="text-4xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                Real-Time Emergency
                <br />
                <span className="text-yellow-300">Hospital Network</span>
              </h1>
              
              <p className="text-xl text-white/90 mb-8 max-w-lg">
                Instantly find hospitals, request ambulances, and trigger SOS alerts. 
                Save precious time when every second counts.
              </p>

              <div className="flex flex-wrap gap-4">
                <Link to="/register">
                  <Button size="lg" className="bg-white text-primary hover:bg-gray-100">
                    Get Started Free
                  </Button>
                </Link>
                <Link to="/emergency">
                  <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                    <HiPhone className="w-5 h-5" />
                    Request Ambulance
                  </Button>
                </Link>
              </div>

              {/* Trust badges */}
              <div className="flex items-center gap-6 mt-8">
                <div className="flex items-center gap-2 text-white/80">
                  <HiShieldCheck className="w-5 h-5" />
                  <span className="text-sm">Verified Network</span>
                </div>
                <div className="flex items-center gap-2 text-white/80">
                  <HiClock className="w-5 h-5" />
                  <span className="text-sm">24/7 Support</span>
                </div>
              </div>
            </motion.div>

            {/* Hero Image/Illustration */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="hidden lg:block"
            >
              <div className="relative">
                {/* Main card */}
                <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20">
                  <div className="grid grid-cols-2 gap-4">
                    {/* Hospital card */}
                    <div className="bg-white rounded-xl p-4 shadow-xl">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <HiOfficeBuilding className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">City Hospital</p>
                          <p className="text-xs text-gray-500">2.5 km away</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                          15 beds available
                        </span>
                        <span className="text-xs text-gray-500">ICU: 3</span>
                      </div>
                    </div>

                    {/* Ambulance card */}
                    <div className="bg-white rounded-xl p-4 shadow-xl">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                          <HiTruck className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">Ambulance</p>
                          <p className="text-xs text-gray-500">En route</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                          ETA: 8 mins
                        </span>
                        <span className="text-xs text-gray-500">1.2 km</span>
                      </div>
                    </div>

                    {/* SOS Alert */}
                    <div className="col-span-2 bg-gradient-to-r from-red-500 to-red-600 rounded-xl p-4 text-white">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
                            <HiShieldCheck className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-semibold">SOS Protection</p>
                            <p className="text-xs text-white/80">One-tap emergency alert</p>
                          </div>
                        </div>
                        <Button size="sm" className="bg-white text-red-500 hover:bg-gray-100">
                          Activate
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating elements */}
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="absolute -top-4 -right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg"
                >
                  <span className="text-sm font-medium">🟢 Live Data</span>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <p className="text-4xl lg:text-5xl font-bold text-primary mb-2">
                  {stat.value}
                </p>
                <p className="text-gray-600 dark:text-gray-400">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <motion.span
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="inline-block bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4"
            >
              Features
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4"
            >
              Everything You Need in Emergency
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto"
            >
              LifeLine provides comprehensive emergency services at your fingertips
            </motion.p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -5 }}
                  className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-soft hover:shadow-lg transition-all duration-300"
                >
                  <div className={`w-14 h-14 ${feature.color} rounded-xl flex items-center justify-center mb-4`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {feature.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary to-secondary">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
              Ready to Secure Your Safety?
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Join thousands of users who trust LifeLine for their emergency needs.
              Register now and stay protected.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/register">
                <Button size="lg" className="bg-white text-primary hover:bg-gray-100">
                  Create Free Account
                </Button>
              </Link>
              <Link to="/hospitals">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                  Explore Hospitals
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Home;

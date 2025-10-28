"use client";

import { useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";
import { motion } from "framer-motion";
import {
  Heart,
  Stethoscope,
  MapPin,
  Phone,
  Calendar,
  FileText,
  Users,
  Shield,
  Zap,
  Star,
  ArrowRight,
  Activity,
  Clock,
  CheckCircle,
  Upload,
  User,
  Bell,
  UserPlus,
  Search,
  HeartHandshake,
  Mail,
  PhoneCall
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";

// Helper component for the Hero preview
const HeroDashboardPreview = () => (
  <div className="relative w-full max-w-lg mx-auto">
    <div className="absolute -top-8 -left-8 w-40 h-40 bg-emerald-100/50 rounded-full filter blur-xl opacity-70 animate-blob"></div>
    <div className="absolute -bottom-8 -right-8 w-40 h-40 bg-cyan-100/50 rounded-full filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.3, duration: 0.8, type: "spring", stiffness: 100 }}
      className="relative bg-white/70 backdrop-blur-xl border border-slate-200/80 rounded-2xl shadow-2xl shadow-slate-300/30 overflow-hidden"
    >
      <div className="flex justify-between items-center p-4 border-b border-slate-200/80">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-gradient-to-tr from-cyan-400 to-emerald-500 rounded-lg">
            <Heart className="w-5 h-5 text-white" />
          </div>
          <span className="font-semibold text-slate-700">SwasthyaSetu</span>
        </div>
        <div className="flex items-center space-x-3">
          <Bell className="w-5 h-5 text-slate-400 hover:text-slate-600 transition" />
          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-cyan-700">JD</div>
        </div>
      </div>
      <div className="p-6 space-y-6 bg-slate-50/50">
        <div className="flex justify-between items-center bg-gradient-to-r from-cyan-500 to-emerald-500 text-white p-4 rounded-xl">
          <div>
            <h3 className="font-bold text-lg">Good Morning, John!</h3>
            <p className="text-sm opacity-90">How are you feeling today?</p>
          </div>
          <div className="flex flex-col items-center justify-center bg-white/20 rounded-lg p-2 text-center">
            <span className="font-bold text-2xl">96</span>
            <span className="text-xs font-medium">Health Score</span>
          </div>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-600 mb-2">Quick Actions</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white p-3 rounded-lg border border-slate-200/80 flex items-center space-x-3 shadow-sm">
              <Calendar className="w-5 h-5 text-cyan-500" />
              <span className="text-sm font-medium text-slate-700">Book Appointment</span>
            </div>
            <div className="bg-white p-3 rounded-lg border border-slate-200/80 flex items-center space-x-3 shadow-sm">
              <Upload className="w-5 h-5 text-emerald-500" />
              <span className="text-sm font-medium text-slate-700">Upload Report</span>
            </div>
          </div>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-600 mb-2">Upcoming Appointment</h4>
          <div className="bg-white p-3 rounded-lg border border-slate-200/80 flex items-center justify-between shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center font-semibold text-slate-600 text-sm">SW</div>
              <div>
                <p className="text-sm font-semibold text-slate-800">Dr. Sarah Wilson</p>
                <p className="text-xs text-slate-500">Cardiologist</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-slate-700">Tomorrow</p>
              <p className="text-xs text-slate-500">2:00 PM</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  </div>
);


export default function Home() {
  const [activeSection, setActiveSection] = useState("");

  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1, transition: { duration: 0.5 } } };

  const observerOptions = {
    threshold: 0.5,
    rootMargin: "-80px 0px 0px 0px"
  };

  const { ref: howItWorksRef, inView: howItWorksInView } = useInView(observerOptions);
  const { ref: featuresRef, inView: featuresInView } = useInView(observerOptions);
  const { ref: pricingRef, inView: pricingInView } = useInView(observerOptions);
  const { ref: aboutRef, inView: aboutInView } = useInView(observerOptions);
  const { ref: contactRef, inView: contactInView } = useInView(observerOptions);

  useEffect(() => {
    if (howItWorksInView) setActiveSection("how-it-works");
    if (featuresInView) setActiveSection("features");
    if (pricingInView) setActiveSection("pricing");
    if (aboutInView) setActiveSection("about");
    if (contactInView) setActiveSection("contact");
  }, [howItWorksInView, featuresInView, pricingInView, aboutInView, contactInView]);

  const navItems = [
    { id: "how-it-works", name: "How It Works" },
    { id: "features", name: "Features" },
    { id: "pricing", name: "Pricing" },
    { id: "about", name: "Testimonials" },
    { id: "contact", name: "Contact" },
  ];

  const features = [
    { icon: Calendar, title: "Smart Appointment Booking", description: "Instantly book with preferred doctors using real-time availability." },
    { icon: Stethoscope, title: "AI-Powered Consultations", description: "Get AI-assisted diagnoses and personalized prescription advice." },
    { icon: MapPin, title: "Hospital Locator", description: "Find nearby hospitals with live bed availability and trusted ratings." },
    { icon: FileText, title: "Digital Medical Records", description: "Secure, encrypted storage for all your medical documents and history." },
    { icon: Phone, title: "Emergency SOS", description: "One-tap emergency help with GPS tracking and ambulance dispatch." },
    { icon: Activity, title: "Health Monitoring", description: "Track vitals, manage medications, and receive personalized health insights." }
  ];

  const stats = [
    { number: "50K+", label: "Happy Patients", icon: Users },
    { number: "1000+", label: "Verified Doctors", icon: Stethoscope },
    { number: "200+", label: "Partner Hospitals", icon: Heart },
    { number: "24/7", label: "Emergency Support", icon: Clock }
  ];

  const howItWorksSteps = [
    { icon: UserPlus, title: "Create Your Account", description: "Sign up in seconds and build your secure health profile." },
    { icon: Search, title: "Find a Doctor or Service", description: "Easily search for top-rated specialists or healthcare services near you." },
    { icon: HeartHandshake, title: "Get Quality Care", description: "Book your appointment, have a consultation, and manage your health all in one place." }
  ];

  const pricingPlans = [
    { name: "Personal", price: "Free", description: "For individuals managing their personal health.", features: ["Secure Medical Records", "Book 5 Appointments/mo", "Basic Health Monitoring", "Community Support"], cta: "Get Started Free", isPopular: false },
    { name: "Family Plus", price: "₹999", period: "/month", description: "For families to manage everyone's health together.", features: ["Everything in Personal", "Up to 5 Family Members", "Unlimited Appointments", "AI Consultation Credits", "Priority Support"], cta: "Choose Family Plan", isPopular: true },
    { name: "Hospital", price: "Custom", description: "For clinics and hospitals to manage their patients.", features: ["Everything in Family Plus", "Unlimited Doctors & Staff", "Patient Management System", "Dedicated Account Manager", "API & Integrations"], cta: "Contact Sales", isPopular: false },
  ];

  const testimonials = [
    { name: "Sarah L.", title: "Verified Patient", avatar: "https://images.unsplash.com/photo-1550525811-e5869dd03032?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80", quote: "SwasthyaSetu has been a lifesaver. I can manage my entire family's health records and appointments from one app. It's incredibly intuitive and has saved me so much time and stress." },
    { name: "Dr. Rajesh Kumar", title: "General Physician", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2.25&w=256&h=256&q=80", quote: "As a doctor, this platform streamlines my workflow significantly. The digital records are secure and easily accessible, which allows me to provide better, more informed care to my patients." }
  ];

  const healthcareGradientClass = "bg-gradient-to-r from-cyan-500 to-emerald-500";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed top-0 w-full bg-white/90 backdrop-blur-lg border-b border-slate-200/80 z-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <div className={`w-9 h-9 ${healthcareGradientClass} rounded-lg flex items-center justify-center shadow-md shadow-cyan-500/20`}>
                <Heart className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-bold text-slate-900">SwasthyaSetu</span>
            </Link>
            <div className="hidden md:flex space-x-8">
              {navItems.map((item) => (
                <Link
                  key={item.id}
                  href={`#${item.id}`}
                  className={`font-medium transition-colors ${activeSection === item.id
                      ? "text-cyan-600"
                      : "text-slate-600 hover:text-cyan-600"
                    }`}
                >
                  {item.name}
                </Link>
              ))}
            </div>
            <div className="flex items-center space-x-3">
              <Link href="/auth">
                <Button variant="ghost">Login</Button>
              </Link>
              <Link href="/auth">
                <Button className={`${healthcareGradientClass} text-white hover:opacity-90 transition-opacity shadow-lg shadow-cyan-500/30`}>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </motion.nav>

      <section id="hero" className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 w-[1500px] h-[1500px] rounded-full bg-gradient-radial from-cyan-50 via-emerald-50 to-transparent"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">
              <motion.div variants={itemVariants} className="space-y-4">
                <div className="inline-flex items-center bg-cyan-100/70 text-cyan-800 px-4 py-2 rounded-full text-sm font-semibold">
                  <Zap className="w-5 h-5 mr-2" />
                  The Future of Digital Healthcare
                </div>
                <h1 className="text-5xl lg:text-6xl font-bold tracking-tighter text-slate-900 leading-tight">
                  Your Health,
                  <span className="text-cyan-600"> Intelligently Connected</span>
                </h1>
                <p className="text-xl text-slate-600 max-w-lg">
                  Seamlessly connect with doctors and hospitals. Manage your health with our AI-powered platform for appointments, records, and emergency care.
                </p>
              </motion.div>
              <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4">
                <Link href="/auth">
                  <Button size="lg" className={`${healthcareGradientClass} text-white text-lg px-8 py-6 w-full sm:w-auto shadow-lg shadow-cyan-500/30 hover:opacity-95 transition-all transform hover:scale-105`}>
                    Start Your Journey <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
              </motion.div>
              <motion.div variants={itemVariants} className="flex items-center space-x-4 pt-4">
                <div className="flex -space-x-4">
                  <img className="inline-block h-12 w-12 rounded-full ring-2 ring-white" src="https://images.unsplash.com/photo-1491528323818-fdd1faba62cc?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="User" />
                  <img className="inline-block h-12 w-12 rounded-full ring-2 ring-white" src="https://images.unsplash.com/photo-1550525811-e5869dd03032?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="User" />
                  <img className="inline-block h-12 w-12 rounded-full ring-2 ring-white" src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2.25&w=256&h=256&q=80" alt="User" />
                </div>
                <div>
                  <div className="flex items-center space-x-1">{[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />)}</div>
                  <p className="text-sm text-slate-600 font-medium">Trusted by 50,000+ happy patients</p>
                </div>
              </motion.div>
            </motion.div>
            <HeroDashboardPreview />
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div key={index} initial={{ scale: 0.8, opacity: 0 }} whileInView={{ scale: 1, opacity: 1 }} transition={{ delay: index * 0.1, type: "spring", stiffness: 150 }} viewport={{ once: true, amount: 0.5 }} className="text-center">
                <div className="flex justify-center mb-4"><div className="p-4 bg-cyan-100/60 rounded-full"><stat.icon className="w-8 h-8 text-cyan-600" /></div></div>
                <div className="text-4xl font-bold text-slate-900 mb-2">{stat.number}</div>
                <div className="text-slate-500 font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" ref={howItWorksRef} className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.h2 initial={{ y: 20, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} viewport={{ once: true }} className="text-4xl lg:text-5xl font-bold tracking-tighter text-slate-900 mb-4">
              Get Started in 3 Easy Steps
            </motion.h2>
            <motion.p initial={{ y: 20, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} viewport={{ once: true }} className="text-lg text-slate-600 max-w-3xl mx-auto">
              Accessing world-class healthcare has never been simpler.
            </motion.p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 md:gap-12 relative">
            <div className="hidden md:block absolute top-1/2 left-0 w-full h-px -translate-y-1/2">
              <svg width="100%" height="2"><line x1="0" y1="1" x2="100%" y2="1" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="8 8" /></svg>
            </div>
            {howItWorksSteps.map((step, index) => (
              <motion.div key={index} initial={{ y: 50, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} transition={{ delay: index * 0.15 }} viewport={{ once: true }} className="text-center relative bg-slate-50 px-4">
                <div className="flex items-center justify-center w-20 h-20 mx-auto mb-6 rounded-full bg-white border-2 border-cyan-200 shadow-lg">
                  <step.icon className="w-10 h-10 text-cyan-600" />
                </div>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">{step.title}</h3>
                <p className="text-slate-600">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" ref={featuresRef} className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.h2 initial={{ y: 20, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} viewport={{ once: true }} className="text-4xl lg:text-5xl font-bold tracking-tighter text-slate-900 mb-4">A Complete Healthcare Ecosystem</motion.h2>
            <motion.p initial={{ y: 20, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} viewport={{ once: true }} className="text-lg text-slate-600 max-w-3xl mx-auto">Our integrated platform is designed to provide a seamless experience for patients, doctors, and hospitals alike.</motion.p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div key={index} initial={{ y: 50, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} transition={{ delay: index * 0.1 }} viewport={{ once: true }}>
                <Card className="h-full bg-slate-50/50 border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-cyan-400 transition-all duration-300 transform hover:-translate-y-2">
                  <CardHeader><div className="w-14 h-14 bg-gradient-to-br from-cyan-100 to-emerald-100 rounded-xl flex items-center justify-center mb-4"><feature.icon className="w-7 h-7 text-cyan-600" /></div><CardTitle className="text-xl font-semibold">{feature.title}</CardTitle></CardHeader>
                  <CardContent><CardDescription className="text-slate-600 text-base">{feature.description}</CardDescription></CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" ref={pricingRef} className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.h2 initial={{ y: 20, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} viewport={{ once: true }} className="text-4xl lg:text-5xl font-bold tracking-tighter text-slate-900 mb-4">
              Clear & Simple Pricing
            </motion.h2>
            <motion.p initial={{ y: 20, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} viewport={{ once: true }} className="text-lg text-slate-600 max-w-3xl mx-auto">
              Choose the plan that's right for you. No hidden fees, ever.
            </motion.p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 items-center">
            {pricingPlans.map((plan, index) => (
              <motion.div
                key={index}
                initial={{ y: 50, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ delay: index * 0.15 }}
                viewport={{ once: true }}
                className={`h-full ${plan.isPopular ? 'transform lg:scale-105' : ''}`}
              >
                <Card className={`h-full flex flex-col relative overflow-hidden border-2 ${plan.isPopular ? 'border-cyan-500' : 'border-slate-200/80'}`}>
                  {plan.isPopular && (<div className="absolute top-0 right-0 m-2 bg-cyan-500 text-white text-xs font-bold px-3 py-1 rounded-full">MOST POPULAR</div>)}
                  <CardHeader className="p-8"><CardTitle className="text-2xl font-bold">{plan.name}</CardTitle><div className="flex items-baseline mt-2"><span className="text-4xl font-extrabold tracking-tight">{plan.price}</span>{plan.period && <span className="ml-1 text-xl font-semibold text-slate-500">{plan.period}</span>}</div><CardDescription className="mt-4">{plan.description}</CardDescription></CardHeader>
                  <CardContent className="p-8 pt-0 flex-grow"><ul className="space-y-4">{plan.features.map((feature, fIndex) => (<li key={fIndex} className="flex items-start"><CheckCircle className="w-5 h-5 text-emerald-500 mr-3 flex-shrink-0 mt-1" /><span className="text-slate-700">{feature}</span></li>))}</ul></CardContent>
                  <div className="p-8 pt-0 mt-auto"><Button size="lg" className={`w-full text-lg ${plan.isPopular ? `${healthcareGradientClass} text-white shadow-lg shadow-cyan-500/30` : 'bg-slate-200 text-slate-800 hover:bg-slate-300'}`}>{plan.cta}</Button></div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="about" ref={aboutRef} className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.h2 initial={{ y: 20, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} viewport={{ once: true }} className="text-4xl lg:text-5xl font-bold tracking-tighter text-slate-900 mb-4">Loved by Patients and Doctors</motion.h2>
            <motion.p initial={{ y: 20, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} viewport={{ once: true }} className="text-lg text-slate-600 max-w-3xl mx-auto">Don't just take our word for it. Here's what people are saying about SwasthyaSetu.</motion.p>
          </div>
          <div className="grid lg:grid-cols-2 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div key={index} initial={{ y: 50, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} transition={{ delay: index * 0.15 }} viewport={{ once: true }}>
                <Card className="h-full bg-white p-8 border border-slate-200/80 shadow-lg shadow-slate-200/50">
                  <CardContent className="p-0 flex flex-col h-full"><div className="flex items-center mb-4">{[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />)}</div><blockquote className="text-slate-700 text-lg italic mb-6 flex-grow">"{testimonial.quote}"</blockquote><div className="flex items-center"><img className="w-14 h-14 rounded-full mr-4" src={testimonial.avatar} alt={testimonial.name} /><div><p className="font-semibold text-slate-900">{testimonial.name}</p><p className="text-cyan-600 font-medium">{testimonial.title}</p></div></div></CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className={`py-20 relative overflow-hidden ${healthcareGradientClass}`}>
        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2240%22%20height%3D%2240%22%20viewBox%3D%220%200%2040%2040%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%221%22%3E%3Cpath%20d%3D%22M0%2038.59l2.83-2.83%201.41%201.41L1.41%2040H0v-1.41zM0%201.4l2.83%202.83%201.41-1.41L1.41%200H0v1.41zM38.59%2040l-2.83-2.83%201.41-1.41L40%2038.59V40h-1.41zM40%201.41l-2.83%202.83-1.41-1.41L38.59%200H40v1.41zM20%2018.6l2.83-2.83%201.41%201.41L21.41%2020l2.83%202.83-1.41%201.41L20%2021.41l-2.83%202.83-1.41-1.41L18.59%2020l-2.83-2.83%201.41-1.41L20%2018.59z%22%3E%3C%2Fpath%3E%3C%2Fg%3E%3C%2Fsvg%3E')]"></div>
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.h2 initial={{ y: 20, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} viewport={{ once: true }} className="text-4xl font-bold text-white mb-6">Ready to Transform Your Healthcare Experience?</motion.h2>
          <motion.p initial={{ y: 20, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} viewport={{ once: true }} className="text-xl text-cyan-100 mb-10">Join thousands of patients and hundreds of providers revolutionizing healthcare with SwasthyaSetu.</motion.p>
          <motion.div initial={{ y: 20, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} viewport={{ once: true }} className="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
            <Link href="/auth"><Button size="lg" className="bg-white text-cyan-600 hover:bg-slate-100 px-8 py-3 text-lg font-bold w-full sm:w-auto transform hover:scale-105 transition-transform">Get Started For Free</Button></Link>
            <Link href="#contact"><Button size="lg" className="bg-white/10 border border-white/80 text-white hover:bg-white/20 px-8 py-3 text-lg w-full sm:w-auto font-bold transition-colors">Schedule a Demo</Button></Link>
          </motion.div>
        </div>
      </section>

      <section id="contact" ref={contactRef} className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.h2 initial={{ y: 20, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} viewport={{ once: true }} className="text-4xl lg:text-5xl font-bold tracking-tighter text-slate-900 mb-4">Get In Touch</motion.h2>
            <motion.p initial={{ y: 20, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} viewport={{ once: true }} className="text-lg text-slate-600 max-w-3xl mx-auto">Have questions or want a personalized demo? We're here to help.</motion.p>
          </div>
          <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-12 bg-slate-50 p-8 md:p-12 rounded-2xl border border-slate-200">
            <div className="space-y-8"><h3 className="text-2xl font-semibold text-slate-800">Contact Information</h3><div className="space-y-4"><a href="mailto:support@swasthyasetu.com" className="flex items-center space-x-3 text-slate-700 hover:text-cyan-600"><Mail className="w-5 h-5 text-cyan-500" /><span>support@swasthyasetu.com</span></a><a href="tel:+911234567890" className="flex items-center space-x-3 text-slate-700 hover:text-cyan-600"><PhoneCall className="w-5 h-5 text-cyan-500" /><span>+91 12345 67890</span></a></div><p className="text-slate-600">Our team is available 24/7 to assist with any inquiries you may have about our platform.</p></div>
            <form className="space-y-4"><div><label htmlFor="name" className="text-sm font-medium text-slate-700 sr-only">Name</label><Input id="name" type="text" placeholder="Your Name" /></div><div><label htmlFor="email" className="text-sm font-medium text-slate-700 sr-only">Email</label><Input id="email" type="email" placeholder="Your Email" /></div><div><label htmlFor="message" className="text-sm font-medium text-slate-700 sr-only">Message</label><Textarea id="message" placeholder="Your Message or Demo Request" rows={5} /></div><Button type="submit" size="lg" className={`w-full text-white ${healthcareGradientClass} hover:opacity-90`}>Send Message</Button></form>
          </div>
        </div>
      </section>

      <footer className="bg-slate-900 text-slate-300 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12">
            <div className="space-y-4 col-span-1 md:col-span-1">
              <div className="flex items-center space-x-2"><div className={`w-9 h-9 ${healthcareGradientClass} rounded-lg flex items-center justify-center`}><Heart className="w-5 h-5 text-white" /></div><span className="text-xl font-bold text-white">SwasthyaSetu</span></div>
              <p className="text-slate-400">Connecting healthcare, empowering lives. Your trusted partner in modern digital health.</p>
            </div>
            <div className="col-span-1"><h4 className="text-lg font-semibold text-white mb-4">Platform</h4><ul className="space-y-3 text-slate-400"><li><Link href="/auth" className="hover:text-white transition-colors">Patient Portal</Link></li><li><Link href="/auth" className="hover:text-white transition-colors">Doctor Portal</Link></li><li><Link href="/auth" className="hover:text-white transition-colors">Hospital Management</Link></li><li><Link href="/emergency" className="hover:text-white transition-colors">Emergency SOS</Link></li></ul></div>
            <div className="col-span-1"><h4 className="text-lg font-semibold text-white mb-4">Company</h4><ul className="space-y-3 text-slate-400"><li><Link href="#about" className="hover:text-white transition-colors">About Us</Link></li><li><Link href="#contact" className="hover:text-white transition-colors">Contact</Link></li><li><Link href="#" className="hover:text-white transition-colors">Careers</Link></li><li><Link href="#" className="hover:text-white transition-colors">Press</Link></li></ul></div>
            <div className="col-span-1"><h4 className="text-lg font-semibold text-white mb-4">Legal</h4><ul className="space-y-3 text-slate-400"><li><Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link></li><li><Link href="#" className="hover:text-white transition-colors">Terms of Service</Link></li></ul></div>
          </div>
          <div className="border-t border-slate-800 mt-12 pt-8 text-center text-slate-500"><p>&copy; {new Date().getFullYear()} SwasthyaSetu. All rights reserved. Built with ❤️ for better healthcare.</p></div>
        </div>
      </footer>
    </div>
  );
}
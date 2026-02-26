import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import SiteNav from "@/components/layout/SiteNav";
import SiteFooter from "@/components/layout/SiteFooter";
import { PROGRAMS } from "@/lib/programs";

export const metadata: Metadata = {
  title: "Pathfinder Outdoor Education Center",
  description: "Five youth programs. One family portal. Adventure, leadership, and skills for ages 5-21.",
};

// Program images - using high-quality photos
const PROGRAM_IMAGES: Record<string, string> = {
  "cub-scouts": "https://i0.wp.com/danbeard.org/wp-content/uploads/2025/06/Activities_Cubs_3.jpg?w=800&q=80",
  "boy-scouts": "https://media.gettyimages.com/id/1448460291/photo/adventure-camping-travel-tourism-hike-and-people-concept-boy-scout-at-camp-in-woods.jpg?s=1024&q=80",
  "rangers": "https://www.adventuretreks.com/wp-content/uploads/2025/01/CC1-22-PXL_20220709_035436503-1200.jpg",
  "squadron": "https://tillyslifecenter.org/wp-content/uploads/2021/06/TLC_Blogs-June-Outdoor-activities-hiking.jpg",
  "shooting-club": "https://www.outdooreducationcenter.org/wp-content/uploads/2019/11/archery-kids-900x720.jpg",
};

const HERO_IMAGE = "https://thumbs.dreamstime.com/b/group-boy-scouts-hiking-forest-boys-wearing-scout-uniforms-backpacks-explore-wilderness-adventure-camping-group-390904937.jpg";

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-dvh bg-slate-50">
      <SiteNav />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative h-[85vh] min-h-[600px]">
          <Image
            src={HERO_IMAGE}
            alt="Kids hiking together"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/85 via-slate-900/50 to-slate-900/30" />
          
          <div className="relative h-full flex items-center">
            <div className="max-w-7xl mx-auto px-6 w-full">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-md rounded-full text-white text-sm font-medium mb-6 border border-white/10">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                  Five programs for ages 5-18
                </div>
                <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
                  Build Skills.<br />
                  <span className="text-emerald-400">Make Friends.</span><br />
                  Have Adventures.
                </h1>
                <p className="text-lg text-slate-200 mb-8 max-w-lg">
                  From Cub Scouts to shooting sports — give your kid a community that powers their potential.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Link 
                    href="/register" 
                    className="px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-full text-lg transition hover:scale-105 shadow-lg shadow-emerald-500/25"
                  >
                    Start Free
                  </Link>
                  <Link 
                    href="/calendar" 
                    className="px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur text-white font-semibold rounded-full text-lg transition border border-white/20"
                  >
                    View Calendar
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Bar */}
        <section className="py-12 bg-white border-b border-slate-100">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { value: "5", label: "Programs" },
                { value: "500+", label: "Members" },
                { value: "50+", label: "Events/Year" },
                { value: "25+", label: "Leaders" },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-4xl font-bold text-emerald-600">{stat.value}</div>
                  <div className="text-slate-500 font-medium">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Programs Grid */}
        <section className="py-24 px-6 bg-slate-50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-slate-800 mb-4">Find Your Place</h2>
              <p className="text-slate-500 text-lg max-w-xl mx-auto">
                Every kid belongs here. Pick the program that fits your child's interests and age.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              {PROGRAMS.map((program) => (
                <Link
                  key={program.slug}
                  href={program.href}
                  className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300"
                >
                  <div className="relative h-56">
                    {PROGRAM_IMAGES[program.slug] ? (
                      <img 
                        src={PROGRAM_IMAGES[program.slug]} 
                        alt={program.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      />
                    ) : (
                      <div className={`w-full h-full ${program.bgColor} flex items-center justify-center text-6xl`}>
                        {program.icon}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-4 left-4">
                      <span className="px-3 py-1 bg-emerald-500 text-white text-xs font-bold rounded-full">
                        {program.ageRange}
                      </span>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-slate-800 mb-2">{program.icon} {program.name}</h3>
                    <p className="text-slate-500 text-sm mb-4">{program.tagline}</p>
                    <span className="inline-flex items-center text-emerald-600 font-semibold text-sm group-hover:underline">
                      Learn more <ArrowRight className="w-4 h-4 ml-1" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Community Photo Grid */}
        <section className="py-24 px-6 bg-emerald-900">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-white mb-4">Our Community</h2>
              <p className="text-emerald-200 text-lg">Real kids. Real adventures. Real growth.</p>
            </div>
            
            <div className="grid grid-cols-4 grid-rows-2 gap-4 h-[500px]">
              <div className="col-span-2 row-span-2 rounded-2xl overflow-hidden">
                <img 
                  src="https://i0.wp.com/danbeard.org/wp-content/uploads/2025/06/Activities_Cubs_3.jpg?w=800&q=80" 
                  alt="Campfire fun"
                  className="w-full h-full object-cover hover:scale-105 transition duration-500"
                />
              </div>
              <div className="col-span-1 row-span-1 rounded-2xl overflow-hidden">
                <img 
                  src="https://static.vecteezy.com/system/resources/previews/029/628/172/non_2x/boy-scouts-team-climbing-with-backpacks-standing-on-mountain-boy-scouts-rejoice-at-rock-climbing-success-in-scout-camp-at-sunset-scout-camp-view-free-photo.jpg" 
                  alt="Mountain climbing"
                  className="w-full h-full object-cover hover:scale-105 transition duration-500"
                />
              </div>
              <div className="col-span-1 row-span-1 rounded-2xl overflow-hidden">
                <img 
                  src="https://www.adventuretreks.com/wp-content/uploads/2025/01/CC1-22-PXL_20220709_035436503-1200.jpg" 
                  alt="Teens adventure"
                  className="w-full h-full object-cover hover:scale-105 transition duration-500"
                />
              </div>
              <div className="col-span-1 row-span-1 rounded-2xl overflow-hidden">
                <img 
                  src="https://www.outdooreducationcenter.org/wp-content/uploads/2019/11/archery-kids-900x720.jpg" 
                  alt="Archery"
                  className="w-full h-full object-cover hover:scale-105 transition duration-500"
                />
              </div>
              <div className="col-span-1 row-span-1 rounded-2xl overflow-hidden">
                <img 
                  src="https://tillyslifecenter.org/wp-content/uploads/2021/06/TLC_Blogs-June-Outdoor-activities-hiking.jpg" 
                  alt="Hiking"
                  className="w-full h-full object-cover hover:scale-105 transition duration-500"
                />
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 px-6 bg-white">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl font-bold text-slate-800 mb-4">Ready to Begin?</h2>
            <p className="text-slate-500 text-lg mb-8">
              Join hundreds of families who've made Pathfinder part of their story. Registration takes less than 5 minutes.
            </p>
            <Link 
              href="/register" 
              className="inline-block px-10 py-5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-full text-xl transition hover:scale-105 shadow-lg shadow-emerald-500/25"
            >
              Register Your Family — Free
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

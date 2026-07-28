'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { motion } from 'framer-motion';
import {
  Lightbulb,
  ShieldCheck,
  Trophy,
  Heart,
  MapPin,
  Calendar,
  Users,
  Target,
  Eye,
  Mail,
  Phone,
  MessageCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useLanguage } from '@/contexts/language-context';

const AfricanPatternSVG = dynamic(
  () => import('@/components/common/decorative-svg').then((mod) => mod.AfricanPatternSVG),
  { ssr: false }
);
const MozambiqueMapSVG = dynamic(
  () => import('@/components/common/decorative-svg').then((mod) => mod.MozambiqueMapSVG),
  { ssr: false }
);

const values = [
  {
    icon: Lightbulb,
    titleKey: 'about.valueInnovation',
    descKey: 'about.valueInnovationDesc',
    color: 'bg-yellow-100 text-yellow-600',
  },
  {
    icon: ShieldCheck,
    titleKey: 'about.valueIntegrity',
    descKey: 'about.valueIntegrityDesc',
    color: 'bg-emerald-100 text-emerald-600',
  },
  {
    icon: Trophy,
    titleKey: 'about.valueExcellence',
    descKey: 'about.valueExcellenceDesc',
    color: 'bg-orange-100 text-orange-600',
  },
  {
    icon: Heart,
    titleKey: 'about.valueCommunity',
    descKey: 'about.valueCommunityDesc',
    color: 'bg-red-100 text-red-600',
  },
];

const teamMembers = [
  { nameKey: 'about.teamMemberCeo', roleKey: 'about.teamMemberCeoRole', initials: 'CS' },
];

const historyStats = [
  { icon: Calendar, value: '2019', labelKey: 'about.statFounded' },
  { icon: Users, value: '1', labelKey: 'about.statTeamSize' },
  { icon: MapPin, valueKey: 'about.statLocationValue', labelKey: 'about.statLocation' },
  { icon: Target, value: '50+', labelKey: 'about.statProjects' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export function AboutSection() {
  const { t } = useLanguage();

  return (
    <section id="about" className="relative py-16 sm:py-24 bg-muted/30 overflow-hidden">
      {/* Decorative backgrounds */}
      <Suspense fallback={null}>
        <AfricanPatternSVG className="top-[5%] right-[2%] w-[200px] h-[200px]" opacity={0.04} />
        <MozambiqueMapSVG className="bottom-[5%] left-[2%] w-[400px] h-[200px]" opacity={0.04} />
      </Suspense>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            {t('about.title')}
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {t('about.subtitle')}
          </p>
        </motion.div>

        {/* Mission & Vision */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12"
        >
          <motion.div variants={itemVariants}>
            <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200 h-full">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-600 text-white">
                    <Target className="h-5 w-5" />
                  </div>
                  <CardTitle>{t('about.mission')}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-foreground leading-relaxed">
                  {t('about.missionText')}
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="bg-gradient-to-br from-teal-50 to-teal-100/50 border-teal-200 h-full">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-teal-600 text-white">
                    <Eye className="h-5 w-5" />
                  </div>
                  <CardTitle>{t('about.vision')}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-foreground leading-relaxed">
                  {t('about.visionText')}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Values */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8"
        >
          <h3 className="text-2xl font-bold mb-2">{t('about.values')}</h3>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12"
        >
          {values.map((v) => {
            const IconComponent = v.icon;
            return (
              <motion.div key={v.titleKey} variants={itemVariants}>
                <Card className="text-center hover:shadow-md transition-shadow h-full">
                  <CardContent className="p-6">
                    <div
                      className={`inline-flex p-3 rounded-xl mb-4 ${v.color}`}
                    >
                      <IconComponent className="h-6 w-6" />
                    </div>
                    <h4 className="font-semibold text-lg mb-2">
                      {t(v.titleKey)}
                    </h4>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {t(v.descKey)}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>

        <Separator className="mb-12" />

        {/* Company History Stats */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12"
        >
          {historyStats.map((stat) => {
            const IconComponent = stat.icon;
            const displayValue = stat.valueKey ? t(stat.valueKey) : stat.value;
            const displayLabel = stat.labelKey ? t(stat.labelKey) : '';
            return (
              <motion.div key={stat.labelKey || stat.value} variants={itemVariants}>
                <div className="text-center p-4 rounded-xl bg-white border shadow-sm">
                  <IconComponent className="h-5 w-5 text-emerald-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-emerald-700">
                    {displayValue}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {displayLabel}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        <Separator className="mb-12" />

        {/* Team */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8"
        >
          <h3 className="text-2xl font-bold mb-2">{t('about.teamTitle')}</h3>
          <p className="text-muted-foreground">
            {t('about.teamSubtitle')}
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-md mx-auto"
        >
          {teamMembers.map((member) => (
            <motion.div key={member.nameKey} variants={itemVariants}>
              <div className="text-center p-6 rounded-xl bg-white border shadow-sm hover:shadow-md transition-shadow">
                <Avatar className="h-20 w-20 mx-auto mb-3 border-2 border-emerald-200">
                  <AvatarFallback className="bg-emerald-100 text-emerald-700 font-semibold text-xl">
                    {member.initials}
                  </AvatarFallback>
                </Avatar>
                <p className="font-medium text-sm">{t(member.nameKey)}</p>
                <p className="text-xs text-muted-foreground">{t(member.roleKey)}</p>
                <p className="text-xs text-emerald-600 mt-1">{t('about.teamMemberCeoNote')}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Contact Info */}
        <Separator className="my-12" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto"
        >
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-600 text-white">
                  <Mail className="h-5 w-5" />
                </div>
                <CardTitle>{t('about.contactTitle')}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Email */}
                <div className="flex items-start gap-3">
                  <Mail className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                  <div className="text-sm text-foreground leading-relaxed">
                    <a href="mailto:carsaimozambique@gmail.com" className="hover:text-blue-600 hover:underline">
                      carsaimozambique@gmail.com
                    </a>
                    <br />
                    <a href="mailto:suporte.carsaimz@gmail.com" className="hover:text-blue-600 hover:underline">
                      suporte.carsaimz@gmail.com
                    </a>
                  </div>
                </div>

                {/* M-Pesa / Phone */}
                <div className="flex items-start gap-3">
                  <Phone className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                  <div className="text-sm text-foreground leading-relaxed">
                    {t('about.contactInfo')}
                  </div>
                </div>

                {/* WhatsApp */}
                <div className="flex items-start gap-3">
                  <MessageCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                  <div className="text-sm text-foreground">
                    <a
                      href="https://wa.me/258847545020"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-green-600 hover:underline"
                    >
                      WhatsApp: +258 84 754 5020
                    </a>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}

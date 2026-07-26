'use client';

import { motion } from 'framer-motion';
import { Shield, FileText, Eye, Lock, Users, Mail } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { useLanguage } from '@/contexts/language-context';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export function PrivacyPage() {
  const { t } = useLanguage();

  const sections = [
    {
      icon: FileText,
      title: 'Introdução',
      content: 'A Carsai Moçambique Lda. ("Carsai", "nós", "a empresa") respeita a privacidade de todos os utilizadores dos nossos serviços digitais. Esta Política de Privacidade descreve como recolhemos, utilizamos, armazenamos e protegemos os seus dados pessoais quando utiliza a nossa plataforma tecnológica, website e serviços relacionados. A nossa sede está localizada em Maputo, Moçambique, e estamos registados conforme a legislação moçambicana. Esta política aplica-se a todos os serviços fornecidos pela Carsai, incluindo desenvolvimento web, aplicações mobile, soluções cloud e serviços de inteligência artificial.',
    },
    {
      icon: Eye,
      title: 'Recolha de Dados',
      content: 'Recolhemos dados pessoais que você nos fornecer diretamente quando se regista na nossa plataforma, submete formulários de contacto, solicita serviços ou comunica com nossa equipa. Estes dados podem incluir: nome completo, endereço de email, número de telefone, endereço físico, informações da empresa, dados de pagamento e preferências de comunicação. Também recolhemos dados de utilização automaticamente quando visita nosso website, incluindo: endereço IP, tipo de browser, páginas visitadas, tempo de visita, dados de cookies e informações sobre o dispositivo utilizado. Não recolhemos dados sensíveis como informações de saúde, orientação política ou dados biométricos sem o seu consentimento explícito.',
    },
    {
      icon: Shield,
      title: 'Utilização dos Dados',
      content: 'Utilizamos os seus dados pessoais para fornecer e melhorar os nossos serviços tecnológicos, processar transações e pagamentos, comunicar com você sobre serviços, atualizações e promoções, personalizar a sua experiência na plataforma, realizar análises de mercado e estatísticas internas, cumprir obrigações legais e regulatórias moçambicanas, e prevenir fraudes e actividades ilegais. Todos os dados são processados de forma legítima, com base no consentimento, execução de contrato ou interesse legítimo da empresa, conforme a legislação de proteção de dados aplicável em Moçambique.',
    },
    {
      icon: Lock,
      title: 'Cookies e Tecnologias de Rastreamento',
      content: 'Utilizamos cookies e tecnologias similares para melhorar a funcionalidade do nosso website e personalizar a sua experiência. Os cookies que utilizamos incluem: cookies essenciais para o funcionamento básico do site, cookies de performance para analisar como os utilizadores interagem com o site, cookies de funcionalidade para recordar as suas preferências, e cookies de marketing para apresentar conteúdo relevante. Você pode gerir as suas preferências de cookies através das configurações do browser. Para mais detalhes, consulte nossa Política de Cookies separada disponível em /cookies.',
    },
    {
      icon: Users,
      title: 'Partilha com Terceiros',
      content: 'Não vendemos, alugamos ou comercializamos os seus dados pessoais a terceiros. Podemos partilhar dados limitados com: prestadores de serviços que nos assistem na operação da plataforma (hosting, processamento de pagamentos via M-Pesa, análise de dados), parceiros de afiliados conforme o nosso programa de parcerias, autoridades governamentais quando exigido por lei ou ordem judicial moçambicana, e outros entidades com o seu consentimento explícito. Todos os prestadores de serviços estão vinculados por contratos de confidencialidade e proteção de dados.',
    },
    {
      icon: Lock,
      title: 'Direitos do Utilizador',
      content: 'Conforme a legislação moçambicana de proteção de dados, você tem os seguintes direitos: direito de acesso aos seus dados pessoais, direito de rectificação de dados incorrectos, direito de eliminação dos seus dados ("direito ao oblivio"), direito de portabilidade dos seus dados, direito de oposição ao processamento, direito de retirar o consentimento a qualquer momento. Para exercer qualquer destes direitos, contacte-nos através de privacy@carsai.mz ou pelo endereço físico: Av. 24 de Julho, 1234, Maputo, Moçambique. Responderemos dentro de 30 dias conforme a legislação aplicável.',
    },
    {
      icon: Mail,
      title: 'Contacto e Actualizações',
      content: 'Esta Política de Privacidade foi actualizada pela última vez em Janeiro de 2026. Podemos actualizar esta política periodicamente para reflectir alterações nos nossos serviços ou na legislação. Notificaremos os utilizadores sobre alterações significativas via email ou através do nosso website. Para questões sobre privacidade, contacte: Email: privacy@carsai.mz | Telefone: +258 21 000 000 | Endereço: Av. 24 de Julho, 1234, Maputo, Moçambique. O responsável pela proteção de dados é Carlos Silva, Director Executivo da Carsai Moçambique.',
    },
  ];

  return (
    <section className="py-16 sm:py-24 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex p-3 rounded-xl bg-emerald-100 text-emerald-700 mb-4">
            <Shield className="h-8 w-8" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">Política de Privacidade</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Carsai Moçambique — Proteger os seus dados é nossa prioridade
          </p>
          <p className="text-sm text-muted-foreground mt-2">Última atualização: Janeiro 2026</p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          {sections.map((section, index) => {
            const IconComponent = section.icon;
            return (
              <motion.div key={index} variants={itemVariants}>
                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <CardTitle className="text-xl">{section.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed">{section.content}</p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>

        <Separator className="my-8" />

        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Consulte também:{' '}
            <Link href="/terms" className="text-emerald-600 hover:underline">Termos e Condições</Link>
            {' · '}
            <Link href="/cookies" className="text-emerald-600 hover:underline">Política de Cookies</Link>
          </p>
        </div>
      </div>
    </section>
  );
}

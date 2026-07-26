'use client';

import { motion } from 'framer-motion';
import { Scale, Briefcase, BookOpen, Shield, AlertTriangle, XCircle, Gavel } from 'lucide-react';
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

export function TermsPage() {
  const { t } = useLanguage();

  const sections = [
    {
      icon: Scale,
      title: 'Termos Gerais',
      content: 'Estes Termos e Condições ("Termos") regulam a utilização dos serviços tecnológicos fornecidos pela Carsai Moçambique Lda., incluindo o nosso website, plataforma digital, aplicações mobile, soluções cloud e serviços de inteligência artificial. Ao aceder ou utilizar qualquer dos nossos serviços, você aceita estes Termos na sua totalidade. Se não concorda com qualquer parte dos Termos, não deverá utilizar os nossos serviços. A Carsai Moçambique está registada em Maputo, Moçambique, e opera conforme a legislação comercial e tecnológica moçambicana. Estes Termos constituem um contrato legal entre você ("Utilizador") e a Carsai Moçambique Lda. ("Empresa").',
    },
    {
      icon: Briefcase,
      title: 'Serviços Fornecidos',
      content: 'A Carsai Moçambique fornece serviços de transformação digital incluindo: desenvolvimento de websites e aplicações web, desenvolvimento de aplicações mobile para iOS e Android, soluções de infraestrutura cloud e hosting, serviços de inteligência artificial e automação, consultoria tecnológica e estratégia digital, e manutenção e suporte técnico continuado. Os serviços específicos fornecidos a cada utilizador são definidos no contrato de serviço ou proposta comercial acordada. A empresa reserva-se o direito de modificar, suspender ou descontinuar qualquer serviço com notificação prévia de 30 dias, excepto em casos de força maior ou emergência técnica.',
    },
    {
      icon: BookOpen,
      title: 'Obrigações do Utilizador',
      content: 'Como utilizador dos nossos serviços, você compromete-se a: fornecer informações verdadeiras e completas durante o registo e utilização da plataforma, utilizar os serviços apenas para fins legais e conforme a legislação moçambicana, não tentar acessar áreas restritas do sistema sem autorização, não realizar actividades que possam danificar, desabilitar ou sobrecarregar os servidores da Carsai, proteger as suas credenciais de acesso e não partilhá-las com terceiros, cumprir com todas as políticas de pagamento e cobrança acordadas, e comunicar imediatamente qualquer utilização não autorizada dos seus dados de acesso.',
    },
    {
      icon: Shield,
      title: 'Propriedade Intelectual',
      content: 'Todos os conteúdos, design, código, gráficos, logos e materiais presentes nos serviços da Carsai Moçambique são propriedade da empresa ou dos seus licenciadores, protegidos pela legislação de propriedade intelectual moçambicana e internacional. O nome "Carsai", o logo da empresa, e os designs da plataforma são marcas registadas. O código-fonte desenvolvido pela Carsai para os seus serviços internos é propriedade exclusiva da empresa. Para trabalhos desenvolidos especificamente para clientes, os direitos de propriedade intelectual são definidos no contrato de serviço específico, sendo que a Carsai reserva-se o direito de utilizar técnicas e metodologias gerais desenvolidas durante o projecto.',
    },
    {
      icon: AlertTriangle,
      title: 'Limitações de Responsabilidade',
      content: 'A Carsai Moçambique não será responsável por: perdas indirectas, consequenciais ou incidentais resultantes da utilização dos serviços, interrupções de serviço causadas por factores externos (falhas de internet, problemas de fornecedores de infraestrutura), danos resultantes de utilização não autorizada da plataforma, perdas resultantes de falhas de pagamento do utilizador, ou qualquer impossibilidade de utilização dos serviços por causas fora do controle da empresa. A responsabilidade total da Carsai em qualquer circunstância não excederá o valor dos serviços pagos pelo utilizador nos 12 meses anteriores. Esta limitação aplica-se conforme a legislação comercial moçambicana.',
    },
    {
      icon: XCircle,
      title: 'Rescisão',
      content: 'A Carsai Moçambique pode rescindir o contrato com qualquer utilizador que viole estes Termos, com notificação prévia de 15 dias para violações menores, ou imediatamente para violações graves incluindo actividades fraudulentas, acesso não autorizado, ou violação de propriedade intelectual. O utilizador pode rescindir o contrato a qualquer momento, com notificação prévia de 30 dias para serviços com contrato de duração. Após rescisão, a Carsai manterá os dados do utilizador por um período de 90 dias, após o qual serão eliminados permanentemente, excepto quando exigido por lei. Taxas já pagas não são reembolsáveis excepto conforme condições específicas do contrato de serviço.',
    },
    {
      icon: Gavel,
      title: 'Lei Aplicável e Jurisdição',
      content: 'Estes Termos são regidos e interpretados conforme a legislação da República de Moçambique, incluindo o Código Comercial, legislação de proteção de dados, e regulamentos tecnológicos aplicáveis. Quaisquer disputas relacionadas com estes Termos serão resolvidas preferencialmente através de negociação directa entre as partes. Se a negociação não for possível dentro de 60 dias, a disputa será submetida à arbitragem conforme as normas do Centro de Arbitragem de Moçambique, ou aos tribunais da cidade de Maputo, Moçambique, como jurisdição exclusiva. As partes reconhecem a competência exclusiva dos tribunais moçambicanos para resolver conflitos decorrentes destes Termos.',
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
            <Scale className="h-8 w-8" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">Termos e Condições</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Carsai Moçambique — Regulamento de utilização dos nossos serviços
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
            <Link href="/privacy" className="text-emerald-600 hover:underline">Política de Privacidade</Link>
            {' · '}
            <Link href="/cookies" className="text-emerald-600 hover:underline">Política de Cookies</Link>
          </p>
        </div>
      </div>
    </section>
  );
}

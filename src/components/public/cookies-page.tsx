'use client';

import { motion } from 'framer-motion';
import { Cookie, Settings, BarChart3, ToggleLeft, Globe, RefreshCw } from 'lucide-react';
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

export function CookiesPage() {
  const { t } = useLanguage();

  const sections = [
    {
      icon: Cookie,
      title: 'O que são Cookies',
      content: 'Cookies são pequenos arquivos de texto que são armazenados no seu dispositivo (computador, tablet ou smartphone) quando você visita um website. Eles permitem que o website reconheça o seu dispositivo e armazene informações sobre as suas preferências ou ações anteriores. Os cookies são uma tecnologia padrão utilizada por quase todos os websites modernos e são essenciais para o funcionamento de muitas funcionalidades web. Existem diferentes tipos de cookies: cookies de sessão (eliminados quando você fecha o browser), cookies persistentes (mantidos entre sessões), cookies primários (definidos pelo website que você está visitando), e cookies de terceiros (definidos por outros serviços integrados no website).',
    },
    {
      icon: Settings,
      title: 'Tipos de Cookies que Utilizamos',
      content: 'Utilizamos vários tipos de cookies na plataforma Carsai Moçambique: Cookies Essenciais — necessários para o funcionamento básico do site, incluindo autenticação, segurança e preferências de idioma. Sem estes cookies, o site não funciona correctamente. Cookies de Performance — recolhem informações sobre como os utilizadores utilizam o site, como páginas mais visitadas e tempo de navegação. Utilizamos Google Analytics para estas análises, ajudando-nos a melhorar a experiência do utilizador. Cookies de Funcionalidade — permitem que o site recorde escolhas que você faz (como idioma seleccionado, região, ou configurações de tema) e proporcionam funcionalidades personalizadas. Cookies de Marketing — utilizados para apresentar conteúdo relevante e limitar a frequência de anúncios. Estes cookies podem ser definidos por nós ou por nossos parceiros de advertising.',
    },
    {
      icon: BarChart3,
      title: 'Como Utilizamos os Cookies',
      content: 'Utilizamos cookies para: garantir que o website funciona correctamente e de forma segura, recordar as suas preferências de idioma e configurações de tema (claro/escuro), analisar o tráfego e comportamento dos utilizadores para melhorar os nossos serviços, personalizar o conteúdo e funcionalidades apresentados, processar transações de pagamento de forma segura via M-Pesa e outros métodos, manter a sua sessão de autenticação ativa durante a navegação, fornecer funcionalidades de chat e assistência AI com memória de sessão, e medir a eficácia das nossas campanhas de marketing e comunicações. Todos os dados recolhidos através de cookies são processados de forma anónima ou pseudonimizada, e nunca são utilizados para identificar directamente um indivíduo sem o seu consentimento.',
    },
    {
      icon: ToggleLeft,
      title: 'Gestão de Cookies',
      content: 'Você pode gerir e controlar os cookies de várias formas: Configurações do Browser — maioria dos browsers permitem que você veja, elimine e bloque cookies nas configurações. Consulte a documentação do seu browser para instruções específicas. Opt-out de Google Analytics — pode instalar o plugin de opt-out do Google Analytics para impedir a recolha de dados. Consentimento na Platforma — quando visita o nosso site pela primeira vez, apresentamos um banner de consentimento de cookies onde pode aceitar ou rejeitar categorias específicas. Configurações de Conta — utilizadores registados podem ajustar as preferências de cookies nas configurações da sua conta. Note-se que a eliminação de cookies essenciais pode afectar o funcionamento do site. Cookies de funcionalidade e marketing podem ser rejeitados sem impacto significativo.',
    },
    {
      icon: Globe,
      title: 'Cookies de Terceiros',
      content: 'O nosso website integra serviços de terceiros que podem definir os seus próprios cookies: Google Analytics — para análise de tráfego e comportamento dos utilizadores. Google define cookies _ga e _gid para estas finalidades. M-Pesa / Vodacom — para processamento de pagamentos seguros. Estes serviços podem definir cookies temporários durante o processo de pagamento. Cloudflare — para segurança e performance do website, incluindo protecção contra ataques DDoS e optimização de conteúdo. Social Media Plugins — Facebook, Twitter, LinkedIn e Instagram podem definir cookies quando você utiliza funcionalidades de partilha social presentes no nosso site. Chat AI Services — serviços de assistência AI podem manter cookies de sessão para preservar o contexto da conversa.',
    },
    {
      icon: RefreshCw,
      title: 'Actualizações da Política',
      content: 'Esta Política de Cookies foi actualizada pela última vez em Janeiro de 2026. A Carsai Moçambique revisa periodicamente esta política para garantir que reflecte as práticas actuais e a legislação relevante. Alterações significativas serão comunicadas através do nosso website e por email quando aplicável. A utilização continuada dos nossos serviços após alterações na política constitui aceitação dos novos termos. Para questões sobre cookies, contacte: Email: privacy@carsai.mz | Telefone: +258 21 000 000 | Endereço: Av. 24 de Julho, 1234, Maputo, Moçambique. Para exercer os seus direitos relativos a dados recolhidos via cookies, consulte também nossa Política de Privacidade disponível em /privacy.',
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
            <Cookie className="h-8 w-8" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">Política de Cookies</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Carsai Moçambique — Transparência sobre a utilização de cookies
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
            <Link href="/terms" className="text-emerald-600 hover:underline">Termos e Condições</Link>
          </p>
        </div>
      </div>
    </section>
  );
}

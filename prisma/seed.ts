import { PrismaClient, UserRole, UserStatus, ThemeChoice, RiskLevel, ConsentStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting Vibeo seed...')

  // =============================================
  // TERMS OF USE
  // =============================================
  const terms = await prisma.termsOfUse.upsert({
    where: { version: '1.0.0' },
    update: {},
    create: {
      version: '1.0.0',
      isActive: true,
      publishedAt: new Date(),
      summary: 'Resumo dos termos: Este aplicativo é uma ferramenta de acompanhamento emocional e NÃO substitui atendimento psicológico, psiquiátrico ou médico. Em situações de urgência, procure ajuda profissional imediatamente.',
      content: `TERMOS DE USO DO VIBEO
Versão 1.0.0 – Vigente a partir de março de 2024

1. SOBRE O VIBEO
O Vibeo é uma plataforma digital de acompanhamento emocional e triagem assistida por inteligência artificial, voltada para jovens e adolescentes. O Vibeo NÃO é um serviço de saúde, NÃO realiza diagnósticos clínicos e NÃO substitui o atendimento de psicólogos, psiquiatras, médicos ou qualquer profissional de saúde.

2. OBJETIVO
O Vibeo tem como objetivo oferecer um espaço seguro de escuta ativa, check-in emocional diário e acompanhamento longitudinal do bem-estar emocional, sempre com linguagem acolhedora, responsável e ética.

3. LIMITAÇÕES
O Vibeo não fornece diagnósticos médicos, laudos, atestados ou qualquer documento de natureza clínica. Em situações de urgência ou risco imediato, o usuário deve procurar imediatamente ajuda de um adulto de confiança, responsável legal, profissional de saúde ou serviços de emergência (SAMU: 192, CVV: 188).

4. CADASTRO E MENORIDADE
Usuários menores de 18 anos devem obter consentimento do responsável legal para utilizar o Vibeo. O sistema envia automaticamente um e-mail de consentimento ao responsável indicado no cadastro.

5. DADOS PESSOAIS
O Vibeo coleta e trata dados pessoais conforme a Lei Geral de Proteção de Dados (LGPD – Lei nº 13.709/2018). Dados de menores de idade recebem proteção reforçada. Para mais informações, consulte nossa Política de Privacidade.

6. CONDUTA
É proibido utilizar o Vibeo para fins ilícitos, para compartilhar informações falsas ou para tentar comprometer a segurança da plataforma.

7. ALTERAÇÕES
O Vibeo pode atualizar estes termos periodicamente. Você será notificado sobre mudanças relevantes.

Ao criar sua conta, você confirma que leu, compreendeu e concorda com estes Termos de Uso.`,
    },
  })

  // =============================================
  // PRIVACY POLICY
  // =============================================
  const privacy = await prisma.privacyPolicy.upsert({
    where: { version: '1.0.0' },
    update: {},
    create: {
      version: '1.0.0',
      isActive: true,
      publishedAt: new Date(),
      summary: 'O Vibeo coleta apenas dados necessários para o acompanhamento emocional. Seus dados são protegidos conforme a LGPD e nunca serão compartilhados sem sua autorização.',
      content: `POLÍTICA DE PRIVACIDADE DO VIBEO
Versão 1.0.0 – Vigente a partir de março de 2024

1. DADOS COLETADOS
O Vibeo coleta: dados de cadastro (nome, e-mail, data de nascimento), dados de saúde emocional (respostas aos check-ins, humor, energia, sono), dados de uso da plataforma e dados do responsável legal (para menores de idade).

2. FINALIDADE
Os dados são usados exclusivamente para: personalizar a experiência de acompanhamento emocional, gerar indicadores internos de bem-estar, enviar notificações pertinentes e cumprir obrigações legais.

3. BASE LEGAL
O tratamento de dados fundamenta-se no consentimento do titular (Art. 7º, I, LGPD) e, para menores de idade, no consentimento do responsável legal (Art. 14, LGPD).

4. COMPARTILHAMENTO
O Vibeo não vende, aluga ou compartilha dados pessoais com terceiros para fins comerciais. Dados podem ser compartilhados apenas com parceiros técnicos essenciais ao funcionamento da plataforma, com proteção contratual adequada.

5. RETENÇÃO
Dados são retidos pelo período necessário para a finalidade informada ou conforme obrigações legais. Você pode solicitar a exclusão dos seus dados a qualquer momento.

6. DIREITOS DO TITULAR
Conforme a LGPD, você tem direito a: confirmar o tratamento, acessar seus dados, corrigir dados, solicitar portabilidade, exclusão, anonimização e revogar consentimento.

7. CRIANÇAS E ADOLESCENTES
Dados de menores de 18 anos recebem proteção reforçada, são tratados em seu melhor interesse e somente com consentimento verificado do responsável legal.

8. SEGURANÇA
Adotamos medidas técnicas e organizacionais para proteger seus dados contra acesso não autorizado, perda ou divulgação indevida.

9. CONTATO
Para exercer seus direitos ou tirar dúvidas sobre privacidade: privacidade@vibeo.com.br`,
    },
  })

  // =============================================
  // MASTER ADMIN USER
  // =============================================
  const masterPasswordHash = await bcrypt.hash('qw12QW!@', 12)

  const masterUser = await prisma.user.upsert({
    where: { email: 'joaobatistaudi@gmail.com' },
    update: {
      passwordHash: masterPasswordHash,
      role: UserRole.MASTER_ADMIN,
      status: UserStatus.ACTIVE,
      emailVerified: new Date(),
    },
    create: {
      email: 'joaobatistaudi@gmail.com',
      passwordHash: masterPasswordHash,
      role: UserRole.MASTER_ADMIN,
      status: UserStatus.ACTIVE,
      emailVerified: new Date(),
      isMinor: false,
    },
  })

  await prisma.profile.upsert({
    where: { userId: masterUser.id },
    update: {},
    create: {
      userId: masterUser.id,
      fullName: 'João Batista',
      birthDate: new Date('1985-01-01'),
      age: 39,
      theme: ThemeChoice.MASCULINE,
      currentRiskLevel: RiskLevel.STABLE,
    },
  })

  await prisma.consentLog.create({
    data: {
      userId: masterUser.id,
      consentType: 'terms',
      termsVersionId: terms.id,
      privacyVersionId: privacy.id,
      accepted: true,
      acceptedAt: new Date(),
      ipAddress: '127.0.0.1',
      userAgent: 'System/Seed',
    },
  })

  console.log('✅ Master admin user created:', masterUser.email)

  // =============================================
  // DEMO USERS
  // =============================================
  const demoPassword = await bcrypt.hash('Demo@1234', 12)

  const demoUser1 = await prisma.user.upsert({
    where: { email: 'ana.silva@demo.com' },
    update: {},
    create: {
      email: 'ana.silva@demo.com',
      passwordHash: demoPassword,
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
      emailVerified: new Date(),
      isMinor: false,
    },
  })

  await prisma.profile.upsert({
    where: { userId: demoUser1.id },
    update: {},
    create: {
      userId: demoUser1.id,
      fullName: 'Ana Silva',
      birthDate: new Date('2000-05-15'),
      age: 24,
      theme: ThemeChoice.FEMININE,
      currentRiskLevel: RiskLevel.ATTENTION,
      totalCheckIns: 12,
      streakDays: 3,
    },
  })

  const demoUser2 = await prisma.user.upsert({
    where: { email: 'pedro.costa@demo.com' },
    update: {},
    create: {
      email: 'pedro.costa@demo.com',
      passwordHash: demoPassword,
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
      emailVerified: new Date(),
      isMinor: false,
    },
  })

  await prisma.profile.upsert({
    where: { userId: demoUser2.id },
    update: {},
    create: {
      userId: demoUser2.id,
      fullName: 'Pedro Costa',
      birthDate: new Date('2007-03-20'),
      age: 17,
      theme: ThemeChoice.DIVERSITY,
      currentRiskLevel: RiskLevel.STABLE,
      totalCheckIns: 25,
      streakDays: 7,
    },
  })

  // Minor user with guardian consent
  const minorUser = await prisma.user.upsert({
    where: { email: 'julia.teen@demo.com' },
    update: {},
    create: {
      email: 'julia.teen@demo.com',
      passwordHash: demoPassword,
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
      emailVerified: new Date(),
      isMinor: true,
    },
  })

  await prisma.profile.upsert({
    where: { userId: minorUser.id },
    update: {},
    create: {
      userId: minorUser.id,
      fullName: 'Júlia Mendes',
      birthDate: new Date('2010-08-10'),
      age: 14,
      theme: ThemeChoice.FEMININE,
      currentRiskLevel: RiskLevel.STABLE,
      totalCheckIns: 8,
      streakDays: 2,
    },
  })

  await prisma.guardianConsent.upsert({
    where: { minorUserId: minorUser.id },
    update: {},
    create: {
      minorUserId: minorUser.id,
      guardianName: 'Maria Mendes',
      guardianEmail: 'maria.mendes@demo.com',
      status: ConsentStatus.APPROVED,
      consentToken: 'demo-token-' + minorUser.id,
      consentedAt: new Date(),
      consentIp: '127.0.0.1',
      consentUserAgent: 'System/Seed',
      termsVersion: '1.0.0',
      privacyVersion: '1.0.0',
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
  })

  // Pending consent user
  const pendingMinor = await prisma.user.upsert({
    where: { email: 'gabriel.junior@demo.com' },
    update: {},
    create: {
      email: 'gabriel.junior@demo.com',
      passwordHash: demoPassword,
      role: UserRole.USER,
      status: UserStatus.PENDING_CONSENT,
      emailVerified: new Date(),
      isMinor: true,
    },
  })

  await prisma.profile.upsert({
    where: { userId: pendingMinor.id },
    update: {},
    create: {
      userId: pendingMinor.id,
      fullName: 'Gabriel Júnior',
      birthDate: new Date('2011-11-25'),
      age: 13,
      theme: ThemeChoice.MASCULINE,
      currentRiskLevel: RiskLevel.STABLE,
    },
  })

  await prisma.guardianConsent.upsert({
    where: { minorUserId: pendingMinor.id },
    update: {},
    create: {
      minorUserId: pendingMinor.id,
      guardianName: 'Carlos Júnior',
      guardianEmail: 'carlos.junior@demo.com',
      status: ConsentStatus.PENDING,
      consentToken: 'pending-token-' + pendingMinor.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  })

  console.log('✅ Demo users created')

  // =============================================
  // EMOTIONAL CATEGORIES
  // =============================================
  const categories = [
    { name: 'Humor', slug: 'humor', icon: '😊', color: '#4A6FA5', order: 1 },
    { name: 'Ansiedade', slug: 'ansiedade', icon: '😰', color: '#7B9E87', order: 2 },
    { name: 'Sono', slug: 'sono', icon: '😴', color: '#9B8EC4', order: 3 },
    { name: 'Energia', slug: 'energia', icon: '⚡', color: '#E8A838', order: 4 },
    { name: 'Relações Sociais', slug: 'relacoes-sociais', icon: '👫', color: '#D4909A', order: 5 },
    { name: 'Escola e Trabalho', slug: 'escola-trabalho', icon: '📚', color: '#5B9BD5', order: 6 },
    { name: 'Autocuidado', slug: 'autocuidado', icon: '💚', color: '#7BC47F', order: 7 },
    { name: 'Sentimentos', slug: 'sentimentos', icon: '💙', color: '#4A6FA5', order: 8 },
  ]

  const createdCategories: Record<string, string> = {}
  for (const cat of categories) {
    const created = await prisma.emotionalCategory.upsert({
      where: { slug: cat.slug },
      update: {},
      create: { ...cat, isActive: true },
    })
    createdCategories[cat.slug] = created.id
  }

  console.log('✅ Emotional categories created')

  // =============================================
  // EMOTIONAL QUESTIONS
  // =============================================
  const questions = [
    // HUMOR
    { categorySlug: 'humor', text: 'Como você descreveria seu humor hoje, de 1 a 10?', shortLabel: 'Humor geral', type: 'scale', weight: 2.0, order: 1 },
    { categorySlug: 'humor', text: 'Você conseguiu sorrir ou rir por algo hoje?', shortLabel: 'Leveza', type: 'boolean', weight: 1.0, order: 2 },
    { categorySlug: 'humor', text: 'Qual sentimento foi mais presente em você hoje?', shortLabel: 'Sentimento predominante', type: 'options', options: ['Alegre', 'Calmo(a)', 'Ansioso(a)', 'Triste', 'Irritado(a)', 'Entediado(a)', 'Esperançoso(a)', 'Outro'], weight: 1.5, order: 3 },

    // ANSIEDADE
    { categorySlug: 'ansiedade', text: 'Como está sua sensação de ansiedade hoje, de 1 a 10?', shortLabel: 'Nível de ansiedade', type: 'scale', weight: 2.0, order: 1 },
    { categorySlug: 'ansiedade', text: 'Você sentiu tensão ou nervosismo sem motivo aparente hoje?', shortLabel: 'Tensão sem motivo', type: 'boolean', weight: 1.5, order: 2 },
    { categorySlug: 'ansiedade', text: 'Você sentiu dificuldade de respirar, coração acelerado ou tensão no corpo hoje?', shortLabel: 'Sintomas físicos de ansiedade', type: 'boolean', weight: 1.5, order: 3 },

    // SONO
    { categorySlug: 'sono', text: 'Como foi sua qualidade de sono ontem à noite, de 1 a 10?', shortLabel: 'Qualidade do sono', type: 'scale', weight: 1.5, order: 1 },
    { categorySlug: 'sono', text: 'Quantas horas você dormiu aproximadamente?', shortLabel: 'Horas de sono', type: 'options', options: ['Menos de 4h', '4 a 6h', '6 a 8h', '8 a 10h', 'Mais de 10h'], weight: 1.0, order: 2 },
    { categorySlug: 'sono', text: 'Você acordou várias vezes durante a noite ou teve dificuldade para dormir?', shortLabel: 'Interrupções no sono', type: 'boolean', weight: 1.0, order: 3 },

    // ENERGIA
    { categorySlug: 'energia', text: 'Como está seu nível de energia hoje, de 1 a 10?', shortLabel: 'Energia', type: 'scale', weight: 1.5, order: 1 },
    { categorySlug: 'energia', text: 'Você se sentiu muito cansado(a) ou sem disposição hoje?', shortLabel: 'Cansaço/Disposição', type: 'boolean', weight: 1.0, order: 2 },

    // RELAÇÕES SOCIAIS
    { categorySlug: 'relacoes-sociais', text: 'Você teve algum contato positivo com outra pessoa hoje?', shortLabel: 'Interação positiva', type: 'boolean', weight: 1.0, order: 1 },
    { categorySlug: 'relacoes-sociais', text: 'Você se sentiu sozinho(a) ou isolado(a) hoje?', shortLabel: 'Solidão', type: 'boolean', weight: 1.5, order: 2 },
    { categorySlug: 'relacoes-sociais', text: 'Como você se sentiu em relação às suas amizades e família hoje?', shortLabel: 'Relações gerais', type: 'scale', weight: 1.0, order: 3 },

    // ESCOLA E TRABALHO
    { categorySlug: 'escola-trabalho', text: 'Como foi seu dia na escola, faculdade ou trabalho?', shortLabel: 'Dia produtivo', type: 'scale', weight: 1.0, order: 1 },
    { categorySlug: 'escola-trabalho', text: 'Você se sentiu sobrecarregado(a) com tarefas ou responsabilidades hoje?', shortLabel: 'Sobrecarga', type: 'boolean', weight: 1.5, order: 2 },

    // AUTOCUIDADO
    { categorySlug: 'autocuidado', text: 'Você fez algo de bom por você mesmo(a) hoje?', shortLabel: 'Autocuidado', type: 'boolean', weight: 1.0, order: 1 },
    { categorySlug: 'autocuidado', text: 'Como você se sentiu em relação à sua alimentação hoje?', shortLabel: 'Apetite', type: 'scale', weight: 1.0, order: 2 },
    { categorySlug: 'autocuidado', text: 'Você teve vontade de praticar alguma atividade física ou hobby hoje?', shortLabel: 'Motivação para atividades', type: 'boolean', weight: 1.0, order: 3 },

    // SENTIMENTOS
    { categorySlug: 'sentimentos', text: 'Você sentiu vontade de conversar com alguém sobre como está se sentindo?', shortLabel: 'Necessidade de falar', type: 'boolean', weight: 1.0, order: 1 },
    { categorySlug: 'sentimentos', text: 'Você teve pensamentos muito pesados ou perturbadores hoje?', shortLabel: 'Pensamentos pesados', type: 'boolean', weight: 3.0, order: 2, isConditional: false },
    { categorySlug: 'sentimentos', text: 'Você se sentiu esperançoso(a) com o futuro hoje?', shortLabel: 'Esperança', type: 'boolean', weight: 1.5, order: 3 },
  ]

  for (const q of questions) {
    const { categorySlug, options, ...questionData } = q
    await prisma.emotionalQuestion.create({
      data: {
        ...questionData,
        options: options ? options : undefined,
        categoryId: createdCategories[categorySlug],
        isActive: true,
      },
    })
  }

  console.log('✅ Emotional questions created')

  // =============================================
  // AI CONFIGURATIONS
  // =============================================
  const aiConfigs = [
    {
      key: 'system_prompt',
      value: `Você é a IA do Vibeo, uma plataforma de acompanhamento emocional para jovens e adolescentes.
Seu papel é ser uma presença acolhedora, empática e responsável.

REGRAS FUNDAMENTAIS:
- NUNCA faça diagnósticos clínicos ou afirme que o usuário tem algum transtorno
- NUNCA use linguagem sensacionalista ou alarmante
- NUNCA forneça métodos ou meios relacionados a autolesão
- SEMPRE oriente busca de ajuda profissional quando necessário
- SEMPRE responda em português do Brasil com linguagem acolhedora e jovem
- Use perguntas curtas e adaptativas baseadas no histórico do usuário
- Seja genuíno(a) e presente, não robótico(a)

CLASSIFICAÇÃO INTERNA (não compartilhe com o usuário):
- STABLE: sinais positivos ou neutros
- ATTENTION: pequenas preocupações, monitorar
- HIGH_RISK: sinais de sofrimento mais intenso
- IMMEDIATE_PRIORITY: sinais de crise, acionar protocolo de segurança

Em situações de HIGH_RISK ou IMMEDIATE_PRIORITY, sempre inclua a mensagem de segurança.`,
      description: 'System prompt principal da IA',
    },
    {
      key: 'safety_message',
      value: `Percebo que você está passando por um momento bem difícil. Quero que saiba que me importo com você e que não está sozinho(a) nisso.

Se precisar de apoio imediato, por favor fale com um adulto de confiança — pode ser um familiar, um professor ou qualquer pessoa que você confie.

O CVV (Centro de Valorização da Vida) também está disponível 24 horas pelo número 188 ou pelo site cvv.org.br — é gratuito e sigiloso.

Você é importante. Sua vida importa. 💙`,
      description: 'Mensagem de segurança para situações de risco',
    },
    {
      key: 'greeting_morning',
      value: 'Bom dia! ☀️ Como você acordou hoje? Vamos fazer seu check-in emocional?',
      description: 'Saudação matinal',
    },
    {
      key: 'greeting_afternoon',
      value: 'Boa tarde! Como está sendo seu dia até agora? Topa um check-in rápido?',
      description: 'Saudação vespertina',
    },
    {
      key: 'greeting_evening',
      value: 'Boa noite! Como foi seu dia? Que tal fazer uma pausa e verificar como você está se sentindo?',
      description: 'Saudação noturna',
    },
    {
      key: 'reengagement_message',
      value: 'Ei, saudade de você! Faz alguns dias que não nos encontramos aqui. Como você está? Quando quiser, pode vir fazer um check-in — estou aqui para ouvir. 💙',
      description: 'Mensagem de reengajamento',
    },
    {
      key: 'completion_positive',
      value: 'Obrigado(a) por compartilhar como está se sentindo! Cada check-in é um passo importante para cuidar de você. Continue assim! 🌟',
      description: 'Mensagem de conclusão positiva',
    },
    {
      key: 'completion_attention',
      value: 'Obrigado(a) por confiar a mim como está se sentindo. Parece que está sendo um período desafiador — e tudo bem. Lembre-se: pedir ajuda é sempre uma opção. Se precisar conversar com alguém, estou aqui. 💙',
      description: 'Mensagem de conclusão com atenção',
    },
    {
      key: 'risk_score_weights',
      value: JSON.stringify({
        humor: 2.0,
        ansiedade: 2.0,
        pensamentos_pesados: 3.0,
        solidao: 1.5,
        sono: 1.0,
        energia: 1.0,
        esperanca: 1.5,
      }),
      description: 'Pesos para cálculo do score de risco',
    },
  ]

  for (const config of aiConfigs) {
    await prisma.aIConfiguration.upsert({
      where: { key: config.key },
      update: { value: config.value },
      create: { ...config, isActive: true },
    })
  }

  console.log('✅ AI configurations created')

  // =============================================
  // SUPPORT RESOURCES
  // =============================================
  const resources = [
    {
      title: 'CVV – Centro de Valorização da Vida',
      description: 'Apoio emocional e prevenção do suicídio. Atendimento gratuito, sigiloso e 24 horas por dia.',
      url: 'https://www.cvv.org.br',
      phone: '188',
      type: 'emergency',
      targetRisk: [RiskLevel.HIGH_RISK, RiskLevel.IMMEDIATE_PRIORITY],
      order: 1,
    },
    {
      title: 'SAMU – Serviço de Atendimento Móvel de Urgência',
      description: 'Atendimento de urgências e emergências de saúde.',
      phone: '192',
      type: 'emergency',
      targetRisk: [RiskLevel.IMMEDIATE_PRIORITY],
      order: 2,
    },
    {
      title: 'Converse com um adulto de confiança',
      description: 'Falar com um familiar, professor, orientador escolar ou outro adulto de confiança pode ajudar muito em momentos difíceis.',
      type: 'community',
      targetRisk: [RiskLevel.ATTENTION, RiskLevel.HIGH_RISK, RiskLevel.IMMEDIATE_PRIORITY],
      order: 3,
    },
    {
      title: 'CAPS – Centro de Atenção Psicossocial',
      description: 'Serviço de saúde mental do SUS. Atendimento gratuito para jovens e adolescentes.',
      url: 'https://www.gov.br/saude',
      type: 'professional',
      targetRisk: [RiskLevel.ATTENTION, RiskLevel.HIGH_RISK],
      order: 4,
    },
    {
      title: 'Exercícios de respiração',
      description: 'Técnicas simples de respiração podem ajudar em momentos de ansiedade ou tensão.',
      type: 'self_care',
      targetRisk: [RiskLevel.STABLE, RiskLevel.ATTENTION],
      order: 5,
    },
  ]

  for (const resource of resources) {
    await prisma.supportResource.create({
      data: { ...resource, isActive: true },
    })
  }

  console.log('✅ Support resources created')

  // =============================================
  // SYSTEM SETTINGS
  // =============================================
  const settings = [
    { key: 'app_name', value: 'Vibeo', type: 'string', description: 'Nome do aplicativo', isPublic: true },
    { key: 'app_tagline', value: 'Cuide do seu bem-estar emocional', type: 'string', description: 'Slogan do app', isPublic: true },
    { key: 'app_description', value: 'O Vibeo é uma plataforma de acompanhamento emocional para jovens, com IA acolhedora e foco no bem-estar.', type: 'string', description: 'Descrição do app', isPublic: true },
    { key: 'support_email', value: 'suporte@vibeo.com.br', type: 'string', description: 'E-mail de suporte', isPublic: true },
    { key: 'privacy_email', value: 'privacidade@vibeo.com.br', type: 'string', description: 'E-mail de privacidade', isPublic: true },
    { key: 'checkin_reminder_enabled', value: 'true', type: 'boolean', description: 'Habilitar lembretes de check-in' },
    { key: 'inactivity_threshold_days', value: '3', type: 'number', description: 'Dias de inatividade para alerta' },
    { key: 'risk_notification_admin', value: 'true', type: 'boolean', description: 'Notificar admin em alertas de risco' },
    { key: 'consent_token_expiry_days', value: '7', type: 'number', description: 'Dias para expiração do token de consentimento' },
    { key: 'max_login_attempts', value: '5', type: 'number', description: 'Máximo de tentativas de login' },
    { key: 'session_timeout_hours', value: '720', type: 'number', description: 'Timeout de sessão em horas' },
  ]

  for (const setting of settings) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    })
  }

  console.log('✅ System settings created')

  // =============================================
  // DATA RETENTION RULES
  // =============================================
  const retentionRules = [
    { dataType: 'emotional_checkins', retentionDays: 730, action: 'anonymize', description: 'Check-ins emocionais – 2 anos', isActive: true },
    { dataType: 'audit_logs', retentionDays: 365, action: 'delete', description: 'Logs de auditoria – 1 ano', isActive: true },
    { dataType: 'security_events', retentionDays: 180, action: 'delete', description: 'Eventos de segurança – 6 meses', isActive: true },
    { dataType: 'ai_sessions', retentionDays: 365, action: 'anonymize', description: 'Sessões de IA – 1 ano', isActive: true },
    { dataType: 'consent_logs', retentionDays: 1825, action: 'delete', description: 'Logs de consentimento – 5 anos', isActive: true },
  ]

  for (const rule of retentionRules) {
    await prisma.dataRetentionRule.upsert({
      where: { dataType: rule.dataType },
      update: {},
      create: rule,
    })
  }

  // =============================================
  // SAMPLE CHECK-INS FOR DEMO
  // =============================================
  const ana = await prisma.user.findUnique({ where: { email: 'ana.silva@demo.com' } })
  if (ana) {
    // Create 7 days of sample check-ins
    for (let i = 7; i >= 1; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)

      const mood = Math.floor(Math.random() * 4) + 4 // 4-7
      const anxiety = Math.floor(Math.random() * 5) + 3 // 3-7

      await prisma.emotionalCheckIn.create({
        data: {
          userId: ana.id,
          completedAt: date,
          isComplete: true,
          overallMood: mood,
          energyLevel: Math.floor(Math.random() * 4) + 3,
          anxietyLevel: anxiety,
          sleepQuality: Math.floor(Math.random() * 4) + 4,
          irritability: Math.floor(Math.random() * 3) + 2,
          motivation: Math.floor(Math.random() * 4) + 3,
          appetite: Math.floor(Math.random() * 4) + 4,
          dominantFeeling: ['Calma', 'Ansiosa', 'Esperançosa', 'Um pouco cansada'][Math.floor(Math.random() * 4)],
          internalScore: (mood + (10 - anxiety)) / 2,
          riskLevel: anxiety > 7 ? RiskLevel.ATTENTION : RiskLevel.STABLE,
          createdAt: date,
        },
      })
    }
  }

  console.log('✅ Sample check-ins created')
  console.log('')
  console.log('🎉 Vibeo seed completed successfully!')
  console.log('---')
  console.log('Master Admin: joaobatistaudi@gmail.com / qw12QW!@')
  console.log('Demo User 1: ana.silva@demo.com / Demo@1234')
  console.log('Demo User 2: pedro.costa@demo.com / Demo@1234')
  console.log('---')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

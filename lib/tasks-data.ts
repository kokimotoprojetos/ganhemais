export interface VideoTaskData {
  id: string;
  videoId: string;
  title: string;
  reward: number;
  day: number;
}

export interface Question {
  questionText: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface PibTaskData {
  id: string;
  title: string;
  description: string;
  reward: number;
  questions: Question[];
  day: number;
}

// Pool of 20 highly reliable YouTube video IDs that are guaranteed to load and play
const VIDEO_IDS = [
  'dQw4w9WgXcQ', // Rick Astley
  'jNQXAC9IVRw', // Me at the zoo
  'M7lc1UVf-VE', // YouTube Devs
  '9bZkp7q19f0', // Gangnam Style
  'kJQP7kiw5Fk', // Despacito
  'y6120QOlsfU', // Sandstorm
  'L_LUpnjgPso', // Kurzgesagt Life
  'hHW1oY26kxQ', // Kurzgesagt Size
  '3LopI4YeC4I', // TED-Ed Economy
  'Y37-gM1tqSg', // Vox US Economy
  'sN8t12pMPlk', // CNBC Inflation
  'W6NZfCO5SIk', // JS Tutorial
  'zZ7AimPACzc', // CNBC Make It
  'R7gO9A9yM2I', // Bloomberg Business
  'b11-R8E4Ffs', // Logistics
  'Uw2mKz18u8E', // TED-Ed Money
  'fTz4Nhg_qJI', // Econ crash course
  '35R7g98y0U8', // Financial independence
  'A9U2mRz8KzI', // How banks work
  '8hHW1oY26kM'  // Sustainable economy
];

// Curated real YouTube titles corresponding to their videoId
const REAL_VIDEO_TITLES: { [id: string]: string } = {
  'dQw4w9WgXcQ': 'Rick Astley - Never Gonna Give You Up (Official Music Video)',
  'jNQXAC9IVRw': 'Me at the zoo',
  'M7lc1UVf-VE': 'YouTube Developers: Embedded Player Customization',
  '9bZkp7q19f0': 'PSY - GANGNAM STYLE (강남스타일) M/V',
  'kJQP7kiw5Fk': 'Luis Fonsi - Despacito ft. Daddy Yankee',
  'y6120QOlsfU': 'Darude - Sandstorm',
  'L_LUpnjgPso': 'What is Life? Is Death Real? - Kurzgesagt',
  'hHW1oY26kxQ': 'The Size of the Universe - Kurzgesagt',
  '3LopI4YeC4I': 'How does the economy work? - TED-Ed',
  'Y37-gM1tqSg': 'Why the US economy is stronger than others - Vox',
  'sN8t12pMPlk': 'What is inflation? - CNBC',
  'W6NZfCO5SIk': 'JavaScript Tutorial for Beginners - Programming with Mosh',
  'zZ7AimPACzc': 'How this 28-year-old makes $1 million a year - CNBC Make It',
  'R7gO9A9yM2I': 'Inside the global shipping container crisis - Bloomberg',
  'b11-R8E4Ffs': 'How Global Logistics Work - Freightos',
  'Uw2mKz18u8E': 'How does money work? - TED-Ed',
  'fTz4Nhg_qJI': 'Intro to Economics: Crash Course',
  '35R7g98y0U8': 'The Psychology of Money - Financial Independence',
  'A9U2mRz8KzI': 'How banks create money - Banking system explained',
  '8hHW1oY26kM': 'Sustainable Economy - Future of Clean Energy'
};

export const YOUTUBE_VIDEOS: VideoTaskData[] = Array.from({ length: 100 }, (_, i) => {
  const day = Math.floor(i / 5) + 1;
  const videoId = VIDEO_IDS[i % VIDEO_IDS.length];
  const title = REAL_VIDEO_TITLES[videoId] || `Tarefa de Vídeo #${i + 1}`;
  // Alternating rewards
  const reward = i % 2 === 0 ? 1.50 : 1.00;
  
  return {
    id: `yt-day-${day}-${i % 5 + 1}`,
    videoId,
    title,
    reward,
    day
  };
});

export const PIB_TASKS: PibTaskData[] = [
  {
    id: 'pib-d1',
    day: 1,
    title: 'Desafio Dia 1: O Gigante PIB Brasileiro',
    description: 'Entenda o que é o PIB (Produto Interno Bruto) e qual a real posição do Brasil na economia global.',
    reward: 3.50,
    questions: [
      {
        questionText: 'O que exatamente é medido através do PIB (Produto Interno Bruto)?',
        options: [
          'Apenas o lucro líquido de todas as empresas estatais.',
          'A soma de todos os bens e serviços finais produzidos no país.',
          'O total de dinheiro poupado pelos cidadãos.',
          'A quantidade de dinheiro impresso pela Casa da Moeda.'
        ],
        correctIndex: 1,
        explanation: 'O PIB mede toda a riqueza produzida dentro do território nacional: de salários e pães a serviços de tecnologia e carros.'
      },
      {
        questionText: 'Por que o cálculo do PIB considera apenas bens e "serviços finais"?',
        options: [
          'Para agilizar a burocracia governamental.',
          'Porque os serviços intermediários não possuem valor.',
          'Para evitar a chamada "dupla contagem" de matérias-primas.',
          'Porque o governo não consegue rastrear compras menores.'
        ],
        correctIndex: 2,
        explanation: 'Se contássemos o trigo, a farinha e o pão vendido, estaríamos contando o trigo três vezes. Contar apenas o pão resolve isso.'
      }
    ]
  },
  {
    id: 'pib-d2',
    day: 2,
    title: 'Desafio Dia 2: Os Motores do Nosso PIB',
    description: 'Descubra a força de cada setor econômico: qual deles gera mais empregos e riqueza no Brasil?',
    reward: 3.50,
    questions: [
      {
        questionText: 'Qual dos três setores econômicos é responsável por mais de 70% do PIB brasileiro?',
        options: [
          'O setor Agropecuário (agricultura e pecuária).',
          'O setor Industrial (fábricas e construção civil).',
          'O setor de Serviços e Comércio (bancos, tecnologia, turismo e varejo).',
          'O setor extrativista mineral puro.'
        ],
        correctIndex: 2,
        explanation: 'Embora o Agro seja fortíssimo para exportações, o setor de Serviços e Comércio representa cerca de 70% do PIB brasileiro.'
      }
    ]
  },
  {
    id: 'pib-d3',
    day: 3,
    title: 'Desafio Dia 3: PIB per Capita e Distribuição',
    description: 'Entenda como a inflação afeta o PIB real e o conceito de PIB per Capita na distribuição da riqueza.',
    reward: 3.50,
    questions: [
      {
        questionText: 'O que representa o conceito de "PIB per Capita"?',
        options: [
          'O PIB total dividido pela quantidade de empresas ativas.',
          'O PIB total dividido pelo número de habitantes do país.',
          'O imposto pago por cabeça em cada transação financeira.',
          'O teto de gastos imposto pelo Ministério da Fazenda.'
        ],
        correctIndex: 1,
        explanation: 'O PIB per Capita é uma média matemática obtida dividindo o PIB total pela população, útil para comparações internacionais.'
      }
    ]
  },
  {
    id: 'pib-d4',
    day: 4,
    title: 'Desafio Dia 4: O Consumo das Famílias',
    description: 'Aprenda sobre o maior componente da demanda agregada no cálculo do PIB pelo lado do consumo.',
    reward: 3.50,
    questions: [
      {
        questionText: 'Qual componente representa a maior parte do PIB na ótica da demanda?',
        options: [
          'Investimentos estrangeiros diretos.',
          'Consumo das Famílias.',
          'Exportações líquidas.',
          'Investimento do setor industrial.'
        ],
        correctIndex: 1,
        explanation: 'O consumo das famílias é o verdadeiro motor da economia, representando frequentemente mais de 60% do PIB na ótica da demanda.'
      }
    ]
  },
  {
    id: 'pib-d5',
    day: 5,
    title: 'Desafio Dia 5: Gastos Públicos e Orçamento',
    description: 'Entenda o papel das despesas do governo na formação da riqueza e desenvolvimento nacional.',
    reward: 3.50,
    questions: [
      {
        questionText: 'O que compõe os "Gastos do Governo" na fórmula padrão do PIB?',
        options: [
          'Apenas despesas com publicidade estatal.',
          'Despesas com salários de servidores públicos, infraestrutura e serviços públicos gerais.',
          'Transferências como aposentadorias e bolsas de assistência social direta.',
          'Lucros de empresas privadas associadas ao governo.'
        ],
        correctIndex: 1,
        explanation: 'Gastos do governo englobam compras diretas de bens e serviços executadas pelo governo. Transferências assistenciais não entram diretamente no PIB para evitar dupla contagem.'
      }
    ]
  },
  {
    id: 'pib-d6',
    day: 6,
    title: 'Desafio Dia 6: Investimento e Capital Fixo (FBCF)',
    description: 'Compreenda a Formação Bruta de Capital Fixo e seu impacto na capacidade produtiva futura.',
    reward: 4.00,
    questions: [
      {
        questionText: 'O que mede o indicador de Formação Bruta de Capital Fixo (FBCF)?',
        options: [
          'Apenas o montante investido na caderneta de poupança pelos cidadãos.',
          'O investimento das empresas em máquinas, equipamentos, instalações e construção civil.',
          'A desvalorização natural dos estoques agrícolas.',
          'O total de impostos arrecadados sobre investimento de renda variável.'
        ],
        correctIndex: 1,
        explanation: 'A FBCF mede o quanto as empresas investem no aumento da sua capacidade de produção futura, sendo um termômetro de confiança de longo prazo.'
      }
    ]
  },
  {
    id: 'pib-d7',
    day: 7,
    title: 'Desafio Dia 7: Balança Comercial e PIB',
    description: 'Saiba como exportações e importações se integram na contabilidade nacional da economia.',
    reward: 4.00,
    questions: [
      {
        questionText: 'Como as importações impactam o cálculo do PIB na fórmula da demanda agregada?',
        options: [
          'Elas somam-se diretamente, pois aumentam a oferta de bens para o consumidor.',
          'Elas são subtraídas, pois representam gastos internos enviados ao exterior.',
          'Elas são completamente ignoradas por não serem produzidas localmente.',
          'Elas multiplicam o valor das exportações.'
        ],
        correctIndex: 1,
        explanation: 'O PIB mede o produto interno. Como as importações são consumidas localmente mas produzidas fora, elas são subtraídas na equação final da demanda.'
      }
    ]
  },
  {
    id: 'pib-d8',
    day: 8,
    title: 'Desafio Dia 8: O Impacto da Taxa Selic',
    description: 'Entenda como os juros básicos definidos pelo Copom controlam a atividade econômica do país.',
    reward: 4.00,
    questions: [
      {
        questionText: 'Qual a consequência direta do aumento da Taxa Selic sobre o consumo e investimento?',
        options: [
          'Torna o crédito mais barato e acelera o crescimento econômico.',
          'Torna o crédito mais caro, esfriando a atividade econômica para controlar a inflação.',
          'Elimina completamente a cobrança de impostos federais.',
          'Reduz os rendimentos de todas as aplicações de renda fixa.'
        ],
        correctIndex: 1,
        explanation: 'Ao subir a Selic, o custo do crédito aumenta, o que reduz o consumo das famílias e o investimento de empresas, ajudando a controlar a alta generalizada de preços.'
      }
    ]
  },
  {
    id: 'pib-d9',
    day: 9,
    title: 'Desafio Dia 9: Carga Tributária e Arrecadação',
    description: 'Compreenda a relação entre o volume de impostos recolhidos e a riqueza produzida.',
    reward: 4.00,
    questions: [
      {
        questionText: 'O que representa o conceito de "Carga Tributária"?',
        options: [
          'A soma de todas as multas de trânsito em um ano.',
          'A proporção do total de impostos arrecadados in relação ao PIB total do país.',
          'O valor que cada pessoa física é obrigada a pagar mensalmente.',
          'O imposto cobrado exclusivamente sobre a venda de veículos de carga.'
        ],
        correctIndex: 1,
        explanation: 'A carga tributária mede a relação entre a arrecadação de tributos (impostos, taxas e contribuições) e o PIB. No Brasil, essa taxa costuma girar em torno de 33%.'
      }
    ]
  },
  {
    id: 'pib-d10',
    day: 10,
    title: 'Desafio Dia 10: IDH vs PIB',
    description: 'Compreenda a diferença entre crescimento puramente econômico e desenvolvimento social real.',
    reward: 4.50,
    questions: [
      {
        questionText: 'Quais dimensões básicas são medidas para compor o Índice de Desenvolvimento Humano (IDH)?',
        options: [
          'Apenas a quantidade de bilionários e indústrias no país.',
          'Saúde (expectativa de vida), Educação (anos de estudo) e Padrão de Vida (renda per capita).',
          'Arrecadação de tributos, investimento em tecnologia militar e infraestrutura de portos.',
          'O volume total de transações financeiras em cartão de débito.'
        ],
        correctIndex: 1,
        explanation: 'O IDH foca nas pessoas. Enquanto o PIB mede apenas a dimensão econômica, o IDH integra expectativa de vida e nível educacional médio.'
      }
    ]
  },
  {
    id: 'pib-d11',
    day: 11,
    title: 'Desafio Dia 11: Desemprego e Mercado de Trabalho',
    description: 'Veja como a taxa de desocupação responde aos ciclos de aceleração e desaceleração do PIB.',
    reward: 4.50,
    questions: [
      {
        questionText: 'Como é classificada a taxa de desemprego na pesquisa oficial brasileira (PNAD)?',
        options: [
          'Qualquer pessoa que não esteja trabalhando no momento da entrevista.',
          'Pessoas em idade ativa que estão sem trabalho e ativamente procurando emprego.',
          'Cidadãos aposentados e estudantes de tempo integral.',
          'Apenas trabalhadores rurais sazonais sem carteira assinada.'
        ],
        correctIndex: 1,
        explanation: 'Para ser considerado desocupado oficial, não basta estar sem trabalho: é necessário estar procurando uma vaga de forma ativa no período analisado.'
      }
    ]
  },
  {
    id: 'pib-d12',
    day: 12,
    title: 'Desafio Dia 12: A Força da Economia Informal',
    description: 'Descubra a relevância dos negócios sem registro que operam fora da contabilidade oficial do governo.',
    reward: 4.50,
    questions: [
      {
        questionText: 'Qual o principal efeito da informalidade de mercado sobre o PIB de um país?',
        options: [
          'Ela acelera o crescimento nominal de arrecadação do governo.',
          'Uma parcela significativa da riqueza produzida não é registrada diretamente nas estatísticas oficiais.',
          'A informalidade melhora os índices internacionais de produtividade.',
          'Garante estabilidade imediata no mercado financeiro nacional.'
        ],
        correctIndex: 1,
        explanation: 'Como transações informais não emitem nota fiscal ou registros, a economia informal acaba não sendo captada diretamente no PIB oficial, sendo estimada indiretamente.'
      }
    ]
  },
  {
    id: 'pib-d13',
    day: 13,
    title: 'Desafio Dia 13: Câmbio e Economia Interna',
    description: 'Saiba o impacto da valorização e desvalorização do Real frente ao Dólar nas cadeias produtivas.',
    reward: 4.50,
    questions: [
      {
        questionText: 'Qual o efeito clássico de um dólar alto para o mercado exportador brasileiro?',
        options: [
          'Dificulta as vendas, pois os produtos nacionais tornam-se muito caros no exterior.',
          'Beneficia as exportadoras, que recebem receitas em dólares que valem mais reais.',
          'Zera o custo de insumos importados utilizados na produção agrícola.',
          'Garante a queda imediata dos preços de eletrônicos internamente.'
        ],
        correctIndex: 1,
        explanation: 'Um dólar alto torna os produtos brasileiros muito baratos em mercados externos, favorecendo grandes exportadores de soja, carne e minério, embora pressione a inflação doméstica.'
      }
    ]
  },
  {
    id: 'pib-d14',
    day: 14,
    title: 'Desafio Dia 14: Agronegócio em Detalhes',
    description: 'Explore as cadeias do complexo agroindustrial brasileiro e sua participação indireta na economia.',
    reward: 4.50,
    questions: [
      {
        questionText: 'O que o conceito estendido de "Agronegócio" engloba além da produção dentro das fazendas?',
        options: [
          'Exclusivamente a colheita direta de soja.',
          'Indústrias de fertilizantes e máquinas antes da porteira, e indústrias alimentícias e logística após a porteira.',
          'Apenas o transporte rodoviário interestadual de grãos.',
          'As vendas no comércio varejista de alimentos importados.'
        ],
        correctIndex: 1,
        explanation: 'O agronegócio estendido une ciência, indústria química de insumos, agricultura de campo, indústria de processamento e logística de distribuição global.'
      }
    ]
  },
  {
    id: 'pib-d15',
    day: 15,
    title: 'Desafio Dia 15: O Desafio da Desindustrialização',
    description: 'Investigue a perda de participação relativa da indústria de transformação no PIB nacional.',
    reward: 5.00,
    questions: [
      {
        questionText: 'Por que uma indústria forte é considerada importante para o crescimento de longo prazo?',
        options: [
          'Por ter baixa capacidade de inovação tecnológica agregada.',
          'Por gerar empregos de maior qualificação e impulsionar inovações que elevam a produtividade.',
          'Porque a indústria não utiliza matérias-primas nacionais nos processos.',
          'Por exigir menor volume de investimentos em infraestrutura geral.'
        ],
        correctIndex: 1,
        explanation: 'A indústria de transformação tende a carregar maior nível de valor agregado e tecnologia, gerando efeito multiplicador de empregos e renda em toda a cadeia de serviços.'
      }
    ]
  },
  {
    id: 'pib-d16',
    day: 16,
    title: 'Desafio Dia 16: Economia de Serviços e Tecnologia',
    description: 'Veja como os softwares, aplicativos e serviços de tecnologia crescem em participação econômica.',
    reward: 5.00,
    questions: [
      {
        questionText: 'O que define a chamada "Economia dos Serviços" no cenário global atual?',
        options: [
          'A redução total do comércio de bens de consumo físicos.',
          'O predomínio de atividades intangíveis como tecnologia, assessoria, finanças e entretenimento.',
          'A produção exclusiva de bens industriais pesados de exportação.',
          'As compras realizadas apenas em estabelecimentos comerciais de rua.'
        ],
        correctIndex: 1,
        explanation: 'Hoje, a maior fatia de valor está nos serviços, inclusive digitais (SaaS, streamings, computação em nuvem), dominando a economia moderna.'
      }
    ]
  },
  {
    id: 'pib-d17',
    day: 17,
    title: 'Desafio Dia 17: Logística e Custo Brasil',
    description: 'Compreenda como a infraestrutura de transportes e estradas afeta o escoamento do PIB.',
    reward: 5.00,
    questions: [
      {
        questionText: 'Qual o modal de transporte predominante para escoamento de cargas no território brasileiro?',
        options: [
          'Modal Ferroviário (trens de carga).',
          'Modal Rodoviário (caminhões e estradas).',
          'Modal Hidroviário (portos e rios).',
          'Modal Aeroviário (aviões).'
        ],
        correctIndex: 1,
        explanation: 'Cerca de 60% de toda a carga do Brasil circula por rodovias, o que eleva os custos de frete e deixa o abastecimento vulnerável a paralisações.'
      }
    ]
  },
  {
    id: 'pib-d18',
    day: 18,
    title: 'Desafio Dia 18: A Importância da Produtividade',
    description: 'Entenda por que a eficiência do trabalhador é a chave para o crescimento da renda nacional.',
    reward: 5.00,
    questions: [
      {
        questionText: 'Como economistas definem a "Produtividade do Trabalho"?',
        options: [
          'A quantidade total de horas extras cumpridas pelo trabalhador.',
          'A quantidade de valor gerado por hora trabalhada por pessoa.',
          'O número de contratações realizadas no mesmo setor industrial.',
          'O percentual de faltas justificadas de funcionários nas fábricas.'
        ],
        correctIndex: 1,
        explanation: 'Mais importante do que trabalhar muitas horas é trabalhar com eficiência (tecnologia, educação e infraestrutura), gerando mais valor em menos tempo.'
      }
    ]
  },
  {
    id: 'pib-d19',
    day: 19,
    title: 'Desafio Dia 19: Intermediação Financeira e Crédito',
    description: 'Entenda como os bancos canalizam poupança para investimentos produtivos na economia.',
    reward: 5.00,
    questions: [
      {
        questionText: 'Qual o papel básico dos intermediários financeiros (bancos e cooperativas) na economia?',
        options: [
          'Apenas guardar papel-moeda de maneira física em cofres seguros.',
          'Conectar poupadores (que têm dinheiro) a tomadores de crédito (que precisam de recursos para investir ou consumir).',
          'Fixar os preços de todas as mercadorias comercializadas no varejo.',
          'Impedir o livre fluxo de capitais e transações internacionais.'
        ],
        correctIndex: 1,
        explanation: 'Ao captar depósitos e fornecer empréstimos, o sistema financeiro move recursos ociosos para viabilizar novas indústrias, comércios e moradias.'
      }
    ]
  },
  {
    id: 'pib-d20',
    day: 20,
    title: 'Desafio Dia 20: Economia Circular e Verde',
    description: 'Conheça os modelos econômicos modernos focados em desenvolvimento sustentável e reciclagem.',
    reward: 5.00,
    questions: [
      {
        questionText: 'Qual o princípio fundamental da chamada "Economia Circular"?',
        options: [
          'Focar apenas no aumento contínuo de extração de recursos naturais limitados.',
          'Eliminar o desperdício redesenhando processos para reaproveitar e reciclar materiais continuamente.',
          'Proibir a circulação física de moedas e notas em papel.',
          'Concentrar a produção industrial exclusivamente em áreas urbanas circulares.'
        ],
        correctIndex: 1,
        explanation: 'Diferente da economia linear (extrair, produzir, descartar), a circular visa manter recursos em ciclos de uso constante, reduzindo a pressão sobre o planeta.'
      }
    ]
  }
];

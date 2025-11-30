// nuxt-app/composables/useProcessosTemplates.js
export const useProcessosTemplates = () => {
  
  const templates = {
    PADRAO_MAQUINA: [
      {
        nome: 'Lançamento da OP no Sistema',
        descricao: 'Registro inicial da Ordem de Produção no sistema',
        sequencia: 1,
        prazoEstimado: 1,
        status: 'NAO_INICIADO',
        progresso: 0
      },
      {
        nome: 'Criação da Pasta do Projeto',
        descricao: 'Criação da estrutura de pastas para documentação do projeto',
        sequencia: 2,
        prazoEstimado: 1,
        status: 'NAO_INICIADO',
        progresso: 0
      },
      {
        nome: 'Início do Projeto Mecânico',
        descricao: 'Início do desenvolvimento do projeto 3D no SolidWorks',
        sequencia: 3,
        prazoEstimado: 15,
        status: 'NAO_INICIADO',
        progresso: 0
      },
      {
        nome: 'Detalhamento das Peças',
        descricao: 'Criação dos desenhos técnicos e detalhamento de todas as peças',
        sequencia: 4,
        prazoEstimado: 10,
        status: 'NAO_INICIADO',
        progresso: 0
      },
      {
        nome: 'Geração da Lista de Peças (BOM)',
        descricao: 'Exportação da planilha BOM do SolidWorks',
        sequencia: 5,
        prazoEstimado: 2,
        status: 'NAO_INICIADO',
        progresso: 0
      },
      {
        nome: 'Importação da Lista de Peças',
        descricao: 'Upload e importação da planilha BOM no sistema',
        sequencia: 6,
        prazoEstimado: 1,
        status: 'NAO_INICIADO',
        progresso: 0
      },
      {
        nome: 'Criação de Roteiros de Fabricação',
        descricao: 'Criação dos roteiros de pintura, zincagem e calibração',
        sequencia: 7,
        prazoEstimado: 3,
        status: 'NAO_INICIADO',
        progresso: 0
      },
      {
        nome: 'Solicitação de Orçamentos',
        descricao: 'Envio de e-mails para cotação de peças e serviços',
        sequencia: 8,
        prazoEstimado: 5,
        status: 'NAO_INICIADO',
        progresso: 0
      },
      {
        nome: 'Solicitação de Compras',
        descricao: 'Emissão de ordens de compra baseadas nos orçamentos aprovados',
        sequencia: 9,
        prazoEstimado: 2,
        status: 'NAO_INICIADO',
        progresso: 0
      },
      {
        nome: 'Recebimento de Materiais',
        descricao: 'Controle de recebimento e inspeção de materiais comprados',
        sequencia: 10,
        prazoEstimado: 10,
        status: 'NAO_INICIADO',
        progresso: 0
      },
      {
        nome: 'Montagem do Equipamento',
        descricao: 'Montagem mecânica completa do equipamento',
        sequencia: 11,
        prazoEstimado: 15,
        status: 'NAO_INICIADO',
        progresso: 0
      },
      {
        nome: 'Projeto Elétrico e CLP',
        descricao: 'Desenvolvimento da parte elétrica e programação do CLP/IHM',
        sequencia: 12,
        prazoEstimado: 10,
        status: 'NAO_INICIADO',
        progresso: 0
      },
      {
        nome: 'Testes do Equipamento',
        descricao: 'Testes funcionais e de qualidade do equipamento montado',
        sequencia: 13,
        prazoEstimado: 5,
        status: 'NAO_INICIADO',
        progresso: 0
      },
      {
        nome: 'Documentação Técnica',
        descricao: 'Elaboração de manual técnico, fotos e vídeos',
        sequencia: 14,
        prazoEstimado: 5,
        status: 'NAO_INICIADO',
        progresso: 0
      },
      {
        nome: 'Embalagem e Expedição',
        descricao: 'Preparação para envio e expedição ao cliente',
        sequencia: 15,
        prazoEstimado: 2,
        status: 'NAO_INICIADO',
        progresso: 0
      }
    ],
    SIMPLES: [
      {
        nome: 'Lançamento da OP',
        descricao: 'Registro inicial da OP',
        sequencia: 1,
        prazoEstimado: 1,
        status: 'NAO_INICIADO',
        progresso: 0
      },
      {
        nome: 'Projeto Mecânico',
        descricao: 'Desenvolvimento do projeto 3D',
        sequencia: 2,
        prazoEstimado: 10,
        status: 'NAO_INICIADO',
        progresso: 0
      },
      {
        nome: 'Lista de Peças',
        descricao: 'Geração e importação do BOM',
        sequencia: 3,
        prazoEstimado: 2,
        status: 'NAO_INICIADO',
        progresso: 0
      },
      {
        nome: 'Compras',
        descricao: 'Solicitação e acompanhamento de compras',
        sequencia: 4,
        prazoEstimado: 7,
        status: 'NAO_INICIADO',
        progresso: 0
      },
      {
        nome: 'Montagem',
        descricao: 'Montagem do equipamento',
        sequencia: 5,
        prazoEstimado: 10,
        status: 'NAO_INICIADO',
        progresso: 0
      },
      {
        nome: 'Testes e Entrega',
        descricao: 'Testes finais e expedição',
        sequencia: 6,
        prazoEstimado: 3,
        status: 'NAO_INICIADO',
        progresso: 0
      }
    ]
  }

  const getTemplate = (templateName) => {
    return templates[templateName] || templates.PADRAO_MAQUINA
  }

  const getTemplateNames = () => {
    return Object.keys(templates).map(key => ({
      value: key,
      title: key.split('_').join(' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
    }))
  }

  return {
    templates,
    getTemplate,
    getTemplateNames
  }
}
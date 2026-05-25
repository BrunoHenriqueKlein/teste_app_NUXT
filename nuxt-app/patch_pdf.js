const fs = require('fs');
const filePath = '/home/dev2/dev/teste_app_NUXT/nuxt-app/pages/compras/index.vue';
let content = fs.readFileSync(filePath, 'utf8');

const htmlStart = `    <!-- Layout de Impressão de OC (Oculto na Web) -->
    <div id="print-oc" class="d-none print-only pa-4">`;
const htmlEnd = `        </table>
      </div>
    </div>`;

const newHtml = `    <!-- Layout de Impressão de OC (Oculto na Web) -->
    <div id="print-oc" class="d-none print-only pa-4">
      <div v-if="printData">
        <div v-for="(chunk, pageIndex) in chunkedPrintItens" :key="pageIndex" class="oc-page" style="font-family: Arial, sans-serif; font-size: 11px; color: #000; line-height: 1.3; margin-bottom: 20px; background: white; padding: 10px; page-break-after: always; min-height: 200mm;">
        
          <!-- Cabeçalho Principal -->
          <table style="width: 100%; border-collapse: collapse; border: 1px solid #000; margin-bottom: 0;">
            <tr>
                <td style="width: 20%; padding: 10px; border-right: 1px solid #000; text-align: center;">
                    <img :src="logoSomehUrl" alt="SOMEH" style="max-width: 150px;" />
                </td>
                <td style="width: 45%; padding: 10px; border-right: 1px solid #000; font-size: 10px;">
                    <strong>SOMEH PROJETOS, PRODUTOS E SERVIÇOS LTDA - ME</strong><br/>
                    CNPJ: 19526992000113 IE: 25.767.346-6<br/>
                    <strong>Endereço:</strong> Rua João Elias Claudino, Nº 738 - Lateral Procópio Pereira<br/>
                    89245-000 Bairro corveta Araquari/SC Loteamento industrial Techlog Service<br/>
                    Fone/Fax: 47 3202-7221<br/>
                    compras@someh.com.br<br/>
                    www.someh.com.br
                </td>
                <td style="width: 35%; padding: 0; vertical-align: top;">
                    <table style="width: 100%; border-collapse: collapse; height: 100%;">
                        <tr>
                            <td style="padding: 5px; border-bottom: 1px solid #000; border-right: 1px solid #000; font-weight: bold;">PEDIDO DE COMPRA:</td>
                            <td style="padding: 5px; border-bottom: 1px solid #000; font-weight: bold; font-size: 16px; text-align: right; color: red;">{{ printData.numero?.startsWith('REQ') ? 'OC - A GERAR' : printData.numero }}</td>
                        </tr>
                        <tr>
                            <td style="padding: 5px; border-bottom: 1px solid #000; border-right: 1px solid #000; font-weight: bold;">EMISSÃO:</td>
                            <td style="padding: 5px; border-bottom: 1px solid #000; text-align: right;">{{ new Date().toLocaleDateString('pt-BR') }}</td>
                        </tr>
                        <tr>
                            <td style="padding: 5px; border-bottom: 1px solid #000; border-right: 1px solid #000; font-weight: bold;">FORMA DE PAGAMENTO:</td>
                            <td style="padding: 5px; border-bottom: 1px solid #000; text-align: right;">{{ printData.formaPagamento || 'A Combinar' }}</td>
                        </tr>
                        <tr>
                            <td style="padding: 5px; border-right: 1px solid #000; font-weight: bold;">ENTREGA PREVISÃO:</td>
                            <td style="padding: 5px; text-align: right; font-weight: bold;">{{ printData.dataPrevisaoEntrega ? new Date(printData.dataPrevisaoEntrega).toLocaleDateString('pt-BR') : 'A Combinar' }}</td>
                        </tr>
                    </table>
                </td>
            </tr>
          </table>

          <!-- Dados do Fornecedor -->
          <table style="width: 100%; border-collapse: collapse; border: 1px solid #000; border-top: none;">
            <tr>
                <td colspan="4" style="background-color: #e0e0e0; text-align: center; font-weight: bold; padding: 5px; border-bottom: 1px solid #000 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact;">DADOS DO FORNECEDOR</td>
            </tr>
            <tr>
                <td style="padding: 5px; font-weight: bold; width: 15%; border-right: 1px solid #000; border-bottom: 1px solid #000;">FORNECEDOR:</td>
                <td style="padding: 5px; width: 55%; border-right: 1px solid #000; border-bottom: 1px solid #000;">{{ printData.fornecedor }}</td>
                <td style="padding: 5px; font-weight: bold; width: 10%; border-right: 1px solid #000; border-bottom: 1px solid #000;">CNPJ:</td>
                <td style="padding: 5px; width: 20%; border-bottom: 1px solid #000;">{{ printData.fornecedorRef?.cnpj || '' }}</td>
            </tr>
            <tr>
                <td style="padding: 5px; font-weight: bold; border-right: 1px solid #000; border-bottom: 1px solid #000;">TELEFONE:</td>
                <td style="padding: 5px; border-right: 1px solid #000; border-bottom: 1px solid #000;">{{ printData.fornecedorRef?.telefone || '' }}</td>
                <td style="padding: 5px; font-weight: bold; border-right: 1px solid #000; border-bottom: 1px solid #000;">E-MAIL:</td>
                <td style="padding: 5px; border-bottom: 1px solid #000;">{{ printData.fornecedorRef?.email || '' }}</td>
            </tr>
            <tr>
                <td style="padding: 5px; font-weight: bold; border-right: 1px solid #000;">ENDEREÇO:</td>
                <td colspan="3" style="padding: 5px;">{{ printData.fornecedorRef?.endereco || '' }}</td>
            </tr>
          </table>

          <!-- Produtos -->
          <table style="width: 100%; border-collapse: collapse; border: 1px solid #000; border-top: none; margin-top: 5px;">
            <tr>
                <td colspan="9" style="background-color: #e0e0e0; text-align: center; font-weight: bold; padding: 5px; border-bottom: 1px solid #000 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact;">PRODUTOS</td>
            </tr>
            <tr style="font-weight: bold; text-align: center;">
                <td rowspan="2" style="padding: 5px; border: 1px solid #000;">CÓDIGO</td>
                <td rowspan="2" style="padding: 5px; border: 1px solid #000;">DESCRIÇÃO</td>
                <td rowspan="2" style="padding: 5px; border: 1px solid #000;">ETAPA / PROCESSO</td>
                <td rowspan="2" style="padding: 5px; border: 1px solid #000;">MATERIAL</td>
                <td rowspan="2" style="padding: 5px; border: 1px solid #000;">QTD</td>
                <td rowspan="2" style="padding: 5px; border: 1px solid #000;">UN</td>
                <td rowspan="2" style="padding: 5px; border: 1px solid #000;">R$ UNIT.</td>
                <td colspan="2" style="padding: 5px; border: 1px solid #000;">IMPOSTOS</td>
                <td rowspan="2" style="padding: 5px; border: 1px solid #000;">VALOR TOTAL (R$)</td>
            </tr>
            <tr style="font-weight: bold; text-align: center;">
                <td style="padding: 2px; border: 1px solid #000; font-size: 9px;">(%) ICMS</td>
                <td style="padding: 2px; border: 1px solid #000; font-size: 9px;">(%) IPI</td>
            </tr>
            <tr v-for="item in chunk" :key="item.id">
                <td style="padding: 5px; border: 1px solid #000;">{{ item.peca?.codigo || '-' }}</td>
                <td style="padding: 5px; border: 1px solid #000;">{{ item.peca?.descricao || (item.descricao.includes(' - Peça: ') ? item.descricao.split(' - Peça: ')[1] : item.descricao) }}</td>
                <td style="padding: 5px; border: 1px solid #000;">{{ item.descricao.includes('SERVIÇO: ') ? item.descricao.split(' - ')[0].replace('SERVIÇO: ', '') : '-' }}</td>
                <td style="padding: 5px; border: 1px solid #000; text-align: center;">{{ item.peca?.material || '-' }}</td>
                <td style="padding: 5px; border: 1px solid #000; text-align: center;">{{ item.quantidade }}</td>
                <td style="padding: 5px; border: 1px solid #000; text-align: center;">PÇ</td>
                <td style="padding: 5px; border: 1px solid #000; text-align: right;">{{ formatCurrency(item.valorUnitario) }}</td>
                <td style="padding: 5px; border: 1px solid #000; text-align: center;">{{ item.aliqICMS || 0 }}%</td>
                <td style="padding: 5px; border: 1px solid #000; text-align: center;">{{ item.aliqIPI || 0 }}%</td>
                <td style="padding: 5px; border: 1px solid #000; text-align: right;">{{ formatCurrency((item.quantidade * item.valorUnitario) + ((item.quantidade * item.valorUnitario) * ((item.aliqIPI || 0) / 100))) }}</td>
            </tr>
          </table>

          <!-- Totais e Rodapé (Apenas na última página) -->
          <div v-if="pageIndex === chunkedPrintItens.length - 1">
            <table style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td style="width: 70%; border: 0;"></td>
                    <td style="width: 30%; padding: 0;">
                        <table style="width: 100%; border-collapse: collapse; border-left: 1px solid #000; border-right: 1px solid #000; border-bottom: 1px solid #000;">
                            <tr>
                                <td style="padding: 5px; font-weight: bold; border-right: 1px solid #000; border-bottom: 1px solid #000; text-align: right;">VALOR TOTAL:</td>
                                <td style="padding: 5px; text-align: right; border-bottom: 1px solid #000;">{{ formatCurrency(printData.itensSum) }}</td>
                            </tr>
                            <tr>
                                <td style="padding: 5px; font-weight: bold; border-right: 1px solid #000; border-bottom: 1px solid #000; text-align: right;">VALOR TOTAL IPI:</td>
                                <td style="padding: 5px; text-align: right; border-bottom: 1px solid #000;">{{ formatCurrency(printData.totalIPI) }}</td>
                            </tr>
                            <tr>
                                <td style="padding: 5px; font-weight: bold; border-right: 1px solid #000; border-bottom: 1px solid #000; text-align: right;">VALOR TOTAL FRETE:</td>
                                <td style="padding: 5px; text-align: right; border-bottom: 1px solid #000;">{{ formatCurrency(printData.valorFrete || 0) }}</td>
                            </tr>
                            <tr>
                                <td style="padding: 5px; font-weight: bold; border-right: 1px solid #000; text-align: right;">VALOR TOTAL COM IPI:</td>
                                <td style="padding: 5px; text-align: right;">{{ formatCurrency(printData.valorTotal) }}</td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>

            <table style="width: 100%; border-collapse: collapse; border: 1px solid #000; margin-top: 5px; page-break-inside: avoid;">
                <tr>
                    <td style="padding: 5px; background-color: #e0e0e0; border-bottom: 1px solid #000 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact;" colspan="3">
                        <strong>TRANSPORTADORA:</strong> {{ printData.transportadora || 'A DEFINIR' }} &nbsp;&nbsp;&nbsp; <strong>CNPJ:</strong> {{ printData.cnpjTransportadora || '-' }}
                    </td>
                </tr>
                <tr>
                    <td style="padding: 10px; width: 60%; border-right: 1px solid #000; vertical-align: top;">
                        <strong>OBS:</strong> {{ printData.observacoes || '' }}<br/>
                        {{ printData.os ? 'Ref OS: ' + printData.os.numero : '' }}<br/>
                        {{ printData.op ? 'OP: ' + printData.op.numeroOP + ' - ' + printData.op.cliente : '' }}
                    </td>
                    <td style="padding: 10px; width: 20%; border-right: 1px solid #000; vertical-align: top; text-align: center;">
                        <strong>FRETE:</strong><br/><br/>
                        {{ printData.tipoFrete || 'A Combinar' }}
                    </td>
                    <td style="padding: 10px; width: 20%; vertical-align: top; text-align: center;">
                        <strong>Aprovação:</strong>
                    </td>
                </tr>
                <tr>
                    <td colspan="3" style="padding: 10px; border-top: 1px solid #000; text-align: center; font-size: 10px;">
                        <span style="color: red; font-weight: bold; -webkit-print-color-adjust: exact; print-color-adjust: exact;">ATENÇÃO:</span> Só receberemos vossa mercadoria mediante ao envio dos arquivos DANFE e XML para <span style="color: blue;">adm1@someh.com.br</span><br/>
                        Obrigatório mencionar o número do pedido de compra no campo observação da NF<br/>
                        <span style="color: red; font-weight: bold; -webkit-print-color-adjust: exact; print-color-adjust: exact;">NOVO ENDEREÇO:</span> Rua João Elias Claudino. Nº 738 – Lateral Procópio Pereira 89245-000 Bairro corveta Araquari/SC Loteamento industrial Techlog Service
                    </td>
                </tr>
                <tr>
                    <td colspan="3" style="padding: 15px 10px; border-top: 1px solid #000; text-align: justify; position: relative;">
                        Recebido em: ____/____/________ 
                        <span style="float: right;">_____________________________________________</span><br>
                        <span style="float: right;">Assinatura do autorizador e carimbo</span>
                    </td>
                </tr>
            </table>
          </div>

          <!-- Numeração de Página -->
          <div style="text-align: right; margin-top: 10px; font-size: 10px; font-weight: bold;">
             Página {{ pageIndex + 1 }} de {{ chunkedPrintItens.length }}
          </div>

        </div>
      </div>
    </div>`;

const startIdx = content.indexOf(htmlStart);
const endIdx = content.indexOf(htmlEnd) + htmlEnd.length;

if (startIdx !== -1 && endIdx !== -1) {
  content = content.substring(0, startIdx) + newHtml + content.substring(endIdx);
} else {
  console.log("Could not find html block to replace");
}

// Now replace JS blocks
const jsDataStart = `const printData = ref(null)`;
const newJsData = `const printData = ref(null)

const chunkedPrintItens = computed(() => {
  if (!printData.value || !printData.value.itens) return []
  const items = printData.value.itens
  const size = 15 // Máximo de itens por página
  const result = []
  for (let i = 0; i < items.length; i += size) {
    result.push(items.slice(i, i + size))
  }
  return result
})

const generateMultiPagePDF = async () => {
  const printElement = document.getElementById('print-oc')
  if (!printElement || !window.htmlToImage || !window.jspdf) {
    throw new Error('Erro ao carregar bibliotecas ou elemento ausente')
  }

  const oldDisplay = printElement.style.display
  printElement.style.setProperty('display', 'block', 'important')

  try {
    await new Promise(r => setTimeout(r, 800)) // Dá tempo para renderizar

    const { jsPDF } = window.jspdf
    const pdf = new jsPDF('l', 'mm', 'a4')

    const pages = printElement.querySelectorAll('.oc-page')
    for (let i = 0; i < pages.length; i++) {
      if (i > 0) pdf.addPage()
      const pageEl = pages[i]
      const jpegBase64 = await window.htmlToImage.toJpeg(pageEl, {
        backgroundColor: '#ffffff',
        style: { transform: 'none' },
        pixelRatio: 2,
        quality: 0.8
      })

      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (pageEl.offsetHeight * pdfWidth) / pageEl.offsetWidth

      pdf.addImage(jpegBase64, 'JPEG', 0, 0, pdfWidth, pdfHeight)
    }
    return pdf
  } finally {
    printElement.style.display = oldDisplay
  }
}`;

content = content.replace(jsDataStart, newJsData);


// Rep 1: visualizarOC
const jsVisualizar1 = `    const printElement = document.getElementById('print-oc')
    if (printElement && window.htmlToImage) {
      const oldDisplay = printElement.style.display
      printElement.style.setProperty('display', 'block', 'important')
      try {
        const jpegBase64 = await window.htmlToImage.toJpeg(printElement, {
          backgroundColor: '#ffffff',
          style: { transform: 'none' },
          pixelRatio: 2,
          quality: 0.8
        })
        
        if (window.jspdf && window.jspdf.jsPDF) {
          const { jsPDF } = window.jspdf
          const pdf = new jsPDF('l', 'mm', 'a4')
          const pdfWidth = pdf.internal.pageSize.getWidth()
          const pdfHeight = (printElement.offsetHeight * pdfWidth) / printElement.offsetWidth
          
          pdf.addImage(jpegBase64, 'JPEG', 0, 0, pdfWidth, pdfHeight)
          const blobUrl = pdf.output('bloburl')
          window.open(blobUrl, '_blank')
        } else {
           console.error('jsPDF não está carregado.')
        }
      } catch (e) {
        console.error('Erro ao gerar pdf:', e)
      } finally {
        printElement.style.display = oldDisplay
      }
    }`;

const newJsVisualizar1 = `    try {
      const pdf = await generateMultiPagePDF()
      const blobUrl = pdf.output('bloburl')
      window.open(blobUrl, '_blank')
    } catch (e) {
      console.error('Erro ao gerar pdf:', e)
      showSnackbar('Erro ao gerar PDF', 'error')
    }`;

content = content.replace(jsVisualizar1, newJsVisualizar1);

// Rep 2: enviarEmailOC
const jsEnviarEmail = `    const printElement = document.getElementById('print-oc')
    if (!printElement || !window.htmlToImage || !window.jspdf) {
      showSnackbar('Erro ao carregar bibliotecas', 'error')
      return
    }

    const oldDisplay = printElement.style.display
    printElement.style.setProperty('display', 'block', 'important')
    let poImageBase64 = null
    
    try {
      const jpegBase64 = await window.htmlToImage.toJpeg(printElement, {
        backgroundColor: '#ffffff',
        style: { transform: 'none' },
        pixelRatio: 2,
        quality: 0.8
      })
      
      const { jsPDF } = window.jspdf
      const pdf = new jsPDF('l', 'mm', 'a4')
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (printElement.offsetHeight * pdfWidth) / printElement.offsetWidth
      
      pdf.addImage(jpegBase64, 'JPEG', 0, 0, pdfWidth, pdfHeight)
      poImageBase64 = pdf.output('datauristring')
    } finally {
      printElement.style.display = oldDisplay
    }`;

const newJsEnviarEmail = `    let poImageBase64 = null
    try {
      const pdf = await generateMultiPagePDF()
      poImageBase64 = pdf.output('datauristring')
    } catch (e) {
      console.error('Erro ao gerar pdf:', e)
      showSnackbar('Erro ao gerar PDF', 'error')
      return
    }`;

content = content.replace(jsEnviarEmail, newJsEnviarEmail);

// Rep 3: baixarImagemOC
const jsBaixarImagem = `    const printElement = document.getElementById('print-oc')
    if (!printElement || !window.htmlToImage || !window.jspdf) {
      showSnackbar('Bibliotecas de PDF não carregadas', 'error')
      return
    }

    const oldDisplay = printElement.style.display
    printElement.style.setProperty('display', 'block', 'important')
    try {
      const jpegBase64 = await window.htmlToImage.toJpeg(printElement, {
        backgroundColor: '#ffffff',
        style: { transform: 'none' },
        pixelRatio: 2,
        quality: 0.8
      })

      if (window.jspdf && window.jspdf.jsPDF) {
        const { jsPDF } = window.jspdf
        const pdf = new jsPDF('l', 'mm', 'a4')
        const pdfWidth = pdf.internal.pageSize.getWidth()
        const pdfHeight = (printElement.offsetHeight * pdfWidth) / printElement.offsetWidth
        
        pdf.addImage(jpegBase64, 'JPEG', 0, 0, pdfWidth, pdfHeight)
        
        const blobUrl = pdf.output('bloburl')
        window.open(blobUrl, '_blank')
      } else {
        showSnackbar('Biblioteca PDF não carregada', 'error')
      }
    } catch (e) {
      console.error(e)
      showSnackbar('Erro ao gerar PDF', 'error')
    } finally {
      printElement.style.display = oldDisplay
    }`;

const newJsBaixarImagem = `    try {
      const pdf = await generateMultiPagePDF()
      const blobUrl = pdf.output('bloburl')
      window.open(blobUrl, '_blank')
    } catch (e) {
      console.error(e)
      showSnackbar('Erro ao gerar PDF', 'error')
    }`;

content = content.replace(jsBaixarImagem, newJsBaixarImagem);

fs.writeFileSync(filePath, content);
console.log('Script patched successfully.');

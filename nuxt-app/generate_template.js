const XLSX = require('xlsx');
const fs = require('fs');

const ws_name = "Planilha1";
const ws_data = [
  [
    "Codigo", 
    "Descricao", 
    "Quantidade", 
    "Material", 
    "Subcategoria", 
    "Subconjunto", 
    "Categoria", 
    "ValorUnitario"
  ],
  [
    "P-001", 
    "Eixo Principal", 
    "2", 
    "Aço 1045", 
    "Usinagem", 
    "Conjunto Motor", 
    "FABRICADO", 
    "150.50"
  ],
  [
    "C-102", 
    "Rolamento SKF 6205", 
    "4", 
    "-", 
    "Comercial", 
    "Conjunto Motor", 
    "COMERCIAL", 
    "45.00"
  ]
];

const ws = XLSX.utils.aoa_to_sheet(ws_data);

// Define column widths for better readability
const wscols = [
  {wch: 15}, // Codigo
  {wch: 40}, // Descricao
  {wch: 12}, // Quantidade
  {wch: 20}, // Material
  {wch: 20}, // Subcategoria
  {wch: 20}, // Subconjunto
  {wch: 15}, // Categoria
  {wch: 15}  // ValorUnitario
];
ws['!cols'] = wscols;

const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, ws_name);

const outputPath = '/home/dev2/.gemini/antigravity/brain/c899c021-8852-47a4-9bd2-924d387f4cde/artifacts/Template_Importacao_Pecas.xlsx';
XLSX.writeFile(wb, outputPath);
console.log('Template created at:', outputPath);

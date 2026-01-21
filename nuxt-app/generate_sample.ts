import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

const data = [
    { Codigo: 'MP-001', Descricao: 'Chapa de Aço 1020 1/4"', Quantidade: 5, Material: 'Aço Carbono' },
    { Codigo: 'US-005', Descricao: 'Eixo Trefilado 25mm', Quantidade: 2, Material: 'Aço 1045' },
    { Codigo: 'CA-010', Descricao: 'Perfil U 3"', Quantidade: 10, Material: 'Aço Carbono' },
    { Codigo: 'PC-020', Descricao: 'Parafuso Sextavado M10x50', Quantidade: 50, Material: 'Zincado' },
    { Codigo: 'PN-002', Descricao: 'Tinta Epóxi Cinza Munsell', Quantidade: 1, Material: 'Lata 3.6L' },
];

const worksheet = XLSX.utils.json_to_sheet(data);
const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, worksheet, 'BOM Sample');

const filePath = path.join(process.cwd(), 'Exemplo_BOM_SolidWorks.xlsx');
XLSX.writeFile(workbook, filePath);

console.log(`✅ Arquivo gerado com sucesso em: ${filePath}`);

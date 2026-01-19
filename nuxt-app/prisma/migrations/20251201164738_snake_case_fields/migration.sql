-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'GERENTE', 'ENGENHEIRO', 'COMPRADOR', 'PCP', 'QUALIDADE', 'ESTOQUE', 'VENDAS', 'USER');

-- CreateEnum
CREATE TYPE "UserDepartment" AS ENUM ('ADMINISTRATIVO', 'VENDAS', 'ENGENHARIA', 'COMPRAS', 'PCP', 'QUALIDADE', 'ESTOQUE', 'MONTAGEM', 'EXPEDICAO');

-- CreateEnum
CREATE TYPE "OPStatus" AS ENUM ('ABERTA', 'EM_PROJETO', 'AGUARDANDO_COMPRAS', 'EM_FABRICACAO', 'EM_MONTAGEM', 'EM_TESTES', 'AGUARDANDO_DOCUMENTACAO', 'PRONTA_EXPEDICAO', 'ENTREGUE', 'CANCELADA');

-- CreateEnum
CREATE TYPE "ProcessoStatus" AS ENUM ('NAO_INICIADO', 'EM_ANDAMENTO', 'AGUARDANDO', 'CONCLUIDO', 'BLOQUEADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "PecaStatus" AS ENUM ('NAO_INICIADA', 'EM_COTACAO', 'EM_FABRICACAO', 'AGUARDANDO_RECEBIMENTO', 'EM_ESTOQUE', 'EM_MONTAGEM', 'MONTADA');

-- CreateEnum
CREATE TYPE "MovimentacaoTipo" AS ENUM ('ENTRADA', 'SAIDA', 'AJUSTE');

-- CreateEnum
CREATE TYPE "CompraStatus" AS ENUM ('SOLICITADA', 'COTACAO', 'APROVADA', 'PEDIDO_EMITIDO', 'RECEBIDA_PARCIAL', 'RECEBIDA_TOTAL', 'CANCELADA');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "department" "UserDepartment" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ops" (
    "id" SERIAL NOT NULL,
    "numeroOP" TEXT NOT NULL,
    "codigoMaquina" TEXT NOT NULL,
    "descricaoMaquina" TEXT NOT NULL,
    "observacoes" TEXT,
    "dataPedido" TIMESTAMP(3) NOT NULL,
    "dataEntrega" TIMESTAMP(3) NOT NULL,
    "dataCriacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataInicio" TIMESTAMP(3),
    "dataFinalizacao" TIMESTAMP(3),
    "status" "OPStatus" NOT NULL DEFAULT 'ABERTA',
    "progresso" INTEGER NOT NULL DEFAULT 0,
    "cliente" TEXT NOT NULL,
    "cnpjCliente" TEXT,
    "enderecoCliente" TEXT,
    "criadoPorId" INTEGER NOT NULL,
    "responsavelId" INTEGER,

    CONSTRAINT "ops_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "op_processos" (
    "id" SERIAL NOT NULL,
    "opId" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "sequencia" INTEGER NOT NULL,
    "status" "ProcessoStatus" NOT NULL DEFAULT 'NAO_INICIADO',
    "progresso" INTEGER NOT NULL DEFAULT 0,
    "prazo_estimado" INTEGER,
    "data_prevista" TIMESTAMP(3),
    "data_inicio_prevista" TIMESTAMP(3),
    "data_termino_prevista" TIMESTAMP(3),
    "data_inicio" TIMESTAMP(3),
    "data_fim" TIMESTAMP(3),
    "responsavel_id" INTEGER,

    CONSTRAINT "op_processos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "processo_historico" (
    "id" SERIAL NOT NULL,
    "processoId" INTEGER NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "acao" TEXT NOT NULL,
    "detalhes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "processo_historico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pecas" (
    "id" SERIAL NOT NULL,
    "opId" INTEGER NOT NULL,
    "codigo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL DEFAULT 1,
    "material" TEXT,
    "desenhoUrl" TEXT,
    "arquivoBOM" TEXT,
    "status" "PecaStatus" NOT NULL DEFAULT 'NAO_INICIADA',

    CONSTRAINT "pecas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "processo_pecas" (
    "id" SERIAL NOT NULL,
    "pecaId" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "sequencia" INTEGER NOT NULL,
    "status" "ProcessoStatus" NOT NULL DEFAULT 'NAO_INICIADO',
    "fornecedor" TEXT,
    "custo" DOUBLE PRECISION,
    "tempoEstimado" INTEGER,

    CONSTRAINT "processo_pecas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "estoque" (
    "id" SERIAL NOT NULL,
    "codigo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL DEFAULT 0,
    "unidade" TEXT NOT NULL DEFAULT 'UN',
    "minEstoque" INTEGER NOT NULL DEFAULT 0,
    "localizacao" TEXT,

    CONSTRAINT "estoque_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "estoque_movimentacoes" (
    "id" SERIAL NOT NULL,
    "estoqueId" INTEGER NOT NULL,
    "tipo" "MovimentacaoTipo" NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "motivo" TEXT NOT NULL,
    "opId" INTEGER,
    "usuarioId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "estoque_movimentacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compras" (
    "id" SERIAL NOT NULL,
    "opId" INTEGER NOT NULL,
    "numero" TEXT NOT NULL,
    "fornecedor" TEXT NOT NULL,
    "valorTotal" DOUBLE PRECISION,
    "status" "CompraStatus" NOT NULL DEFAULT 'SOLICITADA',
    "dataSolicitacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataEntregaPrevista" TIMESTAMP(3),

    CONSTRAINT "compras_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compra_itens" (
    "id" SERIAL NOT NULL,
    "compraId" INTEGER NOT NULL,
    "pecaId" INTEGER,
    "descricao" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "valorUnitario" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "compra_itens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "modules" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "icon" TEXT,
    "path" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL,

    CONSTRAINT "modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_modules" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "moduleId" INTEGER NOT NULL,
    "canView" BOOLEAN NOT NULL DEFAULT false,
    "canEdit" BOOLEAN NOT NULL DEFAULT false,
    "canDelete" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "user_modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "op_historico" (
    "id" SERIAL NOT NULL,
    "opId" INTEGER NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "acao" TEXT NOT NULL,
    "detalhes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "op_historico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "arquivos" (
    "id" SERIAL NOT NULL,
    "opId" INTEGER,
    "nome" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "tamanho" INTEGER NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "arquivos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ops_numeroOP_key" ON "ops"("numeroOP");

-- CreateIndex
CREATE UNIQUE INDEX "pecas_opId_codigo_key" ON "pecas"("opId", "codigo");

-- CreateIndex
CREATE UNIQUE INDEX "estoque_codigo_key" ON "estoque"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "compras_numero_key" ON "compras"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "modules_nome_key" ON "modules"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "user_modules_userId_moduleId_key" ON "user_modules"("userId", "moduleId");

-- AddForeignKey
ALTER TABLE "ops" ADD CONSTRAINT "ops_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ops" ADD CONSTRAINT "ops_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "op_processos" ADD CONSTRAINT "op_processos_opId_fkey" FOREIGN KEY ("opId") REFERENCES "ops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "op_processos" ADD CONSTRAINT "op_processos_responsavel_id_fkey" FOREIGN KEY ("responsavel_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "processo_historico" ADD CONSTRAINT "processo_historico_processoId_fkey" FOREIGN KEY ("processoId") REFERENCES "op_processos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "processo_historico" ADD CONSTRAINT "processo_historico_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pecas" ADD CONSTRAINT "pecas_opId_fkey" FOREIGN KEY ("opId") REFERENCES "ops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "processo_pecas" ADD CONSTRAINT "processo_pecas_pecaId_fkey" FOREIGN KEY ("pecaId") REFERENCES "pecas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estoque_movimentacoes" ADD CONSTRAINT "estoque_movimentacoes_estoqueId_fkey" FOREIGN KEY ("estoqueId") REFERENCES "estoque"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estoque_movimentacoes" ADD CONSTRAINT "estoque_movimentacoes_opId_fkey" FOREIGN KEY ("opId") REFERENCES "ops"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estoque_movimentacoes" ADD CONSTRAINT "estoque_movimentacoes_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compras" ADD CONSTRAINT "compras_opId_fkey" FOREIGN KEY ("opId") REFERENCES "ops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compra_itens" ADD CONSTRAINT "compra_itens_compraId_fkey" FOREIGN KEY ("compraId") REFERENCES "compras"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compra_itens" ADD CONSTRAINT "compra_itens_pecaId_fkey" FOREIGN KEY ("pecaId") REFERENCES "pecas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_modules" ADD CONSTRAINT "user_modules_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "modules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_modules" ADD CONSTRAINT "user_modules_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "op_historico" ADD CONSTRAINT "op_historico_opId_fkey" FOREIGN KEY ("opId") REFERENCES "ops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "op_historico" ADD CONSTRAINT "op_historico_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "arquivos" ADD CONSTRAINT "arquivos_opId_fkey" FOREIGN KEY ("opId") REFERENCES "ops"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "arquivos" ADD CONSTRAINT "arquivos_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

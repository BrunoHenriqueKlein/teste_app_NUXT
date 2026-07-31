import { PrismaClient } from '@prisma/client'
import { defineEventHandler, createError, readBody } from 'h3'
const prisma = new PrismaClient()

export default defineEventHandler(async (event: any) => {
  const roteiroId = parseInt(event.context.params?.id as string)
  
  if (isNaN(roteiroId)) {
    throw createError({
      statusCode: 400,
      message: 'ID do roteiro inválido'
    })
  }

  try {
    const body = await readBody(event)
    const { status, valorTotal, fornecedorId, opId } = body

    const updateData: any = {}
    if (status !== undefined) updateData.status = status
    if (valorTotal !== undefined) updateData.valorTotal = valorTotal
    if (fornecedorId !== undefined) updateData.fornecedorId = fornecedorId ? parseInt(fornecedorId) : null
    if (opId !== undefined) updateData.opId = opId ? parseInt(opId) : null

    if (status === 'ENVIADO') {
      updateData.dataEnvio = new Date()
    } else if (status === 'RECEBIDO') {
      updateData.dataRetorno = new Date()
    }

    const roteiroAtualizado = await prisma.roteiro.update({
      where: { id: roteiroId },
      data: updateData
    })

    return roteiroAtualizado
  } catch (error: any) {
    console.error('Erro ao atualizar roteiro:', error)
    throw createError({
      statusCode: 500,
      message: 'Erro interno ao atualizar roteiro'
    })
  }
})

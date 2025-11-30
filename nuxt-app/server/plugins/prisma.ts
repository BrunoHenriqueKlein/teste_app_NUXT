import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default defineNitroPlugin((nitroApp) => {
  console.log('✅ Prisma plugin carregado')
  
  // Injeta o Prisma no contexto de todos os eventos
  nitroApp.hooks.hook('request', (event) => {
    event.context.prisma = prisma
  })
})
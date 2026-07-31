import fs from 'fs'
import path from 'path'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const uploadDir = path.join(__dirname, '../public/uploads/desenhos')

if (!fs.existsSync(uploadDir)) {
  console.log('Pasta não encontrada:', uploadDir)
  process.exit(0)
}

const files = fs.readdirSync(uploadDir)

for (const file of files) {
  if (file.includes('_thumb')) continue
  
  const ext = path.extname(file).toLowerCase()
  if (!['.jpg', '.jpeg', '.png'].includes(ext)) continue

  const thumbFileName = file.replace(new RegExp(`\\${ext}$`, 'i'), `_thumb${ext}`)
  const thumbPath = path.join(uploadDir, thumbFileName)
  
  if (fs.existsSync(thumbPath)) continue

  const originalPath = path.join(uploadDir, file)
  
  try {
    console.log(`Gerando miniatura para: ${file}`)
    await sharp(originalPath)
      .resize({ width: 100 })
      .toFile(thumbPath)
  } catch (err) {
    console.error(`Erro ao processar ${file}:`, err)
  }
}

console.log('Finalizado!')

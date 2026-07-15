import path from 'path'
import { uploadToGoogleDrive } from './server/utils/googleDrive'
import fs from 'fs'

const run = async () => {
    try {
        // Create a dummy zip file
        const dummyPath = path.resolve(process.cwd(), 'dummy.zip')
        fs.writeFileSync(dummyPath, 'dummy content')

        console.log('Iniciando upload...')
        const link = await uploadToGoogleDrive(dummyPath, 'application/zip', 'dummy.zip')
        console.log('Sucesso! Link:', link)
    } catch (err) {
        console.error('ERRO AO UPAR:', err)
    }
}

run()

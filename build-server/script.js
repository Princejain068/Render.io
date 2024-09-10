const { exec } = require('child_process')
const path = require('path')
const fs = require('fs')
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3')


// Making a s3 client with our credentials
const s3Client = new S3Client({
    region: process.env.REGION,
    credentials: {
        accessKeyId: process.env.ACCESS_ID,
        secretAccessKey: process.env.ACCESS_KEY
    }
})
// Project Id taking from envirorment Variable
const PROJECT_ID = process.env.PROJECT_ID

async function init(){
    console.log("Executing Script.js................");

    // Going to output folder for installing npm and build our code
    const outDirPath = path.join(__dirname, 'output')
    const p = exec(`cd ${outDirPath} && npm install && npm run build`)

    // For logs...
    p.stdout.on('data', function (data) {
        console.log(data.toString())
    })

    p.stdout.on('error', function (data) {
        console.log('Error', data.toString())
    })

    p.on('close', async function () {
        console.log('Build Complete')
        // After Build completion there will be  dist folder
        const distFolderPath = path.join(__dirname, 'output', 'dist')

        const distFolderContents = fs.readdirSync(distFolderPath, { recursive: true })

        for (const file of distFolderContents) {
            const filePath = path.join(distFolderPath, file)
            if (fs.lstatSync(filePath).isDirectory()) continue;

            console.log('uploading', filePath)

            // Uploading all files in s3 using putobjectcommand
            const command = new PutObjectCommand({
                Bucket: '',
                Key: `__outputs/${PROJECT_ID}/${file}`,
                Body: fs.createReadStream(filePath),
                ContentType: mime.lookup(filePath)
            })

            await s3Client.send(command)

            console.log('uploaded', filePath)
        }
        publishLog(`Done`)
        console.log('Done...')
    })
    
}
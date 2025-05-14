const express = require('express');
const cors = require('cors');  // Import CORS
const { DefaultAzureCredential } = require('@azure/identity');
const { ContainerInstanceManagementClient } = require('@azure/arm-containerinstance');

const app = express();
app.use(cors());  // Enable CORS for all routes
app.use(express.json());

const subscriptionId = '00000000-0000-0000-0000-000000000000';
const resourceGroupName  = 'Fanmire_Platform';
const imageName = 'fanmire-node-backend:v1';
const acrServer = 'fanmireregistry.azurecr.io';
const acrUsername = 'FanmireRegistry';
const acrPassword = // put arc password
const location = 'eastus';

app.post('/create-container', async (req, res) => {
    console.log('Received request:', req);
    const { containerName } = req.body;
    // Create the credentials object
    const credentials = new DefaultAzureCredential();
    const client = new ContainerInstanceManagementClient(credentials, subscriptionId);
    console.log('ssssssssssssssssssssssssssssssssss', client);

    // Container group configuration
    const containerGroupConfig = {
        location: location,
        osType: 'Linux',
        containers: [
            {
                name: containerName,
                image: `${acrServer}/${imageName}`,
                resources: {
                    requests: {
                        cpu: 1,
                        memoryInGB: 1.5,
                    }
                },
                ports: [{ port: 5001 },{ port: 80 }],
            }
        ],
        imageRegistryCredentials: [
            {
                server: acrServer,
                username: acrUsername,
                password: acrPassword
            }
        ],
        restartPolicy: 'Always',
        ipAddress: {
            type: 'Public',
            ports: [{ port: 5001 },{ port: 80 }],
        }
    };

    try {
        console.log('pre--resultresultresult', result);
        const result = await client.containerGroups.beginCreateOrUpdateAndWait(
            resourceGroupName,
            containerName,
            containerGroupConfig
        );
        console.log('resultresultresult', result);
        res.json({ message: 'Container created successfully', result });
    } catch (error) {
        console.log('containerName-catch', containerName);
        res.status(500).json({ error: error.message });
    }
});


app.listen(3000, () => {
    console.log('Server running on port 3000');
});

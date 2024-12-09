const { DefaultAzureCredential } = require("@azure/identity");
const { ContainerInstanceManagementClient } = require("@azure/arm-containerinstance");

const subscriptionId = 'da1fcdce-4d95-44a0-a4e7-0f0b53c6bc26'; // Replace with your Azure subscription ID
const resourceGroupName = 'Fanmire_Platform'; // Replace with your resource group name
const containerGroupName = 'ashishonlive'; // Replace with your container group name

// Replace with your Azure Container Registry details
const acrServer = 'fanmireregistry.azurecr.io'; // e.g., 'myregistry.azurecr.io'
const imageName = 'fanmire-streaming:v1'; // e.g., 'myimage:latest'
const acrUsername = 'FanmireRegistry'; // ACR username or '00000000-0000-0000-0000-000000000000' for managed identity
const acrPassword = '0auphf2xNLEiHPcBW5GMUk18XFnlh/ZdhDb37bOErU+ACRBPT1Zw'; // ACR password or access key

async function main() {
  // Create a credential object using DefaultAzureCredential (which supports multiple authentication methods)
  const credentials = new DefaultAzureCredential();

  // Create the ContainerInstanceManagementClient
  const client = new ContainerInstanceManagementClient(credentials, subscriptionId);

  // Define the container group configuration
  const containerGroupConfig = {
    location: 'eastus2', // Define your region
    osType: 'Linux', // 'Windows' or 'Linux'
    containers: [
      {
        name: containerGroupName,
        image: `${acrServer}/${imageName}`,
        resources: {
          requests: {
            cpu: 1,                  // Specify the CPU core count
            memoryInGB: 1.5          // Corrected capitalization to memoryInGB
          }
        },
        ports: [{ port: 5001 },{ port: 80 }], // Container port to expose
      },
    ],
    imageRegistryCredentials: [
      {
        server: acrServer,
        username: acrUsername,
        password: acrPassword
      }
    ],
    restartPolicy: 'Always', // Can be 'Always', 'OnFailure', or 'Never'
    ipAddress: {
      type: 'Public', // 'Public' or 'Private'
      ports: [{protocol:'TCP', port:5001 },{ protocol: 'TCP', port: 80 }],
    },
  };
  

  console.log('Creating container group...');

  try {
    const result = await client.containerGroups.beginCreateOrUpdateAndWait(
      resourceGroupName,
      containerGroupName,
      containerGroupConfig
    );

    console.log('Container instance created successfully:', result);
  } catch (error) {
    console.error('Error creating container group:', error.message);
  }
}

main();

// Utility to upload file directly to AssemblyAI from frontend
export async function uploadFileToAssemblyAI(file: File): Promise<string> {
  const assemblyApiKey = process.env.NEXT_PUBLIC_ASSEMBLY_API_KEY;
  
  if (!assemblyApiKey) {
    throw new Error('AssemblyAI API key not configured');
  }

  const response = await fetch('https://api.assemblyai.com/v2/upload', {
    method: 'POST',
    headers: {
      'authorization': assemblyApiKey,
      'content-type': 'application/octet-stream',
    },
    body: file,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Upload failed: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.upload_url;
}

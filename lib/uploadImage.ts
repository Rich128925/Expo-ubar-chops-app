const BASE_URL = (process.env.EXPO_PUBLIC_INSFORGE_URL as string).replace(/\/$/, '');

/**
 * Upload a local file URI to InsForge storage using the native HTTP stack.
 * React Native's FormData accepts { uri, name, type } as a file field and reads
 * the file natively — no Blob conversion needed, which avoids Hermes limitations.
 */
export async function uploadImageFromUri(
  uri: string,
  fileName: string,
  mimeType: string,
  fileSize: number | undefined,
  accessToken: string,
  bucket: string,
): Promise<{ url: string; key: string }> {
  // Step 1: get upload strategy (direct vs S3 presigned)
  const stratRes = await fetch(`${BASE_URL}/api/storage/buckets/${bucket}/upload-strategy`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ filename: fileName, contentType: mimeType, size: fileSize }),
  });
  if (!stratRes.ok) {
    const body = await stratRes.text();
    throw new Error(`Upload strategy error ${stratRes.status}: ${body}`);
  }
  const strategy = await stratRes.json();
  const { method, uploadUrl, key, fields, confirmRequired, confirmUrl } = strategy;

  // Step 2: build FormData with a native RN file reference (not a Blob)
  const formData = new FormData();
  if (method === 'presigned' && fields) {
    for (const [k, v] of Object.entries(fields)) {
      formData.append(k, v as string);
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formData.append('file', { uri, name: fileName, type: mimeType } as any);

  // Step 3: upload
  const absoluteUrl = method === 'direct' ? `${BASE_URL}${uploadUrl}` : (uploadUrl as string);
  const uploadRes = await fetch(absoluteUrl, {
    method: method === 'presigned' ? 'POST' : 'PUT',
    headers: method === 'direct' ? { Authorization: `Bearer ${accessToken}` } : {},
    body: formData,
  });
  if (!uploadRes.ok) {
    const body = await uploadRes.text();
    throw new Error(`Upload error ${uploadRes.status}: ${body}`);
  }

  // Step 4: confirm presigned S3 upload if required
  if (confirmRequired && confirmUrl) {
    const confRes = await fetch(`${BASE_URL}${confirmUrl}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ size: fileSize, contentType: mimeType }),
    });
    if (!confRes.ok) {
      const body = await confRes.text();
      throw new Error(`Confirm upload error ${confRes.status}: ${body}`);
    }
    const confirmed = await confRes.json();
    const fullUrl = (confirmed.url as string).startsWith('http')
      ? confirmed.url
      : `${BASE_URL}${confirmed.url}`;
    return { url: fullUrl, key: confirmed.key };
  }

  // Step 5: for direct uploads parse the response; for presigned without confirm build URL
  if (method === 'direct') {
    const result = await uploadRes.json();
    const fullUrl = (result.url as string).startsWith('http')
      ? result.url
      : `${BASE_URL}${result.url}`;
    return { url: fullUrl, key: result.key };
  }

  return { url: `${BASE_URL}/api/storage/buckets/${bucket}/objects/${key}`, key };
}

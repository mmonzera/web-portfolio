import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { filename, fileData } = req.body;

  if (!filename || !fileData) {
    return res.status(400).json({ error: 'Missing filename or fileData' });
  }

  // Extract base64 content
  let base64Content = fileData;
  if (fileData.includes(';base64,')) {
    base64Content = fileData.split(';base64,')[1];
  }

  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const GITHUB_OWNER = process.env.GITHUB_OWNER || 'mmonzera';
  const GITHUB_REPO  = process.env.GITHUB_REPO  || 'web-portfolio';
  
  // Clean filename: remove spaces, lowercase, add unique timestamp
  const ext = path.extname(filename) || '.png';
  const nameWithoutExt = path.basename(filename, ext).replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
  const uniqueName = `upload-${Date.now()}-${nameWithoutExt}${ext}`;
  const relativePath = `images/${uniqueName}`;
  const repoFilePath = `public/${relativePath}`;

  let localSaved = false;
  let githubSaved = false;

  // 1. Try to write locally if running in local Node environment (writable fs)
  try {
    const publicImagesDir = path.join(process.cwd(), 'public', 'images');
    if (!fs.existsSync(publicImagesDir)) {
      fs.mkdirSync(publicImagesDir, { recursive: true });
    }
    const localPath = path.join(publicImagesDir, uniqueName);
    fs.writeFileSync(localPath, Buffer.from(base64Content, 'base64'));
    localSaved = true;
  } catch (err) {
    // Expected to fail on serverless platforms, which is fine
    console.log('Local write skipped or failed (common on Vercel production):', err.message);
  }

  // 2. Try to commit to GitHub if GITHUB_TOKEN is configured
  if (GITHUB_TOKEN) {
    const apiBase = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${repoFilePath}`;
    const headers = {
      'Authorization': `Bearer ${GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    };

    try {
      const putRes = await fetch(apiBase, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          message: `🖼️ Upload image: ${uniqueName} via admin panel`,
          content: base64Content,
          branch: 'main',
        }),
      });

      if (putRes.ok) {
        githubSaved = true;
      } else {
        const errorData = await putRes.json();
        console.error('GitHub PUT error:', errorData);
      }
    } catch (err) {
      console.error('GitHub Upload network error:', err.message);
    }
  }

  if (localSaved || githubSaved) {
    return res.status(200).json({
      success: true,
      url: `/${relativePath}`,
      filename: uniqueName,
    });
  } else {
    return res.status(500).json({
      error: 'Failed to upload image. GITHUB_TOKEN is not configured and local write failed.',
    });
  }
}

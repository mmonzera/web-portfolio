import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { quests } = req.body;

  if (!Array.isArray(quests)) {
    return res.status(400).json({ error: 'Invalid data: quests must be an array' });
  }

  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const GITHUB_OWNER = process.env.GITHUB_OWNER || 'mmonzera';
  const GITHUB_REPO  = process.env.GITHUB_REPO  || 'web-portfolio';
  const FILE_PATH    = 'public/content/quests.json';
  const BRANCH       = 'main';

  let localSaved = false;
  let githubSaved = false;
  let githubError = null;

  // 1. Try to write locally if running in local Node environment (writable fs)
  try {
    const newContent = JSON.stringify({ quests }, null, 2);
    const localPath = path.join(process.cwd(), 'public', 'content', 'quests.json');
    const contentDir = path.dirname(localPath);
    if (!fs.existsSync(contentDir)) {
      fs.mkdirSync(contentDir, { recursive: true });
    }
    fs.writeFileSync(localPath, newContent, 'utf-8');
    localSaved = true;
  } catch (err) {
    console.log('Local write skipped or failed (common on Vercel production):', err.message);
  }

  // 2. Commit to GitHub if GITHUB_TOKEN is present
  if (GITHUB_TOKEN) {
    const apiBase = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${FILE_PATH}`;
    const headers = {
      'Authorization': `Bearer ${GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    };

    try {
      const getRes = await fetch(`${apiBase}?ref=${BRANCH}`, { headers });
      if (!getRes.ok) {
        const err = await getRes.json();
        throw new Error(`GitHub GET error: ${err.message}`);
      }
      const { sha } = await getRes.json();

      const newContent    = JSON.stringify({ quests }, null, 2);
      const contentBase64 = Buffer.from(newContent, 'utf-8').toString('base64');

      const putRes = await fetch(apiBase, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          message: '📝 Update portfolio quests via admin panel',
          content: contentBase64,
          sha,
          branch: BRANCH,
        }),
      });

      if (putRes.ok) {
        githubSaved = true;
      } else {
        const err = await putRes.json();
        throw new Error(`GitHub PUT error: ${err.message}`);
      }
    } catch (err) {
      githubError = err.message;
      console.error(err.message);
    }
  }

  if (localSaved && !GITHUB_TOKEN) {
    return res.status(200).json({
      success: true,
      message: 'Quests saved locally! (GITHUB_TOKEN not set)',
    });
  }

  if (githubSaved) {
    return res.status(200).json({
      success: true,
      message: 'Quests saved! Vercel is redeploying... (~30 seconds)',
    });
  }

  return res.status(500).json({ 
    error: githubError || 'Failed to save quests locally or to GitHub. Ensure GITHUB_TOKEN is set.' 
  });
}

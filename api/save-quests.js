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

  if (!GITHUB_TOKEN) {
    return res.status(500).json({ error: 'GITHUB_TOKEN environment variable is not configured.' });
  }

  const apiBase = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${FILE_PATH}`;
  const headers = {
    'Authorization': `Bearer ${GITHUB_TOKEN}`,
    'Accept': 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
  };

  try {
    // 1. Get current file SHA (required to update the file)
    const getRes = await fetch(`${apiBase}?ref=${BRANCH}`, { headers });
    if (!getRes.ok) {
      const err = await getRes.json();
      return res.status(500).json({ error: `GitHub GET error: ${err.message}` });
    }
    const { sha } = await getRes.json();

    // 2. Prepare new file content (base64 encoded)
    const newContent    = JSON.stringify({ quests }, null, 2);
    const contentBase64 = Buffer.from(newContent, 'utf-8').toString('base64');

    // 3. Commit the updated file
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

    if (!putRes.ok) {
      const err = await putRes.json();
      return res.status(500).json({ error: `GitHub PUT error: ${err.message}` });
    }

    return res.status(200).json({
      success: true,
      message: 'Quests saved! Vercel is redeploying... (~30 seconds)',
    });
  } catch (err) {
    return res.status(500).json({ error: `Unexpected error: ${err.message}` });
  }
}

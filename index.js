import fs from 'fs';
import path from 'path';
import { Octokit } from '@octokit/rest';

// Load environment variables from action inputs
const GITHUB_TOKEN = process.env.INPUT_TOKEN;
const REPO_NAME = process.env.INPUT_REPOSITORY;
const PR_NUMBER = process.env.INPUT_PULL_REQUEST_NUMBER;
const SARIF_PATH = process.env.INPUT_SARIF_PATH || 'codeguru-security-results.sarif.json';
const COMMIT_SHA = process.env.INPUT_INITIAL_COMMIT_SHA;

// Initialize Octokit with your GitHub token
const octokit = new Octokit({
  auth: GITHUB_TOKEN
});

// Load the SARIF results
const sarifPath = path.join(process.cwd(), SARIF_PATH);
const sarifData = JSON.parse(fs.readFileSync(sarifPath, 'utf8'));

console.log("SARIF data loaded successfully");

// Parse the SARIF results and create comments
const comments = sarifData.runs[0].results.map(result => {
  const filePath = result.locations[0].physicalLocation.artifactLocation.uri;
  const lineNumber = result.locations[0].physicalLocation.region.startLine;
  const message = result.message.text;
  console.log(`commit_id: ${COMMIT_SHA}`)

  console.log(`Processing comment for the file: ${filePath}, line: ${lineNumber}`);

  return {
    body: message,
    path: filePath,
    line: lineNumber,
  };
});

console.log("Comments prepared:", comments);

const fetchExistingComments = async () => {
  const { data: existingComments } = await octokit.request('GET /repos/{owner}/{repo}/pulls/{pull_number}/comments', {
    owner: REPO_NAME.split('/')[0],
    repo: REPO_NAME.split('/')[1],
    pull_number: PR_NUMBER,
  });

  // Create a JSON object with filePath as keys and line numbers as nested keys
  const commentMap = {};
  existingComments.forEach(comment => {
    const filePath = comment.path;
    const line = comment.line;
    if (filePath && line) {
      if (!commentMap[filePath]) {
        commentMap[filePath] = {};
      }
      commentMap[filePath][line] = true; // Just mark that this line has a comment
    }
  });

  return commentMap;
};


const createReview = async () => {
  try {
    const existingComments = await fetchExistingComments();
    console.log(`existing comment: ${JSON.stringify(existingComments, null, 2)}`);
    const reviewPromises = comments.map(comment => {
      const { path: filePath, line } = comment;
      console.log(`Checking for existing comment on ${filePath} at line ${line}`);
      // console.log(`file path: ${existingComments[filePath]} && line: ${existingComments[filePath][line]}`);

      if (existingComments[filePath] && existingComments[filePath][line]) {
        console.log(`Skipping duplicate comment on ${filePath} at line ${line}`);
        return Promise.resolve(); // skip if duplicate
      }

      return octokit.request('POST /repos/{owner}/{repo}/pulls/{pull_number}/reviews', {
        owner: REPO_NAME.split('/')[0],
        repo: REPO_NAME.split('/')[1],
        pull_number: PR_NUMBER,
        commit_id: COMMIT_SHA,
        body: '🔍 Codeguru Security Review 🔍',
        event: 'COMMENT',
        comments: [{
          path: comment.path,
          body: `🚨 ${comment.body}`,
          line: comment.line
        }],
        headers: {
          'X-GitHub-Api-Version': '2022-11-28'
        }
      }).then(response => {
        console.log(`Review comment created successfully for ${comment.path} at line ${comment.line} with message: ${comment.body}`);
        return { status: 'fulfilled', value: response };
      }).catch(error => {
        console.error(`Error creating review comment for ${comment.path} at line ${comment.line}:`, error.message);
        if (error.response && error.response.data && error.response.data.errors) {
          error.response.data.errors.forEach(err => {
            console.error('Error details:', err.message);
          });
        }
        return { status: 'rejected', reason: error.message };
      });
    });

    console.log('All review comments processed.');
    await Promise.allSettled(reviewPromises);
  } catch (error) {
    console.error('Unexpected error:', error.message);
  }
};

(async () => {
  await createReview();
  console.log('---');

  comments.forEach(comment => {
    console.log(`File: ${comment.path}`);
    console.log(`Position: ${comment.line}`);
    console.log(`Comment: ${comment.body}`);
  });
})();
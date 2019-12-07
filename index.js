const core = require('@actions/core');
const github = require('@actions/github');
const { Minimatch } = require('minimatch');

const getPullRequestNumber = () => {
  const pullRequest = github.context.payload.pull_request;
  if (!pullRequest) {
    return undefined;
  }

  return pullRequest.number;
};

const getPullRequestChangedFiles = async (octokit, pullNumber) => {
  const { data } = await octokit.pulls.listFiles({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    pull_number: pullNumber,
  });

  return data.map((v) => v.filename);
};

const getAssignLabels = () => {
  const pullRequest = github.context.payload.pull_request;
  if (!pullRequest) {
    return undefined;
  }

  return pullRequest.labels.map((label) => label.name);
};

const getTargetFiles = async (octokit, configPath) => {
  const { data } = await octokit.repos.getContents({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    path: configPath,
    ref: github.context.sha
  });

  const config = JSON.parse(Buffer.from(data.content, 'base64').toString());

  return config.targets
};

const addLabel = async (octokit, issueNumber, labels) => {
  await octokit.issues.addLabels({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    issue_number: issueNumber,
    labels
  });
};

const removeLabel = async (octokit, issueNumber, name) => {
  await octokit.issues.removeLabel({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    issue_number: issueNumber,
    name
  });
};

const isFileExists = (patterns, files) => {
  for (pattern of patterns) {
    const matcher = new Minimatch(pattern);
    for (file of files) {
      if (matcher.match(file)) {
        return true;
      }
    }
  }

  return false;
};

const run = async () => {
  try {
    const token = core.getInput('github-token');
    const configPath = core.getInput('config-path');

    const pullRequestNumber = getPullRequestNumber();
    const octokit = new github.GitHub(token);

    const changeFiles = await getPullRequestChangedFiles(octokit, pullRequestNumber);
    const assignLabels = getAssignLabels();
    const targetFiles = await getTargetFiles(octokit, configPath);

    for ( { label, patterns } of targetFiles ) {
      if (isFileExists(patterns, changeFiles)) {
        await addLabel(octokit, pullRequestNumber, [label])
      } else if (assignLabels.includes(label)) {
        await removeLabel(octokit, pullRequestNumber, label)
      }
    }
  } catch (error) {
    core.error(error);
    core.setFailed(error.message);
  }
};

run();


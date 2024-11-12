// types.ts
import { Octokit } from '@octokit/rest'

export interface Environment {
	INPUT_TOKEN: string
	INPUT_REPOSITORY: string
	INPUT_PULL_REQUEST_NUMBER: string
	INPUT_SARIF_PATH: string
	INPUT_INITIAL_COMMIT_SHA: string
}

export interface SarifLocation {
	physicalLocation: {
		artifactLocation: {
			uri: string
		}
		region: {
			startLine: number
		}
	}
}

export interface SarifResult {
	locations: SarifLocation[]
	message: {
		text: string
	}
}

export interface SarifData {
	runs: {
		results: SarifResult[]
	}[]
}

export interface ReviewComment {
	body: string
	path: string
	line: number
}

export interface CommentMap {
	[filePath: string]: {
		[line: number]: boolean
	}
}

export interface GithubClient {
	octokit: Octokit
	repoOwner: string
	repoName: string
	prNumber: string
	commitSha: string
}

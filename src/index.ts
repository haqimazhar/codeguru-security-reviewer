// index.ts
import { Environment } from './types/index.js'
import { GitHubReviewClient } from './utils/githubClient.js'
import { SarifParser } from './utils/sarifParser.js'

const validateEnvironment = (): Environment => {
	const requiredEnvVars = [
		'INPUT_TOKEN',
		'INPUT_REPOSITORY',
		'INPUT_PULL_REQUEST_NUMBER',
		'INPUT_INITIAL_COMMIT_SHA'
	]

	for (const envVar of requiredEnvVars) {
		if (!process.env[envVar]) {
			throw new Error(`Missing required environment variable: ${envVar}`)
		}
	}

	return {
		INPUT_TOKEN: process.env.INPUT_TOKEN!,
		INPUT_REPOSITORY: process.env.INPUT_REPOSITORY!,
		INPUT_PULL_REQUEST_NUMBER: process.env.INPUT_PULL_REQUEST_NUMBER!,
		INPUT_SARIF_PATH:
			process.env.INPUT_SARIF_PATH || 'codeguru-security-results.sarif.json',
		INPUT_INITIAL_COMMIT_SHA: process.env.INPUT_INITIAL_COMMIT_SHA!
	}
}

export const createReview = async (): Promise<void> => {
	try {
		const env = validateEnvironment()

		const githubClient = new GitHubReviewClient(
			env.INPUT_TOKEN,
			env.INPUT_REPOSITORY,
			env.INPUT_PULL_REQUEST_NUMBER,
			env.INPUT_INITIAL_COMMIT_SHA
		)

		const sarifParser = new SarifParser(env.INPUT_SARIF_PATH)
		const comments = sarifParser.parse()

		const existingComments = await githubClient.fetchExistingComments()
		console.log(
			`Existing comments: ${JSON.stringify(existingComments, null, 2)}`
		)

		const reviewPromises = comments.map(async comment => {
			const { path: filePath, line } = comment
			console.log(
				`Checking for existing comment on ${filePath} at line ${line}`
			)

			if (existingComments[filePath]?.[line]) {
				console.log(`Skipping duplicate comment on ${filePath} at line ${line}`)
				return
			}

			await githubClient.createReviewComment(comment)
		})

		await Promise.all(reviewPromises)
		console.log('All review comments processed.')

		// Log summary
		comments.forEach(comment => {
			console.log('---')
			console.log(`File: ${comment.path}`)
			console.log(`Position: ${comment.line}`)
			console.log(`Comment: ${comment.body}`)
		})
	} catch (error) {
		console.error('Unexpected error:', error)
		process.exit(1)
	}
}

//void createReview()

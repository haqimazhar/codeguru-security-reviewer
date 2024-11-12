// githubClient.ts
import { Octokit } from '@octokit/rest'
import { CommentMap, ReviewComment, GithubClient } from '../types/index.js'

export class GitHubReviewClient implements GithubClient {
	octokit: Octokit
	repoOwner: string
	repoName: string
	prNumber: string
	commitSha: string

	constructor(
		token: string,
		repository: string,
		prNumber: string,
		commitSha: string
	) {
		this.octokit = new Octokit({ auth: token })
		;[this.repoOwner, this.repoName] = repository.split('/')
		this.prNumber = prNumber
		this.commitSha = commitSha
	}

	async fetchExistingComments(): Promise<CommentMap> {
		const { data: existingComments } =
			await this.octokit.pulls.listReviewComments({
				owner: this.repoOwner,
				repo: this.repoName,
				pull_number: parseInt(this.prNumber)
			})

		const commentMap: CommentMap = {}
		existingComments.forEach(comment => {
			const filePath = comment.path
			const line = comment.line
			if (filePath && line) {
				if (!commentMap[filePath]) {
					commentMap[filePath] = {}
				}
				commentMap[filePath][line] = true
			}
		})

		return commentMap
	}

	async createReviewComment(comment: ReviewComment): Promise<void> {
		try {
			await this.octokit.pulls.createReview({
				owner: this.repoOwner,
				repo: this.repoName,
				pull_number: parseInt(this.prNumber),
				commit_id: this.commitSha,
				body: '🔍 Codeguru Security Review 🔍',
				event: 'COMMENT',
				comments: [
					{
						path: comment.path,
						body: `🚨 ${comment.body}`,
						line: comment.line
					}
				],
				headers: {
					'X-GitHub-Api-Version': '2022-11-28'
				}
			})
			console.log(
				`Review comment created successfully for ${comment.path} at line ${comment.line}`
			)
		} catch (error) {
			console.error(
				`Error creating review comment for ${comment.path} at line ${comment.line}:`,
				error
			)
			throw error
		}
	}
}
